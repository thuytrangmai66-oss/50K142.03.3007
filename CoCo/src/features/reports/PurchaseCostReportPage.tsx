import { useCallback, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/use-auth';
import { useResource } from '../reference-data/use-resource';
import { useListPageSize } from '../reference-data/use-list-page-size';
import { PaginatedTable, Pagination } from '../../components/ui/DataTable';
import { ResultDialog } from '../../components/ui/ResultDialog';
import { formatCalendarDate, formatMoney } from '../../domain/formatters';
import { paginate } from '../../domain/pagination';
import type { ReportPeriod, ReportPeriodInput } from '../../lib/vietnam-time';
import { ReportPeriodForm } from './ReportPeriodForm';


function periodInput(period: ReportPeriod): ReportPeriodInput {
  if (period.kind === 'range') return { kind: 'range', start: period.startDate, end: period.endDate };
  return { kind: period.kind, value: period.startDate.slice(0, period.kind === 'year' ? 4 : period.kind === 'month' ? 7 : 10) };
}

const headings = ['Ngày/Kỳ báo cáo', 'Tổng số giao dịch thu mua', 'Tổng số sản phẩm thu mua', 'Tổng chi phí thu mua', 'Chi phí thu mua trung bình/giao dịch'];
export function PurchaseCostReportPage() {
  const { reports } = useAuth();
  const [input, setInput] = useState<ReportPeriodInput>(), [page, setPage] = useState(1);
  const [dismissed, setDismissed] = useState(false);
  const { ref, pageSize } = useListPageSize(page, setPage);
  const load = useCallback(() => input ? reports.purchaseCost(input) : Promise.resolve(null), [reports, input]);
  const { data, loading, error } = useResource(load);
  const rows = paginate(data?.rows ?? [], page, pageSize);
  const hasResults = Boolean(data) && !error;
  const message = error ? 'Lỗi hệ thống, vui lòng thử lại sau' : '';
  return <section ref={ref} className="reference-page reference-list reports-page" data-page-size={pageSize} aria-label="Báo cáo chi phí thu mua">
    <Link className="back-link" to="/reports"><ArrowLeft aria-hidden="true"/>Quay lại</Link>
    <ReportPeriodForm onConfirm={period => { setInput(periodInput(period)); setPage(1); setDismissed(false); }}/>
    {input && loading && <p role="status">Đang tải báo cáo…</p>}
    {hasResults && data ? <>
      <div className="report-summary report-cost-summary" aria-label="Tổng hợp chi phí thu mua">
        <article><h2>{headings[1]}</h2><strong>{data.summary.invoiceCount}</strong></article>
        <article><h2>{headings[2]}</h2><strong>{data.summary.productCount}</strong></article><article><h2>{headings[3]}</h2><strong>{formatMoney(data.summary.totalCost)}</strong></article>
        <article><h2>{headings[4]}</h2><strong>{formatMoney(data.summary.averageCost)}</strong></article>
      </div>
      <PaginatedTable headers={headings} columnWidths={['18%', '20%', '19%', '20%', '23%']} rowDividers={false}
        empty={!data.summary.invoiceCount ? 'Không có dữ liệu chi phí thu mua trong khoảng thời gian này' : undefined}
        footer={Boolean(data.summary.invoiceCount) && <tr><th scope="row">Tổng cộng</th><td>{data.summary.invoiceCount}</td><td>{data.summary.productCount}</td><td>{formatMoney(data.summary.totalCost)}</td><td>{formatMoney(data.summary.averageCost)}</td></tr>}
        pagination={Boolean(data.summary.invoiceCount) && <Pagination page={rows.page} pages={rows.pages} onChange={setPage}/>}>
        {rows.rows.map(row => <tr key={row.date}><td>{formatCalendarDate(row.date)}</td><td>{row.invoiceCount}</td><td>{row.productCount}</td><td>{formatMoney(row.totalCost)}</td><td>{formatMoney(row.averageCost)}</td></tr>)}
      </PaginatedTable>
    </> : <div className="report-blank" aria-label="Kết quả báo cáo"/>}
    {message && !dismissed && <ResultDialog error message={message} onClose={() => setDismissed(true)}/>}
  </section>;
}
