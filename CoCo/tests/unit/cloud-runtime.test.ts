import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { CLOUD_TABLES, CloudEvents, startCloudRealtime } from '../../src/cloud/realtime';

const mocks = vi.hoisted(() => ({ createClient: vi.fn(() => ({ isolatedMock: true })) }));
vi.mock('@supabase/supabase-js', () => ({ createClient: mocks.createClient }));

beforeEach(() => {
  // Never instantiate a real SDK client from the developer's .env in these tests.
  vi.stubEnv('VITE_SUPABASE_URL', ''); vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
  vi.resetModules(); mocks.createClient.mockClear(); sessionStorage.clear();
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); sessionStorage.clear(); });
const flush = async () => { await Promise.resolve(); await Promise.resolve(); };
const jwt = (role: unknown) => `${btoa('{}')}.${btoa(JSON.stringify({ role }))}.test-signature`;

it('blank configuration keeps cloud disabled, while partial config fails closed without instantiating the SDK', async () => {
  const { cloudConfiguration, cloudEnabled, supabase } = await import('../../src/cloud/client');
  expect(cloudEnabled).toBe(false); expect(supabase).toBeNull(); expect(mocks.createClient).not.toHaveBeenCalled();
  expect(cloudConfiguration({})).toEqual({ enabled: false });
  for (const env of [{ VITE_SUPABASE_URL: 'https://example.supabase.co' }, { VITE_SUPABASE_ANON_KEY: 'sb_publishable_test' }]) {
    expect(cloudConfiguration(env)).toEqual(expect.objectContaining({ enabled: true, error: expect.any(String) }));
  }
});

it.each([
  ['service-role JWT', 'https://example.supabase.co', jwt('service_role')],
  ['authenticated JWT', 'https://example.supabase.co', jwt('authenticated')],
  ['secret key', 'https://example.supabase.co', 'sb_secret_test-never-use'],
  ['unrecognized key', 'https://example.supabase.co', 'unknown-key'],
  ['malformed JWT', 'https://example.supabase.co', 'header.not-json.signature'],
  ['remote HTTP', 'http://example.supabase.co', 'sb_publishable_test'],
  ['non HTTP URL', 'file:///private', 'sb_publishable_test'],
])('rejects unsafe cloud config: %s', async (_name, url, key) => {
  const { cloudConfiguration } = await import('../../src/cloud/client');
  expect(cloudConfiguration({ VITE_SUPABASE_URL: url, VITE_SUPABASE_ANON_KEY: key })).toEqual(
    expect.objectContaining({ enabled: true, error: expect.any(String) }));
  expect(mocks.createClient).not.toHaveBeenCalled();
});

it('allows only anon/publishable browser keys and disables persisted cross-tab SDK Auth sessions', async () => {
  vi.stubEnv('VITE_SUPABASE_URL', ' https://example.supabase.co ');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', ' sb_publishable_test ');
  const { cloudConfiguration, cloudEnabled, supabase } = await import('../../src/cloud/client');
  expect(cloudEnabled).toBe(true); expect(supabase).toEqual({ isolatedMock: true });
  expect(mocks.createClient).toHaveBeenCalledWith('https://example.supabase.co', 'sb_publishable_test', {
    auth: { persistSession: false, autoRefreshToken: true, detectSessionInUrl: false },
  });
  expect(cloudConfiguration({ VITE_SUPABASE_URL: 'https://example.supabase.co', VITE_SUPABASE_ANON_KEY: jwt('anon') })).toEqual(
    expect.objectContaining({ enabled: true, url: 'https://example.supabase.co', key: jwt('anon') }));
  expect(cloudConfiguration({ VITE_SUPABASE_URL: 'http://127.0.0.1:54321', VITE_SUPABASE_ANON_KEY: 'sb_publishable_local-test' })).toEqual(
    expect.objectContaining({ enabled: true, url: 'http://127.0.0.1:54321' }));
});

it('cloud session persists only tab-local access/refresh tokens and rejects corrupted storage', async () => {
  const { cloudSession } = await import('../../src/cloud/client');
  expect(cloudSession.read()).toBeNull();
  cloudSession.write({ access_token: 'fake-access', refresh_token: 'fake-refresh' });
  expect(cloudSession.read()).toEqual({ access_token: 'fake-access', refresh_token: 'fake-refresh' });
  expect(localStorage.length).toBe(0);
  sessionStorage.setItem('coco:cloud-session', JSON.stringify({ access_token: 42, refresh_token: 'fake-refresh' }));
  expect(() => cloudSession.read()).toThrow('Phiên cloud không hợp lệ');
  sessionStorage.setItem('coco:cloud-session', '{'); expect(() => cloudSession.read()).toThrow();
  cloudSession.write(null); expect(cloudSession.read()).toBeNull();
});

function tabStorage(): Storage {
  const values = new Map<string, string>();
  return { get length() { return values.size; }, clear: () => values.clear(), key: index => [...values.keys()][index] ?? null,
    getItem: key => values.get(key) ?? null, setItem: (key, value) => { values.set(key, value); }, removeItem: key => { values.delete(key); } };
}

it('tab-local tokens survive module reload while simulated owner/staff tabs cannot overwrite each other', async () => {
  const ownerTab = tabStorage(), staffTab = tabStorage(); vi.stubGlobal('sessionStorage', ownerTab);
  const first = await import('../../src/cloud/client');
  first.cloudSession.write({ access_token: 'owner-access-test', refresh_token: 'owner-refresh-test' });
  vi.resetModules(); const reloaded = await import('../../src/cloud/client');
  expect(reloaded.cloudSession.read()).toEqual({ access_token: 'owner-access-test', refresh_token: 'owner-refresh-test' });
  vi.stubGlobal('sessionStorage', staffTab); expect(reloaded.cloudSession.read()).toBeNull();
  reloaded.cloudSession.write({ access_token: 'staff-access-test', refresh_token: 'staff-refresh-test' });
  vi.stubGlobal('sessionStorage', ownerTab);
  expect(reloaded.cloudSession.read()?.access_token).toBe('owner-access-test'); reloaded.cloudSession.write(null);
  vi.stubGlobal('sessionStorage', staffTab); expect(reloaded.cloudSession.read()?.access_token).toBe('staff-access-test');
  expect(mocks.createClient).not.toHaveBeenCalled();
});

it('project-scoped tab tokens are not reused for a different Supabase project', async () => {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://first.supabase.co'); vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'sb_publishable_test');
  const first = await import('../../src/cloud/client');
  first.cloudSession.write({ access_token: 'first-project-test', refresh_token: 'first-refresh-test' });
  vi.resetModules(); vi.stubEnv('VITE_SUPABASE_URL', 'https://second.supabase.co');
  const second = await import('../../src/cloud/client'); expect(second.cloudSession.read()).toBeNull();
  second.cloudSession.write({ access_token: 'second-project-test', refresh_token: 'second-refresh-test' });
  expect(first.cloudSession.read()?.access_token).toBe('first-project-test');
});

it('server identity accepts exact owner/staff records and unauthenticated null without deriving a role locally', async () => {
  const { parseCloudUser } = await import('../../src/cloud/identity');
  expect(parseCloudUser({ user: null })).toBeNull();
  for (const role of ['owner', 'staff'] as const) {
    const user = { username: 'serverUser', employeeId: 'NV1', displayName: 'Tài khoản server', role };
    expect(parseCloudUser({ user })).toEqual(user);
  }
  expect(mocks.createClient).not.toHaveBeenCalled();
});

it.each([
  null, {}, { user: {} }, { user: { username: 12, employeeId: 'NV1', displayName: 'Test', role: 'owner' } },
  { user: { username: 'user', employeeId: 'NV1', displayName: 'Test', role: 'admin' } },
  { user: { username: 'user', employeeId: 'NV1', displayName: 'Test', role: ['owner'] } },
  { user: { username: 'user', employeeId: 'NV1', displayName: 'Test', role: { owner: true } } },
  { user: { username: '', employeeId: 'NV1', displayName: 'Test', role: 'owner' } },
  { user: { username: 'user', employeeId: ' ', displayName: 'Test', role: 'owner' } },
  { user: { username: 'user', employeeId: 'NV1', displayName: '', role: 'owner' } },
])('server identity rejects a missing or incorrectly typed contract: %#', async value => {
  const { parseCloudUser } = await import('../../src/cloud/identity');
  expect(() => parseCloudUser(value)).toThrow('Hợp đồng định danh cloud không hợp lệ');
});

it('CloudEvents coalesces a burst while preserving later changes and respecting unsubscribe', async () => {
  const events = new CloudEvents(), first = vi.fn(), second = vi.fn();
  const stop = events.subscribe(first); events.subscribe(second);
  events.invalidate(); events.invalidate(); events.invalidate();
  expect(first).not.toHaveBeenCalled(); await flush();
  expect(first).toHaveBeenCalledTimes(1); expect(second).toHaveBeenCalledTimes(1);
  events.invalidate(); stop(); await flush();
  expect(first).toHaveBeenCalledTimes(1); expect(second).toHaveBeenCalledTimes(2);
});

function mockRealtime() {
  const handlers = new Map<string, (payload: Record<string, unknown>) => void>();
  let subscription: ((status: string) => void) | undefined;
  const channel = { on: vi.fn(), subscribe: vi.fn() };
  channel.on.mockImplementation((_event: string, filter: { table: string }, handler: (payload: Record<string, unknown>) => void) => {
    handlers.set(filter.table, handler); return channel;
  });
  channel.subscribe.mockImplementation((callback: (status: string) => void) => { subscription = callback; return channel; });
  const client = { channel: vi.fn(() => channel), removeChannel: vi.fn(async () => 'ok') };
  return { client: client as unknown as SupabaseClient, mockClient: client, channel, handlers, status: (value: string) => subscription?.(value) };
}
const change = (id: number) => ({ table: 'khachHang', commit_timestamp: '2026-11-15T10:00:00Z', eventType: 'UPDATE', new: { MaKH: `KH${id}`, DiemTichLuy: id }, old: {} });

it('Realtime subscribes required stores, ignores duplicate events and disposes channel/listeners/timers', async () => {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout'] });
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
  const mock = mockRealtime(), events = new CloudEvents(), reload = vi.fn(), runDue = vi.fn(async () => undefined);
  events.subscribe(reload);
  const stop = startCloudRealtime(mock.client, events, 'NV1', runDue); await flush();
  expect(runDue).toHaveBeenCalledTimes(1);
  expect(mock.channel.on).toHaveBeenCalledTimes(CLOUD_TABLES.length);
  for (const table of CLOUD_TABLES) expect(mock.handlers.has(table)).toBe(true);
  mock.status('SUBSCRIBED'); await flush(); expect(reload).toHaveBeenCalledTimes(1);
  const emit = mock.handlers.get('khachHang')!;
  emit(change(1)); emit(change(1)); await flush(); expect(reload).toHaveBeenCalledTimes(2);
  emit(change(1)); await flush(); expect(reload).toHaveBeenCalledTimes(2);
  emit(change(2)); await flush(); expect(reload).toHaveBeenCalledTimes(3);
  stop(); expect(mock.mockClient.removeChannel).toHaveBeenCalledWith(mock.channel); expect(vi.getTimerCount()).toBe(0);
  emit(change(3)); mock.status('SUBSCRIBED');
  window.dispatchEvent(new Event('online')); window.dispatchEvent(new Event('focus')); await flush();
  expect(reload).toHaveBeenCalledTimes(3); expect(runDue).toHaveBeenCalledTimes(1);
});

it('Realtime refetches on reconnect/focus, does not run jobs offline or overlap an in-flight scheduler call', async () => {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout'] });
  const online = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
  const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
  const mock = mockRealtime(), events = new CloudEvents(), reload = vi.fn();
  let release: (() => void) | undefined;
  const runDue = vi.fn(() => new Promise<void>(resolve => { release = resolve; }));
  events.subscribe(reload); const stop = startCloudRealtime(mock.client, events, 'NV1', runDue);
  expect(runDue).not.toHaveBeenCalled();
  online.mockReturnValue(true); window.dispatchEvent(new Event('online')); await flush();
  expect(runDue).toHaveBeenCalledTimes(1); expect(reload).toHaveBeenCalledTimes(1);
  window.dispatchEvent(new Event('online')); await flush(); expect(runDue).toHaveBeenCalledTimes(1);
  release!(); await flush(); window.dispatchEvent(new Event('online')); await flush(); expect(runDue).toHaveBeenCalledTimes(2);
  const before = reload.mock.calls.length;
  visibility.mockReturnValue('hidden'); document.dispatchEvent(new Event('visibilitychange')); await flush();
  expect(reload).toHaveBeenCalledTimes(before);
  visibility.mockReturnValue('visible'); window.dispatchEvent(new Event('focus')); await flush();
  expect(reload).toHaveBeenCalledTimes(before + 1);
  stop(); release!(); await flush(); expect(vi.getTimerCount()).toBe(0);
});

it('Realtime bounds its duplicate-event cache without suppressing a later event after eviction', async () => {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout'] });
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
  const mock = mockRealtime(), events = new CloudEvents(), reload = vi.fn(); events.subscribe(reload);
  const stop = startCloudRealtime(mock.client, events, 'NV1', vi.fn(async () => undefined)), emit = mock.handlers.get('khachHang')!;
  for (let id = 0; id <= 500; id++) emit(change(id)); await flush();
  expect(reload).toHaveBeenCalledTimes(1);
  emit(change(0)); await flush(); expect(reload).toHaveBeenCalledTimes(2); stop();
});
