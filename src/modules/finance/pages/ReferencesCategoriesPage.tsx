import React, { useState, useMemo, useEffect } from 'react';
import type { Category } from '../financeStore';
import { useFinanceStore } from '../financeStore';
import { CategoriesTreeTable, CategoryModal } from '../components/CategoriesTreeTable';
import { Filter, Plus } from 'lucide-react';
import { ROOT_GROUPS } from '../config/categoryGroups';
import { useTranslation } from 'react-i18next';

const ReferencesCategoriesPage: React.FC = () => {
  const { t } = useTranslation();
    const { categories, addCategory } = useFinanceStore();

  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery] = useState('');
  const [selectedRootType, setSelectedRootType] = useState('');
  // FIX #4 & #5: use full CategoryModal instead of QuickCreateModal, type imported at top
  const [createModal, setCreateModal] = useState(false);

  // Keyboard shortcut: F toggles filter sidebar
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'f' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        setSidebarOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Total stats (unfiltered — for footer)
  const stats = useMemo(() => {
    const total = categories.length;
    const byType: Record<string, number> = {};
    categories.forEach(c => { byType[c.type] = (byType[c.type] ?? 0) + 1; });
    return { total, byType };
  }, [categories]);

  // Sidebar stats — reflect active search query
  const filteredStats = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return stats;
    const visible = categories.filter(c => c.name.toLowerCase().includes(q));
    const byType: Record<string, number> = {};
    visible.forEach(c => { byType[c.type] = (byType[c.type] ?? 0) + 1; });
    return { total: visible.length, byType };
  }, [categories, searchQuery, stats]);



  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: 'var(--bg-base)' }}>

      {/* ─── LEFT SIDEBAR ─── */}
      {isSidebarOpen && (
        <div style={{ width: 220, flexShrink: 0, borderRight: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column' }}>

          <div style={{ height: 44, padding: '0 12px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <Filter size={12} color="var(--text-muted)" />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{t("Параметры", "Параметры")}</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, lineHeight: 1 }}>✕</button>
          </div>

          <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 8 }}>
              
              {t("Тип статьи", "Тип статьи")}
            </div>

            <button
              onClick={() => setSelectedRootType('')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '6px 8px', borderRadius: 6, border: 'none', cursor: 'pointer',
                textAlign: 'left', width: '100%',
                background: selectedRootType === '' ? 'rgba(99,102,241,0.1)' : 'transparent',
                color: selectedRootType === '' ? 'var(--color-primary)' : 'var(--text-secondary)',
                fontSize: 12, fontWeight: selectedRootType === '' ? 600 : 400,
              }}
            >
              <span>{t("Все статьи", "Все статьи")}</span>
              <span style={{ fontSize: 11, background: 'var(--bg-elevated)', color: 'var(--text-muted)', padding: '1px 6px', borderRadius: 10 }}>
                {filteredStats.total}
              </span>
            </button>

            {ROOT_GROUPS.map(g => {
              const count = filteredStats.byType[g.type] ?? 0;
              const active = selectedRootType === g.type;
              return (
                <button
                  key={g.type}
                  onClick={() => setSelectedRootType(g.type)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '6px 8px', borderRadius: 6, border: 'none', cursor: 'pointer',
                    textAlign: 'left', width: '100%',
                    background: active ? 'rgba(99,102,241,0.1)' : 'transparent',
                    color: active ? 'var(--color-primary)' : count === 0 ? 'var(--text-muted)' : 'var(--text-secondary)',
                    fontSize: 12, fontWeight: active ? 600 : 400,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: g.color, flexShrink: 0, opacity: count === 0 ? 0.35 : 1 }} />
                    {g.label}
                  </div>
                  {count > 0 && (
                    <span style={{ fontSize: 11, background: 'var(--bg-elevated)', color: 'var(--text-muted)', padding: '1px 6px', borderRadius: 10 }}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── MAIN ─── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Header 44px */}
        <div style={{ height: 44, padding: '0 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <button
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              title={t("Фильтры (F)", "Фильтры (F)")}
              style={{ background: isSidebarOpen ? 'var(--bg-card)' : 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <Filter size={12} />
            </button>
            <span style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: -0.01 }}>
              
              {t("Учетные статьи", "Учетные статьи")}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: 10 }}>
              {stats.total}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setCreateModal(true)}
              style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', padding: '0 14px', height: 28, borderRadius: 6, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', boxShadow: '0 2px 8px rgba(99,102,241,0.25)' }}
            >
              <Plus size={13} />  {t("Создать статью", "Создать статью")}
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px 32px' }}>
          <CategoriesTreeTable
            searchQuery={searchQuery}
            selectedRootType={selectedRootType}
          />
        </div>

        {/* Footer */}
        {stats.total > 0 && (
          <div style={{ flexShrink: 0, borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', padding: '10px 28px', display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              
              {t("Всего статей:", "Всего статей:")} <b style={{ color: 'var(--text-primary)' }}>{stats.total}</b>
            </span>
            {ROOT_GROUPS.filter(g => (stats.byType[g.type] ?? 0) > 0).map(g => (
              <span key={g.type} style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: g.color, display: 'inline-block' }} />
                {g.label}: <b style={{ color: 'var(--text-primary)' }}>{stats.byType[g.type]}</b>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* FIX #4/#5: unified full-featured CategoryModal from header button */}
      {createModal && (
        <CategoryModal
          mode="create"
          rootNodes={[]}
          categories={categories}
          onClose={() => setCreateModal(false)}
          onSave={async (data: Omit<Category, 'id'>) => {
            await addCategory(data);
            setCreateModal(false);
          }}
        />
      )}
    </div>
  );
};

export default ReferencesCategoriesPage;
