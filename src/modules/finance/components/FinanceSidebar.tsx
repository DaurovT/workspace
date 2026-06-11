import React from 'react';
import { useFinanceStore } from '../financeStore';
import { useStore } from '../../../store';
import { ChevronLeft, ChevronDown, ChevronRight, Activity, CreditCard, Briefcase, Calendar, LayoutGrid, BarChart3, BookOpen, Settings, Send, FileText, Package, Landmark, Origami } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const FinanceSidebar: React.FC = () => {
  const { t } = useTranslation();
  const { activeView, activeSubView, setActiveView, expandedMenus, toggleMenu, isSidebarCollapsed, toggleSidebar, isSidebarMobileOpen, setSidebarMobileOpen } = useFinanceStore();
  const setActiveApp = useStore(state => state.setActiveApp);

  const menuItems = [
    { id: 'main', label: t('Показатели'), icon: Activity },
    { id: 'transactions', label: t('Операционная деятельность'), icon: CreditCard },
    {
      id: 'deals', label: t('Сделки'), icon: Briefcase,
      subItems: [
        { id: 'sales', label: t('Продажи') },
        { id: 'purchase', label: t('Закупки') },
        { id: 'invoices', label: t('Выставленные счета') }
      ]
    },
    { id: 'plan', label: t('Бюджет'), icon: Calendar },
    { id: 'projects', label: t('Проекты'), icon: LayoutGrid },
    {
      id: 'reports', label: t('Отчёты'), icon: BarChart3,
      subItems: [
        { id: 'cashflow', label: t('Движение денег (ДДС)') },
        { id: 'pnl', label: t('Прибыли и убытки (ОПУ)') },
        { id: 'balance', label: t('Баланс') }
      ]
    },
    {
      id: 'references', label: t('Справочники'), icon: BookOpen,
      subItems: [
        { id: 'contractors', label: t('Контрагенты') },
        { id: 'categories', label: t('Учетные статьи') },
        { id: 'accounts', label: t('Мои счета') },
        { id: 'entities', label: t('Мои юрлица') },
        { id: 'products', label: t('Товары и услуги') }
      ]
    },
    { id: 'assets', label: t('Учет активов'), icon: Package },
    { id: 'liabilities', label: t('Кредиты и займы'), icon: Landmark },
    { id: 'treasury', label: t('Казначейство'), icon: Send, disabled: true },
    { id: 'documents', label: t('Документооборот'), icon: FileText, disabled: true },
    { id: 'settings', label: t('Настройки'), icon: Settings },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isSidebarMobileOpen && (
        <div 
          className="sidebar-mobile-overlay" 
          onClick={() => setSidebarMobileOpen(false)} 
        />
      )}
      <div className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''} ${isSidebarMobileOpen ? 'sidebar-mobile-open' : ''}`} style={{ height: '100%' }}>
        {/* ALIGNED TO ARCANA: Standard Sidebar Logo Area */}
      <div className="sidebar-logo" style={{ cursor: 'pointer', justifyContent: isSidebarCollapsed ? 'center' : 'space-between', padding: isSidebarCollapsed ? '0' : '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => toggleSidebar()}>
          <div className="sidebar-logo-icon" style={{ background: 'var(--color-primary)', width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Origami size={16} color="#ffffff" />
          </div>
          {!isSidebarCollapsed && <div className="sidebar-logo-text" style={{ fontSize: 16, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>Manor Finance</div>}
        </div>
        {!isSidebarCollapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button 
              onClick={() => setActiveApp('desktop')} 
              style={{ padding: 6, borderRadius: 6, background: 'var(--bg-hover)', color: 'var(--text-secondary)', display: 'flex', border: 'none', cursor: 'pointer' }}
              title={t("Вернуться на рабочий стол", "Вернуться на рабочий стол")}
            >
              <ChevronLeft size={16} />
            </button>
          </div>
        )}
      </div>

      <div className="sidebar-nav" style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: isSidebarCollapsed ? '0 6px' : '0 8px', marginTop: 8 }}>
        {!isSidebarCollapsed && <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '16px 12px 8px' }}>Navigation</div>}

        {menuItems.map(item => {
          const isExpanded = expandedMenus.includes(item.id);
          const isActiveMain = activeView === item.id;
          const hasSubItems = !!(item as any).subItems;
          const isDisabled = (item as any).disabled;
          const Icon = item.icon;
          
          return (
            <div key={item.id}>
              <div
                className={`nav-item ${isActiveMain && !hasSubItems ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                onClick={() => {
                  if (isDisabled) return;
                  if (isSidebarCollapsed && hasSubItems) toggleSidebar();
                  if (hasSubItems) {
                    toggleMenu(item.id);
                  } else {
                    setActiveView(item.id as any);
                    if (isSidebarMobileOpen) setSidebarMobileOpen(false);
                  }
                }}
                style={{
                  display: 'flex', alignItems: 'center', padding: isSidebarCollapsed ? '10px 0' : '8px 12px', gap: 12, cursor: isDisabled ? 'not-allowed' : 'pointer',
                  justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                  color: isActiveMain && !hasSubItems ? 'var(--color-primary)' : 'var(--text-secondary)',
                  background: isActiveMain && !hasSubItems ? 'var(--bg-active)' : 'transparent',
                  borderRadius: 8, transition: 'all 0.15s',
                  fontSize: 13, fontWeight: isActiveMain && !hasSubItems ? 500 : 400,
                  opacity: isDisabled ? 0.6 : 1
                }}
                title={isSidebarCollapsed ? item.label : undefined}
                onMouseEnter={e => { if (!isActiveMain && !hasSubItems && !isDisabled) { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-hover)'; } }}
                onMouseLeave={e => { if (!isActiveMain && !hasSubItems && !isDisabled) { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; } }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                  <Icon size={16} style={{ flexShrink: 0, opacity: (isActiveMain && !hasSubItems) ? 1 : 0.7 }} />
                  {!isSidebarCollapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>}
                </div>
                {!isSidebarCollapsed && isDisabled && <span style={{ flexShrink: 0, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 4, padding: '1px 5px' }}>скоро</span>}
                {!isSidebarCollapsed && hasSubItems && !isDisabled && (
                  <div onClick={(e) => { e.stopPropagation(); toggleMenu(item.id); }} style={{ display: 'flex', color: 'var(--text-muted)' }}>
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </div>
                )}
              </div>

              {!isSidebarCollapsed && hasSubItems && isExpanded && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4, marginBottom: 4 }}>
                  {(item as any).subItems.map((sub: any) => {
                    const isActiveSub = activeView === item.id && activeSubView === sub.id;
                    return (
                      <div
                        key={sub.id}
                        className={`nav-item ${isActiveSub ? 'active' : ''}`}
                        onClick={() => {
                          setActiveView(item.id as any, sub.id);
                          if (isSidebarMobileOpen) setSidebarMobileOpen(false);
                        }}
                        style={{
                          padding: '8px 12px 8px 36px', cursor: 'pointer',
                          fontSize: 13, fontWeight: isActiveSub ? 500 : 400, transition: 'all 0.15s',
                          background: isActiveSub ? 'var(--bg-active)' : 'transparent',
                          color: isActiveSub ? 'var(--color-primary)' : 'var(--text-secondary)',
                          borderRadius: 8,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                        }}
                        onMouseEnter={e => {
                          if (!isActiveSub) {
                            e.currentTarget.style.color = 'var(--text-primary)';
                            e.currentTarget.style.background = 'var(--bg-hover)';
                          }
                        }}
                        onMouseLeave={e => {
                          if (!isActiveSub) {
                            e.currentTarget.style.color = 'var(--text-secondary)';
                            e.currentTarget.style.background = 'transparent';
                          }
                        }}
                      >
                        {sub.label}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      </div>
    </>
  );
};

export default FinanceSidebar;
