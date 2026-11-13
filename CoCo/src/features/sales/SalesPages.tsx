import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Search } from 'lucide-react';
import { useAuth } from '../auth/use-auth';
import { useResource } from '../reference-data/use-resource';
import { useListPageSize } from '../reference-data/use-list-page-size';
import { Button } from '../../components/ui/Button';
import { PaginatedTable, Pagination } from '../../components/ui/DataTable';
import { ResultDialog } from '../../components/ui/ResultDialog';
import { formatCalendarDate } from '../../domain/formatters';
import type { SalesFilters } from '../../services/sales-queries';
import { SaleInvoiceCard } from './SaleInvoiceCard';

const emptyFilters: SalesFilters = { id: '', phone: '', name: '', date: '' };
export function SalesPage() {
  const { salesQueries } = useAuth(), navigate = useNavigate();
  const [input, setInput] = useState(emptyFilters), [filters, setFilters] = useState(emptyFilters), [page, setPage] = useState(1);
  const [dismissed, setDismissed] = useState(false);
  const { ref, pageSize } = useListPageSize(page, setPage);
  const load = useCallback(() => salesQueries.list(filters, page, pageSize), [salesQueries, filters, page, pageSize]);
  const { data, loading, error, reload } = useResource(load);
  useEffect(() => { if (data && data.requestedPage === page && data.page !== page) setPage(data.page); }, [data, page]);
  function search(event: FormEvent) { event.preventDefault(); setFilters({ ...input }); setPage(1); setDismissed(false); }
  const searching = Object.values(filters).some(value => value.trim());
  return <section ref={ref} data-page-size={pageSize} className="reference-page reference-list sales-list">
    <form className="reference-toolbar purchase-search" onSubmit={search} aria-label="Tìm kiếm giao dịch bán hàng">
      <div className="purchase-filter-fields">
        <label>Mã giao dịch<input placeholder="Nhập mã" value={input.id} onChange={event => setInput({ ...input, id: event.target.value })}/></label>
        <label>Số điện thoại<input placeholder="Nhập số điện thoại" inputMode="tel" value={input.phone} onChange={event => setInput({ ...input, phone: event.target.value })}/></label>
        <label>Tên khách hàng<input placeholder="Nhập họ và tên" value={input.name} onChange={event => setInput({ ...input, name: event.target.value })}/></label>
        <label>Thời gian<input type="date" value={input.date} onChange={event => setInput({ ...input, date: event.target.value })}/></label>
      </div>
      <div className="purchase-search-actions"><Button className="button-beige" type="submit"><Search aria-hidden="true"/>Tìm kiếm</Button>
        <Button className="sales-reset" type="button" onClick={() => { setInput(emptyFilters); setFilters({ ...emptyFilters }); setPage(1); setDismissed(false); reload(); }}>Xóa bộ lọc</Button>
        <Button type="button" className="purchase-create" onClick={() => navigate('/sales/new')}><Plus aria-hidden="true"/>Tạo giao dịch</Button>
      </div>
    </form>
    {loading ? <p role="status">Đang tải giao dịch…</p> : error ? <p role="alert">Không thể tải dữ liệu giao dịch bán hàng</p> :
      <PaginatedTable headers={['Mã giao dịch', 'Số điện thoại', 'Tên khách hàng', 'Thời gian']} columnWidths={['25%', '23%', '29%', '23%']}
        empty={!data?.total ? searching ? 'Không tìm thấy giao dịch bán hàng' : 'Chưa có giao dịch bán hàng' : undefined}
        pagination={data && <Pagination page={data.page} pages={data.pages} onChange={setPage}/>}>
        {data?.rows.map(row => <tr key={row.id} onClick={event => { if (!event.defaultPrevented) navigate(`/sales/transactions/${row.id}`); }}>
          <td><Link to={`/sales/transactions/${row.id}`}>{row.id}</Link></td><td>{row.phone}</td><td>{row.name}</td><td>{formatCalendarDate(row.date)}</td>
        </tr>)}
      </PaginatedTable>}
    {Boolean(error) && !dismissed && <ResultDialog error message="Không thể tải thông tin giao dịch. Vui lòng thử lại" onClose={() => setDismissed(true)}/>}
  </section>;
}

export function SaleInvoicePage() {
  const { invoiceId = '' } = useParams(), { salesQueries } = useAuth(), navigate = useNavigate();
  const load = useCallback(() => salesQueries.invoice(invoiceId), [salesQueries, invoiceId]);
  const { data, loading, error } = useResource(load);
  return <section className="reference-page sale-invoice-page">
    <Link className="back-link" to="/sales"><ArrowLeft aria-hidden="true"/>Quay lại</Link>
    {loading ? <p role="status">Đang tải hóa đơn…</p> : data && <SaleInvoiceCard data={data}/>}
    {Boolean(error) && <ResultDialog error message="Không thể tải thông tin giao dịch. Vui lòng thử lại" onClose={() => navigate('/sales', { replace: true })}/>}
  </section>;
}
