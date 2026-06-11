import React, { useState } from 'react';
import { UploadCloud, CheckCircle, ArrowRight, AlertTriangle, X } from 'lucide-react';
import { useFinanceStore } from '../financeStore';
import { useTranslation } from 'react-i18next';

interface DataImportWizardProps {
  onClose: () => void;
}

export const DataImportWizard: React.FC<DataImportWizardProps> = ({ onClose }) => {
  const { t } = useTranslation();
    const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { addTransaction, accounts } = useFinanceStore();

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const simulateImport = () => {
    setIsProcessing(true);
    setTimeout(() => {
      // Create mock transactions
      for(let i = 0; i < 5; i++) {
        addTransaction({
          date: new Date().toISOString().split('T')[0],
          amount: Math.floor(Math.random() * 50000) + 10000,
          type: Math.random() > 0.5 ? 'income' : 'expense',
          accountId: accounts[0]?.id,
          isPaidConfirmed: true,
          description: `Импорт из ${file?.name || 'Excel_Выписка.csv'}`
        });
      }
      setIsProcessing(false);
      setStep(3);
    }, 1500);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ background: 'var(--bg-surface)', width: 600, borderRadius: 16, border: '1px solid var(--border-subtle)', overflow: 'hidden', boxShadow: 'var(--shadow-xl)' }}>
        
        <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)' }}>
          <h2 style={{ margin: 0, fontSize: 18, color: 'var(--text-primary)' }}>{t("Мастер импорта данных", "Мастер импорта данных")}</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <div style={{ display: 'flex', padding: '16px 24px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, opacity: step >= s ? 1 : 0.5 }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: step >= s ? 'var(--color-primary)' : 'var(--bg-hover)', color: step >= s ? '#fff' : 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600 }}>{s}</div>
              <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{s === 1 ? 'Загрузка' : s === 2 ? 'Распознавание' : 'Готово'}</div>
              {s !== 3 && <div style={{ flex: 1, height: 1, background: 'var(--bg-card)' }} />}
            </div>
          ))}
        </div>

        <div style={{ padding: 32 }}>
          {step === 1 && (
            <div 
              onDragOver={e => e.preventDefault()} 
              onDrop={handleFileDrop}
              style={{ border: '2px dashed var(--border-default)', borderRadius: 12, padding: 48, textAlign: 'center', background: file ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-elevated)', transition: 'all 0.2s' }}
            >
              {file ? (
                <div>
                  <CheckCircle size={48} color="#10b981" style={{ marginBottom: 16 }} />
                  <div style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{t("Файл готов к загрузке", "Файл готов к загрузке")}</div>
                  <div style={{ color: '#10b981', fontSize: 14 }}>{file.name} ({(file.size / 1024).toFixed(1)} KB)</div>
                </div>
              ) : (
                <div>
                  <UploadCloud size={48} color="var(--text-muted)" style={{ marginBottom: 16 }} />
                  <div style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{t("Перетащите CSV файл сюда", "Перетащите CSV файл сюда")}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 24 }}>{t("Поддерживаются выписки Точка Банк, Сбербанк, Альфа-Банк", "Поддерживаются выписки Точка Банк, Сбербанк, Альфа-Банк")}</div>
                  <label style={{ background: 'var(--color-primary)', color: '#fff', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500, display: 'inline-block', transition: 'transform 0.1s' }}
                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
                    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>
                    <input id="dataimportwizard-file-1" name="dataimportwizard-file-1" type="file" accept=".csv,.xlsx" style={{ display: 'none' }} onChange={e => { if(e.target.files?.length) setFile(e.target.files[0]) }} />
                    
                    {t("Выбрать файл", "Выбрать файл")}
                  </label>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              {isProcessing ? (
                <div style={{ textAlign: 'center', padding: 48 }}>
                  <div style={{ width: 40, height: 40, border: '3px solid var(--border-subtle)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 24px' }} />
                  <div style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 600 }}>{t("Анализ данных...", "Анализ данных...")}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 8 }}>{t("Применяются Smart Import Rules", "Применяются Smart Import Rules")}</div>
                  <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                </div>
              ) : (
                <div>
                  <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: 16, borderRadius: 8, display: 'flex', gap: 12, marginBottom: 24 }}>
                    <CheckCircle size={20} color="#3b82f6" />
                    <div>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{t("Найдено 5 новых транзакций", "Найдено 5 новых транзакций")}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{t("Все колонки успешно сопоставлены. Автоматически применено 2 правила разнесения.", "Все колонки успешно сопоставлены. Автоматически применено 2 правила разнесения.")}</div>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: 16, borderRadius: 8, display: 'flex', gap: 12 }}>
                    <AlertTriangle size={20} color="#f59e0b" />
                    <div>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{t("3 операции требуют внимания", "3 операции требуют внимания")}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{t("Ular joylashtiriladi \"Неразнесенные\" для ручной классификации.", "Ular joylashtiriladi \"Неразнесенные\" для ручной классификации.")}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div style={{ textAlign: 'center', padding: 32 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <CheckCircle size={32} color="#10b981" />
              </div>
              <h3 style={{ fontSize: 20, color: 'var(--text-primary)', margin: '0 0 8px' }}>{t("Импорт успешно завершен!", "Импорт успешно завершен!")}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{t("5 операций добавлено в систему и привязано к счетам.", "5 операций добавлено в систему и привязано к счетам.")}</p>
            </div>
          )}
        </div>

        <div style={{ padding: '16px 24px', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)' }}>
          <button onClick={onClose} style={{ padding: '10px 16px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}>{t("Отозвать", "Отозвать")}</button>
          
          {step === 1 && <button onClick={() => setStep(2)} disabled={!file} style={{ padding: '10px 24px', background: 'var(--color-primary)', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, cursor: file ? 'pointer' : 'default', opacity: file ? 1 : 0.5, display: 'flex', alignItems: 'center', gap: 8 }}>{t("Далее", "Далее")} <ArrowRight size={16} /></button>}
          {step === 2 && !isProcessing && <button onClick={simulateImport} style={{ padding: '10px 24px', background: 'var(--color-primary)', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>{t("Подтвердить импорт", "Подтвердить импорт")} <CheckCircle size={16} /></button>}
          {step === 3 && <button onClick={onClose} style={{ padding: '10px 24px', background: 'var(--color-primary)', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, cursor: 'pointer' }}>{t("Перейти к операциям", "Перейти к операциям")}</button>}
        </div>

      </div>
    </div>
  );
};
