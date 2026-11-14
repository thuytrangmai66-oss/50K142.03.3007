import type { CoCoDatabase } from '../db/schema';
import {
  calendarDate, identifier, keyFields, recordKey, recordSchemas, timestamp,
  type RecordKey, type RecordMap, type RecordName,
} from '../domain/records';
import { RepositoryError, validateReferences } from './constraints';
export { RepositoryError } from './constraints';

type ChangeFor<N extends RecordName> =
  | { table: N; kind: 'create'; value: RecordMap[N] }
  | { table: N; kind: 'update'; value: RecordMap[N]; expectedVersion: number }
  | { table: N; kind: 'delete'; key: RecordKey<N>; expectedVersion: number };
export type Change = { [N in RecordName]: ChangeFor<N> }[RecordName];
export interface Command { id: string; actor?: string; changes: Change[] }
/** DB-only side effects share the command transaction and run only once. */
export type CommitEffect = (context: { id: string; actor?: string; executedAt: string }) => Promise<void>;
export interface Versioned<N extends RecordName> { record: RecordMap[N]; version: number }
interface PreparedChange {
  table: RecordName;
  kind: Change['kind'];
  key: RecordKey<RecordName>;
  value?: RecordMap[RecordName];
  expectedVersion?: number;
}

const referenceKey = (table: RecordName, key: RecordKey<RecordName>) => JSON.stringify([table, key]);
export { referenceKey as recordVersionKey };
const protectedIdentifiers: ReadonlySet<RecordName> = new Set(['sanPham', 'hoaDonThuMua', 'hoaDonBanHang']);

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value).filter(([, v]) => v !== undefined).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
      .map(([key, v]) => `${JSON.stringify(key)}:${stableJson(v)}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function parseKey(table: RecordName, key: RecordKey<RecordName>): RecordKey<RecordName> {
  const fields = keyFields[table];
  const values = Array.isArray(key) ? key : [key];
  if (values.length !== fields.length || (fields.length === 1 && Array.isArray(key))) {
    throw new RepositoryError('VALIDATION', 'Invalid primary key');
  }
  for (const [index, field] of fields.entries()) {
    const value = values[index];
    if (field === 'milestone') {
      if (value !== 30 && value !== 45) throw new RepositoryError('VALIDATION', 'Invalid milestone');
    } else if (field === 'cycleStartedOn') calendarDate.parse(value);
    else if (field === 'id') {
      if (typeof value !== 'string' || !value.length || value.length > 200) throw new RepositoryError('VALIDATION', 'Invalid id');
    } else identifier.parse(value);
  }
  return Array.isArray(key) ? [...key] as RecordKey<RecordName> : key;
}

function prepare(change: Change): PreparedChange {
  if (!change || !Object.hasOwn(recordSchemas, change.table) || !['create', 'update', 'delete'].includes(change.kind)) {
    throw new RepositoryError('VALIDATION', 'Unknown record or mutation');
  }
  if (change.kind !== 'create' && (!Number.isSafeInteger(change.expectedVersion) || change.expectedVersion < 1)) {
    throw new RepositoryError('VALIDATION', 'Expected version is required');
  }
  if (change.kind === 'delete') return { table: change.table, kind: change.kind, key: parseKey(change.table, change.key), expectedVersion: change.expectedVersion };
  const parsed = recordSchemas[change.table].safeParse(change.value);
  if (!parsed.success) throw new RepositoryError('VALIDATION', `Invalid record in ${change.table}: ${parsed.error.issues.map(i => i.path.join('.')).join(', ')}`);
  return { table: change.table, kind: change.kind, key: recordKey(change.table, parsed.data), value: parsed.data,
    ...(change.kind === 'update' ? { expectedVersion: change.expectedVersion } : {}) };
}

/** Data access only. Authenticated business services must authorize calls before
 * using this layer; no UI route currently exposes a write operation. */
export class CoCoRepository {
  constructor(private readonly db: CoCoDatabase, private readonly now = () => new Date().toISOString()) {}

  async get<N extends RecordName>(table: N, key: RecordKey<N>): Promise<Versioned<N> | undefined> {
    const validatedKey = parseKey(table, key) as RecordKey<N>;
    return this.db.transaction('r', [this.db.table(table), this.db.recordVersions], async () => {
      const record = await this.db.table<RecordMap[N], RecordKey<N>>(table).get(validatedKey);
      if (!record) return undefined;
      const version = await this.db.recordVersions.get(referenceKey(table, validatedKey));
      return { record, version: version?.version ?? 0 };
    });
  }

  async list<N extends RecordName>(table: N): Promise<Versioned<N>[]> {
    return this.db.transaction('r', [this.db.table(table), this.db.recordVersions], async () => {
      const records = await this.db.table<RecordMap[N], RecordKey<N>>(table).toArray();
      return Promise.all(records.map(async record => ({
        record, version: (await this.db.recordVersions.get(referenceKey(table, recordKey(table, record))))?.version ?? 0,
      })));
    });
  }

  async commit(command: Command, authorize?: () => Promise<{ username: string }>, effect?: CommitEffect): Promise<{ duplicate: boolean; executedAt: string }> {
    if (!command || typeof command.id !== 'string' || !command.id.trim() || command.id.length > 200 ||
      !Array.isArray(command.changes) || command.changes.length === 0) {
      throw new RepositoryError('VALIDATION', 'Command id and nonempty changes are required');
    }
    if (command.actor !== undefined) identifier.parse(command.actor);
    const id = command.id;
    const actor = command.actor;
    const changes = command.changes.map(prepare);
    const refs = changes.map(change => referenceKey(change.table, change.key));
    if (new Set(refs).size !== refs.length) throw new RepositoryError('VALIDATION', 'A record can only occur once in a command');
    // Hash outside IndexedDB transaction: Web Crypto is asynchronous non-DB work.
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(stableJson({ actor, changes })));
    const fingerprint = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');

    // Shared store scope serializes conflicting transactions across connections/tabs.
    return this.db.transaction('rw', this.db.tables, async () => {
      // A service guard runs in this same transaction, including on retries.
      // It may await IndexedDB work only; hashing is prepared before commit().
      const effectiveActor = authorize ? (await authorize()).username : actor;
      const receipt = await this.db.operations.get(id);
      if (receipt) {
        if (receipt.fingerprint !== fingerprint) throw new RepositoryError('OPERATION_REUSED', 'Command id has a different payload');
        return { duplicate: true, executedAt: receipt.executedAt };
      }
      const executedAt = timestamp.parse(this.now());
      for (const change of changes) {
        const table = this.db.table<RecordMap[RecordName], RecordKey<RecordName>>(change.table);
        const ref = referenceKey(change.table, change.key);
        const existing = await table.get(change.key);
        const version = (await this.db.recordVersions.get(ref))?.version ?? 0;
        if (change.kind === 'create') {
          if (existing || (protectedIdentifiers.has(change.table) && await this.db.issuedIdentifiers.get(ref))) {
            throw new RepositoryError('DUPLICATE', 'Identifier already exists or has been issued');
          }
        } else {
          if (!existing) throw new RepositoryError('NOT_FOUND', 'Record no longer exists');
          if (version !== change.expectedVersion) throw new RepositoryError('CONFLICT', 'Record changed since it was read');
          if (change.table === 'productCosts' || change.table === 'discountApplications' ||
            (change.kind === 'delete' && ['hoaDonThuMua', 'hoaDonBanHang'].includes(change.table))) {
            throw new RepositoryError('IMMUTABLE', 'Historical record cannot be replaced or deleted');
          }
          if (change.table === 'sanPham' && change.kind === 'update') {
            const before = existing as RecordMap['sanPham'];
            const after = change.value as RecordMap['sanPham'];
            if (before.NgayNhapKho !== after.NgayNhapKho || before.MaHDTM !== after.MaHDTM || before.MaKhungGia !== after.MaKhungGia) {
              throw new RepositoryError('IMMUTABLE', 'Product origin is immutable');
            }
          }
        }
        if (change.kind === 'delete') await table.delete(change.key);
        else await table.put(change.value!);
        if (protectedIdentifiers.has(change.table) && change.kind === 'create') {
          await this.db.issuedIdentifiers.add({ key: ref, issuedAt: executedAt });
        }
        // Retain versions on delete to prevent stale writes after delete/recreate.
        await this.db.recordVersions.put({ key: ref, version: version + 1, updatedAt: executedAt });
      }
      await validateReferences(this.db);
      if (effectiveActor && !await this.db.taiKhoan.get(effectiveActor)) throw new RepositoryError('REFERENCE', 'Audit actor does not exist');
      await this.db.operations.add({ id, fingerprint, executedAt });
      await this.db.auditEntries.add({ id, actor: effectiveActor, executedAt, changed: refs });
      await effect?.({ id, actor: effectiveActor, executedAt });
      return { duplicate: false, executedAt };
    });
  }
}
