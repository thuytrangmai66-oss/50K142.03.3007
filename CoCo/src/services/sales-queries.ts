import type { CoCoDatabase } from '../db/schema';
import { calendarDate, entitySchemas, identifier } from '../domain/records';
import { paidSaleSchema, type SaleSnapshot } from '../domain/sale-payment';
import { paginate } from '../domain/pagination';
import { RepositoryError } from '../repositories/constraints';
import { AuthService } from './auth/service';
import { saleInvoiceKey } from './sales-payment';
import { statusMappingSchema } from './purchase-finalization';

export interface SalesFilters { id: string; name: string; phone: string; date: string }
const dayVN = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
const invalid = () => new RepositoryError('REFERENCE', 'Dữ liệu hóa đơn bán hàng không nhất quán');

/** Shared graph reader: deliberately independent from any payment timestamp. */
export async function readSaleInvoiceGraph(db: CoCoDatabase, raw: unknown) {
  const invoice = entitySchemas.hoaDonBanHang.parse(raw);
  const currentCustomer = entitySchemas.khachHang.parse(await db.khachHang.get(invoice.MaKH));
  const employee = entitySchemas.nhanVien.parse(await db.nhanVien.get(invoice.MaNV));
  const storedLines = (await db.chiTietHoaDonBH.where('MaHDBH').equals(invoice.MaHDBH).toArray()).map(line => entitySchemas.chiTietHoaDonBH.parse(line));
  if (!storedLines.length) throw invalid();
  const products = await Promise.all(storedLines.map(async line => entitySchemas.sanPham.parse(await db.sanPham.get(line.MaSP))));
  return { invoice, currentCustomer, employee, storedLines, products };
}
export async function assertSaleSnapshotGraph(db: CoCoDatabase, graph: Awaited<ReturnType<typeof readSaleInvoiceGraph>>, snapshot: SaleSnapshot) {
  const { invoice, storedLines, products } = graph;
  if (snapshot.invoiceId !== invoice.MaHDBH || snapshot.customer.id !== invoice.MaKH || snapshot.employee.id !== invoice.MaNV
    || snapshot.total !== invoice.TongTien || snapshot.discount !== invoice.TienKhuyenMai || snapshot.customer.pointsEarned !== invoice.TichDiem
    || snapshot.mapping.completed !== invoice.TrangThai || snapshot.mapping[snapshot.method] !== invoice.PTTT
    || snapshot.lines.length !== storedLines.length) throw invalid();
  for (const line of snapshot.lines) {
    const stored = storedLines.find(row => row.MaSP === line.productId), product = products.find(row => row.MaSP === line.productId);
    if (!stored || !product || product.MaHDTM !== line.sourcePurchaseId || stored.DonGia !== line.unitPrice
      || stored.SoLuong !== line.quantity || stored.ThanhTien !== line.lineTotal) throw invalid();
    const mapping = await db.appMetadata.get(`purchase-status-mapping:${product.MaHDTM}`);
    if (!mapping || product.TrangThai !== statusMappingSchema.parse(JSON.parse(mapping.value)).productSold) throw invalid();
  }
}

/** Read only: snapshots are checked against the persisted graph, never repaired. */
export async function readSaleInvoice(db: CoCoDatabase, raw: unknown) {
  const graph = await readSaleInvoiceGraph(db, raw);
  const { invoice, currentCustomer, employee, storedLines, products } = graph;
  const metadata = await db.appMetadata.get(saleInvoiceKey(invoice.MaHDBH));
  const paid = metadata ? paidSaleSchema.parse(JSON.parse(metadata.value)) : undefined;
  if (paid) {
    await assertSaleSnapshotGraph(db, graph, paid.snapshot);
    if (Date.parse(paid.paidAt) !== Date.parse(invoice.NgayBan)) throw invalid();
  }
  const subtotalBig = storedLines.reduce((sum, line) => sum + BigInt(line.ThanhTien), 0n);
  if (subtotalBig > BigInt(Number.MAX_SAFE_INTEGER)) throw invalid();
  return { id: invoice.MaHDBH, date: invoice.NgayBan, customerId: invoice.MaKH, currentCustomer,
    customer: paid ? { name: paid.snapshot.customer.name, phone: paid.snapshot.customer.phone, points: paid.snapshot.customer.pointsAfter }
      : { name: currentCustomer.TenKH, phone: currentCustomer.SoDienThoaiKH, points: undefined },
    employee: paid?.snapshot.employee.name ?? employee.HoTen,
    paymentLabel: paid ? paid.snapshot.method === 'cash' ? 'Tiền mặt' : 'Chuyển khoản' : 'Chưa xác định',
    source: paid ? 'sales-invoice-v1' : 'legacy',
    subtotal: paid?.snapshot.subtotal ?? Number(subtotalBig), discount: invoice.TienKhuyenMai, total: invoice.TongTien,
    lines: paid ? paid.snapshot.lines.map(line => ({ id: line.productId, name: line.name, quantity: line.quantity, unitPrice: line.unitPrice, total: line.lineTotal }))
      : storedLines.map(line => ({ id: line.MaSP, name: products.find(product => product.MaSP === line.MaSP)!.TenSP, quantity: line.SoLuong, unitPrice: line.DonGia, total: line.ThanhTien })),
  };
}

export class SalesQueriesService {
  private readonly auth: AuthService;
  constructor(private readonly db: CoCoDatabase, private readonly token: () => string | null) { this.auth = new AuthService(db); }
  async invoice(invoiceId: string) {
    const id = identifier.parse(invoiceId);
    return this.auth.readAuthorized(this.token() ?? '', 'sales.read', () => this.db.hoaDonBanHang.get(id).then(raw => readSaleInvoice(this.db, raw)));
  }
  async list(filters: SalesFilters, page: number, pageSize?: number) {
    if (filters.date && !calendarDate.safeParse(filters.date).success) throw new RepositoryError('VALIDATION', 'Ngày tìm kiếm không hợp lệ');
    return this.auth.readAuthorized(this.token() ?? '', 'sales.read', async () => {
      const rows = [];
      for (const invoice of await this.db.hoaDonBanHang.toArray()) {
        const detail = await readSaleInvoice(this.db, invoice);
        rows.push({ id: detail.id, date: detail.date, phone: detail.currentCustomer.SoDienThoaiKH, name: detail.currentCustomer.TenKH });
      }
      const fold = (value: string) => value.trim().toLocaleLowerCase('vi');
      return paginate(rows.filter(row => fold(row.id).includes(fold(filters.id)) && fold(row.name).includes(fold(filters.name))
        && row.phone.includes(filters.phone.trim()) && (!filters.date || dayVN.format(new Date(row.date)) === filters.date))
        .sort((a, b) => Date.parse(b.date) - Date.parse(a.date) || a.id.localeCompare(b.id)), page, pageSize);
    });
  }
}
