import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ScanLine, Search, Pencil } from 'lucide-react';
import { useAuth } from '../auth/use-auth';
import { useResource } from '../reference-data/use-resource';
import { useListPageSize } from '../reference-data/use-list-page-size';
import { inventoryFilters, type InventoryItem } from '../../services/inventory';
import { Button } from '../../components/ui/Button';
import { PaginatedTable, Pagination } from '../../components/ui/DataTable';
import { ResultDialog } from '../../components/ui/ResultDialog';
import { formatMoney, formatCalendarDate } from '../../domain/formatters';
import { InventoryEditForm } from './InventoryEditForm';

function Price({ item }: { item: InventoryItem }) {
  return <span className="inventory-price">{item.discount === 30 && <del>{formatMoney(item.originalPrice!)}</del>}
    <strong>{formatMoney(item.price)}</strong>{item.discount && <span className={`inventory-discount milestone-${item.discount}`}>{item.discount === 45 ? 'Đồng giá' : '-30%'}</span>}</span>;
}
function Status({ item }: { item: InventoryItem }) { return <span className={`inventory-status ${item.status}`}>{item.statusLabel}</span>; }

export function InventoryPage() {
  const { inventory } = useAuth(); const navigate = useNavigate();
  const [input, setInput] = useState(inventoryFilters), [filters, setFilters] = useState(inventoryFilters), [page, setPage] = useState(1);
  const [dismissed, setDismissed] = useState(false), code = useRef<HTMLInputElement>(null);
  const { ref, pageSize } = useListPageSize(page, setPage);
  const load = useCallback(() => inventory.list(filters, page, pageSize), [inventory, filters, page, pageSize]);
  const { data, error, loading } = useResource(load);
  useEffect(() => { if (data && data.requestedPage === page && data.page !== page) setPage(data.page); }, [data, page]);
  function search(event: FormEvent) { event.preventDefault(); setFilters({ ...input }); setPage(1); setDismissed(false); }
  const searching = Object.values(filters).some(Boolean);
  return <section ref={ref} data-page-size={pageSize} className="reference-page reference-list inventory-list">
    <form className="inventory-search" onSubmit={search} aria-label="Tìm kiếm hàng hóa">
      <div className="inventory-filter-fields">
        <label>Mã sản phẩm<input ref={code} placeholder="Nhập mã sản phẩm" value={input.query} onChange={e => setInput({ ...input, query: e.target.value })}/></label>
        <Button type="button" className="inventory-scan" disabled><ScanLine aria-hidden="true"/>Quét mã vạch</Button>
        <label>Loại hàng<select value={input.type} onChange={e => setInput({ ...input, type: e.target.value })}><option value="">Tất cả</option>{data?.types.map(v => <option key={v}>{v}</option>)}</select></label>
        <label>Thương hiệu<select value={input.brand} onChange={e => setInput({ ...input, brand: e.target.value })}><option value="">Tất cả</option>{data?.brands.map(v => <option key={v}>{v}</option>)}</select></label>
        <label>Ngày nhập<input type="date" value={input.date} onChange={e => setInput({ ...input, date: e.target.value })}/></label>
      </div>
      <div className="inventory-actions"><Button className="button-beige" type="submit"><Search aria-hidden="true"/>Tìm kiếm</Button><Button type="button" className="button-secondary" onClick={() => { setInput(inventoryFilters); setFilters({ ...inventoryFilters }); setPage(1); setDismissed(false); }}>Xóa bộ lọc</Button></div>
    </form>
    {loading ? <p role="status">Đang tải hàng hóa…</p> : <PaginatedTable headers={['Mã sản phẩm', 'Tên sản phẩm', 'Giá bán hiện hành', 'Trạng thái', 'Ngày nhập']}
      columnWidths={['17%', '29%', '26%', '14%', '14%']}
      empty={!error && !data?.total ? 'Không tìm thấy sản phẩm' : undefined}
      pagination={data && <Pagination page={data.page} pages={data.pages} onChange={setPage}/>}>
      {data?.rows.map(row => <tr key={row.id} onClick={e => { if (!e.defaultPrevented) navigate(`/inventory/${row.id}`); }}><td><Link to={row.id}>{row.id}</Link></td><td>{row.name}</td><td><Price item={row}/></td><td><Status item={row}/></td><td>{formatCalendarDate(row.enteredOn)}</td></tr>)}
    </PaginatedTable>}
    {Boolean(error) && !dismissed && <ResultDialog error message={searching ? 'Không thể tìm kiếm hàng hóa. Hãy thử lại' : 'Không thể tải thông tin hàng hóa. Hãy thử lại'} onClose={() => setDismissed(true)}/>}
  </section>;
}

export function InventoryDetail() {
  const { productId = '' } = useParams(), { inventory } = useAuth(), navigate = useNavigate();
  const load = useCallback(() => inventory.item(productId), [inventory, productId]);
  const { data, error, loading, reload } = useResource(load);
  const [editing, setEditing] = useState<InventoryItem>(), [success, setSuccess] = useState(false);
  return <section className="reference-page inventory-detail">
    <Link className="back-link" to="/inventory"><ArrowLeft aria-hidden="true"/>Quay lại</Link><h1>Chi tiết sản phẩm</h1>
    {loading ? <p role="status">Đang tải hàng hóa…</p> : data && <article className="inventory-card record-card">
      <div className="inventory-card-title"><h2>{data.name}</h2><Status item={data}/></div>
      <dl>{[['Mã sản phẩm', data.id], ['Loại hàng', data.type], ['Thương hiệu', data.brand], ['Độ mới', data.condition],
        ['Giá bán hiện hành', <Price item={data}/>], ['Trạng thái', data.statusLabel], ['Ngày nhập', formatCalendarDate(data.enteredOn)],
        ['Số ngày tồn', data.status === 'sold' ? '–' : `${data.days} ngày`]].map(([label, value]) => <div key={String(label)}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      {data.status !== 'sold' && <Button className="button-secondary" disabled={data.status !== 'available'} onClick={() => setEditing(data)}><Pencil aria-hidden="true"/>Sửa thông tin</Button>}
    </article>}
    {Boolean(error) && <ResultDialog error message="Không thể tải thông tin hàng hóa. Hãy thử lại" onClose={() => navigate('/inventory', { replace: true })}/>}
    {editing && <InventoryEditForm key={`${editing.id}:${editing.version}`} item={editing} onClose={() => setEditing(undefined)} onSaved={() => { setEditing(undefined); setSuccess(true); reload(); }} onStale={async () => { const fresh = await inventory.item(productId); setEditing(fresh.status === 'available' ? fresh : undefined); reload(); }}/>}
    {success && <ResultDialog message="Cập nhật thành công!" onClose={() => setSuccess(false)}/>}
  </section>;
}
