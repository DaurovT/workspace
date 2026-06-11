import React, { useMemo, useState, useEffect } from 'react';
import { Filter, Plus, TrendingDown, Zap, Edit2, Trash2, Box, HelpCircle, X, Save, Server, Car, Building2, Code, Package } from 'lucide-react';
import { useFinanceStore } from '../financeStore';
import { differenceInMonths, parseISO, format } from 'date-fns';
import { APP_CURRENCY_SYMBOL } from '../config/currency';
import { apiUrl } from '../config/api';
import { useTranslation } from 'react-i18next';

export interface Asset {
  id: string;
  name: string;
  category: 'Основное средство' | 'НМА' | 'Запас';
  type: 'Транспорт' | 'Оборудование' | "Недвижимость" | 'ПО' | 'Прочее';
  acquisitionDate: string;
  initialCost: number;
  usefulLifeMonths: number;
  salvageValue: number;
  status: 'В эксплуатации' | 'На складе' | 'Списан' | 'Продан';
}

const Th: React.FC<{ children: React.ReactNode, align?: 'left'|'right'|'center', width?: string }> = ({ children, align = 'right', width }) => (
  <th style={{ width, padding: '8px 14px', textAlign: align, fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'transparent', whiteSpace: 'nowrap' }}>
    {children}
  </th>
);

const Td: React.FC<{ children: React.ReactNode, align?: 'left'|'right'|'center' }> = ({ children, align = 'right' }) => (
  <td style={{ padding: '8px 14px', textAlign: align, fontSize: 12, borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>
    {children}
  </td>
);

const AssetsPage: React.FC = () => {
  const { t } = useTranslation();
    const { assets, addAsset, updateAsset, deleteAsset } = useFinanceStore();
  const [error, setError] = useState<string | null>(null);
  
  const searchQuery = useFinanceStore(s => s.searchQuery);
  const [isAccruing, setIsAccruing] = useState(false);
  const [accrued, setAccrued] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  
  // Modals
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create'|'edit'>('create');
  const [formData, setFormData] = useState<Partial<Asset>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Filters
  const [filterTypes, setFilterTypes] = useState<Record<string, boolean>>({
    'Оборудование': true,
    'Транспорт': true,
    "Недвижимость": true,
    'ПО': true,
    'Прочее': true
  });
  
  const [filterStatuses, setFilterStatuses] = useState<Record<string, boolean>>({
    'В эксплуатации': true,
    'На складе': true,
    'Списан': false,
    'Продан': false
  });

  useEffect(() => {
    // Only handle keyboard shortcuts now since assets are fetched by financeStore
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'f' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        setSidebarOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setModalOpen(false);
        setConfirmDeleteId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const enrichedAssets = useMemo(() => {
    const today = new Date();
    return assets.map(asset => {
      const parsedDate = parseISO(asset.acquisitionDate);
      const elapsedRaw = differenceInMonths(today, parsedDate);
      const elapsed = Math.max(0, Math.min(elapsedRaw, asset.usefulLifeMonths));
      
      const depreciableAmount = asset.initialCost - asset.salvageValue;
      let monthlyDepreciation = 0;
      let accumulatedDepreciation = 0;
      let depreciationPercent = 0;
      let currentValue = asset.initialCost;

      if (depreciableAmount > 0 && asset.usefulLifeMonths > 0) {
        monthlyDepreciation = depreciableAmount / asset.usefulLifeMonths;
        accumulatedDepreciation = monthlyDepreciation * elapsed;
        currentValue = asset.initialCost - accumulatedDepreciation;
        depreciationPercent = Math.min(100, Math.max(0, (accumulatedDepreciation / depreciableAmount) * 100));
      }

      return {
        ...asset,
        elapsed,
        monthlyDepreciation,
        accumulatedDepreciation,
        currentValue,
        depreciationPercent
      };
    }).sort((a, b) => b.initialCost - a.initialCost);
  }, [assets]);

  const filteredAssets = useMemo(() => {
    return enrichedAssets.filter(a => {
      if (!filterTypes[a.type]) return false;
      if (!filterStatuses[a.status]) return false;
      
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!a.name.toLowerCase().includes(q) && !a.category.toLowerCase().includes(q) && !a.status.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [enrichedAssets, filterTypes, filterStatuses, searchQuery]);

  const { totalInitial, totalCurrent, totalMonthly, fullyDepreciated } = useMemo(() => {
    let tInitial = 0;
    let tCurrent = 0;
    let tMonthly = 0;
    let fDepreciated = 0;

    enrichedAssets.forEach(a => {
      tInitial += a.initialCost;
      if (a.status !== 'Списан') { 
        if (a.status !== 'Продан') {
           tCurrent += a.currentValue;
           tMonthly += a.monthlyDepreciation;
        }
      }
      if (a.depreciationPercent >= 100 && (a.status === 'В эксплуатации' || a.status === 'На складе')) {
        fDepreciated++;
      }
    });

    return { totalInitial: tInitial, totalCurrent: tCurrent, totalMonthly: tMonthly, fullyDepreciated: fDepreciated };
  }, [enrichedAssets]);

  const handleAccrueDepreciation = async () => {
    if (isAccruing || accrued) return;
    setIsAccruing(true);
    setError(null);
    try {
      const activeAssets = enrichedAssets.filter(a => (a.status === 'В эксплуатации' || a.status === 'На складе') && a.accumulatedDepreciation < (a.initialCost - a.salvageValue));
      
      const accountsRes = await fetch(apiUrl('/api/accounts'), {
         credentials: 'include'
      });
      const categoriesRes = await fetch(apiUrl('/api/categories'), {
         credentials: 'include'
      });
      const accounts = await accountsRes.json();
      const categories = await categoriesRes.json();
      
      const accId = accounts[0]?.id;
      const catId = categories.find((c: any) => c.name.toLowerCase().includes('амортизация'))?.id || categories[0]?.id;

      if (!accId || !catId) {
         setError('Не удалось найти счет или категорию для начисления амортизации');
         setIsAccruing(false);
         return;
      }

      // Batch logic simulation - ideally one endpoint, but here we process all
      await Promise.all(activeAssets.map(asset => 
        fetch(apiUrl('/api/transactions'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            date: new Date().toISOString().split('T')[0],
            amount: Math.round(asset.monthlyDepreciation),
            type: 'expense',
            categoryId: catId,
            accountId: accId,
            isPaidConfirmed: true,
            description: `Амортизация: ${asset.name} (ОС)`
          })
        })
      ));
      
      setAccrued(true);
      setTimeout(() => setAccrued(false), 4000);
      // Wait for store to update since we don't have a direct "fetchAssets" anymore
    } catch {
      setError('Ошибка при начислении амортизации');
    } finally {
      setIsAccruing(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setError(null);
    setIsSaving(true);
    
    try {
      const payload = {
        name: formData.name!,
        category: formData.category || 'Основное средство',
        type: formData.type || 'Оборудование',
        status: formData.status || 'В эксплуатации',
        acquisitionDate: formData.acquisitionDate || new Date().toISOString().split('T')[0],
        initialCost: Number(formData.initialCost || 0),
        usefulLifeMonths: Number(formData.usefulLifeMonths || 12),
        salvageValue: Number(formData.salvageValue || 0)
      } as Partial<Asset>;

      if (modalMode === 'create') {
        await addAsset(payload);
      } else if (formData.id) {
        await updateAsset(formData.id, payload);
      }

      setModalOpen(false);
    } catch {
      setError('Ошибка сохранения');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setError(null);
    setConfirmDeleteId(null);
    try {
      await deleteAsset(id);
    } catch {
      setError("Ошибка удаления");
    }
  };

  const openCreateModal = () => {
    setFormData({
      category: 'Основное средство',
      type: 'Оборудование',
      status: 'В эксплуатации',
      acquisitionDate: new Date().toISOString().split('T')[0],
      initialCost: 0,
      usefulLifeMonths: 12,
      salvageValue: 0
    });
    setModalMode('create');
    setModalOpen(true);
  };

  const openEditModal = (asset: Asset) => {
    // Only pick relevant fields for formData to avoid sending calculated fields back to API
    const { id, name, category, type, acquisitionDate, initialCost, usefulLifeMonths, salvageValue, status } = asset;
    setFormData({ id, name, category, type, acquisitionDate, initialCost, usefulLifeMonths, salvageValue, status });
    setModalMode('edit');
    setModalOpen(true);
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'Оборудование': return <Server size={18} color="#3b82f6" />;
      case 'Транспорт': return <Car size={18} color="#f59e0b" />;
      case "Недвижимость": return <Building2 size={18} color="#8b5cf6" />;
      case 'ПО': return <Code size={18} color="#10b981" />;
      default: return <Package size={18} color="#64748b" />;
    }
  };

  const getPercentColor = (percent: number) => {
    if (percent < 30) return '#10b981';
    if (percent < 70) return '#f59e0b';
    return '#ef4444';
  };

  const categoriesOverview = useMemo(() => [
    { label: 'Оборудование', color: '#3b82f6', assets: enrichedAssets.filter(a => a.type === 'Оборудование') },
    { label: 'Транспорт', color: '#f59e0b', assets: enrichedAssets.filter(a => a.type === 'Транспорт') },
    { label: 'ПО / НМА', color: '#10b981', assets: enrichedAssets.filter(a => a.type === 'ПО' || a.category === 'НМА') },
    { label: "Недвижимость", color: '#8b5cf6', assets: enrichedAssets.filter(a => a.type === "Недвижимость") },
  ].filter(c => c.assets.length > 0), [enrichedAssets]);

  const modalInp: React.CSSProperties = { width: '100%', padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, outline: 'none' };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: 'var(--bg-base)' }}>
      {/* Sidebar Filter */}
      {isSidebarOpen && (
      <div style={{ width: 240, flexShrink: 0, borderRight: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 44, padding: '0 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <Filter size={12} color="var(--text-muted)" />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{t("Фильтры", "Фильтры")}</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={16} /></button>
        </div>

        <div style={{ flex: 1, padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 8 }}>{t("Тип актива", "Тип актива")}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {['Оборудование', 'Транспорт', "Недвижимость", 'ПО', 'Прочее'].map(t => (
              <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={filterTypes[t]} onChange={e => setFilterTypes(p => ({...p, [t]: e.target.checked}))} style={{ accentColor: 'var(--color-primary)' }} /> {t}
              </label>
            ))}
          </div>

          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 8 }}>{t("Статус", "Статус")}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {['В эксплуатации', 'На складе', 'Списан', 'Продан'].map(s => (
              <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={filterStatuses[s]} onChange={e => setFilterStatuses(p => ({...p, [s]: e.target.checked}))} style={{ accentColor: 'var(--color-primary)' }} /> {s}
              </label>
            ))}
          </div>

          {/* Depreciation Engine Panel */}
          <div style={{ marginTop: 'auto', background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 10, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#8b5cf6', fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
              <Zap size={14} />  {t("Движок амортизации", "Движок амортизации")}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 12, lineHeight: 1.5 }}>
              
              {t("Начисляет амортизацию на все активные ОС за текущий месяц.", "Начисляет амортизацию на все активные ОС за текущий месяц.")}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>
              
              {t("К начислению:", "К начислению:")} <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{new Intl.NumberFormat('ru-RU').format(Math.round(totalMonthly))} {APP_CURRENCY_SYMBOL}{t("/мес", "/мес")}</span>
            </div>
            {fullyDepreciated > 0 && (
              <div style={{ fontSize: 11, color: '#f59e0b', marginBottom: 10 }}>
                ⚠️ {fullyDepreciated}  {t("актив(а) самортизированы", "актив(а) самортизированы")}
              </div>
            )}
            <button
              onClick={handleAccrueDepreciation}
              disabled={isAccruing || totalMonthly <= 0 || accrued}
              style={{ width: '100%', padding: '8px', background: accrued ? '#10b981' : 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: isAccruing || totalMonthly <= 0 || accrued ? 'not-allowed' : 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: (totalMonthly <= 0 || accrued) ? 0.6 : 1 }}
            >
              {isAccruing ? (
                <><span className="loading-spinner" />  {t("Начисляем...", "Начисляем...")}</>
              ) : accrued ? (
                '✅ Начислено!'
              ) : (
                <><TrendingDown size={14} />  {t("Начисление", "Начисление")}</>
              )}
            </button>
          </div>
        </div>
      </div>
      )}

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
        <div style={{ height: 44, padding: '0 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} style={{ background: isSidebarOpen ? 'var(--bg-elevated)' : 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <Filter size={12} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <span style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: -0.01 }}>{t("Имущество и Активы", "Имущество и Активы")}</span>
              <span title={t("Реестр инвентаря · CAPEX учёт · Амортизация ОС", "Реестр инвентаря · CAPEX учёт · Амортизация ОС")} style={{ cursor: 'pointer', display: 'flex', color: 'var(--text-muted)' }}>
                <HelpCircle size={13} />
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={openCreateModal} className="header-btn header-btn-primary">
              <Plus size={13} />  {t("Добавить актив", "Добавить актив")}
            </button>
          </div>
        </div>

        {error && (
          <div style={{ margin: '8px 24px 0', padding: '8px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: '#ef4444' }}>{error}</span>
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', padding: 2 }}><X size={14} /></button>
          </div>
        )}

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* KPI Row */}
        <div style={{ padding: '16px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '12px 16px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 4 }}>{t("Первоначальная", "Первоначальная")}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{new Intl.NumberFormat('ru-RU', { notation: 'compact' }).format(totalInitial)} {APP_CURRENCY_SYMBOL}</div>
          </div>
          <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 10, padding: '12px 16px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#3b82f6', marginBottom: 4, opacity: 0.8 }}>{t("Балансовая", "Балансовая")}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-primary)' }}>{new Intl.NumberFormat('ru-RU', { notation: 'compact' }).format(totalCurrent)} {APP_CURRENCY_SYMBOL}</div>
          </div>
          <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)', borderRadius: 10, padding: '12px 16px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#ef4444', marginBottom: 4, opacity: 0.8 }}>{t("Амортизация / мес.", "Амортизация / мес.")}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#ef4444' }}>{new Intl.NumberFormat('ru-RU', { notation: 'compact' }).format(Math.round(totalMonthly))} {APP_CURRENCY_SYMBOL}</div>
          </div>
          <div style={{ background: fullyDepreciated > 0 ? 'rgba(245,158,11,0.07)' : 'rgba(16,185,129,0.06)', border: `1px solid ${fullyDepreciated > 0 ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.15)'}`, borderRadius: 10, padding: '12px 16px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: fullyDepreciated > 0 ? '#f59e0b' : '#10b981', marginBottom: 4, opacity: 0.8 }}>{t("Требуют списания", "Требуют списания")}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: fullyDepreciated > 0 ? '#f59e0b' : '#10b981' }}>{fullyDepreciated}</div>
          </div>
        </div>

        {/* Category Mini-Overview */}
        {categoriesOverview.length > 0 && (
          <div style={{ padding: '0 24px 20px', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {categoriesOverview.map(cat => {
              const catTotal = cat.assets.reduce((s, a) => s + a.currentValue, 0);
              const maxVal = categoriesOverview.reduce((m, c) => Math.max(m, c.assets.reduce((s, a) => s + a.currentValue, 0)), 1);
              const pct = maxVal > 0 ? Math.round((catTotal / maxVal) * 100) : 0;
              return (
                <div key={cat.label} style={{ flex: 1, minWidth: 150, background: 'var(--bg-surface)', border: `1px solid var(--border-subtle)`, borderRadius: 10, padding: '10px 14px', borderTop: `3px solid ${cat.color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 12, color: cat.color, fontWeight: 700 }}>{cat.label}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 10, background: `${cat.color}22`, color: cat.color }}>{cat.assets.length}  {t("шт.", "шт.")}</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                    {new Intl.NumberFormat('ru-RU', { notation: 'compact' }).format(Math.round(catTotal))} {APP_CURRENCY_SYMBOL}
                  </div>
                  <div style={{ background: 'var(--bg-elevated)', height: 4, borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ background: cat.color, height: '100%', width: `${pct}%`, borderRadius: 2, transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Table */}
        <div style={{ padding: '0 24px 40px' }}>
          {filteredAssets.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <Box size={32} color="var(--text-muted)" />
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                {searchQuery ? `Ничего не найдено по «${searchQuery}»` : 'Нет имущества'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {searchQuery ? 'Попробуйте изменить параметры фильтра' : 'Поставьте на учет первое основное средство'}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button onClick={openCreateModal} style={{ padding: '6px 14px', background: 'var(--color-primary)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Plus size={12} />  {t("Добавить ОС", "Добавить ОС")}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ background: 'var(--bg-surface)', borderRadius: 12, border: '1px solid var(--border-default)', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}>
                <thead style={{ background: 'var(--bg-base)' }}>
                  <tr>
                    <Th align="left">{t("Объект учета", "Объект учета")}</Th>
                    <Th align="left">{t("Категория", "Категория")}</Th>
                    <Th align="left">{t("Статус", "Статус")}</Th>
                    <Th>{t("Постановка", "Постановка")}</Th>
                    <Th>{t("Перв. стоимость", "Перв. стоимость")}</Th>
                    <Th>{t("Накопл. аморт.", "Накопл. аморт.")}</Th>
                    <Th>{t("Балансовая", "Балансовая")}</Th>
                    <Th align="left" width="160px">{t("Износ", "Износ")}</Th>
                    <Th align="center" width="80px"> </Th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.map(asset => {
                    const isInactive = asset.status === 'Списан' || asset.status === 'Продан';
                    return (
                      <tr key={asset.id} style={{ transition: 'background 0.2s', opacity: isInactive ? 0.6 : 1 }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <Td align="left">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ padding: 8, background: 'var(--bg-elevated)', borderRadius: 8 }}>
                              {getIcon(asset.type)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{asset.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                                {asset.usefulLifeMonths}  {t("мес. • Ост:", "мес. • Ост:")} {asset.usefulLifeMonths - asset.elapsed}  {t("мес.", "мес.")}
                              </div>
                            </div>
                          </div>
                        </Td>
                        <Td align="left">
                          <span style={{ display: 'inline-flex', alignItems: 'center', background: 'var(--bg-elevated)', padding: '4px 8px', borderRadius: 6, fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                            {asset.category === 'Основное средство' ? 'Основные средства' : asset.category}
                          </span>
                        </Td>
                        <Td align="left">
                          {(() => {
                            const statusStyles: Record<string, { bg: string; color: string }> = {
                              'В эксплуатации': { bg: 'rgba(16,185,129,0.12)', color: '#10b981' },
                              'На складе': { bg: 'rgba(59,130,246,0.12)', color: '#3b82f6' },
                              'Списан': { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' },
                              'Продан': { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' },
                            };
                            const s = statusStyles[asset.status] || { bg: 'var(--bg-elevated)', color: 'var(--text-muted)' };
                            const statusLabel = asset.status === 'В эксплуатации' ? 'В экспл.' : asset.status;
                            return (
                              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 7px', borderRadius: 4, background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>
                                {statusLabel}
                              </span>
                            );
                          })()}
                        </Td>
                        <Td>{format(parseISO(asset.acquisitionDate), 'dd.MM.yyyy')}</Td>
                        <Td>
                          <span style={{ fontWeight: 600 }}>{new Intl.NumberFormat('ru-RU').format(asset.initialCost)}</span>
                        </Td>
                        <Td>
                          <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                            {new Intl.NumberFormat('ru-RU').format(Math.round(asset.accumulatedDepreciation))}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                            {new Intl.NumberFormat('ru-RU').format(Math.round(asset.monthlyDepreciation))}  {t("/ мес.", "/ мес.")}
                          </div>
                        </Td>
                        <Td>
                          {asset.status === 'Списан' ? (
                            <span style={{ color: 'var(--text-muted)', textDecoration: 'line-through', fontSize: 12 }}>{t("Списан", "Списан")}</span>
                          ) : asset.status === 'Продан' ? (
                            <span style={{ color: 'var(--text-muted)', textDecoration: 'line-through', fontSize: 12 }}>{t("Продан", "Продан")}</span>
                          ) : (
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{new Intl.NumberFormat('ru-RU').format(Math.round(asset.currentValue))}</span>
                          )}
                        </Td>
                        <Td align="left">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ flex: 1, height: 4, background: 'var(--bg-elevated)', borderRadius: 2, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${asset.depreciationPercent}%`, background: getPercentColor(asset.depreciationPercent), borderRadius: 2 }} />
                            </div>
                            <span style={{ fontSize: 12, color: 'var(--text-secondary)', width: 36, textAlign: 'right' }}>
                              {asset.depreciationPercent.toFixed(0)}%
                            </span>
                          </div>
                        </Td>
                        <Td align="center">
                          {confirmDeleteId === asset.id ? (
                            <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                              <button onClick={() => handleDelete(asset.id)} style={{ padding: '4px 8px', background: '#ef4444', border: 'none', borderRadius: 4, color: '#fff', fontSize: 11, cursor: 'pointer' }}>{t("Да", "Да")}</button>
                              <button onClick={() => setConfirmDeleteId(null)} style={{ padding: '4px 8px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 4, color: 'var(--text-primary)', fontSize: 11, cursor: 'pointer' }}>{t("Отозвать", "Отозвать")}</button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                               <button onClick={() => openEditModal(asset)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} title={t("Редактировать", "Редактировать")}><Edit2 size={14}/></button>
                               <button onClick={() => setConfirmDeleteId(asset.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }} title={t("Удалить", "Удалить")}><Trash2 size={14}/></button>
                            </div>
                          )}
                        </Td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 480, background: 'var(--bg-surface)', borderRadius: 12, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                {modalMode === 'create' ? 'Постановка на учет ОС' : 'Редактирование актива'}
              </h2>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            
            <form onSubmit={handleSave} style={{ overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{t("Наименование *", "Наименование *")}</label>
                <input required type="text" style={modalInp} value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder={t("Например: Сервер Dell R740", "Например: Сервер Dell R740")} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{t("Тип", "Тип")}</label>
                  <select style={modalInp} value={formData.type || 'Оборудование'} onChange={e => setFormData({...formData, type: e.target.value as any})}>
                    <option value={t("Оборудование", "Оборудование")}>{t("Оборудование", "Оборудование")}</option>
                    <option value={t("Транспорт", "Транспорт")}>{t("Транспорт", "Транспорт")}</option>
                    <option value={t("Недвижимость", "Недвижимость")}>{t("Недвижимость", "Недвижимость")}</option>
                    <option value={t("ПО", "ПО")}>{t("ПО", "ПО")}</option>
                    <option value={t("Прочее", "Прочее")}>{t("Прочее", "Прочее")}</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{t("Категория", "Категория")}</label>
                  <select style={modalInp} value={formData.category || 'Основное средство'} onChange={e => setFormData({...formData, category: e.target.value as any})}>
                    <option value={t("Основное средство", "Основное средство")}>{t("Основное средство", "Основное средство")}</option>
                    <option value={t("НМА", "НМА")}>{t("НМА", "НМА")}</option>
                    <option value={t("Запас", "Запас")}>{t("Запас", "Запас")}</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{t("Статус", "Статус")}</label>
                  <select style={modalInp} value={formData.status || 'В эксплуатации'} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                    <option value={t("В эксплуатации", "В эксплуатации")}>{t("В эксплуатации", "В эксплуатации")}</option>
                    <option value={t("На складе", "На складе")}>{t("На складе", "На складе")}</option>
                    <option value={t("Списан", "Списан")}>{t("Списан", "Списан")}</option>
                    <option value={t("Продан", "Продан")}>{t("Продан", "Продан")}</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{t("Дата постановки", "Дата постановки")}</label>
                  <input required type="date" style={modalInp} value={formData.acquisitionDate || ''} onChange={e => setFormData({...formData, acquisitionDate: e.target.value})} />
                </div>
              </div>

              <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{t("Первоначальная стоимость *", "Первоначальная стоимость *")}</label>
                  <input required type="number" step="0.01" style={modalInp} value={formData.initialCost ?? ''} onChange={e => setFormData({...formData, initialCost: Number(e.target.value)})} placeholder="0" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{t("Срок полезного использования (мес) *", "Срок полезного использования (мес) *")}</label>
                  <input required type="number" style={modalInp} value={formData.usefulLifeMonths ?? ''} onChange={e => setFormData({...formData, usefulLifeMonths: Number(e.target.value)})} placeholder="12" />
                </div>
              </div>
              
              <div>
                 <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{t("Ликвидационная стоимость", "Ликвидационная стоимость")}</label>
                 <input type="number" step="0.01" style={modalInp} value={formData.salvageValue ?? ''} onChange={e => setFormData({...formData, salvageValue: Number(e.target.value)})} placeholder="0" />
                 <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{t("Стоимость, ниже которой актив не амортизируется", "Стоимость, ниже которой актив не амортизируется")}</div>
              </div>

              <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: 12, position: 'sticky', bottom: 0, background: 'var(--bg-surface)', margin: '16px -20px -20px' }}>
                <button type="button" onClick={() => setModalOpen(false)} style={{ padding: '8px 16px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  
                  {t("Отозвать", "Отозвать")}
                </button>
                <button type="submit" disabled={isSaving} className="header-btn header-btn-primary" style={{ padding: '8px 16px', height: 'auto', opacity: isSaving ? 0.7 : 1, cursor: isSaving ? 'not-allowed' : 'pointer' }}>
                  <Save size={14} /> {isSaving ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
        )}
    </div>
  );
};

export default AssetsPage;
