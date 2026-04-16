import React from 'react';
import { Lock, Save, AlertCircle } from 'lucide-react';
import { useContadorStore } from '../store/contadorStore';

export const SettingsPage: React.FC = () => {
  const settings = useContadorStore(state => state.settings);
  const updateSettings = useContadorStore(state => state.updateSettings);

  const handleSave = (message: string) => {
    alert(message);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, padding: '10px 0', maxWidth: 800, margin: '0 auto' }}>
      <header style={{ borderBottom: '1px solid var(--border-strong)', paddingBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>Настройки системы</h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Управление глобальными параметрами учета и безопасности.</p>
      </header>

      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        
        {/* Closed Period Section */}
        <div style={{ padding: 32, borderBottom: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
              <Lock size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Закрытие периода</h3>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5, maxWidth: 400 }}>
                Запрещает создание, редактирование и удаление проводок до указанной даты включительно. Это необходимо для фиксации отчетности.
              </p>
            </div>
          </div>

          <div style={{ marginLeft: 56, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <input 
                type="date" 
                value={settings.closedPeriodDate}
                onChange={(e) => updateSettings({ closedPeriodDate: e.target.value })}
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', color: 'var(--text-primary)', padding: '10px 16px', borderRadius: 8, fontSize: 14, outline: 'none' }}
              />
              <button 
                onClick={() => handleSave("Дата закрытия периода сохранена!")}
                style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
              >
                <Save size={16} /> Сохранить изменения
              </button>
            </div>
            
            <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', padding: 16, borderRadius: 8, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <AlertCircle size={16} color="var(--color-danger)" style={{ flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-danger)', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1.5 }}>
                Внимание: Изменение даты закрытия периода повлияет на возможность редактирования исторических данных.
              </p>
            </div>
          </div>
        </div>

        {/* Opening Balance Section */}
        <div style={{ padding: 32, borderBottom: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <span style={{ fontSize: 11, fontWeight: 800 }}>0000</span>
            </div>
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Ввод начальных остатков</h3>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5, maxWidth: 400 }}>
                Укажите дату первого дня учета. Все записи по техническому счету 0000 должны быть привязаны к этой дате.
              </p>
            </div>
          </div>

          <div style={{ marginLeft: 56, display: 'flex', gap: 16, alignItems: 'center' }}>
            <input 
              type="date" 
              value={settings.openingBalanceDate}
              onChange={(e) => updateSettings({ openingBalanceDate: e.target.value })}
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', color: 'var(--text-primary)', padding: '10px 16px', borderRadius: 8, fontSize: 14, outline: 'none' }}
            />
            <button 
              onClick={() => handleSave("Дата начальных остатков установлена!")}
              style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', padding: '10px 24px', borderRadius: 8, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
            >
              <Save size={16} /> Установить дату
            </button>
          </div>
        </div>

        {/* OpenAI Section */}
        <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', gap: 16 }}>
             <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <span style={{ fontSize: 14, fontWeight: 800 }}>AI</span>
            </div>
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>OpenAI API Key (BYOK)</h3>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5, maxWidth: 400 }}>
                Ваш личный ключ будет использоваться для ИИ автоматизации (распознавание чеков, авто-категоризация).
              </p>
            </div>
          </div>

          <div style={{ marginLeft: 56 }}>
            <input 
              type="password" 
              placeholder="sk-proj-..."
              value={settings.customApiKey}
              onChange={(e) => updateSettings({ customApiKey: e.target.value })}
              onBlur={() => settings.customApiKey && handleSave("API ключ OpenAI сохранен")}
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', color: 'var(--text-primary)', padding: '12px 16px', borderRadius: 8, fontSize: 14, width: '100%', maxWidth: 320, outline: 'none', fontFamily: 'monospace' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
