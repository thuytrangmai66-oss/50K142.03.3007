import { reportChoices, type ReportKind } from './report-catalog';

/** Source UI22. The owner-only route supplies selection/navigation when queries are connected. */
export function ReportPicker({ onSelect, available }: { onSelect(kind: ReportKind): void; available?: readonly ReportKind[] }) {
  return <div className="report-picker" aria-label="Chọn báo cáo">{reportChoices.map(({ kind, label, Icon }) =>
    <button key={kind} type="button" className="report-choice" disabled={available && !available.includes(kind)}
      title={available && !available.includes(kind) ? 'Chưa triển khai theo tiến độ G9' : undefined} onClick={() => onSelect(kind)}>
      <Icon aria-hidden="true"/><strong>{label}</strong>
    </button>)}</div>;
}
