import { z, ZodError } from 'zod';
import type { CoCoDatabase } from '../db/schema';
import { purchaseDraftSchema, purchaseFinalizationFieldsSchema, purchaseProvenanceSchema, purchaseSubtotal } from '../domain/purchases';
import { entitySchemas, metadataSchemas, timestamp } from '../domain/records';
import { reportingEligibility, eligibilityCoverage, type Eligibility } from '../domain/report-eligibility';
import { inReportPeriod, type ReportPeriod } from '../lib/vietnam-time';
import { canonical, historicalEmployee } from '../repositories/purchase-links';
import { RepositoryError } from '../repositories/errors';

// Reporting tolerates missing payment TIME, without weakening the write contract.
const evidenceSchema = purchaseFinalizationFieldsSchema.omit({ paidAt: true }).extend({ paidAt: z.unknown().optional() });
const invalid = () => new RepositoryError('REFERENCE', 'Bằng chứng thu mua không nhất quán');
export async function purchaseCostReport(db: CoCoDatabase, period: ReportPeriod) {
  const invoices = await db.hoaDonThuMua.toArray();
  const facts: { invoiceId: string; paidAt: string; paidTotal: number; productCount: number }[] = [];
  const classifications: (Eligibility & { invoiceId: string })[] = [];
  for (const raw of invoices) {
    const saved = await db.table('purchaseFinalizations').get(raw.MaHDTM);
    if (!saved) { classifications.push({ invoiceId: raw.MaHDTM, ...reportingEligibility(false, undefined) }); continue; }
    try {
      const invoice = entitySchemas.hoaDonThuMua.parse(raw), paid = evidenceSchema.parse(saved);
      // Pure snapshot validation can throw domain Errors (duplicate IDs/overflow),
      // not only ZodError. Classify those as bad evidence; never catch I/O here.
      let subtotal: number;
      try { subtotal = purchaseSubtotal(paid.lines); } catch { throw invalid(); }
      if (paid.invoiceId !== invoice.MaHDTM || subtotal !== paid.subtotal || paid.paidTotal !== paid.subtotal
        || paid.subtotal !== invoice.TongTienTM || paid.lines.some(line => line.draftId !== paid.draftId || line.removedAt || !['priced', 'approved'].includes(line.status))) throw invalid();
      const draft = purchaseDraftSchema.parse(await db.table('purchaseDrafts').get(paid.draftId));
      const marker = await db.appMetadata.get(`purchase-status-mapping:${invoice.MaHDTM}`);
      const mapping = marker && z.object({ invoiceCompleted: z.literal(1), productAvailable: z.literal(1), productSold: z.literal(2) }).strict().parse(JSON.parse(marker.value));
      if (!mapping || invoice.TrangThai !== mapping.invoiceCompleted || draft.status !== 'finalized' || draft.invoiceId !== invoice.MaHDTM
        || draft.employeeId !== invoice.MaNV || draft.customerId !== invoice.MaKH || !await db.khachHang.get(invoice.MaKH)
        || !await db.nhanVien.get(invoice.MaNV)) throw invalid();
      const audits = await db.auditEntries.filter(row => row.id.startsWith('purchase-finalize:') && Array.isArray(row.changed) && row.changed.includes(`purchaseFinalizations:${invoice.MaHDTM}`)).toArray();
      if (audits.length !== 1) throw invalid();
      const audit = audits[0], receipt = await db.operations.get(audit.id);
      if (!receipt || !audit.actor || await historicalEmployee(db, audit.actor) !== invoice.MaNV || !timestamp.safeParse(receipt.executedAt).success
        || !timestamp.safeParse(audit.executedAt).success || receipt.executedAt !== audit.executedAt || receipt.executedAt !== paid.finalizedAt
        || !audit.changed.includes(`purchaseDrafts:${draft.id}`) || !audit.changed.includes(`hoaDonThuMua:${invoice.MaHDTM}`)) throw invalid();
      const products = await db.sanPham.where('MaHDTM').equals(invoice.MaHDTM).toArray();
      const counts = new Map<string, number>();
      for (const product of products) {
        const origin = purchaseProvenanceSchema.parse(await db.table('purchaseProvenance').get(product.MaSP));
        const cost = metadataSchemas.productCosts.parse(await db.productCosts.get(product.MaSP));
        const line = paid.lines.find(item => item.id === origin.lineId);
        if (!line || origin.productId !== product.MaSP || origin.invoiceId !== invoice.MaHDTM || product.MaKhungGia !== line.bracket.id
          || origin.unitCost !== line.unitCost || cost.unitCost !== line.unitCost || cost.MaHDTM !== invoice.MaHDTM || cost.MaKhungGia !== line.bracket.id
          || origin.recordedAt !== paid.finalizedAt || cost.recordedAt !== paid.finalizedAt) throw invalid();
        counts.set(line.id, (counts.get(line.id) ?? 0) + 1);
      }
      for (const line of paid.lines) {
        if (counts.get(line.id) !== line.quantity || canonical(await db.table('purchaseLines').get(line.id)) !== canonical(line)) throw invalid();
      }
      const eligibility = reportingEligibility(true, paid.paidAt);
      if (eligibility.trustedTime && Date.parse(eligibility.trustedTime) !== Date.parse(paid.finalizedAt)) throw invalid();
      classifications.push({ invoiceId: invoice.MaHDTM, ...eligibility });
      if (eligibility.trustedTime) facts.push({ invoiceId: invoice.MaHDTM, paidAt: eligibility.trustedTime, paidTotal: paid.paidTotal, productCount: products.length });
    } catch (error) {
      if (!(error instanceof ZodError || error instanceof SyntaxError || error instanceof RepositoryError && error.code === 'REFERENCE')) throw error;
      classifications.push({ invoiceId: raw.MaHDTM, ...reportingEligibility(false, undefined) });
    }
  }
  const eligible = facts.filter(row => inReportPeriod(period, row.paidAt));
  function summary(rows: typeof facts) {
    const cost = rows.reduce((sum, row) => sum + BigInt(row.paidTotal), 0n), count = rows.reduce((sum, row) => sum + BigInt(row.productCount), 0n);
    if (cost > BigInt(Number.MAX_SAFE_INTEGER) || count > BigInt(Number.MAX_SAFE_INTEGER)) throw new RepositoryError('VALIDATION', 'Tổng thu mua vượt giới hạn số an toàn');
    return { invoiceCount: rows.length, productCount: Number(count), totalCost: Number(cost), averageCost: rows.length ? Number(cost) / rows.length : 0 };
  }
  const groups = new Map<string, typeof facts>();
  for (const fact of eligible) {
    const date = new Date(Date.parse(fact.paidAt) + 7 * 3_600_000).toISOString().slice(0, 10);
    groups.set(date, [...(groups.get(date) ?? []), fact]);
  }
  return { facts, verifiedInvoiceIds: classifications.filter(row => row.verification === 'VERIFIED').map(row => row.invoiceId), scope: 'VERIFIED_ONLY' as const, period, summary: summary(eligible), coverage: eligibilityCoverage(classifications), classifications,
    rows: [...groups].sort(([a], [b]) => a.localeCompare(b)).map(([date, rows]) => ({ date, ...summary(rows) })) };
}
