import Dexie from 'dexie';
import { pbkdf2Sync } from 'node:crypto';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { CoCoDatabase } from '../../src/db/schema';
import { CoCoRepository, recordVersionKey, type Command } from '../../src/repositories';
import { AuthService } from '../../src/services/auth/service';
import * as passwordCrypto from '../../src/services/auth/crypto';
import { hasPermission, type Permission } from '../../src/services/permissions';
import { PHASE_2_STORES } from '../fixtures/phase2-schema';

const profile = { username: 'owner', fullName: 'Chủ kiểm thử', phone: '0900000001', password: 'only-for-tests!' };
const now = () => '2026-11-11T01:00:00.000Z';
let database: CoCoDatabase;
let auth: AuthService;
let repo: CoCoRepository;
beforeEach(() => { database = new CoCoDatabase('CoCoPhase3AuthTests'); auth = new AuthService(database, now); repo = new CoCoRepository(database, now); });
afterEach(async () => { vi.restoreAllMocks(); await database.delete(); });

async function createStaff() {
  const salt = passwordCrypto.randomHex(16);
  const passwordHash = await passwordCrypto.derivePassword('staff-test!', salt, 600_000);
  await repo.commit({ id: 'staff-test-fixture', changes: [
    { table: 'nhanVien', kind: 'create', value: { MaNV: 'NVSTAFF', HoTen: 'Nhân viên kiểm thử', SoDienThoai: '0900000002' } },
    { table: 'taiKhoan', kind: 'create', value: { TenDangNhap: 'staff', MaNV: 'NVSTAFF' } },
    { table: 'accountSecurity', kind: 'create', value: { TenDangNhap: 'staff', role: 'staff', active: true, passwordSalt: salt, passwordHash, algorithm: 'PBKDF2-SHA-256', iterations: 600_000 } },
  ] });
  return auth.login('staff', 'staff-test!');
}

it('matches independent native PBKDF2 SHA-256 and uses fresh random salts', async () => {
  const a = passwordCrypto.randomHex(16); const b = passwordCrypto.randomHex(16);
  expect(a).not.toBe(b);
  const actual = await passwordCrypto.derivePassword('unicode mật khẩu', a, 600_000);
  const expected = pbkdf2Sync('unicode mật khẩu', Buffer.from(a, 'hex'), 600_000, 32, 'sha256').toString('hex');
  expect(actual).toBe(expected);
  expect(passwordCrypto.equalHash(actual, '0'.repeat(64))).toBe(false);
});

it('migrates the frozen v2 database to v4, preserving business and metadata without accounts or sessions', async () => {
  const old = new Dexie(database.name); old.version(2).stores(PHASE_2_STORES);
  await old.table('appMetadata').put({ key: 'sentinel', value: 'keep' });
  await old.table('khachHang').put({ MaKH: 'KHOLD', TenKH: 'Dữ liệu G2', SoDienThoaiKH: '0123456789', DiemTichLuy: 50 });
  old.close(); await database.open();
  expect(database.verno).toBe(4);
  expect(database.tables).toHaveLength(27);
  expect((await database.khachHang.get('KHOLD'))?.DiemTichLuy).toBe(50);
  expect((await database.appMetadata.get('sentinel'))?.value).toBe('keep');
  expect(await auth.state(null)).toEqual({ needsSetup: true, user: null });
  expect(await database.taiKhoan.count()).toBe(0);
  expect(await database.authSessions.count()).toBe(0);
});

it('bootstraps once with caller-entered credentials, hash/salt and atomic evidence', async () => {
  await auth.bootstrap(profile);
  expect(await auth.state(null)).toEqual({ needsSetup: false, user: null });
  expect(await database.nhanVien.count()).toBe(1);
  expect(await database.taiKhoan.count()).toBe(1);
  const security = (await database.accountSecurity.toArray())[0];
  expect(security).toMatchObject({ role: 'owner', active: true, iterations: 600_000 });
  expect(security.passwordHash).toHaveLength(64); expect(security.passwordSalt).toHaveLength(32);
  expect(JSON.stringify(await database.taiKhoan.toArray())).not.toContain('MatKhau');
  expect(JSON.stringify(await database.accountSecurity.toArray())).not.toContain(profile.password);
  expect(await database.recordVersions.count()).toBe(3);
  expect(await database.operations.count()).toBe(1);
  expect((await database.auditEntries.toArray())[0].actor).toBe(profile.username);
  await expect(auth.bootstrap({ ...profile, username: 'owner2', phone: '0900000003' })).rejects.toMatchObject({ code: 'SETUP_COMPLETE' });
});

it('serializes simultaneous bootstrap from two connections into exactly one owner', async () => {
  const second = new CoCoDatabase(database.name);
  try {
    const results = await Promise.allSettled([auth.bootstrap(profile), new AuthService(second, now).bootstrap({ ...profile, username: 'other', phone: '0900000002' })]);
    expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
    const rejected = results.find(r => r.status === 'rejected');
    expect(rejected?.status === 'rejected' && rejected.reason.code).toBe('SETUP_COMPLETE');
    expect(await database.accountSecurity.count()).toBe(1);
    expect(await database.operations.count()).toBe(1);
    expect(await database.auditEntries.count()).toBe(1);
  } finally { second.close(); }
});

it('rolls back bootstrap marker and all account rows if audit write fails, then allows retry', async () => {
  const fail = () => { throw new Error('auth-audit-failure'); };
  database.auditEntries.hook('creating', fail);
  await expect(auth.bootstrap(profile)).rejects.toThrow('auth-audit-failure');
  for (const table of database.tables) expect(await table.count()).toBe(0);
  database.auditEntries.hook('creating').unsubscribe(fail);
  await auth.bootstrap(profile);
  expect((await auth.state(null)).needsSetup).toBe(false);
});

it.each([
  { ...profile, phone: '123' }, { ...profile, username: 'longlonglong' }, { ...profile, fullName: ' ' },
])('rejects malformed bootstrap profile without partial data %#', async input => {
  await expect(auth.bootstrap(input)).rejects.toMatchObject({ code: 'INVALID_PROFILE' });
  expect(await database.taiKhoan.count()).toBe(0);
});

it.each([['', 'password'], ['owner', ''], [' ', ' ']])('reports missing login input before writing %#', async (username, password) => {
  await expect(auth.login(username, password)).rejects.toMatchObject({ code: 'REQUIRED' });
  expect(await database.authSessions.count()).toBe(0);
});

it('does not distinguish unknown username, wrong password or inactive account and issues no session', async () => {
  await auth.bootstrap(profile);
  for (const [username, password] of [['missing', profile.password], [profile.username, 'wrong']]) {
    await expect(auth.login(username, password)).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS', message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
  }
  await database.accountSecurity.update('owner', { active: false });
  await expect(auth.login('owner', profile.password)).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
  expect(await database.authSessions.count()).toBe(0);
  expect((await auth.state(null)).needsSetup).toBe(false);
});

it('logs in with an opaque token, persists only its hash, reloads session and revokes it on logout', async () => {
  await auth.bootstrap(profile);
  const result = await auth.login(profile.username, profile.password);
  expect(result.user).toMatchObject({ username: 'owner', displayName: profile.fullName, role: 'owner' });
  expect(result.token).toMatch(/^[a-f0-9]{64}$/);
  const session = (await database.authSessions.toArray())[0];
  expect(session.tokenHash).not.toBe(result.token);
  expect(JSON.stringify(session)).not.toContain(profile.password);
  expect(JSON.stringify(result.user)).not.toMatch(/passwordHash|passwordSalt|iterations/);
  database.close(); await database.open();
  expect(await auth.session(result.token)).toEqual(result.user);
  expect(await auth.session(session.tokenHash)).toBeNull();
  await auth.logout(result.token); await auth.logout(result.token);
  expect(await auth.session(result.token)).toBeNull();
  await expect(auth.readAuthorized(result.token, 'home.read', async user => user)).rejects.toMatchObject({ code: 'AUTH_REQUIRED' });
});

it('checks fresh role/active/version on every service call across connections', async () => {
  const { token } = await createStaff();
  await expect(auth.readAuthorized(token, 'reports.read', async user => user)).rejects.toMatchObject({ code: 'FORBIDDEN' });
  expect((await auth.readAuthorized(token, 'customers.read', async user => user)).role).toBe('staff');
  const other = new CoCoDatabase(database.name);
  try { await other.accountSecurity.update('staff', { active: false }); } finally { other.close(); }
  await expect(auth.readAuthorized(token, 'customers.read', async user => user)).rejects.toMatchObject({ code: 'AUTH_REQUIRED' });
});

it('revokes role-changed and credential-version-changed sessions', async () => {
  const { token } = await createStaff();
  await database.accountSecurity.update('staff', { role: 'owner' });
  expect(await auth.session(token)).toBeNull();
  await database.accountSecurity.update('staff', { role: 'staff' });
  const login = await auth.login('staff', 'staff-test!');
  const key = recordVersionKey('accountSecurity', 'staff');
  await database.recordVersions.put({ key, version: 2, updatedAt: now() });
  expect(await auth.session(login.token)).toBeNull();
});

it('binds write guards to the same transaction, ignores forged actor and rechecks permission on replay', async () => {
  const { token } = await createStaff();
  const command: Command = { id: 'authorized-customer', actor: 'owner', changes: [
    { table: 'khachHang', kind: 'create', value: { MaKH: 'KHAUTH', TenKH: 'Khách', SoDienThoaiKH: '0111111111', DiemTichLuy: 0 } },
  ] };
  await auth.commitAuthorized(token, 'customers.create', command);
  expect((await database.auditEntries.get(command.id))?.actor).toBe('staff');
  expect((await auth.commitAuthorized(token, 'customers.create', command)).duplicate).toBe(true);
  await database.accountSecurity.update('staff', { active: false });
  await expect(auth.commitAuthorized(token, 'customers.create', command)).rejects.toMatchObject({ code: 'AUTH_REQUIRED' });
  expect(await database.khachHang.count()).toBe(1);
});

it('rejects staff relabeling account writes as public permission with no partial write', async () => {
  const { token } = await createStaff();
  const security = (await database.accountSecurity.get('staff'))!;
  await expect(auth.commitAuthorized(token, 'home.read', { id: 'fake-role', changes: [
    { table: 'accountSecurity', kind: 'update', expectedVersion: 1, value: { ...security, role: 'owner' } },
  ] })).rejects.toMatchObject({ code: 'FORBIDDEN' });
  expect((await database.accountSecurity.get('staff'))?.role).toBe('staff');
  expect(await database.operations.get('fake-role')).toBeUndefined();
});

it('does not allow a read permission to authorize a mutation, even for the owner', async () => {
  await auth.bootstrap(profile);
  const { token } = await auth.login(profile.username, profile.password);
  await expect(auth.commitAuthorized(token, 'home.read', { id: 'read-is-not-write', changes: [
    { table: 'khachHang', kind: 'create', value: { MaKH: 'KHNO', TenKH: 'Khách', SoDienThoaiKH: '0111111111', DiemTichLuy: 0 } },
  ] })).rejects.toMatchObject({ code: 'FORBIDDEN' });
  expect(await database.khachHang.count()).toBe(0);
  expect(await database.operations.get('read-is-not-write')).toBeUndefined();
});

it('rolls back a newly issued session if login audit cannot be written', async () => {
  await auth.bootstrap(profile);
  const before = await database.auditEntries.count();
  const fail = () => { throw new Error('login-audit-failure'); };
  database.auditEntries.hook('creating', fail);
  await expect(auth.login(profile.username, profile.password)).rejects.toThrow('login-audit-failure');
  database.auditEntries.hook('creating').unsubscribe(fail);
  expect(await database.authSessions.count()).toBe(0);
  expect(await database.auditEntries.count()).toBe(before);
  expect((await auth.login(profile.username, profile.password)).user.role).toBe('owner');
});

it('keeps the session if logout audit fails, then revokes it atomically on retry', async () => {
  await auth.bootstrap(profile);
  const { token } = await auth.login(profile.username, profile.password);
  const before = await database.auditEntries.count();
  const fail = () => { throw new Error('logout-audit-failure'); };
  database.auditEntries.hook('creating', fail);
  await expect(auth.logout(token)).rejects.toThrow('logout-audit-failure');
  database.auditEntries.hook('creating').unsubscribe(fail);
  expect((await auth.session(token))?.username).toBe(profile.username);
  expect(await database.auditEntries.count()).toBe(before);
  await auth.logout(token);
  expect(await auth.session(token)).toBeNull();
  expect((await database.auditEntries.toArray()).filter(entry => entry.changed.includes('auth:logout'))).toHaveLength(1);
});

it('rejects login if account changes while password derivation is in flight', async () => {
  await auth.bootstrap(profile);
  const original = passwordCrypto.derivePassword;
  let release!: () => void; let reached!: () => void;
  const barrier = new Promise<void>(resolve => { release = resolve; });
  const started = new Promise<void>(resolve => { reached = resolve; });
  vi.spyOn(passwordCrypto, 'derivePassword').mockImplementationOnce(async (...args) => { reached(); await barrier; return original(...args); });
  const pending = auth.login('owner', profile.password);
  const rejection = expect(pending).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
  await started;
  await database.accountSecurity.update('owner', { active: false });
  release(); await rejection;
  expect(await database.authSessions.count()).toBe(0);
});

it('enforces the SRS owner-only permission contract without a system-run permission in UI', () => {
  const ownerOnly: Permission[] = ['price-brackets.read', 'price-brackets.create', 'price-brackets.update', 'approvals.read', 'approvals.decide', 'reports.read', 'staff.read', 'staff.create', 'staff.update', 'staff.delete'];
  for (const permission of ownerOnly) { expect(hasPermission('staff', permission)).toBe(false); expect(hasPermission('owner', permission)).toBe(true); }
  for (const permission of ['purchases.read','purchases.create','sales.create','inventory.update','customers.create','discounts.read'] as const) expect(hasPermission('staff', permission)).toBe(true);
});
