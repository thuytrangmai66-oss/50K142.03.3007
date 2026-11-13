import { useCallback, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../auth/use-auth';
import { useResource } from '../reference-data/use-resource';
import { DataTable } from '../../components/ui/DataTable';
import type { HistoryKind } from '../../services/reference-data/contracts';
import { formatCalendarDate, formatDate } from '../../domain/formatters';
import { ResultDialog } from '../../components/ui/ResultDialog';
import { PurchaseInvoicePage } from '../purchases/PurchaseInvoicePage';
import { CustomerToolbar } from './CustomerToolbar';
import { SaleInvoiceCard } from '../sales/SaleInvoiceCard';

export function CustomerHistoryPage({ kind }: { kind: HistoryKind }) {
  const { customerId = '' } = useParams(); const { referenceData } = useAuth();
  const load = useCallback(() => referenceData.history(customerId, kind), [referenceData, customerId, kind]);
  const { data, loading, error } = useResource(load);
  const loadCustomer = useCallback(() => referenceData.customer(customerId), [referenceData, customerId]);
  const { data: profile } = useResource(loadCustomer);
  const customer = data?.customer ?? profile?.record;
  const [dismissedError, setDismissedError] = useState<unknown>();
  return <section className={`reference-page${kind === 'purchases' ? ' customer-purchase-history' : ''}`}><CustomerToolbar /><Link className="back-link" to={`/customers/${customerId}`}><ArrowLeft aria-hidden="true" />Quay lại</Link>
    {loading ? <p role="status">Đang tải lịch sử…</p> : Boolean(data || error) && <div className="history-card">
      {customer && <div className="customer-summary"><p><strong>Họ tên: </strong>{customer.TenKH}</p><p><strong>SĐT: </strong>{customer.SoDienThoaiKH}</p></div>}
      <DataTable headers={['Mã giao dịch','Thời gian','Trạng thái']} empty={!error && !data?.rows.length ? kind === 'purchases' ? 'Không tìm thấy lịch sử mua' : 'Không tìm thấy lịch sử bán' : undefined}>
        {data?.rows.map(row => <tr key={row.id}><td><Link to={row.id}>{row.id}</Link></td><td>{kind === 'sales' ? formatCalendarDate(row.date) : formatDate(row.date)}</td><td>{row.statusLabel ?? 'Chưa xác định'}</td></tr>)}
      </DataTable></div>}
    {Boolean(error) && error !== dismissedError && <ResultDialog error message="Lỗi không thể truy xuất" onClose={() => setDismissedError(error)} />}
  </section>;
}
export function CustomerInvoicePage({ kind }: { kind: HistoryKind }) {
  return kind === 'sales' ? <PurchaseInvoicePage fromHistory /> : <CustomerPurchaseInvoicePage kind={kind} />;
}
function CustomerPurchaseInvoicePage({ kind }: { kind: HistoryKind }) {
  const { customerId = '', invoiceId = '' } = useParams(); const { referenceData } = useAuth();
  const navigate = useNavigate();
  const load = useCallback(() => referenceData.invoice(customerId, kind, invoiceId), [referenceData, customerId, kind, invoiceId]);
  const { data, loading, error } = useResource(load);
  const presentation = data && data.subtotal !== undefined && data.discount !== undefined && data.paymentLabel !== undefined ? {
    id: data.id, date: data.date, subtotal: data.subtotal, discount: data.discount, total: data.total, paymentLabel: data.paymentLabel,
    customer: { name: data.customer.TenKH, phone: data.customer.SoDienThoaiKH, points: data.customerPoints }, lines: data.lines,
  } : undefined;
  return <section className="reference-page"><CustomerToolbar /><Link className="back-link" to={`/customers/${customerId}/${kind}`}><ArrowLeft aria-hidden="true" />Quay lại</Link>
    {loading ? <p role="status">Đang tải hóa đơn…</p> : presentation && <SaleInvoiceCard data={presentation}/>}
    {(Boolean(error) || (!loading && !presentation)) && <ResultDialog error message="Không thể tải thông tin giao dịch. Vui lòng thử lại" onClose={() => navigate(`/customers/${customerId}/${kind}`, { replace: true })}/>}
  </section>;
}
