import { z } from 'zod';
import Dexie from 'dexie';
import type { CoCoDatabase } from '../db/schema';
import { COCO_DATABASE_NAME, COCO_SCHEMA_VERSION } from '../db/schema';
import { timestamp } from '../domain/records';

export const LOCAL_BACKUP_FORMAT = 'coco-local-backup-v1' as const;
export const CLOUD_IMPORT_FORMAT = 'coco-cloud-import-v1' as const;
/** Dependencies are sent in this order; the server validates the entire graph in one transaction. */
export const IMPORT_STORE_ORDER = [
  'nhanVien', 'taiKhoan', 'khachHang', 'khungGiaThuMua', 'hoaDonThuMua',
  'yeuCauPheDuyetGia', 'chiTietHoaDonTM', 'sanPham', 'hoaDonBanHang', 'chiTietHoaDonBH',
  'memberships', 'productCosts', 'discountApplications', 'notifications', 'purchaseDrafts',
  'purchaseLines', 'purchaseApprovals', 'purchaseNotices', 'purchaseFinalizations',
  'purchaseProvenance', 'appMetadata', 'recordVersions', 'operations', 'auditEntries', 'issuedIdentifiers',
] as const;
const privateStores = ['accountSecurity', 'authSessions'] as const;
const allowedStores = new Set<string>([...IMPORT_STORE_ORDER, ...privateStores]);
const rowsSchema = z.array(z.record(z.string(), z.unknown()));
const localBackupSchema = z.object({
  format: z.literal(LOCAL_BACKUP_FORMAT), database: z.literal(COCO_DATABASE_NAME),
  schemaVersion: z.number().int().min(1).max(COCO_SCHEMA_VERSION), exportedAt: timestamp,
  stores: z.record(z.string(), rowsSchema), sha256: z.string().regex(/^[a-f0-9]{64}$/),
}).strict();
export type LocalBackup = z.infer<typeof localBackupSchema>;
export interface CloudImportPayload {
  format: typeof CLOUD_IMPORT_FORMAT; sourceSchemaVersion: number; exportedAt: string; sourceDigest: string;
  stores: Record<string, Record<string, unknown>[]>;
}
export interface ImportExclusion { store: string; count: number; reason: string }
export interface ImportCount { store: string; expected: number; inserted: number; existing: number; errors: string[] }
export interface ImportResult { batchId: string; status: 'committed' | 'replayed'; counts: ImportCount[] }
export interface CloudImportClient {
  rpc(name: 'coco_import', args: { p_backup: CloudImportPayload; p_idempotency_key: string }):
    PromiseLike<{ data: unknown; error: { message: string } | null }>;
}
const countSchema = z.object({ store: z.string(), expected: z.number().int().nonnegative(), inserted: z.number().int().nonnegative(),
  existing: z.number().int().nonnegative(), errors: z.array(z.string()) });
const resultSchema = z.object({ batchId: z.string().min(1), status: z.enum(['committed', 'replayed']), counts: z.array(countSchema) });

function canonical(value: unknown): string {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    return `{${Object.entries(value).filter(([, v]) => v !== undefined).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
      .map(([key, v]) => `${JSON.stringify(key)}:${canonical(v)}`).join(',')}}`;
  }
  throw new Error('Backup chứa kiểu dữ liệu không hỗ trợ JSON; chưa xuất hoặc nhập dữ liệu.');
}
async function digest(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(canonical(value));
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash), part => part.toString(16).padStart(2, '0')).join('');
}
const contentOf = (backup: LocalBackup) => ({ format: backup.format, database: backup.database,
  schemaVersion: backup.schemaVersion, exportedAt: backup.exportedAt, stores: backup.stores });

/** Read-only, consistent snapshot. Never opens a write transaction or deletes any local store. */
export async function exportLocalBackup(database: CoCoDatabase, now = () => new Date().toISOString()): Promise<LocalBackup> {
  // Opening the declared v4 class could upgrade an older local DB before its backup.
  // Dynamic mode inspects the existing schema and cannot create a missing database.
  const source = database.isOpen() ? database : new Dexie(database.name);
  try {
    await source.open();
    const stores = await source.transaction('r', source.tables, async () => {
      const entries = await Promise.all(source.tables.map(async table => [table.name, await table.toArray()] as const));
      return Object.fromEntries(entries) as LocalBackup['stores'];
    });
    const content = { format: LOCAL_BACKUP_FORMAT, database: COCO_DATABASE_NAME, schemaVersion: source.verno, exportedAt: now(), stores };
    return localBackupSchema.parse({ ...content, sha256: await digest(content) });
  } finally { if (source !== database) source.close(); }
}

/** Integrity detects accidental changes, not authenticity: SQL validates every record and relationship again. */
export async function parseLocalBackup(text: string): Promise<LocalBackup> {
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { throw new Error('File backup không phải JSON hợp lệ.'); }
  const parsed = localBackupSchema.safeParse(raw);
  if (!parsed.success) throw new Error('Định dạng hoặc phiên bản backup không được hỗ trợ.');
  const backup = parsed.data;
  for (const name of Object.keys(backup.stores)) if (!allowedStores.has(name)) throw new Error(`Store chưa được đối chiếu: ${name}.`);
  if (await digest(contentOf(backup)) !== backup.sha256) throw new Error('Hash backup không khớp; không nhập dữ liệu đã thay đổi hoặc hỏng.');
  return backup;
}

function containsCredentials(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsCredentials);
  if (value && typeof value === 'object') return Object.entries(value).some(([key, item]) =>
    /^(password|passwordHash|passwordSalt|MatKhau|tokenHash|access_token|refresh_token|service_role)$/i.test(key) || containsCredentials(item));
  if (typeof value === 'string' && ['[', '{'].includes(value.trim()[0])) {
    try { return containsCredentials(JSON.parse(value)); } catch { return false; }
  }
  return false;
}

export function prepareCloudImport(backup: LocalBackup): { payload: CloudImportPayload; excluded: ImportExclusion[] } {
  const stores: CloudImportPayload['stores'] = {}, excluded: ImportExclusion[] = [];
  for (const store of privateStores) {
    const count = backup.stores[store]?.length ?? 0;
    if (count) excluded.push({ store, count, reason: 'Chỉ giữ trong backup riêng tư; tài khoản và phiên Supabase được cấp lại ở server.' });
  }
  for (const store of IMPORT_STORE_ORDER) {
    const source = backup.stores[store]; if (!source) continue;
    const rows = store === 'appMetadata' ? source.filter(row => !String(row.key).startsWith('auth:') && row.key !== 'discount-lock') : source;
    if (rows.length !== source.length) excluded.push({ store, count: source.length - rows.length, reason: 'Marker phiên/khóa thực thi local không được kích hoạt trong cloud.' });
    if (containsCredentials(rows)) throw new Error(`Store ${store} chứa thông tin xác thực; cần đối chiếu trước khi nhập.`);
    stores[store] = structuredClone(rows);
  }
  return { payload: { format: CLOUD_IMPORT_FORMAT, sourceSchemaVersion: backup.schemaVersion, exportedAt: backup.exportedAt,
    sourceDigest: backup.sha256, stores }, excluded };
}

/** Server RLS/RPC checks the real owner role. Matching backup uses the same retry key. */
export async function importCloudBackup(client: CloudImportClient, raw: string, online = () => navigator.onLine): Promise<{ result: ImportResult; excluded: ImportExclusion[] }> {
  if (!online()) throw new Error('Đang mất mạng; chưa gửi dữ liệu lên Supabase.');
  const backup = await parseLocalBackup(raw), prepared = prepareCloudImport(backup);
  const { data, error } = await client.rpc('coco_import', { p_backup: prepared.payload, p_idempotency_key: `import:${backup.sha256}` });
  if (error) throw new Error(`Không nhập dữ liệu: ${error.message}`);
  const parsed = resultSchema.safeParse(data);
  if (!parsed.success) throw new Error('Server chưa trả đủ bằng chứng đối soát; không thể báo nhập thành công.');
  const result = parsed.data, expected = Object.entries(prepared.payload.stores);
  if (result.counts.length !== expected.length || new Set(result.counts.map(row => row.store)).size !== expected.length ||
    expected.some(([store, rows]) => !result.counts.some(row => row.store === store && row.expected === rows.length &&
      row.inserted + row.existing === rows.length && !row.errors.length))) {
    throw new Error('Số lượng đối soát từ server không khớp backup; cần kiểm tra trước khi tiếp tục.');
  }
  return { result, excluded: prepared.excluded };
}

export function downloadLocalBackup(backup: LocalBackup): void {
  const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }));
  const anchor = document.createElement('a'); anchor.href = url;
  anchor.download = `CoCo-private-backup-${backup.exportedAt.slice(0, 10)}.json`; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
