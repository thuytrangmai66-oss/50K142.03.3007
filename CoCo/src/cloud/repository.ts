import type { CoCoDatabase } from '../db/schema';
import type { AuthUser } from '../domain/auth';
import { keyFields } from '../domain/records';
import { RepositoryError } from '../repositories/errors';
import { AuthError } from '../services/auth/errors';
import { hasPermission } from '../services/permissions';
import { CLOUD_READ_AUTHORIZER, type CloudReadAuthorizer, type CloudSnapshot } from './contracts';

type Row = Record<string, unknown>;
const extraKeys: Record<string, string[]> = {
  appMetadata: ['key'], recordVersions: ['key'], operations: ['id'], auditEntries: ['id'],
  issuedIdentifiers: ['key'], authSessions: ['tokenHash'], purchaseDrafts: ['id'], purchaseLines: ['id'],
  purchaseApprovals: ['id'], purchaseNotices: ['id'], purchaseFinalizations: ['invoiceId'], purchaseProvenance: ['productId'],
};
export const CLOUD_STORE_KEYS: Readonly<Record<string, readonly string[]>> = { ...keyFields, ...extraKeys };
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const clone = <T>(value: T): T => structuredClone(value);
const readonlyError = () => new RepositoryError('IMMUTABLE', 'Cloud projections are read-only; mutations require server RPC');
function indexValue(row: Row, field: string): unknown {
  if (field.startsWith('[') && field.endsWith(']')) return field.slice(1, -1).split('+').map(part => indexValue(row, part));
  return field.split('.').reduce<unknown>((value, part) => value && typeof value === 'object' ? (value as Row)[part] : undefined, row);
}

/** Small immutable query port for existing projections. It never opens IndexedDB. */
class SnapshotCollection {
  constructor(protected readonly rows: Row[], private readonly fields: readonly string[]) {}
  async toArray() { return clone(this.rows); }
  async first() { return clone(this.rows[0]); }
  async last() { return clone(this.rows.at(-1)); }
  async count() { return this.rows.length; }
  filter(predicate: (row: Row) => boolean) { return new SnapshotCollection(this.rows.filter(row => predicate(clone(row))), this.fields); }
  and(predicate: (row: Row) => boolean) { return this.filter(predicate); }
  limit(count: number) { return new SnapshotCollection(this.rows.slice(0, count), this.fields); }
  offset(count: number) { return new SnapshotCollection(this.rows.slice(count), this.fields); }
  reverse() { return new SnapshotCollection([...this.rows].reverse(), this.fields); }
  async sortBy(field: string) { return clone([...this.rows].sort((a, b) => String(indexValue(a, field)).localeCompare(String(indexValue(b, field))))); }
  async primaryKeys() { return this.rows.map(row => this.fields.length === 1 ? clone(row[this.fields[0]]) : this.fields.map(field => clone(row[field]))); }
  add(): never { throw readonlyError(); }
  put(): never { throw readonlyError(); }
  delete(): never { throw readonlyError(); }
  modify(): never { throw readonlyError(); }
}
class SnapshotTable extends SnapshotCollection {
  constructor(readonly name: string, rows: Row[], private readonly keyParts: readonly string[]) { super(rows, keyParts); }
  async get(key: unknown) { return clone(this.rows.find(row => same(this.keyParts.length === 1 ? row[this.keyParts[0]] : this.keyParts.map(field => row[field]), key))); }
  async bulkGet(keys: unknown[]) { return Promise.all(keys.map(key => this.get(key))); }
  where(field: string) {
    const select = (predicate: (value: unknown) => boolean) => new SnapshotCollection(this.rows.filter(row => predicate(indexValue(row, field))), this.keyParts);
    return {
      equals: (value: unknown) => select(current => same(current, value)),
      startsWith: (value: string) => select(current => typeof current === 'string' && current.startsWith(value)),
      equalsIgnoreCase: (value: string) => select(current => typeof current === 'string' && current.toLocaleLowerCase() === value.toLocaleLowerCase()),
      anyOf: (values: unknown[]) => select(current => values.some(value => same(current, value))),
    };
  }
  orderBy(field: string) { return new SnapshotCollection([...this.rows].sort((a, b) => String(indexValue(a, field)).localeCompare(String(indexValue(b, field)))), this.keyParts); }
}

/** Snapshot bytes come from a server-authenticated/RLS-protected RPC. The local
 * permission check preserves the existing UI behavior; it is not server security. */
export function createSnapshotDatabase(snapshot: CloudSnapshot, user: AuthUser): CoCoDatabase {
  const tables = Object.entries(CLOUD_STORE_KEYS).map(([name, fields]) => {
    const rows = name === 'authSessions' ? [] : snapshot[name];
    if (!Array.isArray(rows) || rows.some(row => !row || typeof row !== 'object' || Array.isArray(row))) throw new RepositoryError('REFERENCE', `Malformed cloud store ${name}`);
    return new SnapshotTable(name, clone(rows as Row[]), fields);
  });
  const readAuthorized: CloudReadAuthorizer = async (permission, query) => {
    if (!hasPermission(user.role, permission)) throw new AuthError('FORBIDDEN');
    return query(clone(user));
  };
  const port = {
    ...Object.fromEntries(tables.map(table => [table.name, table])), tables, verno: 4,
    [CLOUD_READ_AUTHORIZER]: readAuthorized,
    table(name: string) {
      const table = tables.find(table => table.name === name);
      if (!table) throw new RepositoryError('REFERENCE', `Unknown cloud store ${name}`);
      return table;
    },
    transaction(mode: string, ...args: unknown[]) {
      if (!/^r[?!]?$/.test(mode)) return Promise.reject(readonlyError());
      const query = args.at(-1);
      if (typeof query !== 'function') return Promise.reject(new TypeError('Read callback required'));
      return Promise.resolve().then(() => query());
    },
  };
  // Single compatibility boundary; all mutation entry points fail closed above.
  return port as unknown as CoCoDatabase;
}
