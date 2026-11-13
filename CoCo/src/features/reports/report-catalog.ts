import { ChartNoAxesColumn, CreditCard, TrendingUp, Package, Repeat2 } from 'lucide-react';

export const reportChoices = [
  { kind: 'revenue', label: 'Xem báo cáo doanh thu bán hàng', Icon: ChartNoAxesColumn },
  { kind: 'purchase-cost', label: 'Xem báo cáo chi phí thu mua', Icon: CreditCard },
  { kind: 'profit', label: 'Xem báo cáo lợi nhuận', Icon: TrendingUp },
  { kind: 'aged-stock', label: 'Xem báo cáo hàng tồn lâu', Icon: Package },
  { kind: 'cash-flow', label: 'Xem báo cáo dòng tiền', Icon: Repeat2 },
] as const;
export type ReportKind = typeof reportChoices[number]['kind'];
