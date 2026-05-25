import React, { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { useProcurementStore } from '../procurementStore';

interface Props {
  onClose: () => void;
}

type Step = 'select' | 'uploading' | 'done' | 'error';

const TEMPLATE_HEADERS = ['Наименование', 'Категория', 'Ед.изм.', 'Количество', 'Тендерная цена', 'Цена поставщика', 'Дата поставки', 'Комментарий'];

const ExcelImportModal: React.FC<Props> = ({ onClose }) => {
  const requests = useProcurementStore(state => state.requests);
  const loadItems = useProcurementStore(state => state.loadItems);

  const [step, setStep] = useState<Step>('select');
  const [selectedRequestId, setSelectedRequestId] = useState(requests[0]?.id || '');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{ imported: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (!f.name.match(/\.(xlsx|xls|csv)$/i)) {
      setErrorMsg('Поддерживаются только .xlsx, .xls или .csv файлы');
      setStep('error');
      return;
    }
    setFile(f);
    setStep('select');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!file || !selectedRequestId) return;
    setStep('uploading');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('requestId', selectedRequestId);

    try {
      const res = await fetch('/api/procurement/items/import-excel', {
        method: 'POST',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
        credentials: 'include',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка импорта');

      setResult({ imported: data.imported });
      await loadItems();
      setStep('done');
    } catch (err: any) {
      setErrorMsg(err.message);
      setStep('error');
    }
  };

  const downloadTemplate = () => {
    // Create a simple CSV template
    const csv = TEMPLATE_HEADERS.join(',') + '\n' + 'Говядина охлажденная,Мясо,кг,100,75000,60000,2024-07-01,Основной поставщик';
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'zakupki_shablon.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 520 }}>

        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileSpreadsheet size={20} color="var(--color-success)" />
            <h3 className="modal-title">Импорт из Excel</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">

          {/* Success */}
          {step === 'done' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <CheckCircle size={48} color="var(--color-success)" style={{ marginBottom: 16 }} />
              <h4 style={{ fontSize: 18, margin: '0 0 8px', color: 'var(--text-primary)' }}>Импорт завершён!</h4>
              <p style={{ color: 'var(--text-secondary)' }}>Загружено позиций: <strong style={{ color: 'var(--color-success)' }}>{result?.imported}</strong></p>
            </div>
          )}

          {/* Error */}
          {step === 'error' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <AlertCircle size={48} color="var(--color-danger)" style={{ marginBottom: 16 }} />
              <h4 style={{ fontSize: 18, margin: '0 0 8px', color: 'var(--text-primary)' }}>Ошибка импорта</h4>
              <p style={{ color: 'var(--color-danger)', fontSize: 14 }}>{errorMsg}</p>
            </div>
          )}

          {/* Select + Upload */}
          {(step === 'select' || step === 'uploading') && (
            <>
              {/* Template download */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={downloadTemplate} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Download size={14} /> Скачать шаблон
                </button>
              </div>

              {/* Request selector */}
              <div className="form-group">
                <label className="form-label">Привязать к заявке</label>
                <select
                  className="form-control select-control"
                  value={selectedRequestId}
                  onChange={e => setSelectedRequestId(e.target.value)}
                >
                  <option value="">Выберите заявку...</option>
                  {requests.map(r => (
                    <option key={r.id} value={r.id}>{r.number || 'Заявка от ' + r.dateStr}</option>
                  ))}
                </select>
              </div>

              {/* Drop zone */}
              <div
                onClick={() => inputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                style={{
                  border: `2px dashed ${dragging ? 'var(--color-primary)' : file ? 'var(--color-success)' : 'var(--border-default)'}`,
                  borderRadius: 'var(--radius-lg)',
                  padding: '32px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: dragging ? 'var(--bg-active)' : file ? 'rgba(22,163,74,0.05)' : 'var(--bg-elevated)',
                }}
              >
                <input
                  ref={inputRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }}
                  onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
                {file ? (
                  <>
                    <FileSpreadsheet size={32} color="var(--color-success)" style={{ marginBottom: 10 }} />
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{file.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Нажмите чтобы выбрать другой файл</div>
                  </>
                ) : (
                  <>
                    <Upload size={32} color="var(--text-muted)" style={{ marginBottom: 10 }} />
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Перетащите файл сюда</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>или нажмите для выбора (.xlsx, .xls, .csv)</div>
                  </>
                )}
              </div>

              {/* Column hint */}
              <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '12px 16px' }}>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Ожидаемые колонки (первая строка)</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {TEMPLATE_HEADERS.map(h => (
                    <span key={h} className="tag" style={{ fontSize: 11 }}>{h}</span>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          {step === 'done' && (
            <button className="btn btn-primary" onClick={onClose}>Готово</button>
          )}
          {step === 'error' && (
            <>
              <button className="btn btn-secondary" onClick={() => { setStep('select'); setFile(null); }}>Попробовать снова</button>
              <button className="btn btn-ghost" onClick={onClose}>Закрыть</button>
            </>
          )}
          {(step === 'select' || step === 'uploading') && (
            <>
              <button className="btn btn-secondary" onClick={onClose} disabled={step === 'uploading'}>Отмена</button>
              <button
                className="btn btn-primary"
                onClick={handleUpload}
                disabled={!file || !selectedRequestId || step === 'uploading'}
              >
                <Upload size={16} />
                {step === 'uploading' ? 'Загрузка...' : 'Импортировать'}
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default ExcelImportModal;
