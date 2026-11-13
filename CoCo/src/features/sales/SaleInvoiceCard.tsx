import { DataTable } from '../../components/ui/DataTable';
import { formatMoney, formatTransactionDateTime } from '../../domain/formatters';

export interface SaleInvoicePresentation {
  id: string; date: string; paymentLabel: string;
  customer: { name: string; phone: string; points?: number };
  lines: { id: string; name: string; quantity: number; unitPrice: number; total: number }[];
  subtotal: number; discount: number; total: number;
}

/** Same source UI09 for Sales and customer purchase history; never recompute prices. */
export function SaleInvoiceCard({ data }: { data: SaleInvoicePresentation }) {
  return <article className="record-card purchase-invoice sale-invoice">
    <h1>Chi tiết hóa đơn {data.id}</h1><div className="record-body">
      <div className="purchase-invoice-info">
        <section><h2>Thông tin hóa đơn</h2><dl>
          <div><dt>Mã hóa đơn</dt><dd>{data.id}</dd></div><div><dt>Ngày giao dịch</dt><dd>{formatTransactionDateTime(data.date)}</dd></div>
          <div><dt>PTTT</dt><dd>{data.paymentLabel}</dd></div>
        </dl></section>
        <section><h2>Thông tin khách hàng</h2><dl><div><dt>Họ tên</dt><dd>{data.customer.name}</dd></div>
          <div><dt>Số điện thoại</dt><dd>{data.customer.phone}</dd></div><div><dt>Điểm tích lũy</dt><dd>{data.customer.points ?? 'Chưa xác định'}</dd></div>
        </dl></section>
      </div>
      <section className="purchase-invoice-lines"><h2>Danh sách sản phẩm</h2>
        <DataTable headers={['Sản phẩm', 'SL', 'Đơn giá', 'Thành tiền']}>
          {data.lines.map(line => <tr key={line.id}><td><strong>{line.name}</strong></td><td>{line.quantity}</td>
            <td>{formatMoney(line.unitPrice)}</td><td><strong>{formatMoney(line.total)}</strong></td></tr>)}
        </DataTable>
      </section>
      <dl className="sale-invoice-totals"><div><dt>Tổng tiền</dt><dd>{formatMoney(data.subtotal)}</dd></div>
        <div><dt>Khuyến mãi</dt><dd>{formatMoney(data.discount)}</dd></div><div><dt className="sr-only">Thực thanh toán</dt><dd>{formatMoney(data.total)}</dd></div>
      </dl>
    </div>
  </article>;
}
