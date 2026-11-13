import { useId, useState, type FormEvent } from 'react';
import { Field } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { FormDialog } from '../../components/ui/FormDialog';
import { ResultDialog } from '../../components/ui/ResultDialog';
import { CONDITIONS } from '../../domain/conditions';
import { DataServiceError, type Bracket, type BracketInput } from '../../services/reference-data/contracts';
import { useAuth } from '../auth/use-auth';

export function BracketForm({ bracket, onClose, onSaved }: { bracket?: Bracket; onClose(): void; onSaved(message: string): void }) {
  const { referenceData } = useAuth(), conditionId = useId();
  const [input, setInput] = useState<BracketInput>({ productType: bracket?.record.LoaiSanPham ?? '', brand: bracket?.record.ThuongHieu ?? '', condition: bracket ? String(bracket.record.TinhTrang) : '', min: bracket ? String(bracket.record.GiaMin) : '', max: bracket ? String(bracket.record.GiaMax) : '' });
  const [fields, setFields] = useState<Partial<Record<keyof BracketInput,string>>>({});
  const [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const change = (key: keyof BracketInput, value: string) => setInput(previous => ({ ...previous, [key]: value }));
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return; setBusy(true); setFields({});
    try {
      if (bracket) await referenceData.updateBracket(bracket.record.MaKhungGia, bracket.version, input);
      else await referenceData.createBracket(input);
      onSaved(bracket ? 'Cập nhật khung giá thu mua thành công' : 'Tạo khung giá thu mua thành công');
    } catch (cause) {
      if (cause instanceof DataServiceError && Object.keys(cause.fields).length) setFields(cause.fields);
      else setError(cause instanceof DataServiceError ? cause.message : bracket ? 'Cập nhật không thành công' : 'Tạo khung giá không thành công');
    } finally { setBusy(false); }
  }
  return <><FormDialog title={bracket ? 'Sửa khung giá thu mua' : 'Tạo khung giá thu mua'} onClose={onClose} busy={busy}><form className="record-form" noValidate onSubmit={submit} aria-busy={busy}>
    <Field label="Loại hàng" maxLength={50} value={input.productType} error={fields.productType} onChange={e => change('productType',e.target.value)} />
    <Field label="Thương hiệu" maxLength={50} value={input.brand} error={fields.brand} onChange={e => change('brand',e.target.value)} />
    <div className="coco-field"><label htmlFor={conditionId}>Độ mới</label><div><select id={conditionId} value={input.condition} aria-invalid={Boolean(fields.condition)} aria-describedby={fields.condition ? `${conditionId}-error` : undefined} onChange={e => change('condition',e.target.value)}>
      <option value="">Chọn độ mới</option>{bracket && !CONDITIONS.some(c => c.code === bracket.record.TinhTrang) && <option value={String(bracket.record.TinhTrang)} disabled>Giá trị cũ chưa đối chiếu</option>}
      {CONDITIONS.map(item => <option key={item.code} value={item.code}>{item.label}</option>)}
    </select>{fields.condition && <p className="field-error" id={`${conditionId}-error`} role="alert">{fields.condition}</p>}</div></div>
    <Field label="Giá tối thiểu (Min)" inputMode="numeric" value={input.min} error={fields.min} onChange={e => change('min',e.target.value)} />
    <Field label="Giá tối đa (Max)" inputMode="numeric" value={input.max} error={fields.max} onChange={e => change('max',e.target.value)} />
    <div className="form-actions"><Button className="button-secondary" type="button" disabled={busy} onClick={onClose}>Hủy</Button><Button className="button-beige" disabled={busy} type="submit">{busy ? 'Đang lưu…' : 'Lưu'}</Button></div>
  </form></FormDialog>{error && <ResultDialog error message={error} onClose={() => setError('')} />}</>;
}
