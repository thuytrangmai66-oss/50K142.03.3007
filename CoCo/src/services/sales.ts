import { z } from 'zod';
import type { CoCoDatabase } from '../db/schema';
import { entitySchemas, identifier, metadataSchemas, money } from '../domain/records';
import { SALES_DRAFT_FORMAT, salesDraftSchema, salesLineSchema, salesSubtotal, type SalesDraft, type SalesLine } from '../domain/sales';
import { AuthService } from './auth/service';
import { AuthError } from './auth/errors';
import { randomHex, sha256 } from './auth/crypto';
import { RepositoryError } from '../repositories/constraints';
import { recordVersionKey } from '../repositories';
import { canonical } from '../repositories/purchase-links';
import { statusMappingSchema } from './purchase-finalization';

const draftKey = (id: string) => `sales-draft:${id}`;
const revision = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const addCommandSchema = z.object({
  operationId: z.string().trim().min(1).max(150),
  draftId: identifier,
  expectedRevision: revision,
  productId: identifier,
  expectedProductVersion: revision,
}).strict();
const editCommandSchema = z.object({
  operationId: z.string().trim().min(1).max(150),
  draftId: identifier,
  expectedRevision: revision,
  productId: identifier,
}).strict();
const cancelCommandSchema = z.object({
  operationId: z.string().trim().min(1).max(150),
  draftId: identifier,
  expectedRevision: revision,
}).strict();
const membershipCommandSchema = z.object({
  operationId: z.string().trim().min(1).max(150),
  customerId: identifier,
  consent: z.literal(true),
}).strict();

export class SalesDraftError extends Error {
  constructor(message: string, public readonly fields: Partial<Record<'productId', string>> = {}) {
    super(message);
    this.name = 'SalesDraftError';
  }
}

export interface SalesProductSnapshot {
  id: string;
  name: string;
  unitPrice: number;
  version: number;
}

export interface SalesDraftBundle {
  draft: SalesDraft;
  lines: SalesLine[];
}

export interface SalesCustomerMembership {
  customerId: string;
  name: string;
  phone: string;
  isMember: boolean;
  pointsBalance: number;
}

function readDraft(value: string): SalesDraft {
  let parsedValue: unknown;
  try {
    parsedValue = JSON.parse(value);
  } catch {
    throw new RepositoryError('REFERENCE', 'Dữ liệu bản nháp bán hàng không hợp lệ');
  }
  const parsed = salesDraftSchema.safeParse(parsedValue);
  if (!parsed.success) throw new RepositoryError('REFERENCE', 'Dữ liệu bản nháp bán hàng không hợp lệ');
  return parsed.data;
}

export class SalesDraftService {
  private readonly auth: AuthService;

  constructor(private readonly db: CoCoDatabase, private readonly token: () => string | null, private readonly now = () => new Date()) {
    this.auth = new AuthService(db);
  }

  prepareDraft(): Promise<SalesDraftBundle> {
    return this.auth.readAuthorized(this.token() ?? '', 'sales.create', async actor => {
      for (let attempt = 0; attempt < 16; attempt++) {
        const id = `D${randomHex(4)}`;
        if (await this.db.appMetadata.get(draftKey(id))) continue;
        const createdAt = this.now().toISOString();
        return { draft: salesDraftSchema.parse({
          id, format: SALES_DRAFT_FORMAT, employeeId: actor.employeeId, createdBy: actor.username,
          status: 'editing', revision: 0, createdAt, updatedAt: createdAt, lines: [],
        }), lines: [] };
      }
      throw new RepositoryError('DUPLICATE', 'Không thể tạo mã bản nháp, vui lòng thử lại');
    });
  }

  load(id: string): Promise<SalesDraftBundle> {
    return this.auth.readAuthorized(this.token() ?? '', 'sales.create', async actor => {
      const metadata = await this.db.appMetadata.get(draftKey(id));
      if (!metadata) throw new SalesDraftError('Không tìm thấy bản nháp bán hàng');
      const draft = readDraft(metadata.value);
      if (draft.employeeId !== actor.employeeId) throw new AuthError('FORBIDDEN');
      return { draft, lines: draft.lines };
    });
  }

  lookupProduct(productId: string): Promise<SalesProductSnapshot> {
    const id = productId.trim();
    if (!id) throw new SalesDraftError('Hãy nhập mã sản phẩm', { productId: 'Hãy nhập mã sản phẩm' });
    if (!identifier.safeParse(id).success) throw new SalesDraftError('Mã sản phẩm không hợp lệ', { productId: 'Mã sản phẩm không hợp lệ' });
    return this.auth.readAuthorized(this.token() ?? '', 'sales.create', async () => this.availableProduct(id));
  }

  customerMembership(customerId: string): Promise<SalesCustomerMembership> {
    const id = identifier.parse(customerId);
    return this.auth.readAuthorized(this.token() ?? '', 'sales.create', async () => {
      const customer = entitySchemas.khachHang.safeParse(await this.db.khachHang.get(id));
      if (!customer.success) throw new SalesDraftError('Không tìm thấy khách hàng');
      const membership = await this.db.memberships.get(id);
      if (membership && !metadataSchemas.memberships.safeParse(membership).success) {
        throw new RepositoryError('REFERENCE', 'Dữ liệu đăng ký thành viên không hợp lệ');
      }
      return {
        customerId: customer.data.MaKH,
        name: customer.data.TenKH,
        phone: customer.data.SoDienThoaiKH,
        isMember: Boolean(membership),
        pointsBalance: customer.data.DiemTichLuy,
      };
    });
  }

  async registerMembership(input: z.input<typeof membershipCommandSchema>): Promise<SalesCustomerMembership> {
    const command = membershipCommandSchema.parse(input);
    const token = this.token() ?? '';
    const actor = await this.auth.readAuthorized(token, 'sales.create', async current => current);
    const current = await this.customerMembership(command.customerId);
    if (current.isMember) return current;

    const registeredAt = this.now().toISOString();
    try {
      await this.auth.commitAuthorized(token, 'sales.create', {
        id: `sales-membership:${command.operationId}`,
        changes: [{
          table: 'memberships',
          kind: 'create',
          value: { MaKH: command.customerId, registeredAt, registeredBy: actor.username },
        }],
      }, async currentActor => {
        if (currentActor.username !== actor.username) throw new AuthError('AUTH_REQUIRED');
        if (!entitySchemas.khachHang.safeParse(await this.db.khachHang.get(command.customerId)).success) {
          throw new SalesDraftError('Không tìm thấy khách hàng');
        }
        if (await this.db.memberships.get(command.customerId)) {
          throw new RepositoryError('CONFLICT', 'Khách hàng đã đăng ký thành viên ở tab khác');
        }
      });
    } catch (cause) {
      if (!(cause instanceof RepositoryError) || cause.code !== 'CONFLICT') throw cause;
      const latest = await this.customerMembership(command.customerId);
      if (!latest.isMember) throw cause;
      return latest;
    }

    return this.customerMembership(command.customerId);
  }

  async addProduct(input: z.input<typeof addCommandSchema>): Promise<SalesDraftBundle> {
    const command = addCommandSchema.parse(input);
    const fingerprint = await sha256(canonical(command));
    const guard = await this.auth.prepareTransactionGuard(this.token() ?? '', 'sales.create');
    return this.db.transaction('rw', this.db.tables, async () => {
      const actor = await guard(), receiptId = `sales-cart:${command.operationId}`;
      const receipt = await this.db.operations.get(receiptId);
      if (receipt) {
        if (receipt.fingerprint !== fingerprint) throw new RepositoryError('OPERATION_REUSED', 'Dữ liệu thao tác đã thay đổi');
        const existing = await this.db.appMetadata.get(draftKey(command.draftId));
        if (!existing) throw new RepositoryError('REFERENCE', 'Không tìm thấy kết quả bản nháp');
        const draft = readDraft(existing.value);
        if (draft.employeeId !== actor.employeeId) throw new AuthError('FORBIDDEN');
        return { draft, lines: draft.lines };
      }

      const now = this.now().toISOString();
      const metadata = await this.db.appMetadata.get(draftKey(command.draftId));
      const current = metadata ? readDraft(metadata.value) : salesDraftSchema.parse({
        id: command.draftId, format: SALES_DRAFT_FORMAT, employeeId: actor.employeeId, createdBy: actor.username,
        status: 'editing', revision: 0, createdAt: now, updatedAt: now, lines: [],
      });
      this.assertEditable(current, actor.employeeId, command.expectedRevision);
      if (current.lines.some(line => line.productId === command.productId)) throw new SalesDraftError('Sản phẩm đã có trong giỏ hàng');

      const product = await this.availableProduct(command.productId, command.expectedProductVersion);
      const row = entitySchemas.sanPham.parse(await this.db.sanPham.get(product.id));
      const line = salesLineSchema.parse({
        productId: product.id, sourcePurchaseId: row.MaHDTM, name: product.name, quantity: 1,
        unitPrice: product.unitPrice, lineTotal: product.unitPrice, productVersion: product.version, selectedAt: now,
      });
      const draft = salesDraftSchema.parse({ ...current, revision: current.revision + 1, updatedAt: now, lines: [...current.lines, line] });
      salesSubtotal(draft.lines);
      await this.db.appMetadata.put({ key: draftKey(draft.id), value: JSON.stringify(draft) });
      await this.db.operations.add({ id: receiptId, fingerprint, executedAt: now });
      await this.db.auditEntries.add({ id: receiptId, actor: actor.username, executedAt: now, changed: [draftKey(draft.id)] });
      return { draft, lines: draft.lines };
    });
  }

  async removeProduct(input: z.input<typeof editCommandSchema>): Promise<SalesDraftBundle> {
    const command = editCommandSchema.parse(input);
    const fingerprint = await sha256(canonical(command));
    const guard = await this.auth.prepareTransactionGuard(this.token() ?? '', 'sales.create');
    return this.db.transaction('rw', this.db.tables, async () => {
      const actor = await guard(), receiptId = `sales-cart:${command.operationId}`;
      const receipt = await this.db.operations.get(receiptId);
      if (receipt) {
        if (receipt.fingerprint !== fingerprint) throw new RepositoryError('OPERATION_REUSED', 'Dữ liệu thao tác đã thay đổi');
        const existing = await this.db.appMetadata.get(draftKey(command.draftId));
        if (!existing) throw new RepositoryError('REFERENCE', 'Không tìm thấy kết quả bản nháp');
        const draft = readDraft(existing.value);
        if (draft.employeeId !== actor.employeeId) throw new AuthError('FORBIDDEN');
        return { draft, lines: draft.lines };
      }

      const metadata = await this.db.appMetadata.get(draftKey(command.draftId));
      if (!metadata) throw new SalesDraftError('Không tìm thấy bản nháp bán hàng');
      const current = readDraft(metadata.value);
      this.assertEditable(current, actor.employeeId, command.expectedRevision);
      const lines = current.lines.filter(line => line.productId !== command.productId);
      if (lines.length === current.lines.length) throw new RepositoryError('CONFLICT', 'Sản phẩm không còn trong giỏ hàng');
      const now = this.now().toISOString();
      const draft = salesDraftSchema.parse({ ...current, revision: current.revision + 1, updatedAt: now, lines });
      salesSubtotal(draft.lines);
      await this.db.appMetadata.put({ key: draftKey(draft.id), value: JSON.stringify(draft) });
      await this.db.operations.add({ id: receiptId, fingerprint, executedAt: now });
      await this.db.auditEntries.add({ id: receiptId, actor: actor.username, executedAt: now, changed: [draftKey(draft.id)] });
      return { draft, lines: draft.lines };
    });
  }

  validateDraft(draftId: string, expectedRevision: number): Promise<number> {
    const id = identifier.parse(draftId);
    revision.parse(expectedRevision);
    return this.auth.readAuthorized(this.token() ?? '', 'sales.create', async actor => {
      const metadata = await this.db.appMetadata.get(draftKey(id));
      if (!metadata) throw new SalesDraftError('Hãy thêm ít nhất một sản phẩm');
      const draft = readDraft(metadata.value);
      if (draft.employeeId !== actor.employeeId) throw new AuthError('FORBIDDEN');
      if (draft.revision !== expectedRevision || draft.status !== 'editing') throw new RepositoryError('CONFLICT', 'Giỏ hàng đã thay đổi ở tab khác. Vui lòng tải lại.');
      if (!draft.lines.length) throw new SalesDraftError('Hãy thêm ít nhất một sản phẩm');
      for (const line of draft.lines) {
        const product = await this.availableProduct(line.productId);
        const row = entitySchemas.sanPham.parse(await this.db.sanPham.get(line.productId));
        if (product.version !== line.productVersion || product.unitPrice !== line.unitPrice || row.MaHDTM !== line.sourcePurchaseId) {
          throw new RepositoryError('CONFLICT', `Sản phẩm ${line.productId} đã thay đổi trạng thái hoặc giá. Hãy xóa sản phẩm và thêm lại.`);
        }
      }
      return salesSubtotal(draft.lines);
    });
  }

  async cancelDraft(input: z.input<typeof cancelCommandSchema>): Promise<void> {
    const command = cancelCommandSchema.parse(input);
    const fingerprint = await sha256(canonical(command));
    const guard = await this.auth.prepareTransactionGuard(this.token() ?? '', 'sales.create');
    await this.db.transaction('rw', this.db.tables, async () => {
      const actor = await guard(), receiptId = `sales-cart:${command.operationId}`;
      const receipt = await this.db.operations.get(receiptId);
      if (receipt) {
        if (receipt.fingerprint !== fingerprint) throw new RepositoryError('OPERATION_REUSED', 'Dữ liệu thao tác đã thay đổi');
        return;
      }
      const metadata = await this.db.appMetadata.get(draftKey(command.draftId));
      if (!metadata && command.expectedRevision === 0) return;
      if (!metadata) throw new SalesDraftError('Không tìm thấy bản nháp bán hàng');
      const current = readDraft(metadata.value);
      this.assertEditable(current, actor.employeeId, command.expectedRevision);
      const now = this.now().toISOString();
      const draft = salesDraftSchema.parse({ ...current, status: 'cancelled', revision: current.revision + 1, updatedAt: now });
      await this.db.appMetadata.put({ key: draftKey(draft.id), value: JSON.stringify(draft) });
      await this.db.operations.add({ id: receiptId, fingerprint, executedAt: now });
      await this.db.auditEntries.add({ id: receiptId, actor: actor.username, executedAt: now, changed: [draftKey(draft.id)] });
    });
  }

  private assertEditable(draft: SalesDraft, employeeId: string, expectedRevision: number): void {
    if (draft.employeeId !== employeeId) throw new AuthError('FORBIDDEN');
    if (draft.revision !== expectedRevision || draft.status !== 'editing') {
      throw new RepositoryError('CONFLICT', 'Giỏ hàng đã thay đổi ở tab khác. Vui lòng tải lại.');
    }
  }

  private async availableProduct(productId: string, expectedVersion?: number): Promise<SalesProductSnapshot> {
    const row = await this.db.sanPham.get(productId);
    const parsedProduct = entitySchemas.sanPham.safeParse(row);
    if (!parsedProduct.success) throw new SalesDraftError('Không tìm thấy sản phẩm');
    const product = parsedProduct.data;
    const mapping = await this.db.appMetadata.get(`purchase-status-mapping:${product.MaHDTM}`);
    if (!mapping) throw new SalesDraftError('Không thể xác minh trạng thái bán của sản phẩm này');
    let mappingValue: unknown;
    try {
      mappingValue = JSON.parse(mapping.value);
    } catch {
      throw new RepositoryError('REFERENCE', 'Trạng thái sản phẩm không hợp lệ');
    }
    const parsedMapping = statusMappingSchema.safeParse(mappingValue);
    if (!parsedMapping.success) throw new RepositoryError('REFERENCE', 'Trạng thái sản phẩm không hợp lệ');
    if (product.TrangThai !== parsedMapping.data.productAvailable) throw new SalesDraftError('Sản phẩm không còn đủ điều kiện bán');
    const version = (await this.db.recordVersions.get(recordVersionKey('sanPham', productId)))?.version ?? 0;
    if (expectedVersion !== undefined && version !== expectedVersion) {
      throw new RepositoryError('CONFLICT', 'Sản phẩm đã thay đổi. Vui lòng kiểm tra lại trước khi thêm.');
    }
    if (!money.safeParse(product.GiaBanHienHanh).success || product.GiaBanHienHanh <= 0) {
      throw new SalesDraftError('Sản phẩm chưa có giá bán hợp lệ');
    }
    return { id: product.MaSP, name: product.TenSP, unitPrice: product.GiaBanHienHanh, version };
  }
}
