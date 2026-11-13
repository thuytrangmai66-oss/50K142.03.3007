import { reportChoices, type ReportKind } from './report-catalog';

/** Source UI22. The owner-only route supplies selection/navigation when queries are connected. */
export function ReportPicker({ onSelect }: { onSelect(kind: ReportKind): void }) {
  return <div className="report-picker" aria-label="Chọn báo cáo">{reportChoices.map(({ kind, label, Icon }) =>
    <button key={kind} type="button" className="report-choice" onClick={() => onSelect(kind)}>
      <Icon aria-hidden="true"/><strong>{label}</strong>
    </button>)}</div>;
}
