import { useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../auth/use-auth';
import { useResource } from '../reference-data/use-resource';
import { DataTable } from '../../components/ui/DataTable';
import { ResultDialog } from '../../components/ui/ResultDialog';
import { formatCalendarDate, formatTransactionDateTime, formatMoney } from '../../domain/formatters';

const labels = { running: 'Đang chạy', success: 'Thành công', error: 'Thất bại', interrupted: 'Bị gián đoạn' };
export function DiscountMonitor() {
  const { discounts } = useAuth(), navigate = useNavigate(); const load = useCallback(() => discounts.read(), [discounts]);
  const { data, loading, error } = useResource(load);
  return <section className="reference-page discount-monitor"><Link className="back-link" to="/inventory"><ArrowLeft aria-hidden="true"/>Quay lại</Link>
    {loading ? <p role="status">Đang tải thông tin…</p> : data && <>
      <div className="discount-summary">
        <article><h2>Lượt chạy gần nhất</h2><strong>{data.latest ? formatCalendarDate(data.latest.executedAt) : '–'}</strong>{data.latest && <span className={`discount-run-status ${data.latest.status}`}>{labels[data.latest.status]}</span>}</article>
        {([['Sản phẩm được xét', data.latest?.scanned], ['Đã cập nhật giá', data.latest?.updated], ['Giữ nguyên giá', data.latest?.kept], ['Lỗi', data.latest?.errors]] as const).map(([title, count]) => <article key={title}><h2>{title}</h2><strong>{count ?? '–'}</strong></article>)}
      </div>
      <div className="discount-policies"><article><h2>Chính sách theo ngày tồn</h2><p><span className="inventory-discount">30 ngày</span>Giảm 30% so với giá bán ban đầu</p><p><span className="inventory-discount milestone-45">45 ngày</span>Đồng giá 20.000đ</p></article>
        <article><h2>Lịch xử lý</h2><dl>{[['Tần suất', 'Hằng ngày'], ['Giờ chạy', '00:00'], ['Lượt chạy kế tiếp', formatCalendarDate(data.next)], ['Trạng thái lịch', 'Đang bật']].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></article></div>
      <article className="discount-history"><h2>Lịch sử lượt chạy</h2><DataTable headers={['Thời gian', 'Kết quả', 'Sản phẩm được xét', 'Cập nhật giá', 'Lỗi', 'Ghi chú']}>
        {data.runs.map(run => <tr key={run.id}><td>{formatTransactionDateTime(run.executedAt)}</td><td><span className={`discount-run-status ${run.status}`}>{labels[run.status]}</span></td><td>{run.scanned}</td><td>{run.updated}</td><td>{run.errors}</td><td>{run.notes.join('; ') || '–'}</td></tr>)}
      </DataTable></article>
      <article className="discount-history"><h2>Nhật ký thay đổi giá tự động</h2><DataTable headers={['Thời gian', 'Mã sản phẩm', 'Mốc áp dụng', 'Giá trước', 'Giá sau', 'Kết quả']}>
        {data.changes.map(row => <tr key={`${row.MaSP}:${row.cycleStartedOn}:${row.milestone}`}><td>{formatTransactionDateTime(row.executedAt)}</td><td><Link to={`/inventory/${row.MaSP}`}>{row.MaSP}</Link></td><td><span className={`inventory-discount milestone-${row.milestone}`}>{row.milestone === 30 ? '30 ngày · -30%' : '45 ngày · đồng giá'}</span></td><td>{formatMoney(row.priceBefore)}</td><td><strong>{formatMoney(row.priceAfter)}</strong></td><td><span className="discount-run-status success">Thành công</span></td></tr>)}
      </DataTable></article>
    </>}
    {Boolean(error) && <ResultDialog error message="Không thể tải thông tin hàng hóa. Hãy thử lại" onClose={() => navigate('/inventory', { replace: true })}/>}
  </section>;
}
