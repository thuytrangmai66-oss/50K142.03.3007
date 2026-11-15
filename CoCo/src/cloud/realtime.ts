import type { SupabaseClient } from '@supabase/supabase-js';

export class CloudEvents {
  private readonly listeners = new Set<() => void>();
  private queued = false;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  invalidate = () => {
    if (this.queued) return;
    this.queued = true;
    queueMicrotask(() => { this.queued = false; for (const listener of this.listeners) listener(); });
  };
}
export const CLOUD_TABLES = ['khachHang', 'nhanVien', 'taiKhoan', 'khungGiaThuMua', 'sanPham', 'hoaDonThuMua', 'chiTietHoaDonTM',
  'hoaDonBanHang', 'chiTietHoaDonBH', 'memberships', 'productCosts', 'discountApplications', 'appMetadata',
  'purchaseDrafts', 'purchaseLines', 'purchaseApprovals', 'purchaseNotices', 'coco_profiles'] as const;

export function startCloudRealtime(client: SupabaseClient, events: CloudEvents, userId: string, runDue: () => Promise<unknown>) {
  const seen = new Set<string>(); let active = true, running = false;
  const refresh = () => { if (active) events.invalidate(); };
  const channel = client.channel(`coco:${userId}:${crypto.randomUUID()}`);
  for (const table of CLOUD_TABLES) channel.on('postgres_changes', { event: '*', schema: 'public', table }, payload => {
    const key = JSON.stringify([payload.table, payload.commit_timestamp, payload.eventType, payload.new, payload.old]);
    if (seen.has(key)) return;
    seen.add(key); if (seen.size > 500) seen.delete(seen.values().next().value!);
    refresh();
  });
  channel.subscribe(status => { if (status === 'SUBSCRIBED') refresh(); });
  async function schedule() {
    if (!active || running || !navigator.onLine) return;
    running = true;
    try { await runDue(); } catch { /* Never record a successful run when the server failed. */ }
    finally { running = false; }
  }
  const reconnect = () => { refresh(); void schedule(); };
  const focus = () => { if (document.visibilityState !== 'hidden') refresh(); };
  window.addEventListener('online', reconnect); window.addEventListener('focus', focus);
  document.addEventListener('visibilitychange', focus);
  const poll = window.setInterval(refresh, 30_000), scheduler = window.setInterval(() => void schedule(), 60_000);
  void schedule();
  return () => {
    active = false; window.clearInterval(poll); window.clearInterval(scheduler);
    window.removeEventListener('online', reconnect); window.removeEventListener('focus', focus);
    document.removeEventListener('visibilitychange', focus); void client.removeChannel(channel); seen.clear();
  };
}
