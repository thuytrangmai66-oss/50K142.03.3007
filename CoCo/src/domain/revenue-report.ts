import { identifier, money, timestamp } from './records';
import { inReportPeriod, type ReportPeriod } from '../lib/vietnam-time';
import { RepositoryError } from '../repositories/errors';

/** Values are supplied by the verified-data adapter, never by a UI status flag. */
export interface VerifiedRevenueSale {
  invoiceId: string;
  paidAt: string;
  paidTotal: number;
}
export interface RevenueSummary {
  period: ReportPeriod;
  invoiceCount: number;
  totalRevenue: number;
  averageRevenue: number;
  invoiceIds: string[];
}

/** BR-UC7-01..03. No legacy classification, writes, or invented rounding policy. */
export function revenueFromVerifiedSales(period: ReportPeriod, sales: readonly VerifiedRevenueSale[]): RevenueSummary {
  const seen = new Set<string>(), invoiceIds: string[] = [];
  let total = 0n;
  for (const sale of sales) {
    identifier.parse(sale.invoiceId); timestamp.parse(sale.paidAt); money.parse(sale.paidTotal);
    if (seen.has(sale.invoiceId)) throw new RepositoryError('REFERENCE', 'Hóa đơn bị lặp trong đầu vào báo cáo');
    seen.add(sale.invoiceId);
    if (!inReportPeriod(period, sale.paidAt)) continue;
    total += BigInt(sale.paidTotal); invoiceIds.push(sale.invoiceId);
  }
  if (total > BigInt(Number.MAX_SAFE_INTEGER)) throw new RepositoryError('VALIDATION', 'Tổng doanh thu vượt giới hạn số an toàn');
  const totalRevenue = Number(total), invoiceCount = invoiceIds.length;
  invoiceIds.sort();
  return { period, invoiceCount, totalRevenue, averageRevenue: invoiceCount ? totalRevenue / invoiceCount : 0, invoiceIds };
}
