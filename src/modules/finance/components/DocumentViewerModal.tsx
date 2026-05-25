import React, { useRef } from 'react';
import { Modal } from './Modal';
import { useFinanceStore } from '../financeStore';
import { Printer, CheckCircle, Clock } from 'lucide-react';

interface Props {
  docId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentViewerModal: React.FC<Props> = ({ docId, isOpen, onClose }) => {
  const { contractors, deals, products, documents } = useFinanceStore();
  const printRef = useRef<HTMLDivElement>(null);

  const doc = documents.find((d: any) => d.id === docId);
  if (!doc) return null;

  const deal = deals.find(d => d.id === doc.dealId);
  const contractor = contractors.find(c => c.id === deal?.contractorId);

  const handlePrint = () => {
    // Apply temporary class for printing
    document.body.classList.add('printing-mode');
    setTimeout(() => {
      window.print();
      document.body.classList.remove('printing-mode');
    }, 100);
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'paid': return <span style={{ padding: '4px 8px', borderRadius: 6, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}><CheckCircle size={14}/> Оплачен</span>;
      case 'issued': return <span style={{ padding: '4px 8px', borderRadius: 6, background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}><Clock size={14}/> Выставлен (Ожидает оплаты)</span>;
      default: return <span style={{ padding: '4px 8px', borderRadius: 6, background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 13 }}>Черновик</span>;
    }
  };

  // We are injecting print styles dynamically. Real world we'd put this in index.css
  const printStyles = `
    @media print {
      body * { visibility: hidden; }
      body.printing-mode .print-container, 
      body.printing-mode .print-container * {
        visibility: visible;
      }
      body.printing-mode .print-container {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        background: white !important;
        color: black !important;
        padding: 2cm !important;
      }
      .no-print { display: none !important; }
    }
  `;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Документ ${doc.number}`} width="850px">
      <style>{printStyles}</style>

      {/* Toolbar */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, padding: 16, background: 'var(--bg-base)', borderRadius: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {getStatusBadge(doc.status)}
          {doc.status === 'draft' && (
            <button onClick={() => {}} style={{ background: 'var(--color-primary)', color: 'var(--text-primary)', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>Пометить как "Выставлен"</button>
          )}
          {doc.status === 'issued' && (
            <button onClick={() => {}} style={{ background: 'var(--color-primary)', color: 'var(--text-primary)', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>Пометить как "Оплачен"</button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', color: '#000', border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            <Printer size={16} /> Печать PDF
          </button>
        </div>
      </div>

      {/* Document A4 Page Simulation */}
      <div 
        className="print-container"
        ref={printRef}
        style={{ 
          background: '#fff', color: '#000', padding: '40px', borderRadius: 8, 
          fontFamily: 'Arial, sans-serif', fontSize: 13, lineHeight: 1.5,
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
        }}
      >
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: 20, marginBottom: 20 }}>
          <div>
            <span style={{ fontSize: 24, margin: '0 0 8px 0' }}>{doc.type === 'invoice' ? 'СЧЕТ НА ОПЛАТУ' : 'АКТ ВЫПОЛНЕННЫХ РАБОТ'}</span>
            <div style={{ fontSize: 16, fontWeight: 'bold' }}>№ {doc.number} от {new Date(doc.date).toLocaleDateString('ru-RU')} г.</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1e3a8a' }}>WorkSpace Pro</div>
            <div>ООО "Моя ИТ-Компания"</div>
            <div>ИНН: 7701234567, КПП: 770101001</div>
            <div>г. Москва, ул. Ленина, д.1</div>
          </div>
        </div>

        <table style={{ width: '100%', marginBottom: 30, borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '8px 0', width: '150px', verticalAlign: 'top', fontWeight: 'bold' }}>Поставщик:</td>
              <td style={{ padding: '8px 0' }}>ООО "Моя ИТ-Компания", ИНН 7701234567, КПП 770101001, г. Москва, ул. Ленина, д.1, р/с 40702810123450000000 в ПАО СБЕРБАНК, БИК 044525225</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', verticalAlign: 'top', fontWeight: 'bold' }}>Покупатель:</td>
              <td style={{ padding: '8px 0' }}>{contractor?.name}, {contractor?.type}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', verticalAlign: 'top', fontWeight: 'bold' }}>Основание:</td>
              <td style={{ padding: '8px 0' }}>Основной договор № {deal?.name}</td>
            </tr>
          </tbody>
        </table>

        {/* Items Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20, border: '2px solid #000' }}>
          <thead>
            <tr style={{ background: '#f3f4f6' }}>
              <th style={{ border: '1px solid #000', padding: 8, textAlign: 'center', width: 40 }}>№</th>
              <th style={{ border: '1px solid #000', padding: 8, textAlign: 'left' }}>Наименование товара, работ, услуг</th>
              <th style={{ border: '1px solid #000', padding: 8, textAlign: 'center', width: 60 }}>Кол-во</th>
              <th style={{ border: '1px solid #000', padding: 8, textAlign: 'center', width: 60 }}>Ед.</th>
              <th style={{ border: '1px solid #000', padding: 8, textAlign: 'right', width: 100 }}>Цена</th>
              <th style={{ border: '1px solid #000', padding: 8, textAlign: 'right', width: 120 }}>Сумма</th>
            </tr>
          </thead>
          <tbody>
            {doc.items.map((item: any, idx: any) => {
              const p = products.find(prod => prod.id === item.productId);
              const lineTotal = item.price * item.quantity * (1 + item.vatRate / 100);
              return (
                <tr key={item.id}>
                  <td style={{ border: '1px solid #000', padding: 8, textAlign: 'center' }}>{idx + 1}</td>
                  <td style={{ border: '1px solid #000', padding: 8 }}>{p?.name || 'Неизвестная позиция'}</td>
                  <td style={{ border: '1px solid #000', padding: 8, textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ border: '1px solid #000', padding: 8, textAlign: 'center' }}>{p?.unit || 'шт'}</td>
                  <td style={{ border: '1px solid #000', padding: 8, textAlign: 'right' }}>{new Intl.NumberFormat('ru-RU').format(item.price)}</td>
                  <td style={{ border: '1px solid #000', padding: 8, textAlign: 'right' }}>{new Intl.NumberFormat('ru-RU').format(lineTotal)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 40 }}>
          <table style={{ width: '300px', fontWeight: 'bold' }}>
            <tbody>
              <tr>
                <td style={{ padding: 4, textAlign: 'right' }}>Итого без НДС:</td>
                <td style={{ padding: 4, textAlign: 'right' }}>{new Intl.NumberFormat('ru-RU').format(doc.totalAmount - doc.vatAmount)} сум</td>
              </tr>
              <tr>
                <td style={{ padding: 4, textAlign: 'right' }}>В том числе НДС:</td>
                <td style={{ padding: 4, textAlign: 'right' }}>{new Intl.NumberFormat('ru-RU').format(doc.vatAmount)} сум</td>
              </tr>
              <tr>
                <td style={{ padding: 4, textAlign: 'right', fontSize: 16 }}>Всего к оплате:</td>
                <td style={{ padding: 4, textAlign: 'right', fontSize: 16 }}>{new Intl.NumberFormat('ru-RU').format(doc.totalAmount)} сум</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Signatures */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #000', paddingTop: 20 }}>
          <div style={{ width: '45%' }}>
            <div style={{ fontWeight: 'bold', marginBottom: 16 }}>Руководитель предприятия</div>
            <div style={{ borderBottom: '1px solid #000', position: 'relative' }}>
              {/* Fake signature wrapper */}
              <div style={{ position: 'absolute', top: -30, left: 30, color: 'blue', fontFamily: 'cursive', fontSize: 24, opacity: 0.6, transform: 'rotate(-10deg)' }}>Иванов А.А.</div>
              <div style={{ opacity: 0 }}>_______________</div>
            </div>
            <div style={{ fontSize: 10, textAlign: 'center' }}>(подпись)</div>
          </div>
          <div style={{ width: '45%' }}>
            <div style={{ fontWeight: 'bold', marginBottom: 16 }}>Главный бухгалтер</div>
            <div style={{ borderBottom: '1px solid #000', position: 'relative' }}>
              <div style={{ position: 'absolute', top: -20, left: 20, color: 'blue', fontFamily: 'cursive', fontSize: 20, opacity: 0.6, transform: 'rotate(-5deg)' }}>Смирнова Е.</div>
              <div style={{ opacity: 0 }}>_______________</div>
            </div>
            <div style={{ fontSize: 10, textAlign: 'center' }}>(подпись)</div>
          </div>
        </div>
        
        {/* Fake Company Stamp */}
        <div style={{ position: 'relative', height: 0 }}>
          <div style={{ position: 'absolute', top: -140, left: 100, width: 120, height: 120, borderRadius: '50%', border: '4px solid rgba(0,0,255,0.4)', opacity: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(15deg)' }}>
            <div style={{ textAlign: 'center', color: 'rgba(0,0,255,0.6)', fontSize: 10, border: '1px solid rgba(0,0,255,0.4)', borderRadius: '50%', padding: 10, width: '90%', height: '90%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ООО "Моя ИТ-Компания"<br/>Для Документов
            </div>
          </div>
        </div>

      </div>
    </Modal>
  );
};
