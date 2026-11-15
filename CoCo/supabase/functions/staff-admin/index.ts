// Runs only in Supabase Edge Functions. The service key never enters Vite.
import { createClient, type User } from 'npm:@supabase/supabase-js@2.119.0';

declare const Deno: { env: { get(name: string): string | undefined }; serve(handler: (request: Request) => Promise<Response>): void };
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
class StaffError extends Error {
  constructor(readonly code: string, message: string, readonly status = 400, readonly fields: Record<string, string> = {}) { super(message); }
}
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(item => canonical(item ?? null)).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.entries(value).filter(([, item]) => item !== undefined).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(',')}}`;
  return JSON.stringify(value) ?? 'null';
}
async function fingerprint(value: unknown) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical(value)));
  return [...new Uint8Array(hash)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}
const object = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (request.method !== 'POST') return json({ code: 'VALIDATION', message: 'POST required' }, 405);
  try {
    const url = Deno.env.get('SUPABASE_URL'), serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'), anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!url || !serviceKey || !anonKey) throw new StaffError('SYSTEM', 'Supabase Edge configuration missing', 503);
    const authorization = request.headers.get('Authorization') ?? '';
    if (!authorization.startsWith('Bearer ')) throw new StaffError('AUTH_REQUIRED', 'AUTH_REQUIRED: Đăng nhập lại', 401);
    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: identity, error: identityError } = await admin.auth.getUser(authorization.slice(7));
    if (identityError || !identity.user) throw new StaffError('AUTH_REQUIRED', 'AUTH_REQUIRED: Đăng nhập lại', 401);
    const { data: profile, error: profileError } = await admin.from('coco_profiles').select('role,active').eq('auth_user_id', identity.user.id).maybeSingle();
    if (profileError || !profile?.active || profile.role !== 'owner') throw new StaffError('FORBIDDEN', 'FORBIDDEN: Chỉ chủ cửa hàng quản lý tài khoản', 403);
    const caller = createClient(url, anonKey, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false, autoRefreshToken: false } });
    const body = object(await request.json()), method = body.method, args = body.args, key = body.idempotency_key;
    if (!['create', 'update', 'remove'].includes(String(method)) || !Array.isArray(args) || typeof key !== 'string' || !key.trim() || key.length > 200)
      throw new StaffError('VALIDATION', 'VALIDATION: Invalid staff command');
    const hash = await fingerprint([identity.user.id, method, args]);
    const safeArgs = structuredClone(args);
    if (method === 'create') { const input = object(safeArgs[0]); delete input.password; safeArgs[0] = input; }
    const rpc = async (action: string, authUserId: string | null = null) => caller.rpc('coco_staff_admin', {
      p_method: action, p_args: action === 'lookup' ? [] : safeArgs, p_auth_user_id: authUserId, p_idempotency_key: key, p_fingerprint: hash,
    });
    const prior = await rpc('lookup');
    if (prior.error) throw new StaffError(prior.error.message.match(/^([A-Z_]+):/)?.[1] ?? 'SYSTEM', prior.error.message);
    if (prior.data?.found) return json(prior.data.result);

    let provisioned: User | undefined;
    if (method === 'create') {
      const input = object(args[0]), username = typeof input.username === 'string' ? input.username.trim() : '';
      if (!/^\S{1,10}$/.test(username) || typeof input.password !== 'string' || !input.password.trim())
        throw new StaffError('VALIDATION', 'VALIDATION: Kiểm tra tên đăng nhập và mật khẩu', 400, { password: 'Mật khẩu không được để trống' });
      // Opaque deterministic address supports case-sensitive/Unicode usernames
      // without assuming they are valid email local-parts. Login resolves the
      // authoritative username -> Auth user email on the server.
      const email = `coco-${(await fingerprint(username)).slice(0, 40)}@coco.invalid`;
      const created = await admin.auth.admin.createUser({ email, password: input.password, email_confirm: true,
        app_metadata: { coco_provisioning_key: key, coco_payload_hash: hash } });
      if (created.error) {
        // Retry an uncertain prior attempt only when trusted app_metadata binds
        // that Auth user to this exact owner operation and payload.
        if (['email_exists', 'email_address_invalid', 'user_already_exists'].includes(created.error.code ?? '')) {
          for (let page = 1; !provisioned; page++) {
            const found = await admin.auth.admin.listUsers({ page, perPage: 1000 });
            if (found.error) break;
            const candidate = found.data.users.find(user => user.email === email);
            if (candidate) {
              if (candidate.app_metadata?.coco_provisioning_key === key && candidate.app_metadata?.coco_payload_hash === hash) provisioned = candidate;
              break;
            }
            if (found.data.users.length < 1000) break;
          }
        }
        if (!provisioned) {
          const replay = await rpc('lookup'); if (!replay.error && replay.data?.found) return json(replay.data.result);
          const duplicate = ['email_exists', 'user_already_exists'].includes(created.error.code ?? '');
          throw new StaffError(duplicate ? 'DUPLICATE' : 'VALIDATION', duplicate ? 'DUPLICATE: Tên đăng nhập đã tồn tại' : `VALIDATION: ${created.error.message}`, 400,
            duplicate ? { username: 'Tên đăng nhập đã tồn tại' } : { password: created.error.message });
        }
      } else provisioned = created.data.user;
      if (!provisioned) throw new StaffError('SYSTEM', 'Không thể tạo tài khoản Auth', 503);
    }
    const saved = await rpc(String(method), provisioned?.id ?? null);
    if (saved.error) {
      if (provisioned) {
        const replay = await rpc('lookup');
        if (!replay.error && replay.data?.found) return json(replay.data.result);
        const linked = await admin.from('coco_profiles').select('auth_user_id').eq('auth_user_id', provisioned.id).maybeSingle();
        // Never delete on an unknown network outcome. An unlinked Auth account
        // has no active profile and cannot read/write CoCo through RLS.
        if (!linked.error && !linked.data && saved.error.code) await admin.auth.admin.deleteUser(provisioned.id);
      }
      throw new StaffError(saved.error.message.match(/^([A-Z_]+):/)?.[1] ?? 'SYSTEM', saved.error.message);
    }
    // Removal deactivates the profile atomically in SQL. This is authoritative
    // even if the Auth access token has not expired; no remote Auth delete needed.
    return json(saved.data);
  } catch (error) {
    if (error instanceof StaffError) return json({ code: error.code, message: `${error.code}: ${error.message.replace(/^[A-Z_]+:\s*/, '')}`, fields: error.fields }, error.status);
    return json({ code: 'SYSTEM', message: 'Không thể xử lý tài khoản. Vui lòng thử lại.' }, 500);
  }
});
