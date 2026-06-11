import { translateToUz } from '../../../lib/translate';
import React, { useState, } from 'react';
import { AccountsTable } from '../components/AccountsTable';
import { Filter, Plus, Wallet, Link as LinkIcon, RefreshCw, X, ShieldCheck, PiggyBank } from 'lucide-react';
import { useFinanceStore } from '../financeStore';
import { APP_CURRENCY } from '../config/currency';
import { useTranslation } from 'react-i18next';

const ReferencesAccountsPage: React.FC = () => {
  const { t } = useTranslation();
    const [isSidebarOpen, setSidebarOpen] = useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'f' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        setSidebarOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  const { accounts, funds, categories, exchangeRates, addTransaction, addFund, deleteFund, transferToFund, addAccount, updateExchangeRate } = useFinanceStore();
  const [searchQuery] = useState('');
  const [isRevalModalOpen, setRevalModalOpen] = useState(false);
  const [isFundModalOpen, setFundModalOpen] = useState(false);
  const [isNewAccountModalOpen, setNewAccountModalOpen] = useState(false);
  // Local editable exchange rates (from DB, saved back on submit)
  const [localRates, setLocalRates] = useState<Record<string, number>>({});
  const [newFundName, setNewFundName] = useState('');
  const [newFundTarget, setNewFundTarget] = useState('');
  const [newFundType, setNewFundType] = useState<'reserve'|'savings'>('reserve');
  const [newFundAccountId, setNewFundAccountId] = useState('');
  const [fundTransferMap, setFundTransferMap] = useState<Record<string, string>>({});
  // New account state
  const [newAccName, setNewAccName] = useState('');
  const [newAccBalance, setNewAccBalance] = useState('');
  const [newAccCurrency, setNewAccCurrency] = useState(APP_CURRENCY);
  const [newAccType, setNewAccType] = useState<'Наличный'|'Безналичный'|'Карта'|'Крипто'>('Безналичный');
  const [newAccNetwork, setNewAccNetwork] = useState<'TRC20'|'ERC20'|'BEP20'>('TRC20');
  const [newAccAddress, setNewAccAddress] = useState('');
  const [newAccBankAccount, setNewAccBankAccount] = useState('');
  const [newAccNameUz, setNewAccNameUz] = useState('');
  const [accTranslating, setAccTranslating] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['Наличный', 'Безналичный', 'Карта', 'Крипто']);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  // Build rate map from DB (fallback to 1 for base currency)
  const rateMap: Record<string, number> = Object.fromEntries(
    exchangeRates.map(r => [r.currency, r.rate])
  );
  // Use localRates overrides (while reval modal is open)
  const effectiveRates = { ...rateMap, ...localRates };

  const fcb = accounts.filter(a => a.currency !== APP_CURRENCY);
  const totalBase = accounts.reduce((sum, a) =>
    sum + (a.currency === APP_CURRENCY ? a.balance : a.balance * (effectiveRates[a.currency] ?? 1)), 0);
  const totalReserved = funds.reduce((sum, f) => 
    sum + (f.currency === APP_CURRENCY ? f.currentBalance : f.currentBalance * (effectiveRates[f.currency] ?? 1)), 0);
  const freeCash = totalBase - totalReserved;

  const handleRevaluate = async () => {
    const exchangeCat = categories.find(c => c.type === 'income');
    // Save rates to DB first
    await Promise.all(
      Object.entries(localRates).map(([cur, rate]) => updateExchangeRate(cur, rate))
    );
    fcb.forEach(acc => {
      const prevRate = rateMap[acc.currency] ?? 1;
      const newRate = effectiveRates[acc.currency] ?? 1;
      const diff = Math.round(acc.balance * (newRate - prevRate));
      if (diff !== 0) addTransaction({
        date: new Date().toISOString().split('T')[0],
        amount: Math.abs(diff),
        type: diff > 0 ? 'income' : 'expense',
        categoryId: exchangeCat?.id,
        accountId: acc.id,
        isPaidConfirmed: true,
        description: `Курсовая разница ${acc.name}: ${prevRate} → ${newRate} ${APP_CURRENCY}/${acc.currency}`
      });
    });
    setLocalRates({});
    setRevalModalOpen(false);
    showToast('Курсовые разницы зафиксированы и курсы обновлены в БД');
  };

  const handleCreateFund = () => {
    if (!newFundName) return;
    const linkedAcc = accounts.find(a => a.id === newFundAccountId);
    const fundCurrency = linkedAcc ? linkedAcc.currency : APP_CURRENCY;
    addFund({ name: newFundName, targetAmount: parseFloat(newFundTarget) || 0, currentBalance: 0, currency: fundCurrency, type: newFundType, accountId: newFundAccountId || null });
    setNewFundName('');
    setNewFundTarget('');
    setFundModalOpen(false);
    showToast('Сейф успешно создан');
  };

  const handleCreateAccount = () => {
    if (!newAccName) return;
    addAccount({
      name: newAccName,
      nameUz: newAccNameUz || undefined,
      balance: parseFloat(newAccBalance) || 0,
      currency: newAccType === 'Крипто' ? 'USDT' : newAccCurrency,
      type: newAccType,
      bankName: newAccBankAccount || undefined,
      blockchainNetwork: newAccType === 'Крипто' ? newAccNetwork : undefined,
      publicAddress: newAccType === 'Крипто' ? newAccAddress : undefined,
    });
    setNewAccName('');
    setNewAccBalance('');
    setNewAccBankAccount('');
    setNewAccountModalOpen(false);
    showToast('Счёт успешно создан');
  };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: 'var(--bg-base)' }}>
      {toast && <div style={{ position: 'fixed', bottom: 24, right: 24, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '10px 16px', fontSize: 13, color: 'var(--text-primary)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', zIndex: 9999, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}><span style={{ color: '#10b981' }}>✓</span> {toast}</div>}

      {/* Sidebar Filter */}
      {isSidebarOpen && (
      <div style={{ width: 220, flexShrink: 0, borderRight: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 44, padding: '0 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <Filter size={12} color="var(--text-muted)" />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{t("Фильтры", "Фильтры")}</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
        </div>
        <div style={{ flex: 1, padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t("Тип счёта", "Тип счёта")}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(['Наличный', 'Безналичный', 'Карта', 'Крипто'] as const).map(t => (
              <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)', fontSize: 12, cursor: 'pointer' }}>
                <input type="checkbox"
                  checked={selectedTypes.includes(t)}
                  onChange={e => setSelectedTypes(prev => e.target.checked ? [...prev, t] : prev.filter(x => x !== t))}
                  style={{ accentColor: 'var(--color-primary)' }}
                /> {t}
              </label>
            ))}
          </div>
          <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 16, paddingTop: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t("Статус", "Статус")}</div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)', fontSize: 12, cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked style={{ accentColor: 'var(--color-primary)' }} />  {t("Активные", "Активные")}
            </label>
          </div>
        </div>
      </div>
      )}

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflowY: 'auto' }}>

        {/* Header 44px */}
        <div style={{ height: 44, padding: '0 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} style={{ background: isSidebarOpen ? 'var(--bg-card)' : 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <Filter size={12} />
            </button>
            <span style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: -0.01 }}>{t("Мои счета", "Мои счета")}</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0 10px', height: 28, background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 6, fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <LinkIcon size={12} />  {t("Интеграции", "Интеграции")}
            </button>
            <button onClick={() => setRevalModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0 10px', height: 28, background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 6, fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <RefreshCw size={12} />  {t("Курс. разницы", "Курс. разницы")}
            </button>
            <button onClick={() => setNewAccountModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0 12px', height: 28, background: 'var(--color-primary)', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer' , flexShrink: 0, whiteSpace: 'nowrap' }}>
              <Plus size={11} />  {t("Создать Счет", "Создать Счет")}
            </button>
          </div>
        </div>

        {/* Global Balance Widget */}
        <div style={{ padding: '12px 24px' }}>
          <div style={{ background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: 12, padding: '20px', display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.2)', width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={24} color="#3b82f6" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 4 }}>{t("Свободные средства (Free Cash Balance)", "Свободные средства (Free Cash Balance)")}</div>
              <div style={{ color: freeCash >= 0 ? '#10b981' : '#ef4444', fontSize: 24, fontWeight: 700 }}>{new Intl.NumberFormat('ru-RU').format(freeCash)} <span style={{ color: 'var(--text-secondary)', fontSize: 16 }}> {APP_CURRENCY} </span></div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 13 }}>
              <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{t("Итого на счетах:", "Итого на счетах:")} <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{new Intl.NumberFormat('ru-RU').format(totalBase)}  {t("сум", "сум")}</span></div>
              <div style={{ color: 'var(--text-muted)' }}>{t("В сейфах:", "В сейфах:")} <span style={{ color: '#f59e0b', fontWeight: 600 }}>{new Intl.NumberFormat('ru-RU').format(totalReserved)}  {t("сум", "сум")}</span></div>
            </div>
          </div>
        </div>

        {/* Funds (Safes) Panel */}
        <div style={{ padding: '0 24px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <ShieldCheck size={16} color="#f59e0b" />
              <span style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 600 }}>{t("Сейфы (резервные фонды)", "Сейфы (резервные фонды)")}</span>
            </div>
            <button onClick={() => setFundModalOpen(true)} style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', padding: '5px 12px', borderRadius: 6, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <Plus size={14} />  {t("Новый сейф", "Новый сейф")}
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
            {funds.map(f => {
              const pct = f.targetAmount > 0 ? Math.min((f.currentBalance / f.targetAmount) * 100, 100) : 0;
              const transfer = parseFloat(fundTransferMap[f.id] || '0');
              
              // Determine max available based on linked account or global free cash
              let maxAvailable = freeCash;
              let linkedAccountName = null;
              if (f.accountId) {
                const linkedAcc = accounts.find(a => a.id === f.accountId);
                if (linkedAcc) {
                  linkedAccountName = linkedAcc.name;
                  const otherLinkedFundsBalance = funds.filter(x => x.accountId === f.accountId && x.id !== f.id).reduce((sum, x) => sum + x.currentBalance, 0);
                  maxAvailable = linkedAcc.balance - otherLinkedFundsBalance - f.currentBalance; // Remaining free money in THAT specific account
                }
              }

              const isAddDisabled = isNaN(transfer) || transfer <= 0 || transfer > maxAvailable;
              const isRemoveDisabled = isNaN(transfer) || transfer <= 0 || transfer > f.currentBalance;
              
              const isSavings = f.type === 'savings';
              const Icon = isSavings ? PiggyBank : ShieldCheck;
              const themeColor = isSavings ? '#10b981' : '#f59e0b';

              return (
                <div key={f.id} style={{ background: 'var(--bg-surface)', border: `1px solid ${isSavings ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`, borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Icon size={16} color={themeColor} />
                        {f.name}
                      </div>
                      {linkedAccountName && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Wallet size={10} /> {linkedAccountName}
                        </div>
                      )}
                      <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 4 }}>
                        {isSavings ? 'Накоплено' : 'В резерве'}: <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{new Intl.NumberFormat('ru-RU').format(f.currentBalance)} {f.currency}</span>
                      </div>
                    </div>
                    <button onClick={() => deleteFund(f.id)} title={t("Удалить сейф", "Удалить сейф")} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, borderRadius: 4 }}>
                      <X size={14} />
                    </button>
                  </div>

                  {/* Progress */}
                  {f.targetAmount > 0 && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: 11, marginBottom: 4 }}>
                        <span>{t("Цель:", "Цель:")} {new Intl.NumberFormat('ru-RU').format(f.targetAmount)} {f.currency}</span>
                        <span>{pct.toFixed(0)}%</span>
                      </div>
                      <div style={{ background: 'var(--bg-elevated)', height: 6, borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ background: pct >= 100 ? '#10b981' : themeColor, height: '100%', width: `${pct}%`, transition: 'width 0.5s ease-out, background 0.3s' }} />
                      </div>
                      {f.currentBalance < f.targetAmount && (
                        <div style={{ color: 'var(--text-secondary)', fontSize: 11, marginTop: 4 }}>
                          
                          {t("Осталось:", "Осталось:")} {new Intl.NumberFormat('ru-RU').format(f.targetAmount - f.currentBalance)} {f.currency}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Controls */}
                  <div style={{ display: 'flex', gap: 6, marginTop: 'auto' }}>
                    <input
                      type="number" 
                      placeholder={t("Сумма", "Сумма")}
                      value={fundTransferMap[f.id] || ''}
                      onChange={e => setFundTransferMap(p => ({...p, [f.id]: e.target.value}))}
                      style={{ flex: 1, minWidth: 0, padding: '0 10px', height: 32, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
                    />
                    <button 
                      title={t("Изъять", "Изъять")}
                      disabled={isRemoveDisabled}
                      onClick={() => { transferToFund(f.id, -transfer); setFundTransferMap(p => ({...p, [f.id]: ''})); }} 
                      style={{ background: isRemoveDisabled ? 'var(--bg-hover)' : 'rgba(239,68,68,0.1)', color: isRemoveDisabled ? 'var(--text-muted)' : '#ef4444', border: '1px solid', borderColor: isRemoveDisabled ? 'transparent' : 'rgba(239,68,68,0.2)', width: 32, height: 32, borderRadius: 6, fontSize: 16, fontWeight: 500, cursor: isRemoveDisabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      −
                    </button>
                    <button 
                      title={t("Добавить начисление", "Добавить начисление")}
                      disabled={isAddDisabled}
                      onClick={() => { transferToFund(f.id, transfer); setFundTransferMap(p => ({...p, [f.id]: ''})); }} 
                      style={{ background: isAddDisabled ? 'var(--bg-hover)' : 'rgba(16,185,129,0.1)', color: isAddDisabled ? 'var(--text-muted)' : '#10b981', border: '1px solid', borderColor: isAddDisabled ? 'transparent' : 'rgba(16,185,129,0.2)', width: 32, height: 32, borderRadius: 6, fontSize: 16, fontWeight: 500, cursor: isAddDisabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Table Container */}
        <div style={{ padding: '0 24px 24px' }}>
          <AccountsTable searchQuery={searchQuery} selectedTypes={selectedTypes} />
        </div>

      </div> {/* end Main Content Area */}

      {/* Exchange Revaluation Modal */}
      {isRevalModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: 'var(--bg-surface)', width: 450, borderRadius: 12, border: '1px solid var(--border-subtle)', overflow: 'hidden', boxShadow: '0 16px 48px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{t("Переоценка валютных счетов", "Переоценка валютных счетов")}</span>
              <button onClick={() => setRevalModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0 }}>
                
                {t("Для корректного формирования ОПУ (P&L) необходимо регулярно фиксировать курсовые разницы. Текущий курс взят из ЦБ РФ на сегодня.", "Для корректного формирования ОПУ (P&L) необходимо регулярно фиксировать курсовые разницы. Текущий курс взят из ЦБ РФ на сегодня.")}
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {fcb.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{t("Нет счетов в иностранной валюте.", "Нет счетов в иностранной валюте.")}</div>}
                {fcb.map(acc => (
                  <div key={acc.id} style={{ background: 'var(--bg-elevated)', padding: 12, borderRadius: 8, border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 13 }}>{acc.name}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{new Intl.NumberFormat('ru-RU').format(acc.balance)} {acc.currency}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <input
                        id={`reval-rate-${acc.currency}`}
                        type="number"
                        value={localRates[acc.currency] ?? effectiveRates[acc.currency] ?? ''}
                        onChange={e => setLocalRates(p => ({...p, [acc.currency]: parseFloat(e.target.value)}))}
                        style={{ width: 90, height: 28, padding: '0 8px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, textAlign: 'right', outline: 'none' }}
                      />
                      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{APP_CURRENCY}/{acc.currency}</span>
                    </div>
                  </div>
                ))}
              </div>

            </div>
            <div style={{ padding: '16px 24px', background: 'var(--bg-surface)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => setRevalModalOpen(false)} style={{ height: 32, padding: '0 16px', background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-secondary)', fontWeight: 500, fontSize: 12, cursor: 'pointer' }}>{t("Отозвать", "Отозвать")}</button>
              <button 
                onClick={handleRevaluate}
                disabled={fcb.length === 0}
                style={{ height: 32, padding: '0 20px', background: 'var(--color-primary)', border: 'none', borderRadius: 6, color: 'var(--text-primary)', fontWeight: 600, cursor: fcb.length === 0 ? 'default' : 'pointer', opacity: fcb.length === 0 ? 0.5 : 1 }}>
                
                {t("Зафиксировать разницу", "Зафиксировать разницу")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Fund Modal */}
      {isFundModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: 'var(--bg-surface)', width: 400, borderRadius: 12, border: '1px solid var(--border-subtle)', overflow: 'hidden', boxShadow: '0 16px 48px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{t("Новый сейф", "Новый сейф")}</span>
              <button onClick={() => setFundModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 6 }}>{t("Название сейфа (например: Налоги УСН)", "Название сейфа (например: Налоги УСН)")}</label>
                <input id="referencesaccounts-field-10" name="referencesaccounts-field-10" value={newFundName} onChange={e => setNewFundName(e.target.value)} type="text" placeholder={t("Наименование", "Наименование")} style={{ width: '100%', height: 32, padding: '0 10px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box', outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 6 }}>{t("Тип сейфа", "Тип сейфа")}</label>
                  <select value={newFundType} onChange={e => setNewFundType(e.target.value as 'reserve' | 'savings')} style={{ width: '100%', height: 32, padding: '0 10px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box', outline: 'none' }}>
                    <option value="reserve">{t("Резервный (Щит)", "Резервный (Щит)")}</option>
                    <option value="savings">{t("Накопительный (Копилка)", "Накопительный (Копилка)")}</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 6 }}>{t("Привязка к счёту", "Привязка к счёту")}</label>
                  <select value={newFundAccountId} onChange={e => setNewFundAccountId(e.target.value)} style={{ width: '100%', height: 32, padding: '0 10px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box', outline: 'none' }}>
                    <option value="">{t("(Все счета) Free Cash", "(Все счета) Free Cash")}</option>
                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 6 }}>{t("Целевая сумма (сум, необязательно)", "Целевая сумма (сум, необязательно)")}</label>
                <input id="referencesaccounts-field-11" name="referencesaccounts-field-11" value={newFundTarget} onChange={e => setNewFundTarget(e.target.value)} type="number" placeholder="500 000" style={{ width: '100%', height: 32, padding: '0 10px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box', outline: 'none' }} />
              </div>
              <div style={{ background: 'rgba(245, 158, 11, 0.08)', padding: 12, borderRadius: 8, border: '1px solid rgba(245, 158, 11, 0.2)', fontSize: 13, color: 'var(--text-secondary)' }}>
                
                {t("💡 Если привязан счет, сумма вычитается только из его остатка. Иначе — из общего", "💡 Если привязан счет, сумма вычитается только из его остатка. Иначе — из общего")} <b style={{ color: '#f59e0b' }}>Free Cash Balance</b>.
              </div>
            </div>
            <div style={{ padding: '16px 24px', background: 'var(--bg-surface)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => setFundModalOpen(false)} style={{ height: 32, padding: '0 16px', background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-secondary)', fontWeight: 500, fontSize: 12, cursor: 'pointer' }}>{t("Отозвать", "Отозвать")}</button>
              <button onClick={handleCreateFund} style={{ height: 32, padding: '0 20px', background: '#f59e0b', border: 'none', borderRadius: 6, color: '#000', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>{t("Создать сейф", "Создать сейф")}</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Account Modal */}
      {isNewAccountModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: 'var(--bg-surface)', width: 440, borderRadius: 12, border: '1px solid var(--border-subtle)', overflow: 'hidden', boxShadow: '0 16px 48px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{t("Новый счёт", "Новый счёт")}</span>
              <button onClick={() => setNewAccountModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 6 }}>{t("Название счёта", "Название счёта")}</label>
                <input id="referencesaccounts-field-12" name="referencesaccounts-field-12" value={newAccName} onChange={e => setNewAccName(e.target.value)} type="text" placeholder={t("Например: Расчётный счёт №2", "Например: Расчётный счёт №2")} style={{ width: '100%', height: 32, padding: '0 10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 6 }}>Nomi (UZ)</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input value={newAccNameUz} onChange={e => setNewAccNameUz(e.target.value)} type="text" placeholder="O'zbekcha nomi" style={{ flex: 1, height: 32, padding: '0 10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box', outline: 'none' }} />
                  <button type="button" disabled={!newAccName.trim() || accTranslating} onClick={async () => { setAccTranslating(true); const uz = await translateToUz(newAccName.trim()); if (uz) setNewAccNameUz(uz); setAccTranslating(false); }} style={{ flexShrink: 0, height: 32, padding: '0 12px', border: '1px solid var(--border-subtle)', borderRadius: 6, background: 'var(--bg-hover)', color: 'var(--text-secondary)', fontSize: 12, cursor: (newAccName.trim() && !accTranslating) ? 'pointer' : 'default', whiteSpace: 'nowrap' }}>{accTranslating ? '…' : 'Перевести'}</button>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 6 }}>{t("Начальный баланс", "Начальный баланс")}</label>
                <input value={newAccBalance} onChange={e => setNewAccBalance(e.target.value)} type="number" placeholder="0" style={{ width: '100%', height: 32, padding: '0 10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 6 }}>{t("Тип счёта", "Тип счёта")}</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(['Наличный', 'Безналичный', 'Карта', 'Крипто'] as const).map(t => (
                    <button key={t} onClick={() => setNewAccType(t)} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid', borderColor: newAccType === t ? (t === 'Крипто' ? '#8b5cf6' : '#3b82f6') : 'var(--border-default)', background: newAccType === t ? (t === 'Крипто' ? 'rgba(139,92,246,0.15)' : 'rgba(59,130,246,0.15)') : 'transparent', color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer' }}>
                      {t === 'Крипто' ? '₿ ' : ''}{t}
                    </button>
                  ))}
                </div>
              </div>
              {newAccType === 'Крипто' ? (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 6 }}>{t("Сеть блокчейна", "Сеть блокчейна")}</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {(['TRC20', 'ERC20', 'BEP20'] as const).map(n => (
                        <button key={n} onClick={() => setNewAccNetwork(n)} style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1px solid', borderColor: newAccNetwork === n ? '#8b5cf6' : 'var(--border-default)', background: newAccNetwork === n ? 'rgba(139,92,246,0.15)' : 'transparent', color: newAccNetwork === n ? '#8b5cf6' : 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>
                          {n}
                        </button>
                      ))}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>{t("TRC20 (Tron) — низкие комиссии. ERC20 / BEP20 — Ethereum / BNB.", "TRC20 (Tron) — низкие комиссии. ERC20 / BEP20 — Ethereum / BNB.")}</div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 6 }}>{t("Публичный адрес кошелька (Read-only)", "Публичный адрес кошелька (Read-only)")}</label>
                    <input id="referencesaccounts-field-13" name="referencesaccounts-field-13" value={newAccAddress} onChange={e => setNewAccAddress(e.target.value)} type="text" placeholder={t("T... или 0x...", "T... или 0x...")} style={{ width: '100%', height: 32, padding: '0 10px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, fontFamily: 'monospace', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                </>
              ) : (
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 6 }}>{t("Валюта", "Валюта")}</label>
                  <select id="referencesaccounts-select-14" name="referencesaccounts-select-14" value={newAccCurrency} onChange={e => setNewAccCurrency(e.target.value)} style={{ width: '100%', height: 32, padding: '0 10px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13 }}>
                    <option value={APP_CURRENCY}>{t("UZS — Узбекский сум", "UZS — Узбекский сум")}</option>
                    <option value="USD">{t("USD — Доллар США", "USD — Доллар США")}</option>
                    <option value="EUR">{t("EUR — Евро", "EUR — Евро")}</option>
                    <option value="USDT">USDT — Tether</option>
                    <option value="RUB">{t("RUB — Российский рубль", "RUB — Российский рубль")}</option>
                  </select>
                </div>
              )}
            </div>
            <div style={{ padding: '16px 24px', background: 'var(--bg-surface)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => setNewAccountModalOpen(false)} style={{ height: 32, padding: '0 16px', background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-secondary)', fontWeight: 500, fontSize: 12, cursor: 'pointer' }}>{t("Отозвать", "Отозвать")}</button>
              <button onClick={handleCreateAccount} style={{ height: 32, padding: '0 20px', background: 'var(--color-primary)', border: 'none', borderRadius: 6, color: '#fff', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>{t("Создать Счет", "Создать Счет")}</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ReferencesAccountsPage;
