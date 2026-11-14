import { z } from 'zod';
import type { CoCoDatabase } from '../db/schema';
import { entitySchemas, metadataSchemas } from '../domain/records';
import { inventoryAttributesKey, inventoryAttributesSchema, vietnamDay, daysBetween } from '../domain/inventory';
import { purchaseFinalizationSchema, purchaseProvenanceSchema, purchaseSubtotal } from '../domain/purchases';
import { statusMappingSchema } from './purchase-finalization';
import { RepositoryError } from '../repositories/errors';

export const AGED_DAYS_ERROR = 'Số ngày tồn kho tối thiểu không hợp lệ. Vui lòng kiểm tra lại';
export const agedStockFiltersSchema = z.object({ minDays: z.number().int().positive().max(Number.MAX_SAFE_INTEGER), type: z.string(), brand: z.string() }).strict();
export type AgedStockFilters = z.infer<typeof agedStockFiltersSchema>;
const invalid = () => new RepositoryError('REFERENCE', 'Dữ liệu hàng tồn lâu không nhất quán');
/** DB-only projection. Payment time is irrelevant to stock age; no date is backfilled. */
export async function agedStockReport(db: CoCoDatabase, input: AgedStockFilters, now: Date) {
  const filters = agedStockFiltersSchema.parse(input), all = [], excluded: string[] = [];
  for (const raw of await db.sanPham.toArray()) {
    const product = entitySchemas.sanPham.parse(raw), marker = await db.appMetadata.get(`purchase-status-mapping:${product.MaHDTM}`);
    if (!marker) { excluded.push(product.MaSP); continue; }
    const mapping = statusMappingSchema.parse(JSON.parse(marker.value));
    if (product.TrangThai !== mapping.productAvailable) continue;
    const bracket = entitySchemas.khungGiaThuMua.parse(await db.khungGiaThuMua.get(product.MaKhungGia));
    const cost = metadataSchemas.productCosts.parse(await db.productCosts.get(product.MaSP));
    if (cost.MaHDTM !== product.MaHDTM || cost.MaKhungGia !== product.MaKhungGia || !await db.hoaDonThuMua.get(product.MaHDTM)) throw invalid();
    let type = bracket.LoaiSanPham, brand = bracket.ThuongHieu;
    let finalized = await db.table('purchaseFinalizations').get(product.MaHDTM);
    if (finalized) {
      // Validate the snapshot except payment time, never used for inventory age.
      const saved = purchaseFinalizationSchema.innerType().extend({ paidAt: z.unknown().optional() }).parse(finalized);
      if (saved.invoiceId !== product.MaHDTM || purchaseSubtotal(saved.lines) !== saved.subtotal || saved.paidTotal !== saved.subtotal
        || saved.lines.some(line => line.draftId !== saved.draftId || line.removedAt || !['priced', 'approved'].includes(line.status))) throw invalid();
      finalized = saved;
    }
    const originRaw = await db.table('purchaseProvenance').get(product.MaSP);
    if (finalized || originRaw) {
      const origin = purchaseProvenanceSchema.parse(originRaw);
      const line = finalized?.lines?.find((row: { id: string }) => row.id === origin.lineId);
      if (!line || origin.productId !== product.MaSP || origin.invoiceId !== product.MaHDTM || origin.unitCost !== cost.unitCost || line.unitCost !== cost.unitCost || line.bracket.id !== product.MaKhungGia) throw invalid();
      type = line.bracket.type; brand = line.bracket.brand;
    }
    const attributes = await db.appMetadata.get(inventoryAttributesKey(product.MaSP));
    if (attributes) {
      const saved = inventoryAttributesSchema.parse(JSON.parse(attributes.value));
      if (saved.productId !== product.MaSP) throw invalid();
      type = saved.type; brand = saved.brand;
    }
    const age = daysBetween(product.NgayNhapKho, vietnamDay(now));
    const applications = (await db.discountApplications.where('MaSP').equals(product.MaSP).toArray()).map(row => metadataSchemas.discountApplications.parse(row))
      .filter(row => row.cycleStartedOn === product.NgayBatDauChuKyGiam).sort((a, b) => b.milestone - a.milestone);
    if (applications[0] && applications[0].priceAfter !== product.GiaBanHienHanh) throw invalid();
    all.push({ id: product.MaSP, name: product.TenSP, type, brand, enteredOn: product.NgayNhapKho, days: age, cost: cost.unitCost, price: product.GiaBanHienHanh,
      status: applications.length ? 'Đã giảm giá' : 'Đang bán' });
  }
  const rows = all.filter(row => row.days >= filters.minDays && (!filters.type || row.type === filters.type) && (!filters.brand || row.brand === filters.brand))
    .sort((a, b) => b.days - a.days || a.id.localeCompare(b.id));
  return { rows, total: rows.length, minDays: filters.minDays, types: [...new Set(all.map(row => row.type))].sort(), brands: [...new Set(all.map(row => row.brand))].sort(), excluded };
}
