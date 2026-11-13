import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil } from 'lucide-react';
import { useAuth } from '../auth/use-auth';
import { useResource } from '../reference-data/use-resource';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Field';
import { PaginatedTable, Pagination } from '../../components/ui/DataTable';
import { ResultDialog } from '../../components/ui/ResultDialog';
import { BracketForm } from './BracketForm';
import { formatMoney } from '../../domain/formatters';
import type { Bracket } from '../../services/reference-data/contracts';
import { CONDITIONS } from '../../domain/conditions';
import { useListPageSize } from '../reference-data/use-list-page-size';

export function PriceBracketsPage() {
  const { referenceData } = useAuth(); const [page, setPage] = useState(1);
  const [condition, setCondition] = useState('');
  const { ref, pageSize } = useListPageSize(page, setPage);
  const load = useCallback(() => referenceData.brackets(page, condition ? Number(condition) : undefined, pageSize), [referenceData, page, condition, pageSize]);
  const { data, loading, error, reload } = useResource(load);
  useEffect(() => { if (data && data.requestedPage === page && data.page !== page) setPage(data.page); }, [data, page]);
  const [creating, setCreating] = useState(false), [notice, setNotice] = useState(''), [dismissed, setDismissed] = useState(false);
  return <section ref={ref} data-page-size={pageSize} className="reference-page reference-list"><div className="reference-toolbar"><label className="condition-filter">Độ mới <select aria-label="Lọc độ mới" value={condition} onChange={event => { setCondition(event.target.value); setPage(1); }}><option value="">Tất cả</option>{CONDITIONS.map(item => <option value={item.code} key={item.code}>{item.label}</option>)}</select></label><Button onClick={() => setCreating(true)}><Plus aria-hidden="true" />Tạo khung giá</Button></div>
    {loading ? <p role="status">Đang tải khung giá…</p> : error ? <div className="panel" role="alert"><p>Không thể truy xuất thông tin khung giá thu mua</p><Button onClick={() => { setDismissed(false); reload(); }}>Thử lại</Button></div> :
      <PaginatedTable headers={['Mã khung giá','Loại hàng','Thương hiệu','Độ mới']} columnWidths={['20%','35%','30%','15%']} empty={!data?.total ? 'Chưa có khung giá thu mua' : undefined}
        pagination={data && <Pagination page={data.page} pages={data.pages} onChange={setPage} />}>
        {data?.rows.map(row => <tr key={row.record.MaKhungGia}><td><Link to={row.record.MaKhungGia}>{row.record.MaKhungGia}</Link></td><td><Link to={row.record.MaKhungGia}>{row.record.LoaiSanPham}</Link></td><td>{row.record.ThuongHieu}</td><td>{row.conditionLabel}</td></tr>)}
      </PaginatedTable>}
    {creating && <BracketForm onClose={() => setCreating(false)} onSaved={message => { setCreating(false); setNotice(message); reload(); }} />}
    {notice && <ResultDialog message={notice} onClose={() => setNotice('')} />}
    {Boolean(error) && !dismissed && <ResultDialog error message="Không thể truy xuất thông tin khung giá thu mua" onClose={() => setDismissed(true)} />}
  </section>;
}
export function PriceBracketDetailPage() {
  const { bracketId = '' } = useParams(); const { referenceData } = useAuth();
  const load = useCallback(() => referenceData.bracket(bracketId), [referenceData, bracketId]);
  const { data, loading, error, reload } = useResource(load);
  const [editing, setEditing] = useState<Bracket>(), [notice, setNotice] = useState('');
  return <section className="reference-page"><Link className="back-link" to="/price-brackets"><ArrowLeft aria-hidden="true" />Quay lại</Link>
    {loading ? <p role="status">Đang tải khung giá…</p> : error || !data ? <div className="panel" role="alert"><p>Không thể hiển thị dữ liệu khung giá</p><Button onClick={reload}>Thử lại</Button></div> : <article className="record-card"><h1>Thông tin khung giá thu mua</h1><div className="record-body">
      <div className="record-form"><Field label="Loại hàng" readOnly value={data.record.LoaiSanPham} /><Field label="Thương hiệu" readOnly value={data.record.ThuongHieu} /><Field label="Độ mới" readOnly value={data.conditionLabel} />
        <Field label="Giá tối thiểu (Min)" readOnly value={formatMoney(data.record.GiaMin)} /><Field label="Giá tối đa (Max)" readOnly value={formatMoney(data.record.GiaMax)} /></div>
      <div className="form-actions"><Button className="button-beige" onClick={() => setEditing(data)}><Pencil aria-hidden="true" />Sửa thông tin</Button></div>
    </div></article>}
    {editing && <BracketForm bracket={editing} onClose={() => setEditing(undefined)} onSaved={message => { setEditing(undefined); setNotice(message); reload(); }} />}
    {notice && <ResultDialog message={notice} onClose={() => setNotice('')} />}
  </section>;
}
