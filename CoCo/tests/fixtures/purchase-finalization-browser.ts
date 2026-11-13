import { CoCoDatabase } from '../../src/db/schema';
import { AuthService } from '../../src/services/auth/service';
import { LocalReferenceData } from '../../src/services/reference-data/local';
import { PurchaseDraftService } from '../../src/services/purchase-drafts';
import { PurchaseFinalizationService } from '../../src/services/purchase-finalization';

/** Native storage integration only, with fixture status codes in a private DB. */
export async function runFinalizationStorageScenario() {
  const db = new CoCoDatabase(`T05Native-${crypto.randomUUID()}`), other = new CoCoDatabase(db.name);
  const mapping = { invoiceCompleted: 240, productAvailable: 241, productSold: 242 };
  const originalAdd = IDBObjectStore.prototype.add;
  try {
    const auth = new AuthService(db);
    await auth.bootstrap({ username: 'owner', password: 'native-finalize!', fullName: 'Native', phone: '0900000011' });
    const session = await auth.login('owner', 'native-finalize!');
    const reference = new LocalReferenceData(db, () => session.token);
    await reference.createBracket({ productType: 'Áo', brand: 'CoCo', condition: '2', min: '50000', max: '100000' });
    const customerId = await reference.createCustomer({ name: 'Khách native', phone: '0900000012' });
    const drafts = new PurchaseDraftService(db, () => session.token), finalizer = new PurchaseFinalizationService(db, () => session.token, mapping);
    async function createCommand(quantity: number, price: string) {
      const fresh = await drafts.prepareDraft(), [bracket] = await drafts.catalog();
      await drafts.commit(await drafts.prepareAdd(fresh, bracket, quantity, price));
      const bundle = await drafts.load(fresh.draft.id);
      await drafts.commit({ operationId: crypto.randomUUID(), expectedRevision: bundle.draft.revision,
        draft: { ...bundle.draft, revision: bundle.draft.revision + 1, customerId }, lines: bundle.lines, approvals: bundle.approvals });
      return { operationId: crypto.randomUUID(), draftId: bundle.draft.id, expectedRevision: bundle.draft.revision + 1 };
    }
    const command = await createCommand(2, '80005');
    const before = await Promise.all(db.tables.map(table => table.toArray()));
    IDBObjectStore.prototype.add = function (...args) {
      if (this.transaction.db.name === db.name && this.name === 'productCosts') {
        IDBObjectStore.prototype.add = originalAdd;
        throw new DOMException('T05 native test failure', 'QuotaExceededError');
      }
      return originalAdd.apply(this, args);
    };
    let failed = false;
    try { await finalizer.finalize(command); } catch { failed = true; }
    const rolledBack = failed && JSON.stringify(before) === JSON.stringify(await Promise.all(db.tables.map(table => table.toArray())));
    const result = await finalizer.finalize(command);
    const replay = await finalizer.finalize(command);
    const initialProducts = await db.sanPham.toArray();
    const raceCommand = await createCommand(1, '90000');
    const second = new PurchaseFinalizationService(other, () => session.token, mapping);
    const race = await Promise.allSettled([finalizer.finalize(raceCommand), second.finalize({ ...raceCommand, operationId: crypto.randomUUID() })]);
    return { nativeVersion: db.backendDB().version, rolledBack, replay: replay.duplicate && replay.invoiceId === result.invoiceId,
      initialProducts: initialProducts.length, initialPrices: initialProducts.map(row => row.GiaBanHienHanh),
      raceWinners: race.filter(item => item.status === 'fulfilled').length, invoices: await db.hoaDonThuMua.count(),
      products: await db.sanPham.count(), issued: await db.issuedIdentifiers.count() };
  } finally { IDBObjectStore.prototype.add = originalAdd; other.close(); await db.delete(); }
}
