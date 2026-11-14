import type { CoCoDatabase } from '../db/schema';
import { keyFields, recordKey, type RecordKey, type RecordMap, type RecordName } from '../domain/records';

import { RepositoryError } from './errors';
export { RepositoryError } from './errors';
import { validateCandidatePurchaseReferences, resolveCandidatePurchaseDetailSnapshot, type PurchaseReferenceSnapshot } from './purchase-links';
import { inventoryAttributesKey, inventoryAttributesSchema, cycleKey, cycleSchema } from '../domain/inventory';

// Called inside the same read/write transaction as every mutation. IndexedDB
// does not provide foreign keys; check the final state, including reverse links.
export async function validateReferences(db: CoCoDatabase): Promise<void> {
  // Runtime v3 has no candidate metadata: every legacy FK follows the same path.
  const candidate = db.verno === 4 && db.tables.some(table => table.name === 'purchaseProvenance');
  if (candidate) await validateCandidatePurchaseReferences(db);
  // Read the current transaction's final state in bulk. Serial native IDB gets
  // per product kept read transactions open and blocked subsequent sale writes.
  // Maps are local to this invocation, including reverse-FK and composite keys.
  const rows = new Map<RecordName, RecordMap[RecordName][]>();
  const byKey = new Map<RecordName, Map<string, RecordMap[RecordName]>>();
  await Promise.all((Object.keys(keyFields) as RecordName[]).map(async table => {
    const records = await db.table<RecordMap[RecordName]>(table).toArray();
    rows.set(table, records);
    byKey.set(table, new Map(records.map(record => [JSON.stringify(recordKey(table, record)), record])));
  }));
  function read<N extends RecordName>(table: N): RecordMap[N][] { return rows.get(table)! as RecordMap[N][]; }
  function requireRecord<N extends RecordName>(table: N, key: RecordKey<N>): RecordMap[N] {
    const record = byKey.get(table)!.get(JSON.stringify(key));
    if (!record) throw new RepositoryError('REFERENCE', `Missing reference in ${table}`);
    return record as RecordMap[N];
  }

  let purchaseSnapshot: PurchaseReferenceSnapshot | undefined;
  if (candidate) {
    const [origins, finalizations] = await Promise.all([
      db.table<{ productId: string }>('purchaseProvenance').toArray(),
      db.table<{ invoiceId: string }>('purchaseFinalizations').toArray(),
    ]);
    purchaseSnapshot = { origins: new Map(origins.map(row => [row.productId, row])),
      finalizations: new Map(finalizations.map(row => [row.invoiceId, row])) };
  }

  for (const record of read('taiKhoan')) requireRecord('nhanVien', record.MaNV);
  for (const record of read('khungGiaThuMua')) requireRecord('nhanVien', record.MaNV);
  for (const record of read('hoaDonThuMua')) {
    requireRecord('nhanVien', record.MaNV);
    requireRecord('khachHang', record.MaKH);
  }
  for (const record of read('yeuCauPheDuyetGia')) {
    requireRecord('nhanVien', record.MaNV);
    requireRecord('khungGiaThuMua', record.MaKhungGia);
    requireRecord('hoaDonThuMua', record.MaHDTM);
  }
  for (const record of read('chiTietHoaDonTM')) {
    requireRecord('hoaDonThuMua', record.MaHDTM);
    requireRecord('khungGiaThuMua', record.MaKhungGia);
  }
  for (const record of read('sanPham')) {
    if (purchaseSnapshot && resolveCandidatePurchaseDetailSnapshot(record, purchaseSnapshot)) continue;
    requireRecord('chiTietHoaDonTM', [record.MaHDTM, record.MaKhungGia]);
  }
  for (const record of read('hoaDonBanHang')) {
    requireRecord('nhanVien', record.MaNV);
    requireRecord('khachHang', record.MaKH);
  }
  for (const record of read('chiTietHoaDonBH')) {
    requireRecord('hoaDonBanHang', record.MaHDBH);
    requireRecord('sanPham', record.MaSP);
  }
  for (const record of read('accountSecurity')) requireRecord('taiKhoan', record.TenDangNhap);
  for (const record of read('memberships')) {
    requireRecord('khachHang', record.MaKH);
    requireRecord('taiKhoan', record.registeredBy);
  }
  for (const record of read('productCosts')) {
    const product = requireRecord('sanPham', record.MaSP);
    if (product.MaHDTM !== record.MaHDTM || product.MaKhungGia !== record.MaKhungGia) {
      throw new RepositoryError('REFERENCE', 'Cost provenance does not match product');
    }
  }
  for (const record of read('discountApplications')) requireRecord('sanPham', record.MaSP);
  for (const record of await db.appMetadata.filter(row => row.key.startsWith('inventory-attributes:') || row.key.startsWith('inventory-cycle:')).toArray()) {
    const attributes = record.key.startsWith('inventory-attributes:');
    const value = attributes ? inventoryAttributesSchema.parse(JSON.parse(record.value)) : cycleSchema.parse(JSON.parse(record.value));
    if (record.key !== (attributes ? inventoryAttributesKey(value.productId) : cycleKey(value.productId))) throw new RepositoryError('REFERENCE', 'Invalid inventory metadata key');
    const product = requireRecord('sanPham', value.productId);
    if ('startedOn' in value && value.startedOn !== product.NgayBatDauChuKyGiam) throw new RepositoryError('REFERENCE', 'Invalid inventory cycle');
  }
  for (const record of read('notifications')) {
    requireRecord('taiKhoan', record.recipient);
    requireRecord('yeuCauPheDuyetGia', record.MaYC);
  }
}
