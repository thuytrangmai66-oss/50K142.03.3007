import type { CoCoDatabase } from '../../db/schema';
import type { AuthSession, AuthState, AuthUser } from '../../domain/auth';
import { entitySchemas, identifier, recordSchemas } from '../../domain/records';
import { CoCoRepository, recordVersionKey, type Command } from '../../repositories';
import { hasPermission, type Permission } from '../permissions';
import { derivePassword, equalHash, PASSWORD_ITERATIONS, randomHex, sha256 } from './crypto';
import { AuthError } from './errors';

export interface BootstrapInput { fullName: string; phone: string; username: string; password: string }
const BOOTSTRAP_KEY = 'auth:bootstrap-completed';
const tokenPattern = /^[a-f0-9]{64}$/;

export class AuthService {
  private readonly repository: CoCoRepository;
  constructor(private readonly db: CoCoDatabase, private readonly now = () => new Date().toISOString()) {
    this.repository = new CoCoRepository(db, now);
  }

  private async isConfigured(): Promise<boolean> {
    return Boolean(await this.db.appMetadata.get(BOOTSTRAP_KEY)) ||
      (await this.db.accountSecurity.toArray()).some(account => account.role === 'owner');
  }

  /** DB-only query; safe to observe with liveQuery. No raw credential leaves it. */
  async state(tokenHash: string | null): Promise<AuthState> {
    return this.db.transaction('r', this.db.tables, async () => ({
      needsSetup: !await this.isConfigured(),
      user: tokenHash ? await this.inspectSession(tokenHash) : null,
    }));
  }

  async bootstrap(input: BootstrapInput): Promise<void> {
    if (typeof input.password !== 'string' || !input.password.trim()) throw new AuthError('REQUIRED');
    const employeeId = randomHex(5);
    const employee = entitySchemas.nhanVien.safeParse({ MaNV: employeeId, HoTen: input.fullName, SoDienThoai: input.phone });
    const account = entitySchemas.taiKhoan.safeParse({ TenDangNhap: typeof input.username === 'string' ? input.username.trim() : input.username, MaNV: employeeId });
    if (!employee.success || !account.success) throw new AuthError('INVALID_PROFILE');
    const salt = randomHex(16);
    const passwordHash = await derivePassword(input.password, salt, PASSWORD_ITERATIONS);
    await this.repository.commit({ id: `auth-bootstrap:${randomHex(16)}`, changes: [
      { table: 'nhanVien', kind: 'create', value: employee.data },
      { table: 'taiKhoan', kind: 'create', value: account.data },
      { table: 'accountSecurity', kind: 'create', value: {
        TenDangNhap: account.data.TenDangNhap, role: 'owner', active: true, passwordHash,
        passwordSalt: salt, algorithm: 'PBKDF2-SHA-256', iterations: PASSWORD_ITERATIONS,
      } },
    ] }, async () => {
      if (await this.isConfigured()) throw new AuthError('SETUP_COMPLETE');
      await this.db.appMetadata.add({ key: BOOTSTRAP_KEY, value: this.now() });
      return { username: account.data.TenDangNhap };
    });
  }

  async login(username: string, password: string): Promise<{ token: string; user: AuthUser }> {
    if (!username.trim() || !password.trim()) throw new AuthError('REQUIRED');
    const normalized = username.trim();
    const snapshot = await this.db.transaction('r', this.db.tables, async () => {
      const security = await this.db.accountSecurity.get(normalized);
      const parsed = recordSchemas.accountSecurity.safeParse(security);
      if (!parsed.success || !parsed.data.active) return undefined;
      const account = await this.db.taiKhoan.get(normalized);
      if (!account || !await this.db.nhanVien.get(account.MaNV)) return undefined;
      return { security: parsed.data, account, version: (await this.db.recordVersions.get(recordVersionKey('accountSecurity', normalized)))?.version ?? 0 };
    });
    // Same KDF cost for an unknown/inactive username; no account enumeration message.
    const candidate = await derivePassword(password, snapshot?.security.passwordSalt ?? '00'.repeat(16), snapshot?.security.iterations ?? PASSWORD_ITERATIONS);
    if (!snapshot || !equalHash(candidate, snapshot.security.passwordHash) || !identifier.safeParse(normalized).success) {
      throw new AuthError('INVALID_CREDENTIALS');
    }
    const token = randomHex(32);
    const tokenHash = await sha256(token);
    const auditId = `auth-login:${randomHex(16)}`;
    const user = await this.db.transaction('rw', this.db.tables, async () => {
      const parsed = recordSchemas.accountSecurity.safeParse(await this.db.accountSecurity.get(normalized));
      const current = parsed.success ? parsed.data : undefined;
      const account = await this.db.taiKhoan.get(normalized);
      const employee = account && await this.db.nhanVien.get(account.MaNV);
      const version = (await this.db.recordVersions.get(recordVersionKey('accountSecurity', normalized)))?.version ?? 0;
      if (!current || !current.active || JSON.stringify(current) !== JSON.stringify(snapshot.security) ||
        !account || account.MaNV !== snapshot.account.MaNV || !employee || version !== snapshot.version) {
        throw new AuthError('INVALID_CREDENTIALS');
      }
      const createdAt = this.now();
      await this.db.authSessions.add({ tokenHash, username: normalized, employeeId: account.MaNV, securityVersion: version, roleAtIssue: current.role, createdAt });
      await this.db.auditEntries.add({ id: auditId, actor: normalized, executedAt: createdAt, changed: ['auth:login'] });
      return { username: normalized, employeeId: account.MaNV, displayName: employee.HoTen, role: current.role };
    });
    return { token, user };
  }

  private async inspectSession(tokenHash: string): Promise<AuthUser | null> {
    if (!tokenPattern.test(tokenHash)) return null;
    const session = await this.db.authSessions.get(tokenHash);
    if (!session) return null;
    const account = await this.db.taiKhoan.get(session.username);
    const security = await this.db.accountSecurity.get(session.username);
    const employee = account && await this.db.nhanVien.get(account.MaNV);
    const version = (await this.db.recordVersions.get(recordVersionKey('accountSecurity', session.username)))?.version ?? 0;
    if (!security?.active || !account || !employee || security.role !== session.roleAtIssue ||
      account.MaNV !== session.employeeId || session.securityVersion !== version) return null;
    return { username: session.username, employeeId: account.MaNV, displayName: employee.HoTen, role: security.role };
  }

  private async requireSession(tokenHash: string, permission: Permission): Promise<AuthUser> {
    const user = await this.inspectSession(tokenHash);
    if (!user) throw new AuthError('AUTH_REQUIRED');
    if (!hasPermission(user.role, permission)) throw new AuthError('FORBIDDEN');
    return user;
  }

  private async digestToken(token: string): Promise<string> {
    if (!tokenPattern.test(token)) throw new AuthError('AUTH_REQUIRED');
    return sha256(token);
  }

  async session(token: string): Promise<AuthUser | null> {
    const hash = await this.digestToken(token);
    return this.db.transaction('r', this.db.tables, () => this.inspectSession(hash));
  }

  /** Business services pass a fixed permission and DB-only query, not UI role claims. */
  async readAuthorized<T>(token: string, permission: Permission, query: (user: AuthUser) => Promise<T>): Promise<T> {
    const hash = await this.digestToken(token);
    return this.db.transaction('r', this.db.tables, async () => query(await this.requireSession(hash, permission)));
  }

  /** Hash outside the write transaction; invoke the guard inside it for fresh
   * role/session/revocation checks. Candidate services bind a fixed permission.
   */
  async prepareTransactionGuard(token: string, permission: Permission): Promise<() => Promise<AuthUser>> {
    const hash = await this.digestToken(token);
    return () => this.requireSession(hash, permission);
  }

  async commitAuthorized(token: string, permission: Permission, command: Omit<Command, 'actor'>, validate?: (user: AuthUser) => Promise<void>) {
    const snapshot = structuredClone(command);
    const hash = await this.digestToken(token);
    return this.repository.commit({ ...snapshot, actor: undefined }, async () => {
      const user = await this.requireSession(hash, permission);
      // Defense in depth: a caller cannot relabel account/price/approval writes
      // as a public permission. Business-specific transition rules belong to
      // their fixed service methods in later phases.
      for (const change of snapshot.changes) {
        // A read-only permission must never authorize a write, even when a
        // future caller wires the wrong label into a business service.
        if (permission.endsWith('.read')) throw new AuthError('FORBIDDEN');
        if (['taiKhoan', 'nhanVien', 'accountSecurity', 'khungGiaThuMua'].includes(change.table) && user.role !== 'owner') throw new AuthError('FORBIDDEN');
        if (change.table === 'yeuCauPheDuyetGia' && change.kind !== 'create' && user.role !== 'owner') throw new AuthError('FORBIDDEN');
        if (change.table === 'discountApplications') throw new AuthError('FORBIDDEN');
      }
      await validate?.(user);
      return user;
    });
  }

  async logout(token: string): Promise<void> {
    const hash = await this.digestToken(token);
    const auditId = `auth-logout:${randomHex(16)}`;
    await this.db.transaction('rw', this.db.tables, async () => {
      const session: AuthSession | undefined = await this.db.authSessions.get(hash);
      if (!session) return;
      await this.db.authSessions.delete(hash);
      await this.db.auditEntries.add({ id: auditId, actor: session.username, executedAt: this.now(), changed: ['auth:logout'] });
    });
  }
}
