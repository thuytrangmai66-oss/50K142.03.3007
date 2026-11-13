import type { CoCoDatabase } from '../db/schema';
import { entitySchemas, calendarDate } from '../domain/records';
import type { InvoiceDetail } from './reference-data/contracts';
import { readCandidatePurchase } from './purchase-candidate';
import { statusMappingSchema } from './purchase-finalization';
import { RepositoryError } from '../repositories/errors';
import { paginate } from '../domain/pagination';

export interface PurchaseFilters { id: string; phone: string; name: string; date: string }
const vietnamDay = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
const invalid = () => new RepositoryError('REFERENCE', 'Dữ liệu giao dịch thu mua không nhất quán');

/** Caller holds an authenticated read transaction. All joins use stable IDs. */
export async function purchaseHeader(db: CoCoDatabase, raw: unknown) {
  const invoice = entitySchemas.hoaDonThuMua.parse(raw);
  const customer = entitySchemas.khachHang.parse(await db.khachHang.get(invoice.MaKH));
  const employee = entitySchemas.nhanVien.parse(await db.nhanVien.get(invoice.MaNV));
  const purchase = await readCandidatePurchase(db, invoice.MaHDTM);
  if (!purchase) throw invalid();
  const mapping = await db.appMetadata.get(`purchase-status-mapping:${invoice.MaHDTM}`);
  if (mapping && statusMappingSchema.parse(JSON.parse(mapping.value)).invoiceCompleted !== invoice.TrangThai) throw invalid();
  return { invoice, customer, employee, purchase,
    statusLabel: purchase.source === 'purchase-lines-v1' ? 'Hoàn tất' : 'Chưa xác định' };
}

export async function queryPurchases(db: CoCoDatabase, filters: PurchaseFilters, page: number, pageSize?: number) {
  if (filters.date && !calendarDate.safeParse(filters.date).success) throw new RepositoryError('VALIDATION', 'Ngày tìm kiếm không hợp lệ');
  const rows = [];
  for (const raw of await db.hoaDonThuMua.toArray()) {
    const { invoice, customer } = await purchaseHeader(db, raw);
    rows.push({ id: invoice.MaHDTM, customerId: customer.MaKH, phone: customer.SoDienThoaiKH,
      name: customer.TenKH, date: invoice.NgayThuMua });
  }
  const folded = (value: string) => value.trim().toLocaleLowerCase('vi');
  const filtered = rows.filter(row => folded(row.id).includes(folded(filters.id)) && row.phone.includes(filters.phone.trim()) &&
    folded(row.name).includes(folded(filters.name)) && (!filters.date || vietnamDay.format(new Date(row.date)) === filters.date));
  filtered.sort((a, b) => Date.parse(b.date) - Date.parse(a.date) || a.id.localeCompare(b.id));
  return paginate(filtered, page, pageSize);
}

export async function purchaseInvoice(db: CoCoDatabase, invoiceId: string, customerId?: string): Promise<InvoiceDetail> {
  const header = await purchaseHeader(db, await db.hoaDonThuMua.get(invoiceId));
  const { invoice, customer, employee, purchase, statusLabel } = header;
  if (customerId && customer.MaKH !== customerId) throw invalid();
  const lines: InvoiceDetail['lines'] = [];
  if (purchase.source === 'purchase-lines-v1') {
    for (const line of purchase.lines) lines.push({ id: line.id, name: `${line.bracket.type} ${line.bracket.brand}`,
      quantity: line.quantity, unitPrice: line.unitCost, total: line.quantity * line.unitCost });
    for (const raw of await db.sanPham.where('MaHDTM').equals(invoiceId).toArray()) entitySchemas.sanPham.parse(raw);
  } else {
    for (const raw of purchase.lines) {
      const line = entitySchemas.chiTietHoaDonTM.parse(raw);
      const bracket = entitySchemas.khungGiaThuMua.parse(await db.khungGiaThuMua.get(line.MaKhungGia));
      if (line.MaHDTM !== invoiceId) throw invalid();
      lines.push({ id: line.MaKhungGia, name: bracket.LoaiSanPham, quantity: line.SoLuong, unitPrice: line.DonGia, total: line.ThanhTien });
    }
    for (const raw of await db.sanPham.where('MaHDTM').equals(invoiceId).toArray()) {
      const product = entitySchemas.sanPham.parse(raw);
      if (!lines.some(line => line.id === product.MaKhungGia)) throw invalid();
    }
  }
  if (!lines.length || lines.reduce((sum, line) => sum + BigInt(line.total), 0n) !== BigInt(invoice.TongTienTM)) throw invalid();
  return { id: invoice.MaHDTM, date: invoice.NgayThuMua, statusCode: invoice.TrangThai, statusLabel, source: purchase.source,
    customer, employee: { id: employee.MaNV, name: employee.HoTen }, lines, total: invoice.TongTienTM };
}
