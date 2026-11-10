import { z } from 'zod';

// Physical widths follow Design 3.3; monetary values follow approved Q12.
export const identifier = z.string().min(1).max(10).regex(/^\S+$/u);
const text = (length: number) => z.string().trim().min(1).max(length);
export const money = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const positiveMoney = money.refine(value => value > 0);
const integer = z.number().int().nonnegative().max(2_147_483_647);
const quantity = integer.refine(value => value > 0);
// The source specifies TINYINT without a code-to-label mapping. Do not invent one.
const tinyint = z.number().int().min(0).max(255);
const phone = z.string().regex(/^\d{10}$/);
export const calendarDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
});
export const timestamp = z.string().datetime({ offset: true }).refine(value =>
  calendarDate.safeParse(value.slice(0, 10)).success && Number.isFinite(Date.parse(value)));
const lineTotal = (value: { SoLuong: number; DonGia: number; ThanhTien: number }) =>
  Number.isSafeInteger(value.SoLuong * value.DonGia) && value.ThanhTien === value.SoLuong * value.DonGia;

export const entitySchemas = {
  // MatKhau is intentionally replaced by hash/salt in accountSecurity (Q05).
  taiKhoan: z.object({ TenDangNhap: identifier, MaNV: identifier }).strict(),
  nhanVien: z.object({ MaNV: identifier, HoTen: text(50), SoDienThoai: phone }).strict(),
  khachHang: z.object({ MaKH: identifier, TenKH: text(50), SoDienThoaiKH: phone, DiemTichLuy: integer }).strict(),
  khungGiaThuMua: z.object({
    MaKhungGia: identifier, LoaiSanPham: text(50), ThuongHieu: text(50), TinhTrang: tinyint,
    GiaMin: positiveMoney, GiaMax: positiveMoney, MaNV: identifier,
  }).strict().refine(value => value.GiaMin <= value.GiaMax, 'GiaMin must not exceed GiaMax'),
  yeuCauPheDuyetGia: z.object({
    MaYC: identifier, GiaDeXuat: positiveMoney, GiaToiDa: money, LyDo: text(100), TrangThai: tinyint,
    MaNV: identifier, MaKhungGia: identifier, MaHDTM: identifier,
  }).strict(),
  hoaDonThuMua: z.object({
    MaHDTM: identifier, NgayThuMua: timestamp, TongTienTM: money, TrangThai: tinyint,
    MaKH: identifier, MaNV: identifier,
  }).strict(),
  chiTietHoaDonTM: z.object({
    MaHDTM: identifier, MaKhungGia: identifier, SoLuong: quantity, DonGia: positiveMoney, ThanhTien: money,
  }).strict().refine(lineTotal, 'Invalid purchase line total'),
  sanPham: z.object({
    MaSP: identifier, TenSP: text(50), NgayNhapKho: calendarDate, GiaGocChuKyGiam: money,
    GiaBanHienHanh: money, TrangThai: tinyint, NgayBatDauChuKyGiam: calendarDate,
    MaHDTM: identifier, MaKhungGia: identifier,
  }).strict(),
  hoaDonBanHang: z.object({
    MaHDBH: identifier, NgayBan: timestamp, TienKhuyenMai: money, TichDiem: integer,
    PTTT: tinyint, TrangThai: tinyint, TongTien: money, MaNV: identifier, MaKH: identifier,
  }).strict(),
  // Q06: use ThanhTien from the logical model, not the duplicated physical column.
  chiTietHoaDonBH: z.object({
    MaHDBH: identifier, MaSP: identifier, DonGia: positiveMoney,
    SoLuong: quantity.refine(value => value <= 255), ThanhTien: money,
  }).strict().refine(lineTotal, 'Invalid sales line total'),
};

const hex = (length: number) => z.string().regex(new RegExp(`^[a-f0-9]{${length}}$`, 'i'));
export const metadataSchemas = {
  accountSecurity: z.object({
    TenDangNhap: identifier, role: z.enum(['owner', 'staff']), active: z.boolean(),
    passwordHash: hex(64), passwordSalt: hex(32), algorithm: z.literal('PBKDF2-SHA-256'),
    iterations: z.number().int().min(600_000).max(10_000_000),
  }).strict(),
  memberships: z.object({ MaKH: identifier, registeredAt: timestamp, registeredBy: identifier }).strict(),
  productCosts: z.object({
    MaSP: identifier, MaHDTM: identifier, MaKhungGia: identifier,
    unitCost: positiveMoney, recordedAt: timestamp,
  }).strict(),
  discountApplications: z.object({
    MaSP: identifier, cycleStartedOn: calendarDate, milestone: z.union([z.literal(30), z.literal(45)]),
    scheduledFor: calendarDate, executedAt: timestamp, priceBefore: money, priceAfter: money,
  }).strict(),
  notifications: z.object({
    id: z.string().min(1).max(200), recipient: identifier, MaYC: identifier,
    createdAt: timestamp, readAt: timestamp.optional(),
  }).strict(),
};

export const recordSchemas = { ...entitySchemas, ...metadataSchemas };
export type EntityName = keyof typeof entitySchemas;
export type RecordName = keyof typeof recordSchemas;
export type RecordMap = { [N in RecordName]: z.infer<(typeof recordSchemas)[N]> };
export type EntityMap = Pick<RecordMap, EntityName>;
export type RecordKey<N extends RecordName> = N extends 'chiTietHoaDonTM' | 'chiTietHoaDonBH'
  ? [string, string] : N extends 'discountApplications' ? [string, string, number] : string;

export const keyFields: { [N in RecordName]: readonly (keyof RecordMap[N] & string)[] } = {
  taiKhoan: ['TenDangNhap'], nhanVien: ['MaNV'], khachHang: ['MaKH'], khungGiaThuMua: ['MaKhungGia'],
  yeuCauPheDuyetGia: ['MaYC'], hoaDonThuMua: ['MaHDTM'], chiTietHoaDonTM: ['MaHDTM', 'MaKhungGia'],
  sanPham: ['MaSP'], hoaDonBanHang: ['MaHDBH'], chiTietHoaDonBH: ['MaHDBH', 'MaSP'],
  accountSecurity: ['TenDangNhap'], memberships: ['MaKH'], productCosts: ['MaSP'],
  discountApplications: ['MaSP', 'cycleStartedOn', 'milestone'], notifications: ['id'],
};

export function recordKey<N extends RecordName>(table: N, record: RecordMap[N]): RecordKey<N> {
  const values = keyFields[table].map(field => record[field]);
  return (values.length === 1 ? values[0] : values) as RecordKey<N>;
}

export interface AppMetadata { key: string; value: string }
export interface RecordVersion { key: string; version: number; updatedAt: string }
export interface OperationReceipt { id: string; fingerprint: string; executedAt: string }
export interface AuditEntry { id: string; actor?: string; executedAt: string; changed: string[] }
export interface IssuedIdentifier { key: string; issuedAt: string }
