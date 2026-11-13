import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CircleAlert, Trash2 } from 'lucide-react';
import { useAuth } from '../auth/use-auth';
import { useResource } from '../reference-data/use-resource';
import { useListPageSize } from '../reference-data/use-list-page-size';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Field';
import { FormDialog } from '../../components/ui/FormDialog';
import { ResultDialog } from '../../components/ui/ResultDialog';
import { PaginatedTable, Pagination, DataTable } from '../../components/ui/DataTable';
import { CustomerForm } from '../customers/CustomerForm';
import { CONDITIONS, conditionLabel } from '../../domain/conditions';
import { formatMoney } from '../../domain/formatters';
import { paginate } from '../../domain/pagination';
import { PurchaseInputError, type DraftBundle, type PurchaseBracket } from '../../services/purchase-drafts';
import type { CandidateDraftCommand } from '../../services/purchase-candidate';
import type { Customer } from '../../services/reference-data/contracts';
import type { PurchaseLine } from '../../domain/purchases';
import { PurchaseResults } from './PurchaseResults';
import type { FinalizePurchaseCommand } from '../../services/purchase-finalization';
const tableMoney = (value: number) => new Intl.NumberFormat('vi-VN').format(value);

function ItemDialog({ bundle, line, onClose, onSaved }: { bundle: DraftBundle; line?: PurchaseLine; onClose(): void; onSaved(id: string, pending: boolean, revision: number): void }) {
  const { purchaseDrafts } = useAuth();
  const [input, setInput] = useState({ type: '', brand: '', condition: '', quantity: '' });
  const [fields, setFields] = useState<Record<string, string>>({}), [price, setPrice] = useState(line ? String(line.unitCost) : ''), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const [match, setMatch] = useState<{ bracket: PurchaseBracket; quantity: number } | undefined>(line ? { bracket: line.bracket, quantity: line.quantity } : undefined), [catalog, setCatalog] = useState<PurchaseBracket[]>([]);
  const command = useRef<CandidateDraftCommand>(), lock = useRef(false);
  const editOperation = useRef<string>();
  useEffect(() => { let active = true; purchaseDrafts.catalog().then(rows => { if (active) { setCatalog(rows); if (line) { const current = rows.find(row => row.id === line.bracket.id); if (current) setMatch({ bracket: current, quantity: line.quantity }); } } }).catch(() => { if (active) setError('Không thể tải khung giá thu mua'); }); return () => { active = false; }; }, [purchaseDrafts, line]);
  async function submit(event: FormEvent) {
    event.preventDefault(); if (lock.current) return; lock.current = true; setBusy(true); setFields({});
    try {
      if (!match) setMatch(await purchaseDrafts.findBracket(input));
      else {
        if (line) {
          editOperation.current ??= crypto.randomUUID();
          await purchaseDrafts.reviseRejected(bundle, line.id, price, editOperation.current, match.bracket.revision);
        } else {
          command.current ??= await purchaseDrafts.prepareAdd(bundle, match.bracket, match.quantity, price);
          await purchaseDrafts.commit(command.current);
        }
        onSaved(bundle.draft.id, Number(price) > match.bracket.max, bundle.draft.revision + 1);
      }
    } catch (cause) { if (cause instanceof PurchaseInputError && Object.keys(cause.fields).length) setFields(cause.fields); else setError(cause instanceof Error ? cause.message : 'Không thể lưu thông tin sản phẩm'); }
    finally { lock.current = false; setBusy(false); }
  }
  return <><FormDialog title={match ? 'Thông tin sản phẩm' : 'Tạo giao dịch'} busy={busy} onClose={onClose}>
    <form className="record-form purchase-item-form" noValidate onSubmit={submit}>
      {!match ? <>
        <Field label="Loại sản phẩm" list="purchase-types" placeholder="Nhập loại sản phẩm" value={input.type} error={fields.type} onChange={e => setInput({ ...input, type: e.target.value })}/>
        <datalist id="purchase-types">{[...new Set(catalog.map(row => row.type))].map(value => <option key={value} value={value}/>)}</datalist>
        <Field label="Thương hiệu" list="purchase-brands" placeholder="Nhập thương hiệu" value={input.brand} error={fields.brand} onChange={e => setInput({ ...input, brand: e.target.value })}/>
        <datalist id="purchase-brands">{[...new Set(catalog.map(row => row.brand))].map(value => <option key={value} value={value}/>)}</datalist>
        <div className="coco-field"><label htmlFor="purchase-condition">Chất lượng</label><select id="purchase-condition" value={input.condition} aria-invalid={Boolean(fields.condition)} onChange={e => setInput({ ...input, condition: e.target.value })}><option value="">Chọn tình trạng</option>{CONDITIONS.map(row => <option value={row.code} key={row.code}>{row.label}</option>)}</select>{fields.condition && <p className="field-error">{fields.condition}</p>}</div>
        <Field label="Số lượng" list="purchase-quantities" inputMode="numeric" placeholder="Chọn số lượng" value={input.quantity} error={fields.quantity} onChange={e => setInput({ ...input, quantity: e.target.value })}/>
        <datalist id="purchase-quantities">{[1, 2, 3, 5, 10].map(value => <option key={value} value={value}/>)}</datalist>
      </> : <>
        <DataTable headers={['Loại sản phẩm', 'Thương hiệu', 'Tình trạng', 'Giá tối thiểu (Min)', 'Giá tối đa (Max)']}><tr><td>{match.bracket.type}</td><td>{match.bracket.brand}</td><td>{conditionLabel(match.bracket.condition)}</td><td>{formatMoney(match.bracket.min)}</td><td>{formatMoney(match.bracket.max)}</td></tr></DataTable>
        <Field label="Giá thu mua đề xuất" inputMode="numeric" placeholder="Nhập giá" value={price} error={fields.price} onChange={e => { setPrice(e.target.value); command.current = undefined; editOperation.current = undefined; }}/>
      </>}
      <div className="form-actions"><Button className="button-secondary" type="button" disabled={busy} onClick={onClose}>Hủy</Button><Button className="button-beige" type="submit" disabled={busy}>{busy ? 'Đang lưu…' : 'Xác nhận'}</Button></div>
    </form>
  </FormDialog>{error && <ResultDialog error message={error} onClose={() => setError('')}/>}</>;
}

export function PurchaseEditor() {
  const { draftId } = useParams(), navigate = useNavigate(); const { purchaseDrafts, referenceData, purchaseFinalizer } = useAuth();
  const fresh = useRef<DraftBundle>();
  const load = useCallback(async () => draftId ? purchaseDrafts.load(draftId) : fresh.current ?? (fresh.current = await purchaseDrafts.prepareDraft()), [draftId, purchaseDrafts]);
  const { data, loading, error, reload } = useResource(load);
  const [adding, setAdding] = useState(false), [notice, setNotice] = useState(''), [busy, setBusy] = useState(false), [page, setPage] = useState(1);
  const [noticeError, setNoticeError] = useState(false);
  const [editingLineId, setEditingLineId] = useState<string>();
  const [saveAttempted, setSaveAttempted] = useState(false), [completedInvoiceId, setCompletedInvoiceId] = useState<string>();
  const [minimumRevision, setMinimumRevision] = useState(0);
  const finalization = useRef<FinalizePurchaseCommand>();
  const [phone, setPhone] = useState(''), [name, setName] = useState(''), [suggestions, setSuggestions] = useState<Customer[]>([]), [creating, setCreating] = useState(false), [customerError, setCustomerError] = useState(''), [searching, setSearching] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState('');
  const phoneEdit = useRef(0);
  const lock = useRef(false), { ref, pageSize } = useListPageSize(page, setPage);
  useEffect(() => { let active = true; if (!phone.trim() || phone === selectedPhone) { setSuggestions([]); setSearching(false); return; } setSearching(true); referenceData.customers(phone, 1).then(result => { if (active) setSuggestions(result.rows.filter(row => row.record.SoDienThoaiKH === phone)); }).catch(() => { if (active) setCustomerError('Không thể tra cứu khách hàng'); }).finally(() => { if (active) setSearching(false); }); return () => { active = false; }; }, [phone, selectedPhone, referenceData]);
  useEffect(() => { let active = true; const edit = phoneEdit.current; if (data?.draft.customerId) referenceData.customer(data.draft.customerId).then(customer => { if (active && edit === phoneEdit.current) { setName(customer.record.TenKH); setPhone(customer.record.SoDienThoaiKH); setSelectedPhone(customer.record.SoDienThoaiKH); } }).catch(() => { if (active && edit === phoneEdit.current) setCustomerError('Không thể tải khách hàng đã chọn'); }); return () => { active = false; }; }, [data?.draft.customerId, referenceData]);
  async function selectCustomer(customer: Customer) {
    if (!data || lock.current) return; lock.current = true; setBusy(true);
    try {
      const command: CandidateDraftCommand = { operationId: crypto.randomUUID(), expectedRevision: data.draft.revision, draft: { ...data.draft, customerId: customer.record.MaKH, revision: data.draft.revision + 1, updatedAt: new Date().toISOString() }, lines: data.lines, approvals: data.approvals };
      await purchaseDrafts.commit(command); setMinimumRevision(command.draft.revision); setName(customer.record.TenKH); setPhone(customer.record.SoDienThoaiKH); setSelectedPhone(customer.record.SoDienThoaiKH); setSuggestions([]); navigate(`/purchases/${data.draft.id}`, { replace: true }); reload();
    } catch (cause) { setNoticeError(true); setNotice(cause instanceof Error ? cause.message : 'Không thể chọn khách hàng'); }
    finally { lock.current = false; setBusy(false); }
  }
  async function remove(lineId?: string) {
    if (!data || lock.current) return; lock.current = true; setBusy(true);
    try { await purchaseDrafts.removeOrCancel(data, crypto.randomUUID(), lineId); setMinimumRevision(data.draft.revision + 1); if (!lineId) navigate('/purchases'); else reload(); }
    catch (cause) { setNoticeError(true); setNotice(cause instanceof Error ? cause.message : 'Không thể thay đổi giao dịch'); }
    finally { lock.current = false; setBusy(false); }
  }
  async function save() {
    if (!data || lock.current || data.draft.revision < minimumRevision) return;
    setSaveAttempted(true);
    const lines = data.lines.filter(line => !line.removedAt);
    if (!lines.length || !data.draft.customerId || phone !== selectedPhone || !name || lines.some(line => !['priced', 'approved'].includes(line.status))) return;
    lock.current = true; setBusy(true);
    if (!finalization.current || finalization.current.draftId !== data.draft.id || finalization.current.expectedRevision !== data.draft.revision) {
      finalization.current = { operationId: crypto.randomUUID(), draftId: data.draft.id, expectedRevision: data.draft.revision };
    }
    try {
      const result = await purchaseFinalizer.finalize(finalization.current);
      setCompletedInvoiceId(result.invoiceId); setNoticeError(false); setNotice('Thu mua sản phẩm thành công');
    } catch (cause) {
      setNoticeError(true); setNotice(cause instanceof Error && cause.message.startsWith('Giao dịch') ? cause.message : 'Không thể lưu giao dịch thu mua');
    } finally { lock.current = false; setBusy(false); }
  }
  if (loading) return <p role="status">Đang tải giao dịch…</p>;
  if (error || !data) return <section className="panel" role="alert"><p>{error instanceof Error ? error.message : 'Không thể tải giao dịch'}</p><Button onClick={reload}>Thử lại</Button></section>;
  if (data.draft.status === 'finalized' && !completedInvoiceId) return <section className="panel"><p>Giao dịch đã hoàn tất</p><p>Mã hóa đơn {data.draft.invoiceId}</p><Button onClick={() => navigate('/purchases', { replace: true })}>Về danh sách</Button></section>;
  if (data.draft.status !== 'editing' && !completedInvoiceId) return <section className="panel"><p>Giao dịch không còn ở trạng thái đang tạo</p><Button onClick={() => navigate('/purchases/new')}>Tạo giao dịch</Button></section>;
  const active = data.lines.filter(line => !line.removedAt), visible = paginate(active, page, pageSize);
  const total = active.reduce((sum, line) => sum + line.quantity * line.unitCost, 0);
  const interactionBlocked = busy || data.draft.revision < minimumRevision || Boolean(completedInvoiceId);
  const customerMissing = phone.length === 10 && !searching && !customerError && !suggestions.length && !name;
  return <section className="purchase-editor reference-page">
    <div className="purchase-heading"><Button className="button-beige" onClick={() => setAdding(true)} disabled={interactionBlocked}>Thêm</Button><div className="purchase-title-card"><h1>Thông tin giao dịch</h1><strong>{data.draft.id}</strong></div></div>
    <div className="purchase-board"><section ref={ref} data-page-size={pageSize} data-pagination={visible.pages > 1 ? 'paged' : 'single'} className="reference-list purchase-lines">
      {!active.length && <p className="sr-only" role="status">Chưa có sản phẩm</p>}
      <PaginatedTable headers={['Sản phẩm', 'Số lượng', 'Đơn giá', 'Thành tiền']} empty={saveAttempted && !active.length ? 'Hãy thêm ít nhất một sản phẩm' : undefined} columnWidths={['26.333%', '22.294%', '21.971%', '29.402%']} rowDividers={false} pagination={<Pagination page={visible.page} pages={visible.pages} onChange={setPage}/>}>
        {visible.rows.map(line => <tr key={line.id}><td>{line.status === 'rejected' ? <button className="purchase-rejected-product" aria-label={`Nhập lại giá ${line.bracket.type} ${line.bracket.brand}`} disabled={interactionBlocked} onClick={() => setEditingLineId(line.id)}><strong>{line.bracket.type} {line.bracket.brand}</strong></button> : <strong>{line.bracket.type} {line.bracket.brand}</strong>}<small>{conditionLabel(line.bracket.condition)}{line.status === 'pending' && <span className="purchase-pending">Chờ phê duyệt giá</span>}{line.status === 'approved' && <span>Đã phê duyệt</span>}{line.status === 'rejected' && <span>Đã từ chối</span>}{saveAttempted && !['priced', 'approved'].includes(line.status) && <span className="field-error"><CircleAlert aria-hidden="true" className="field-error-icon"/>Sản phẩm chưa được duyệt giá</span>}</small></td><td>{line.quantity}</td><td>{tableMoney(line.unitCost)}</td><td><div className="purchase-line-amount"><strong>{tableMoney(line.quantity * line.unitCost)}</strong><button className="purchase-remove" aria-label={`Xóa ${line.bracket.type} ${line.bracket.brand}`} disabled={interactionBlocked} onClick={() => void remove(line.id)}><Trash2 aria-hidden="true"/></button></div></td></tr>)}
      </PaginatedTable>
    </section><aside className="purchase-summary"><section className="purchase-customer"><div className="purchase-customer-heading"><h2>Khách hàng</h2>{customerMissing && <Button disabled={interactionBlocked} onClick={() => setCreating(true)}>+ Thêm khách hàng</Button>}</div>
      <div className="customer-phone-lookup"><Field label="Số điện thoại" type="tel" inputMode="tel" placeholder="Nhập số điện thoại" value={phone} error={saveAttempted && !phone ? 'Hãy nhập đầy đủ thông tin' : undefined} errorIcon={<CircleAlert aria-hidden="true" className="field-error-icon"/>} disabled={interactionBlocked} onChange={e => { phoneEdit.current++; setPhone(e.target.value); setName(''); setSelectedPhone(''); setSuggestions([]); setCustomerError(''); setSearching(Boolean(e.target.value.trim())); }}/>
        {suggestions.length > 0 && <div className="customer-suggestions" role="group" aria-label="Khách hàng tìm thấy">{suggestions.map(customer => <button className="customer-suggestion" type="button" key={customer.record.MaKH} onClick={() => void selectCustomer(customer)} disabled={interactionBlocked}>{customer.record.TenKH}</button>)}</div>}
        {customerMissing && <p className="customer-not-found">Khách hàng không tồn tại</p>}{customerError && <p role="alert">{customerError}</p>}
      </div><Field label="Họ tên" placeholder="Nhập họ và tên" value={name} error={saveAttempted && !name ? 'Hãy nhập đầy đủ thông tin' : undefined} errorIcon={<CircleAlert aria-hidden="true" className="field-error-icon"/>} readOnly/>
    </section><section className="purchase-payment"><h2>Thanh toán</h2><div className="purchase-total"><strong>Tổng tiền</strong>{active.length > 0 && <strong>{formatMoney(total)}</strong>}</div><div className="form-actions"><Button className="button-beige" disabled={interactionBlocked} onClick={() => void save()}>Lưu</Button><Button className="button-secondary" disabled={interactionBlocked} onClick={() => void remove()}>Hủy</Button></div></section></aside></div>
    {adding && <ItemDialog bundle={data} onClose={() => setAdding(false)} onSaved={(id, pending, revision) => { setMinimumRevision(revision); setAdding(false); navigate(`/purchases/${id}`, { replace: true }); if (pending) { setNoticeError(false); setNotice('Giá thu mua vượt mức, cần được phê duyệt'); } reload(); }}/ >}
    {notice && <ResultDialog error={noticeError} message={notice} onClose={() => { setNotice(''); if (completedInvoiceId) navigate('/purchases', { replace: true }); }}/ >}
    {editingLineId && <ItemDialog bundle={data} line={data.lines.find(line => line.id === editingLineId)} onClose={() => setEditingLineId(undefined)} onSaved={(_, pending, revision) => { setMinimumRevision(revision); setEditingLineId(undefined); if (pending) { setNoticeError(false); setNotice('Giá thu mua vượt mức, cần được phê duyệt'); } reload(); }} />}
    {!adding && !editingLineId && !notice && !creating && data.draft.revision > 0 && <PurchaseResults draftId={data.draft.id} onRejected={setEditingLineId} />}
    {creating && <CustomerForm onClose={() => setCreating(false)} onSaved={() => { setCreating(false); setSearching(true); referenceData.customers(phone, 1).then(result => setSuggestions(result.rows.filter(row => row.record.SoDienThoaiKH === phone))).catch(() => setCustomerError('Không thể tra cứu khách hàng')).finally(() => setSearching(false)); }}/ >}
  </section>;
}





