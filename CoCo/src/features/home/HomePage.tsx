import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { DollarSign, ShoppingCart, ShoppingBag, Clock, Package, UserRoundPlus, type LucideIcon } from 'lucide-react';
import { useAuth } from '../auth/use-auth';
import { HomeQuickActions } from './HomeQuickActions';
import { useResource } from '../reference-data/use-resource';
import { ResultDialog } from '../../components/ui/ResultDialog';
import { formatMoney } from '../../domain/formatters';
import { vietnamDay } from '../../domain/inventory';

function KpiCard({ title, value, caption, icon: Icon, positive = false }: {
  title: string; value: ReactNode; caption?: string; icon: LucideIcon; positive?: boolean;
}) {
  return <article className="home-kpi" aria-label={title}>
    <span className="home-kpi-icon"><Icon aria-hidden="true"/></span>
    <div className="home-kpi-copy"><h2>{title}</h2><p className="home-kpi-value">{value}</p>
      {caption && <p className={`home-kpi-caption${positive ? ' home-kpi-positive' : ''}`}>{caption}</p>}
    </div>
  </article>;
}

export function HomePage() {
  const { user, dashboard } = useAuth();
  const [day, setDay] = useState(() => vietnamDay(new Date()));
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    const timer = setInterval(() => setDay(vietnamDay(new Date())), 30_000);
    return () => clearInterval(timer);
  }, []);
  const load = useCallback(async () => {
    // Include the day so an open dashboard refreshes across Vietnam midnight.
    void day;
    return user?.role === 'owner'
      ? { role: 'owner' as const, summary: await dashboard.ownerSummary() }
      : { role: 'staff' as const, summary: await dashboard.staffSummary() };
  }, [user?.role, dashboard, day]);
  const { data, loading, error, reload } = useResource(load);
  return <section className="home-dashboard" aria-label="Trang chủ CoCo">
    <h1 className="sr-only">Trang chủ</h1>
    {loading && <p role="status">Đang tải dữ liệu…</p>}
    {Boolean(error) && <><button className="coco-button" onClick={() => { setDismissed(false); reload(); }}>Thử lại</button>
      {!dismissed && <ResultDialog error message="Lỗi hệ thống, vui lòng thử lại sau" onClose={() => setDismissed(true)}/>}</>}
    {data?.role === 'owner' && <div className="home-kpis" aria-label="KPI Chủ cửa hàng">
      <KpiCard icon={DollarSign} title="Doanh thu hôm nay" value={formatMoney(data.summary.revenue.today)}
        positive={data.summary.revenue.comparison.percent !== null && data.summary.revenue.comparison.percent > 0}
        caption={data.summary.revenue.comparison.percent === null ? 'Chưa có cơ sở so với hôm qua'
          : `${data.summary.revenue.comparison.percent > 0 ? '+' : ''}${data.summary.revenue.comparison.percent.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}% so với hôm qua`}/>
      <KpiCard icon={ShoppingCart} title="Đơn hàng hôm nay" value={`${data.summary.orders.today} đơn`}
        positive={data.summary.orders.delta > 0}
        caption={`${data.summary.orders.delta > 0 ? '+' : ''}${data.summary.orders.delta} đơn so với hôm qua`}/>
      <KpiCard icon={Clock} title="Yêu cầu chờ phê duyệt" value={`${data.summary.pendingApprovals} phiếu`}/>
      <KpiCard icon={Package} title="Sản phẩm tồn kho" value={data.summary.stock.unverifiedCount ? 'Chưa xác minh' : `${data.summary.stock.knownAvailableCount} sản phẩm`}
        positive={data.summary.stock.comparison.percent !== null && data.summary.stock.comparison.percent > 0}
        caption={data.summary.stock.unverifiedCount ? `${data.summary.stock.unverifiedCount} sản phẩm chưa đối chiếu trạng thái`
          : data.summary.stock.comparison.percent === null ? 'Chưa đủ cơ sở so với tháng trước'
            : `${data.summary.stock.comparison.percent > 0 ? '+' : ''}${data.summary.stock.comparison.percent.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}% so với tháng trước`}/>
    </div>}
    {data?.role === 'staff' && <div className="home-kpis" aria-label="KPI Nhân viên">
      <KpiCard icon={ShoppingBag} title="Đơn thu mua hôm nay" value={`${data.summary.purchaseOrders} đơn`}/>
      <KpiCard icon={ShoppingCart} title="Đơn hàng hôm nay" value={`${data.summary.salesOrders} đơn`}/>
      <KpiCard icon={Package} title="Sản phẩm mới nhập" value={`${data.summary.importedProducts} sản phẩm`}/>
      <KpiCard icon={UserRoundPlus} title="Khách hàng mới" value={`${data.summary.customers.newCustomerCount} người đã xác minh`}
        caption={`${data.summary.customers.coverage.totalRecords - data.summary.customers.coverage.eligibleRecords} hồ sơ chưa có ngày tạo tin cậy`}/>
    </div>}
    <HomeQuickActions/>
  </section>;
}
