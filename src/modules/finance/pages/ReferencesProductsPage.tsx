import React, { useState, useMemo, useEffect } from 'react';
import { Filter, Plus, Box, ShieldCheck, HelpCircle, X, Edit2, Archive, Trash2, ArrowUp, ArrowDown, Save } from 'lucide-react';
import { APP_CURRENCY_SYMBOL } from '../config/currency';
import { useFinanceStore } from '../financeStore';

import type { Product } from '../financeStore';
import { useTranslation } from 'react-i18next';

export default function ReferencesProductsPage() {
  const { t } = useTranslation();
    const { products, addProduct, updateProduct, deleteProduct } = useFinanceStore();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  
  // Filters
  const [filterTypes, setFilterTypes] = useState<Record<string, boolean>>({ 'Товар': true, 'Услуга': true });
  const [filterStatus, setFilterStatus] = useState<string>('Активные'); // 'Все', 'Активные', 'В архиве'
  const [filterStock, setFilterStock] = useState<Record<string, boolean>>({ 'inStock': false, 'lowStock': false });

  // Sorting
  const [sortField, setSortField] = useState<keyof Product>('name');
  const [sortAsc, setSortAsc] = useState(true);

  // Form state
  const [formData, setFormData] = useState<Partial<Product>>({});
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Keyboard shortcuts only, products are handled by store
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'f' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        setSidebarOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setSelectedProductId(null);
        setModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);


  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setError(null);
    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        price: Number(formData.price || 0),
        costPrice: Number(formData.costPrice || 0),
        vatRate: Number(formData.vatRate || 0),
        stockBalance: Number(formData.stockBalance || 0),
        type: formData.type || 'Товар',
        category: formData.category || (formData.type === 'Товар' ? 'Товары' : 'Услуги'),
        status: formData.status || 'Активные',
        unit: formData.unit || 'шт.',
        sku: formData.sku || `SKU-${Math.floor(Math.random() * 10000)}`
      } as Partial<Product>;

      if (modalMode === 'create') {
        await addProduct(payload);
        // We can't immediately get the id back from addProduct right now since it doesn't return anything
      } else if (formData.id) {
        await updateProduct(formData.id, payload);
        setSelectedProductId(formData.id);
      }

      setModalOpen(false);
    } catch {
      setError("Нет соединения с сервером");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setError(null);
    setConfirmDeleteId(null);
    try {
      await deleteProduct(id);
      if (selectedProductId === id) setSelectedProductId(null);
    } catch {
      setError("Нет соединения с сервером");
    }
  };

  const handleArchive = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'В архиве' ? 'Активные' : 'В архиве';
    setError(null);
    try {
      await updateProduct(id, { status: newStatus });
    } catch {
      setError("Нет соединения с сервером");
    }
  };

  const openCreateModal = () => {
    setFormData({
      type: 'Товар',
      unit: 'шт.',
      vatRate: 20,
      price: 0,
      costPrice: 0,
      stockBalance: 0,
      status: 'Активные'
    });
    setModalMode('create');
    setModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setFormData(product);
    setModalMode('edit');
    setModalOpen(true);
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (!filterTypes[p.type]) return false;
      if (filterStatus !== 'Все' && p.status !== filterStatus) return false;
      
      if (filterStock.inStock && p.type === 'Товар' && p.stockBalance <= 0) return false;
      if (filterStock.lowStock && p.type === 'Товар' && (p.stockBalance >= 10 || p.stockBalance <= 0)) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q)) return false;
      }
      return true;
    }).sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [products, filterTypes, filterStatus, filterStock, searchQuery, sortField, sortAsc]);

  const { totalProducts, activeCount, totalStockValue, avgMargin } = useMemo(() => {
    let stockValue = 0;
    let totalMarginPct = 0;
    let marginCount = 0;
    
    products.forEach(p => {
      if (p.type === 'Товар' && p.stockBalance > 0 && p.costPrice > 0) {
        stockValue += (p.stockBalance * p.costPrice);
      }
      if (p.price > 0 && p.costPrice > 0) {
        const margin = ((p.price - p.costPrice) / p.price) * 100;
        totalMarginPct += margin;
        marginCount++;
      }
    });
    
    return { 
      totalProducts: products.length,
      activeCount: products.filter(p => p.status === 'Активные').length,
      totalStockValue: stockValue,
      avgMargin: marginCount > 0 ? (totalMarginPct / marginCount) : 0
    };
  }, [products]);

  const toggleSort = (field: keyof Product) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const SortIcon = ({ field }: { field: keyof Product }) => {
    const { t } = useTranslation(); void t;
    if (sortField !== field) return null;
    return sortAsc ? <ArrowUp size={12} /> : <ArrowDown size={12} />;
  };

  const selectedProduct = products.find(p => p.id === selectedProductId);

  const tdS: React.CSSProperties = { padding: '8px 14px', fontSize: 12, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)', verticalAlign: 'middle' };
  const thS: React.CSSProperties = { padding: '8px 14px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' };
  const modalInp: React.CSSProperties = { width: '100%', padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, outline: 'none' };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: 'var(--bg-base)' }}>
      {/* Sidebar */}
      {isSidebarOpen && (
        <div style={{ width: 220, flexShrink: 0, borderRight: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: 44, padding: '0 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <Filter size={12} color="var(--text-muted)" />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{t("Фильтры", "Фильтры")}</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}><X size={16} /></button>
          </div>
          <div style={{ flex: 1, padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 8 }}>{t("Тип", "Тип")}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)', fontSize: 12, cursor: 'pointer' }}>
                  <input type="checkbox" checked={filterTypes['Товар']} onChange={e => setFilterTypes(p => ({...p, 'Товар': e.target.checked}))} style={{ accentColor: 'var(--color-primary)' }} />  {t("Товары", "Товары")}
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)', fontSize: 12, cursor: 'pointer' }}>
                  <input type="checkbox" checked={filterTypes['Услуга']} onChange={e => setFilterTypes(p => ({...p, 'Услуга': e.target.checked}))} style={{ accentColor: 'var(--color-primary)' }} />  {t("Услуги", "Услуги")}
                </label>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 8 }}>{t("Статус", "Статус")}</div>
              <select 
                value={filterStatus} 
                onChange={e => setFilterStatus(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid var(--border-default)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: 12, outline: 'none' }}
              >
                <option value={t("Все", "Все")}>{t("Все статусы", "Все статусы")}</option>
                <option value={t("Активные", "Активные")}>{t("Активные", "Активные")}</option>
                <option value={t("В архиве", "В архиве")}>{t("В архиве", "В архиве")}</option>
              </select>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 8 }}>{t("Наличие (Товары)", "Наличие (Товары)")}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)', fontSize: 12, cursor: 'pointer' }}>
                  <input type="checkbox" checked={filterStock.inStock} onChange={e => setFilterStock(p => ({...p, inStock: e.target.checked}))} style={{ accentColor: 'var(--color-primary)' }} />  {t("Только в наличии", "Только в наличии")}
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)', fontSize: 12, cursor: 'pointer' }}>
                  <input type="checkbox" checked={filterStock.lowStock} onChange={e => setFilterStock(p => ({...p, lowStock: e.target.checked}))} style={{ accentColor: 'var(--color-primary)' }} />  {t("Заканчивается (&lt;10 шт)", "Заканчивается (&lt;10 шт)")}
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main List */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header 44px */}
        <div style={{ height: 44, padding: '0 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} style={{ background: isSidebarOpen ? 'var(--bg-elevated)' : 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <Filter size={12} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <span style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: -0.01 }}>{t("Товары и Услуги", "Товары и Услуги")}</span>
              <span title={t("Единый справочник и складской учет", "Единый справочник и складской учет")} style={{ cursor: 'pointer', display: 'flex', color: 'var(--text-muted)' }}>
                <HelpCircle size={13} />
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={openCreateModal} className="header-btn header-btn-primary">
              <Plus size={12} />  {t("Добавить позицию", "Добавить позицию")}
            </button>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{ margin: '8px 24px 0', padding: '8px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: '#ef4444' }}>{error}</span>
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', padding: 2 }}><X size={14} /></button>
          </div>
        )}

        {/* KPI metrics strip */}
        <div style={{ padding: '12px 24px 0', display: 'flex', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
            <ShieldCheck size={13} color="var(--text-muted)" />
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t("Всего:", "Всего:")}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{totalProducts}</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 2 }}>{t("• активных:", "• активных:")} {activeCount}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 8 }}>
            <Box size={13} color="#3b82f6" />
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t("Капитализация склада:", "Капитализация склада:")}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)' }}>{new Intl.NumberFormat('ru-RU').format(totalStockValue)} {APP_CURRENCY_SYMBOL}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t("Средняя маржа:", "Средняя маржа:")}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>{avgMargin.toFixed(1)}%</span>
          </div>
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflow: 'auto', padding: '12px 24px 24px' }}>
          {filteredProducts.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <Box size={32} color="var(--text-muted)" />
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                {searchQuery ? `Ничего не найдено по «${searchQuery}»` : 'Нет позиций'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {searchQuery ? 'Попробуйте изменить запрос' : 'Добавьте первую позицию в справочник'}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} style={{ padding: '6px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12, cursor: 'pointer' }}>
                    
                    {t("Сбросить поиск", "Сбросить поиск")}
                  </button>
                )}
                <button onClick={openCreateModal} style={{ padding: '6px 14px', background: 'var(--color-primary)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Plus size={12} />  {t("Добавить позицию", "Добавить позицию")}
                </button>
              </div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}>
              <thead>
                <tr>
                  <th style={thS} onClick={() => toggleSort('name')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>{t("Наименование", "Наименование")} <SortIcon field="name" /></div>
                  </th>
                  <th style={thS} onClick={() => toggleSort('sku')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>{t("Артикул", "Артикул")} <SortIcon field="sku" /></div>
                  </th>
                  <th style={{ ...thS, textAlign: 'right' }} onClick={() => toggleSort('price')}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>{t("Цена", "Цена")} <SortIcon field="price" /></div>
                  </th>
                  <th style={{ ...thS, textAlign: 'right' }} onClick={() => toggleSort('stockBalance')}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>{t("Остаток", "Остаток")} <SortIcon field="stockBalance" /></div>
                  </th>
                  <th style={thS} onClick={() => toggleSort('status')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>{t("Статус", "Статус")} <SortIcon field="status" /></div>
                  </th>
                  <th style={{ ...thS, textAlign: 'right' }}>{t("Маржа", "Маржа")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(p => (
                  <tr 
                    key={p.id} 
                    onClick={() => setSelectedProductId(p.id)}
                    style={{ 
                      cursor: 'pointer', 
                      background: selectedProductId === p.id ? 'var(--bg-hover)' : 'transparent',
                      opacity: p.status === 'В архиве' ? 0.6 : 1,
                      transition: 'background 0.1s'
                    }}
                    onMouseEnter={e => { if (selectedProductId !== p.id) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                    onMouseLeave={e => { if (selectedProductId !== p.id) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td style={tdS}>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.type} • {p.category}</div>
                    </td>
                    <td style={tdS}>
                      <span style={{ fontSize: 12, fontFamily: 'monospace', background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: 4, color: 'var(--text-secondary)' }}>
                        {p.sku || '—'}
                      </span>
                    </td>
                    <td style={{ ...tdS, textAlign: 'right' }}>
                      <span style={{ fontWeight: 600 }}>{new Intl.NumberFormat('ru-RU').format(p.price)}</span>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t("НДС", "НДС")} {p.vatRate}%</div>
                    </td>
                    <td style={{ ...tdS, textAlign: 'right' }}>
                      {p.type === 'Товар' ? (
                        <span style={{ fontWeight: 600, color: p.stockBalance > 0 ? 'var(--text-primary)' : 'var(--color-danger)' }}>
                          {p.stockBalance} {p.unit}
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>N/A</span>
                      )}
                    </td>
                    <td style={tdS}>
                      <span style={{ 
                        fontSize: 11, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                        background: p.status === 'Активные' ? 'rgba(16,185,129,0.1)' : 'var(--bg-elevated)',
                        color: p.status === 'Активные' ? '#10b981' : 'var(--text-muted)'
                      }}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ ...tdS, textAlign: 'right' }}>
                      {p.price > 0 && p.costPrice > 0 ? (() => {
                        const m = ((p.price - p.costPrice) / p.price) * 100;
                        const c = m > 30 ? '#10b981' : m > 10 ? '#f59e0b' : '#ef4444';
                        return <span style={{ fontSize: 12, fontWeight: 700, color: c }}>{m.toFixed(1)}%</span>;
                      })() : <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Detail Panel */}
      {selectedProduct && (
        <div style={{ width: 320, flexShrink: 0, borderLeft: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 24px rgba(0,0,0,0.05)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: 4 }}>
                {selectedProduct.name}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: 4, color: 'var(--text-secondary)' }}>{selectedProduct.type}</span>
                <span style={{ fontSize: 11, background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: 4, color: 'var(--text-secondary)' }}>{selectedProduct.category}</span>
              </div>
            </div>
            <button onClick={() => setSelectedProductId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
              <X size={18} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Status */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t("Статус", "Статус")}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: selectedProduct.status === 'Активные' ? '#10b981' : 'var(--text-muted)' }}>
                {selectedProduct.status}
              </span>
            </div>

            {/* SKU */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t("Артикул", "Артикул")}</span>
              <span style={{ fontSize: 13, fontFamily: 'monospace', color: 'var(--text-primary)' }}>{selectedProduct.sku || '—'}</span>
            </div>

            <div style={{ height: 1, background: 'var(--border-subtle)' }} />

            {/* Pricing */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>{t("Ценообразование", "Ценообразование")}</div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t("Цена без НДС", "Цена без НДС")}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{new Intl.NumberFormat('ru-RU').format(selectedProduct.price)} {APP_CURRENCY_SYMBOL}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t("Ставка НДС", "Ставка НДС")}</span>
                <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{selectedProduct.vatRate}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t("Итого с НДС", "Итого с НДС")}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#10b981' }}>
                  {new Intl.NumberFormat('ru-RU').format(selectedProduct.price * (1 + selectedProduct.vatRate/100))} {APP_CURRENCY_SYMBOL}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t("Себестоимость", "Себестоимость")}</span>
                <span style={{ fontSize: 13, color: 'var(--color-danger)' }}>{new Intl.NumberFormat('ru-RU').format(selectedProduct.costPrice)} {APP_CURRENCY_SYMBOL}</span>
              </div>
              
              {/* Margin Calculation */}
              {selectedProduct.price > 0 && selectedProduct.costPrice > 0 && (() => {
                const margin = ((selectedProduct.price - selectedProduct.costPrice) / selectedProduct.price) * 100;
                const mColor = margin > 30 ? '#10b981' : margin > 10 ? '#f59e0b' : '#ef4444';
                return (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 6, marginTop: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{t("Маржинальность", "Маржинальность")}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: mColor }}>{margin.toFixed(1)}%</span>
                  </div>
                );
              })()}
            </div>

            {selectedProduct.type === 'Товар' && (
              <>
                <div style={{ height: 1, background: 'var(--border-subtle)' }} />
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>{t("Склад", "Склад")}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t("Текущий остаток", "Текущий остаток")}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: selectedProduct.stockBalance > 0 ? 'var(--text-primary)' : 'var(--color-danger)' }}>
                      {selectedProduct.stockBalance} {selectedProduct.unit}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t("Капитализация", "Капитализация")}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-primary)' }}>
                      {new Intl.NumberFormat('ru-RU').format(selectedProduct.stockBalance * selectedProduct.costPrice)} {APP_CURRENCY_SYMBOL}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          <div style={{ padding: 16, borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 8 }}>
            <button onClick={() => openEditModal(selectedProduct)} style={{ flex: 1, height: 32, background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Edit2 size={13} />  {t("Изменить", "Изменить")}
            </button>
            <button 
              onClick={() => handleArchive(selectedProduct.id, selectedProduct.status)} 
              style={{ flex: 1, height: 32, background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <Archive size={13} /> {selectedProduct.status === 'Активные' ? 'В архив' : 'Разархивировать'}
            </button>
              {confirmDeleteId === selectedProduct.id ? (
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => handleDelete(selectedProduct.id)} style={{ height: 32, padding: '0 10px', background: '#ef4444', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{t("Удалить", "Удалить")}</button>
                  <button onClick={() => setConfirmDeleteId(null)} style={{ height: 32, padding: '0 10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 6, color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>{t("Отозвать", "Отозвать")}</button>
                </div>
              ) : (
                <button onClick={() => setConfirmDeleteId(selectedProduct.id)} style={{ width: 32, height: 32, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Trash2 size={14} />
                </button>
              )}
          </div>

        </div>
      )}

      {/* Modal Overlay */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 480, background: 'var(--bg-surface)', borderRadius: 12, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                {modalMode === 'create' ? 'Новая позиция' : 'Редактирование позиции'}
              </h2>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            
            <form onSubmit={handleSave} style={{ overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', gap: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-primary)' }}>
                  <input type="radio" name="ptype" checked={formData.type === 'Товар'} onChange={() => setFormData({...formData, type: 'Товар'})} />  {t("Товар", "Товар")}
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-primary)' }}>
                  <input type="radio" name="ptype" checked={formData.type === 'Услуга'} onChange={() => setFormData({...formData, type: 'Услуга'})} />  {t("Услуга", "Услуга")}
                </label>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{t("Наименование *", "Наименование *")}</label>
                <input required type="text" style={modalInp} value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder={t("Например: Ноутбук Lenovo", "Например: Ноутбук Lenovo")} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{t("Артикул (SKU)", "Артикул (SKU)")}</label>
                  <input type="text" style={modalInp} value={formData.sku || ''} onChange={e => setFormData({...formData, sku: e.target.value})} placeholder="LEN-123" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{t("Ед. измерения", "Ед. измерения")}</label>
                  <input type="text" style={modalInp} value={formData.unit || ''} onChange={e => setFormData({...formData, unit: e.target.value})} placeholder={t("шт, кг, час", "шт, кг, час")} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{t("Категория", "Категория")}</label>
                  <input type="text" style={modalInp} value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value})} placeholder={t("Электроника", "Электроника")} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{t("Статус", "Статус")}</label>
                  <select style={modalInp} value={formData.status || 'Активные'} onChange={e => setFormData({...formData, status: e.target.value as 'Активные' | 'В архиве'})}>
                    <option value={t("Активные", "Активные")}>{t("Активные", "Активные")}</option>
                    <option value={t("В архиве", "В архиве")}>{t("В архиве", "В архиве")}</option>
                  </select>
                </div>
              </div>

              <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{t("Цена (без НДС) *", "Цена (без НДС) *")}</label>
                  <input required type="number" step="0.01" style={modalInp} value={formData.price ?? ''} onChange={e => setFormData({...formData, price: Number(e.target.value)})} placeholder="0.00" />
                  {(formData.price ?? 0) > 0 && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                      
                      {t("С НДС:", "С НДС:")} <strong style={{ color: '#10b981' }}>{new Intl.NumberFormat('ru-RU').format(Number(formData.price) * (1 + Number(formData.vatRate ?? 20) / 100))}</strong>
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{t("Ставка НДС (%)", "Ставка НДС (%)")}</label>
                  <select style={modalInp} value={formData.vatRate ?? 20} onChange={e => setFormData({...formData, vatRate: Number(e.target.value)})}>
                    <option value="20">20%</option>
                    <option value="12">12%</option>
                    <option value="10">10%</option>
                    <option value="0">{t("0% (Без НДС)", "0% (Без НДС)")}</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{t("Себестоимость", "Себестоимость")}</label>
                  <input type="number" step="0.01" style={modalInp} value={formData.costPrice ?? ''} onChange={e => setFormData({...formData, costPrice: Number(e.target.value)})} placeholder="0.00" />
                </div>
                {formData.type === 'Товар' && (
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{t("Остаток", "Остаток")}</label>
                    <input type="number" step="0.01" style={modalInp} value={formData.stockBalance ?? ''} onChange={e => setFormData({...formData, stockBalance: Number(e.target.value)})} placeholder="0" />
                  </div>
                )}
              </div>

              <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: 12, position: 'sticky', bottom: 0, background: 'var(--bg-surface)' }}>
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
}
