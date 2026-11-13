import type { CoCoDatabase } from '../db/schema';
import { entitySchemas, metadataSchemas, calendarDate } from '../domain/records';
import { AuthService } from './auth/service';
import { readCandidatePurchase } from './purchase-candidate';
import { statusMappingSchema } from './purchase-finalization';
import { CONDITION_CATALOG_VERSION, conditionMetadataKey, conditionLabel } from '../domain/conditions';
import { RepositoryError } from '../repositories/errors';
import { paginate } from '../domain/pagination';
import { validateReferences } from '../repositories/constraints';
import { z } from 'zod';
import { inventoryAttributesKey, inventoryAttributesSchema, cycleKey, cycleSchema, vietnamDay, daysBetween } from '../domain/inventory';
import { recordVersionKey } from '../repositories';
import { canonical } from '../repositories/purchase-links';
import { sha256 } from './auth/crypto';

export const inventoryFilters = { query: '', type: '', brand: '', date: '' };
export type InventoryFilters = typeof inventoryFilters;
export interface InventoryItem {
  id: string; name: string; type: string; brand: string; condition: string;
  price: number; enteredOn: string; days: number; status: 'available' | 'sold' | 'legacy';
  statusLabel: string; originalPrice?: number; discount?: 30 | 45;
  version: number; conditionCode?: 1 | 2 | 3;
}
export interface InventoryEdit {
  operationId: string; id: string; expectedVersion: number; name: string; type: string; brand: string;
  condition: number; price: string; enteredOn: string; status: InventoryItem['status'];
}
export class InventoryInputError extends Error {
  constructor(message: string, public fields: Record<string, string> = {}) { super(message); }
}
export const vietnamDate = vietnamDay;
export function stockDays(enteredOn: string, now: Date) {
  return daysBetween(enteredOn, vietnamDay(now));
}
const invalid = () => new RepositoryError('REFERENCE', 'Dữ liệu hàng hóa không nhất quán');

/** Authenticated inventory queries and atomic edits. Scheduling lives separately. */
export class InventoryService {
  private readonly auth: AuthService;
  constructor(private readonly db: CoCoDatabase, private readonly token: () => string | null, private readonly now = () => new Date()) {
    this.auth = new AuthService(db);
  }
  private async project(raw: unknown, now: Date, purchases = new Map<string, ReturnType<typeof readCandidatePurchase>>()): Promise<InventoryItem> {
    const product = entitySchemas.sanPham.parse(raw);
    const bracket = entitySchemas.khungGiaThuMua.parse(await this.db.khungGiaThuMua.get(product.MaKhungGia));
    if (!purchases.has(product.MaHDTM)) purchases.set(product.MaHDTM, readCandidatePurchase(this.db, product.MaHDTM));
    const purchase = await purchases.get(product.MaHDTM);
    if (!purchase) throw invalid();
    let type = bracket.LoaiSanPham, brand = bracket.ThuongHieu;
    const tagged = (await this.db.appMetadata.get(conditionMetadataKey(bracket.MaKhungGia)))?.value === CONDITION_CATALOG_VERSION;
    let condition = tagged ? conditionLabel(bracket.TinhTrang) : undefined;
    let status: InventoryItem['status'] = 'legacy';
    if (purchase.source === 'purchase-lines-v1') {
      const origin = await this.db.table('purchaseProvenance').get(product.MaSP);
      const line = purchase.lines.find(row => row.id === origin?.lineId);
      if (!line) throw invalid();
      type = line.bracket.type; brand = line.bracket.brand; condition = conditionLabel(line.bracket.condition);
    }
    const mapping = await this.db.appMetadata.get(`purchase-status-mapping:${product.MaHDTM}`);
    if (mapping) {
      const codes = statusMappingSchema.parse(JSON.parse(mapping.value));
      if (product.TrangThai === codes.productAvailable) status = 'available';
      else if (product.TrangThai === codes.productSold) status = 'sold';
      else throw invalid();
    }
    const attributes = await this.db.appMetadata.get(inventoryAttributesKey(product.MaSP));
    let conditionCode = condition ? ([1, 2, 3] as const).find(code => conditionLabel(code) === condition) : undefined;
    if (attributes) {
      const current = inventoryAttributesSchema.parse(JSON.parse(attributes.value));
      if (current.productId !== product.MaSP) throw invalid();
      type = current.type; brand = current.brand; conditionCode = current.condition; condition = conditionLabel(current.condition);
    }
    const applications = (await this.db.discountApplications.where('MaSP').equals(product.MaSP).toArray())
      .map(row => metadataSchemas.discountApplications.parse(row))
      .filter(row => row.cycleStartedOn === product.NgayBatDauChuKyGiam)
      .sort((a, b) => b.milestone - a.milestone);
    const applied = applications[0];
    if (applied && applied.priceAfter !== product.GiaBanHienHanh) throw invalid();
    return { id: product.MaSP, name: product.TenSP, type, brand, condition: condition ?? `Chưa đối chiếu (mã ${bracket.TinhTrang})`, conditionCode,
      version: (await this.db.recordVersions.get(recordVersionKey('sanPham', product.MaSP)))?.version ?? 0,
      price: product.GiaBanHienHanh, enteredOn: product.NgayNhapKho, days: stockDays(product.NgayNhapKho, now), status,
      statusLabel: status === 'available' ? 'Còn hàng' : status === 'sold' ? 'Đã bán' : 'Chưa xác định',
      ...(applied ? { discount: applied.milestone, originalPrice: product.GiaGocChuKyGiam } : {}) };
  }
  list(filters: InventoryFilters, page: number, pageSize?: number) {
    return this.auth.readAuthorized(this.token() ?? '', 'inventory.read', async () => {
      if (filters.date) calendarDate.parse(filters.date);
      await validateReferences(this.db);
      const now = this.now(), rows = [], purchases = new Map<string, ReturnType<typeof readCandidatePurchase>>();
      for (const row of await this.db.sanPham.toArray()) rows.push(await this.project(row, now, purchases));
      const fold = (value: string) => value.trim().toLocaleLowerCase('vi');
      const query = fold(filters.query);
      const filtered = rows.filter(row => (fold(row.id).includes(query) || fold(row.name).includes(query)) &&
        (!filters.type || row.type === filters.type) && (!filters.brand || row.brand === filters.brand) && (!filters.date || row.enteredOn === filters.date));
      filtered.sort((a, b) => b.enteredOn.localeCompare(a.enteredOn) || a.id.localeCompare(b.id));
      return { ...paginate(filtered, page, pageSize), types: [...new Set(rows.map(row => row.type))].sort(), brands: [...new Set(rows.map(row => row.brand))].sort() };
    });
  }
  item(id: string) {
    return this.auth.readAuthorized(this.token() ?? '', 'inventory.read', () => this.projectFromId(id));
  }
  private async projectFromId(id: string) { await validateReferences(this.db); return this.project(await this.db.sanPham.get(id), this.now()); }
  async update(command: InventoryEdit) {
    const input = structuredClone(command), fields: Record<string, string> = {};
    for (const field of ['name', 'type', 'brand'] as const) {
      if (!input[field]?.trim()) fields[field] = 'Không được bỏ trống trường dữ liệu';
      else if (input[field].trim().length > 50) fields[field] = 'Không được vượt quá 50 ký tự';
    }
    if (![1, 2, 3].includes(input.condition)) fields.condition = 'Không được bỏ trống trường dữ liệu';
    if (!/^\d+$/.test(input.price) || !Number.isSafeInteger(Number(input.price)) || Number(input.price) <= 0) fields.price = 'Giá bán không được bé hơn hoặc bằng 0';
    if (Object.keys(fields).length) throw new InventoryInputError('Dữ liệu không hợp lệ', fields);
    z.object({ operationId: z.string().min(1).max(150), id: z.string().min(1).max(50), expectedVersion: z.number().int().nonnegative() }).parse(input);
    const fingerprint = await sha256(canonical(input));
    const guard = await this.auth.prepareTransactionGuard(this.token() ?? '', 'inventory.update');
    return this.db.transaction('rw', this.db.tables, async () => {
      const actor = await guard(), receiptId = `inventory-edit:${input.operationId}`;
      const receipt = await this.db.operations.get(receiptId);
      if (receipt) {
        if (receipt.fingerprint !== fingerprint) throw new RepositoryError('OPERATION_REUSED', 'Dữ liệu đã thay đổi');
        return { duplicate: true };
      }
      const current = await this.projectFromId(input.id);
      if (current.version !== input.expectedVersion || current.status !== 'available') throw new RepositoryError('CONFLICT', 'Dữ liệu đã thay đổi');
      if (input.enteredOn !== current.enteredOn || input.status !== current.status) throw new InventoryInputError('Dữ liệu cố định không được thay đổi');
      const product = entitySchemas.sanPham.parse(await this.db.sanPham.get(input.id));
      const now = this.now(), at = now.toISOString(), price = Number(input.price);
      const next = { ...product, TenSP: input.name.trim(), GiaBanHienHanh: price,
        ...(price !== product.GiaBanHienHanh ? { GiaGocChuKyGiam: price, NgayBatDauChuKyGiam: vietnamDate(now) } : {}) };
      await this.db.sanPham.put(entitySchemas.sanPham.parse(next));
      await this.db.appMetadata.put({ key: inventoryAttributesKey(input.id), value: JSON.stringify(inventoryAttributesSchema.parse({
        format: 'inventory-attributes-v1', productId: input.id, type: input.type.trim(), brand: input.brand.trim(), condition: input.condition, updatedAt: at,
      })) });
      if (price !== product.GiaBanHienHanh) await this.db.appMetadata.put({ key: cycleKey(input.id), value: JSON.stringify(cycleSchema.parse({ productId: input.id, startedOn: next.NgayBatDauChuKyGiam, resetAt: at })) });
      await this.db.recordVersions.put({ key: recordVersionKey('sanPham', input.id), version: current.version + 1, updatedAt: at });
      await validateReferences(this.db);
      await this.db.operations.add({ id: receiptId, fingerprint, executedAt: at });
      await this.db.auditEntries.add({ id: receiptId, actor: actor.username, executedAt: at, changed: [recordVersionKey('sanPham', input.id), inventoryAttributesKey(input.id), ...(price !== product.GiaBanHienHanh ? [cycleKey(input.id)] : [])] });
      return { duplicate: false };
    });
  }
}
