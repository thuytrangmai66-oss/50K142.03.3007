import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { CoCoDatabase } from '../../src/db/schema';
import { AuthService } from '../../src/services/auth/service';
import { LocalReferenceData } from '../../src/services/reference-data/local';
import { CoCoRepository } from '../../src/repositories';
import { customerCreationEffect, customerCreationKey, customerCreationReport } from '../../src/services/customer-creation';
import { reportPeriod } from '../../src/lib/vietnam-time';

let db: CoCoDatabase, auth: AuthService, token: string, reference: LocalReferenceData;
const input = { name: 'Khách mới', phone: '0900000002' };
const day = (value = '2026-11-14') => reportPeriod({ kind: 'day', value });
const rows = () => db.transaction('r', db.tables, () => Promise.all(db.tables.map(table => table.toArray())));
beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-11-14T00:00:00+07:00'));
  db = new CoCoDatabase('G9CustomerCreationTests'); auth = new AuthService(db);
  await auth.bootstrap({ username: 'owner', password: 'customer-test!', fullName: 'Chủ', phone: '0900000001' });
  token = (await auth.login('owner', 'customer-test!')).token;
  reference = new LocalReferenceData(db, () => token);
});
afterEach(async () => { vi.restoreAllMocks(); await db.delete(); vi.useRealTimers(); });

it('M01-B records creation at Vietnam midnight with matching receipt/audit, survives reload and never mutates on read', async () => {
  const id = await reference.createCustomer(input), marker = JSON.parse((await db.appMetadata.get(customerCreationKey(id)))!.value);
  expect(marker).toMatchObject({ format: 'customer-creation-v1', customerId: id, createdBy: 'owner',
    createdAt: '2026-11-13T17:00:00.000Z', source: 'customer-create' });
  expect((await db.operations.get(marker.operationId))?.executedAt).toBe(marker.createdAt);
  const before = await rows();
  expect((await customerCreationReport(db, day())).newCustomerCount).toBe(1);
  expect((await customerCreationReport(db, day('2026-11-13'))).newCustomerCount).toBe(0);
  db.close(); await db.open();
  expect((await customerCreationReport(db, day())).newCustomerCount).toBe(1);
  expect(await rows()).toEqual(before); expect(db.verno).toBe(4);
});
it('M01-B keeps the original creation day on profile edits and removes the marker with a legitimate deletion', async () => {
  const id = await reference.createCustomer(input), original = await db.appMetadata.get(customerCreationKey(id));
  const first = await reference.customer(id);
  await reference.updateCustomer(id, first.version, { name: 'Tên mới', phone: '0900000003' });
  expect(await db.appMetadata.get(customerCreationKey(id))).toEqual(original);
  await expect(reference.deleteCustomer(id, first.version, true)).rejects.toMatchObject({ code: 'CONFLICT' });
  expect(await db.appMetadata.get(customerCreationKey(id))).toEqual(original);
  await reference.deleteCustomer(id, (await reference.customer(id)).version, true);
  expect(await db.khachHang.get(id)).toBeUndefined(); expect(await db.appMetadata.get(customerCreationKey(id))).toBeUndefined();
  expect((await customerCreationReport(db, day())).newCustomerCount).toBe(0);
});
it.each(['audit', 'metadata'])('M01-B rolls the entire create back on %s failure', async kind => {
  const before = await rows();
  if (kind === 'audit') vi.spyOn(db.auditEntries, 'add').mockRejectedValueOnce(new Error('audit fault'));
  else vi.spyOn(db.appMetadata, 'add').mockRejectedValueOnce(new Error('metadata fault'));
  await expect(reference.createCustomer(input)).rejects.toThrow('fault');
  expect(await rows()).toEqual(before);
});
it('M01-B rolls a deletion back when removing its marker fails', async () => {
  const id = await reference.createCustomer(input), before = await rows();
  vi.spyOn(db.appMetadata, 'delete').mockRejectedValueOnce(new Error('delete marker fault'));
  await expect(reference.deleteCustomer(id, (await reference.customer(id)).version, true)).rejects.toThrow('delete marker fault');
  expect(await rows()).toEqual(before);
});
it('M01-B serializes duplicate-phone creates across connections, creating one profile and one marker', async () => {
  const other = new CoCoDatabase(db.name);
  try {
    const results = await Promise.allSettled([reference.createCustomer(input), new LocalReferenceData(other, () => token).createCustomer(input)]);
    expect(results.filter(row => row.status === 'fulfilled')).toHaveLength(1);
    expect(await db.khachHang.count()).toBe(1);
    expect(await db.appMetadata.where('key').startsWith('customer-creation:').count()).toBe(1);
    expect((await customerCreationReport(db, day())).newCustomerCount).toBe(1);
  } finally { other.close(); }
});
it('M01-B runs the command effect once, returns the original time on replay, and rechecks authorization', async () => {
  const id = 'KHREPLAY', command = { id: 'reference:replay', changes: [{ table: 'khachHang' as const, kind: 'create' as const,
    value: { MaKH: id, TenKH: input.name, SoDienThoaiKH: input.phone, DiemTichLuy: 0 } }] };
  const effect = vi.fn(customerCreationEffect(db, id));
  const first = await auth.commitAuthorized(token, 'customers.create', command, undefined, effect), before = await rows();
  expect(await auth.commitAuthorized(token, 'customers.create', command, undefined, effect)).toEqual({ ...first, duplicate: true });
  expect(effect).toHaveBeenCalledTimes(1); expect(await rows()).toEqual(before);
  await auth.logout(token);
  await expect(auth.commitAuthorized(token, 'customers.create', command, undefined, effect)).rejects.toMatchObject({ code: 'AUTH_REQUIRED' });
  expect(effect).toHaveBeenCalledTimes(1);
});
it.each(['absent', 'invalid-json', 'wrong-id', 'missing-receipt', 'wrong-actor', 'wrong-time', 'missing-audit'])('M01-B excludes %s evidence without backfill or writes', async kind => {
  const id = await reference.createCustomer(input), key = customerCreationKey(id);
  const stored = (await db.appMetadata.get(key))!, marker = JSON.parse(stored.value);
  if (kind === 'absent') await db.appMetadata.delete(key);
  if (kind === 'invalid-json') await db.appMetadata.put({ key, value: '{' });
  if (kind === 'wrong-id') await db.appMetadata.put({ key, value: JSON.stringify({ ...marker, customerId: 'KHWRONG' }) });
  if (kind === 'missing-receipt') await db.operations.delete(marker.operationId);
  if (kind === 'wrong-actor') await db.auditEntries.update(marker.operationId, { actor: 'other' });
  if (kind === 'wrong-time') await db.appMetadata.put({ key, value: JSON.stringify({ ...marker, createdAt: '2026-11-14T01:00:00+07:00' }) });
  if (kind === 'missing-audit') await db.auditEntries.delete(marker.operationId);
  const before = await rows(), report = await customerCreationReport(db, day());
  expect(report.newCustomerCount).toBe(0); expect(report.coverage.unverifiedRecords).toBe(1);
  expect(await rows()).toEqual(before);
});
it('M01-B leaves imported/legacy profiles without creation dates after reopen', async () => {
  await new CoCoRepository(db).commit({ id: 'legacy-import', changes: [{ table: 'khachHang', kind: 'create',
    value: { MaKH: 'KHLEGACY', TenKH: 'Legacy', SoDienThoaiKH: input.phone, DiemTichLuy: 20 } }] });
  const before = await rows(); db.close(); await db.open();
  expect((await customerCreationReport(db, day())).coverage.unverifiedRecords).toBe(1);
  expect(await db.appMetadata.get(customerCreationKey('KHLEGACY'))).toBeUndefined(); expect(await rows()).toEqual(before);
});
it('M01-B propagates storage faults instead of returning a false zero', async () => {
  await reference.createCustomer(input);
  vi.spyOn(db.appMetadata, 'get').mockRejectedValueOnce(new DOMException('read fault', 'UnknownError'));
  await expect(customerCreationReport(db, day())).rejects.toThrow('read fault');
});
