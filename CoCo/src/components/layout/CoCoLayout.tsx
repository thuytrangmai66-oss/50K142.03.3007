import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { CircleUserRound } from 'lucide-react';
import { SidebarIcon } from './SidebarIcon';
import { hasPermission } from '../../services/permissions';
import { useAuth } from '../../features/auth/use-auth';
import { Notice } from '../ui/Notice';
import logo from '../../assets/coco-mark.png';

export function CoCoLayout() {
  const auth = useAuth();
  const location = useLocation();
  const purchaseDetail = location.pathname.startsWith('/purchases/transactions/');
  const purchaseEditor = location.pathname.startsWith('/purchases/') && !purchaseDetail;
  const salesDetail = location.pathname.startsWith('/sales/transactions/');
  const salesEditor = location.pathname.startsWith('/sales/') && !salesDetail;
  const heading = /^\/customers\/[^/]+\/purchases/.test(location.pathname) ? <>Khách hàng<span className="purchase-breadcrumb"> / Lịch sử mua</span></> : location.pathname === '/sales' || salesDetail ? 'Bán hàng' : location.pathname === '/inventory/discounts' ? <>Hàng hóa<span className="purchase-breadcrumb"> / Xử lý hàng tồn lâu</span></> : location.pathname.startsWith('/inventory') ? 'Hàng hóa' : location.pathname.startsWith('/approvals') ? 'Phê duyệt' : location.pathname === '/purchases' || purchaseDetail ? 'Thu mua' : purchaseEditor ? 'Thu mua / Tạo giao dịch' : salesEditor ? 'Bán hàng / Tạo giao dịch' : /^\/customers\/[^/]+\/sales/.test(location.pathname) ? <>Khách hàng<span className="purchase-breadcrumb"> / Lịch sử bán</span></> : location.pathname.startsWith('/customers') ? 'Khách hàng' : location.pathname.startsWith('/price-brackets') ? 'Khung giá thu mua' : location.pathname.startsWith('/staff') ? 'Nhân viên' : 'Trang Chủ';
  const customerPurchaseHistory = /^\/customers\/[^/]+\/purchases$/.test(location.pathname);
  const isDetail = !customerPurchaseHistory && location.pathname !== '/inventory/discounts' && (purchaseDetail || salesDetail || /^\/(inventory|customers|price-brackets|staff)\/[^/]+/.test(location.pathname));
  useEffect(() => {
    if (!window.matchMedia('(min-width: 761px)').matches) return;
    const main = document.getElementById('main-content');
    if (!main) return;
    if (!isDetail) { main.scrollTo({ top: 0, behavior: 'instant' }); window.scrollTo({ top: 0, behavior: 'instant' }); return; }
    // Await the real loaded card, once per navigation. Live updates and modal
    // interaction must not move the reader back to the beginning of the page.
    const observer = new MutationObserver(reveal);
    function reveal() {
      const card = main?.querySelector<HTMLElement>('.record-card, .history-card, [role="alert"]');
      if (!card) return;
      observer.disconnect();
      // Reveal inside the workspace only. scrollIntoView also scrolls outer
      // ancestors when the sidebar is taller than a short desktop viewport,
      // which can move the fixed workspace header completely off screen.
      const offset = card.getBoundingClientRect().top - main!.getBoundingClientRect().top + main!.scrollTop;
      const margin = parseFloat(getComputedStyle(card).scrollMarginTop) || 0;
      main!.scrollTo({ top: Math.max(0, offset - margin), behavior: 'instant' });
      window.scrollTo({ top: 0, behavior: 'instant' });
      const title = card.querySelector<HTMLElement>('h1') ?? card;
      title.tabIndex = -1; title.focus({ preventScroll: true });
    }
    observer.observe(main, { childList: true, subtree: true }); reveal();
    return () => observer.disconnect();
  }, [location.pathname, isDetail]);
  const [logoutError, setLogoutError] = useState('');
  const [busy, setBusy] = useState(false);
  async function logout() {
    if (busy) return; setBusy(true); setLogoutError('');
    try { await auth.logout(); } catch { setLogoutError('Không thể đăng xuất. Vui lòng thử lại.'); }
    finally { setBusy(false); }
  }
  return <div className={`app-shell${location.pathname === '/' ? ' home-shell' : ''}${purchaseEditor || salesEditor ? ' purchase-editor-shell' : ''}${location.pathname === '/sales' ? ' sales-list-shell' : ''}`}>
    <a className="skip-link" href="#main-content" onClick={event => {
      event.preventDefault();
      document.getElementById('main-content')?.focus();
    }}>Đến nội dung chính</a>
    <aside className="sidebar">
      <NavLink className="brand" to="/" aria-label="CoCo — Trang chủ"><img src={logo} alt="CoCo — Kho ký gửi" /></NavLink>
      <div className="sidebar-rule" />
      <nav aria-label="Điều hướng chính"><NavLink to="/" end><SidebarIcon name="home"/><span>Trang chủ</span></NavLink>
        <NavLink to="/purchases"><SidebarIcon name="purchase"/><span>Thu mua</span></NavLink>
        {auth.user && hasPermission(auth.user.role, 'sales.create') && <NavLink className={`sales-navigation${location.pathname.startsWith('/sales') ? ' active' : ''}`} to="/sales"><SidebarIcon name="sales"/><span>Bán hàng</span></NavLink>}
        <NavLink to="/inventory"><SidebarIcon name="inventory"/><span>Hàng hóa</span></NavLink>
        {location.pathname.startsWith('/inventory') && <NavLink className="inventory-submenu" to="/inventory/discounts"><SidebarIcon name="chevron"/><span>Xử lý hàng tồn lâu</span></NavLink>}
        <NavLink to="/customers"><SidebarIcon name="customers"/><span>Khách hàng</span></NavLink>
        {auth.user && hasPermission(auth.user.role, 'reports.read') && <NavLink to="/reports"><SidebarIcon name="reports"/><span>Báo cáo</span></NavLink>}
        {auth.user && hasPermission(auth.user.role, 'approvals.read') && <NavLink to="/approvals"><SidebarIcon name="approvals"/><span>Phê duyệt</span></NavLink>}
        {auth.user && hasPermission(auth.user.role, 'staff.read') && <NavLink to="/staff"><SidebarIcon name="staff"/><span>Nhân viên</span></NavLink>}
        {auth.user && hasPermission(auth.user.role, 'price-brackets.read') && <NavLink to="/price-brackets"><SidebarIcon name="priceBrackets"/><span>Khung giá thu mua</span></NavLink>}
      </nav>
      <div className="sidebar-footer"><div className="sidebar-rule" /><button type="button" onClick={logout} disabled={busy}><SidebarIcon name="logout"/>{busy ? 'Đang đăng xuất…' : 'Đăng xuất'}</button></div>
    </aside>
    <div className="workspace">
      <header className="page-header"><span>{location.pathname.startsWith('/reports') ? <>Báo cáo{location.pathname === '/reports/profit' && <span className="purchase-breadcrumb"> / Xem báo cáo lợi nhuận</span>}{location.pathname === '/reports/cash-flow' && <span className="purchase-breadcrumb"> / Xem báo cáo dòng tiền</span>}{location.pathname === '/reports/aged-stock' && <span className="purchase-breadcrumb"> / Xem báo cáo hàng tồn lâu</span>}{location.pathname === '/reports/purchase-cost' && <span className="purchase-breadcrumb"> / Xem báo cáo chi phí thu mua</span>}{location.pathname === '/reports/revenue' && <span className="purchase-breadcrumb"> / Xem báo cáo doanh thu bán hàng</span>}</> : purchaseEditor ? <>Thu mua<span className="purchase-breadcrumb"> / Tạo giao dịch</span></> : salesEditor ? <>Bán hàng<span className="purchase-breadcrumb"> / Tạo giao dịch</span></> : heading}</span><span className="account-name"><CircleUserRound aria-hidden="true" />{auth.user?.displayName}</span></header>
      <main id="main-content" data-detail={isDetail} tabIndex={-1}>
        {auth.notice && <Notice onClose={auth.clearNotice}>{auth.notice}</Notice>}
        {logoutError && <Notice error onClose={() => setLogoutError('')}>{logoutError}</Notice>}
        <Outlet />
      </main>
    </div>
  </div>;
}
