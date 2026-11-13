import type { RecordMap } from '../../domain/records';
import type { Versioned } from '../../repositories';

import type { PageResult } from '../../domain/pagination';
export type { PageResult } from '../../domain/pagination';
export interface CustomerInput { name: string; phone: string }
export interface BracketInput { productType: string; brand: string; condition: string; min: string; max: string }
export type Customer = Versioned<'khachHang'>;
export type Bracket = Versioned<'khungGiaThuMua'> & { conditionLabel: string };
export type HistoryKind = 'purchases' | 'sales'; // From the customer's perspective.
export interface HistoryRow { id: string; date: string; statusCode: number; statusLabel?: string }
export interface CustomerHistory { customer: RecordMap['khachHang']; rows: HistoryRow[] }
export interface InvoiceDetail {
  id: string; date: string; statusCode: number; customer: RecordMap['khachHang'];
  lines: { id: string; name: string; quantity: number; unitPrice: number; total: number }[];
  total: number; discount?: number; paymentCode?: number;
  employee?: { id: string; name: string }; statusLabel?: string; source?: 'legacy' | 'purchase-lines-v1' | 'sales-invoice-v1';
  subtotal?: number; customerPoints?: number; paymentLabel?: string;
}
/** UI depends on this port; local/cloud persistence must implement the same behavior. */
export interface ReferenceDataGateway {
  subscribe(onChange: () => void): () => void;
  customers(query: string, page: number, pageSize?: number): Promise<PageResult<Customer>>;
  customer(id: string): Promise<Customer>;
  createCustomer(input: CustomerInput): Promise<string>;
  updateCustomer(id: string, version: number, input: CustomerInput): Promise<void>;
  deleteCustomer(id: string, version: number, confirmed: boolean): Promise<void>;
  history(id: string, kind: HistoryKind): Promise<CustomerHistory>;
  invoice(customerId: string, kind: HistoryKind, invoiceId: string): Promise<InvoiceDetail>;
  brackets(page: number, condition?: number, pageSize?: number): Promise<PageResult<Bracket>>;
  bracket(id: string): Promise<Bracket>;
  createBracket(input: BracketInput): Promise<string>;
  updateBracket(id: string, version: number, input: BracketInput): Promise<void>;
}

export class DataServiceError extends Error {
  constructor(public readonly code: 'VALIDATION' | 'DUPLICATE' | 'CONFLICT' | 'NOT_FOUND' | 'HAS_HISTORY' | 'CONFIRMATION' | 'CONDITION_MAPPING',
    message: string, public readonly fields: Partial<Record<keyof CustomerInput | keyof BracketInput, string>> = {}) {
    super(message); this.name = 'DataServiceError';
  }
}
