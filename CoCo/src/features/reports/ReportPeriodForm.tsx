import { useId, useRef, useState, type FormEvent } from 'react';
import { CircleAlert } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { displayPeriodInput, reportPeriod, REPORT_PERIOD_ERROR, type ReportPeriod, type ReportPeriodKind } from '../../lib/vietnam-time';

const kinds: { kind: ReportPeriodKind; label: string }[] = [
  { kind: 'day', label: 'Theo ngày' }, { kind: 'month', label: 'Theo tháng' },
  { kind: 'year', label: 'Theo năm' }, { kind: 'range', label: 'Theo khoảng thời gian' },
];

/** The same native date chooser as the lists; the text field stays dd/mm/yyyy. */
function ReportDateField({ label, value, invalid, onChange }: { label: string; value: string; invalid: boolean; onChange(value: string): void }) {
  const id = useId(), picker = useRef<HTMLInputElement>(null);
  let iso = '';
  try { iso = reportPeriod(displayPeriodInput('day', value)).startDate; } catch { /* Preserve incomplete/invalid text for the existing validation. */ }
  function openPicker() {
    const input = picker.current;
    if (typeof input?.showPicker !== 'function') return false;
    try { input.showPicker(); return true; } catch { return false; }
  }
  const describedBy = invalid ? 'report-period-error' : undefined;
  return <label htmlFor={id}>{label}<span className="report-date-field">
    <input id={id} className="report-date-text" value={value} placeholder="dd/mm/yyyy" inputMode="numeric"
      aria-invalid={invalid} aria-describedby={describedBy} onChange={event => onChange(event.target.value)} onClick={() => { openPicker(); }}
      onKeyDown={event => { if (event.altKey && event.key === 'ArrowDown' && openPicker()) event.preventDefault(); }}/>
    <input ref={picker} className="report-date-picker" type="date" value={iso} aria-label={`Chọn ngày cho ${label}`}
      aria-describedby={describedBy} title={`Chọn ngày cho ${label}`} onClick={event => { if (openPicker()) event.preventDefault(); }}
      onKeyDown={event => { if (['Enter', ' '].includes(event.key) && openPicker()) event.preventDefault(); }}
      onChange={event => { const selected = event.target.value; onChange(selected ? selected.split('-').reverse().join('/') : ''); }}/>
  </span></label>;
}

/** UI22–27 shared source filter; reporting queries are supplied by its caller. */
export function ReportPeriodForm({ onConfirm }: { onConfirm(period: ReportPeriod): void }) {
  const [kind, setKind] = useState<ReportPeriodKind>('range');
  const [value, setValue] = useState(''), [end, setEnd] = useState(''), [invalid, setInvalid] = useState(false);
  function submit(event: FormEvent) {
    event.preventDefault();
    let period: ReportPeriod;
    try { period = reportPeriod(displayPeriodInput(kind, value, end)); }
    catch { setInvalid(true); return; }
    setInvalid(false); onConfirm(period);
  }
  const label = kind === 'range' ? 'Từ ngày' : kind === 'day' ? 'Ngày' : kind === 'month' ? 'Tháng' : 'Năm';
  const placeholder = kind === 'year' ? 'yyyy' : kind === 'month' ? 'mm/yyyy' : 'dd/mm/yyyy';
  return <form className="report-period-form" onSubmit={submit} noValidate aria-label="Kỳ báo cáo">
    <div className="report-period-fields">
      <fieldset><legend>Loại thời gian</legend><div className="report-period-kinds">
        {kinds.map(item => <button key={item.kind} type="button" aria-pressed={kind === item.kind}
          onClick={() => { setKind(item.kind); setValue(''); setEnd(''); setInvalid(false); }}>{item.label}</button>)}
      </div></fieldset>
      {kind === 'day' || kind === 'range' ? <ReportDateField label={label} value={value} invalid={invalid} onChange={setValue}/> :
        <label>{label}<input value={value} placeholder={placeholder} aria-invalid={invalid} aria-describedby={invalid ? 'report-period-error' : undefined}
          onChange={event => setValue(event.target.value)} inputMode="numeric" /></label>}
      {kind === 'range' && <ReportDateField label="Đến ngày" value={end} invalid={invalid} onChange={setEnd}/>}
    </div>
    <div className="report-period-actions"><Button type="submit">Xác nhận</Button>
      {invalid && <p id="report-period-error" className="field-error" role="alert"><CircleAlert aria-hidden="true"/>{REPORT_PERIOD_ERROR}</p>}
    </div>
  </form>;
}
