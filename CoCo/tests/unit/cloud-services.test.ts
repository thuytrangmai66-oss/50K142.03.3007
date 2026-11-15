import { afterEach, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AuthUser } from '../../src/domain/auth';
import { CLOUD_STORE_KEYS, createSnapshotDatabase } from '../../src/cloud/repository';
import { createCloudServices, CloudOfflineError, cloudServiceError } from '../../src/cloud/services';
import type { CloudSnapshot } from '../../src/cloud/contracts';
import { AuthError } from '../../src/services/auth/errors';
import { RepositoryError } from '../../src/repositories/errors';
import { recordVersionKey } from '../../src/repositories';
import { CoCoDatabase } from '../../src/db/schema';
import { installFinalizedPurchaseGraph } from '../fixtures/purchase-finalized-graph';
import { purchaseCostReport } from '../../src/services/purchase-report';
import { reportPeriod } from '../../src/lib/vietnam-time';

const owner: AuthUser = { username: 'owner', employeeId: 'NV000001', displayName: 'Chủ cloud', role: 'owner' };
function snapshot(): CloudSnapshot {
  const result: CloudSnapshot = Object.fromEntries(Object.keys(CLOUD_STORE_KEYS).map(name => [name, []]));
  result.nhanVien = [{ MaNV: owner.employeeId, HoTen: owner.displayName, SoDienThoai: '0900000001' }];
  result.taiKhoan = [{ TenDangNhap: owner.username, MaNV: owner.employeeId }];
  result.khachHang = [{ MaKH: 'KH000001', TenKH: 'Khách cloud', SoDienThoaiKH: '0900000002', DiemTichLuy: 0 }];
  result.recordVersions = [{ key: recordVersionKey('khachHang', 'KH000001'), version: 3, updatedAt: '2026-11-15T00:00:00Z' }];
  return result;
}
function setup(user: AuthUser = owner) {
  const data = snapshot(), rpc = vi.fn(async (name: string) => ({ data: name === 'coco_snapshot' ? data : { duplicate: false }, error: null }));
  const invoke = vi.fn(async () => ({ data: 'NV000002', error: null }));
  const listeners = new Set<() => void>(), invalidate = vi.fn();
  const services = createCloudServices({ rpc, functions: { invoke } } as unknown as SupabaseClient, {
    currentUser: () => user,
    subscribe: callback => { listeners.add(callback); return () => { listeners.delete(callback); }; }, invalidate,
  });
  return { services, data, rpc, invoke, invalidate, notify: () => listeners.forEach(callback => callback()) };
}
afterEach(() => { vi.restoreAllMocks(); });

it('cloud customer/approval/report projections reuse approved logic without opening IndexedDB', async () => {
  const { services, rpc } = setup();
  const open = vi.spyOn(indexedDB, 'open');
  const customers = await services.referenceData.customers('090', 1);
  expect(customers.total).toBe(1); expect(customers.rows[0].record.TenKH).toBe('Khách cloud'); expect(customers.rows[0].version).toBe(3);
  expect((await services.approvals.listRequests({ status: 'all', draftId: '' }, 1)).total).toBe(0);
  const revenue = await services.reports.revenue({ kind: 'day', value: '2026-11-15' });
  expect(revenue.summary.invoiceCount).toBe(0);
  expect(open).not.toHaveBeenCalled(); expect(rpc).toHaveBeenCalledTimes(1);
});

it('SQL snapshot shape preserves verified multi-price purchase reporting and excludes legacy without evidence', async () => {
  const db = new CoCoDatabase(`CloudReadParity-${crypto.randomUUID()}`);
  try {
    await db.nhanVien.put({ MaNV: owner.employeeId, HoTen: owner.displayName, SoDienThoai: '0900000001' });
    await db.taiKhoan.put({ TenDangNhap: owner.username, MaNV: owner.employeeId });
    await installFinalizedPurchaseGraph(db, { employeeId: owner.employeeId, createdBy: owner.username, ownerId: owner.employeeId });
    const at = '2026-11-11T01:00:00Z', id = 'purchase-finalize:graph-operation';
    await db.hoaDonThuMua.update('TMGRAPH', { TrangThai: 1 });
    await db.sanPham.toCollection().modify({ TrangThai: 1 });
    await db.appMetadata.put({ key: 'purchase-status-mapping:TMGRAPH', value: JSON.stringify({ invoiceCompleted: 1, productAvailable: 1, productSold: 2 }) });
    await db.operations.put({ id, fingerprint: '1'.repeat(64), executedAt: at });
    await db.auditEntries.put({ id, actor: owner.username, executedAt: at, changed: ['purchaseDrafts:DGRAPH', 'hoaDonThuMua:TMGRAPH', 'purchaseFinalizations:TMGRAPH'] });
    await db.hoaDonThuMua.put({ MaHDTM: 'TMOLD', NgayThuMua: at, TongTienTM: 99999, TrangThai: 1, MaKH: 'KHGRAPH', MaNV: owner.employeeId });
    const stores: CloudSnapshot = Object.fromEntries(await Promise.all(db.tables.map(async table => [table.name, await table.toArray()])));
    // Matches coco_snapshot(): arrays directly, no {stores,versions,profiles}
    // wrapper and no credential hashes or local Auth sessions.
    stores.accountSecurity = [{ TenDangNhap: owner.username, role: 'owner', active: true }];
    stores.authSessions = [];
    const rpc = vi.fn(async () => ({ data: stores, error: null }));
    const services = createCloudServices({ rpc } as unknown as SupabaseClient, { currentUser: () => owner, subscribe: () => () => undefined, invalidate: () => undefined });
    const input = { kind: 'day' as const, value: '2026-11-11' };
    const local = await purchaseCostReport(db, reportPeriod(input)), cloud = await services.reports.purchaseCost(input);
    expect(local.summary).toMatchObject({ invoiceCount: 1, productCount: 2, totalCost: 200001 });
    expect(cloud).toEqual(local);
    expect(cloud.classifications.find(row => row.invoiceId === 'TMOLD')?.verification).toBe('UNVERIFIED');
  } finally { await db.delete(); }
});

it('the snapshot read port copies returned rows and rejects every write transaction/mutation', async () => {
  const data = snapshot(), db = createSnapshotDatabase(data, owner);
  const customer = await db.khachHang.get('KH000001'); customer!.TenKH = 'Changed locally';
  expect((await db.khachHang.get('KH000001'))!.TenKH).toBe('Khách cloud');
  await expect(db.transaction('rw', db.khachHang, async () => undefined)).rejects.toMatchObject({ code: 'IMMUTABLE' });
  expect(() => db.khachHang.put(customer!)).toThrow(RepositoryError);
  expect(data.khachHang).toEqual(snapshot().khachHang);
});

it('malformed/incomplete snapshots fail closed rather than manufacture an empty dataset', async () => {
  const data = snapshot(); delete data.khachHang;
  expect(() => createSnapshotDatabase(data, owner)).toThrow(/Malformed cloud store khachHang/);
});

it('projection permission guards remain and staff cannot call financial report projection', async () => {
  const { services } = setup({ ...owner, role: 'staff' });
  await expect(services.reports.revenue({ kind: 'day', value: '2026-11-15' })).rejects.toEqual(new AuthError('FORBIDDEN'));
  await expect(services.dashboard.ownerSummary()).rejects.toEqual(new AuthError('FORBIDDEN'));
});

it('critical writes call only RPC, preserve operation identity on retry and invalidate reads after commit', async () => {
  const { services, rpc, invalidate } = setup();
  const command = { operationId: 'sale-operation-1', draftId: 'D0000001', expectedRevision: 1, customerId: 'KH000001', method: 'cash' as const, quote: {} };
  rpc.mockResolvedValueOnce({ data: null as never, error: { code: 'CONFLICT', message: 'CONFLICT: stale' } as never });
  await expect(services.salesPayments.finalize(command as never)).rejects.toMatchObject({ code: 'CONFLICT' });
  rpc.mockResolvedValueOnce({ data: { invoiceId: 'BH000001', duplicate: true } as never, error: null });
  await services.salesPayments.finalize(command as never);
  expect(rpc.mock.calls.map(call => call[0])).toEqual(['coco_service', 'coco_service']);
  const calls = vi.mocked(rpc).mock.calls as unknown as [string, Record<string, unknown>][];
  expect(calls[0][1]).toMatchObject({ p_service: 'salesPayments', p_method: 'finalize', p_idempotency_key: 'sale-operation-1', p_payload: { args: [command] } });
  expect(calls[1][1].p_idempotency_key).toBe(calls[0][1].p_idempotency_key); expect(invalidate).toHaveBeenCalledOnce();
});

it('CRUD lost-response retry retains its generated idempotency key', async () => {
  const { services, rpc } = setup();
  rpc.mockResolvedValueOnce({ data: null as never, error: { message: 'network unavailable' } as never });
  const input = { name: 'Khách mới', phone: '0900000003' };
  await expect(services.referenceData.createCustomer(input)).rejects.toThrow();
  rpc.mockResolvedValueOnce({ data: 'KH000002' as never, error: null });
  await services.referenceData.createCustomer(input);
  const calls = vi.mocked(rpc).mock.calls as unknown as [string, Record<string, unknown>][];
  expect(calls[1][1].p_idempotency_key).toBe(calls[0][1].p_idempotency_key);
});

it('realtime invalidates the in-memory snapshot and unsubscribe removes its listener', async () => {
  const { services, rpc, notify } = setup(), changed = vi.fn();
  const stop = services.referenceData.subscribe(changed);
  await services.referenceData.customer('KH000001'); notify(); await services.referenceData.customer('KH000001');
  expect(rpc).toHaveBeenCalledTimes(2); expect(changed).toHaveBeenCalledOnce();
  stop(); notify(); expect(changed).toHaveBeenCalledOnce();
});

it('offline writes never contact RPC or staff-admin; staff credentials go to Edge only', async () => {
  const { services, rpc, invoke } = setup();
  const online = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
  await expect(services.inventory.update({ operationId: 'edit' } as never)).rejects.toBeInstanceOf(CloudOfflineError);
  expect(rpc).not.toHaveBeenCalled(); online.mockReturnValue(true);
  await services.staffAccounts.create({ name: 'Nhân viên', phone: '0900000003', username: 'staff03', password: 'long-password' });
  expect(invoke).toHaveBeenCalledWith('staff-admin', expect.objectContaining({ body: expect.objectContaining({ method: 'create' }) }));
  expect(rpc).not.toHaveBeenCalled();
});

it('server concurrency and permission errors retain UI error semantics', () => {
  expect(cloudServiceError('approvals', { code: 'P0001', message: 'CONFLICT: stale revision' })).toBeInstanceOf(RepositoryError);
  expect(cloudServiceError('salesPayments', { code: '42501', message: 'permission denied' })).toEqual(new AuthError('FORBIDDEN'));
  expect(cloudServiceError('referenceData', { message: 'VALIDATION: check fields', details: JSON.stringify({ fields: { phone: 'Invalid phone' } }) })).toMatchObject({ code: 'VALIDATION', fields: { phone: 'Invalid phone' } });
});
