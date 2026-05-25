import React, { useState, useMemo } from 'react';
import { useFinanceStore } from '../financeStore';
import type { Account } from '../financeStore';
import {
  ChevronDown, ChevronRight, CreditCard, Wallet, Banknote, Bitcoin,
  Pencil, Trash2, X
} from 'lucide-react';
import { APP_CURRENCY } from '../config/currency';

// ─── Shared cell style (Linear standard) ──────────────────────────
const th: React.CSSProperties = {
  padding: '9px 14px', fontSize: 11, fontWeight: 600,
  color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)',
  background: 'var(--bg-surface)', whiteSpace: 'nowrap', userSelect: 'none',
  textAlign: 'left',
};

const TYPE_COLORS: Record<string, string> = {
  'Безналичный': '#3b82f6',
  'Наличный':    '#10b981',
  'Карта':       '#f59e0b',
  'Крипто':      '#8b5cf6',
};

const TYPE_BG: Record<string, string> = {
  'Безналичный': 'rgba(59,130,246,0.08)',
  'Наличный':    'rgba(16,185,129,0.08)',
  'Карта':       'rgba(245,158,11,0.08)',
  'Крипто':      'rgba(139,92,246,0.08)',
};

function getIcon(type?: string) {
  switch (type) {
    case 'Безналичный': return <Banknote size={14} color="#3b82f6" />;
    case 'Наличный':    return <Wallet    size={14} color="#10b981" />;
    case 'Карта':       return <CreditCard size={14} color="#f59e0b" />;
    case 'Крипто':      return <Bitcoin   size={14} color="#8b5cf6" />;
    default:            return <Wallet    size={14} color="var(--text-muted)" />;
  }
}

// ─── Edit Modal ────────────────────────────────────────────────────
const EditModal: React.FC<{
  account: Account;
  onSave: (updates: Partial<Account>) => void;
  onClose: () => void;
}> = ({ account, onSave, onClose }) => {
  const [name, setName] = useState(account.name);
  const [balance, setBalance] = useState(String(account.balance));
  const [currency, setCurrency] = useState(account.currency);
  const [bankName, setBankName] = useState(account.bankName ?? '');
  const [type, setType] = useState(account.type ?? 'Безналичный');

  const fieldCss: React.CSSProperties = {
    width: '100%', height: 32, padding: '0 10px',
    background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
    borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, outline: 'none',
    boxSizing: 'border-box',
  };
  const labelCss: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 5, display: 'block',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={onClose}>
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, width: 420, boxShadow: '0 16px 48px rgba(0,0,0,0.25)', padding: '22px 24px' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Редактировать счёт</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={15} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><label style={labelCss}>Название</label><input value={name} onChange={e => setName(e.target.value)} style={fieldCss} /></div>
          <div><label style={labelCss}>Текущий остаток</label><input type="number" value={balance} onChange={e => setBalance(e.target.value)} style={fieldCss} /></div>
          <div><label style={labelCss}>Банк / Расположение</label><input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="Необязательно" style={fieldCss} /></div>
          <div>
            <label style={labelCss}>Тип</label>
            <select value={type} onChange={e => setType(e.target.value as any)} style={fieldCss}>
              {(['Безналичный', 'Наличный', 'Карта', 'Крипто'] as const).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={labelCss}>Валюта</label>
            <select value={currency} onChange={e => setCurrency(e.target.value)} style={fieldCss}>
              <option value={APP_CURRENCY}>UZS — Узбекский сум</option>
              <option value="USD">USD — Доллар США</option>
              <option value="EUR">EUR — Евро</option>
              <option value="USDT">USDT — Tether</option>
              <option value="RUB">RUB — Российский рубль</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button onClick={onClose} style={{ flex: 1, height: 32, background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}>Отмена</button>
            <button onClick={() => onSave({ name, balance: parseFloat(balance) || 0, currency, bankName: bankName || undefined, type: type as Account['type'] })}
              disabled={!name.trim()}
              style={{ flex: 1, height: 32, background: 'var(--color-primary)', border: 'none', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px rgba(99,102,241,0.25)' }}>
              Сохранить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Delete Confirm ────────────────────────────────────────────────
const DeleteConfirm: React.FC<{ account: Account; onConfirm: () => void; onClose: () => void }> = ({ account, onConfirm, onClose }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
    onClick={onClose}>
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, width: 380, padding: 24, boxShadow: '0 16px 48px rgba(0,0,0,0.25)' }}
      onClick={e => e.stopPropagation()}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div style={{ background: 'rgba(239,68,68,0.1)', borderRadius: 8, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Trash2 size={16} color="#ef4444" />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>Удалить счёт?</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            «{account.name}» будет удалён безвозвратно. Транзакции по счёту останутся.
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onClose} style={{ flex: 1, height: 32, background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}>Отмена</button>
        <button onClick={onConfirm} style={{ flex: 1, height: 32, background: '#ef4444', border: 'none', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Удалить</button>
      </div>
    </div>
  </div>
);

// ─── Main Table ────────────────────────────────────────────────────
export const AccountsTable: React.FC<{ searchQuery?: string; selectedTypes?: string[] }> = ({ searchQuery = '', selectedTypes }) => {
  const { accounts, transactions, updateAccount, deleteAccount } = useFinanceStore();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['Безналичный', 'Наличный', 'Карта', 'Крипто']));
  const [editTarget, setEditTarget] = useState<Account | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);
  const [hoverRow, setHoverRow] = useState<string | null>(null);

  // Usage count per account (number of transactions)
  const usageMap = useMemo(() => {
    const m: Record<string, number> = {};
    transactions.forEach(t => { if (t.accountId) m[t.accountId] = (m[t.accountId] ?? 0) + 1; });
    return m;
  }, [transactions]);

  // Group with search filter + type filter
  const groupedData = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const filtered = accounts.filter(a => {
      const matchesSearch = !q || a.name.toLowerCase().includes(q) || (a.bankName ?? '').toLowerCase().includes(q);
      const matchesType = !selectedTypes || selectedTypes.length === 0 || selectedTypes.includes(a.type ?? 'Прочее');
      return matchesSearch && matchesType;
    });
    const map = new Map<string, Account[]>();
    filtered.forEach(acc => {
      const g = acc.type ?? 'Прочее';
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(acc);
    });
    return Array.from(map.entries());
  }, [accounts, searchQuery, selectedTypes]);

  // Footer totals by currency
  const totals = useMemo(() => {
    const map: Record<string, number> = {};
    groupedData.forEach(([, items]) => items.forEach(a => {
      map[a.currency] = (map[a.currency] ?? 0) + a.balance;
    }));
    return map;
  }, [groupedData]);

  const toggleGroup = (g: string) => setExpandedGroups(prev => {
    const n = new Set(prev);
    if (n.has(g)) n.delete(g); else n.add(g);
    return n;
  });

  // Group totals
  const groupTotal = (items: Account[]) =>
    items.filter(a => a.currency === APP_CURRENCY).reduce((s, a) => s + a.balance, 0);

  if (groupedData.length === 0) {
    return (
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '60px 24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
        {searchQuery ? `По запросу «${searchQuery}» ничего не найдено` : 'Нет счетов. Создайте первый счёт.'}
      </div>
    );
  }

  const totalAll = Object.entries(totals);

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ ...th, width: 32 }} />
            <th style={th}>Название счёта</th>
            <th style={{ ...th, width: 180 }}>Банк / Расположение</th>
            <th style={{ ...th, width: 120, textAlign: 'right' }}>Начальный</th>
            <th style={{ ...th, width: 140, textAlign: 'right' }}>Текущий остаток</th>
            <th style={{ ...th, width: 80 }}>Валюта</th>
            <th style={{ ...th, width: 80, textAlign: 'right' }}>Транзакции</th>
            <th style={{ ...th, width: 90, textAlign: 'right' }}>Действия</th>
          </tr>
        </thead>
        <tbody>
          {groupedData.map(([groupName, items]) => {
            const isOpen = expandedGroups.has(groupName);
            const color = TYPE_COLORS[groupName] ?? '#64748b';
            const bg = TYPE_BG[groupName] ?? 'transparent';
            const tdG: React.CSSProperties = {
              padding: '10px 14px', fontSize: 11, fontWeight: 700,
              color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)',
              background: 'var(--bg-hover)', whiteSpace: 'nowrap',
              textTransform: 'uppercase', letterSpacing: '0.04em',
            };
            return (
              <React.Fragment key={groupName}>
                {/* Group row */}
                <tr style={{ cursor: 'pointer' }} onClick={() => toggleGroup(groupName)}>
                  <td style={{ ...tdG, width: 32, paddingRight: 0 }}>
                    {isOpen
                      ? <ChevronDown size={13} color="var(--text-muted)" />
                      : <ChevronRight size={13} color="var(--text-muted)" />}
                  </td>
                  <td style={{ ...tdG, paddingLeft: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                      {groupName}
                      <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)', background: 'var(--bg-surface)', padding: '1px 6px', borderRadius: 4, border: '1px solid var(--border-subtle)', textTransform: 'none', letterSpacing: 0 }}>
                        {items.length}
                      </span>
                    </div>
                  </td>
                  <td style={tdG} />
                  <td style={tdG} />
                  <td style={{ ...tdG, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {items.some(a => a.currency === APP_CURRENCY) && (
                      <span style={{ color: 'var(--text-primary)', fontWeight: 700, textTransform: 'none', letterSpacing: 0 }}>
                        {new Intl.NumberFormat('ru-RU').format(groupTotal(items))}
                      </span>
                    )}
                  </td>
                  <td style={tdG} />
                  <td style={tdG} />
                  <td style={tdG} />
                </tr>

                {/* Item rows */}
                {isOpen && items.map(acc => {
                  const isHover = hoverRow === acc.id;
                  const usage = usageMap[acc.id] ?? 0;
                  const td: React.CSSProperties = {
                    padding: '9px 14px', fontSize: 12,
                    borderBottom: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    background: isHover ? 'var(--bg-hover)' : 'var(--bg-base)',
                    transition: 'background 0.1s',
                    whiteSpace: 'nowrap',
                  };
                  return (
                    <tr key={acc.id}
                      onMouseEnter={() => setHoverRow(acc.id)}
                      onMouseLeave={() => setHoverRow(null)}>
                      <td style={{ ...td, width: 32, paddingRight: 0 }}>
                        <div style={{ width: 3, height: 3, borderRadius: '50%', background: color, margin: 'auto' }} />
                      </td>
                      <td style={{ ...td, paddingLeft: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {getIcon(acc.type)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 500, fontSize: 12, color: 'var(--text-primary)' }}>{acc.name}</div>
                            {acc.publicAddress && (
                              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{acc.publicAddress.slice(0, 12)}…</div>
                            )}
                          </div>
                          {acc.blockchainNetwork && (
                            <span style={{ fontSize: 10, color: '#8b5cf6', background: 'rgba(139,92,246,0.1)', padding: '1px 5px', borderRadius: 4, border: '1px solid rgba(139,92,246,0.2)' }}>
                              {acc.blockchainNetwork}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ ...td, color: 'var(--text-secondary)' }}>
                        {acc.bankName ?? '—'}
                      </td>
                      <td style={{ ...td, textAlign: 'right', color: 'var(--text-muted)' }}>—</td>
                      <td style={{ ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        <span style={{ fontWeight: 600, color: acc.balance < 0 ? '#ef4444' : acc.balance === 0 ? 'var(--text-muted)' : '#10b981' }}>
                          {acc.balance < 0 ? '−' : ''}{new Intl.NumberFormat('ru-RU').format(Math.abs(acc.balance))}
                        </span>
                      </td>
                      <td style={td}>
                        <span style={{ fontSize: 11, background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                          {acc.currency}
                        </span>
                      </td>
                      <td style={{ ...td, textAlign: 'right' }}>
                        {usage > 0
                          ? <span style={{ fontSize: 11, color: '#10b981', fontWeight: 600, background: 'rgba(16,185,129,0.08)', padding: '2px 6px', borderRadius: 4 }}>{usage}</span>
                          : <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>—</span>}
                      </td>
                      <td style={{ ...td, textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 2, justifyContent: 'flex-end', opacity: isHover ? 1 : 0, transition: 'opacity 0.12s' }}>
                          <button onClick={() => setEditTarget(acc)} title="Редактировать"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '3px 4px', borderRadius: 4 }}
                            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-primary)')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
                            <Pencil size={12} />
                          </button>
                          <button onClick={() => setDeleteTarget(acc)} title="Удалить"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '3px 4px', borderRadius: 4 }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            );
          })}
        </tbody>
        {/* Footer totals */}
      {totalAll.length > 0 && (
        <tfoot>
          <tr>
            <td colSpan={4} style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em', background: 'var(--bg-hover)' }}>Итого</td>
            <td style={{ padding: '10px 14px', textAlign: 'right', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-hover)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-end' }}>
                {totalAll.map(([cur, val]) => (
                  <span key={cur} style={{ fontSize: 11, fontWeight: 700, color: val < 0 ? '#ef4444' : 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                    {new Intl.NumberFormat('ru-RU').format(val)} {cur}
                  </span>
                ))}
              </div>
            </td>
            <td colSpan={3} style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-hover)' }} />
          </tr>
        </tfoot>
      )}
      </table>

      {editTarget && (
        <EditModal
          account={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={async updates => { await updateAccount(editTarget.id, updates); setEditTarget(null); }}
        />
      )}
      {deleteTarget && (
        <DeleteConfirm
          account={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => { deleteAccount(deleteTarget.id); setDeleteTarget(null); }}
        />
      )}
    </div>
  );
};
