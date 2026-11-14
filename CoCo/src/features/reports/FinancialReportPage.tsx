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

export function FinancialReportPage({ kind }: { kind: 'profit' | 'cash-flow' }) {
  const { reports } = useAuth();
  const [input, setInput] = useState<ReportPeriodInput>(), [page, setPage] = useState(1), [dismissed, setDismissed] = useState(false);
  const { ref, pageSize } = useListPageSize(page, setPage);
  const load = useCallback(() => input ? reports.financial(input, kind) : Promise.resolve(null), [reports, input, kind]);
  const { data, loading, error } = useResource(load), rows = paginate(data?.rows ?? [], page, pageSize);
  const labels = kind === 'profit' ? ['Tổng số doanh thu bán hàng', 'Tổng giá vốn sản phẩm đã bán', 'Lợi nhuận gộp'] : ['Tổng tiền thu vào', 'Tổng tiền chi ra', 'Dòng tiền thuần'];
  const empty = kind === 'profit' ? 'Không có dữ liệu bán hàng để tính lợi nhuận trong thời gian đã chọn' : 'Không có dữ liệu dòng tiền trong khoảng thời gian này';
  function confirm(period: ReportPeriod) {
    setInput(period.kind === 'range' ? { kind: 'range', start: period.startDate, end: period.endDate }
      : { kind: period.kind, value: period.startDate.slice(0, period.kind === 'year' ? 4 : period.kind === 'month' ? 7 : 10) });
    setPage(1); setDismissed(false);
  }
  return <section ref={ref} className="reference-page reference-list reports-page" data-page-size={pageSize} aria-label={kind === 'profit' ? 'Báo cáo lợi nhuận' : 'Báo cáo dòng tiền'}>
    <Link className="back-link" to="/reports"><ArrowLeft aria-hidden="true"/>Quay lại</Link>
    <ReportPeriodForm onConfirm={confirm}/>
    {input && loading && <p role="status">Đang tải báo cáo…</p>}
    {data && !error ? <>
      <div className="report-summary">{[data.summary.incoming, data.summary.outgoing, data.summary.net].map((value, i) => <article key={labels[i]}><h2>{labels[i]}</h2><strong>{formatMoney(value)}</strong></article>)}</div>
      <PaginatedTable headers={['Ngày/Kỳ báo cáo', ...labels]} rowDividers={false}
        empty={!data.summary.count ? empty : undefined}
        footer={Boolean(data.summary.count) && <tr><th scope="row">Tổng cộng</th><td>{formatMoney(data.summary.incoming)}</td><td>{formatMoney(data.summary.outgoing)}</td><td>{formatMoney(data.summary.net)}</td></tr>}
        pagination={Boolean(data.summary.count) && <Pagination page={rows.page} pages={rows.pages} onChange={setPage}/>}>
        {rows.rows.map(row => <tr key={row.date}><td>{formatCalendarDate(row.date)}</td><td>{formatMoney(row.incoming)}</td><td>{formatMoney(row.outgoing)}</td><td>{formatMoney(row.net)}</td></tr>)}
      </PaginatedTable>
    </> : <div className="report-blank" aria-label="Kết quả báo cáo"/>}
    {Boolean(error) && !dismissed && <ResultDialog error message="Lỗi hệ thống, vui lòng thử lại sau" onClose={() => setDismissed(true)}/>}
  </section>;
}
