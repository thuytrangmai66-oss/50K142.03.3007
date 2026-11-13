import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, ShoppingCart, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '../auth/use-auth';
import { useResource } from '../reference-data/use-resource';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Field';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { ResultDialog } from '../../components/ui/ResultDialog';
import { CustomerForm } from './CustomerForm';
import { DataServiceError, type Customer } from '../../services/reference-data/contracts';
import { CustomerToolbar } from './CustomerToolbar';

export function CustomerDetailPage() {
  const { customerId = '' } = useParams(), navigate = useNavigate();
  const { referenceData } = useAuth();
  const load = useCallback(() => referenceData.customer(customerId), [referenceData, customerId]);
  const { data, loading, error, reload } = useResource(load);
  const [editing, setEditing] = useState<Customer>(), [confirm, setConfirm] = useState<Customer>(), [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ text: string; error: boolean; deleted?: boolean }>();
  useEffect(() => setConfirm(undefined), [customerId]);
  async function remove() {
    if (!confirm || busy) return; setBusy(true);
    try { await referenceData.deleteCustomer(confirm.record.MaKH, confirm.version, true); setConfirm(undefined); setNotice({ text: 'Đã xóa thông tin khách hàng', error: false, deleted: true }); }
    catch (cause) { setConfirm(undefined); setNotice({ text: cause instanceof DataServiceError ? cause.message : 'Xóa không thành công', error: true }); }
    finally { setBusy(false); }
  }
  return <section className="reference-page">
    <CustomerToolbar />
    <Link className="back-link" to="/customers"><ArrowLeft aria-hidden="true" />Quay lại</Link>
    {loading ? <p role="status">Đang tải thông tin khách hàng…</p> : error || !data ? <div className="panel" role="alert"><p>Lỗi truy xuất dữ liệu khách hàng</p><Button onClick={reload}>Thử lại</Button></div> : <article className="record-card">
      <h1>Thông tin khách hàng</h1><div className="record-body">
        <div className="record-form"><Field label="Họ tên" readOnly value={data.record.TenKH} /><Field label="Số điện thoại" readOnly value={data.record.SoDienThoaiKH} /></div>
        <div className="history-links"><Link to="purchases"><ShoppingBag aria-hidden="true" />Lịch sử mua</Link><Link to="sales"><ShoppingCart aria-hidden="true" />Lịch sử bán</Link></div>
        <div className="form-actions"><Button className="button-danger" onClick={() => setConfirm(data)}><Trash2 aria-hidden="true" />Xóa tài khoản</Button><Button className="button-beige" onClick={() => setEditing(data)}><Pencil aria-hidden="true" />Sửa thông tin</Button></div>
      </div></article>}
    {editing && <CustomerForm customer={editing} onClose={() => setEditing(undefined)} onSaved={text => { setEditing(undefined); setNotice({ text, error: false }); reload(); }} />}
    {confirm && <ConfirmDialog message="Có chắc chắn xóa thông tin khách hàng không?" onClose={() => setConfirm(undefined)} busy={busy} onConfirm={remove} />}
    {notice && <ResultDialog message={notice.text} error={notice.error} onClose={() => { if (notice.deleted) navigate('/customers'); setNotice(undefined); }} />}
  </section>;
}
