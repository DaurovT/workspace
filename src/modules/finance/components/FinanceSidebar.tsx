import React from 'react';
import { useFinanceStore } from '../financeStore';
import { useStore } from '../../../store';
import { ChevronLeft, ChevronDown, ChevronRight, Activity, CreditCard, Briefcase, Calendar, LayoutGrid, BarChart3, BookOpen, Settings, Send, FileText, Package, Landmark, Origami, MessageCircle, Plus, Lock } from 'lucide-react';

const FinanceSidebar: React.FC = () => {
  const { activeView, activeSubView, setActiveView, expandedMenus, toggleMenu, isSidebarCollapsed, toggleSidebar, copilotConversations, activeCopilotConversationId, setActiveCopilotConversationId, setCopilotOpen, isSidebarMobileOpen, setSidebarMobileOpen } = useFinanceStore();
  const setActiveApp = useStore(state => state.setActiveApp);

  const menuItems = [
    { id: 'main', label: 'Показатели', icon: Activity },
    { id: 'transactions', label: 'Операции', icon: CreditCard },
    {
      id: 'deals', label: 'Сделки', icon: Briefcase,
      subItems: [
        { id: 'sales', label: 'Продажи' },
        { id: 'purchase', label: 'Закупки' },
        { id: 'invoices', label: 'Выставленные счета' }
      ]
    },
    {
      id: 'plan', label: 'План', icon: Calendar,
      subItems: [
        { id: 'calendar', label: 'Платежный календарь' },
        { id: 'bdr', label: 'Бюджет доходов и расходов' },
        { id: 'bdds', label: 'Бюджет движения денег' }
      ]
    },
    { id: 'projects', label: 'Проекты', icon: LayoutGrid },
    {
      id: 'reports', label: 'Отчёты', icon: BarChart3,
      subItems: [
        { id: 'cashflow', label: 'Движение денег (ДДС)' },
        { id: 'pnl', label: 'Прибыли и убытки (ОПУ)' },
        { id: 'balance', label: 'Баланс' }
      ]
    },
    {
      id: 'references', label: 'Справочники', icon: BookOpen,
      subItems: [
        { id: 'contractors', label: 'Контрагенты' },
        { id: 'categories', label: 'Учетные статьи' },
        { id: 'accounts', label: 'Мои счета' },
        { id: 'entities', label: 'Мои юрлица' },
        { id: 'products', label: 'Товары и услуги' }
      ]
    },
    { id: 'assets', label: 'Учет активов', icon: Package },
    { id: 'liabilities', label: 'Кредиты и займы', icon: Landmark },
    { id: 'treasury', label: 'Казначейство', icon: Send, disabled: true },
    { id: 'documents', label: 'Документооборот', icon: FileText, disabled: true },
    { id: 'settings', label: 'Настройки', icon: Settings },
  ] as const;

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
          {!isSidebarCollapsed && <div className="sidebar-logo-text" style={{ fontSize: 16, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>Manor</div>}
        </div>
        {!isSidebarCollapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button 
              onClick={() => setActiveApp('desktop')} 
              style={{ padding: 6, borderRadius: 6, background: 'var(--bg-hover)', color: 'var(--text-secondary)', display: 'flex', border: 'none', cursor: 'pointer' }}
              title="Вернуться на рабочий стол"
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
                {!isSidebarCollapsed && isDisabled && <Lock size={12} style={{ flexShrink: 0, color: 'var(--text-muted)' }} />}
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
        {/* AI History */}
        {!isSidebarCollapsed && (
          <div style={{ marginTop: 24, padding: '0 8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px 12px' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>AI History</div>
              <button onClick={() => { setActiveCopilotConversationId(null); setCopilotOpen(true); if (isSidebarMobileOpen) setSidebarMobileOpen(false); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'} title="Новый чат">
                <Plus size={12} />
              </button>
            </div>
            {copilotConversations.slice(0, 5).map((conv) => {
              const isActive = activeCopilotConversationId === conv.id;
              return (
                <button 
                  key={conv.id} 
                  onClick={() => {
                    setActiveCopilotConversationId(conv.id);
                    setCopilotOpen(true);
                    if (isSidebarMobileOpen) setSidebarMobileOpen(false);
                  }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)', 
                    background: isActive ? 'var(--bg-hover)' : 'transparent', 
                    border: 'none',
                    borderRadius: 8, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', marginBottom: 4
                  }}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-hover)'; } }}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; } }}
                >
                  <MessageCircle size={14} style={{ opacity: isActive ? 0.8 : 0.5, flexShrink: 0, color: isActive ? 'var(--color-primary)' : 'inherit' }} />
                  <span style={{ fontSize: 13, fontWeight: isActive ? 500 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{conv.title}</span>
                </button>
              );
            })}
            {copilotConversations.length === 0 && (
              <div style={{ padding: '0 12px', fontSize: 12, color: 'var(--text-muted)' }}>
                Нет сохраненных чатов
              </div>
            )}
          </div>
        )}
      </div>
      </div>
    </>
  );
};

export default FinanceSidebar;
