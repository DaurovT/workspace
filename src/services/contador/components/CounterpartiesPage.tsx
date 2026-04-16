import React, { useState } from 'react';
import { Plus, Users, Search, Trash2 } from 'lucide-react';
import { useContadorStore } from '../store/contadorStore';

export const CounterpartiesPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState({ name: "", inn: "" });
  
  const counterparties = useContadorStore(state => state.counterparties);
  const addCounterparty = useContadorStore(state => state.addCounterparty);
  const deleteCounterparty = useContadorStore(state => state.deleteCounterparty);

  const filtered = counterparties.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.inn && c.inn.includes(search))
  );

  const handleAdd = () => {
    if (!formData.name) return;
    addCounterparty({ name: formData.name, inn: formData.inn });
    setFormData({ name: "", inn: "" });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '10px 0' }}>
      <header>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>Контрагенты</h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>База данных клиентов, поставщиков и партнеров компании.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: 24 }}>
        
        {/* Creation Form */}
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: 24, height: 'fit-content', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-primary)', marginBottom: 20 }}>Новый контрагент</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Наименование</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Название компании"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '10px 14px', borderRadius: 8, fontSize: 13, outline: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>ИНН / ПИНФЛ</label>
              <input 
                type="text" 
                value={formData.inn}
                onChange={(e) => setFormData({...formData, inn: e.target.value})}
                placeholder="123456789"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '10px 14px', borderRadius: 8, fontSize: 13, outline: 'none' }}
              />
            </div>
            <button 
              onClick={handleAdd}
              disabled={!formData.name}
              style={{ 
                marginTop: 8, width: '100%', padding: '12px 16px', borderRadius: 8, 
                background: formData.name ? 'var(--color-primary)' : 'var(--bg-surface)', 
                color: formData.name ? '#fff' : 'var(--text-muted)', 
                border: 'none', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: formData.name ? 'pointer' : 'not-allowed', transition: 'all 0.2s' 
              }}
            >
              <Plus size={16} /> Добавить
            </button>
          </div>
        </div>

        {/* List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 16 }} />
            <input 
              type="text" 
              placeholder="Поиск по названию или ИНН..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '14px 16px 14px 46px', borderRadius: 12, fontSize: 13, outline: 'none', boxShadow: 'var(--shadow-sm)' }}
            />
          </div>

          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: 'rgba(0,0,0,0.2)' }}>
                <tr>
                  <th style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-strong)', fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Контрагент</th>
                  <th style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-strong)', fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>ИНН</th>
                  <th style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-strong)', fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'right' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={3} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Ничего не найдено</td></tr>
                ) : filtered.map((c) => (
                  <tr key={c.id} className="table-row-hover" style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        <Users size={14} />
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{c.name}</span>
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: 13, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{c.inn || '—'}</td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <button 
                        onClick={() => { if(confirm(`Удалить контрагента "${c.name}"?`)) deleteCounterparty(c.id) }}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                        title="Удалить"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CounterpartiesPage;
