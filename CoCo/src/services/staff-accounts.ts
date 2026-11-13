import type { CoCoDatabase } from '../db/schema';
import { identifier } from '../domain/records';
import { CoCoRepository, RepositoryError, type Change } from '../repositories';
import { AuthService } from './auth/service';
import { AuthError } from './auth/errors';
import { derivePassword, PASSWORD_ITERATIONS, randomHex } from './auth/crypto';

export interface StaffProfile { name: string; phone: string; username: string }
export interface StaffCreateInput extends StaffProfile { password: string }
export interface StaffRevision { employee: number; account: number; security: number; username: string }
export interface StaffAccount extends StaffProfile { employeeId: string; revision: StaffRevision }
export interface StaffAccountsGateway {
  list(): Promise<StaffAccount[]>;
  detail(employeeId: string): Promise<StaffAccount>;
  create(input: StaffCreateInput): Promise<string>;
  update(employeeId: string, revision: StaffRevision, input: StaffProfile): Promise<void>;
  remove(employeeId: string, revision: StaffRevision, confirmed: boolean): Promise<void>;
}
export class StaffServiceError extends Error {
  constructor(public readonly code: 'VALIDATION' | 'DUPLICATE' | 'NOT_FOUND' | 'CONFLICT' | 'CONFIRMATION', message: string,
    public readonly fields: Partial<Record<keyof StaffCreateInput,string>> = {}) { super(message); this.name = 'StaffServiceError'; }
}
export const accountIdentityKey = (username: string) => `account-identity:${username}`;
const text = (value: unknown) => typeof value === 'string' ? value.trim() : '';
function validate(input: StaffProfile) {
  const name = text(input.name), phone = text(input.phone), username = text(input.username);
  const fields: Partial<Record<keyof StaffCreateInput,string>> = {};
  if (!name) fields.name = 'Họ tên không được để trống';
  else if (name.length > 50) fields.name = 'Họ tên không được vượt quá 50 ký tự';
  if (!phone) fields.phone = 'Số điện thoại không được để trống';
  else if (!/^\d{10}$/.test(phone)) fields.phone = 'Số điện thoại không hợp lệ';
  if (!username) fields.username = 'Tên đăng nhập không được để trống';
  else if (!identifier.safeParse(username).success) fields.username = 'Tên đăng nhập tối đa 10 ký tự và không chứa khoảng trắng';
  return { name, phone, username, fields };
}

export class StaffAccountsService implements StaffAccountsGateway {
  private readonly auth: AuthService;
  private readonly repo: CoCoRepository;
  constructor(private readonly db: CoCoDatabase, private readonly getToken: () => string | null) {
    this.auth = new AuthService(db); this.repo = new CoCoRepository(db);
  }
  private token() { return this.getToken() ?? ''; }
  private async snapshot(employeeId: string) {
    const accounts = await this.db.taiKhoan.where('MaNV').equals(employeeId).toArray();
    const matches = [];
    for (const account of accounts) {
      const security = await this.db.accountSecurity.get(account.TenDangNhap);
      if (security?.role === 'owner') throw new AuthError('FORBIDDEN');
      if (security?.active && security.role === 'staff') matches.push(account);
    }
    if (!matches.length) throw new StaffServiceError('NOT_FOUND','Tài khoản không tồn tại');
    if (matches.length !== 1) throw new StaffServiceError('CONFLICT','Nhân viên có nhiều tài khoản cần được đối chiếu.');
    const [employee, account, security] = await Promise.all([
      this.repo.get('nhanVien',employeeId), this.repo.get('taiKhoan',matches[0].TenDangNhap), this.repo.get('accountSecurity',matches[0].TenDangNhap),
    ]);
    if (!employee || !account || !security) throw new StaffServiceError('NOT_FOUND','Tài khoản không tồn tại');
    return { employee, account, security };
  }
  private dto(snapshot: Awaited<ReturnType<StaffAccountsService['snapshot']>>): StaffAccount {
    return { employeeId: snapshot.employee.record.MaNV, name: snapshot.employee.record.HoTen, phone: snapshot.employee.record.SoDienThoai,
      username: snapshot.account.record.TenDangNhap, revision: { employee: snapshot.employee.version, account: snapshot.account.version, security: snapshot.security.version, username: snapshot.account.record.TenDangNhap } };
  }
  list() {
    return this.auth.readAuthorized(this.token(),'staff.read',async () => {
      const records: StaffAccount[] = [];
      for (const security of await this.db.accountSecurity.toArray()) {
        if (!security.active || security.role !== 'staff') continue;
        const account = await this.db.taiKhoan.get(security.TenDangNhap);
        if (!account) throw new StaffServiceError('NOT_FOUND','Tài khoản không tồn tại');
        records.push(this.dto(await this.snapshot(account.MaNV)));
      }
      return records.sort((a,b)=>a.employeeId.localeCompare(b.employeeId));
    });
  }
  detail(employeeId: string) { return this.auth.readAuthorized(this.token(),'staff.read',async () => this.dto(await this.snapshot(employeeId))); }
  private async unique(profile: StaffProfile, employeeId?: string, currentUsername?: string) {
    const fields: Partial<Record<keyof StaffCreateInput,string>> = {};
    const phone = await this.db.nhanVien.where('SoDienThoai').equals(profile.phone).first();
    if (phone && phone.MaNV !== employeeId) fields.phone = 'Số điện thoại đã tồn tại';
    const account = await this.db.taiKhoan.get(profile.username), alias = await this.db.appMetadata.get(accountIdentityKey(profile.username));
    if ((account && account.TenDangNhap !== currentUsername) || (alias && alias.value !== employeeId)) fields.username = 'Tên đăng nhập đã tồn tại';
    if (Object.keys(fields).length) throw new StaffServiceError('DUPLICATE','Thông tin tài khoản đã tồn tại',fields);
  }
  private async checkRevision(employeeId: string, revision: StaffRevision) {
    const current = await this.snapshot(employeeId), actual = this.dto(current).revision;
    if (!revision || actual.employee !== revision.employee || actual.account !== revision.account || actual.security !== revision.security || actual.username !== revision.username) {
      throw new StaffServiceError('CONFLICT','Dữ liệu đã thay đổi ở tab khác. Vui lòng tải lại trước khi lưu.');
    }
  }
  private async commit(permission: 'staff.create' | 'staff.update' | 'staff.delete', changes: Change[], validate: () => Promise<void>) {
    try { await this.auth.commitAuthorized(this.token(),permission,{ id: `staff:${crypto.randomUUID()}`, changes },validate); }
    catch (cause) {
      if (cause instanceof RepositoryError && cause.code === 'CONFLICT') throw new StaffServiceError('CONFLICT','Dữ liệu đã thay đổi ở tab khác. Vui lòng tải lại trước khi lưu.');
      throw cause;
    }
  }
  async create(input: StaffCreateInput) {
    await this.auth.readAuthorized(this.token(),'staff.create',async user => user);
    const profile = validate(input), password = typeof input.password === 'string' ? input.password : '';
    if (!password.trim()) profile.fields.password = 'Mật khẩu không được để trống';
    if (Object.keys(profile.fields).length) throw new StaffServiceError('VALIDATION','Hãy kiểm tra thông tin tài khoản',profile.fields);
    const employeeId = `NV${randomHex(4)}`, salt = randomHex(16), passwordHash = await derivePassword(password,salt,PASSWORD_ITERATIONS);
    await this.commit('staff.create',[
      { table:'nhanVien',kind:'create',value:{ MaNV:employeeId,HoTen:profile.name,SoDienThoai:profile.phone } },
      { table:'taiKhoan',kind:'create',value:{ TenDangNhap:profile.username,MaNV:employeeId } },
      { table:'accountSecurity',kind:'create',value:{ TenDangNhap:profile.username,role:'staff',active:true,passwordHash,passwordSalt:salt,algorithm:'PBKDF2-SHA-256',iterations:PASSWORD_ITERATIONS } },
    ],async()=>{
      await this.unique(profile);
      await this.db.appMetadata.add({ key:accountIdentityKey(profile.username),value:employeeId });
    });
    return employeeId;
  }
  async update(employeeId: string, revision: StaffRevision, input: StaffProfile) {
    const profile = validate(input);
    const prepared = await this.auth.readAuthorized(this.token(),'staff.update',async () => {
      const current = await this.snapshot(employeeId);
      const old = current.account.record.TenDangNhap;
      const memberships = await Promise.all((await this.db.memberships.filter(row=>row.registeredBy === old).toArray()).map(row=>this.repo.get('memberships',row.MaKH)));
      const notifications = await Promise.all((await this.db.notifications.where('recipient').equals(old).toArray()).map(row=>this.repo.get('notifications',row.id)));
      return { ...current, old, memberships, notifications };
    });
    if (Object.keys(profile.fields).length) throw new StaffServiceError('VALIDATION','Hãy kiểm tra thông tin tài khoản',profile.fields);
    const rename = profile.username !== prepared.old;
    const changes: Change[] = [{ table:'nhanVien',kind:'update',expectedVersion:revision.employee,value:{ ...prepared.employee.record,HoTen:profile.name,SoDienThoai:profile.phone } }];
    if (rename) {
      changes.push(
        { table:'taiKhoan',kind:'delete',key:prepared.old,expectedVersion:revision.account },
        { table:'accountSecurity',kind:'delete',key:prepared.old,expectedVersion:revision.security },
        { table:'taiKhoan',kind:'create',value:{ ...prepared.account.record,TenDangNhap:profile.username } },
        { table:'accountSecurity',kind:'create',value:{ ...prepared.security.record,TenDangNhap:profile.username } },
      );
      for (const row of prepared.memberships) if (row) changes.push({ table:'memberships',kind:'update',expectedVersion:row.version,value:{ ...row.record,registeredBy:profile.username } });
      for (const row of prepared.notifications) if (row) changes.push({ table:'notifications',kind:'update',expectedVersion:row.version,value:{ ...row.record,recipient:profile.username } });
    }
    await this.commit('staff.update',changes,async()=>{
      await this.checkRevision(employeeId,revision); await this.unique(profile,employeeId,prepared.old);
      if (rename) {
        // A new reference created after preparation requires retry, never a lost link.
        const members = await this.db.memberships.filter(row=>row.registeredBy === prepared.old).primaryKeys();
        const notices = await this.db.notifications.where('recipient').equals(prepared.old).primaryKeys();
        if (members.length !== prepared.memberships.length || notices.length !== prepared.notifications.length || members.some(id=>!prepared.memberships.some(row=>row?.record.MaKH === id)) || notices.some(id=>!prepared.notifications.some(row=>row?.record.id === id))) throw new StaffServiceError('CONFLICT','Dữ liệu liên kết đã thay đổi. Vui lòng tải lại trước khi lưu.');
        await this.db.appMetadata.put({ key:accountIdentityKey(prepared.old),value:employeeId });
        await this.db.appMetadata.put({ key:accountIdentityKey(profile.username),value:employeeId });
        await this.db.authSessions.filter(session=>session.employeeId === employeeId).delete();
      }
    });
  }
  async remove(employeeId: string, revision: StaffRevision, confirmed: boolean) {
    const current = await this.auth.readAuthorized(this.token(),'staff.delete',async()=>this.snapshot(employeeId));
    if (!confirmed) throw new StaffServiceError('CONFIRMATION','Cần xác nhận trước khi xóa tài khoản.');
    await this.commit('staff.delete',[{ table:'accountSecurity',kind:'update',expectedVersion:revision.security,value:{ ...current.security.record,active:false } }],async()=>{
      await this.checkRevision(employeeId,revision);
      await this.db.appMetadata.put({ key:accountIdentityKey(current.account.record.TenDangNhap),value:employeeId });
      await this.db.authSessions.filter(session=>session.employeeId === employeeId).delete();
    });
  }
}
