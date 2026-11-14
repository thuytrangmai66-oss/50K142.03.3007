import { useCallback, useState, type FormEvent } from 'react';
import { ArrowLeft, CircleAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/use-auth';
import { useResource } from '../reference-data/use-resource';
import { useListPageSize } from '../reference-data/use-list-page-size';
import { PaginatedTable, Pagination } from '../../components/ui/DataTable';
import { ResultDialog } from '../../components/ui/ResultDialog';
import { Button } from '../../components/ui/Button';
import { formatCalendarDate, formatMoney } from '../../domain/formatters';
import { paginate } from '../../domain/pagination';
import { AGED_DAYS_ERROR, type AgedStockFilters } from '../../services/aged-stock-report';

export function AgedStockReportPage() {
  const { reports } = useAuth();
  const [days, setDays] = useState(''), [type, setType] = useState(''), [brand, setBrand] = useState('');
  const [input, setInput] = useState<AgedStockFilters>(), [invalid, setInvalid] = useState(false), [dismissed, setDismissed] = useState(false), [page, setPage] = useState(1);
  const { ref, pageSize } = useListPageSize(page, setPage);
  const catalogLoad = useCallback(() => reports.agedStock({ minDays: 1, type: '', brand: '' }), [reports]);
  const catalog = useResource(catalogLoad);
  const load = useCallback(() => input ? reports.agedStock(input) : Promise.resolve(null), [reports, input]);
  const { data, loading, error } = useResource(load), rows = paginate(data?.rows ?? [], page, pageSize);
  function confirm(event: FormEvent) {
    event.preventDefault();
    if (!/^\d+$/.test(days) || !Number.isSafeInteger(Number(days)) || Number(days) <= 0) { setInvalid(true); return; }
    catalog.reload();
    setInvalid(false); setDismissed(false); setPage(1); setInput({ minDays: Number(days), type, brand });
  }
  return <section ref={ref} className="reference-page reference-list reports-page aged-stock-report" data-page-size={pageSize}>
    <Link className="back-link" to="/reports"><ArrowLeft aria-hidden="true"/>Quay lại</Link>
    <form className="report-period-form aged-stock-form" onSubmit={confirm} noValidate aria-label="Điều kiện tồn lâu">
      <div className="aged-stock-fields">
        <label>Số ngày tồn tối thiểu<input placeholder="60" inputMode="numeric" value={days} aria-invalid={invalid} aria-describedby={invalid ? 'aged-days-error' : undefined} onChange={e => setDays(e.target.value)}/></label>
        <label>Loại hàng<select value={type} onChange={e => setType(e.target.value)}><option value="">Tất cả</option>{catalog.data?.types.map(value => <option key={value}>{value}</option>)}</select></label>
        <label>Thương hiệu (nếu có)<select value={brand} onChange={e => setBrand(e.target.value)}><option value="">Tất cả</option>{catalog.data?.brands.map(value => <option key={value}>{value}</option>)}</select></label>
        <Button type="submit">Xác nhận</Button>
      </div>
      {invalid && <p id="aged-days-error" className="field-error" role="alert"><CircleAlert aria-hidden="true"/>{AGED_DAYS_ERROR}</p>}
    </form>
    {loading && input && <p role="status">Đang tải báo cáo…</p>}
    {data && !error ? <>
      <div className="report-summary aged-stock-summary"><article><h2>Số sản phẩm tồn lâu</h2><strong>{data.total}</strong></article><article><h2>Số ngày tồn kho tối thiểu</h2><strong>{data.minDays} ngày</strong></article></div>
      <PaginatedTable headers={['Mã sản phẩm', 'Tên sản phẩm', 'Loại hàng', 'Ngày nhập kho', 'Số ngày tồn kho', 'Giá thu mua', 'Giá bán hiện tại', 'Trạng thái']} rowDividers={false}
        empty={!data.total ? 'Không có sản phẩm tồn kho phù hợp với điều kiện đã chọn' : undefined}
        pagination={Boolean(data.total) && <Pagination page={rows.page} pages={rows.pages} onChange={setPage}/>}>
        {rows.rows.map(row => <tr key={row.id}><td>{row.id}</td><td>{row.name}</td><td>{row.type}</td><td>{formatCalendarDate(row.enteredOn)}</td><td>{row.days}</td><td>{formatMoney(row.cost)}</td><td>{formatMoney(row.price)}</td><td><span className="aged-stock-badge">{row.status}</span></td></tr>)}
      </PaginatedTable>
    </> : <div className="report-blank" aria-label="Kết quả báo cáo"/>}
    {Boolean(error || catalog.error) && !dismissed && <ResultDialog error message="Lỗi hệ thống, vui lòng thử lại sau" onClose={() => setDismissed(true)}/>}
  </section>;
}
