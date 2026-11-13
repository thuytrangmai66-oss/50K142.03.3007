import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CalendarDays, Search } from 'lucide-react';
import { useAuth } from '../auth/use-auth';
import { useResource } from '../reference-data/use-resource';
import { useListPageSize } from '../reference-data/use-list-page-size';
import { Button } from '../../components/ui/Button';
import { FormDialog } from '../../components/ui/FormDialog';
import { ResultDialog } from '../../components/ui/ResultDialog';
import { DataTable, PaginatedTable, Pagination } from '../../components/ui/DataTable';
import { conditionLabel } from '../../domain/conditions';
import { RepositoryError } from '../../repositories/errors';
import type { DecideCommand } from '../../services/purchase-approvals';

const number = new Intl.NumberFormat('vi-VN');
const requestDate = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' });
const statusLabel = { pending: 'Chờ phê duyệt', approved: 'Đã phê duyệt', rejected: 'Đã từ chối' };

function RejectionReasonDialog({ busy, onClose, onConfirm }: {
  busy: boolean; onClose(): void; onConfirm(reason: string): Promise<void>;
}) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!reason.trim()) { setError('Hãy nhập lý do từ chối'); return; }
    if (reason.trim().length > 100) { setError('Lý do từ chối tối đa 100 ký tự'); return; }
    setError('');
    await onConfirm(reason.trim());
  }
  return <FormDialog title="Lý do từ chối" busy={busy} onClose={onClose} showClose={false}>
    <form className="approval-reason" onSubmit={submit} noValidate>
      <textarea aria-label="Lý do từ chối" placeholder="Nhập lý do" value={reason}
        aria-invalid={Boolean(error)} aria-describedby={error ? 'rejection-error' : undefined}
        disabled={busy} onChange={event => setReason(event.target.value)} />
      {error && <p className="field-error" id="rejection-error">{error}</p>}
      <div className="form-actions"><Button type="button" className="button-secondary" disabled={busy} onClick={onClose}>Hủy</Button>
        <Button type="submit" className="button-beige" disabled={busy}>Xác nhận</Button></div>
    </form>
  </FormDialog>;
}

function ApprovalDetail({ approvalId }: { approvalId: string }) {
  const { approvals } = useAuth();
  const navigate = useNavigate();
  const load = useCallback(() => approvals.loadRequest(approvalId), [approvals, approvalId]);
  const { data, loading, error, reload } = useResource(load);
  const [busy, setBusy] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [notice, setNotice] = useState<{ message: string; error: boolean; cross?: boolean; closeFlow?: boolean }>();
  const lock = useRef(false);
  const command = useRef<{ key: string; value: DecideCommand }>();
  const published = useRef('');
  useEffect(() => {
    if (!data || data.decision.status === 'pending') return;
    const key = `${data.approvalId}:${data.approvalRevision}`;
    if (published.current === key) return;
    published.current = key;
    approvals.publishDecision(data.approvalId).catch(() => {
      setNotice({ message: 'Kết quả phê duyệt chưa được gửi đi', error: true });
    });
  }, [data, approvals]);
  async function decide(action: 'approve' | 'reject', reason?: string) {
    if (!data || lock.current) return;
    lock.current = true; setBusy(true);
    const key = JSON.stringify([data.approvalId, data.approvalRevision, action, reason]);
    if (command.current?.key !== key) command.current = {
      key, value: { operationId: crypto.randomUUID(), approvalId: data.approvalId, expectedRevision: data.approvalRevision, action, reason },
    };
    try {
      await approvals.decide(command.current.value);
      published.current = `${data.approvalId}:${data.approvalRevision + 1}`;
      setRejectOpen(false);
      try {
        await approvals.publishDecision(data.approvalId);
        setNotice({ message: action === 'approve' ? 'Phê duyệt giá thu mua thành công' : 'Đã từ chối yêu cầu phê duyệt', error: action === 'reject', cross: action === 'reject', closeFlow: true });
      } catch {
        setNotice({ message: 'Kết quả phê duyệt chưa được gửi đi', error: true });
      }
      reload();
    } catch (cause) {
      const conflict = cause instanceof RepositoryError && cause.code === 'CONFLICT';
      setNotice({ message: conflict ? 'Yêu cầu không còn đủ điều kiện phê duyệt' : action === 'approve' ? 'Không thể lưu kết quả phê duyệt' : 'Không thể lưu kết quả từ chối', error: true });
    } finally { lock.current = false; setBusy(false); }
  }
  return <>
    <FormDialog title="Yêu cầu thu mua" onClose={() => navigate('/approvals')} busy={busy} showClose={false}>
      {loading ? <p role="status">Đang tải yêu cầu…</p> : error || !data ? <p role="alert">Lỗi! Không thể truy cập</p> :
        <div className="approval-request">
          <h2>Thông tin sản phẩm</h2>
          <DataTable headers={['Loại sản phẩm', 'Thương hiệu', 'Tình trạng', 'Số lượng']} rowDividers={false}>
            <tr><td>{data.bracket.type}</td><td>{data.bracket.brand}</td><td>{conditionLabel(data.bracket.condition)}</td><td>{data.quantity}</td></tr>
          </DataTable>
          <h2>Khung giá thu mua áp dụng</h2>
          <DataTable headers={['Loại sản phẩm', 'Thương hiệu', 'Tình trạng', 'Giá tối thiểu (Min)', 'Giá tối đa (Max)']} rowDividers={false}>
            <tr><td>{data.bracket.type}</td><td>{data.bracket.brand}</td><td>{conditionLabel(data.bracket.condition)}</td><td>{number.format(data.bracket.min)}</td><td>{number.format(data.bracket.max)}</td></tr>
          </DataTable>
          <div className="approval-price"><span>Giá thu mua đề xuất</span><output>{number.format(data.unitCost)}</output></div>
          {data.decision.status === 'pending' ? <div className="form-actions">
            <Button className="button-secondary" aria-expanded={rejectOpen} disabled={busy} onClick={() => setRejectOpen(true)}>Từ chối</Button>
            <Button className="button-beige" disabled={busy} onClick={() => void decide('approve')}>Phê duyệt</Button>
          </div> : <p className="approval-decision" role="status">{statusLabel[data.decision.status]}{data.decision.status === 'rejected' && ` — ${data.decision.reason}`}</p>}
        </div>}
    </FormDialog>
    {rejectOpen && <RejectionReasonDialog busy={busy} onClose={() => setRejectOpen(false)} onConfirm={reason => decide('reject', reason)} />}
    {notice && <ResultDialog message={notice.message} error={notice.error} symbol={notice.cross ? 'cross' : undefined} onClose={() => {
      setNotice(undefined);
      if (notice.closeFlow) navigate('/approvals', { replace: true });
    }} />}
  </>;
}

export function ApprovalsPage() {
  const { approvals } = useAuth();
  const navigate = useNavigate();
  const { approvalId } = useParams();
  const [employeeName, setEmployeeName] = useState('');
  const [sentOn, setSentOn] = useState('');
  const [page, setPage] = useState(1);
  const { ref, pageSize } = useListPageSize(page, setPage);
  const load = useCallback(() => approvals.listRequests({ status: 'all', draftId: '', employeeName, sentOn }, page, pageSize), [approvals, employeeName, sentOn, page, pageSize]);
  const { data, loading, error } = useResource(load);
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => { if (data && data.requestedPage === page && data.page !== page) setPage(data.page); }, [data, page]);
  return <section ref={ref} data-page-size={pageSize} className="reference-page reference-list approval-list">
    <div className="reference-toolbar approval-toolbar">
      <label className="search-field"><Search aria-hidden="true"/><input aria-label="Tìm theo tên nhân viên" placeholder="Tìm theo tên nhân viên" value={employeeName} onChange={event => { setEmployeeName(event.target.value); setPage(1); setDismissed(false); }} /></label>
      <label className="approval-date-field"><CalendarDays aria-hidden="true" />
        <input className="approval-date" type="date" aria-label="Ngày gửi" data-empty={!sentOn} value={sentOn}
          onClick={event => event.currentTarget.showPicker()} onChange={event => { setSentOn(event.target.value); setPage(1); setDismissed(false); }} />
        {!sentOn && <span>Ngày gửi</span>}
      </label>
    </div>
    {loading ? <p role="status">Đang tải yêu cầu…</p> : <PaginatedTable headers={['Mã yêu cầu', 'Nhân viên thực hiện', 'Trạng thái', 'Thời gian']}
      empty={!data?.total ? 'Không có yêu cầu cần phê duyệt' : undefined}
      pagination={<Pagination page={data?.page ?? 1} pages={data?.pages ?? 1} onChange={setPage} />}>
      {data?.rows.map(row => <tr key={row.approvalId} onClick={() => navigate(`/approvals/${row.approvalId}`)}><td><button className="approval-id-link">{row.approvalId}</button></td><td>{row.employeeName}</td><td>{statusLabel[row.decision.status]}</td><td>{requestDate.format(new Date(row.requestedAt))}</td></tr>)}
    </PaginatedTable>}
    {Boolean(error) && !dismissed && <ResultDialog error message="Lỗi! Không thể truy cập" onClose={() => setDismissed(true)} />}
    {approvalId && <ApprovalDetail key={approvalId} approvalId={approvalId} />}
  </section>;
}
