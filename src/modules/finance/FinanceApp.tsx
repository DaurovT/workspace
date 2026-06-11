import React from 'react';
import FinanceSidebar from './components/FinanceSidebar';
import FinanceHeader from './components/FinanceHeader';
import MainDashboard from './pages/MainDashboard';
import TransactionsPage from './pages/TransactionsPage';
import ProjectsPage from './pages/ProjectsPage';
import DealsSalesPage from './pages/DealsSalesPage';
import ReportsCashflowPage from './pages/ReportsCashflowPage';
import ReportsPnlPage from './pages/ReportsPnlPage';
import ReportsBalancePage from './pages/ReportsBalancePage';
import ReferencesContractorsPage from './pages/ReferencesContractorsPage';
import ReferencesAccountsPage from './pages/ReferencesAccountsPage';
import ReferencesCategoriesPage from './pages/ReferencesCategoriesPage';
import ReferencesProductsPage from './pages/ReferencesProductsPage';
import BudgetView from './components/BudgetView';
import AssetsPage from './pages/AssetsPage';
import LiabilitiesPage from './pages/LiabilitiesPage';
import SettingsPage from './pages/SettingsPage';
import PaymentApprovalsPage from './pages/PaymentApprovalsPage';
import DocumentsPage from './pages/DocumentsPage';
import DealsPurchasePage from './pages/DealsPurchasePage';
import DealsInvoicesPage from './pages/DealsInvoicesPage';
import ReferencesEntitiesPage from './pages/ReferencesEntitiesPage';
import NotificationsPage from './pages/NotificationsPage';
import QuickExpenseModal from './components/QuickExpenseModal';
import { useFinanceStore } from './financeStore';
import { Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const FinanceApp: React.FC = () => {
  const { t } = useTranslation();
    const { activeView, activeSubView, fetchInitialData, isInitialLoading } = useFinanceStore();
  const [showQuickExpense, setShowQuickExpense] = React.useState(false);

  React.useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  let content = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 80, height: 80, borderRadius: 20, background: 'var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
        🚧
      </div>
      <div>
        <h2 style={{ margin: '0 0 8px 0', fontSize: 20, fontWeight: 700, textAlign: 'center' }}>{t("В разработке", "В разработке")}</h2>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>{t("Данный раздел находится в стадии проектирования.", "Данный раздел находится в стадии проектирования.")}</p>
      </div>
    </div>
  );

  if (isInitialLoading) {
    content = (
      <div role="status" aria-label="Загрузка данных" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[...Array(7)].map((_, i) => (
          <div key={i} style={{ height: i === 0 ? 36 : 52, borderRadius: 10, background: 'var(--bg-elevated)', opacity: 0.7, animation: `pulse 1.4s ease ${i * 0.08}s infinite` }} />
        ))}
      </div>
    );
  }
  else if (activeView === 'main') content = <MainDashboard />;
  else if (activeView === 'transactions') content = <TransactionsPage />;
  else if (activeView === 'projects') content = <ProjectsPage />;
  else if (activeView === 'deals' && (!activeSubView || activeSubView === 'sales')) content = <DealsSalesPage />;
  else if (activeView === 'deals' && activeSubView === 'purchase') content = <DealsPurchasePage />;
  else if (activeView === 'deals' && activeSubView === 'invoices') content = <DealsInvoicesPage />;
  else if (activeView === 'reports' && (!activeSubView || activeSubView === 'cashflow')) content = <ReportsCashflowPage />;
  else if (activeView === 'reports' && activeSubView === 'pnl') content = <ReportsPnlPage />;
  else if (activeView === 'reports' && activeSubView === 'balance') content = <ReportsBalancePage />;
  else if (activeView === 'references' && activeSubView === 'contractors') content = <ReferencesContractorsPage />;
  else if (activeView === 'references' && activeSubView === 'accounts') content = <ReferencesAccountsPage />;
  else if (activeView === 'references' && activeSubView === 'categories') content = <ReferencesCategoriesPage />;
  else if (activeView === 'references' && activeSubView === 'products') content = <ReferencesProductsPage />;
  else if (activeView === 'references' && activeSubView === 'entities') content = <ReferencesEntitiesPage />;
  else if (activeView === 'plan') content = <BudgetView />;
  else if (activeView === 'assets') content = <AssetsPage />;
  else if (activeView === 'liabilities') content = <LiabilitiesPage />;
  else if (activeView === 'settings') content = <SettingsPage />;
  else if (activeView === 'treasury') content = <PaymentApprovalsPage />;
  else if (activeView === 'documents') content = <DocumentsPage />;
  else if (activeView === 'notifications') content = <NotificationsPage />;

  return (
    <div className="app-shell" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-family)' }}>
      <FinanceSidebar />
      <div className="main-content">
        <FinanceHeader />
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
          <div className="page-body" style={{ padding: 0, flex: 1, overflowY: 'auto' }}>
            {content}
          </div>
          
          {/* Floating Action Button for Quick Expense */}
          <button
            className="fab-quick-expense"
            onClick={() => setShowQuickExpense(true)}
            title={t("Быстрый расход", "Быстрый расход")}
          >
            <Zap size={24} />
          </button>
        </div>
      </div>
      {showQuickExpense && <QuickExpenseModal onClose={() => setShowQuickExpense(false)} />}
    </div>
  );
};

export default FinanceApp;
