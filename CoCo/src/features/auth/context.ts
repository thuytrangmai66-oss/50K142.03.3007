import { createContext } from 'react';
import type { AuthState } from '../../domain/auth';
import type { BootstrapInput } from '../../services/auth/service';
import type { ReferenceDataGateway } from '../../services/reference-data/contracts';
import type { StaffAccountsGateway } from '../../services/staff-accounts';
import type { PurchaseDraftService } from '../../services/purchase-drafts';
import type { PurchaseApprovalService } from '../../services/purchase-approvals';
import type { PurchaseFinalizationService } from '../../services/purchase-finalization';
import type { InventoryService } from '../../services/inventory';
import type { DiscountScheduler } from '../../services/discount-scheduler';
import type { SalesDraftService } from '../../services/sales';
import type { SalesPaymentService } from '../../services/sales-payment';
import type { SalesQueriesService } from '../../services/sales-queries';
import type { ReportQueriesService } from '../../services/report-queries';
import type { DashboardService } from '../../services/dashboard';

export interface AuthContextValue extends AuthState {
  referenceData: ReferenceDataGateway;
  staffAccounts: StaffAccountsGateway;
  purchaseDrafts: Pick<PurchaseDraftService, keyof PurchaseDraftService>;
  approvals: Pick<PurchaseApprovalService, keyof PurchaseApprovalService>;
  purchaseFinalizer: Pick<PurchaseFinalizationService, keyof PurchaseFinalizationService>;
  salesDrafts: Pick<SalesDraftService, keyof SalesDraftService>;
  salesPayments: Pick<SalesPaymentService, keyof SalesPaymentService>;
  salesQueries: Pick<SalesQueriesService, keyof SalesQueriesService>;
  reports: Pick<ReportQueriesService, keyof ReportQueriesService>;
  dashboard: Pick<DashboardService, keyof DashboardService>;
  inventory: Pick<InventoryService, keyof InventoryService>;
  discounts: { read(): ReturnType<DiscountScheduler['read']> };
  login(username: string, password: string): Promise<void>;
  bootstrap(input: BootstrapInput): Promise<void>;
  logout(): Promise<void>;
  notice: string;
  clearNotice(): void;
}
export const AuthContext = createContext<AuthContextValue | null>(null);
