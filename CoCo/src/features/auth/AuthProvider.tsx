import { useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { LocalReferenceData } from '../../services/reference-data/local';
import { StaffAccountsService } from '../../services/staff-accounts';
import { PurchaseDraftService } from '../../services/purchase-drafts';
import { PurchaseApprovalService } from '../../services/purchase-approvals';
import { PurchaseFinalizationService } from '../../services/purchase-finalization';
import { SalesDraftService } from '../../services/sales';
import { SalesPaymentService } from '../../services/sales-payment';
import { SalesQueriesService } from '../../services/sales-queries';
import { PURCHASE_STATUS_MAPPING } from '../../domain/purchase-status';
import { InventoryService } from '../../services/inventory';
import { DiscountScheduler, startDiscountScheduler } from '../../services/discount-scheduler';
import { liveQuery } from 'dexie';
import { db } from '../../db';
import type { AuthState } from '../../domain/auth';
import { AuthService } from '../../services/auth/service';
import { sha256 } from '../../services/auth/crypto';
import { sessionStorageToken } from '../../services/auth/storage';
import { AuthContext } from './context';
import { Button } from '../../components/ui/Button';

const service = new AuthService(db);
const scheduler = new DiscountScheduler(db);
export function AuthProvider({ children }: PropsWithChildren) {
  useEffect(() => startDiscountScheduler(scheduler), []);
  const [token, setToken] = useState<string | null>(null);
  const [state, setState] = useState<AuthState | null>(null);
  const [error, setError] = useState(false);
  const [notice, setNotice] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const referenceData = useMemo(() => new LocalReferenceData(db, () => token), [token]);
  const inventory = useMemo(() => new InventoryService(db, () => token), [token]);
  const discounts = useMemo(() => ({ read: () => scheduler.read(token ?? '') }), [token]);
  const staffAccounts = useMemo(() => new StaffAccountsService(db, () => token), [token]);
  const purchaseDrafts = useMemo(() => new PurchaseDraftService(db, () => token), [token]);
  const approvals = useMemo(() => new PurchaseApprovalService(db, () => token), [token]);
  const purchaseFinalizer = useMemo(() => new PurchaseFinalizationService(db, () => token, PURCHASE_STATUS_MAPPING), [token]);
  const salesDrafts = useMemo(() => new SalesDraftService(db, () => token), [token]);
  const salesPayments = useMemo(() => new SalesPaymentService(db, () => token), [token]);
  const salesQueries = useMemo(() => new SalesQueriesService(db, () => token), [token]);
  useEffect(() => {
    try { setToken(sessionStorageToken.read()); setInitialized(true); }
    catch { setError(true); }
  }, []);
  useEffect(() => {
    const recheck = () => {
      if (document.visibilityState === 'hidden') return;
      try { setToken(sessionStorageToken.read()); setRefresh(value => value + 1); }
      catch { setError(true); }
    };
    window.addEventListener('focus', recheck);
    window.addEventListener('pageshow', recheck);
    document.addEventListener('visibilitychange', recheck);
    return () => {
      window.removeEventListener('focus', recheck); window.removeEventListener('pageshow', recheck);
      document.removeEventListener('visibilitychange', recheck);
    };
  }, []);
  useEffect(() => {
    if (!initialized) return;
    let active = true;
    let subscription: { unsubscribe(): void } | undefined;
    (async () => {
      const hash = token ? await sha256(token) : null;
      if (!active) return;
      subscription = liveQuery(() => service.state(hash)).subscribe({
        next: value => {
          if (!active) return;
          if (token && !value.user) {
            setNotice('');
            try { sessionStorageToken.clear(); setToken(null); }
            catch { setError(true); }
          }
          setState(value);
        },
        error: () => { if (active) setError(true); },
      });
    })().catch(() => { if (active) setError(true); });
    return () => { active = false; subscription?.unsubscribe(); };
  }, [token, initialized, refresh]);

  if (error) return <main className="startup" role="alert"><h1>Không thể mở phiên CoCo</h1>
    <p>Vui lòng cho phép lưu dữ liệu trên trình duyệt rồi thử lại.</p>
    <Button onClick={() => window.location.reload()}>Thử lại</Button></main>;
  if (!state) return <main className="startup" role="status">Đang mở CoCo…</main>;
  return <AuthContext.Provider value={{ ...state, referenceData, inventory, discounts, staffAccounts, purchaseDrafts, approvals, purchaseFinalizer, salesDrafts, salesPayments, salesQueries, notice, clearNotice: () => setNotice(''),
    login: async (username, password) => {
      const result = await service.login(username, password);
      try { sessionStorageToken.write(result.token); }
      catch { await service.logout(result.token); throw new Error('Không thể lưu phiên đăng nhập. Vui lòng cho phép lưu trữ rồi thử lại.'); }
      setNotice('Đăng nhập thành công!');
      setToken(result.token);
      setState({ needsSetup: false, user: result.user });
    },
    bootstrap: async input => {
      await service.bootstrap(input);
      setNotice('Thiết lập tài khoản chủ thành công. Vui lòng đăng nhập.');
      setState({ needsSetup: false, user: null });
    },
    logout: async () => {
      if (token) await service.logout(token);
      try { sessionStorageToken.clear(); }
      catch { setError(true); }
      setToken(null); setState({ needsSetup: false, user: null }); setNotice('');
    },
  }}>{children}</AuthContext.Provider>;
}
