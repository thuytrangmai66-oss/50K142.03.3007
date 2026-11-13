import { useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../auth/use-auth';
import { useResource } from '../reference-data/use-resource';
import { DataTable } from '../../components/ui/DataTable';
import { ResultDialog } from '../../components/ui/ResultDialog';
import { CustomerToolbar } from '../customers/CustomerToolbar';
import { formatMoney, formatTransactionDateTime } from '../../domain/formatters';

/** Both entry points share the Figma invoice card. Employee/status remain in
 * the read model; their UI slots are BLOCKED by the user's design decision. */
export function PurchaseInvoicePage({ fromHistory = false }: { fromHistory?: boolean }) {
  const { customerId = '', invoiceId = '' } = useParams();
  const { purchaseDrafts, referenceData } = useAuth();
  const navigate = useNavigate();
  const backTo = fromHistory ? `/customers/${customerId}/sales` : '/purchases';
  const load = useCallback(() => fromHistory ? referenceData.invoice(customerId, 'sales', invoiceId)
    : purchaseDrafts.transaction(invoiceId), [fromHistory, referenceData, customerId, invoiceId, purchaseDrafts]);
  const { data, loading, error } = useResource(load);
  return <section className="reference-page purchase-invoice-page">
    {fromHistory && <CustomerToolbar />}
    <Link className="back-link" to={backTo}><ArrowLeft aria-hidden="true"/>Quay lại</Link>
    {loading ? <p role="status">Đang tải giao dịch…</p> : data && <article className="record-card purchase-invoice">
      <h1>Chi tiết giao dịch {data.id}</h1>
      <div className="record-body">
        <div className="purchase-invoice-info">
          <section><h2>Thông tin hóa đơn</h2><dl><div><dt>Mã hóa đơn</dt><dd>{data.id}</dd></div>
            <div><dt>Ngày giao dịch</dt><dd>{formatTransactionDateTime(data.date)}</dd></div></dl></section>
          <section><h2>Thông tin khách hàng</h2><dl><div><dt>Họ tên</dt><dd>{data.customer.TenKH}</dd></div>
            <div><dt>Số điện thoại</dt><dd>{data.customer.SoDienThoaiKH}</dd></div></dl></section>
        </div>
        <section className="purchase-invoice-lines"><h2>Danh sách sản phẩm</h2>
          <DataTable headers={['Sản phẩm', 'SL', 'Đơn giá', 'Thành tiền']}>
            {data.lines.map(line => <tr key={line.id}><td><strong>{line.name}</strong></td><td>{line.quantity}</td>
              <td>{formatMoney(line.unitPrice)}</td><td><strong>{formatMoney(line.total)}</strong></td></tr>)}
          </DataTable>
        </section>
        <p className="invoice-total"><span>Tổng tiền</span><strong>{formatMoney(data.total)}</strong></p>
      </div>
    </article>}
    {Boolean(error) && <ResultDialog error message="Không thể tải thông tin giao dịch" onClose={() => navigate(backTo, { replace: true })} />}
  </section>;
}
