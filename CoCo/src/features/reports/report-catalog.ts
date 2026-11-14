import { createLucideIcon, TrendingUp, Package, Repeat } from 'lucide-react';

const ReportRevenueIcon = createLucideIcon('ReportRevenue', [
  ['path', { d: 'M3 21v-6', key: 'left' }],
  ['path', { d: 'M12 21V3', key: 'center' }],
  ['path', { d: 'M21 21V9', key: 'right' }],
]);

// SC105 uses the original two-stroke payment symbol, without the chip added to
// the installed CreditCard icon. Keep the existing Lucide SVG primitive/styling.
const ReportPaymentIcon = createLucideIcon('ReportPayment', [
  ['rect', { width: '20', height: '14', x: '2', y: '5', rx: '2', key: 'outline' }],
  ['line', { x1: '2', x2: '22', y1: '10', y2: '10', key: 'stripe' }],
]);

export const reportChoices = [
  { kind: 'revenue', label: 'Xem báo cáo doanh thu bán hàng', Icon: ReportRevenueIcon },
  { kind: 'purchase-cost', label: 'Xem báo cáo chi phí thu mua', Icon: ReportPaymentIcon },
  { kind: 'profit', label: 'Xem báo cáo lợi nhuận', Icon: TrendingUp },
  { kind: 'aged-stock', label: 'Xem báo cáo hàng tồn lâu', Icon: Package },
  { kind: 'cash-flow', label: 'Xem báo cáo dòng tiền', Icon: Repeat },
] as const;
export type ReportKind = typeof reportChoices[number]['kind'];
