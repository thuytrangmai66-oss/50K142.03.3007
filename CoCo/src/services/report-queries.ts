import type { CoCoDatabase } from '../db/schema';
import { customerCreationReport } from './customer-creation';
import { reportPeriod, type ReportPeriodInput } from '../lib/vietnam-time';
import { AuthService } from './auth/service';
import { salesReportLedger } from './sales-report-ledger';
import { purchaseCostReport } from './purchase-report';
import { financialReport } from './financial-reports';
import { agedStockReport, type AgedStockFilters } from './aged-stock-report';

/** Every report executes in one authorized readonly transaction. */
export class ReportQueriesService {
  private readonly auth: AuthService;
  constructor(private readonly db: CoCoDatabase, private readonly token: () => string | null) { this.auth = new AuthService(db); }
  revenue(input: ReportPeriodInput) {
    return this.auth.readAuthorized(this.token() ?? '', 'reports.read', () => salesReportLedger(this.db, reportPeriod(input)));
  }
  purchaseCost(input: ReportPeriodInput) {
    return this.auth.readAuthorized(this.token() ?? '', 'reports.read', () => purchaseCostReport(this.db, reportPeriod(input)));
  }
  financial(input: ReportPeriodInput, kind: 'profit' | 'cash-flow') {
    return this.auth.readAuthorized(this.token() ?? '', 'reports.read', () => financialReport(this.db, reportPeriod(input), kind));
  }
  agedStock(input: AgedStockFilters) {
    return this.auth.readAuthorized(this.token() ?? '', 'reports.read', () => agedStockReport(this.db, input, new Date()));
  }
  newCustomers(input: ReportPeriodInput) {
    return this.auth.readAuthorized(this.token() ?? '', 'reports.read', () => customerCreationReport(this.db, reportPeriod(input)));
  }
}
