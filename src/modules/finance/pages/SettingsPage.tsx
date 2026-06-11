import React, { useState } from 'react';
import { useFinanceStore } from '../financeStore';
import { Settings, Users, Plus, CheckCircle, X, Zap, History } from 'lucide-react';
import { Modal } from '../components/Modal';
import { useTranslation } from 'react-i18next';

const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
    const { users, addUser, deleteUser, importRules, addImportRule, deleteImportRule, toggleImportRule, settings, updateSettings } = useFinanceStore();
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'users' | 'audit' | 'import_rules'>('general');
  const [isInviteModalOpen, setInviteModalOpen] = useState(false);
  
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'Менеджер'|'Гость'|'Администратор'>('Менеджер');

  // ----- RBAC Logic -----
  const [isPermissionsModalOpen, setPermissionsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<string[]>([]);
  const { auditLogs, updateUserPermissions } = useFinanceStore();

  const handleOpenPermissions = (uid: string, currentPerms: string[]) => {
    setEditingUserId(uid);
    setEditingPermissions([...currentPerms]);
    setPermissionsModalOpen(true);
  };
  
  const togglePermission = (sec: string) => {
    setEditingPermissions(prev => prev.includes(sec) ? prev.filter(p => p !== sec) : [...prev, sec]);
  };

  // ----- Import Rules Logic -----
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleConditionVal, setNewRuleConditionVal] = useState('');
  const [newRuleActionVal, setNewRuleActionVal] = useState('cat3');

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    addImportRule({
      id: Date.now().toString(),
      name: newRuleName,
      conditionField: 'description',
      conditionOperator: 'contains',
      conditionValue: newRuleConditionVal,
      actionType: 'set_category',
      actionValue: newRuleActionVal,
      isActive: true
    });
    setIsRuleModalOpen(false);
  };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: 'var(--bg-base)' }}>
      
      {/* Settings Navigation Sidebar */}
      <div style={{ width: 220, flexShrink: 0, background: 'var(--bg-surface)', borderRight: '1px solid var(--border-subtle)', padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ height: 44, display: 'flex', alignItems: 'center', padding: '0 10px', marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{t("Настройки", "Настройки")}</span>
        </div>
        
        <button 
          onClick={() => setActiveTab('general')}
          style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 12px', borderRadius: 8, border: 'none', background: activeTab === 'general' ? 'rgba(59, 130, 246, 0.15)' : 'transparent', color: activeTab === 'general' ? '#3b82f6' : 'var(--text-secondary)', cursor: 'pointer', textAlign: 'left', fontWeight: activeTab === 'general' ? 600 : 400, transition: 'all 0.2s' }}>
          <Settings size={18} />  {t("Общие настройки", "Общие настройки")}
        </button>
        

        <button 
          onClick={() => setActiveTab('users')}
          style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 12px', borderRadius: 8, border: 'none', background: activeTab === 'users' ? 'rgba(59, 130, 246, 0.15)' : 'transparent', color: activeTab === 'users' ? '#3b82f6' : 'var(--text-secondary)', cursor: 'pointer', textAlign: 'left', fontWeight: activeTab === 'users' ? 600 : 400, transition: 'all 0.2s' }}>
          <Users size={18} />  {t("Пользователи (Команда)", "Пользователи (Команда)")}
        </button>

        <button 
          onClick={() => setActiveTab('import_rules')}
          style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 12px', borderRadius: 8, border: 'none', background: activeTab === 'import_rules' ? 'rgba(59, 130, 246, 0.15)' : 'transparent', color: activeTab === 'import_rules' ? '#3b82f6' : 'var(--text-secondary)', cursor: 'pointer', textAlign: 'left', fontWeight: activeTab === 'import_rules' ? 600 : 400, transition: 'all 0.2s' }}>
          <Zap size={18} />  {t("Правила Импорта", "Правила Импорта")}
        </button>

        <button 
          onClick={() => setActiveTab('audit')}
          style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 12px', borderRadius: 8, border: 'none', background: activeTab === 'audit' ? 'rgba(59, 130, 246, 0.15)' : 'transparent', color: activeTab === 'audit' ? '#3b82f6' : 'var(--text-secondary)', cursor: 'pointer', textAlign: 'left', fontWeight: activeTab === 'audit' ? 600 : 400, transition: 'all 0.2s' }}>
          <History size={18} />  {t("История действий", "История действий")}
        </button>
      </div>

      {/* Main Settings Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
        
        {/* === GENERAL TAB === */}
        {activeTab === 'general' && (
          <div style={{ maxWidth: 800 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>{t("Общие настройки", "Общие настройки")}</span>
            
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: 20, marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, color: 'var(--text-primary)', margin: '0 0 16px' }}>{t("Основная информация", "Основная информация")}</h3>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>{t("Название бизнеса", "Название бизнеса")}</label>
                <input 
                  value={settings.companyName} 
                  onChange={e => updateSettings({ companyName: e.target.value })} 
                  type="text" 
                  style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-hover)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14 }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>{t("Основная валюта аккаунта", "Основная валюта аккаунта")}</label>
                <select 
                  value={settings.baseCurrency}
                  onChange={e => updateSettings({ baseCurrency: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-hover)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14 }}
                >
                  <option value="UZS">{t("Узбекский сум (UZS)", "Узбекский сум (UZS)")}</option>
                  <option value="USD">{t("Доллар США (USD)", "Доллар США (USD)")}</option>
                </select>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>{t("Все сводные данные в отчетах (P&L, Cashflow) будут конвертироваться в эту валюту по курсу ЦБ.", "Все сводные данные в отчетах (P&L, Cashflow) будут конвертироваться в эту валюту по курсу ЦБ.")}</p>
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 12, padding: 24 }}>
              <h3 style={{ fontSize: 16, color: 'var(--text-primary)', margin: '0 0 16px' }}>{t("Настройки управленческого учета (P&L)", "Настройки управленческого учета (P&L)")}</h3>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>{t("Классификация расходов", "Классификация расходов")}</label>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 16, border: settings.pnlMode === 'direct_indirect' ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid var(--border-default)', background: settings.pnlMode === 'direct_indirect' ? 'rgba(59, 130, 246, 0.05)' : 'transparent', borderRadius: 8, cursor: 'pointer' }}>
                  <input type="radio" checked={settings.pnlMode === 'direct_indirect'} onChange={() => updateSettings({ pnlMode: 'direct_indirect' })} style={{ marginTop: 2, accentColor: 'var(--color-primary)' }} />
                  <div>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{t("Прямые и Косвенные (Рекомендуется для услуг)", "Прямые и Косвенные (Рекомендуется для услуг)")}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{t("Прямые расходы зависят от проекта (ЗП монтажникам), косвенные — общие (Аренда офиса).", "Прямые расходы зависят от проекта (ЗП монтажникам), косвенные — общие (Аренда офиса).")}</div>
                  </div>
                </label>
                
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 16, border: settings.pnlMode === 'fixed_variable' ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid var(--border-default)', background: settings.pnlMode === 'fixed_variable' ? 'rgba(59, 130, 246, 0.05)' : 'transparent', borderRadius: 8, cursor: 'pointer' }}>
                  <input type="radio" checked={settings.pnlMode === 'fixed_variable'} onChange={() => updateSettings({ pnlMode: 'fixed_variable' })} style={{ marginTop: 2, accentColor: 'var(--color-primary)' }} />
                  <div>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{t("Постоянные и Переменные (Для торговли)", "Постоянные и Переменные (Для торговли)")}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{t("Переменные растут вместе с продажами (Себестоимость товара), постоянные фиксы (Оклады).", "Переменные растут вместе с продажами (Себестоимость товара), постоянные фиксы (Оклады).")}</div>
                  </div>
                </label>
              </div>
            </div>
            
            <div style={{ background: 'var(--bg-surface)', border: '1px solid #f59e0b', borderRadius: 12, padding: 24, marginTop: 16 }}>
              <h3 style={{ fontSize: 16, color: '#f59e0b', margin: '0 0 16px' }}>{t("Закрытие финансового периода", "Закрытие финансового периода")}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>{t("Защитите прошлые периоды от редактирования. Любые транзакции до или в указанную дату будут заблокированы.", "Защитите прошлые периоды от редактирования. Любые транзакции до или в указанную дату будут заблокированы.")}</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>{t("Дата блокировки (Lock Date)", "Дата блокировки (Lock Date)")}</label>
                <input 
                  type="date"
                  value={settings.lockDate || ''}
                  onChange={e => updateSettings({ lockDate: e.target.value || undefined })}
                  style={{ width: '250px', padding: '10px 14px', background: 'var(--bg-hover)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14 }}
                />
              </div>
            </div>

          </div>
        )}


        {/* === USERS TAB === */}
        {activeTab === 'users' && (
          <div style={{ maxWidth: 900 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 , whiteSpace: 'nowrap' }}>{t("Команда", "Команда")}</span>
              <button onClick={() => setInviteModalOpen(true)} style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', padding: '0 12px', height: 28, borderRadius: 6, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12 }}>
                <Plus size={12} />  {t("Пригласить", "Пригласить")}
              </button>
            </div>

            <div style={{ background: 'var(--bg-surface)', borderRadius: 12, border: '1px solid var(--border-default)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: 'var(--bg-surface)' }}>
                  <tr>
                    <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)', whiteSpace: 'nowrap' }}>{t("Сотрудник", "Сотрудник")}</th>
                    <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)', whiteSpace: 'nowrap' }}>{t("Роль", "Роль")}</th>
                    <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)', whiteSpace: 'nowrap' }}>{t("Статус", "Статус")}</th>
                    <th style={{ padding: '8px 14px', textAlign: 'center', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)', whiteSpace: 'nowrap' }}>{t("Действия", "Действия")}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: 16 }}>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14 }}>{u.name} {u.role === 'Владелец' && '(Вы)'}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{u.email}</div>
                      </td>
                      <td style={{ padding: 16 }}>
                        <span style={{ 
                          background: u.role === 'Владелец' ? 'rgba(59, 130, 246, 0.2)' : u.role === 'Гость' ? 'rgba(16, 185, 129, 0.1)' : 'var(--border-default)', 
                          color: u.role === 'Владелец' ? '#3b82f6' : u.role === 'Гость' ? '#10b981' : 'var(--text-primary)', 
                          padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: u.role === 'Владелец' ? 600 : 400 
                        }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: u.status === 'Подтверждена' ? '#10b981' : 'var(--text-muted)', fontSize: 13 }}>
                          {u.status === 'Подтверждена' ? <CheckCircle size={14} /> : null} {u.status}
                        </div>
                      </td>
                      <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                        {u.role !== 'Владелец' ? (
                          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                            <button onClick={() => handleOpenPermissions(u.id, u.permissions)} style={{ background: 'transparent', border: 'none', color: '#3b82f6', fontSize: 13, cursor: 'pointer' }}>{t("Настройки прав", "Настройки прав")}</button>
                            <button onClick={() => deleteUser(u.id)} style={{ background: 'transparent', border: 'none', color: '#f43f5e', fontSize: 13, cursor: 'pointer' }}>{t("Отозвать", "Отозвать")}</button>
                          </div>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* === IMPORT RULES TAB === */}
        {activeTab === 'import_rules' && (
          <div style={{ maxWidth: 800 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{t("Правила авто-разноски (Smart Import)", "Правила авто-разноски (Smart Import)")}</h2>
                <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{t("Система автоматически применяет эти правила (сверху вниз) при загрузке банковской выписки или ручном вводе.", "Система автоматически применяет эти правила (сверху вниз) при загрузке банковской выписки или ручном вводе.")}</div>
              </div>
              <button onClick={() => setIsRuleModalOpen(true)} style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', padding: '0 12px', height: 28, borderRadius: 6, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <Plus size={12} />  {t("Создать правило", "Создать правило")}
              </button>
            </div>

            <div style={{ display: 'table', width: '100%', borderCollapse: 'collapse' }}>
              <div style={{ display: 'table-row', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: 12, fontWeight: 600 }}>
                <div style={{ display: 'table-cell', padding: '12px 16px', width: 40 }}>{t("Статус", "Статус")}</div>
                <div style={{ display: 'table-cell', padding: '12px 16px' }}>{t("Название и Условие", "Название и Условие")}</div>
                <div style={{ display: 'table-cell', padding: '12px 16px' }}>{t("Действие системы", "Действие системы")}</div>
                <div style={{ display: 'table-cell', padding: '12px 16px', width: 60 }}></div>
              </div>
              {importRules.map(rule => (
                <div key={rule.id} style={{ display: 'table-row', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'table-cell', padding: '16px', verticalAlign: 'middle' }}>
                    <div 
                      onClick={() => toggleImportRule(rule.id)}
                      style={{ width: 36, height: 20, background: rule.isActive ? 'var(--color-success)' : 'var(--border-default)', borderRadius: 10, cursor: 'pointer', position: 'relative' }}
                    >
                      <div style={{ position: 'absolute', top: 2, left: rule.isActive ? 18 : 2, width: 16, height: 16, background: 'var(--text-primary)', borderRadius: '50%', transition: 'all 0.2s' }} />
                    </div>
                  </div>
                  <div style={{ display: 'table-cell', padding: '16px', verticalAlign: 'middle' }}>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14 }}>{rule.name}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                      
                      {t("Eсли", "Eсли")} <strong style={{ color: '#38bdf8' }}>{rule.conditionField}</strong> {rule.conditionOperator === 'contains' ? 'содержит' : 'равно'} "{rule.conditionValue}"
                    </div>
                  </div>
                  <div style={{ display: 'table-cell', padding: '16px', verticalAlign: 'middle' }}>
                    <div style={{ color: 'var(--text-primary)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle size={14} color="#10b981" />  {t("Заменить на:", "Заменить на:")} {rule.actionValue}
                    </div>
                  </div>
                  <div style={{ display: 'table-cell', padding: '16px', verticalAlign: 'middle' }}>
                    <button onClick={() => deleteImportRule(rule.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 8, borderRadius: 8 }}>
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {importRules.length === 0 && (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>{t("Нет правил автоматизации.", "Нет правил автоматизации.")}</div>
              )}
            </div>
          </div>
        )}

        {/* === AUDIT LOGS TAB === */}
        {activeTab === 'audit' && (
          <div style={{ maxWidth: 1000 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>{t("Журнал аудита", "Журнал аудита")}</span>
                <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{t("Хронология действий и изменений в аккаунте. Включен режим Strict Compliance.", "Хронология действий и изменений в аккаунте. Включен режим Strict Compliance.")}</div>
              </div>
              <button 
                onClick={() => {
                  const rows = [['Дата', 'Сотрудник', 'Действие', 'Сущность', 'Детализация'],
                    ...auditLogs.map(l => [new Date(l.timestamp).toLocaleString('ru-RU'), l.userName, l.action, l.entity, l.details || ''])];
                  const a = document.createElement('a');
                  a.href = URL.createObjectURL(new Blob([rows.map(r => r.join(';')).join('\n')], { type: 'text/csv;charset=utf-8;' }));
                  a.download = 'audit_logs.csv'; a.click();
                }}
                style={{ background: 'transparent', border: '1px solid var(--border-default)', color: 'var(--text-primary)', padding: '8px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
                
                {t("Экспорт CSV", "Экспорт CSV")}
              </button>
            </div>

            <div style={{ background: 'var(--bg-surface)', borderRadius: 12, border: '1px solid var(--border-default)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: 'var(--bg-surface)' }}>
                  <tr style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                    <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)', whiteSpace: 'nowrap' }}>{t("Дата и Время", "Дата и Время")}</th>
                    <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)', whiteSpace: 'nowrap' }}>{t("Пользователь", "Пользователь")}</th>
                    <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)', whiteSpace: 'nowrap' }}>{t("Событие", "Событие")}</th>
                    <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)', whiteSpace: 'nowrap' }}>{t("Детализация", "Детализация")}</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map(log => (
                    <tr key={log.id} style={{ borderTop: '1px solid var(--border-subtle)', fontSize: 13 }}>
                      <td style={{ padding: '8px 14px', color: 'var(--text-secondary)' }}>{new Date(log.timestamp).toLocaleString('ru-RU')}</td>
                      <td style={{ padding: '8px 14px', color: 'var(--text-primary)', fontWeight: 600 }}>{log.userName}</td>
                      <td style={{ padding: 16 }}>
                        <span style={{ 
                          background: log.action === 'UPDATE' ? 'rgba(59, 130, 246, 0.1)' : log.action === 'CREATE' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)', 
                          color: log.action === 'UPDATE' ? '#3b82f6' : log.action === 'CREATE' ? '#10b981' : '#f43f5e', 
                          padding: '4px 8px', borderRadius: 4, fontWeight: 600, fontSize: 11 
                        }}>
                          {log.action} {log.entity}
                        </span>
                      </td>
                      <td style={{ padding: '8px 14px', color: 'var(--text-secondary)' }}>{log.details}</td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && (
                    <tr><td colSpan={4} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>{t("Нет записей аудита", "Нет записей аудита")}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {isInviteModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: 'var(--bg-surface)', width: 400, borderRadius: 12, border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)' }}>
              <h2 style={{ margin: 0, fontSize: 18, color: 'var(--text-primary)' }}>{t("Пригласить пользователя", "Пригласить пользователя")}</h2>
              <button onClick={() => setInviteModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>Email <span style={{ color: '#f43f5e' }}>*</span></label>
                <input id="settings-field-2" name="settings-field-2" value={newEmail} onChange={e => setNewEmail(e.target.value)} type="email" placeholder="employee@company.com" style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>{t("ФИО (Для отображения)", "ФИО (Для отображения)")}</label>
                <input id="settings-field-3" name="settings-field-3" value={newName} onChange={e => setNewName(e.target.value)} type="text" placeholder={t("Иван Иванов", "Иван Иванов")} style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>{t("Роль в системе", "Роль в системе")}</label>
                <select id="settings-select-9" name="settings-select-9" value={newRole} onChange={e => setNewRole(e.target.value as any)} style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14 }}>
                  <option value={t("Администратор", "Администратор")}>{t("Администратор (Полный доступ)", "Администратор (Полный доступ)")}</option>
                  <option value={t("Менеджер", "Менеджер")}>{t("Менеджер (Чтение и запись)", "Менеджер (Чтение и запись)")}</option>
                  <option value={t("Гость", "Гость")}>{t("Гость (Только чтение)", "Гость (Только чтение)")}</option>
                </select>
              </div>
            </div>
            <div style={{ padding: '16px 24px', background: 'var(--bg-surface)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => setInviteModalOpen(false)} style={{ padding: '10px 16px', background: 'transparent', border: 'none', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer' }}>{t("Отозвать", "Отозвать")}</button>
              <button 
                onClick={() => {
                  if (newEmail) {
                    addUser({ name: newName || newEmail.split('@')[0], email: newEmail, role: newRole });
                    setInviteModalOpen(false);
                    setNewEmail(''); setNewName('');
                  }
                }}
                style={{ padding: '0 20px', height: 30, background: 'var(--color-primary)', border: 'none', borderRadius: 6, color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 12 }}>
                
                {t("Отправить Инвайт", "Отправить Инвайт")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RBAC Modal */}
      {isPermissionsModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: 'var(--bg-surface)', width: 500, borderRadius: 12, border: '1px solid var(--border-default)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)' }}>
              <h2 style={{ margin: 0, fontSize: 18, color: 'var(--text-primary)' }}>{t("Управление Правами Доступа", "Управление Правами Доступа")}</h2>
              <button onClick={() => setPermissionsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, maxHeight: 400, overflowY: 'auto' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '0 0 8px' }}>{t("Отметьте разделы, к которым данный сотрудник будет иметь доступ. Разделы без галочек будут скрыты из левого меню.", "Отметьте разделы, к которым данный сотрудник будет иметь доступ. Разделы без галочек будут скрыты из левого меню.")}</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { id: 'main', label: "Показатели" },
                  { id: 'transactions', label: 'Операции (Чтение/Ввод)' },
                  { id: 'deals', label: 'Сделки' },
                  { id: 'plan', label: 'План и Бюджет' },
                  { id: 'reports', label: 'Отчеты: P&L и Cashflow' },
                  { id: 'treasury', label: 'Казначейство (Согласование)' },
                  { id: 'references', label: "Справочники" },
                  { id: 'assets', label: 'Активы и Обязательства' },
                  { id: '* ', label: 'Полный доступ (Admin)' }
                ].map(sec => (
                  <label key={sec.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                    <input id="settings-checkbox-4" name="settings-checkbox-4" 
                      type="checkbox" 
                      checked={editingPermissions.includes(sec.id) || editingPermissions.includes('*')}
                      disabled={editingPermissions.includes('*') && sec.id !== '*'}
                      onChange={() => {
                        if (sec.id === '*') {
                          setEditingPermissions(prev => prev.includes('*') ? [] : ['*']);
                        } else {
                          togglePermission(sec.id);
                        }
                      }}
                      style={{ accentColor: 'var(--color-primary)', width: 16, height: 16 }} 
                    />
                    <span style={{ color: 'var(--text-primary)', fontSize: 13 }}>{sec.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ padding: '16px 24px', background: 'var(--bg-surface)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => setPermissionsModalOpen(false)} style={{ padding: '10px 16px', background: 'transparent', border: 'none', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer' }}>{t("Отозвать", "Отозвать")}</button>
              <button 
                onClick={() => {
                  if (editingUserId) updateUserPermissions(editingUserId, editingPermissions);
                  setPermissionsModalOpen(false);
                }}
                style={{ padding: '10px 20px', background: 'var(--color-primary)', border: 'none', borderRadius: 8, color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer' }}>
                
                {t("Сохранить Права", "Сохранить Права")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rule Creation Modal */}
      <Modal isOpen={isRuleModalOpen} onClose={() => setIsRuleModalOpen(false)} title={t("Создать правило авто-разноски", "Создать правило авто-разноски")} width="500px">
        <form onSubmit={handleCreateRule} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>{t("Название правила", "Название правила")}</label>
            <input id="settings-text-5" name="settings-text-5" type="text" value={newRuleName} onChange={e => setNewRuleName(e.target.value)} required style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)' }} />
          </div>
          <div style={{ background: 'rgba(56, 189, 248, 0.05)', padding: 16, borderRadius: 8, border: '1px dashed rgba(56, 189, 248, 0.3)' }}>
            <div style={{ marginBottom: 12, fontWeight: 600, color: '#38bdf8' }}>{t("ШАГ 1: Если операция...", "ШАГ 1: Если операция...")}</div>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>{t("Назначение содержит слово/маску:", "Назначение содержит слово/маску:")}</label>
            <input id="settings-text-6" name="settings-text-6" type="text" value={newRuleConditionVal} onChange={e => setNewRuleConditionVal(e.target.value)} required placeholder={t("Например: Яндекс.Маркет", "Например: Яндекс.Маркет")} style={{ width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)' }} />
          </div>
          <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: 16, borderRadius: 8, border: '1px dashed rgba(16, 185, 129, 0.3)' }}>
            <div style={{ marginBottom: 12, fontWeight: 600, color: '#10b981' }}>{t("ШАГ 2: Выполнить действие", "ШАГ 2: Выполнить действие")}</div>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>{t("Подставить системную статью (ID):", "Подставить системную статью (ID):")}</label>
            <input id="settings-text-7" name="settings-text-7" type="text" value={newRuleActionVal} onChange={e => setNewRuleActionVal(e.target.value)} required placeholder={t("ID статьи", "ID статьи")} style={{ width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)' }} />
          </div>
          <button type="submit" style={{ padding: '10px', background: 'var(--color-primary)', border: 'none', borderRadius: 8, color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer', marginTop: 8 }}>
            
            {t("Сохранить правило", "Сохранить правило")}
          </button>
        </form>
      </Modal>

    </div>
  );
};

export default SettingsPage;
