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
  const empty: Record<string, Record<string, unknown>[]> = Object.fromEntries(Object.keys(CLOUD_STORE_KEYS).map(name => [name, []]));
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
  return { calls, unknown, stores: empty };
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

async function openBracketForm(page: Page, brand = 'CoCo', condition = '2') {
  await page.goto('./#/price-brackets');
  await page.getByRole('button', { name: 'Tạo khung giá', exact: true }).click();
  const form = page.getByRole('dialog', { name: 'Tạo khung giá thu mua', exact: true });
  for (const [label, value] of [['Loại hàng', 'Áo'], ['Thương hiệu', brand], ['Giá tối thiểu (Min)', '50000'], ['Giá tối đa (Max)', '100000']]) await form.getByLabel(label, { exact: true }).fill(value);
  await form.getByLabel('Độ mới', { exact: true }).selectOption(condition);
  return form;
}

function bracketTransport() {
  const rows: Record<string, unknown>[] = [];
  let error: { code: string; message: string } | undefined;
  async function install(context: BrowserContext) {
    const mock = await mockCloud(context);
    mock.stores.khungGiaThuMua = rows;
    await context.route('**/rest/v1/rpc/coco_service', async route => {
      if (route.request().method() !== 'POST') return route.fallback();
      const body = route.request().postDataJSON();
      if (body.p_service !== 'referenceData' || body.p_method !== 'createBracket') return route.fallback();
      const headers = { 'access-control-allow-origin': '*' };
      if (error) { const saved = error; error = undefined; return route.fulfill({ status: 400, json: saved, headers }); }
      const input = body.p_payload.args[0];
      if (Number(input.min) > Number(input.max)) return route.fulfill({ status: 400, headers, json: { code: 'P0001', message: 'VALIDATION: Min lớn hơn Max' } });
      if (rows.some(row => row.LoaiSanPham === input.productType && row.ThuongHieu === input.brand && row.TinhTrang === Number(input.condition)))
        return route.fulfill({ status: 409, headers, json: { code: '23505', message: 'duplicate key value violates unique constraint "coco_bracket_identity"' } });
      const id = `KG${String(rows.length + 1).padStart(8, '0')}`;
      rows.push({ MaKhungGia: id, LoaiSanPham: input.productType, ThuongHieu: input.brand, TinhTrang: Number(input.condition), GiaMin: Number(input.min), GiaMax: Number(input.max), MaNV: identities.owner.employeeId });
      mock.stores.appMetadata.push({ key: `condition-catalog:${id}`, value: 'coco:conditions:2026-11-11' });
      return route.fulfill({ headers, json: id });
    });
  }
  return { rows, install, failNext: (failure: NonNullable<typeof error>) => { error = failure; } };
}

for (const edit of [false, true]) test(`mocked cloud Auth: customer ${edit ? 'update' : 'create'} duplicate phone uses Figma inline error and retains the form`, async ({ page, context }, info) => {
  const mock = await mockCloud(context);
  mock.stores.khachHang.push({ MaKH: 'KH00000001', TenKH: 'Khách kiểm thử', SoDienThoaiKH: '0900000001', DiemTichLuy: 0 });
  await context.route('**/rest/v1/rpc/coco_service', route => {
    if (route.request().method() !== 'POST' || route.request().postDataJSON().p_service !== 'referenceData') return route.fallback();
    return route.fulfill({ status: 409, headers: { 'access-control-allow-origin': '*' }, json: { code: '23505', message: 'duplicate key value violates unique constraint "coco_customer_phone"' } });
  });
  await page.goto('./'); await login(page, 'owner', password);
  await page.goto(edit ? './#/customers/KH00000001' : './#/customers');
  await page.getByRole('button', { name: edit ? 'Sửa thông tin' : 'Tạo tài khoản', exact: true }).click();
  const form = page.getByRole('dialog', { name: edit ? 'Sửa thông tin khách hàng' : 'Tạo thông tin khách hàng', exact: true });
  await form.getByLabel('Họ tên', { exact: true }).fill('Khách kiểm thử'); await form.getByLabel('Số điện thoại', { exact: true }).fill('0900000001');
  await form.getByRole('button', { name: 'Lưu', exact: true }).click();
  const field = form.locator('.coco-field').filter({ has: page.getByLabel('Số điện thoại', { exact: true }) });
  await expect(field.locator('.field-error')).toHaveText('Số điện thoại bị trùng với khách hàng khác');
  await expect(field.locator('.field-error svg')).toBeVisible(); await expect(form.getByLabel('Số điện thoại', { exact: true })).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByRole('alertdialog')).toHaveCount(0); await expect(page.locator('dialog[open]')).toHaveCount(1);
  await expect(form.getByLabel('Họ tên', { exact: true })).toHaveValue('Khách kiểm thử'); await expect(form.getByLabel('Số điện thoại', { exact: true })).toHaveValue('0900000001');
  await page.screenshot({ path: info.outputPath(`customer-${edit ? 'edit' : 'create'}-inline.png`) });
  expect(mock.stores.khachHang).toHaveLength(1);
  await form.getByLabel('Số điện thoại', { exact: true }).fill('0900000003');
  await context.route('**/rest/v1/rpc/coco_service', route => {
    if (route.request().method() !== 'POST' || route.request().postDataJSON().p_service !== 'referenceData') return route.fallback();
    return route.fulfill({ headers: { 'access-control-allow-origin': '*' }, json: edit ? null : 'KH00000002' });
  });
  await form.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(page.getByRole('alertdialog')).toContainText(edit ? 'Cập nhật thông tin khách hàng thành công' : 'Đã thêm thông tin khách hàng');
  await expect(form).toHaveCount(0);
});

test('mocked cloud Auth: staff duplicate phone and username use Figma inline fields without nested error dialogs', async ({ page, context }, info) => {
  await mockCloud(context); let constraint = 'coco_employee_phone';
  await context.route('**/functions/v1/staff-admin', route => {
    if (route.request().method() !== 'POST') return route.fallback();
    return route.fulfill({ status: 400, headers: { 'access-control-allow-origin': '*' }, json: { code: '23505', message: `duplicate key value violates unique constraint "${constraint}"` } });
  });
  await page.goto('./'); await login(page, 'owner', password); await page.goto('./#/staff');
  await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
  const form = page.getByRole('dialog', { name: 'Tạo tài khoản nhân viên', exact: true });
  for (const [label, value] of [['Họ tên', 'Nhân viên kiểm thử'], ['Số điện thoại', '0900000002'], ['Tên đăng nhập', 'staff01'], ['Mật khẩu', 'test-only!']]) await form.getByLabel(label, { exact: true }).fill(value);
  for (const [name, label, message] of [['coco_employee_phone', 'Số điện thoại', 'Số điện thoại đã tồn tại'], ['taiKhoan_pkey', 'Tên đăng nhập', 'Tên đăng nhập đã tồn tại']]) {
    constraint = name; await form.getByRole('button', { name: 'Lưu', exact: true }).click();
    const field = form.locator('.coco-field').filter({ has: page.getByLabel(label, { exact: true }) });
    await expect(field.locator('.field-error')).toHaveText(message); await expect(field.locator('.field-error svg')).toBeVisible();
    await expect(page.getByRole('alertdialog')).toHaveCount(0); await expect(page.locator('dialog[open]')).toHaveCount(1);
    await expect(form.getByLabel('Mật khẩu', { exact: true })).toHaveValue('test-only!');
    await page.screenshot({ path: info.outputPath(`${name}-inline.png`) });
  }
  await form.getByLabel('Tên đăng nhập', { exact: true }).fill('staff02');
  await context.route('**/functions/v1/staff-admin', route => route.request().method() === 'POST'
    ? route.fulfill({ headers: { 'access-control-allow-origin': '*' }, json: 'NVSTAFF' }) : route.fallback());
  await form.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(page.getByRole('alertdialog')).toContainText('Tạo tài khoản mới thành công');
});

test('mocked cloud Auth: bracket update duplicate keeps the Figma modal and the editable form', async ({ page, context }, info) => {
  const backend = bracketTransport(); await backend.install(context); await page.goto('./'); await login(page, 'owner', password);
  const created = await openBracketForm(page); await created.getByRole('button', { name: 'Lưu', exact: true }).click();
  await page.getByRole('button', { name: 'Đóng thông báo', exact: true }).click();
  await context.route('**/rest/v1/rpc/coco_service', route => {
    if (route.request().method() !== 'POST' || route.request().postDataJSON().p_method !== 'updateBracket') return route.fallback();
    return route.fulfill({ status: 409, headers: { 'access-control-allow-origin': '*' }, json: { code: '23505', message: 'duplicate key value violates unique constraint "coco_bracket_identity"' } });
  });
  await page.goto('./#/price-brackets/KG00000001'); await page.getByRole('button', { name: 'Sửa thông tin', exact: true }).click();
  const form = page.getByRole('dialog', { name: 'Sửa khung giá thu mua', exact: true });
  await form.getByRole('button', { name: 'Lưu', exact: true }).click(); await expect(page.getByRole('alertdialog')).toHaveAccessibleName('Khung giá đã tồn tại');
  await page.screenshot({ path: info.outputPath('bracket-edit-duplicate.png') });
  await page.getByRole('button', { name: 'Đóng thông báo', exact: true }).click(); await expect(form).toBeVisible();
  await expect(form.getByLabel('Thương hiệu', { exact: true })).toHaveValue('CoCo'); expect(backend.rows).toHaveLength(1);
});

test('mocked cloud Auth: bracket duplicate preserves every field and can be corrected; validation, offline, permission and system errors stay distinct', async ({ page, context }, info) => {
  const backend = bracketTransport(); await backend.install(context); await page.goto('./'); await login(page, 'owner', password);
  const dismiss = async (message: string | RegExp) => {
    await expect(page.getByRole('alertdialog')).toContainText(message);
    await page.getByRole('button', { name: 'Đóng thông báo', exact: true }).click();
  };
  let form = await openBracketForm(page);
  await form.getByRole('button', { name: 'Lưu', exact: true }).click(); await dismiss('Tạo khung giá thu mua thành công');
  form = await openBracketForm(page); await form.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(page.getByRole('alertdialog')).toHaveAccessibleName('Khung giá đã tồn tại');
  await page.screenshot({ path: info.outputPath('bracket-duplicate-friendly.png') }); await dismiss('Khung giá đã tồn tại');
  for (const [label, value] of [['Loại hàng', 'Áo'], ['Thương hiệu', 'CoCo'], ['Độ mới', '2'], ['Giá tối thiểu (Min)', '50000'], ['Giá tối đa (Max)', '100000']]) await expect(form.getByLabel(label, { exact: true })).toHaveValue(value);
  await expect(form).toBeVisible(); expect(backend.rows).toHaveLength(1);
  await form.getByLabel('Thương hiệu', { exact: true }).fill('Khác');
  await form.getByRole('button', { name: 'Lưu', exact: true }).click(); await dismiss('Tạo khung giá thu mua thành công');
  form = await openBracketForm(page, 'CoCo', '3');
  await form.getByRole('button', { name: 'Lưu', exact: true }).click(); await dismiss('Tạo khung giá thu mua thành công'); expect(backend.rows).toHaveLength(3);
  form = await openBracketForm(page, 'Lỗi');
  await form.getByLabel('Giá tối thiểu (Min)', { exact: true }).fill('200000');
  await form.getByRole('button', { name: 'Lưu', exact: true }).click(); await dismiss('Min lớn hơn Max');
  await expect(form.getByLabel('Giá tối thiểu (Min)', { exact: true })).toHaveValue('200000');
  await form.getByLabel('Giá tối thiểu (Min)', { exact: true }).fill('50000');
  backend.failNext({ code: '42501', message: 'permission denied' });
  await form.getByRole('button', { name: 'Lưu', exact: true }).click(); await dismiss('Bạn không có quyền truy cập chức năng này.');
  backend.failNext({ code: '23505', message: 'duplicate key value violates unique constraint "khungGiaThuMua_pkey"' });
  await form.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(page.getByRole('alertdialog')).not.toHaveAccessibleName('Khung giá đã tồn tại');
  await expect(page.getByRole('alertdialog')).not.toContainText('khungGiaThuMua_pkey'); await dismiss('mã dữ liệu đã tồn tại');
  backend.failNext({ code: 'XX000', message: 'internal SQL failure' });
  await form.getByRole('button', { name: 'Lưu', exact: true }).click(); await dismiss('Tạo khung giá không thành công');
  await context.setOffline(true); await form.getByRole('button', { name: 'Lưu', exact: true }).click(); await dismiss('Mất kết nối mạng');
  await context.setOffline(false); await expect(form).toBeVisible(); expect(backend.rows).toHaveLength(3);
  await expect(form.getByLabel('Thương hiệu', { exact: true })).toHaveValue('Lỗi');
});

test('mocked cloud Auth: bracket concurrent create responses in two browser contexts keep one success and one editable duplicate form', async ({ page, context, browser, baseURL }) => {
  const other = await browser.newContext({ baseURL });
  try {
    const backend = bracketTransport(); await backend.install(context); await backend.install(other);
    const second = await other.newPage();
    for (const tab of [page, second]) { await tab.goto('./'); await login(tab, 'owner', password); }
    const firstForm = await openBracketForm(page), secondForm = await openBracketForm(second);
    await Promise.all([firstForm.getByRole('button', { name: 'Lưu', exact: true }).click(), secondForm.getByRole('button', { name: 'Lưu', exact: true }).click()]);
    const results = await Promise.all([page, second].map(async tab => {
      await expect(tab.getByRole('alertdialog')).toBeVisible(); return tab.getByRole('alertdialog').getAttribute('aria-label');
    }));
    expect(results.sort()).toEqual(['Khung giá đã tồn tại', 'Tạo khung giá thu mua thành công'].sort()); expect(backend.rows).toHaveLength(1);
    const duplicateTab = await page.getByRole('alertdialog').getAttribute('aria-label') === 'Khung giá đã tồn tại' ? page : second;
    await duplicateTab.getByRole('button', { name: 'Đóng thông báo', exact: true }).click();
    await expect(duplicateTab.getByRole('dialog', { name: 'Tạo khung giá thu mua', exact: true })).toBeVisible();
    await expect(duplicateTab.getByLabel('Thương hiệu', { exact: true })).toHaveValue('CoCo');
  } finally { await other.close(); }
});
