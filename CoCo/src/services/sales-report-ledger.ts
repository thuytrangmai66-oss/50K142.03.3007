import { z, ZodError } from 'zod';
import type { CoCoDatabase } from '../db/schema';
import { timestamp } from '../domain/records';
import { paidSaleSchema, type SaleSnapshot } from '../domain/sale-payment';
import { salesDraftSchema } from '../domain/sales';
import { revenueFromVerifiedSales, revenueRowsFromVerifiedSales, type VerifiedRevenueSale } from '../domain/revenue-report';
import { eligibilityCoverage, reportingEligibility, type Eligibility } from '../domain/report-eligibility';
import { type ReportPeriod } from '../lib/vietnam-time';
import { RepositoryError } from '../repositories/errors';

import { assertSaleSnapshotGraph, readSaleInvoiceGraph } from './sales-queries';
import { saleInvoiceKey } from './sales-payment';


// Read tolerance is local to reporting; storage/finalizers keep their strict schema.
const reportPaymentEvidence = paidSaleSchema.omit({ paidAt: true }).extend({ paidAt: z.unknown().optional() });
export interface SaleReportClassification extends Eligibility { invoiceId: string; reason?: string }
const inconsistent = () => new RepositoryError('REFERENCE', 'Bằng chứng hoàn tất hóa đơn bán hàng không nhất quán');
const isIntegrityIssue = (error: unknown) => error instanceof ZodError || error instanceof SyntaxError
  || error instanceof RepositoryError && error.code === 'REFERENCE';

/** DB-only reader; caller supplies one authorized readonly transaction. */
export async function salesReportLedger(db: CoCoDatabase, period: ReportPeriod) {
      const invoices = await db.hoaDonBanHang.toArray();
      const ids = new Set(invoices.map(row => row.MaHDBH));
      const saved = await db.appMetadata.filter(row => row.key.startsWith('sales-invoice:')).toArray();
      const byKey = new Map(saved.map(row => [row.key, row.value]));
      const evidenceIssues = saved.filter(row => !ids.has(row.key.slice('sales-invoice:'.length)))
        .map(row => ({ key: row.key, reason: 'ORPHAN_EVIDENCE' as const }));
      const verified: (VerifiedRevenueSale & { lines: SaleSnapshot['lines'] })[] = [], classifications: SaleReportClassification[] = [];
      for (const invoice of invoices) {
        const raw = byKey.get(saleInvoiceKey(invoice.MaHDBH));
        if (raw === undefined) {
          classifications.push({ invoiceId: invoice.MaHDBH, ...reportingEligibility(false, undefined), reason: 'PAYMENT_PROOF_MISSING' });
          continue;
        }
        try {
          const paid = reportPaymentEvidence.parse(JSON.parse(raw));
          const graph = await readSaleInvoiceGraph(db, invoice);
          await assertSaleSnapshotGraph(db, graph, paid.snapshot);
          const receiptId = `sale-finalize:${paid.operationId}`;
          const receipt = await db.operations.get(receiptId), audit = await db.auditEntries.get(receiptId);
          const draftRow = await db.appMetadata.get(`sales-draft:${paid.snapshot.draftId}`);
          const draft = draftRow && salesDraftSchema.parse(JSON.parse(draftRow.value));
          if (!receipt || !audit || !draft || draft.status !== 'finalized' || draft.invoiceId !== invoice.MaHDBH
            || draft.employeeId !== invoice.MaNV || audit.actor !== paid.snapshot.employee.username
            || !timestamp.safeParse(receipt.executedAt).success || !timestamp.safeParse(audit.executedAt).success
            || Date.parse(receipt.executedAt) !== Date.parse(audit.executedAt)
            || !Array.isArray(audit.changed) || !audit.changed.includes(saleInvoiceKey(invoice.MaHDBH))) throw inconsistent();
          const eligibility = reportingEligibility(true, paid.paidAt);
          // NgayBan is only a P05 consistency check, never a substitute payment date.
          if (eligibility.eligibility === 'ELIGIBLE' && Date.parse(eligibility.trustedTime!) !== Date.parse(invoice.NgayBan)) throw inconsistent();
          classifications.push({ invoiceId: invoice.MaHDBH, ...eligibility,
            ...(eligibility.eligibility === 'MISSING_TIME' ? { reason: 'PAYMENT_TIME_MISSING' }
              : eligibility.eligibility === 'INVALID_TIME' ? { reason: 'PAYMENT_TIME_INVALID' } : {}) });
          if (eligibility.eligibility === 'ELIGIBLE') verified.push({ invoiceId: invoice.MaHDBH, paidAt: eligibility.trustedTime!, paidTotal: paid.snapshot.total, lines: paid.snapshot.lines });
        } catch (error) {
          // Genuine storage/authorization errors must not become excluded records.
          if (!isIntegrityIssue(error)) throw error;
          classifications.push({ invoiceId: invoice.MaHDBH, ...reportingEligibility(false, undefined), reason: 'PAYMENT_PROOF_INCONSISTENT' });
        }
      }
      return { facts: verified, scope: 'VERIFIED_ONLY' as const, summary: revenueFromVerifiedSales(period, verified),
        rows: revenueRowsFromVerifiedSales(period, verified),
        coverage: eligibilityCoverage(classifications), classifications, evidenceIssues };
}
