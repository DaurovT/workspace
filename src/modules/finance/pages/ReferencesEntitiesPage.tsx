import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle2, MapPin, CreditCard, FileText, Filter, X, Edit2 } from 'lucide-react';
import { APP_CURRENCY } from '../config/currency';
import { useFinanceStore } from '../financeStore';
import type { LegalEntity } from '../financeStore';
import { useTranslation } from 'react-i18next';

const VAT_COLOR: Record<string, string> = { 'ОСН': '#ef4444', 'УСН 6%': '#10b981', 'УСН 15%': '#f59e0b', 'ПСН': '#8b5cf6', 'НПД': '#3b82f6', 'ЕСХН': '#6b7280' };
const TYPE_FILTER = ['Все', 'МЧЖ', 'АЖ', 'ЯТТ', 'ДК', 'ХК'] as const;

const sLbl: React.CSSProperties = { display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 };
const sInp: React.CSSProperties = { width: '100%', height: 30, padding: '0 8px', borderRadius: 6, background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: 12, outline: 'none', boxSizing: 'border-box' };

const Field = ({ label, value, mono }: { label: string; value?: string; mono?: boolean }) => (
  value ? (
    <div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, color: 'var(--text-primary)', fontFamily: mono ? 'monospace' : 'inherit' }}>{value}</div>
    </div>
  ) : null
);

const ReferencesEntitiesPage: React.FC = () => {
  const { t } = useTranslation();
    const { entities, addEntity, updateEntity, deleteEntity, setMainEntity } = useFinanceStore();
  const [selectedId, setSelectedId] = useState<string>('');
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [isEditMode, setEditMode] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [filterType, setFilterType] = useState('Все');
  const [f, setF] = useState<Partial<LegalEntity>>({ type: 'МЧЖ', vatMode: 'УСН 6%', currency: APP_CURRENCY, isMain: false });
  const setFld = (k: keyof LegalEntity, v: any) => setF(p => ({ ...p, [k]: v }));

  useEffect(() => {
    if (entities.length > 0 && !selectedId) {
      setSelectedId(entities[0].id);
    }
  }, [entities, selectedId]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key.toLowerCase() === 'f' && !['INPUT','TEXTAREA','SELECT'].includes((e.target as HTMLElement).tagName)) setSidebarOpen(p => !p); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const filtered = entities.filter(e => filterType === 'Все' || e.type === filterType);
  const selected = entities.find(e => e.id === selectedId) ?? null;

  const handleCreate = async () => {
    if (!f.shortName || !f.inn) return;
    try {
      const body = { name: f.name || f.shortName || '', shortName: f.shortName || '', inn: f.inn || '', kpp: f.kpp, ogrn: f.ogrn, type: f.type || 'МЧЖ', isMain: false, legalAddress: f.legalAddress || '', actualAddress: f.actualAddress || '', phone: f.phone || '', bankName: f.bankName || '', bankMfo: f.bankMfo || '', bankAccount: f.bankAccount || '', vatMode: f.vatMode || 'УСН 6%', currency: f.currency || APP_CURRENCY };
      if (isEditMode && f.id) {
        // UPDATE existing entity
        await updateEntity(f.id, body);
      } else {
        // CREATE new entity
        await addEntity(body as LegalEntity);
      }
      setCreateOpen(false);
      setF({ type: 'МЧЖ', vatMode: 'УСН 6%', currency: APP_CURRENCY, isMain: false });
      setEditMode(false);
    } catch (e) {
      console.error('Failed to create entity', e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEntity(id);
      const remaining = entities.filter(e => e.id !== id);
      setSelectedId(remaining[0]?.id || '');
    } catch (e) {
      console.error('Failed to delete entity', e);
    }
  };


  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: 'var(--bg-base)' }}>

      {/* SIDEBAR */}
      {isSidebarOpen && (
        <div style={{ width: 200, flexShrink: 0, borderRight: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: 44, padding: '0 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Filter size={13} color="var(--text-muted)" /><span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{t("Фильтры", "Фильтры")}</span></div>
            <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={14} /></button>
          </div>
          <div style={{ flex: 1, padding: 12, overflowY: 'auto' }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 8 }}>{t("Тип организации", "Тип организации")}</div>
            {TYPE_FILTER.map(t => (
              <div key={t} onClick={() => setFilterType(t)} style={{ padding: '6px 10px', borderRadius: 6, cursor: 'pointer', marginBottom: 2, background: filterType === t ? 'var(--bg-hover)' : 'transparent', color: filterType === t ? 'var(--color-primary)' : 'var(--text-secondary)', fontWeight: filterType === t ? 600 : 400, fontSize: 13, display: 'flex', justifyContent: 'space-between' }}
                onMouseEnter={e => { if (filterType !== t) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                onMouseLeave={e => { if (filterType !== t) e.currentTarget.style.background = 'transparent'; }}>
                <span>{t}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t === 'Все' ? entities.length : entities.filter(e => e.type === t).length}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MAIN */}
      <div style={{ flex: 1, display: 'flex', minWidth: 0 }}>

        {/* Entity list */}
        <div style={{ width: 280, flexShrink: 0, borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)' }}>
          {/* Header */}
          <div style={{ height: 44, padding: '0 12px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1, overflow: 'hidden' }}>
              <button onClick={() => setSidebarOpen(!isSidebarOpen)} style={{ background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 4, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0 }}><Filter size={12} /></button>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{t("Мои юрлица", "Мои юрлица")}</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', padding: '0 5px', borderRadius: 4, lineHeight: '18px', flexShrink: 0 }}>{filtered.length}</span>
            </div>
            <button onClick={() => setCreateOpen(true)} className="header-btn header-btn-primary" style={{ flexShrink: 0, gap: 4, fontSize: 12 }}><Plus size={11} />  {t("Добавить", "Добавить")}</button>
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filtered.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>{t("Нет организаций", "Нет организаций")}</div>}

            {filtered.map(e => (
              <div key={e.id} onClick={() => setSelectedId(e.id)} style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border-subtle)', background: selectedId === e.id ? 'var(--bg-hover)' : 'transparent', borderLeft: `2px solid ${selectedId === e.id ? 'var(--color-primary)' : 'transparent'}`, transition: 'all 160ms' }}
                onMouseEnter={ev => { if (selectedId !== e.id) ev.currentTarget.style.background = 'var(--bg-hover)'; }}
                onMouseLeave={ev => { if (selectedId !== e.id) ev.currentTarget.style.background = 'transparent'; }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(99,102,241,0.12)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{e.type}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.shortName}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{t("ИНН", "ИНН")} {e.inn}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: VAT_COLOR[e.vatMode as string], background: VAT_COLOR[e.vatMode as string] + '20', padding: '0 5px', borderRadius: 4 }}>{e.vatMode}</span>
                      {e.isMain && <span style={{ fontSize: 10, fontWeight: 600, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '0 5px', borderRadius: 4 }}>{t("Основное", "Основное")}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        {selected ? (
          <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
            {/* Detail header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{t("Карточка организации", "Карточка организации")}</div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{selected.shortName}</h2>
                {selected.shortName !== selected.name && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{selected.name}</div>}
                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: VAT_COLOR[selected.vatMode as string], background: VAT_COLOR[selected.vatMode as string] + '20', padding: '2px 8px', borderRadius: 4 }}>{selected.vatMode}</span>
                  {selected.isMain && <span style={{ fontSize: 11, fontWeight: 600, color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', padding: '2px 8px', borderRadius: 4 }}>{t("✓ Основное юрлицо", "✓ Основное юрлицо")}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {!selected.isMain && <button onClick={async () => {
                  try {
                    await setMainEntity(selected.id);
                  } catch (e) { console.error('Failed to set main', e); }
                }} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0 12px', height: 30, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 6, fontSize: 12, color: '#10b981', cursor: 'pointer' }}><CheckCircle2 size={12} />  {t("Сделать основным", "Сделать основным")}</button>}
                <button onClick={() => { setEditMode(true); setCreateOpen(true); setF({ ...selected }); }} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0 12px', height: 30, background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 6, fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' }}><Edit2 size={12} />  {t("Изменить", "Изменить")}</button>
                {!selected.isMain && <button onClick={() => handleDelete(selected.id)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0 12px', height: 30, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, fontSize: 12, color: '#ef4444', cursor: 'pointer' }}><Trash2 size={12} />  {t("Удалить", "Удалить")}</button>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Регистрация */}
              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><FileText size={13} />  {t("Регистрация", "Регистрация")}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Field label={t("Тип / ОПФ", "Тип / ОПФ")} value={selected.type} />
                  <Field label={t("ИНН / ПИНФЛ", "ИНН / ПИНФЛ")} value={selected.inn} mono />
                  {selected.kpp && <Field label={t("КПП", "КПП")} value={selected.kpp} mono />}
                  <Field label={t("ОГРН / ОГРНИП", "ОГРН / ОГРНИП")} value={selected.ogrn} mono />
                </div>
              </div>

              {/* Контакты */}
              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={13} />  {t("Адреса и контакты", "Адреса и контакты")}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Field label={t("Юридический адрес", "Юридический адрес")} value={selected.legalAddress} />
                  <Field label={t("Фактический адрес", "Фактический адрес")} value={selected.actualAddress} />
                  <Field label={t("Телефон", "Телефон")} value={selected.phone} />
                </div>
              </div>

              {/* Банк */}
              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: 16, gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><CreditCard size={13} />  {t("Банковские реквизиты", "Банковские реквизиты")}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                  <Field label={t("Банк", "Банк")} value={selected.bankName} />
                  <Field label={t("МФО", "МФО")} value={selected.bankMfo} mono />
                  <Field label={t("Расчётный счёт", "Расчётный счёт")} value={selected.bankAccount} mono />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>{t("Выберите организацию из списка", "Выберите организацию из списка")}</div>
        )}
      </div>

      {/* CREATE MODAL */}
      {isCreateOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setCreateOpen(false)} />
          <div style={{ position: 'relative', width: 520, maxHeight: '88vh', background: 'var(--bg-surface)', borderRadius: 12, boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{isEditMode ? 'Редактировать юридическое лицо' : 'Добавить юридическое лицо'}</h2>
              <button onClick={() => setCreateOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={sLbl}>{t("Тип (ОПФ)", "Тип (ОПФ)")}</label><select value={f.type} onChange={e => setFld('type', e.target.value)} style={{ ...sInp, height: 30 }}>{['МЧЖ','АЖ','ЯТТ','ДК','ХК'].map(t => <option key={t}>{t}</option>)}</select></div>
                <div><label style={sLbl}>{t("Налогообложение", "Налогообложение")}</label><select value={f.vatMode} onChange={e => setFld('vatMode', e.target.value)} style={{ ...sInp, height: 30 }}>{['ОСН','УСН 6%','УСН 15%','ПСН','НПД','ЕСХН'].map(v => <option key={v}>{v}</option>)}</select></div>
              </div>
              <div><label style={sLbl}>{t("Краткое наименование *", "Краткое наименование *")}</label><input value={f.shortName || ''} onChange={e => setFld('shortName', e.target.value)} placeholder={t("МЧЖ «Компания»", "МЧЖ «Компания»")} style={sInp} /></div>
              <div><label style={sLbl}>{t("Полное наименование", "Полное наименование")}</label><input value={f.name || ''} onChange={e => setFld('name', e.target.value)} placeholder={t("Масъулияти чекланган жамият...", "Масъулияти чекланган жамият...")} style={sInp} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={sLbl}>{t("ИНН / ПИНФЛ *", "ИНН / ПИНФЛ *")}</label><input value={f.inn || ''} onChange={e => setFld('inn', e.target.value)} placeholder='123456789' style={{ ...sInp, fontFamily: 'monospace' }} /></div>
                <div><label style={sLbl}>{t("ОГРН / ОГРНИП", "ОГРН / ОГРНИП")}</label><input value={f.ogrn || ''} onChange={e => setFld('ogrn', e.target.value)} style={{ ...sInp, fontFamily: 'monospace' }} /></div>
              </div>
              <div><label style={sLbl}>{t("Юридический адрес", "Юридический адрес")}</label><input value={f.legalAddress || ''} onChange={e => setFld('legalAddress', e.target.value)} style={sInp} /></div>
              <div><label style={sLbl}>{t("Телефон", "Телефон")}</label><input value={f.phone || ''} onChange={e => setFld('phone', e.target.value)} placeholder='+998 71 000-00-00' style={sInp} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                <div><label style={sLbl}>{t("Банк", "Банк")}</label><input value={f.bankName || ''} onChange={e => setFld('bankName', e.target.value)} style={sInp} /></div>
                <div><label style={sLbl}>{t("МФО (5 цифр)", "МФО (5 цифр)")}</label><input value={f.bankMfo || ''} onChange={e => setFld('bankMfo', e.target.value)} maxLength={5} style={{ ...sInp, fontFamily: 'monospace' }} /></div>
              </div>
              <div><label style={sLbl}>{t("Расчётный счёт (20 цифр)", "Расчётный счёт (20 цифр)")}</label><input value={f.bankAccount || ''} onChange={e => setFld('bankAccount', e.target.value)} maxLength={20} style={{ ...sInp, fontFamily: 'monospace' }} /></div>
            </div>
            <div style={{ padding: '12px 20px', background: 'var(--bg-base)', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t("* обязательные поля", "* обязательные поля")}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setCreateOpen(false)} style={{ padding: '0 14px', height: 30, borderRadius: 6, background: 'transparent', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12 }}>{t("Отозвать", "Отозвать")}</button>
                <button onClick={handleCreate} style={{ padding: '0 16px', height: 30, borderRadius: 6, background: 'var(--color-primary)', border: 'none', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 12 }}>{isEditMode ? 'Обновить' : 'Сохранить'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferencesEntitiesPage;
