import { useState } from 'react';
import { useHRStore } from '../hrStore';
import { FileText, Calendar, Download } from 'lucide-react';
import PayslipModal from '../components/PayslipModal';

const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

export default function MyHRDashboard() {
  const { myProfile } = useHRStore();
  const [selectedEntry, setSelectedEntry] = useState<any>(null);

  if (!myProfile) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        <p>Ваш профиль сотрудника не найден. Обратитесь в HR отдел.</p>
      </div>
    );
  }

  const formatCurrency = (val: number) => new Intl.NumberFormat('ru-RU').format(Math.abs(val));

  return (
    <div style={{ padding: 32, height: '100%', overflowY: 'auto', background: 'var(--bg-base)' }}>
      <h2 style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 32 }}>Мой личный кабинет HR</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24, alignItems: 'flex-start' }}>
        
        {/* Left Column: Info & Absences */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Profile Card */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Мои данные</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Должность</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{myProfile.position || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Отдел</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{myProfile.department || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Текущий оклад</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{formatCurrency(myProfile.salary)} {myProfile.currency}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Дата найма</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{new Date(myProfile.hireDate).toLocaleDateString('ru-RU')}</div>
              </div>
            </div>
          </div>

          {/* My Absences */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Мои отсутствия</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {myProfile.absences?.length === 0 && (
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Нет записей об отсутствии</div>
              )}
              {myProfile.absences?.map((abs: any) => (
                <div key={abs.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid var(--border-subtle)' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                      {abs.type === 'vacation' ? 'Отпуск' : abs.type === 'sick' ? 'Больничный' : 'Отгул'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {new Date(abs.startDate).toLocaleDateString('ru-RU')} - {new Date(abs.endDate).toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: abs.status === 'approved' ? '#10b98120' : abs.status === 'rejected' ? '#ef444420' : '#f59e0b20', color: abs.status === 'approved' ? '#10b981' : abs.status === 'rejected' ? '#ef4444' : '#f59e0b' }}>
                    {abs.status === 'approved' ? 'Одобрено' : abs.status === 'rejected' ? 'Отклонено' : 'Ожидает'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Left Column Part 2: My Time Logs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: 24, marginTop: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Мои Таймшиты (Arcana)</h3>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Последние {myProfile.timeLogs?.length || 0} записей</div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {myProfile.timeLogs?.length === 0 && (
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Нет списанных часов</div>
              )}
              {myProfile.timeLogs?.map((log: any) => (
                <div key={log.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid var(--border-subtle)' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                      {log.notes || 'Без описания'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 6, alignItems: 'center' }}>
                      <Calendar size={11} /> {new Date(log.date).toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-primary)', background: 'var(--bg-elevated)', padding: '4px 10px', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                    {log.hours} ч.
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Right Column: Payslips */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 20 }}>История выплат и расчетные листки</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {myProfile.payrollEntries?.length === 0 && (
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>История зарплат пуста</div>
            )}
            
            {myProfile.payrollEntries?.map((entry: any) => {
              const run = entry.payrollRun;
              if (!run || run.status === 'draft') return null; // Don't show drafts to employees

              return (
                <div key={entry.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: 16, border: '1px solid var(--border-subtle)', borderRadius: 8, background: 'var(--bg-surface)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: run.type === 'advance' ? '#3b82f615' : '#8b5cf615', color: run.type === 'advance' ? '#3b82f6' : '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileText size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        {run.type === 'advance' ? 'Аванс' : 'Расчет'} за {MONTHS[run.month - 1]} {run.year}
                        <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: run.status === 'paid' ? '#10b98120' : '#f59e0b20', color: run.status === 'paid' ? '#10b981' : '#f59e0b', textTransform: 'uppercase' }}>
                          {run.status === 'paid' ? 'Выплачено' : 'Начислено'}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                        К выплате: <span style={{ fontWeight: 600 }}>{formatCurrency(entry.netAmount)} UZS</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => setSelectedEntry(entry)}
                    style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px',
                    background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', borderRadius: 6,
                    fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s'
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card)'}
                  >
                    <Download size={14} /> Скачать PDF
                  </button>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {selectedEntry && (
        <PayslipModal entry={selectedEntry} employeeName={myProfile?.user?.name} onClose={() => setSelectedEntry(null)} />
      )}
    </div>
  );
}
