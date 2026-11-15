// Anonymous username/password login. Profile/email resolution stays server-side;
// no endpoint returns an Auth email for an unauthenticated username lookup.
import { createClient } from 'npm:@supabase/supabase-js@2.119.0';

declare const Deno: { env: { get(name: string): string | undefined }; serve(handler: (request: Request) => Promise<Response>): void };
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const denied = () => json({ code: 'INVALID_CREDENTIALS', message: 'Tên đăng nhập hoặc mật khẩu không đúng' }, 400);

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (request.method !== 'POST') return json({ message: 'POST required' }, 405);
  try {
    const url = Deno.env.get('SUPABASE_URL'), serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'), anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!url || !serviceKey || !anonKey) return json({ code: 'SYSTEM', message: 'Chưa cấu hình xác thực Supabase' }, 503);
    const body: unknown = await request.json();
    if (!body || typeof body !== 'object' || !('username' in body) || !('password' in body) ||
      typeof body.username !== 'string' || typeof body.password !== 'string' || !body.username.trim() || !body.password.trim() ||
      body.username.length > 100 || body.password.length > 4096) return denied();
    const username = body.username.trim(), password = body.password;
    const settings = { auth: { persistSession: false, autoRefreshToken: false } };
    const admin = createClient(url, serviceKey, settings), auth = createClient(url, anonKey, settings);
    const { data: profile, error: profileError } = await admin.from('coco_profiles')
      .select('auth_user_id,active,role,version').eq('username', username).maybeSingle();
    let email: string | undefined;
    if (!profileError && profile?.active && ['owner', 'staff'].includes(profile.role)) {
      const target = await admin.auth.admin.getUserById(profile.auth_user_id);
      if (!target.error && target.data.user?.id === profile.auth_user_id) email = target.data.user.email;
    }
    // Unknown/inactive accounts take the same Auth password endpoint path and
    // receive the same public error. No password/email/token is logged.
    const login = await auth.auth.signInWithPassword({ email: email ?? 'unknown-user@coco.invalid', password });
    if (!email || login.error || !login.data.session || login.data.user?.id !== profile?.auth_user_id) return denied();
    const fresh = await admin.from('coco_profiles').select('auth_user_id,active,role,version').eq('auth_user_id', profile.auth_user_id).maybeSingle();
    if (fresh.error || !fresh.data?.active || fresh.data.role !== profile.role || fresh.data.version !== profile.version) {
      await auth.auth.signOut({ scope: 'local' }); return denied();
    }
    return json({ session: login.data.session });
  } catch { return denied(); }
});
