import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { CLOUD_STORE_KEYS } from '../../src/cloud/repository';
import { login } from './auth-helpers';

// HTTP/Auth/Realtime transport fixtures only. These tests do not claim to test
// PostgreSQL RLS, a real Supabase deployment, or successful business finalization.
const password = 'cloud-fixture-only!';
const identities = {
  owner: { id: '11111111-1111-4111-8111-111111111111', email: 'owner@cloud-test.invalid', employeeId: 'NVOWNER', displayName: 'Chủ cloud kiểm thử' },
  staff: { id: '22222222-2222-4222-8222-222222222222', email: 'staff@cloud-test.invalid', employeeId: 'NVSTAFF', displayName: 'Nhân viên cloud kiểm thử' },
} as const;
type Role = keyof typeof identities;
function encode(value: unknown) { return Buffer.from(JSON.stringify(value)).toString('base64url'); }
function authUser(role: Role) {
  const user = identities[role], at = '2026-11-15T10:00:00Z';
  return { id: user.id, aud: 'authenticated', role: 'authenticated', email: user.email, email_confirmed_at: at,
    phone: '', app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {}, identities: [], created_at: at, updated_at: at };
}
function authSession(role: Role) {
  const now = Math.floor(Date.now() / 1000), user = authUser(role);
  return { access_token: `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: user.id, aud: 'authenticated', role: 'authenticated', email: user.email, iat: now, exp: now + 3600 })}.ZmFrZQ`,
    token_type: 'bearer', expires_in: 3600, expires_at: now + 3600, refresh_token: `fixture-refresh-${role}`, user };
}
function bearerRole(header: string | null): Role | undefined {
  try {
    const subject = JSON.parse(Buffer.from((header ?? '').replace(/^Bearer /, '').split('.')[1], 'base64url').toString()).sub;
    return (Object.keys(identities) as Role[]).find(role => identities[role].id === subject);
  } catch { return undefined; }
}
async function mockCloud(context: BrowserContext, schemaAvailable = true) {
  const calls: { rpc: string; role?: Role; method?: string; service?: string }[] = [];
  const unknown: string[] = [];
  const empty = Object.fromEntries(Object.keys(CLOUD_STORE_KEYS).map(name => [name, []]));
  await context.route(/\/((?:rest|auth|functions)\/v1)\//, async route => {
    const request = route.request(), url = new URL(request.url()), role = bearerRole(request.headers().authorization ?? null);
    const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS' };
    const reply = (json: unknown, status = 200) => route.fulfill({ json, status, headers });
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    const body = request.postDataJSON() as Record<string, unknown> | null;
    if (url.pathname === '/functions/v1/auth-login') {
      calls.push({ rpc: 'auth-login' });
      const candidate = body?.username;
      return (candidate === 'owner' || candidate === 'staff') && body?.password === password
        ? reply({ session: authSession(candidate) }) : reply({ message: 'Tên đăng nhập hoặc mật khẩu không đúng' }, 401);
    }
    if (url.pathname === '/auth/v1/token') {
      const authenticated = (Object.keys(identities) as Role[]).find(candidate => identities[candidate].email === body?.email && body?.password === password || body?.refresh_token === `fixture-refresh-${candidate}`);
      return authenticated ? reply(authSession(authenticated)) : reply({ error: 'invalid_grant', error_description: 'Invalid test credentials' }, 400);
    }
    if (url.pathname === '/auth/v1/user') return role ? reply(authUser(role)) : reply({ message: 'No test session' }, 401);
    if (url.pathname === '/auth/v1/logout') return route.fulfill({ status: 204, headers });
    if (url.pathname.startsWith('/rest/v1/rpc/')) {
      const rpc = url.pathname.split('/').at(-1)!; calls.push({ rpc, role, service: body?.p_service as string, method: body?.p_method as string });
      if (rpc === 'coco_schema_version') return schemaAvailable ? reply(1) : reply({ code: 'PGRST202', message: 'Function not found in fixture schema' }, 404);
      if (!role) return reply({ code: '42501', message: 'AUTH_REQUIRED: fixture session required' }, 401);
      if (rpc === 'coco_identity') return reply({ user: { username: role, employeeId: identities[role].employeeId, displayName: identities[role].displayName, role } });
      if (rpc === 'coco_snapshot') return reply(empty);
      if (rpc === 'coco_service' && body?.p_service === 'discounts' && body?.p_method === 'runDue') return reply({});
    }
    unknown.push(`${request.method()} ${url.pathname}`); return reply({ message: 'Unexpected test transport request' }, 501);
  });
  // Keep the real SDK channel lifecycle; acknowledge Phoenix messages locally.
  // Never connectToServer(), so no test opens a real Supabase WebSocket.
  await context.routeWebSocket(/\/realtime\/v1\/websocket/, socket => {
    socket.onMessage(raw => {
      const message = JSON.parse(String(raw));
      if (Array.isArray(message)) {
        const [joinRef, ref, topic, event] = message;
        if (['phx_join', 'phx_leave', 'heartbeat'].includes(event)) socket.send(JSON.stringify([joinRef, ref, topic, 'phx_reply', { status: 'ok', response: { postgres_changes: [] } }]));
      } else if (['phx_join', 'phx_leave', 'heartbeat'].includes(message.event)) socket.send(JSON.stringify({ topic: message.topic, event: 'phx_reply', payload: { status: 'ok', response: { postgres_changes: [] } }, ref: message.ref, join_ref: message.join_ref }));
    });
  });
  return { calls, unknown };
}
async function sessionSubject(page: Page) {
  return page.evaluate(() => {
    const key = Object.keys(sessionStorage).find(name => name.startsWith('coco:cloud-session:'));
    if (!key) return null;
    const session = JSON.parse(sessionStorage.getItem(key)!);
    return JSON.parse(atob(session.access_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).sub as string;
  });
}

test('cloud schema missing fails truthfully before login and does not create IndexedDB or bootstrap an owner', async ({ page, context }, info) => {
  const mock = await mockCloud(context, false); await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Chưa thể mở CoCo cloud', exact: true })).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('supabase/migration_all.sql');
  await expect(page.getByRole('button', { name: 'Tạo tài khoản chủ', exact: true })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Đăng nhập', exact: true })).toHaveCount(0);
  expect(await page.evaluate(async () => (await indexedDB.databases()).some(database => database.name === 'CoCoDB'))).toBe(false);
  expect(mock.calls.every(call => call.rpc === 'coco_schema_version')).toBe(true); expect(mock.unknown).toEqual([]);
  await page.screenshot({ path: info.outputPath('cloud-schema-missing.png') });
});

test('healthy cloud presents the existing login UI without local setup or business reads before authentication', async ({ page, context }, info) => {
  const mock = await mockCloud(context); await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Đăng nhập', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Thiết lập chủ cửa hàng', exact: true })).toHaveCount(0);
  await expect(page.getByLabel('Tên đăng nhập:', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Mật khẩu:', { exact: true })).toBeVisible();
  expect(mock.calls.every(call => call.rpc === 'coco_schema_version')).toBe(true); expect(mock.unknown).toEqual([]);
  expect(await page.evaluate(async () => (await indexedDB.databases()).some(database => database.name === 'CoCoDB'))).toBe(false);
  await page.screenshot({ path: info.outputPath('cloud-existing-login.png') });
});

test('mocked cloud Auth keeps owner/staff sessions independent through reload and renders the server role menus', async ({ page, context }, info) => {
  const errors: string[] = []; context.on('page', tab => tab.on('pageerror', error => errors.push(error.message)));
  page.on('pageerror', error => errors.push(error.message));
  const mock = await mockCloud(context); await page.goto('./'); await login(page, 'owner', password);
  await expect(page.locator('.home-kpis[aria-label="KPI Chủ cửa hàng"]')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Phê duyệt', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Backup / Nhập dữ liệu', exact: true })).toBeVisible();
  const staff = await context.newPage(); await staff.goto('./'); await login(staff, 'staff', password);
  await expect(staff.locator('.home-kpis[aria-label="KPI Nhân viên"]')).toBeVisible();
  for (const menu of ['Phê duyệt', 'Báo cáo', 'Nhân viên', 'Khung giá thu mua']) await expect(staff.getByRole('link', { name: menu, exact: true })).toHaveCount(0);
  await expect(staff.getByRole('button', { name: 'Backup / Nhập dữ liệu', exact: true })).toHaveCount(0);
  expect(await sessionSubject(page)).toBe(identities.owner.id); expect(await sessionSubject(staff)).toBe(identities.staff.id);
  await page.reload(); await staff.reload();
  await expect(page.locator('.home-kpis[aria-label="KPI Chủ cửa hàng"]')).toBeVisible();
  await expect(staff.locator('.home-kpis[aria-label="KPI Nhân viên"]')).toBeVisible();
  expect(await sessionSubject(page)).toBe(identities.owner.id); expect(await sessionSubject(staff)).toBe(identities.staff.id);
  await page.screenshot({ path: info.outputPath('cloud-owner-after-reload.png') });
  await staff.screenshot({ path: info.outputPath('cloud-staff-after-reload.png') });
  await staff.goto('./#/approvals'); await expect(staff.getByRole('heading', { name: 'Không có quyền truy cập', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Đăng nhập', exact: true })).toBeVisible();
  expect(await sessionSubject(page)).toBeNull(); expect(await sessionSubject(staff)).toBe(identities.staff.id);
  await staff.goto('./'); await expect(staff.locator('.home-kpis[aria-label="KPI Nhân viên"]')).toBeVisible();
  expect(mock.calls.some(call => call.rpc === 'coco_auth_email')).toBe(false);
  expect(mock.unknown).toEqual([]); expect(errors).toEqual([]);
});

test('cloud offline warning is truthful and reconnect refetches the current server snapshot', async ({ page, context }, info) => {
  const mock = await mockCloud(context); await page.goto('./'); await login(page, 'owner', password);
  await expect(page.locator('.home-kpis[aria-label="KPI Chủ cửa hàng"]')).toBeVisible();
  await context.setOffline(true);
  await expect(page.locator('.cloud-connection-notice')).toContainText('Mất kết nối mạng');
  const before = mock.calls.filter(call => call.rpc === 'coco_snapshot').length;
  await page.screenshot({ path: info.outputPath('cloud-offline-warning.png') });
  await context.setOffline(false);
  await expect(page.locator('.cloud-connection-notice')).toHaveCount(0);
  await expect.poll(() => mock.calls.filter(call => call.rpc === 'coco_snapshot').length).toBeGreaterThan(before);
  await expect(page.locator('.home-kpis[aria-label="KPI Chủ cửa hàng"]')).toBeVisible();
  expect(mock.calls.filter(call => call.service && call.service !== 'discounts')).toEqual([]);
  expect(mock.unknown).toEqual([]);
});
