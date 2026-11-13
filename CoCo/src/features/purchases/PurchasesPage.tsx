import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { useAuth } from '../auth/use-auth';
import { useResource } from '../reference-data/use-resource';
import { useListPageSize } from '../reference-data/use-list-page-size';
import { Button } from '../../components/ui/Button';
import { PaginatedTable, Pagination } from '../../components/ui/DataTable';
import { ResultDialog } from '../../components/ui/ResultDialog';
import { formatCalendarDate } from '../../domain/formatters';
import type { PurchaseFilters } from '../../services/purchase-drafts';

const emptyFilters: PurchaseFilters = { id: '', phone: '', name: '', date: '' };
export function PurchasesPage() {
  const { purchaseDrafts } = useAuth(), navigate = useNavigate();
  const [input, setInput] = useState(emptyFilters), [filters, setFilters] = useState(emptyFilters), [page, setPage] = useState(1);
  const [dismissed, setDismissed] = useState(false);
  const { ref, pageSize } = useListPageSize(page, setPage);
  const load = useCallback(() => purchaseDrafts.listTransactions(filters, page, pageSize), [purchaseDrafts, filters, page, pageSize]);
  const { data, loading, error } = useResource(load);
  useEffect(() => { if (data && data.requestedPage === page && data.page !== page) setPage(data.page); }, [data, page]);
  function search(event: FormEvent) { event.preventDefault(); setFilters({ ...input }); setPage(1); setDismissed(false); }
  const searching = Object.values(filters).some(value => value.trim());
  return <section ref={ref} data-page-size={pageSize} className="reference-page reference-list purchase-list">
    <form className="reference-toolbar purchase-search" onSubmit={search} aria-label="Tìm kiếm giao dịch thu mua">
      <div className="purchase-filter-fields">
        <label>Mã giao dịch<input placeholder="Nhập mã" value={input.id} onChange={event => setInput({ ...input, id: event.target.value })}/></label>
        <label>Số điện thoại<input placeholder="Nhập số điện thoại" inputMode="tel" value={input.phone} onChange={event => setInput({ ...input, phone: event.target.value })}/></label>
        <label>Tên khách hàng<input placeholder="Nhập họ và tên" value={input.name} onChange={event => setInput({ ...input, name: event.target.value })}/></label>
        <label>Thời gian<input type="date" value={input.date} onChange={event => setInput({ ...input, date: event.target.value })}/></label>
      </div>
      <div className="purchase-search-actions"><Button className="button-beige" type="submit"><Search aria-hidden="true"/>Tìm kiếm</Button>
        <Button className="button-secondary" type="button" onClick={() => { setInput(emptyFilters); setFilters({ ...emptyFilters }); setPage(1); setDismissed(false); }}>Xóa bộ lọc</Button>
        <Button type="button" className="purchase-create" onClick={() => navigate('/purchases/new')}><Plus aria-hidden="true"/>Tạo giao dịch</Button>
      </div>
    </form>
    {loading ? <p role="status">Đang tải giao dịch…</p> :
      <PaginatedTable headers={['Mã giao dịch', 'Số điện thoại', 'Tên khách hàng', 'Thời gian']} columnWidths={['20%', '23%', '37%', '20%']}
        empty={!error && !data?.total ? searching ? 'Không tìm thấy giao dịch thu mua' : 'Chưa có giao dịch thu mua' : undefined}
        pagination={data && <Pagination page={data.page} pages={data.pages} onChange={setPage}/>}>
        {data?.rows.map(row => <tr key={row.id} onClick={event => { if (!event.defaultPrevented) navigate(`/purchases/transactions/${row.id}`); }}><td><Link to={`/purchases/transactions/${row.id}`}>{row.id}</Link></td><td>{row.phone}</td><td>{row.name}</td><td>{formatCalendarDate(row.date)}</td></tr>)}
      </PaginatedTable>}
    {Boolean(error) && !dismissed && <ResultDialog error message="Không thể truy xuất giao dịch thu mua" onClose={() => setDismissed(true)} />}
  </section>;
}
