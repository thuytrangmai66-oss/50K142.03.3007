import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { COCO_SCHEMA_VERSION, CoCoDatabase } from '../../src/db/schema';
import { calendarDate, entitySchemas, recordSchemas, type RecordMap } from '../../src/domain/records';
import { CoCoRepository, type Change, type Command } from '../../src/repositories';

const instant = '2026-11-10T10:00:00.000Z';
const customer = (MaKH = 'KH01', SoDienThoaiKH = '0123456789'): RecordMap['khachHang'] =>
  ({ MaKH, TenKH: 'Khách kiểm thử', SoDienThoaiKH, DiemTichLuy: 0 });
const employee: RecordMap['nhanVien'] = { MaNV: 'NV01', HoTen: 'Nhân viên kiểm thử', SoDienThoai: '0987654321' };
const bracket: RecordMap['khungGiaThuMua'] = {
  MaKhungGia: 'KG01', LoaiSanPham: 'Áo', ThuongHieu: 'Nhãn kiểm thử', TinhTrang: 90,
  GiaMin: 50_000, GiaMax: 150_000, MaNV: employee.MaNV,
};
const purchase: RecordMap['hoaDonThuMua'] = {
  MaHDTM: 'TM01', NgayThuMua: instant, TongTienTM: 100_000, TrangThai: 0, MaNV: 'NV01', MaKH: 'KH01',
};
const product: RecordMap['sanPham'] = {
  MaSP: 'SP01', TenSP: 'Áo kiểm thử', NgayNhapKho: '2026-11-10', GiaGocChuKyGiam: 150_000,
  GiaBanHienHanh: 150_000, TrangThai: 0, NgayBatDauChuKyGiam: '2026-11-10', MaHDTM: 'TM01', MaKhungGia: 'KG01',
};
function stockChanges(): Change[] {
  return [
    // Child-first ordering is valid because the whole transaction is checked.
    { table: 'sanPham', kind: 'create', value: product },
    { table: 'chiTietHoaDonTM', kind: 'create', value: { MaHDTM: 'TM01', MaKhungGia: 'KG01', SoLuong: 1, DonGia: 100_000, ThanhTien: 100_000 } },
    { table: 'hoaDonThuMua', kind: 'create', value: purchase },
    { table: 'khungGiaThuMua', kind: 'create', value: bracket },
    { table: 'khachHang', kind: 'create', value: customer() },
    { table: 'nhanVien', kind: 'create', value: employee },
  ];
}

let database: CoCoDatabase;
let repository: CoCoRepository;
beforeEach(() => {
  database = new CoCoDatabase('CoCoPhase2Tests');
  repository = new CoCoRepository(database, () => instant);
});
afterEach(async () => { await database.delete(); });

it('migrates a real v1 schema without resetting metadata or seeding business records', async () => {
  const v1 = new Dexie(database.name);
  v1.version(1).stores({ appMetadata: '&key' });
  await v1.table('appMetadata').add({ key: 'preserve', value: 'from-phase-1' });
  v1.close();
  await database.open();
  expect(database.verno).toBe(COCO_SCHEMA_VERSION);
  expect(await database.appMetadata.get('preserve')).toEqual({ key: 'preserve', value: 'from-phase-1' });
  expect(database.tables).toHaveLength(27);
  for (const table of database.tables.filter(table => table.name !== 'appMetadata')) expect(await table.count()).toBe(0);
});

it('writes a complete related batch atomically, including both compound-key details', async () => {
  const changes: Change[] = [...stockChanges(),
    { table: 'hoaDonBanHang', kind: 'create', value: {
      MaHDBH: 'BH01', NgayBan: instant, TienKhuyenMai: 0, TichDiem: 15, PTTT: 0, TrangThai: 0,
      TongTien: 150_000, MaNV: 'NV01', MaKH: 'KH01',
    } },
    { table: 'chiTietHoaDonBH', kind: 'create', value: { MaHDBH: 'BH01', MaSP: 'SP01', DonGia: 150_000, SoLuong: 1, ThanhTien: 150_000 } },
    { table: 'yeuCauPheDuyetGia', kind: 'create', value: {
      MaYC: 'YC01', GiaDeXuat: 160_000, GiaToiDa: 150_000, LyDo: 'Kiểm thử', TrangThai: 0,
      MaNV: 'NV01', MaKhungGia: 'KG01', MaHDTM: 'TM01',
    } },
    { table: 'taiKhoan', kind: 'create', value: { TenDangNhap: 'staff01', MaNV: 'NV01' } },
  ];
  await repository.commit({ id: 'all-entities', changes });
  expect((await repository.get('chiTietHoaDonBH', ['BH01', 'SP01']))?.record.ThanhTien).toBe(150_000);
  expect((await repository.list('sanPham'))[0].version).toBe(1);
  expect(await database.auditEntries.count()).toBe(1);
  // No automatic membership or security role inferred from an account/customer.
  expect(await database.memberships.count()).toBe(0);
  expect(await database.accountSecurity.count()).toBe(0);
});

it('rolls back earlier writes, versions, id reservations, audit and receipt on a missing foreign key', async () => {
  await expect(repository.commit({ id: 'bad-ref', changes: [
    { table: 'khachHang', kind: 'create', value: customer() },
    { table: 'hoaDonThuMua', kind: 'create', value: purchase },
  ] })).rejects.toMatchObject({ code: 'REFERENCE' });
  for (const table of database.tables) expect(await table.count()).toBe(0);
});

it('enforces unique customer phones across competing connections and rolls back the losing command', async () => {
  const other = new CoCoDatabase(database.name);
  try {
    const second = new CoCoRepository(other, () => instant);
    const results = await Promise.allSettled([
      repository.commit({ id: 'phone-a', changes: [{ table: 'khachHang', kind: 'create', value: customer() }] }),
      second.commit({ id: 'phone-b', changes: [{ table: 'khachHang', kind: 'create', value: customer('KH02') }] }),
    ]);
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(await database.khachHang.count()).toBe(1);
    expect(await database.operations.count()).toBe(1);
    expect(await database.recordVersions.count()).toBe(1);
  } finally { other.close(); }
});

it('preserves phone leading zero and rejects duplicate employee phone and login', async () => {
  await repository.commit({ id: 'staff', changes: [
    { table: 'nhanVien', kind: 'create', value: employee },
    { table: 'taiKhoan', kind: 'create', value: { TenDangNhap: 'staff01', MaNV: 'NV01' } },
  ] });
  expect((await repository.get('nhanVien', 'NV01'))?.record.SoDienThoai).toBe('0987654321');
  await expect(repository.commit({ id: 'staff-duplicate-phone', changes: [
    { table: 'nhanVien', kind: 'create', value: { ...employee, MaNV: 'NV02' } },
  ] })).rejects.toMatchObject({ name: 'ConstraintError' });
  await expect(repository.commit({ id: 'staff-duplicate-login', changes: [
    { table: 'taiKhoan', kind: 'create', value: { TenDangNhap: 'staff01', MaNV: 'NV01' } },
  ] })).rejects.toMatchObject({ code: 'DUPLICATE' });
});

it('enforces unique price-bracket combination and preserves per-item cost after bracket price edits', async () => {
  await repository.commit({ id: 'stock', changes: [...stockChanges(),
    { table: 'productCosts', kind: 'create', value: { MaSP: 'SP01', MaHDTM: 'TM01', MaKhungGia: 'KG01', unitCost: 100_000, recordedAt: instant } },
  ] });
  await expect(repository.commit({ id: 'duplicate-bracket', changes: [
    { table: 'khungGiaThuMua', kind: 'create', value: { ...bracket, MaKhungGia: 'KG02' } },
  ] })).rejects.toMatchObject({ name: 'ConstraintError' });
  await repository.commit({ id: 'bracket-price-edit', changes: [
    { table: 'khungGiaThuMua', kind: 'update', expectedVersion: 1, value: { ...bracket, GiaMin: 200_000, GiaMax: 300_000 } },
  ] });
  expect((await database.productCosts.get('SP01'))?.unitCost).toBe(100_000);
  expect((await database.chiTietHoaDonTM.get(['TM01', 'KG01']))?.DonGia).toBe(100_000);
});

it('commits only once for simultaneous identical operation ids across tabs and survives reopen', async () => {
  const other = new CoCoDatabase(database.name);
  const command: Command = { id: 'retry-same-command', changes: [{ table: 'khachHang', kind: 'create', value: customer() }] };
  try {
    const results = await Promise.all([repository.commit(command), new CoCoRepository(other, () => instant).commit(command)]);
    expect(results.map(result => result.duplicate).sort()).toEqual([false, true]);
  } finally { other.close(); }
  database.close();
  await database.open();
  expect(await repository.commit(command)).toEqual({ duplicate: true, executedAt: instant });
  expect(await database.auditEntries.count()).toBe(1);
  expect((await repository.get('khachHang', 'KH01'))?.version).toBe(1);
  await expect(repository.commit({ ...command, changes: [{ table: 'khachHang', kind: 'create', value: customer('KH02', '0111111111') }] }))
    .rejects.toMatchObject({ code: 'OPERATION_REUSED' });
});

it('rejects stale writes across tabs without overwriting the winner', async () => {
  await repository.commit({ id: 'create', changes: [{ table: 'khachHang', kind: 'create', value: customer() }] });
  const other = new CoCoDatabase(database.name);
  try {
    const second = new CoCoRepository(other);
    const results = await Promise.allSettled(['A', 'B'].map((name, index) =>
      (index ? second : repository).commit({ id: `edit-${name}`, changes: [
        { table: 'khachHang', kind: 'update', expectedVersion: 1, value: { ...customer(), TenKH: name } },
      ] })));
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    const rejected = results.find(result => result.status === 'rejected');
    expect(rejected?.status === 'rejected' && rejected.reason.code).toBe('CONFLICT');
    expect((await repository.get('khachHang', 'KH01'))?.version).toBe(2);
    expect(await database.operations.count()).toBe(2);
  } finally { other.close(); }
});

it('retains customer history while changing a phone and prevents deleting linked customers', async () => {
  await repository.commit({ id: 'stock', changes: stockChanges() });
  await repository.commit({ id: 'new-phone', changes: [
    { table: 'khachHang', kind: 'update', expectedVersion: 1, value: customer('KH01', '0111111111') },
  ] });
  expect((await database.hoaDonThuMua.get('TM01'))?.MaKH).toBe('KH01');
  await expect(repository.commit({ id: 'delete-customer', changes: [
    { table: 'khachHang', kind: 'delete', expectedVersion: 2, key: 'KH01' },
  ] })).rejects.toMatchObject({ code: 'REFERENCE' });
  expect((await repository.get('khachHang', 'KH01'))?.version).toBe(2);
});

it('keeps tombstone versions to reject a stale edit after delete/recreate', async () => {
  await repository.commit({ id: 'create', changes: [{ table: 'khachHang', kind: 'create', value: customer() }] });
  await repository.commit({ id: 'delete', changes: [{ table: 'khachHang', kind: 'delete', key: 'KH01', expectedVersion: 1 }] });
  await repository.commit({ id: 'recreate', changes: [{ table: 'khachHang', kind: 'create', value: customer() }] });
  expect((await repository.get('khachHang', 'KH01'))?.version).toBe(3);
  await expect(repository.commit({ id: 'stale', changes: [
    { table: 'khachHang', kind: 'update', expectedVersion: 1, value: { ...customer(), TenKH: 'Stale' } },
  ] })).rejects.toMatchObject({ code: 'CONFLICT' });
});

it('never reuses an issued product id even after deletion', async () => {
  await repository.commit({ id: 'stock', changes: stockChanges() });
  await repository.commit({ id: 'delete-product', changes: [{ table: 'sanPham', kind: 'delete', key: 'SP01', expectedVersion: 1 }] });
  await expect(repository.commit({ id: 'reuse-product', changes: [{ table: 'sanPham', kind: 'create', value: product }] }))
    .rejects.toMatchObject({ code: 'DUPLICATE' });
});

it('keeps product import date and provenance immutable and prevents deleting invoices', async () => {
  await repository.commit({ id: 'stock', changes: stockChanges() });
  await expect(repository.commit({ id: 'change-date', changes: [
    { table: 'sanPham', kind: 'update', expectedVersion: 1, value: { ...product, NgayNhapKho: '2026-11-11' } },
  ] })).rejects.toMatchObject({ code: 'IMMUTABLE' });
  await expect(repository.commit({ id: 'delete-invoice', changes: [{ table: 'hoaDonThuMua', kind: 'delete', key: 'TM01', expectedVersion: 1 }] }))
    .rejects.toMatchObject({ code: 'IMMUTABLE' });
});

it('stores explicit per-product costs for two different prices in the same invoice/bracket without inference', async () => {
  const changes = stockChanges();
  const line = changes.find(change => change.table === 'chiTietHoaDonTM');
  if (line?.kind === 'create') { line.value.SoLuong = 2; line.value.ThanhTien = 200_000; }
  const invoice = changes.find(change => change.table === 'hoaDonThuMua');
  if (invoice?.kind === 'create') invoice.value = { ...invoice.value, TongTienTM: 200_000 };
  await repository.commit({ id: 'costs', changes: [...changes,
    { table: 'sanPham', kind: 'create', value: { ...product, MaSP: 'SP02' } },
    { table: 'productCosts', kind: 'create', value: { MaSP: 'SP01', MaHDTM: 'TM01', MaKhungGia: 'KG01', unitCost: 80_000, recordedAt: instant } },
    { table: 'productCosts', kind: 'create', value: { MaSP: 'SP02', MaHDTM: 'TM01', MaKhungGia: 'KG01', unitCost: 120_000, recordedAt: instant } },
  ] });
  expect((await repository.list('productCosts')).map(row => row.record.unitCost).sort((a, b) => a - b)).toEqual([80_000, 120_000]);
  await expect(repository.commit({ id: 'cost-rewrite', changes: [{ table: 'productCosts', kind: 'update', expectedVersion: 1,
    value: { MaSP: 'SP01', MaHDTM: 'TM01', MaKhungGia: 'KG01', unitCost: 100_000, recordedAt: instant },
  }] })).rejects.toMatchObject({ code: 'IMMUTABLE' });
});

it('rejects wrong cost provenance and mismatched compound purchase links', async () => {
  await repository.commit({ id: 'stock', changes: stockChanges() });
  await expect(repository.commit({ id: 'wrong-cost', changes: [{ table: 'productCosts', kind: 'create',
    value: { MaSP: 'SP01', MaHDTM: 'TM02', MaKhungGia: 'KG01', unitCost: 100_000, recordedAt: instant },
  }] })).rejects.toMatchObject({ code: 'REFERENCE' });
  await expect(repository.commit({ id: 'wrong-product', changes: [{ table: 'sanPham', kind: 'create', value: { ...product, MaSP: 'SP02', MaKhungGia: 'KG02' } }] }))
    .rejects.toMatchObject({ code: 'REFERENCE' });
});

it('makes a discount milestone unique per product/cycle across connections and records actual execution time', async () => {
  await repository.commit({ id: 'stock', changes: stockChanges() });
  const value: RecordMap['discountApplications'] = {
    MaSP: 'SP01', cycleStartedOn: '2026-11-10', milestone: 30, scheduledFor: '2026-12-10',
    executedAt: '2026-12-12T03:00:00.000Z', priceBefore: 150_000, priceAfter: 105_000,
  };
  const other = new CoCoDatabase(database.name);
  try {
    const results = await Promise.allSettled([repository, new CoCoRepository(other)].map((repo, index) => repo.commit({
      id: `milestone-${index}`, changes: [{ table: 'discountApplications', kind: 'create', value }],
    })));
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect((await database.discountApplications.toArray())[0].executedAt).toBe('2026-12-12T03:00:00.000Z');
    expect(await database.discountApplications.count()).toBe(1);
    // This test validates storage, not the future scheduler or discount policy.
  } finally { other.close(); }
});

it('requires explicit membership registration and stores only hash/salt security metadata', async () => {
  await repository.commit({ id: 'security-membership', changes: [
    { table: 'nhanVien', kind: 'create', value: employee },
    { table: 'taiKhoan', kind: 'create', value: { TenDangNhap: 'staff01', MaNV: 'NV01' } },
    { table: 'accountSecurity', kind: 'create', value: { TenDangNhap: 'staff01', role: 'staff', active: true,
      passwordHash: 'ab'.repeat(32), passwordSalt: 'cd'.repeat(16), algorithm: 'PBKDF2-SHA-256', iterations: 600_000,
    } },
    { table: 'khachHang', kind: 'create', value: customer() },
    { table: 'memberships', kind: 'create', value: { MaKH: 'KH01', registeredAt: instant, registeredBy: 'staff01' } },
  ] });
  expect(await database.taiKhoan.get('staff01')).toEqual({ TenDangNhap: 'staff01', MaNV: 'NV01' });
  expect((await database.accountSecurity.get('staff01'))?.role).toBe('staff');
  expect(await database.memberships.count()).toBe(1);
  expect(JSON.stringify(await database.auditEntries.toArray())).not.toContain('ababab');
  await expect(repository.commit({ id: 'orphan-membership', changes: [
    { table: 'memberships', kind: 'create', value: { MaKH: 'missing', registeredAt: instant, registeredBy: 'staff01' } },
  ] })).rejects.toMatchObject({ code: 'REFERENCE' });
});

it('rolls back all writes if persisting audit evidence fails, then permits retry', async () => {
  const failAudit = () => { throw new Error('Simulated storage failure'); };
  database.auditEntries.hook('creating', failAudit);
  const command: Command = { id: 'audit-failure', changes: [{ table: 'khachHang', kind: 'create', value: customer() }] };
  await expect(repository.commit(command)).rejects.toThrow('Simulated storage failure');
  for (const table of database.tables) expect(await table.count()).toBe(0);
  database.auditEntries.hook('creating').unsubscribe(failAudit);
  expect(await repository.commit(command)).toEqual({ duplicate: false, executedAt: instant });
});

it('rejects duplicate batch targets, missing versions and malformed compound keys', async () => {
  await expect(repository.commit({ id: 'duplicate-target', changes: [
    { table: 'khachHang', kind: 'create', value: customer() },
    { table: 'khachHang', kind: 'create', value: customer() },
  ] })).rejects.toMatchObject({ code: 'VALIDATION' });
  await expect(repository.commit({ id: 'no-version', changes: [
    { table: 'khachHang', kind: 'delete', key: 'KH01', expectedVersion: 0 },
  ] })).rejects.toMatchObject({ code: 'VALIDATION' });
  await expect(repository.get('chiTietHoaDonTM', ['TM01'] as unknown as [string, string])).rejects.toMatchObject({ code: 'VALIDATION' });
});

describe('runtime validation', () => {
  it.each([
    { ...customer(), SoDienThoaiKH: 123456789 }, { ...customer(), SoDienThoaiKH: '123' },
    { ...customer(), DiemTichLuy: -1 }, { ...customer(), DiemTichLuy: 0.5 },
    { ...customer(), TenKH: '   ' }, { ...customer(), MaKH: 'a'.repeat(11) },
  ])('rejects invalid customer data before persistence %#', async value => {
    await expect(repository.commit({ id: 'invalid', changes: [{ table: 'khachHang', kind: 'create', value: value as RecordMap['khachHang'] }] }))
      .rejects.toMatchObject({ code: 'VALIDATION' });
    expect(await database.operations.count()).toBe(0);
  });

  it('rejects unsafe, fractional, negative and inconsistent amounts without rounding', () => {
    for (const DonGia of [NaN, Infinity, -1, 0, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
      expect(entitySchemas.chiTietHoaDonTM.safeParse({ MaHDTM: 'TM01', MaKhungGia: 'KG01', SoLuong: 1, DonGia, ThanhTien: DonGia }).success).toBe(false);
    }
    expect(entitySchemas.chiTietHoaDonBH.safeParse({ MaHDBH: 'BH01', MaSP: 'SP01', SoLuong: 2, DonGia: 50_000, ThanhTien: 50_000 }).success).toBe(false);
    expect(entitySchemas.khungGiaThuMua.safeParse({ ...bracket, GiaMin: 200_000 }).success).toBe(false);
  });

  it('rejects nonexistent dates and plaintext password fields', () => {
    expect(calendarDate.safeParse('2026-02-29').success).toBe(false);
    expect(calendarDate.safeParse('2028-02-29').success).toBe(true);
    expect(entitySchemas.taiKhoan.safeParse({ TenDangNhap: 'staff01', MaNV: 'NV01', MatKhau: 'plaintext' }).success).toBe(false);
    expect(recordSchemas.accountSecurity.safeParse({ TenDangNhap: 'staff01', role: 'staff', active: true,
      passwordHash: 'plaintext', passwordSalt: 'salt', algorithm: 'PBKDF2-SHA-256', iterations: 600_000,
    }).success).toBe(false);
  });
});
