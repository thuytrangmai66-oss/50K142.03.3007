import type { SupabaseClient } from '@supabase/supabase-js';
import { LocalReferenceData } from '../services/reference-data/local';
import { DataServiceError, type ReferenceDataGateway } from '../services/reference-data/contracts';
import { StaffAccountsService, StaffServiceError, type StaffAccountsGateway } from '../services/staff-accounts';
import { PurchaseDraftService, PurchaseInputError } from '../services/purchase-drafts';
import { PurchaseApprovalService, ApprovalInputError } from '../services/purchase-approvals';
import { PurchaseFinalizationService } from '../services/purchase-finalization';
import { SalesDraftService, SalesDraftError } from '../services/sales';
import { SalesPaymentService } from '../services/sales-payment';
import { SalesQueriesService } from '../services/sales-queries';
import { ReportQueriesService } from '../services/report-queries';
import { DashboardService } from '../services/dashboard';
import { InventoryService, InventoryInputError } from '../services/inventory';
import { DiscountScheduler } from '../services/discount-scheduler';
import { AuthError } from '../services/auth/errors';
import { RepositoryError } from '../repositories/errors';
import type { CoCoDatabase } from '../db/schema';
import type { CloudServiceOptions, CloudSnapshot } from './contracts';
import { createSnapshotDatabase } from './repository';

type Public<T> = Pick<T, keyof T>;
export interface CloudServices {
  referenceData: ReferenceDataGateway;
  staffAccounts: StaffAccountsGateway;
  purchaseDrafts: Public<PurchaseDraftService>;
  approvals: Public<PurchaseApprovalService>;
  purchaseFinalizer: Public<PurchaseFinalizationService>;
  salesDrafts: Public<SalesDraftService>;
  salesPayments: Public<SalesPaymentService>;
  salesQueries: Public<SalesQueriesService>;
  reports: Public<ReportQueriesService>;
  dashboard: Public<DashboardService>;
  inventory: Public<InventoryService>;
  discounts: { read(): ReturnType<DiscountScheduler['read']>; runDue(): ReturnType<DiscountScheduler['runDue']> };
}

export class CloudOfflineError extends Error {
  constructor() { super('Mất kết nối mạng. Không thể lưu hoặc thanh toán; hãy kết nối lại rồi thử lại.'); this.name = 'CloudOfflineError'; }
}
export function requireCloudOnline() {
  if (typeof navigator !== 'undefined' && !navigator.onLine) throw new CloudOfflineError();
}
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(item => canonical(item ?? null)).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.entries(value).filter(([, item]) => item !== undefined).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(',')}}`;
  return JSON.stringify(value) ?? 'null';
}
type RemoteError = { message?: string; code?: string; details?: string; constraint?: string; fields?: Record<string, string> };
/** Preserve the error classes the existing UI uses for validation and stale writes. */
export function cloudServiceError(service: string, error: RemoteError, method?: string): Error {
  let details: RemoteError = {};
  try { details = error.details ? JSON.parse(error.details) as RemoteError : {}; } catch { /* Postgres details may be plain text. */ }
  const bracketWrite = service === 'referenceData' && (method === 'createBracket' || method === 'updateBracket');
  const customerWrite = service === 'referenceData' && (method === 'createCustomer' || method === 'updateCustomer');
  const staffWrite = service === 'staffAccounts' && (method === 'create' || method === 'update');
  const constraint = error.constraint ?? details.constraint ?? error.message?.match(/unique constraint "([^"]+)"/)?.[1];
  if (customerWrite && error.code === '23505' && constraint === 'coco_customer_phone') {
    const message = 'Số điện thoại bị trùng với khách hàng khác';
    return new DataServiceError('DUPLICATE', message, { phone: message });
  }
  if (staffWrite) {
    const text = error.message?.replace(/^DUPLICATE:\s*/, '');
    const phone = error.code === '23505' && constraint === 'coco_employee_phone';
    const username = error.code === '23505' && ['taiKhoan_pkey', 'coco_profiles_username_key'].includes(constraint ?? '') || ['DUPLICATE', 'P0001'].includes(error.code ?? '') && text === 'Tên đăng nhập đã tồn tại';
    if (phone || username) {
      const message = phone ? 'Số điện thoại đã tồn tại' : 'Tên đăng nhập đã tồn tại';
      return new StaffServiceError('DUPLICATE', message, { [phone ? 'phone' : 'username']: message });
    }
  }
  if (bracketWrite && error.code === '23505') {
    return new DataServiceError('DUPLICATE', constraint === 'coco_bracket_identity'
      ? 'Khung giá đã tồn tại'
      : 'Không thể lưu khung giá vì mã dữ liệu đã tồn tại. Vui lòng thử lại.');
  }
  if ((customerWrite || staffWrite) && error.code === '23505') {
    const message = 'Không thể lưu do mã dữ liệu đã tồn tại. Vui lòng kiểm tra lại.';
    return staffWrite ? new StaffServiceError('DUPLICATE', message) : new DataServiceError('DUPLICATE', message);
  }
  if (bracketWrite && !error.code && /failed to fetch|fetch failed|networkerror|network request failed|load failed/i.test(error.message ?? '')) return new CloudOfflineError();
  const message = error.message ?? 'Không thể truy cập dữ liệu tập trung. Vui lòng thử lại.';
  const code = details.code ?? (message.match(/^([A-Z_]+)(?::|\s)/)?.[1]) ??
    ({ '42501': 'FORBIDDEN', '28000': 'AUTH_REQUIRED', '23505': 'DUPLICATE', '23503': 'REFERENCE', '40001': 'CONFLICT' } as Record<string, string>)[error.code ?? ''] ?? error.code;
  const fields = details.fields ?? error.fields ?? {};
  if (code === 'FORBIDDEN' || code === 'AUTH_REQUIRED') return new AuthError(code);
  if (service === 'referenceData' && ['VALIDATION', 'DUPLICATE', 'CONFLICT', 'NOT_FOUND', 'HAS_HISTORY', 'CONFIRMATION', 'CONDITION_MAPPING'].includes(code ?? ''))
    return new DataServiceError(code as DataServiceError['code'], bracketWrite ? message.replace(/^[A-Z_]+:\s*/, '') : message, fields);
  if (service === 'staffAccounts' && ['VALIDATION', 'DUPLICATE', 'NOT_FOUND', 'CONFLICT', 'CONFIRMATION'].includes(code ?? ''))
    return new StaffServiceError(code as StaffServiceError['code'], message, fields);
  if (['VALIDATION', 'DUPLICATE', 'NOT_FOUND', 'CONFLICT', 'REFERENCE', 'IMMUTABLE', 'OPERATION_REUSED'].includes(code ?? '')) {
    if (code === 'VALIDATION') {
      if (service === 'purchaseDrafts') return new PurchaseInputError(message, fields);
      if (service === 'approvals') return new ApprovalInputError(message, fields);
      if (service === 'salesDrafts') return new SalesDraftError(message, fields);
      if (service === 'inventory') return new InventoryInputError(message, fields);
    }
    return new RepositoryError(code as RepositoryError['code'], message);
  }
  return new Error(message);
}

type Method = (...args: unknown[]) => Promise<unknown>;
function projectionMethods<T, K extends keyof T>(create: (db: CoCoDatabase) => T, names: readonly K[], read: <R>(query: (db: CoCoDatabase) => Promise<R>) => Promise<R>): Pick<T, K> {
  return Object.fromEntries(names.map(name => [name, (...args: unknown[]) => read(db => {
    const instance = create(db), method = instance[name] as unknown as Method;
    return method.apply(instance, args);
  })])) as Pick<T, K>;
}
function remoteMethods<T, K extends keyof T>(service: string, names: readonly K[], write: (service: string, method: string, args: unknown[]) => Promise<unknown>): Pick<T, K> {
  return Object.fromEntries(names.map(name => [name, (...args: unknown[]) => write(service, String(name), args)])) as Pick<T, K>;
}

/** Cloud is authoritative. Reads reuse the approved projections on immutable
 * server snapshots; every mutation goes to PostgreSQL RPC or server Auth admin. */
export function createCloudServices(client: SupabaseClient, options: CloudServiceOptions): CloudServices {
  let snapshot: Promise<CloudSnapshot> | undefined;
  let snapshotOwner: string | undefined;
  const retryKeys = new Map<string, string>();
  const invalidate = () => { snapshot = undefined; options.invalidate(); };
  async function read<R>(query: (db: CoCoDatabase) => Promise<R>): Promise<R> {
    requireCloudOnline();
    const user = options.currentUser(); if (!user) throw new AuthError('AUTH_REQUIRED');
    if (!snapshot || snapshotOwner !== user.username) {
      snapshotOwner = user.username;
      snapshot = (async () => {
        const { data, error } = await client.rpc('coco_snapshot');
        if (error) throw cloudServiceError('snapshot', error);
        if (!data || typeof data !== 'object' || Array.isArray(data)) throw new RepositoryError('REFERENCE', 'Invalid cloud snapshot');
        return data as CloudSnapshot;
      })();
      snapshot.catch(() => { snapshot = undefined; });
    }
    return query(createSnapshotDatabase(await snapshot, user));
  }
  async function write(service: string, method: string, args: unknown[]): Promise<unknown> {
    requireCloudOnline();
    const user = options.currentUser(); if (!user) throw new AuthError('AUTH_REQUIRED');
    const first = args[0] && typeof args[0] === 'object' ? args[0] as Record<string, unknown> : undefined;
    const operationId = typeof first?.operationId === 'string' ? first.operationId :
      service === 'purchaseDrafts' && method === 'reviseRejected' && typeof args[3] === 'string' ? args[3] :
      service === 'purchaseDrafts' && method === 'removeOrCancel' && typeof args[1] === 'string' ? args[1] : undefined;
    const fingerprint = canonical([user.username, service, method, args]);
    const key = operationId ?? retryKeys.get(fingerprint) ?? crypto.randomUUID();
    retryKeys.set(fingerprint, key);
    try {
      let data: unknown;
      if (service === 'staffAccounts') {
        const result = await client.functions.invoke('staff-admin', { body: { method, args, idempotency_key: key } });
        if (result.error) {
          const response = result.error.context;
          if (response instanceof Response) {
            let body: RemoteError | undefined;
            try { body = await response.json() as RemoteError; } catch { /* Retain safe transport error. */ }
            if (body) throw cloudServiceError(service, body, method);
          }
          throw result.error;
        }
        data = result.data;
      } else {
        const result = await client.rpc('coco_service', { p_service: service, p_method: method, p_payload: { args: JSON.parse(JSON.stringify(args)) }, p_idempotency_key: key });
        if (result.error) throw cloudServiceError(service, result.error, method);
        data = result.data;
      }
      retryKeys.delete(fingerprint); invalidate(); return data;
    } catch (error) {
      // Keep the same idempotency key after a lost response / network failure.
      if (retryKeys.size > 1000) retryKeys.delete(retryKeys.keys().next().value!);
      throw error;
    }
  }
  const token = () => null;
  return {
    referenceData: {
      ...projectionMethods(db => new LocalReferenceData(db, token), ['customers', 'customer', 'history', 'invoice', 'brackets', 'bracket'], read),
      ...remoteMethods<ReferenceDataGateway, 'createCustomer' | 'updateCustomer' | 'deleteCustomer' | 'createBracket' | 'updateBracket'>('referenceData', ['createCustomer', 'updateCustomer', 'deleteCustomer', 'createBracket', 'updateBracket'], write),
      subscribe(onChange) { return options.subscribe(() => { snapshot = undefined; onChange(); }); },
    },
    staffAccounts: {
      ...projectionMethods(db => new StaffAccountsService(db, token), ['list', 'detail'], read),
      ...remoteMethods<StaffAccountsGateway, 'create' | 'update' | 'remove'>('staffAccounts', ['create', 'update', 'remove'], write),
    },
    purchaseDrafts: {
      ...projectionMethods(db => new PurchaseDraftService(db, token), ['listTransactions', 'transaction', 'prepareDraft', 'load', 'catalog', 'findBracket', 'prepareAdd', 'pendingResults'], read),
      ...remoteMethods<PurchaseDraftService, 'commit' | 'acknowledgeResult' | 'reviseRejected' | 'removeOrCancel'>('purchaseDrafts', ['commit', 'acknowledgeResult', 'reviseRejected', 'removeOrCancel'], write),
    },
    approvals: {
      ...projectionMethods(db => new PurchaseApprovalService(db, token), ['listRequests', 'loadRequest'], read),
      ...remoteMethods<PurchaseApprovalService, 'decide' | 'publishDecision'>('approvals', ['decide', 'publishDecision'], write),
    },
    purchaseFinalizer: remoteMethods<PurchaseFinalizationService, 'finalize'>('purchaseFinalizer', ['finalize'], write),
    salesDrafts: {
      ...projectionMethods(db => new SalesDraftService(db, token), ['prepareDraft', 'load', 'lookupProduct', 'customerMembership', 'validateDraft'], read),
      ...remoteMethods<SalesDraftService, 'registerMembership' | 'addProduct' | 'removeProduct' | 'cancelDraft'>('salesDrafts', ['registerMembership', 'addProduct', 'removeProduct', 'cancelDraft'], write),
    },
    salesPayments: {
      ...projectionMethods(db => new SalesPaymentService(db, token), ['quote'], read),
      ...remoteMethods<SalesPaymentService, 'finalize'>('salesPayments', ['finalize'], write),
    },
    salesQueries: projectionMethods(db => new SalesQueriesService(db, token), ['invoice', 'list'], read),
    reports: projectionMethods(db => new ReportQueriesService(db, token), ['revenue', 'purchaseCost', 'financial', 'agedStock', 'newCustomers'], read),
    dashboard: projectionMethods(db => new DashboardService(db, token), ['staffSummary', 'ownerSummary'], read),
    inventory: {
      ...projectionMethods(db => new InventoryService(db, token), ['list', 'item'], read),
      ...remoteMethods<InventoryService, 'update'>('inventory', ['update'], write),
    },
    discounts: {
      read: () => read(db => new DiscountScheduler(db).read('')),
      runDue: () => write('discounts', 'runDue', []) as ReturnType<DiscountScheduler['runDue']>,
    },
  };
}
