import type { CoCoDatabase } from '../db/schema';
import type { ReportPeriod } from '../lib/vietnam-time';
import { inReportPeriod } from '../lib/vietnam-time';
import { metadataSchemas, entitySchemas } from '../domain/records';
import { salesReportLedger } from './sales-report-ledger';
import { purchaseCostReport } from './purchase-report';
import { RepositoryError } from '../repositories/errors';
import { z } from 'zod';

export function safeReportNumber(value: bigint) {
  if (value > BigInt(Number.MAX_SAFE_INTEGER) || value < BigInt(Number.MIN_SAFE_INTEGER)) throw new RepositoryError('VALIDATION', 'Tổng báo cáo vượt giới hạn số an toàn');
  return Number(value);
}
export async function financialReport(db: CoCoDatabase, period: ReportPeriod, kind: 'profit' | 'cash-flow') {
  z.enum(['profit', 'cash-flow']).parse(kind);
  const sales = await salesReportLedger(db, period), purchases = await purchaseCostReport(db, period);
  const groups = new Map<string, { incoming: bigint; outgoing: bigint; count: number }>();
  const excluded: { invoiceId: string; reason: string }[] = [];
  const add = (date: string, incoming: bigint, outgoing: bigint, count: number) => {
    const row = groups.get(date) ?? { incoming: 0n, outgoing: 0n, count: 0 };
    row.incoming += incoming; row.outgoing += outgoing; row.count += count; groups.set(date, row);
  };
  const day = (at: string) => new Date(Date.parse(at) + 7 * 3600000).toISOString().slice(0, 10);
  for (const sale of sales.facts.filter(row => inReportPeriod(period, row.paidAt))) {
    let cost = 0n, complete = true;
    if (kind === 'profit') for (const line of sale.lines) {
      const raw = await db.productCosts.get(line.productId), parsed = metadataSchemas.productCosts.safeParse(raw);
      const product = entitySchemas.sanPham.parse(await db.sanPham.get(line.productId));
      if (!parsed.success || parsed.data.MaHDTM !== line.sourcePurchaseId || product.MaHDTM !== line.sourcePurchaseId
        || !purchases.verifiedInvoiceIds.includes(line.sourcePurchaseId)) { complete = false; break; }
      cost += BigInt(parsed.data.unitCost);
    }
    if (!complete) throw new RepositoryError('REFERENCE', 'Không đủ căn cứ giá vốn cho hóa đơn đã xác minh');
    add(day(sale.paidAt), BigInt(sale.paidTotal), cost, 1);
  }
  if (kind === 'cash-flow') for (const row of purchases.rows) add(row.date, 0n, BigInt(row.totalCost), row.invoiceCount);
  let incoming = 0n, outgoing = 0n, count = 0;
  const rows = [...groups].sort(([a], [b]) => a.localeCompare(b)).map(([date, value]) => {
    incoming += value.incoming; outgoing += value.outgoing; count += value.count;
    return { date, incoming: safeReportNumber(value.incoming), outgoing: safeReportNumber(value.outgoing), net: safeReportNumber(value.incoming - value.outgoing) };
  });
  return { scope: 'VERIFIED_ONLY' as const, kind, period, rows, summary: { count, incoming: safeReportNumber(incoming), outgoing: safeReportNumber(outgoing), net: safeReportNumber(incoming - outgoing) },
    coverage: { sales: sales.coverage, purchases: purchases.coverage }, excluded, evidenceIssues: sales.evidenceIssues };
}
