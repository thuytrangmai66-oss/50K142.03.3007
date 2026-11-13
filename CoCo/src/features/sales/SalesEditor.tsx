import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ScanLine, Trash2 } from 'lucide-react';
import { useAuth } from '../auth/use-auth';
import { useResource } from '../reference-data/use-resource';
import { useListPageSize } from '../reference-data/use-list-page-size';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Field';
import { ResultDialog } from '../../components/ui/ResultDialog';
import { PaginatedTable, Pagination } from '../../components/ui/DataTable';
import { formatMoney } from '../../domain/formatters';
import { calculateSalesPromotion, salesSubtotal } from '../../domain/sales';
import { paginate } from '../../domain/pagination';
import { SalesDraftError, type SalesCustomerMembership, type SalesDraftBundle } from '../../services/sales';
import type { Customer } from '../../services/reference-data/contracts';
import { CustomerForm } from '../customers/CustomerForm';
import type { CheckoutInput, SaleQuote } from '../../domain/sale-payment';
import { TransferQrDialog } from './TransferQrDialog';

function ProductEntry({ bundle, disabled, onBusyChange, onSaved }: { bundle: SalesDraftBundle; disabled: boolean; onBusyChange(busy: boolean): void; onSaved(bundle: SalesDraftBundle): void }) {
  const { salesDrafts } = useAuth();
  const [productId, setProductId] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const input = useRef<HTMLInputElement>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (lock.current || disabled) return;
    lock.current = true;
    setBusy(true);
    onBusyChange(true);
    setFieldError('');
    try {
      const snapshot = await salesDrafts.lookupProduct(productId);
      const next = await salesDrafts.addProduct({
        operationId: crypto.randomUUID(), draftId: bundle.draft.id, expectedRevision: bundle.draft.revision,
        productId: snapshot.id, expectedProductVersion: snapshot.version,
      });
      setProductId('');
      onSaved(next);
    } catch (cause) {
      if (cause instanceof SalesDraftError && cause.fields.productId) setFieldError(cause.fields.productId);
      else setError(cause instanceof Error ? cause.message : 'Không thể thêm sản phẩm vào giỏ hàng');
    } finally {
      lock.current = false;
      setBusy(false);
      onBusyChange(false);
      requestAnimationFrame(() => input.current?.focus());
    }
  }

  return <>
    <form className="sales-product-entry" noValidate onSubmit={submit}>
      <div className="sales-code-field"><ScanLine aria-hidden="true"/>
        <input ref={input} aria-label="Mã sản phẩm" placeholder="Quét mã vạch hoặc nhập mã sản phẩm" value={productId}
          autoComplete="off" spellCheck={false} aria-invalid={Boolean(fieldError)} aria-describedby={fieldError ? 'sales-code-error' : undefined}
          disabled={busy || disabled} onChange={event => { setProductId(event.target.value); setFieldError(''); }}/>
      </div>
      <Button className="button-beige" type="submit" disabled={busy || disabled}>{busy ? 'Đang thêm…' : 'Thêm'}</Button>
      {fieldError && <p id="sales-code-error" className="field-error" role="alert">{fieldError}</p>}
    </form>
    {error && <ResultDialog error message={error} onClose={() => setError('')}/>}
  </>;
}

export function SalesEditor() {
  const { draftId } = useParams();
  const navigate = useNavigate();
  const { salesDrafts, salesPayments, referenceData } = useAuth();
  const fresh = useRef<SalesDraftBundle>();
  const load = useCallback(async () => draftId ? salesDrafts.load(draftId) : fresh.current ?? (fresh.current = await salesDrafts.prepareDraft()), [draftId, salesDrafts]);
  const { data, loading, error, reload } = useResource(load);
  const [notice, setNotice] = useState('');
  const [noticeError, setNoticeError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saveAttempted, setSaveAttempted] = useState(false);
  const [minimumRevision, setMinimumRevision] = useState(0);
  const [page, setPage] = useState(1);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [selectedPhone, setSelectedPhone] = useState('');
  const [suggestions, setSuggestions] = useState<Customer[]>([]);
  const [customerError, setCustomerError] = useState('');
  const [searchingCustomer, setSearchingCustomer] = useState(false);
  const [selectedMembership, setSelectedMembership] = useState<SalesCustomerMembership>();
  const [membershipLoading, setMembershipLoading] = useState(false);
  const [registeringMembership, setRegisteringMembership] = useState(false);
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [method, setMethod] = useState<CheckoutInput['method']>('cash');
  const [transfer, setTransfer] = useState<{ quote: SaleQuote; checkout: CheckoutInput; operationId: string }>();
  const [paidInvoice, setPaidInvoice] = useState('');
  const lock = useRef(false);
  const customerRequest = useRef(0);
  const membershipRequest = useRef(0);
  const { ref, pageSize } = useListPageSize(page, setPage);
  const selectedCustomerId = selectedMembership?.customerId;

  useEffect(() => {
    if (!selectedCustomerId || !data || data.draft.status !== 'editing') return;
    let active = true;
    salesDrafts.customerMembership(selectedCustomerId).then(member => {
      if (active) setSelectedMembership(current => current?.customerId === selectedCustomerId ? member : current);
    }).catch(cause => {
      if (active) {
        setSelectedMembership(undefined);
        setCustomerError(cause instanceof Error ? cause.message : 'Không thể kiểm tra thành viên');
      }
    });
    return () => { active = false; };
  }, [data, selectedCustomerId, salesDrafts]);

  useEffect(() => {
    let active = true;
    const request = ++customerRequest.current;
    if (phone.length !== 10 || phone === selectedPhone) {
      setSuggestions([]);
      setSearchingCustomer(false);
      return () => { active = false; };
    }
    setSearchingCustomer(true);
    referenceData.customers(phone, 1).then(result => {
      if (active && request === customerRequest.current) {
        setSuggestions(result.rows.filter(customer => customer.record.SoDienThoaiKH === phone));
      }
    }).catch(cause => {
      if (active && request === customerRequest.current) {
        setCustomerError(cause instanceof Error ? cause.message : 'Không thể tra cứu khách hàng');
      }
    }).finally(() => {
      if (active && request === customerRequest.current) setSearchingCustomer(false);
    });
    return () => { active = false; };
  }, [phone, selectedPhone, referenceData]);

  async function selectCustomer(customer: Customer) {
    const request = ++membershipRequest.current;
    setSelectedMembership(undefined);
    setCustomerError('');
    setName(customer.record.TenKH);
    setPhone(customer.record.SoDienThoaiKH);
    setSelectedPhone(customer.record.SoDienThoaiKH);
    setMembershipLoading(true);
    try {
      const membership = await salesDrafts.customerMembership(customer.record.MaKH);
      if (request === membershipRequest.current) setSelectedMembership(membership);
    } catch (cause) {
      if (request === membershipRequest.current) {
        setCustomerError(cause instanceof Error ? cause.message : 'Không thể kiểm tra thành viên');
      }
    } finally {
      if (request === membershipRequest.current) setMembershipLoading(false);
    }
  }

  async function registerMembership() {
    if (!selectedMembership || selectedMembership.isMember || registeringMembership) return;
    setRegisteringMembership(true);
    setCustomerError('');
    try {
      const membership = await salesDrafts.registerMembership({
        operationId: crypto.randomUUID(), customerId: selectedMembership.customerId, consent: true,
      });
      setSelectedMembership(membership);
    } catch (cause) {
      setNoticeError(true);
      setNotice(cause instanceof Error ? cause.message : 'Không thể đăng ký thành viên');
    } finally {
      setRegisteringMembership(false);
    }
  }

  async function refreshCreatedCustomer() {
    setCreatingCustomer(false);
    setSearchingCustomer(true);
    setCustomerError('');
    try {
      const result = await referenceData.customers(phone, 1);
      const customer = result.rows.find(row => row.record.SoDienThoaiKH === phone);
      if (!customer) throw new Error('Không tìm thấy khách hàng vừa tạo');
      await selectCustomer(customer);
    } catch (cause) {
      setCustomerError(cause instanceof Error ? cause.message : 'Không thể tải khách hàng vừa tạo');
    } finally {
      setSearchingCustomer(false);
    }
  }

  async function pay() {
    if (!data || lock.current || data.draft.revision < minimumRevision) return;
    setSaveAttempted(true);
    lock.current = true;
    setBusy(true);
    try {
      if (!data.lines.length) throw new Error('Hãy thêm ít nhất một sản phẩm');
      if (!selectedMembership || membershipLoading || registeringMembership) throw new Error('Hãy nhập đầy đủ thông tin');
      const checkout: CheckoutInput = { draftId: data.draft.id, expectedRevision: data.draft.revision,
        customerId: selectedMembership.customerId, method,
        useMembershipDiscount: selectedMembership.isMember && selectedMembership.pointsBalance >= 50 };
      const quote = await salesPayments.quote(checkout);
      const operationId = crypto.randomUUID();
      if (method === 'transfer') setTransfer({ quote, checkout, operationId });
      else {
        const paid = await salesPayments.finalize({ operationId, checkout, invoiceId: quote.snapshot.invoiceId,
          snapshot: quote.snapshot, fingerprint: quote.fingerprint });
        setPaidInvoice(paid.invoiceId);
      }
    } catch (cause) {
      setNoticeError(true);
      setNotice(cause instanceof Error ? cause.message : 'Không thể thanh toán');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  async function confirmTransfer() {
    if (!transfer || lock.current) return;
    lock.current = true; setBusy(true);
    try {
      const { quote, checkout, operationId } = transfer;
      const paid = await salesPayments.finalize({ operationId, checkout, invoiceId: quote.snapshot.invoiceId,
        snapshot: quote.snapshot, fingerprint: quote.fingerprint });
      setTransfer(undefined); setPaidInvoice(paid.invoiceId);
    } catch (cause) {
      setNoticeError(true); setNotice(cause instanceof Error ? cause.message : 'Không thể thanh toán');
    } finally { lock.current = false; setBusy(false); }
  }

  function closePaid() {
    fresh.current = undefined;
    setPaidInvoice(''); setMinimumRevision(0); setPage(1); setSaveAttempted(false);
    setPhone(''); setName(''); setSelectedPhone(''); setSelectedMembership(undefined);
    navigate('/sales', { replace: true });
  }

  async function remove(productId: string) {
    if (!data || lock.current || data.draft.revision < minimumRevision) return;
    lock.current = true;
    setBusy(true);
    try {
      const next = await salesDrafts.removeProduct({
        operationId: crypto.randomUUID(), draftId: data.draft.id, expectedRevision: data.draft.revision, productId,
      });
      setMinimumRevision(next.draft.revision);
      setPage(1);
      reload();
    } catch (cause) {
      setNoticeError(true);
      setNotice(cause instanceof Error ? cause.message : 'Không thể xóa sản phẩm khỏi giỏ hàng');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  async function cancel() {
    if (!data || lock.current || data.draft.revision < minimumRevision) return;
    lock.current = true;
    setBusy(true);
    try {
      await salesDrafts.cancelDraft({
        operationId: crypto.randomUUID(), draftId: data.draft.id, expectedRevision: data.draft.revision,
      });
      navigate('/sales');
    } catch (cause) {
      setNoticeError(true);
      setNotice(cause instanceof Error ? cause.message : 'Không thể hủy bản nháp');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  if (loading) return <p role="status">Đang tải giao dịch…</p>;
  if (error || !data) return <section className="panel" role="alert"><p>{error instanceof Error ? error.message : 'Không thể tải bản nháp bán hàng'}</p><Button onClick={reload}>Thử lại</Button></section>;
  if (data.draft.status !== 'editing' && !paidInvoice) return <section className="panel"><p>Bản nháp không còn ở trạng thái đang tạo</p><Button onClick={closePaid}>Tạo giao dịch</Button></section>;

  const visible = paginate(data.lines, page, pageSize);
  const total = salesSubtotal(data.lines);
  const interactionBlocked = busy || Boolean(transfer) || Boolean(paidInvoice) || data.draft.revision < minimumRevision;
  let promotion: ReturnType<typeof calculateSalesPromotion> | undefined;
  let promotionError = '';
  try {
    promotion = calculateSalesPromotion({
      subtotal: total,
      isMember: selectedMembership?.isMember ?? false,
      pointsBalance: selectedMembership?.pointsBalance ?? 0,
      useMembershipDiscount: Boolean(selectedMembership?.isMember) && (selectedMembership?.pointsBalance ?? 0) >= 50 && total > 0,
    });
  } catch (cause) {
    promotionError = cause instanceof Error ? cause.message : 'Không thể tính ưu đãi';
  }
  const customerMissing = phone.length === 10 && !searchingCustomer && !customerError && !suggestions.length && phone !== selectedPhone;

  return <section className="purchase-editor sales-editor reference-page">
    <div className="purchase-heading">
      <div className="purchase-title-card"><h1>Phiếu bán hàng</h1><strong className="sales-draft-id" aria-label={`Mã nháp ${data.draft.id}`}>{data.draft.id}</strong></div>
    </div>
    <div className="purchase-board">
      <ProductEntry bundle={data} disabled={interactionBlocked} onBusyChange={setBusy} onSaved={next => {
        setMinimumRevision(next.draft.revision); setPage(1);
        navigate(`/sales/${next.draft.id}`, { replace: true }); reload();
      }}/>
      <section ref={ref} data-page-size={pageSize} data-pagination={visible.pages > 1 ? 'paged' : 'single'} className="reference-list purchase-lines">
        {!data.lines.length && <p className="sr-only" role="status">Chưa có sản phẩm</p>}
        <PaginatedTable headers={['Sản phẩm', 'SL', 'Đơn giá', 'Thành tiền']}
          empty={saveAttempted && !data.lines.length ? 'Hãy thêm ít nhất một sản phẩm' : undefined}
          columnWidths={['40%', '10%', '24%', '26%']}
          pagination={<Pagination page={visible.page} pages={visible.pages} onChange={setPage}/>}>
          {visible.rows.map(line => <tr key={line.productId}>
            <td><strong>{line.name}</strong><small>{line.productId}</small></td>
            <td>{line.quantity}</td>
            <td>{formatMoney(line.unitPrice)}</td>
            <td><div className="purchase-line-amount"><strong>{formatMoney(line.lineTotal)}</strong>
              <button className="purchase-remove" aria-label={`Xóa sản phẩm ${line.productId}`} disabled={interactionBlocked} onClick={() => void remove(line.productId)}><Trash2 aria-hidden="true"/></button>
            </div></td>
          </tr>)}
        </PaginatedTable>
      </section>
      <aside className="purchase-summary">
        <section className="purchase-customer">
          <div className="purchase-customer-heading">
            <h2>Khách hàng</h2>
            {customerMissing && <Button disabled={interactionBlocked} onClick={() => setCreatingCustomer(true)}>+ Thêm khách hàng</Button>}
          </div>
          <div className="customer-phone-lookup">
            <Field label="Số điện thoại" type="tel" inputMode="tel" placeholder="Nhập số điện thoại" value={phone}
              disabled={interactionBlocked || registeringMembership} onChange={event => {
                customerRequest.current++;
                membershipRequest.current++;
                setPhone(event.target.value);
                setName('');
                setSelectedPhone('');
                setSuggestions([]);
                setSelectedMembership(undefined);
                setMembershipLoading(false);
                setCustomerError('');
              }}/>
            {suggestions.length > 0 && <div className="customer-suggestions" role="group" aria-label="Khách hàng tìm thấy">
              {suggestions.map(customer => <button className="customer-suggestion" type="button" key={customer.record.MaKH}
                onClick={() => void selectCustomer(customer)} disabled={interactionBlocked}>
                {customer.record.TenKH}
              </button>)}
            </div>}
            {customerMissing && <p className="customer-not-found">Khách hàng không tồn tại</p>}
            {customerError && <p role="alert">{customerError}</p>}
          </div>
          <Field label="Họ tên" placeholder="Nhập họ và tên" value={name} readOnly/>
          {membershipLoading && <p role="status">Đang kiểm tra thành viên…</p>}
          {selectedMembership?.isMember && <p className="sales-membership-status" role="status">
            Thành viên · Điểm: {selectedMembership.pointsBalance}
          </p>}
          {selectedMembership && !selectedMembership.isMember && <label className="sales-membership-option">
            <input type="checkbox" aria-label="Khách hàng đồng ý đăng ký thành viên"
              checked={registeringMembership}
              disabled={registeringMembership || membershipLoading}
              onChange={event => { if (event.currentTarget.checked) void registerMembership(); }}/>
            <span>{registeringMembership ? 'Đang đăng ký…' : 'Khách hàng đồng ý đăng ký thành viên'}</span>
          </label>}
          {selectedMembership?.isMember && selectedMembership.pointsBalance < 50 && <p className="customer-not-found">Chưa đủ 50 điểm để dùng ưu đãi</p>}
        </section>
        <section className="purchase-payment">
          <h2>Thanh toán</h2>
          <div className="purchase-total"><strong>Tổng tiền hàng</strong>{data.lines.length > 0 && <strong>{formatMoney(total)}</strong>}</div>
          <div className="purchase-total"><strong>Khuyến mãi</strong><strong>{promotion ? promotion.discount ? `-${formatMoney(promotion.discount)}` : formatMoney(0) : '—'}</strong></div>
          <div className="purchase-total sales-grand-total"><strong>Tổng tiền</strong><strong>{promotion ? formatMoney(promotion.total) : '—'}</strong></div>
          {promotionError && <p role="alert">{promotionError}</p>}
          <div className="sales-payment-method" role="radiogroup" aria-label="Phương thức thanh toán">
            <p>Phương thức thanh toán</p>
            {(['cash', 'transfer'] as const).map(value => <button key={value} type="button" role="radio" aria-checked={method === value}
              disabled={interactionBlocked} onClick={() => setMethod(value)}>{value === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}</button>)}
          </div>
          <div className="form-actions">
            <Button className="button-beige" disabled={interactionBlocked || registeringMembership || membershipLoading || Boolean(promotionError)} onClick={() => void pay()}>Lưu</Button>
            <Button className="button-secondary" disabled={interactionBlocked} onClick={() => void cancel()}>Hủy</Button>
          </div>
        </section>
      </aside>
    </div>
    {creatingCustomer && <CustomerForm onClose={() => setCreatingCustomer(false)} onSaved={() => void refreshCreatedCustomer()}/>}
    {transfer && <TransferQrDialog quote={transfer.quote} busy={busy} onClose={() => { if (!lock.current) setTransfer(undefined); }} onConfirm={() => void confirmTransfer()}/>}
    {paidInvoice && <ResultDialog message="Thanh toán thành công!" onClose={closePaid}/>}
    {notice && <ResultDialog error={noticeError} message={notice} onClose={() => setNotice('')}>
      {!noticeError && <p>Giỏ hàng đã được lưu. Giao dịch chưa hoàn tất.</p>}
    </ResultDialog>}
  </section>;
}
