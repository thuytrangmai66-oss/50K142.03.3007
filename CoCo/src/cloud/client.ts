import { createClient } from '@supabase/supabase-js';

export function cloudConfiguration(env: Record<string, string | undefined>) {
  const url = env.VITE_SUPABASE_URL?.trim() ?? '', key = env.VITE_SUPABASE_ANON_KEY?.trim() ?? '';
  if (!url && !key) return { enabled: false as const };
  if (!url || !key) return { enabled: true as const, error: 'Cần cấu hình đủ VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY.' };
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(parsed.hostname))) throw new Error();
    if (key.startsWith('sb_secret_')) throw new Error();
    if (key.split('.').length === 3) {
      const payload = JSON.parse(atob(key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (payload.role !== 'anon') throw new Error();
    } else if (!key.startsWith('sb_publishable_')) throw new Error();
    return { enabled: true as const, url, key };
  } catch { return { enabled: true as const, error: 'Cấu hình Supabase không hợp lệ. Chỉ dùng URL dự án và anon/publishable key; không dùng service_role/secret key.' }; }
}

export const cloudConfig = cloudConfiguration(import.meta.env);
export const cloudEnabled = cloudConfig.enabled;
export const supabase = 'url' in cloudConfig && cloudConfig.url ? createClient(cloudConfig.url, cloudConfig.key!, {
  // Supabase persisted Auth broadcasts across tabs, even with custom storage.
  // Keep SDK sessions in memory and persist refresh tokens ourselves in sessionStorage.
  auth: { persistSession: false, autoRefreshToken: true, detectSessionInUrl: false },
}) : null;

const sessionKey = 'url' in cloudConfig ? `coco:cloud-session:${new URL(cloudConfig.url!).hostname}` : 'coco:cloud-session';
export const cloudSession = {
  read(): { access_token: string; refresh_token: string } | null {
    const raw = sessionStorage.getItem(sessionKey); if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || !('access_token' in value) || !('refresh_token' in value) ||
      typeof value.access_token !== 'string' || typeof value.refresh_token !== 'string') throw new Error('Phiên cloud không hợp lệ.');
    return { access_token: value.access_token, refresh_token: value.refresh_token };
  },
  write(value: { access_token: string; refresh_token: string } | null) {
    if (!value) sessionStorage.removeItem(sessionKey);
    else sessionStorage.setItem(sessionKey, JSON.stringify({ access_token: value.access_token, refresh_token: value.refresh_token }));
  },
};
