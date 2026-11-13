import type { CoCoDatabase } from '../../db/schema';
import { liveQuery } from 'dexie';
import { CONDITIONS, CONDITION_CATALOG_VERSION, conditionLabel, conditionMetadataKey } from '../../domain/conditions';
import { paginate } from '../../domain/pagination';
import type { RecordMap, RecordName, RecordKey } from '../../domain/records';
import { CoCoRepository, RepositoryError, type Change, type Versioned } from '../../repositories';
import { AuthService } from '../auth/service';
import { randomHex } from '../auth/crypto';
import type { Permission } from '../permissions';
import { DataServiceError, type ReferenceDataGateway, type CustomerInput, type BracketInput, type HistoryKind, type Bracket } from './contracts';
import { purchaseHeader, purchaseInvoice } from '../purchase-queries';
import { readSaleInvoice } from '../sales-queries';

// No invented TINYINT-to-business-label mapping. Inject only a confirmed catalog.
export type ConditionCatalog = Readonly<Record<number, string>>;
export const confirmedConditions: ConditionCatalog = Object.freeze(Object.fromEntries(CONDITIONS.map(item => [item.code, item.label])));
export function validateCustomer(input: CustomerInput) {
  const name = input.name.trim(), phone = input.phone.trim();
  const fields: { name?: string; phone?: string } = {};
  if (!name) fields.name = 'Tên khách hàng không được để trống';
  else if (name.length > 50) fields.name = 'Tên khách hàng không được vượt quá 50 ký tự';
  if (!phone) fields.phone = 'Số điện thoại không được để trống';
  else if (!/^\d{10}$/.test(phone)) fields.phone = 'Số điện thoại phải gồm đúng 10 chữ số';
  if (Object.keys(fields).length) throw new DataServiceError('VALIDATION', 'Hãy kiểm tra thông tin khách hàng', fields);
  return { name, phone };
}
export function validateBracket(input: BracketInput, conditions: ConditionCatalog) {
  const fields: Partial<Record<keyof BracketInput, string>> = {};
  const labels = { productType: 'Loại hàng', brand: 'Thương hiệu', condition: 'Độ mới', min: 'Giá tối thiểu (Min)', max: 'Giá tối đa (Max)' };
  for (const key of Object.keys(labels) as (keyof BracketInput)[]) {
    if (!input[key].trim()) fields[key] = `${labels[key]} không được để trống`;
  }
  for (const key of ['productType','brand'] as const) if (input[key].trim().length > 50) fields[key] = `${labels[key]} không được vượt quá 50 ký tự`;
  if (Object.keys(fields).length) throw new DataServiceError('VALIDATION', 'Hãy kiểm tra thông tin khung giá', fields);
  const amount = (key: 'min' | 'max') => {
    if (!/^-?\d+$/.test(input[key]) || !Number.isSafeInteger(Number(input[key]))) throw new DataServiceError('VALIDATION', `${labels[key]} phải là số nguyên đồng hợp lệ`);
    if (Number(input[key]) <= 0) throw new DataServiceError('VALIDATION', `${labels[key]} phải lớn hơn 0`);
    return Number(input[key]);
  };
  const min = amount('min'), max = amount('max');
  if (min > max) throw new DataServiceError('VALIDATION', 'Giá tối thiểu không được lớn hơn giá tối đa');
  const code = Number(input.condition);
  if (!/^\d+$/.test(input.condition) || !Object.hasOwn(conditions, code)) throw new DataServiceError('CONDITION_MAPPING', 'Vui lòng chọn độ mới hợp lệ.', { condition: 'Vui lòng chọn độ mới hợp lệ.' });
  return { productType: input.productType.trim(), brand: input.brand.trim(), condition: code, min, max };
}

export class LocalReferenceData implements ReferenceDataGateway {
  private readonly auth: AuthService;
  private readonly repo: CoCoRepository;
  constructor(private readonly db: CoCoDatabase, private readonly getToken: () => string | null, private readonly conditions: ConditionCatalog = confirmedConditions) {
    this.auth = new AuthService(db); this.repo = new CoCoRepository(db);
  }
  subscribe(onChange: () => void) {
    // DB-only observer; do not put WebCrypto/session hashing inside liveQuery.
    const subscription = liveQuery(async () => Promise.all([
      this.db.khachHang.toArray(), this.db.khungGiaThuMua.toArray(), this.db.hoaDonBanHang.toArray(),
      this.db.hoaDonThuMua.toArray(), this.db.accountSecurity.toArray(), this.db.authSessions.toArray(),
      this.db.recordVersions.toArray(), this.db.appMetadata.toArray(),
      this.db.sanPham.toArray(), this.db.discountApplications.toArray(),
      this.db.table('purchaseDrafts').toArray(), this.db.table('purchaseLines').toArray(), this.db.table('purchaseApprovals').toArray(), this.db.table('purchaseNotices').toArray(),
    ])).subscribe({ next: onChange, error: onChange });
    return () => subscription.unsubscribe();
  }
  private token() { return this.getToken() ?? ''; }
  private read<T>(permission: Permission, query: () => Promise<T>) { return this.auth.readAuthorized(this.token(), permission, query); }
  private async required<N extends RecordName>(table: N, id: RecordKey<N>): Promise<Versioned<N>> {
    const result = await this.repo.get(table, id);
    if (!result) throw new DataServiceError('NOT_FOUND', 'Thông tin không còn tồn tại. Vui lòng tải lại.');
    return result;
  }
  private async write(permission: Permission, changes: Change[], validate?: () => Promise<void>) {
    try { await this.auth.commitAuthorized(this.token(), permission, { id: `reference:${crypto.randomUUID()}`, changes }, validate); }
    catch (error) {
      if (error instanceof RepositoryError && error.code === 'CONFLICT') throw new DataServiceError('CONFLICT', 'Dữ liệu đã thay đổi ở tab khác. Vui lòng tải lại trước khi lưu.');
      throw error;
    }
  }
  async customers(query: string, page: number, pageSize?: number) {
    const term = query.trim();
    return this.read('customers.read', async () => {
      const rows = term ? await this.db.khachHang.where('SoDienThoaiKH').startsWith(term).toArray() : await this.db.khachHang.toArray();
      rows.sort((a,b) => a.MaKH.localeCompare(b.MaKH));
      return paginate(await Promise.all(rows.map(row => this.required('khachHang', row.MaKH))), page, pageSize);
    });
  }
  customer(id: string) { return this.read('customers.read', () => this.required('khachHang', id)); }
  private async uniquePhone(phone: string, except?: string) {
    const other = await this.db.khachHang.where('SoDienThoaiKH').equals(phone).first();
    if (other && other.MaKH !== except) throw new DataServiceError('DUPLICATE', 'Số điện thoại bị trùng với khách hàng khác', { phone: 'Số điện thoại bị trùng với khách hàng khác' });
  }
  async createCustomer(input: CustomerInput) {
    const data = validateCustomer(input), id = `KH${randomHex(4)}`;
    await this.write('customers.create', [{ table: 'khachHang', kind: 'create', value: { MaKH: id, TenKH: data.name, SoDienThoaiKH: data.phone, DiemTichLuy: 0 } }], () => this.uniquePhone(data.phone));
    return id;
  }
  async updateCustomer(id: string, version: number, input: CustomerInput) {
    const data = validateCustomer(input), existing = await this.customer(id);
    await this.write('customers.update', [{ table: 'khachHang', kind: 'update', expectedVersion: version,
      value: { ...existing.record, TenKH: data.name, SoDienThoaiKH: data.phone } }], () => this.uniquePhone(data.phone, id));
  }
  async deleteCustomer(id: string, version: number, confirmed: boolean) {
    if (!confirmed) throw new DataServiceError('CONFIRMATION', 'Cần xác nhận trước khi xóa thông tin khách hàng.');
    const membership = await this.read('customers.delete', () => this.repo.get('memberships',id));
    const changes: Change[] = [{ table: 'khachHang', kind: 'delete', key: id, expectedVersion: version }];
    if (membership) changes.push({ table: 'memberships', kind: 'delete', key: id, expectedVersion: membership.version });
    await this.write('customers.delete', changes, async () => {
      if (await this.db.hoaDonThuMua.where('MaKH').equals(id).count() || await this.db.hoaDonBanHang.where('MaKH').equals(id).count()) {
        throw new DataServiceError('HAS_HISTORY', 'Không thể xóa khách hàng đã phát sinh giao dịch thu mua hoặc bán hàng');
      }
    });
  }
  history(id: string, kind: HistoryKind) {
    return this.read('customers.read', async () => {
      const customer = (await this.required('khachHang', id)).record;
      const rows = kind === 'purchases'
        ? await Promise.all((await this.db.hoaDonBanHang.where('MaKH').equals(id).toArray()).map(async raw => {
          const detail = await readSaleInvoice(this.db, raw);
          return { id: raw.MaHDBH, date: raw.NgayBan, statusCode: raw.TrangThai,
            statusLabel: detail.source === 'sales-invoice-v1' ? 'Hoàn tất' : 'Chưa xác định' };
        }))
        : await Promise.all((await this.db.hoaDonThuMua.where('MaKH').equals(id).toArray()).map(async raw => {
          const { invoice, statusLabel } = await purchaseHeader(this.db, raw);
          return { id: invoice.MaHDTM, date: invoice.NgayThuMua, statusCode: invoice.TrangThai, statusLabel };
        }));
      rows.sort((a,b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
      return { customer, rows };
    });
  }
  invoice(customerId: string, kind: HistoryKind, invoiceId: string) {
    return this.read('customers.read', async () => {
      const customer = (await this.required('khachHang', customerId)).record;
      if (kind === 'purchases') {
        const { record: invoice } = await this.required('hoaDonBanHang', invoiceId);
        if (invoice.MaKH !== customerId) throw new DataServiceError('NOT_FOUND', 'Hóa đơn không thuộc hồ sơ khách hàng này.');
        const detail = await readSaleInvoice(this.db, invoice);
        return { id: invoice.MaHDBH, date: invoice.NgayBan, statusCode: invoice.TrangThai,
          statusLabel: detail.source === 'sales-invoice-v1' ? 'Hoàn tất' : 'Chưa xác định',
          source: detail.source === 'sales-invoice-v1' ? 'sales-invoice-v1' as const : 'legacy' as const,
          customer: { ...customer, TenKH: detail.customer.name, SoDienThoaiKH: detail.customer.phone },
          total: detail.total, subtotal: detail.subtotal, discount: detail.discount, paymentCode: invoice.PTTT,
          paymentLabel: detail.paymentLabel, customerPoints: detail.customer.points, lines: detail.lines };
      }
      return purchaseInvoice(this.db, invoiceId, customerId);
    });
  }
  private async withLabel(row: Versioned<'khungGiaThuMua'>): Promise<Bracket> {
    const tagged = (await this.db.appMetadata.get(conditionMetadataKey(row.record.MaKhungGia)))?.value === CONDITION_CATALOG_VERSION;
    return { ...row, conditionLabel: tagged ? conditionLabel(row.record.TinhTrang) ?? 'Chưa phân loại' : `Chưa đối chiếu (mã ${row.record.TinhTrang})` };
  }
  private async ensureCompatibleConditions() {
    for (const row of await this.db.khungGiaThuMua.toArray()) {
      if ((await this.db.appMetadata.get(conditionMetadataKey(row.MaKhungGia)))?.value !== CONDITION_CATALOG_VERSION || !conditionLabel(row.TinhTrang)) {
        throw new DataServiceError('CONDITION_MAPPING', 'Dữ liệu khung giá cũ có độ mới chưa được đối chiếu. Cần xác nhận ý nghĩa mã cũ trước khi thay đổi.');
      }
    }
  }
  brackets(page: number, condition?: number, pageSize?: number) { return this.read('price-brackets.read', async () => {
    if (condition !== undefined && !conditionLabel(condition)) throw new DataServiceError('VALIDATION', 'Độ mới không hợp lệ.');
    const rows = await Promise.all((await this.repo.list('khungGiaThuMua')).sort((a,b)=>a.record.MaKhungGia.localeCompare(b.record.MaKhungGia)).map(r=>this.withLabel(r)));
    return paginate(condition === undefined ? rows : rows.filter(row => row.record.TinhTrang === condition && row.conditionLabel === conditionLabel(condition)),page,pageSize);
  }); }
  bracket(id: string) { return this.read('price-brackets.read', async () => this.withLabel(await this.required('khungGiaThuMua', id))); }
  private async uniqueBracket(record: RecordMap['khungGiaThuMua'], except?: string) {
    const other = await this.db.khungGiaThuMua.where('[LoaiSanPham+ThuongHieu+TinhTrang]').equals([record.LoaiSanPham,record.ThuongHieu,record.TinhTrang]).first();
    if (other && other.MaKhungGia !== except) throw new DataServiceError('DUPLICATE', 'Khung giá đã tồn tại');
  }
  async createBracket(input: BracketInput) {
    const user = await this.auth.readAuthorized(this.token(), 'price-brackets.create', async user => user);
    const data = validateBracket(input, this.conditions), id = `KG${randomHex(4)}`;
    const record = { MaKhungGia: id, LoaiSanPham: data.productType, ThuongHieu: data.brand, TinhTrang: data.condition, GiaMin: data.min, GiaMax: data.max, MaNV: user.employeeId };
    await this.write('price-brackets.create', [{ table: 'khungGiaThuMua', kind: 'create', value: record }], async () => {
      await this.ensureCompatibleConditions(); await this.uniqueBracket(record);
      await this.db.appMetadata.put({ key: conditionMetadataKey(id), value: CONDITION_CATALOG_VERSION });
    });
    return id;
  }
  async updateBracket(id: string, version: number, input: BracketInput) {
    const existing = await this.bracket(id), data = validateBracket(input, this.conditions);
    const record = { ...existing.record, LoaiSanPham: data.productType, ThuongHieu: data.brand, TinhTrang: data.condition, GiaMin: data.min, GiaMax: data.max };
    await this.write('price-brackets.update', [{ table: 'khungGiaThuMua', kind: 'update', expectedVersion: version, value: record }], async () => { await this.ensureCompatibleConditions(); await this.uniqueBracket(record, id); });
  }
}

