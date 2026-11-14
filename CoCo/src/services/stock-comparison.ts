import type { CoCoDatabase } from '../db/schema';
import type { salesReportLedger } from './sales-report-ledger';
import { purchaseCostReport } from './purchase-report';
import { reportPeriod } from '../lib/vietnam-time';
import { vietnamDay } from '../domain/inventory';
import { stockComparison, type ProductLifecycleFact } from '../domain/stock-comparison';
import { statusMappingSchema } from './purchase-finalization';
import { entitySchemas } from '../domain/records';
import { ZodError } from 'zod';

/** DB-only. Caller owns a single authorized readonly transaction. */
export async function readStockComparison(db: CoCoDatabase, now: Date, sales: Awaited<ReturnType<typeof salesReportLedger>>) {
  const purchases = await purchaseCostReport(db, reportPeriod({ kind: 'day', value: vietnamDay(now) }));
  // Ledger facts include all verified instants, not merely the requested day.
  const imports = new Map(purchases.facts.map(row => [row.invoiceId, row.paidAt]));
  const sold = new Map<string, { invoiceId: string; paidAt: string }[]>();
  for (const sale of sales.facts) for (const line of sale.lines) {
    const matches = sold.get(line.productId) ?? [];
    matches.push({ invoiceId: sale.invoiceId, paidAt: sale.paidAt }); sold.set(line.productId, matches);
  }
  const links = new Map<string, string[]>();
  for (const detail of await db.chiTietHoaDonBH.toArray()) {
    const matches = links.get(detail.MaSP) ?? [];
    matches.push(detail.MaHDBH); links.set(detail.MaSP, matches);
  }
  const facts: ProductLifecycleFact[] = [];
  let knownAvailableCount = 0, unverifiedCount = 0, productIssues = 0;
  for (const raw of await db.sanPham.toArray()) {
    const product = entitySchemas.sanPham.parse(raw);
    const marker = await db.appMetadata.get(`purchase-status-mapping:${product.MaHDTM}`);
    let mapping;
    if (marker) {
      try { mapping = statusMappingSchema.parse(JSON.parse(marker.value)); }
      catch (error) { if (!(error instanceof SyntaxError || error instanceof ZodError)) throw error; }
    }
    if (!mapping || !await db.hoaDonThuMua.get(product.MaHDTM)) { unverifiedCount++; productIssues++; continue; }
    const available = product.TrangThai === mapping.productAvailable, isSold = product.TrangThai === mapping.productSold;
    if (available) knownAvailableCount++;
    else if (!isSold) unverifiedCount++;
    const importedAt = imports.get(product.MaHDTM), salesForProduct = sold.get(product.MaSP) ?? [], details = links.get(product.MaSP) ?? [];
    // Absence of valid paidAt never becomes an assumed "unsold at cutoff".
    const availableProof = available && !salesForProduct.length && !details.length;
    const soldProof = isSold && salesForProduct.length === 1 && details.length === 1 && details[0] === salesForProduct[0].invoiceId;
    if (!importedAt || (!availableProof && !soldProof)) { productIssues++; continue; }
    facts.push({ productId: product.MaSP, importedAt, ...(soldProof ? { soldAt: salesForProduct[0].paidAt } : {}) });
  }
  const sourceIssues = productIssues + sales.coverage.totalRecords - sales.coverage.eligibleRecords
    + purchases.coverage.totalRecords - purchases.coverage.eligibleRecords + sales.evidenceIssues.length;
  return { knownAvailableCount, unverifiedCount, comparison: stockComparison(now, facts, sourceIssues) };
}
