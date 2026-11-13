import { useState, type FormEvent } from 'react';
import { Field } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { FormDialog } from '../../components/ui/FormDialog';
import { ResultDialog } from '../../components/ui/ResultDialog';
import { DataServiceError, type Customer, type CustomerInput } from '../../services/reference-data/contracts';
import { useAuth } from '../auth/use-auth';

export function CustomerForm({ customer, onClose, onSaved }: { customer?: Customer; onClose(): void; onSaved(message: string): void }) {
  const { referenceData } = useAuth();
  const [name, setName] = useState(customer?.record.TenKH ?? '');
  const [phone, setPhone] = useState(customer?.record.SoDienThoaiKH ?? '');
  const [fields, setFields] = useState<Partial<Record<keyof CustomerInput,string>>>({});
  const [error, setError] = useState(''), [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return; setBusy(true); setFields({});
    try {
      if (customer) await referenceData.updateCustomer(customer.record.MaKH, customer.version, { name, phone });
      else await referenceData.createCustomer({ name, phone });
      onSaved(customer ? 'Cập nhật thông tin khách hàng thành công' : 'Đã thêm thông tin khách hàng');
    } catch (cause) {
      if (cause instanceof DataServiceError && Object.keys(cause.fields).length) setFields(cause.fields);
      else setError(cause instanceof DataServiceError ? cause.message : customer ? 'Cập nhật thông tin khách hàng không thành công' : 'Không thể tạo thông tin khách hàng');
    } finally { setBusy(false); }
  }
  return <><FormDialog title={customer ? 'Sửa thông tin khách hàng' : 'Tạo thông tin khách hàng'} busy={busy} onClose={onClose}>
    <form className="record-form" noValidate onSubmit={submit} aria-busy={busy}>
      <Field label="Họ tên" autoComplete="name" maxLength={50} value={name} error={fields.name} onChange={e => setName(e.target.value)} />
      <Field label="Số điện thoại" type="tel" inputMode="numeric" autoComplete="tel" value={phone} error={fields.phone} onChange={e => setPhone(e.target.value)} />
      <div className="form-actions"><Button className="button-secondary" type="button" disabled={busy} onClick={onClose}>Hủy</Button><Button className="button-beige" disabled={busy} type="submit">{busy ? 'Đang lưu…' : 'Lưu'}</Button></div>
    </form></FormDialog>{error && <ResultDialog error message={error} onClose={() => setError('')} />}</>;
}
