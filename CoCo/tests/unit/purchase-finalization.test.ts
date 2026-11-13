import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { CoCoDatabase } from '../../src/db/schema';
import { AuthService } from '../../src/services/auth/service';
import { LocalReferenceData } from '../../src/services/reference-data/local';
import { PurchaseDraftService } from '../../src/services/purchase-drafts';
import { PurchaseApprovalService } from '../../src/services/purchase-approvals';
import { PurchaseFinalizationService, type FinalizePurchaseCommand } from '../../src/services/purchase-finalization';
import { StaffAccountsService } from '../../src/services/staff-accounts';
import { readCandidatePurchase } from '../../src/services/purchase-candidate';
import { recordVersionKey } from '../../src/repositories';
import { PURCHASE_STATUS_MAPPING } from '../../src/domain/purchase-status';

const testMapping = PURCHASE_STATUS_MAPPING;
let db: CoCoDatabase, auth: AuthService, token: string;
let drafts: PurchaseDraftService, approvals: PurchaseApprovalService, finalizer: PurchaseFinalizationService;
let reference: LocalReferenceData;
beforeEach(async () => {
  db = new CoCoDatabase('T05FinalizeTests'); auth = new AuthService(db);
  await auth.bootstrap({ username: 'owner', password: 'finalize-test!', fullName: 'Chủ', phone: '0900000001' });
  token = (await auth.login('owner', 'finalize-test!')).token;
  drafts = new PurchaseDraftService(db, () => token);
  approvals = new PurchaseApprovalService(db, () => token);
  finalizer = new PurchaseFinalizationService(db, () => token, testMapping);
  reference = new LocalReferenceData(db, () => token);
  await reference.createBracket({ productType: 'Áo', brand: 'CoCo', condition: '2', min: '50000', max: '100000' });
});
afterEach(async () => { vi.restoreAllMocks(); await db.delete(); });

async function ready(quantity = 1, price = '80001') {
  const bundle = await drafts.prepareDraft();
  const match = await drafts.findBracket({ type: 'Áo', brand: 'CoCo', condition: '2', quantity: String(quantity) });
  await drafts.commit(await drafts.prepareAdd(bundle, match.bracket, quantity, price));
  const customerId = await reference.createCustomer({ name: 'Khách thật', phone: '0900000002' });
  const saved = await drafts.load(bundle.draft.id);
  await drafts.commit({ operationId: crypto.randomUUID(), expectedRevision: saved.draft.revision,
    draft: { ...saved.draft, customerId, revision: saved.draft.revision + 1 }, lines: saved.lines, approvals: saved.approvals });
  const current = await drafts.load(bundle.draft.id);
  return { current, command: { operationId: crypto.randomUUID(), draftId: current.draft.id, expectedRevision: current.draft.revision } };
}
async function databaseSnapshot() {
  return Object.fromEntries(await Promise.all(db.tables.map(async table => [table.name, await table.toArray()])));
}

it('finalizes real mixed prices without merging cost and preserves legacy data', async () => {
  const { current } = await ready();
  const [bracket] = await drafts.catalog();
  await drafts.commit(await drafts.prepareAdd(current, bracket, 1, '120000'));
  const pending = await drafts.load(current.draft.id), request = pending.approvals[0];
  await approvals.decide({ operationId: crypto.randomUUID(), approvalId: request.id, expectedRevision: request.revision, action: 'approve' });
  const bundle = await drafts.load(current.draft.id);
  await db.hoaDonThuMua.add({ MaHDTM: 'TMOLD', NgayThuMua: '2026-11-01T00:00:00Z', TongTienTM: 1, TrangThai: 90, MaNV: bundle.draft.employeeId, MaKH: bundle.draft.customerId! });
  const legacy = await db.hoaDonThuMua.get('TMOLD');
  const result = await finalizer.finalize({ operationId: crypto.randomUUID(), draftId: bundle.draft.id, expectedRevision: bundle.draft.revision });
  const snapshot = await db.table('purchaseFinalizations').get(result.invoiceId);
  expect(snapshot).toMatchObject({ subtotal: 200001, paidTotal: 200001, paidAt: snapshot.finalizedAt });
  expect(snapshot.lines.map((line: { unitCost: number }) => line.unitCost)).toEqual([80001, 120000]);
  expect(await db.hoaDonThuMua.get(result.invoiceId)).toMatchObject({ TongTienTM: 200001, TrangThai: 1 });
  expect((await db.sanPham.toArray()).map(item => item.GiaBanHienHanh).sort((a, b) => a - b)).toEqual([104001, 156000]);
  expect((await db.productCosts.toArray()).map(item => item.unitCost).sort((a, b) => a - b)).toEqual([80001, 120000]);
  expect(await db.table('purchaseProvenance').count()).toBe(2);
  expect(await db.chiTietHoaDonTM.count()).toBe(0);
  expect(await db.issuedIdentifiers.count()).toBe(3);
  expect(await db.recordVersions.get(recordVersionKey('hoaDonThuMua', result.invoiceId))).toMatchObject({ version: 1 });
  expect(JSON.parse((await db.appMetadata.get(`purchase-status-mapping:${result.invoiceId}`))!.value)).toEqual(testMapping);
  expect((await readCandidatePurchase(db, result.invoiceId))?.source).toBe('purchase-lines-v1');
  const invoiceView = await reference.invoice(bundle.draft.customerId!, 'sales', result.invoiceId);
  expect(invoiceView.lines.map(line => line.unitPrice)).toEqual([80001, 120000]);
  expect(invoiceView.total).toBe(200001);
  expect(await db.hoaDonThuMua.get('TMOLD')).toEqual(legacy);
});

it('issues one product per item, rounds initial price half up and uses Vietnam dates', async () => {
  const { command } = await ready(3, '80005');
  const result = await finalizer.finalize(command), products = await db.sanPham.toArray();
  const snapshot = await db.table('purchaseFinalizations').get(result.invoiceId);
  const date = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(snapshot.finalizedAt));
  expect(products).toHaveLength(3); expect(new Set(products.map(row => row.MaSP)).size).toBe(3);
  for (const product of products) expect(product).toMatchObject({ GiaBanHienHanh: 104007, GiaGocChuKyGiam: 104007, TrangThai: 1, NgayNhapKho: date, NgayBatDauChuKyGiam: date });
  expect(snapshot.subtotal).toBe(240015);
});

it('retries a committed operation once and rejects another finalize command or payload', async () => {
  const { command } = await ready(), first = await finalizer.finalize(command), before = await databaseSnapshot();
  expect(await finalizer.finalize(command)).toEqual({ ...first, duplicate: true });
  const laterMapping = new PurchaseFinalizationService(db, () => token, { invoiceCompleted: 230, productAvailable: 231, productSold: 232 });
  expect(await laterMapping.finalize(command)).toEqual({ ...first, duplicate: true });
  expect(await databaseSnapshot()).toEqual(before);
  await expect(finalizer.finalize({ ...command, operationId: crypto.randomUUID() })).rejects.toMatchObject({ code: 'CONFLICT' });
  await expect(finalizer.finalize({ ...command, expectedRevision: command.expectedRevision + 1 })).rejects.toMatchObject({ code: 'OPERATION_REUSED' });
});

it('serializes two tabs finalizing the same revision', async () => {
  const { command } = await ready();
  const secondDb = new CoCoDatabase(db.name), second = new PurchaseFinalizationService(secondDb, () => token, testMapping);
  try {
    const results = await Promise.allSettled([finalizer.finalize(command), second.finalize({ ...command, operationId: crypto.randomUUID() })]);
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(await db.hoaDonThuMua.count()).toBe(1); expect(await db.sanPham.count()).toBe(1);
  } finally { secondDb.close(); }
});

it.each(['pending', 'rejected', 'missing-customer', 'empty', 'cancelled', 'stale'] as const)('blocks %s before creating invoice or products', async mode => {
  const { command, current } = await ready(1, ['pending', 'rejected'].includes(mode) ? '120000' : '80001');
  if (mode === 'rejected') await approvals.decide({ operationId: crypto.randomUUID(), approvalId: current.approvals[0].id, expectedRevision: 1, action: 'reject', reason: 'Giá cao' });
  if (mode === 'missing-customer') await db.table('purchaseDrafts').update(current.draft.id, { customerId: undefined });
  if (mode === 'empty') await db.table('purchaseLines').update(current.lines[0].id, { removedAt: new Date().toISOString() });
  if (mode === 'cancelled') await drafts.removeOrCancel(current, crypto.randomUUID());
  const before = await databaseSnapshot();
  await expect(finalizer.finalize(mode === 'stale' ? { ...command, expectedRevision: command.expectedRevision + 1 } : command)).rejects.toThrow();
  expect(await databaseSnapshot()).toEqual(before);
});

it.each(['hoaDonThuMua', 'sanPham', 'productCosts', 'purchaseProvenance', 'purchaseFinalizations', 'auditEntries', 'issuedIdentifiers', 'recordVersions'])('rolls back all stores when %s add fails, then safely retries', async store => {
  const { command } = await ready(), before = await databaseSnapshot();
  const table = ['hoaDonThuMua', 'sanPham', 'productCosts', 'auditEntries', 'issuedIdentifiers', 'recordVersions'].includes(store)
    ? (db as unknown as Record<string, typeof db.auditEntries>)[store] : db.table(store);
  vi.spyOn(table, 'add').mockRejectedValueOnce(new Error('T05 write failure'));
  await expect(finalizer.finalize(command)).rejects.toThrow('T05 write failure');
  expect(await databaseSnapshot()).toEqual(before);
  expect((await finalizer.finalize(command)).duplicate).toBe(false);
  expect(await db.hoaDonThuMua.count()).toBe(1); expect(await db.sanPham.count()).toBe(1);
});

it('rejects a foreign employee and a revoked session even on receipt replay', async () => {
  const { command } = await ready();
  await new StaffAccountsService(db, () => token).create({ name: 'Nhân viên', phone: '0900000003', username: 'staff', password: 'finalize-test!' });
  const staffToken = (await auth.login('staff', 'finalize-test!')).token;
  await expect(new PurchaseFinalizationService(db, () => staffToken, testMapping).finalize(command)).rejects.toMatchObject({ code: 'FORBIDDEN' });
  await finalizer.finalize(command); await auth.logout(token);
  await expect(finalizer.finalize(command)).rejects.toThrow();
});

it('requires an explicit valid state mapping and valid command', async () => {
  expect(() => new PurchaseFinalizationService(db, () => token, { ...testMapping, productSold: testMapping.productAvailable })).toThrow();
  expect(() => new PurchaseFinalizationService(db, () => token, { ...testMapping, invoiceCompleted: 256 })).toThrow();
  const { command } = await ready();
  await expect(finalizer.finalize({ ...command, operationId: '' } as FinalizePurchaseCommand)).rejects.toThrow();
  expect(await db.hoaDonThuMua.count()).toBe(0);
});

it('never reuses a reserved product ID and rolls back invoice allocation when random IDs keep colliding', async () => {
  const { command } = await ready();
  await db.issuedIdentifiers.add({ key: recordVersionKey('sanPham', 'SP00000000'), issuedAt: '2026-11-01T00:00:00Z' });
  const before = await databaseSnapshot();
  vi.spyOn(crypto, 'getRandomValues').mockImplementation(value => {
    new Uint8Array(value!.buffer, value!.byteOffset, value!.byteLength).fill(0);
    return value;
  });
  await expect(finalizer.finalize(command)).rejects.toMatchObject({ code: 'DUPLICATE' });
  expect(await databaseSnapshot()).toEqual(before);
});
