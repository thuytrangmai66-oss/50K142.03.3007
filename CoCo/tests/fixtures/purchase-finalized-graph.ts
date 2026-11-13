import type { CoCoDatabase } from '../../src/db/schema';
import { PURCHASE_FORMAT, initialSalePrice, type PurchaseLine } from '../../src/domain/purchases';

/** Validator fixture only. This is not a finalize/approval service or UI flow. */
export async function installFinalizedPurchaseGraph(db: CoCoDatabase, identity: { employeeId: string; createdBy: string; ownerId: string }) {
  const now = '2026-11-11T01:00:00Z';
  const bracket = { id: 'KG1', revision: 1, type: 'Áo', brand: 'CoCo', condition: 2 as const, min: 50000, max: 100000 };
  const lines: PurchaseLine[] = [
    { id: 'graph-line1', draftId: 'DGRAPH', revision: 1, bracket, quantity: 1, unitCost: 80001, status: 'priced' },
    { id: 'graph-line2', draftId: 'DGRAPH', revision: 1, bracket, quantity: 1, unitCost: 120000, status: 'approved', approvalId: 'YCGRAPH' },
  ];
  await db.transaction('rw', db.tables, async () => {
    await db.khachHang.put({ MaKH: 'KHGRAPH', TenKH: 'Khách graph', SoDienThoaiKH: '0900000088', DiemTichLuy: 0 });
    await db.khungGiaThuMua.put({ MaKhungGia: 'KG1', LoaiSanPham: 'Áo', ThuongHieu: 'CoCo', TinhTrang: 2, GiaMin: 50000, GiaMax: 100000, MaNV: identity.ownerId });
    await db.hoaDonThuMua.add({ MaHDTM: 'TMGRAPH', NgayThuMua: now, TongTienTM: 200001, TrangThai: 90, MaNV: identity.employeeId, MaKH: 'KHGRAPH' });
    await db.table('purchaseDrafts').add({ id: 'DGRAPH', format: PURCHASE_FORMAT, employeeId: identity.employeeId, createdBy: identity.createdBy, status: 'finalized', revision: 1, customerId: 'KHGRAPH', invoiceId: 'TMGRAPH', createdAt: now, updatedAt: now });
    await db.table('purchaseLines').bulkAdd(lines);
    await db.table('purchaseApprovals').add({ id: 'YCGRAPH', draftId: 'DGRAPH', lineId: 'graph-line2', lineRevision: 1, revision: 2, requestedBy: identity.createdBy, requestedAt: now, bracket, quantity: 1, unitCost: 120000, decision: { status: 'approved', actor: 'owner', decidedAt: now } });
    await db.table('purchaseFinalizations').add({ format: PURCHASE_FORMAT, invoiceId: 'TMGRAPH', draftId: 'DGRAPH', lines, subtotal: 200001, paidTotal: 200001, finalizedAt: now, paidAt: now });
    for (const [index, line] of lines.entries()) {
      const productId = `SPGRAPH${index + 1}`, salePrice = initialSalePrice(line.unitCost);
      await db.sanPham.add({ MaSP: productId, TenSP: 'Áo graph', MaHDTM: 'TMGRAPH', MaKhungGia: 'KG1', NgayNhapKho: '2026-11-11', NgayBatDauChuKyGiam: '2026-11-11', GiaGocChuKyGiam: salePrice, GiaBanHienHanh: salePrice, TrangThai: 90 });
      await db.productCosts.add({ MaSP: productId, MaHDTM: 'TMGRAPH', MaKhungGia: 'KG1', unitCost: line.unitCost, recordedAt: now });
      await db.table('purchaseProvenance').add({ format: PURCHASE_FORMAT, productId, invoiceId: 'TMGRAPH', lineId: line.id, unitCost: line.unitCost, recordedAt: now });
    }
  });
}
