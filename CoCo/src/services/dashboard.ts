import type { CoCoDatabase } from '../db/schema';
import { AuthService } from './auth/service';
import { AuthError } from './auth/errors';
import { salesReportLedger } from './sales-report-ledger';
import { reportPeriod } from '../lib/vietnam-time';
import { addCalendarDays, vietnamDay } from '../domain/inventory';
import { revenueFromVerifiedSales } from '../domain/revenue-report';
import { purchaseDraftSchema, purchaseLineSchema, purchaseApprovalSchema, approvalMatchesLine } from '../domain/purchases';
import { readStockComparison } from './stock-comparison';
import { customerCreationReport } from './customer-creation';
import { purchaseCostReport } from './purchase-report';

/** Undefined baselines remain data states; wording approved in G9-D04. */
export function percentageChange(current: number, previous: number) {
  if (!Number.isSafeInteger(current) || !Number.isSafeInteger(previous) || current < 0 || previous < 0) throw new Error('Invalid comparison amounts');
  return previous === 0 ? { status: 'NO_BASELINE' as const, percent: null }
    : { status: 'DEFINED' as const, percent: (current - previous) / previous * 100 };
}

export class DashboardService {
  private readonly auth: AuthService;
  constructor(private readonly db: CoCoDatabase, private readonly token: () => string | null, private readonly now = () => new Date()) { this.auth = new AuthService(db); }

  staffSummary() {
    return this.auth.readAuthorized(this.token() ?? '', 'home.read', async () => {
      const date = vietnamDay(this.now()), period = reportPeriod({ kind: 'day', value: date });
      const sales = await salesReportLedger(this.db, period), purchases = await purchaseCostReport(this.db, period);
      const customers = await customerCreationReport(this.db, period);
      // All-store daily counts. Never expose financial DTOs to staff.
      return { date, scope: 'STORE_VIETNAM_DAY_VERIFIED_ONLY' as const,
        purchaseOrders: purchases.summary.invoiceCount, salesOrders: sales.summary.invoiceCount,
        importedProducts: purchases.summary.productCount, customers };
    });
  }

  ownerSummary() {
    return this.auth.readAuthorized(this.token() ?? '', 'home.read', async actor => {
      // home.read also belongs to staff; it must not expose owner financial data.
      if (actor.role !== 'owner') throw new AuthError('FORBIDDEN');
      const now = this.now(), today = vietnamDay(now), yesterday = addCalendarDays(today, -1);
      const sales = await salesReportLedger(this.db, reportPeriod({ kind: 'range', start: yesterday, end: today }));
      const current = revenueFromVerifiedSales(reportPeriod({ kind: 'day', value: today }), sales.facts);
      const previous = revenueFromVerifiedSales(reportPeriod({ kind: 'day', value: yesterday }), sales.facts);
      const drafts = (await this.db.table('purchaseDrafts').toArray()).map(row => purchaseDraftSchema.parse(row));
      const lines = (await this.db.table('purchaseLines').toArray()).map(row => purchaseLineSchema.parse(row));
      const approvals = (await this.db.table('purchaseApprovals').toArray()).map(row => purchaseApprovalSchema.parse(row));
      const byDraft = new Map(drafts.map(row => [row.id, row])), byLine = new Map(lines.map(row => [row.id, row]));
      const pendingCount = approvals.filter(approval => {
        const draft = byDraft.get(approval.draftId), line = byLine.get(approval.lineId);
        return approval.decision.status === 'pending' && draft?.status === 'editing' && line?.status === 'pending'
          && !line.removedAt && approvalMatchesLine(approval, line);
      }).length;
      const stock = await readStockComparison(this.db, now, sales);
      return { date: today, revenue: { today: current.totalRevenue, yesterday: previous.totalRevenue,
        comparison: percentageChange(current.totalRevenue, previous.totalRevenue), scope: 'VERIFIED_ONLY' as const, coverage: sales.coverage },
        orders: { today: current.invoiceCount, yesterday: previous.invoiceCount, delta: current.invoiceCount - previous.invoiceCount },
        pendingApprovals: pendingCount,
        stock };
    });
  }
}
