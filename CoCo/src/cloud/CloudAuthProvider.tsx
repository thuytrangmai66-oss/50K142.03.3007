import { useCallback, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import type { AuthUser } from '../domain/auth';
import { AuthError } from '../services/auth/errors';
import { AuthContext } from '../features/auth/context';
import { Button } from '../components/ui/Button';
import { FormDialog } from '../components/ui/FormDialog';
import { db } from '../db';
import { cloudSession } from './client';
import { useCloudOnline } from './connectivity';
import { CloudEvents, startCloudRealtime } from './realtime';
import { createCloudServices } from './services';
import { CloudTransferPanel } from './CloudTransferPanel';
import { parseCloudUser } from './identity';

export function CloudAuthProvider({ client, children }: PropsWithChildren<{ client: SupabaseClient }>) {
  const [user, setUser] = useState<AuthUser | null>(null), userRef = useRef<AuthUser | null>(null);
  const [ready, setReady] = useState(false), [fatal, setFatal] = useState(''), [notice, setNotice] = useState('');
  const [transfer, setTransfer] = useState(false), online = useCloudOnline();
  const employeeId = user?.employeeId;
  const events = useMemo(() => new CloudEvents(), []), generation = useRef(0);
  const services = useMemo(() => createCloudServices(client, { currentUser: () => userRef.current, subscribe: events.subscribe, invalidate: events.invalidate }), [client, events]);
  const cancelIdentity = useCallback(() => { generation.current++; }, []);
  const identify = useCallback(async () => {
    const request = ++generation.current;
    const { data: auth, error: authError } = await client.auth.getSession();
    if (authError) throw authError;
    let current: AuthUser | null = null;
    if (auth.session) {
      const { data, error } = await client.rpc('coco_identity');
      if (error) throw new Error(`Không thể xác minh quyền server: ${error.message}`);
      current = parseCloudUser(data);
    }
    if (request === generation.current) { userRef.current = current; setUser(current); setReady(true); }
    return current;
  }, [client]);

  useEffect(() => {
    let active = true, restoring = true;
    const timers = new Set<number>();
    function deferIdentity() {
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        if (active) void identify().catch(cause => { if (active && !userRef.current) setFatal(cause instanceof Error ? cause.message : 'Không thể mở phiên cloud.'); });
      }, 0);
      timers.add(timer);
    }
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session: Session | null) => {
      if (!active || restoring) return;
      try { cloudSession.write(session); }
      catch { setFatal('Không thể lưu phiên đăng nhập. Vui lòng cho phép sessionStorage.'); }
      // Do not await Supabase API calls inside its Auth callback (Auth lock).
      deferIdentity();
    });
    void (async () => {
      const schema = await client.rpc('coco_schema_version');
      if (schema.error || schema.data !== 1) throw new Error('Cần chạy bản supabase/migration_all.sql hiện tại trong SQL Editor trước khi đăng nhập CoCo cloud.');
      const stored = cloudSession.read();
      if (stored) {
        const { data, error } = await client.auth.setSession(stored);
        if (error) { cloudSession.write(null); throw error; }
        cloudSession.write(data.session);
      }
      restoring = false;
      if (active) await identify();
    })().catch(cause => { if (active) setFatal(cause instanceof Error ? cause.message : 'Không thể khôi phục phiên cloud.'); });
    const unsubscribe = events.subscribe(() => { if (!restoring) deferIdentity(); });
    return () => { active = false; cancelIdentity(); subscription.unsubscribe(); unsubscribe(); for (const timer of timers) window.clearTimeout(timer); };
  }, [client, events, identify, cancelIdentity]);

  useEffect(() => {
    if (!employeeId) return;
    return startCloudRealtime(client, events, employeeId, () => services.discounts.runDue());
  }, [client, events, services, employeeId]);

  if (fatal) return <main className="startup" role="alert"><h1>Chưa thể mở CoCo cloud</h1><p>{fatal}</p>
    <Button onClick={() => { cloudSession.write(null); window.location.reload(); }}>Thử đăng nhập lại</Button></main>;
  if (!ready) return <main className="startup" role="status">Đang kết nối CoCo…</main>;
  return <AuthContext.Provider value={{ needsSetup: false, user, ...services, notice, clearNotice: () => setNotice(''),
    login: async (username, password) => {
      if (!username.trim() || !password.trim()) throw new AuthError('REQUIRED');
      const login = await client.functions.invoke('auth-login', { body: { username: username.trim(), password } });
      if (login.error?.context instanceof Response && login.error.context.status === 404) setFatal('Cần triển khai Supabase Edge Function auth-login trước khi đăng nhập.');
      const tokens = login.data?.session;
      if (login.error || !tokens || typeof tokens.access_token !== 'string' || typeof tokens.refresh_token !== 'string') throw new AuthError('INVALID_CREDENTIALS');
      const { data, error } = await client.auth.setSession({ access_token: tokens.access_token, refresh_token: tokens.refresh_token });
      if (error || !data.session) throw new AuthError('INVALID_CREDENTIALS');
      const current = await identify();
      if (!current) { await client.auth.signOut({ scope: 'local' }); throw new AuthError('FORBIDDEN'); }
      cloudSession.write(data.session); events.invalidate(); setNotice('Đăng nhập thành công!');
    },
    bootstrap: async () => { throw new AuthError('FORBIDDEN'); },
    logout: async () => {
      const { error } = await client.auth.signOut({ scope: 'local' }); if (error) throw error;
      cloudSession.write(null);
      generation.current++; userRef.current = null; setUser(null); setNotice(''); setTransfer(false); events.invalidate();
    },
  }}>
    {!online && <p className="cloud-connection-notice" role="alert">Mất kết nối mạng. Chưa thể chốt đơn/thanh toán. Dữ liệu sẽ được tải lại khi có mạng.</p>}
    {children}
    {user?.role === 'owner' && <>
      <button type="button" className="cloud-transfer-toggle" onClick={() => setTransfer(true)}>Backup / Nhập dữ liệu</button>
      {transfer && <FormDialog title="Chuyển dữ liệu CoCo" onClose={() => setTransfer(false)}><CloudTransferPanel client={client} database={db}/></FormDialog>}
    </>}
  </AuthContext.Provider>;
}
