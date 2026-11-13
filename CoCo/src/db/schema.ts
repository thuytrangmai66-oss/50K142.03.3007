import Dexie, { type Table } from 'dexie';
import type {
  AppMetadata, AuditEntry, IssuedIdentifier, OperationReceipt, RecordMap, RecordVersion,
} from '../domain/records';
import type { AuthSession } from '../domain/auth';
import { PURCHASE_METADATA_STORES } from './purchase-metadata';

export const COCO_DATABASE_NAME = 'CoCoDB';
export const COCO_SCHEMA_VERSION = 4;
export type { AppMetadata } from '../domain/records';

export class CoCoDatabase extends Dexie {
  declare appMetadata: Table<AppMetadata, string>;
  declare taiKhoan: Table<RecordMap['taiKhoan'], string>;
  declare nhanVien: Table<RecordMap['nhanVien'], string>;
  declare khachHang: Table<RecordMap['khachHang'], string>;
  declare khungGiaThuMua: Table<RecordMap['khungGiaThuMua'], string>;
  declare yeuCauPheDuyetGia: Table<RecordMap['yeuCauPheDuyetGia'], string>;
  declare hoaDonThuMua: Table<RecordMap['hoaDonThuMua'], string>;
  declare chiTietHoaDonTM: Table<RecordMap['chiTietHoaDonTM'], [string, string]>;
  declare sanPham: Table<RecordMap['sanPham'], string>;
  declare hoaDonBanHang: Table<RecordMap['hoaDonBanHang'], string>;
  declare chiTietHoaDonBH: Table<RecordMap['chiTietHoaDonBH'], [string, string]>;
  declare accountSecurity: Table<RecordMap['accountSecurity'], string>;
  declare memberships: Table<RecordMap['memberships'], string>;
  declare productCosts: Table<RecordMap['productCosts'], string>;
  declare discountApplications: Table<RecordMap['discountApplications'], [string, string, number]>;
  declare notifications: Table<RecordMap['notifications'], string>;
  declare recordVersions: Table<RecordVersion, string>;
  declare operations: Table<OperationReceipt, string>;
  declare auditEntries: Table<AuditEntry, string>;
  declare issuedIdentifiers: Table<IssuedIdentifier, string>;
  declare authSessions: Table<AuthSession, string>;

  constructor(name = COCO_DATABASE_NAME) {
    super(name);
    // Keep v1 so existing Pages/browser metadata upgrades without deletion or seed.
    this.version(1).stores({ appMetadata: '&key' });
    this.version(2).stores({
      appMetadata: '&key',
      taiKhoan: '&TenDangNhap, MaNV',
      nhanVien: '&MaNV, &SoDienThoai',
      khachHang: '&MaKH, &SoDienThoaiKH',
      khungGiaThuMua: '&MaKhungGia, MaNV, &[LoaiSanPham+ThuongHieu+TinhTrang]',
      yeuCauPheDuyetGia: '&MaYC, MaNV, MaKhungGia, MaHDTM, TrangThai',
      hoaDonThuMua: '&MaHDTM, MaKH, MaNV, NgayThuMua',
      chiTietHoaDonTM: '&[MaHDTM+MaKhungGia], MaHDTM, MaKhungGia',
      sanPham: '&MaSP, MaHDTM, MaKhungGia, [MaHDTM+MaKhungGia], TrangThai, NgayNhapKho',
      hoaDonBanHang: '&MaHDBH, MaKH, MaNV, NgayBan',
      chiTietHoaDonBH: '&[MaHDBH+MaSP], MaHDBH, MaSP',
      accountSecurity: '&TenDangNhap',
      memberships: '&MaKH',
      productCosts: '&MaSP, MaHDTM, MaKhungGia',
      discountApplications: '&[MaSP+cycleStartedOn+milestone], MaSP, executedAt',
      notifications: '&id, recipient, MaYC',
      recordVersions: '&key', operations: '&id', auditEntries: '&id, actor, executedAt',
      issuedIdentifiers: '&key',
    });
    this.version(3).stores({ authSessions: '&tokenHash, username' });
    // T01 and runtime activation explicitly accepted by the user after review.
    this.version(4).stores(PURCHASE_METADATA_STORES);
  }
}
