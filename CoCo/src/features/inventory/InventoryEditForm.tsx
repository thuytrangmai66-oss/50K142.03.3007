import { useCallback, useId, useRef, useState, type FormEvent } from 'react';
import { LockKeyhole } from 'lucide-react';
import { FormDialog } from '../../components/ui/FormDialog';
import { Field } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { ResultDialog } from '../../components/ui/ResultDialog';
import { useAuth } from '../auth/use-auth';
import { CONDITIONS } from '../../domain/conditions';
import { formatCalendarDate } from '../../domain/formatters';
import { InventoryInputError, inventoryFilters, type InventoryItem } from '../../services/inventory';
import { RepositoryError } from '../../repositories/errors';
import { useResource } from '../reference-data/use-resource';

export function InventoryEditForm({ item, onClose, onSaved, onStale }: { item: InventoryItem; onClose(): void; onSaved(): void; onStale(): Promise<void> }) {
  const { inventory } = useAuth(), list = useId();
  const load = useCallback(() => inventory.list(inventoryFilters, 1), [inventory]);
  const { data: catalog } = useResource(load);
  const operation = useRef(crypto.randomUUID());
  const submitting = useRef(false);
  const [input, setInput] = useState({ name: item.name, type: item.type, brand: item.brand, condition: item.conditionCode ? item.condition : '', price: String(item.price) });
  const [fields, setFields] = useState<Record<string, string>>({}), [notice, setNotice] = useState(''), [stale, setStale] = useState(false), [busy, setBusy] = useState(false);
  function change(field: keyof typeof input, value: string) {
    setInput(current => ({ ...current, [field]: value }));
    setFields(current => { const next = { ...current }; delete next[field]; return next; });
    operation.current = crypto.randomUUID();
  }
  async function submit(e: FormEvent) {
    e.preventDefault(); if (submitting.current) return; submitting.current = true; setBusy(true); setFields({});
    try {
      const condition = CONDITIONS.find(c => c.label.toLocaleLowerCase('vi') === input.condition.trim().toLocaleLowerCase('vi'))?.code ?? 0;
      await inventory.update({ ...input, condition, id: item.id, expectedVersion: item.version, operationId: operation.current, enteredOn: item.enteredOn, status: item.status });
      onSaved();
    } catch (cause) {
      if (cause instanceof InventoryInputError && Object.keys(cause.fields).length) setFields(cause.fields);
      else if (cause instanceof InventoryInputError) setNotice(cause.message);
      else if (cause instanceof RepositoryError && cause.code === 'CONFLICT') { setStale(true); setNotice('Dữ liệu đã thay đổi'); }
      else setNotice('Không thể cập nhật hàng hóa. Hãy thử lại');
    } finally { submitting.current = false; setBusy(false); }
  }
  return <><FormDialog title="Sửa thông tin hàng hóa" onClose={onClose} showClose={false} busy={busy}>
    <form className="inventory-edit" noValidate onSubmit={submit} aria-busy={busy}>
      <h3>Thông tin có thể chỉnh sửa</h3>
      <div className="inventory-edit-first"><Field label="Tên sản phẩm" value={input.name} maxLength={50} error={fields.name} onChange={e => change('name', e.target.value)}/>
        <Field label="Loại sản phẩm" list={`${list}-types`} value={input.type} maxLength={50} error={fields.type} onChange={e => change('type', e.target.value)}/>
        <Field label="Thương hiệu" list={`${list}-brands`} value={input.brand} maxLength={50} error={fields.brand} onChange={e => change('brand', e.target.value)}/></div>
      <datalist id={`${list}-types`}>{(catalog?.types ?? [item.type]).map(value => <option key={value} value={value}/>)}</datalist>
      <datalist id={`${list}-brands`}>{(catalog?.brands ?? [item.brand]).map(value => <option key={value} value={value}/>)}</datalist>
      <div className="inventory-edit-second"><Field label="Độ mới / Tình trạng" list={list} value={input.condition} error={fields.condition} onChange={e => change('condition', e.target.value)}/>
        <datalist id={list}>{CONDITIONS.map(c => <option key={c.code} value={c.label}/>)}</datalist>
        <Field label="Giá bán hiện tại (đồng)" inputMode="numeric" value={input.price} error={fields.price} onChange={e => change('price', e.target.value)}/></div>
      <div className="inventory-edit-bottom"><section className="inventory-fixed"><h3><LockKeyhole aria-hidden="true"/>Dữ liệu cố định, không được thay đổi</h3>
        <Field label="Mã sản phẩm" readOnly value={item.id}/><Field label="Ngày nhập kho" readOnly value={formatCalendarDate(item.enteredOn)}/><Field label="Trạng thái sản phẩm" readOnly value={item.statusLabel}/></section>
        <div className="form-actions"><Button type="button" className="button-secondary" disabled={busy} onClick={onClose}>Hủy</Button><Button type="submit" className="button-beige" disabled={busy || stale}>Lưu</Button></div></div>
    </form>
  </FormDialog>{notice && <ResultDialog error message={notice} onClose={() => { setNotice(''); if (stale) void onStale().catch(() => setNotice('Không thể cập nhật hàng hóa. Hãy thử lại')); }}/>}</>;
}
