import Dexie from 'dexie';
import { PHASE_2_STORES } from './phase2-schema';
import { CoCoDatabase } from '../../src/db/schema';
import { registerPurchaseMetadataCandidate } from '../../src/db/purchase-metadata';
import { AuthService } from '../../src/services/auth/service';
import { CandidatePurchaseTransactions, type CandidateDraftCommand } from '../../src/services/purchase-candidate';
import { PURCHASE_FORMAT } from '../../src/domain/purchases';
import { installFinalizedPurchaseGraph } from './purchase-finalized-graph';
import { validateReferences } from '../../src/repositories/constraints';

// Browser integration harness, never imported by the application. No UI-flow claim.
export async function runCandidateStorageScenario() {
  const name = 'G6NativeCandidateStorageTest';
  const legacy = new Dexie(name); legacy.version(3).stores({ ...PHASE_2_STORES, authSessions: '&tokenHash, username' });
  await legacy.open(); await legacy.table('appMetadata').add({ key: 'native-sentinel', value: 'unchanged' });
  await legacy.table('khachHang').add({ MaKH: 'KHOLD', TenKH: 'Legacy', SoDienThoaiKH: '0900000011', DiemTichLuy: 37 });
  const legacyKeys = legacy.tables.map(table => ({ name: table.name, key: table.schema.primKey.src })); legacy.close();
  const db = new CoCoDatabase(name); registerPurchaseMetadataCandidate(db); await db.open();
  const other = new CoCoDatabase(name); registerPurchaseMetadataCandidate(other); await other.open();
  try {
    const preservation = (await db.appMetadata.get('native-sentinel'))?.value === 'unchanged' && (await db.khachHang.get('KHOLD'))?.DiemTichLuy === 37 && legacyKeys.every(row => db.table(row.name).schema.primKey.src === row.key);
    const auth = new AuthService(db); await auth.bootstrap({ username: 'owner', password: 'native-candidate!', fullName: 'Native test', phone: '0900000099' });
    const session = await auth.login('owner', 'native-candidate!');
    const service = new CandidatePurchaseTransactions(db, () => session.token), second = new CandidatePurchaseTransactions(other, () => session.token);
    const input: CandidateDraftCommand = { operationId: 'native-create', expectedRevision: 0,
      draft: { id: 'DNATIVE', format: PURCHASE_FORMAT, employeeId: session.user.employeeId, createdBy: 'owner', status: 'editing', revision: 1, createdAt: '2026-11-11T01:00:00Z', updatedAt: '2026-11-11T01:00:00Z' }, lines: [], approvals: [] };
    await service.saveEditingDraft(input); const replay = await service.saveEditingDraft(input);
    const next = { ...input, expectedRevision: 1, draft: { ...input.draft, revision: 2 } };
    const outcomes = await Promise.allSettled([service.saveEditingDraft({ ...next, operationId: 'native-race-a' }), second.saveEditingDraft({ ...next, operationId: 'native-race-b' })]);
    const before = JSON.stringify(await db.table('purchaseDrafts').toArray()), count = await db.operations.count();
    const original = db.auditEntries.add;
    db.auditEntries.add = () => { throw new Error('native audit test failure'); };
    let rolledBack = false;
    try { await service.saveEditingDraft({ ...input, operationId: 'native-abort', expectedRevision: 2, draft: { ...input.draft, revision: 3 } }); }
    catch { rolledBack = before === JSON.stringify(await db.table('purchaseDrafts').toArray()) && count === await db.operations.count(); }
    finally { db.auditEntries.add = original; }
    await auth.logout(session.token); let revoked = false;
    try { await service.saveEditingDraft(input); } catch { revoked = true; }
    return { nativeVersion: db.backendDB().version, stores: db.tables.length, preservation, replay: replay.duplicate,
      raceWinners: outcomes.filter(row => row.status === 'fulfilled').length, revision: (await db.table('purchaseDrafts').get('DNATIVE')).revision,
      rolledBack, revoked, invoices: await db.hoaDonThuMua.count(), products: await db.sanPham.count() };
  } finally { other.close(); await db.delete(); }
}

export async function runCandidateForeignKeys() {
  const db = new CoCoDatabase('G6NativeForeignKeyTest'); registerPurchaseMetadataCandidate(db); await db.open();
  try {
    const auth = new AuthService(db); await auth.bootstrap({ username: 'owner', password: 'native-fk-test!', fullName: 'FK test', phone: '0900000066' });
    const account = (await db.taiKhoan.get('owner'))!;
    await installFinalizedPurchaseGraph(db, { employeeId: account.MaNV, createdBy: 'owner', ownerId: account.MaNV });
    await validateReferences(db);
    const valid = await db.chiTietHoaDonTM.count() === 0 && await db.sanPham.count() === 2;
    let rejected = false;
    try { await db.transaction('rw', db.tables, async () => { await db.productCosts.delete('SPGRAPH1'); await validateReferences(db); }); } catch { rejected = true; }
    return { valid, rejected, rollbackPreservedCost: (await db.productCosts.get('SPGRAPH1'))?.unitCost === 80001, amount: (await db.hoaDonThuMua.get('TMGRAPH'))?.TongTienTM };
  } finally { await db.delete(); }
}
