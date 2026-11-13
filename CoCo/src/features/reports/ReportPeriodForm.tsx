import { useState, type FormEvent } from 'react';
import { CircleAlert } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { displayPeriodInput, reportPeriod, REPORT_PERIOD_ERROR, type ReportPeriod, type ReportPeriodKind } from '../../lib/vietnam-time';

const kinds: { kind: ReportPeriodKind; label: string }[] = [
  { kind: 'day', label: 'Theo ngày' }, { kind: 'month', label: 'Theo tháng' },
  { kind: 'year', label: 'Theo năm' }, { kind: 'range', label: 'Theo khoảng thời gian' },
];

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
      <label>{label}<input value={value} placeholder={placeholder} aria-invalid={invalid} aria-describedby={invalid ? 'report-period-error' : undefined}
        onChange={event => setValue(event.target.value)} inputMode="numeric" /></label>
      {kind === 'range' && <label>Đến ngày<input value={end} placeholder="dd/mm/yyyy" aria-invalid={invalid}
        aria-describedby={invalid ? 'report-period-error' : undefined} onChange={event => setEnd(event.target.value)} inputMode="numeric" /></label>}
    </div>
    <div className="report-period-actions"><Button type="submit">Xác nhận</Button>
      {invalid && <p id="report-period-error" className="field-error" role="alert"><CircleAlert aria-hidden="true"/>{REPORT_PERIOD_ERROR}</p>}
    </div>
  </form>;
}
