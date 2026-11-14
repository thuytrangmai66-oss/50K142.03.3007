import { afterEach, beforeEach, expect, it } from 'vitest';
import { CoCoDatabase } from '../../src/db/schema';
import { AuthService } from '../../src/services/auth/service';
import { LocalReferenceData } from '../../src/services/reference-data/local';

let db: CoCoDatabase, reference: LocalReferenceData, token: string;
const original = { name: 'Khách kiểm thử sửa', phone: '0900000002' };
const allRows = () => db.transaction('r', db.tables, () => Promise.all(db.tables.map(table => table.toArray())));
beforeEach(async () => {
  db = new CoCoDatabase('G10CustomerEditTests');
  const auth = new AuthService(db);
  await auth.bootstrap({ username: 'owner', fullName: 'Chủ kiểm thử', phone: '0900000001', password: 'edit-tests!' });
  token = (await auth.login('owner', 'edit-tests!')).token;
  reference = new LocalReferenceData(db, () => token);
});
afterEach(async () => { await db.delete(); });

it.each([
  { name: '', phone: original.phone }, { name: '   ', phone: original.phone },
  { name: original.name, phone: '' }, { name: original.name, phone: '090000002' },
  { name: original.name, phone: '09000000022' }, { name: original.name, phone: '090000000x' },
  { name: original.name, phone: '０９０００００００２' }, { name: 'A'.repeat(51), phone: original.phone },
])('BR-UC4-03/04 invalid edit %# leaves all stores, versions and provenance unchanged', async input => {
  const id = await reference.createCustomer(original), current = await reference.customer(id), before = await allRows();
  await expect(reference.updateCustomer(id, current.version, input)).rejects.toMatchObject({ code: 'VALIDATION' });
  expect(await allRows()).toEqual(before);
});

it('BR-UC4-05 refuses changing a customer phone to another profile without any partial writes', async () => {
  const id = await reference.createCustomer(original);
  await reference.createCustomer({ name: 'Khách khác', phone: '0900000003' });
  const current = await reference.customer(id), before = await allRows();
  await expect(reference.updateCustomer(id, current.version, { name: 'Không được lưu', phone: '0900000003' }))
    .rejects.toMatchObject({ code: 'DUPLICATE', fields: { phone: expect.any(String) } });
  expect(await allRows()).toEqual(before);
});

it('BR-UC4-05 accepts an unchanged phone on a legitimate rename, preserving identity and profile count', async () => {
  const id = await reference.createCustomer(original), current = await reference.customer(id);
  await reference.updateCustomer(id, current.version, { name: 'Tên đã sửa', phone: original.phone });
  expect((await reference.customer(id)).record).toMatchObject({ MaKH: id, TenKH: 'Tên đã sửa', SoDienThoaiKH: original.phone });
  expect(await db.khachHang.count()).toBe(1);
});

it('BR-UC4-05 concurrent edits of two profiles cannot acquire the same phone', async () => {
  const firstId = await reference.createCustomer(original);
  const secondId = await reference.createCustomer({ name: 'Khách thứ hai', phone: '0900000003' });
  const first = await reference.customer(firstId), second = await reference.customer(secondId);
  const otherDb = new CoCoDatabase(db.name), other = new LocalReferenceData(otherDb, () => token);
  try {
    const result = await Promise.allSettled([
      reference.updateCustomer(firstId, first.version, { name: original.name, phone: '0900000004' }),
      other.updateCustomer(secondId, second.version, { name: 'Khách thứ hai', phone: '0900000004' }),
    ]);
    expect(result.filter(row => row.status === 'fulfilled')).toHaveLength(1);
    expect(await db.khachHang.where('SoDienThoaiKH').equals('0900000004').count()).toBe(1);
    const loser = result[0].status === 'rejected' ? first : second;
    expect(await reference.customer(loser.record.MaKH)).toEqual(loser);
    expect(await db.khachHang.count()).toBe(2);
    const beforeReopen = await allRows(); db.close(); await db.open();
    expect(await allRows()).toEqual(beforeReopen);
  } finally { otherDb.close(); }
});

it.each(['purchase-only', 'sale-only'])('BR-UC4-08 blocks deletion with %s history independently, preserving every store', async kind => {
  const id = await reference.createCustomer(original);
  const employee = (await db.nhanVien.toArray())[0].MaNV;
  // Legacy-shaped fixtures establish either history relation independently;
  // deletion rules must not infer payment status or require the other relation.
  if (kind === 'purchase-only') await db.hoaDonThuMua.add({ MaHDTM: 'TMG10', NgayThuMua: '2026-11-14T10:00:00+07:00', TongTienTM: 100000, TrangThai: 90, MaKH: id, MaNV: employee });
  else await db.hoaDonBanHang.add({ MaHDBH: 'BHG10', NgayBan: '2026-11-14T10:00:00+07:00', TongTien: 100000, TienKhuyenMai: 0, TichDiem: 0, PTTT: 90, TrangThai: 90, MaKH: id, MaNV: employee });
  const current = await reference.customer(id), before = await allRows();
  await expect(reference.deleteCustomer(id, current.version, true)).rejects.toMatchObject({ code: 'HAS_HISTORY' });
  expect(await allRows()).toEqual(before);
});
