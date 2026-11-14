import { Link, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { CoCoLayout } from '../components/layout/CoCoLayout';
import { HomePage } from '../features/home/HomePage';
import { AuthPage } from '../features/auth/AuthPage';
import { useAuth } from '../features/auth/use-auth';
import { hasPermission, ROUTE_PERMISSIONS } from '../services/permissions';
import { CustomersPage } from '../features/customers/CustomersPage';
import { CustomerDetailPage } from '../features/customers/CustomerDetailPage';
import { CustomerHistoryPage, CustomerInvoicePage } from '../features/customers/CustomerHistoryPage';
import { PriceBracketsPage, PriceBracketDetailPage } from '../features/price-brackets/PriceBracketsPage';
import { StaffPage, StaffDetailPage } from '../features/staff/StaffPages';
import { PurchaseEditor } from '../features/purchases/PurchaseEditor';
import { PurchasesPage } from '../features/purchases/PurchasesPage';
import { PurchaseInvoicePage } from '../features/purchases/PurchaseInvoicePage';
import { ApprovalsPage } from '../features/approvals/ApprovalsPage';
import { InventoryPage, InventoryDetail } from '../features/inventory/InventoryPages';
import { DiscountMonitor } from '../features/inventory/DiscountMonitor';
import { SalesEditor } from '../features/sales/SalesEditor';
import { SalesPage, SaleInvoicePage } from '../features/sales/SalesPages';
import { ReportsPage, RevenueReportPage } from '../features/reports/RevenueReportPage';
import { PurchaseCostReportPage } from '../features/reports/PurchaseCostReportPage';
import { FinancialReportPage } from '../features/reports/FinancialReportPage';
import { AgedStockReportPage } from '../features/reports/AgedStockReportPage';

function RequireSession() {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace />;
  const permission = ROUTE_PERMISSIONS[location.pathname.split('/')[1]];
  if (permission && !hasPermission(user.role, permission)) return <section className="permission-denied" role="alert"><h1>Không có quyền truy cập</h1><p>Bạn không có quyền truy cập chức năng này.</p><Link to="/">Về trang chủ</Link></section>;
  return <Outlet />;
}

export function AppRouter() {
  return <Routes><Route path="/login" element={<AuthPage />} /><Route element={<RequireSession />}><Route element={<CoCoLayout />}>
    <Route index element={<HomePage />} />
    <Route path="purchases" element={<PurchasesPage />} />
    <Route path="purchases/new" element={<PurchaseEditor />} />
    <Route path="purchases/transactions/:invoiceId" element={<PurchaseInvoicePage />} />
    <Route path="purchases/:draftId" element={<PurchaseEditor />} />
    <Route path="sales" element={<SalesPage />} />
    <Route path="sales/new" element={<SalesEditor />} />
    <Route path="sales/transactions/:invoiceId" element={<SaleInvoicePage />} />
    <Route path="sales/:draftId" element={<SalesEditor />} />
    <Route path="approvals" element={<ApprovalsPage />} />
    <Route path="inventory" element={<InventoryPage />} />
    <Route path="inventory/discounts" element={<DiscountMonitor />} />
    <Route path="inventory/:productId" element={<InventoryDetail />} />
    <Route path="approvals/:approvalId" element={<ApprovalsPage />} />
    <Route path="customers" element={<CustomersPage />} />
    <Route path="customers/:customerId" element={<CustomerDetailPage />} />
    <Route path="customers/:customerId/purchases" element={<CustomerHistoryPage kind="purchases" />} />
    <Route path="customers/:customerId/sales" element={<CustomerHistoryPage kind="sales" />} />
    <Route path="customers/:customerId/purchases/:invoiceId" element={<CustomerInvoicePage kind="purchases" />} />
    <Route path="customers/:customerId/sales/:invoiceId" element={<CustomerInvoicePage kind="sales" />} />
    <Route path="price-brackets" element={<PriceBracketsPage />} />
    <Route path="price-brackets/:bracketId" element={<PriceBracketDetailPage />} />
    <Route path="staff" element={<StaffPage />} />
    <Route path="staff/:employeeId" element={<StaffDetailPage />} />
    <Route path="reports" element={<ReportsPage />} />
    <Route path="reports/revenue" element={<RevenueReportPage />} />
    <Route path="reports/purchase-cost" element={<PurchaseCostReportPage />} />
    <Route path="reports/profit" element={<FinancialReportPage key="profit" kind="profit" />} />
    <Route path="reports/cash-flow" element={<FinancialReportPage key="cash-flow" kind="cash-flow" />} />
    <Route path="reports/aged-stock" element={<AgedStockReportPage />} />
    <Route path="*" element={<section className="panel"><h1>Không tìm thấy trang</h1><Link to="/">Về trang chủ</Link></section>} />
  </Route></Route></Routes>;
}
