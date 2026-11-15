import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import Dexie from 'dexie';
import { CoCoDatabase } from '../../src/db/schema';
import { exportLocalBackup, importCloudBackup, parseLocalBackup, prepareCloudImport,
  type CloudImportPayload, type ImportResult } from '../../src/cloud/transfer';

let database: CoCoDatabase;
const exportedAt = '2026-11-15T11:00:00Z';
beforeEach(async () => {
  database = new CoCoDatabase(`cloud-transfer-${crypto.randomUUID()}`); await database.open();
  await database.nhanVien.add({ MaNV: 'NV1', HoTen: 'Chủ local', SoDienThoai: '0900000001' });
  await database.taiKhoan.add({ TenDangNhap: 'owner', MaNV: 'NV1' });
  await database.accountSecurity.add({ TenDangNhap: 'owner', role: 'owner', active: true, passwordHash: 'a'.repeat(64),
    passwordSalt: 'b'.repeat(32), algorithm: 'PBKDF2-SHA-256', iterations: 600_000 });
  await database.authSessions.add({ tokenHash: 'c'.repeat(64), username: 'owner', employeeId: 'NV1', securityVersion: 1,
    roleAtIssue: 'owner', createdAt: exportedAt });
  await database.khachHang.add({ MaKH: 'KH1', TenKH: 'Khách legacy', SoDienThoaiKH: '0900000002', DiemTichLuy: 7 });
  await database.appMetadata.bulkAdd([
    { key: 'application', value: 'CoCo' }, { key: 'auth:bootstrap-completed', value: exportedAt },
    { key: 'discount-lock', value: JSON.stringify({ runId: 'old-run', expiresAt: exportedAt }) },
  ]);
});
afterEach(async () => { vi.restoreAllMocks(); await database.delete(); });

const snapshot = () => database.transaction('r', database.tables, async () => Object.fromEntries(
  await Promise.all(database.tables.map(async table => [table.name, await table.toArray()] as const))));
function resultFor(payload: CloudImportPayload): ImportResult {
  return { batchId: 'batch-1', status: 'committed', counts: Object.entries(payload.stores).map(([store, rows]) =>
    ({ store, expected: rows.length, inserted: rows.length, existing: 0, errors: [] })) };
}

it('exports every local store consistently, retaining private credentials only in the private backup, without writes', async () => {
  const before = await snapshot(), backup = await exportLocalBackup(database, () => exportedAt);
  expect(Object.keys(backup.stores).sort()).toEqual(database.tables.map(table => table.name).sort());
  expect(backup.stores).toEqual(before); expect(backup.schemaVersion).toBe(4); expect(backup.exportedAt).toBe(exportedAt);
  expect(backup.stores.accountSecurity[0].passwordHash).toBe('a'.repeat(64));
  expect(await parseLocalBackup(JSON.stringify(backup))).toEqual(backup);
  expect(await snapshot()).toEqual(before);
});

it('cloud payload excludes credential stores and local auth/lease markers, preserves business keys/points and FK order', async () => {
  const backup = await exportLocalBackup(database, () => exportedAt), before = structuredClone(backup);
  const { payload, excluded } = prepareCloudImport(backup);
  expect(payload.stores.accountSecurity).toBeUndefined(); expect(payload.stores.authSessions).toBeUndefined();
  expect(JSON.stringify(payload)).not.toContain('passwordHash'); expect(JSON.stringify(payload)).not.toContain('tokenHash');
  expect(payload.stores.taiKhoan).toEqual([{ TenDangNhap: 'owner', MaNV: 'NV1' }]);
  expect(payload.stores.khachHang).toEqual(backup.stores.khachHang);
  expect(payload.stores.appMetadata).toEqual([{ key: 'application', value: 'CoCo' }]);
  const order = Object.keys(payload.stores);
  expect(order.indexOf('nhanVien')).toBeLessThan(order.indexOf('taiKhoan'));
  expect(order.indexOf('hoaDonThuMua')).toBeLessThan(order.indexOf('sanPham'));
  expect(order.indexOf('sanPham')).toBeLessThan(order.indexOf('productCosts'));
  expect(excluded.map(row => [row.store, row.count])).toEqual([['accountSecurity', 1], ['authSessions', 1], ['appMetadata', 2]]);
  expect(payload.stores.hoaDonThuMua).toEqual([]); expect(payload.stores.memberships).toEqual([]);
  expect(backup).toEqual(before);
});

it('backs up a closed legacy schema without upgrading it or creating a missing database', async () => {
  const name = `legacy-transfer-${crypto.randomUUID()}`, legacy = new Dexie(name);
  legacy.version(1).stores({ appMetadata: '&key' }); await legacy.open();
  await legacy.table('appMetadata').add({ key: 'legacy', value: 'unchanged' }); legacy.close();
  try {
    const backup = await exportLocalBackup(new CoCoDatabase(name), () => exportedAt);
    expect(backup.schemaVersion).toBe(1); expect(Object.keys(backup.stores)).toEqual(['appMetadata']);
    const inspect = new Dexie(name); await inspect.open(); expect(inspect.verno).toBe(1);
    expect(await inspect.table('appMetadata').toArray()).toEqual([{ key: 'legacy', value: 'unchanged' }]); inspect.close();
  } finally { await Dexie.delete(name); }
  const absent = `absent-transfer-${crypto.randomUUID()}`;
  await expect(exportLocalBackup(new CoCoDatabase(absent), () => exportedAt)).rejects.toThrow();
  expect(await Dexie.exists(absent)).toBe(false);
});

it('rejects changed JSON content/hash and unreviewed stores before contacting the server', async () => {
  const backup = await exportLocalBackup(database, () => exportedAt);
  backup.stores.khachHang[0].DiemTichLuy = 5000;
  await expect(parseLocalBackup(JSON.stringify(backup))).rejects.toThrow('Hash backup không khớp');
  backup.stores.unknown = [];
  await expect(parseLocalBackup(JSON.stringify(backup))).rejects.toThrow('Store chưa được đối chiếu');
  await expect(parseLocalBackup('{')).rejects.toThrow('không phải JSON');
  await expect(parseLocalBackup(JSON.stringify({ ...backup, schemaVersion: 999 }))).rejects.toThrow('không được hỗ trợ');
});

it('does not send nested credential material disguised as metadata', async () => {
  await database.appMetadata.add({ key: 'custom', value: JSON.stringify({ nested: { refresh_token: 'private' } }) });
  const backup = await exportLocalBackup(database, () => exportedAt);
  expect(() => prepareCloudImport(backup)).toThrow('chứa thông tin xác thực');
});

it('uses an unchanged idempotency key for the same backup and verifies server counts without modifying IndexedDB', async () => {
  const before = await snapshot(), backup = await exportLocalBackup(database, () => exportedAt);
  const raw = JSON.stringify(backup), rpc = vi.fn(async (_name: string, args: { p_backup: CloudImportPayload }) =>
    ({ data: resultFor(args.p_backup), error: null }));
  const first = await importCloudBackup({ rpc }, raw, () => true);
  await importCloudBackup({ rpc }, raw, () => true);
  expect(first.result.status).toBe('committed'); expect(rpc).toHaveBeenCalledTimes(2);
  expect(rpc.mock.calls[0]).toEqual(rpc.mock.calls[1]);
  expect(rpc.mock.calls[0][0]).toBe('coco_import');
  expect(rpc.mock.calls[0][1]).toHaveProperty('p_idempotency_key', `import:${backup.sha256}`);
  expect(await snapshot()).toEqual(before);
});

it('blocks offline import before invoking RPC', async () => {
  const rpc = vi.fn(); await expect(importCloudBackup({ rpc }, '{}', () => false)).rejects.toThrow('mất mạng');
  expect(rpc).not.toHaveBeenCalled();
});

it('reports a server FK/conflict/permission rejection without claiming success or writing locally', async () => {
  const before = await snapshot(), backup = await exportLocalBackup(database, () => exportedAt);
  const rpc = vi.fn(async () => ({ data: null, error: { message: 'Owner required / foreign key conflict' } }));
  await expect(importCloudBackup({ rpc }, JSON.stringify(backup), () => true)).rejects.toThrow('Không nhập dữ liệu: Owner required');
  expect(await snapshot()).toEqual(before);
});

it.each(['missing', 'counts', 'duplicate', 'errors'] as const)('does not trust malformed or inconsistent server reconciliation: %s', async kind => {
  const backup = await exportLocalBackup(database, () => exportedAt), { payload } = prepareCloudImport(backup), data = resultFor(payload);
  if (kind === 'missing') data.counts.pop();
  if (kind === 'counts') data.counts[0].inserted++;
  if (kind === 'duplicate') data.counts[1] = data.counts[0];
  if (kind === 'errors') data.counts[0].errors.push('failed row');
  await expect(importCloudBackup({ rpc: async () => ({ data, error: null }) }, JSON.stringify(backup), () => true)).rejects.toThrow('đối soát');
});
