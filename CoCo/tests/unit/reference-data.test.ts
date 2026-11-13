import { afterEach, beforeEach, expect, it } from 'vitest';
import { CoCoDatabase } from '../../src/db/schema';
import { CoCoRepository } from '../../src/repositories';
import { AuthService } from '../../src/services/auth/service';
import { LocalReferenceData, validateBracket, confirmedConditions } from '../../src/services/reference-data/local';
import { CONDITIONS, conditionMetadataKey } from '../../src/domain/conditions';
import { derivePassword, randomHex } from '../../src/services/auth/crypto';

let database: CoCoDatabase, gateway: LocalReferenceData, auth: AuthService, token: string;
const input = { name: 'Khách kiểm thử', phone: '0123456789' };
const bracketInput = { productType: 'Áo', brand: 'Nhãn thử', condition: '2', min: '50000', max: '150000' };
beforeEach(async () => {
  database = new CoCoDatabase('CoCoG4Tests'); auth = new AuthService(database);
  await auth.bootstrap({ username: 'owner', fullName: 'Chủ kiểm thử', phone: '0900000001', password: 'test-only!' });
  token = (await auth.login('owner','test-only!')).token;
  gateway = new LocalReferenceData(database, () => token);
});
afterEach(async () => { await database.delete(); });

it('creates, searches, renames and deletes a customer, preserving leading zero and points', async () => {
  const id = await gateway.createCustomer(input);
  const result = await gateway.customers('0123', 1);
  expect(result.total).toBe(1); expect(result.rows[0].record.SoDienThoaiKH).toBe(input.phone);
  expect(await database.memberships.count()).toBe(0);
  const current = await gateway.customer(id);
  await gateway.updateCustomer(id, current.version, { name: 'Tên mới', phone: '0111111111' });
  const updated = await gateway.customer(id);
  expect(updated.record).toMatchObject({ MaKH: id, TenKH: 'Tên mới', DiemTichLuy: 0 });
  await expect(gateway.deleteCustomer(id, updated.version, false)).rejects.toMatchObject({ code: 'CONFIRMATION' });
  expect(await database.khachHang.count()).toBe(1);
  await gateway.deleteCustomer(id, updated.version, true);
  expect(await database.khachHang.count()).toBe(0);
});

it.each([{ name: '', phone: '' }, { name: 'Khách', phone: '123' }, { name: 'A'.repeat(51), phone: '0123456789' }])('validates customer fields in service before persistence %#', async data => {
  await expect(gateway.createCustomer(data)).rejects.toMatchObject({ code: 'VALIDATION' });
  expect(await database.khachHang.count()).toBe(0);
});

it('serializes duplicate phone races across connections and rejects stale edits without overwriting', async () => {
  const otherDb = new CoCoDatabase(database.name), other = new LocalReferenceData(otherDb, () => token);
  try {
    const results = await Promise.allSettled([gateway.createCustomer(input), other.createCustomer(input)]);
    expect(results.filter(r=>r.status === 'fulfilled')).toHaveLength(1);
    expect(await database.khachHang.count()).toBe(1);
    const [{ record, version }] = (await gateway.customers('',1)).rows;
    await gateway.updateCustomer(record.MaKH, version, { ...input, name: 'Winner' });
    await expect(other.updateCustomer(record.MaKH, version, { ...input, name: 'Stale' })).rejects.toMatchObject({ code: 'CONFLICT' });
    expect((await gateway.customer(record.MaKH)).record.TenKH).toBe('Winner');
  } finally { otherDb.close(); }
});

it('keeps history under a changed phone, joins invoice snapshots and prevents linked deletion', async () => {
  const id = await gateway.createCustomer(input), bracket = await gateway.createBracket(bracketInput);
  const actor = (await auth.session(token))!;
  await new CoCoRepository(database).commit({ id: 'test-invoices', changes: [
    { table: 'hoaDonThuMua', kind: 'create', value: { MaHDTM: 'TM01', NgayThuMua: '2026-11-10T12:00:00+07:00', TongTienTM: 100000, TrangThai: 0, MaKH: id, MaNV: actor.employeeId } },
    { table: 'chiTietHoaDonTM', kind: 'create', value: { MaHDTM: 'TM01', MaKhungGia: bracket, SoLuong: 1, DonGia: 100000, ThanhTien: 100000 } },
    { table: 'sanPham', kind: 'create', value: { MaSP: 'SP01', TenSP: 'Áo lịch sử', NgayNhapKho: '2026-11-10', GiaGocChuKyGiam: 150000, GiaBanHienHanh: 150000, TrangThai: 0, NgayBatDauChuKyGiam: '2026-11-10', MaHDTM: 'TM01', MaKhungGia: bracket } },
    { table: 'productCosts', kind: 'create', value: { MaSP: 'SP01', MaHDTM: 'TM01', MaKhungGia: bracket, unitCost: 100000, recordedAt: '2026-11-10T12:00:00+07:00' } },
    { table: 'hoaDonBanHang', kind: 'create', value: { MaHDBH: 'BH01', NgayBan: '2026-11-11T12:00:00+07:00', TongTien: 150000, TienKhuyenMai: 0, TichDiem: 15, PTTT: 0, TrangThai: 0, MaKH: id, MaNV: actor.employeeId } },
    { table: 'chiTietHoaDonBH', kind: 'create', value: { MaHDBH: 'BH01', MaSP: 'SP01', SoLuong: 1, DonGia: 150000, ThanhTien: 150000 } },
  ] });
  const customer = await gateway.customer(id);
  await gateway.updateCustomer(id, customer.version, { ...input, phone: '0111111111' });
  expect((await gateway.history(id,'purchases')).rows.map(r=>r.id)).toEqual(['BH01']);
  expect((await gateway.history(id,'sales')).rows.map(r=>r.id)).toEqual(['TM01']);
  expect((await gateway.invoice(id,'purchases','BH01')).lines[0]).toMatchObject({ name: 'Áo lịch sử', total: 150000 });
  expect((await gateway.invoice(id,'sales','TM01')).total).toBe(100000);
  const otherCustomer = await gateway.createCustomer({ ...input, phone: '0222222222' });
  await expect(gateway.invoice(otherCustomer,'purchases','BH01')).rejects.toMatchObject({ code: 'NOT_FOUND' });
  await expect(gateway.deleteCustomer(id, (await gateway.customer(id)).version, true)).rejects.toMatchObject({ code: 'HAS_HISTORY' });
  const before = await gateway.bracket(bracket);
  await gateway.updateBracket(bracket, before.version, { ...bracketInput, min: '200000', max: '300000' });
  expect((await gateway.invoice(id,'sales','TM01')).lines[0].unitPrice).toBe(100000);
  expect((await database.productCosts.get('SP01'))?.unitCost).toBe(100000);
});

it('uses only the approved numeric condition codes for new brackets, including create/edit/unique', async () => {
  expect(CONDITIONS).toEqual([{ code: 3, label: 'Mới' },{ code: 2, label: 'Tốt' },{ code: 1, label: 'Khá' }]);
  const id = await gateway.createBracket(bracketInput);
  expect((await gateway.bracket(id)).record.TinhTrang).toBe(2);
  expect((await gateway.bracket(id)).conditionLabel).toBe('Tốt');
  await expect(gateway.createBracket(bracketInput)).rejects.toMatchObject({ code: 'DUPLICATE' });
  await gateway.updateBracket(id, 1, { ...bracketInput, condition: '3' });
  expect((await gateway.bracket(id)).conditionLabel).toBe('Mới');
  const fair = await gateway.createBracket({ ...bracketInput, condition: '1' });
  expect((await gateway.bracket(fair)).record.TinhTrang).toBe(1);
  await expect(gateway.updateBracket(id, 2, { ...bracketInput, condition: '1' })).rejects.toMatchObject({ code: 'DUPLICATE' });
  expect((await gateway.brackets(1,3)).total).toBe(1);
  expect((await gateway.brackets(1,2)).total).toBe(0);
  await expect(gateway.brackets(1,90)).rejects.toMatchObject({ code: 'VALIDATION' });
  await expect(gateway.updateBracket(id, 1, bracketInput)).rejects.toMatchObject({ code: 'CONFLICT' });
});

it.each(['0','4','90','Tốt','2.5'])('rejects unapproved condition input %s without storing it', async condition => {
  await expect(gateway.createBracket({ ...bracketInput, condition })).rejects.toMatchObject({ code: 'CONDITION_MAPPING' });
  expect(await database.khungGiaThuMua.count()).toBe(0);
});

it('checks every required bracket field and integer Min/Max boundaries', () => {
  for (const key of Object.keys(bracketInput)) expect(() => validateBracket({ ...bracketInput, [key]: '' }, confirmedConditions)).toThrow();
  for (const data of [{ min: '0' },{ max: '-1' },{ min: '1.2' },{ min: '150001' },{ max: '9007199254740992' }]) expect(() => validateBracket({ ...bracketInput, ...data }, confirmedConditions)).toThrow();
  expect(validateBracket({ ...bracketInput, min: '150000' }, confirmedConditions).min).toBe(150000);
});

it.each([90, 2])('preserves untagged G2 condition %s and requires review before any reinterpretation', async condition => {
  const user = (await auth.session(token))!;
  await new CoCoRepository(database).commit({ id: 'legacy-bracket', changes: [{ table: 'khungGiaThuMua', kind: 'create', value: { MaKhungGia: 'KGOLD', LoaiSanPham: 'Cũ', ThuongHieu: 'Cũ', TinhTrang: condition, GiaMin: 1, GiaMax: 2, MaNV: user.employeeId } }] });
  expect((await gateway.bracket('KGOLD')).conditionLabel).toBe(`Chưa đối chiếu (mã ${condition})`);
  const before = await database.khungGiaThuMua.get('KGOLD');
  await expect(gateway.updateBracket('KGOLD',1,bracketInput)).rejects.toMatchObject({ code: 'CONDITION_MAPPING' });
  await expect(gateway.createBracket(bracketInput)).rejects.toMatchObject({ code: 'CONDITION_MAPPING' });
  expect(await database.khungGiaThuMua.get('KGOLD')).toEqual(before);
  expect(await database.appMetadata.get(conditionMetadataKey('KGOLD'))).toBeUndefined();
});

it('rolls back the condition adoption marker and business row when audit fails', async () => {
  const fail = () => { throw new Error('audit failure'); };
  database.auditEntries.hook('creating', fail);
  await expect(gateway.createBracket(bracketInput)).rejects.toThrow('audit failure');
  database.auditEntries.hook('creating').unsubscribe(fail);
  expect(await database.khungGiaThuMua.count()).toBe(0);
  expect((await database.appMetadata.toArray()).filter(m=>m.key.startsWith('condition-catalog:'))).toHaveLength(0);
});

it('removes registration metadata atomically only when the customer has no invoices', async () => {
  const id = await gateway.createCustomer(input);
  await new CoCoRepository(database).commit({ id: 'membership-fixture', changes: [{ table: 'memberships', kind: 'create', value: { MaKH: id, registeredAt: '2026-11-11T00:00:00Z', registeredBy: 'owner' } }] });
  await gateway.deleteCustomer(id,1,true);
  expect(await database.khachHang.get(id)).toBeUndefined(); expect(await database.memberships.get(id)).toBeUndefined();
});

it('supports staff customers but denies all bracket entry points and revoked sessions', async () => {
  const salt = randomHex(16), hash = await derivePassword('staff-test!',salt,600000);
  await new CoCoRepository(database).commit({ id: 'staff-fixture', changes: [
    { table: 'nhanVien', kind: 'create', value: { MaNV: 'NVSTAFF', HoTen: 'Nhân viên', SoDienThoai: '0900000002' } },
    { table: 'taiKhoan', kind: 'create', value: { TenDangNhap: 'staff', MaNV: 'NVSTAFF' } },
    { table: 'accountSecurity', kind: 'create', value: { TenDangNhap: 'staff', role: 'staff', active: true, passwordHash: hash, passwordSalt: salt, algorithm: 'PBKDF2-SHA-256', iterations: 600000 } },
  ] });
  const session = await auth.login('staff','staff-test!'), staff = new LocalReferenceData(database, () => session.token);
  await staff.createCustomer(input);
  for (const call of [() => staff.brackets(1), () => staff.bracket('missing'), () => staff.createBracket(bracketInput), () => staff.updateBracket('missing',1,bracketInput)]) await expect(call()).rejects.toMatchObject({ code: 'FORBIDDEN' });
  await auth.logout(session.token);
  await expect(staff.customers('',1)).rejects.toMatchObject({ code: 'AUTH_REQUIRED' });
});

it('paginates deterministically and clamps a deleted last page', async () => {
  for (let i = 0; i < 10; i++) await gateway.createCustomer({ name: `Khách ${i}`, phone: `09${String(i).padStart(8,'0')}` });
  const first = await gateway.customers('',1), second = await gateway.customers('',2);
  expect(first.rows).toHaveLength(9); expect(second.rows).toHaveLength(1); expect(second.pages).toBe(2);
  expect(second.requestedPage).toBe(2);
  await gateway.deleteCustomer(second.rows[0].record.MaKH, second.rows[0].version,true);
  const clamped=await gateway.customers('',2);
  expect(clamped.page).toBe(1); expect(clamped.requestedPage).toBe(2);
});
