import type { CoCoDatabase } from '../db/schema';
import type { RecordKey, RecordMap, RecordName } from '../domain/records';

export class RepositoryError extends Error {
  constructor(public readonly code: 'VALIDATION' | 'DUPLICATE' | 'NOT_FOUND' | 'CONFLICT' | 'REFERENCE' | 'IMMUTABLE' | 'OPERATION_REUSED', message: string) {
    super(message);
    this.name = 'RepositoryError';
  }
}

// Called inside the same read/write transaction as every mutation. IndexedDB
// does not provide foreign keys; check the final state, including reverse links.
export async function validateReferences(db: CoCoDatabase): Promise<void> {
  async function requireRecord<N extends RecordName>(table: N, key: RecordKey<N>): Promise<RecordMap[N]> {
    const record = await db.table<RecordMap[N], RecordKey<N>>(table).get(key);
    if (!record) throw new RepositoryError('REFERENCE', `Missing reference in ${table}`);
    return record;
  }

  for (const record of await db.taiKhoan.toArray()) await requireRecord('nhanVien', record.MaNV);
  for (const record of await db.khungGiaThuMua.toArray()) await requireRecord('nhanVien', record.MaNV);
  for (const record of await db.hoaDonThuMua.toArray()) {
    await requireRecord('nhanVien', record.MaNV);
    await requireRecord('khachHang', record.MaKH);
  }
  for (const record of await db.yeuCauPheDuyetGia.toArray()) {
    await requireRecord('nhanVien', record.MaNV);
    await requireRecord('khungGiaThuMua', record.MaKhungGia);
    await requireRecord('hoaDonThuMua', record.MaHDTM);
  }
  for (const record of await db.chiTietHoaDonTM.toArray()) {
    await requireRecord('hoaDonThuMua', record.MaHDTM);
    await requireRecord('khungGiaThuMua', record.MaKhungGia);
  }
  for (const record of await db.sanPham.toArray()) {
    await requireRecord('chiTietHoaDonTM', [record.MaHDTM, record.MaKhungGia]);
  }
  for (const record of await db.hoaDonBanHang.toArray()) {
    await requireRecord('nhanVien', record.MaNV);
    await requireRecord('khachHang', record.MaKH);
  }
  for (const record of await db.chiTietHoaDonBH.toArray()) {
    await requireRecord('hoaDonBanHang', record.MaHDBH);
    await requireRecord('sanPham', record.MaSP);
  }
  for (const record of await db.accountSecurity.toArray()) await requireRecord('taiKhoan', record.TenDangNhap);
  for (const record of await db.memberships.toArray()) {
    await requireRecord('khachHang', record.MaKH);
    await requireRecord('taiKhoan', record.registeredBy);
  }
  for (const record of await db.productCosts.toArray()) {
    const product = await requireRecord('sanPham', record.MaSP);
    if (product.MaHDTM !== record.MaHDTM || product.MaKhungGia !== record.MaKhungGia) {
      throw new RepositoryError('REFERENCE', 'Cost provenance does not match product');
    }
  }
  for (const record of await db.discountApplications.toArray()) await requireRecord('sanPham', record.MaSP);
  for (const record of await db.notifications.toArray()) {
    await requireRecord('taiKhoan', record.recipient);
    await requireRecord('yeuCauPheDuyetGia', record.MaYC);
  }
}
