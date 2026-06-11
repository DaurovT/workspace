import { useRef } from 'react';
import { X, Printer, Wallet } from 'lucide-react';
import type { PayrollEntry } from '../hrStore';

interface Props {
  entry: PayrollEntry;
  employeeName?: string;
  onClose: () => void;
}

const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

export default function PayslipModal({ entry, employeeName, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('ru-RU').format(Math.abs(val));

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      
      {/* Container that we want to print */}
      <div style={{ width: 600, background: '#fff', borderRadius: 12, display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        
        {/* Header - No print */}
        <div className="no-print" style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#111827' }}>Расчетный листок</h3>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#f3f4f6', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500 }}>
              <Printer size={16} /> Печать / PDF
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={20} color="#6b7280" /></button>
          </div>
        </div>

        {/* Printable Area */}
        <div ref={printRef} className="print-area" style={{ padding: 40, overflowY: 'auto', color: '#000', fontFamily: 'serif' }}>
          
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px 0', color: '#000' }}>РАСЧЕТНЫЙ ЛИСТОК</h1>
            <p style={{ margin: 0, fontSize: 16, color: '#374151' }}>
              за {MONTHS[(entry as any).payrollRun?.month - 1 || 0]} {(entry as any).payrollRun?.year || new Date().getFullYear()} г.
            </p>
          </div>

          <div style={{ marginBottom: 32, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, borderBottom: '2px solid #000', paddingBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 8, background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Wallet size={24} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>«Бекобод Овқатланиш комбинати» МЧЖ</div>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#6b7280', textTransform: 'uppercase' }}>Сотрудник</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{employeeName || entry.employeeId}</div>
            </div>
          </div>

          {/* Details Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 32 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #000' }}>
                <th style={{ textAlign: 'left', padding: '8px 0', fontSize: 14 }}>Вид начисления / удержания</th>
                <th style={{ textAlign: 'right', padding: '8px 0', fontSize: 14 }}>Начислено</th>
                <th style={{ textAlign: 'right', padding: '8px 0', fontSize: 14 }}>Удержано</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '8px 0', fontSize: 14 }}>Оклад / Тарифная ставка</td>
                <td style={{ textAlign: 'right', padding: '8px 0', fontSize: 14 }}>{formatCurrency(entry.baseSalary)}</td>
                <td style={{ textAlign: 'right', padding: '8px 0', fontSize: 14 }}></td>
              </tr>
              {entry.details?.map((d: any) => {
                const isDeduction = d.amount < 0;
                return (
                  <tr key={d.id}>
                    <td style={{ padding: '8px 0', fontSize: 14 }}>{d.label}</td>
                    <td style={{ textAlign: 'right', padding: '8px 0', fontSize: 14 }}>{!isDeduction ? formatCurrency(d.amount) : ''}</td>
                    <td style={{ textAlign: 'right', padding: '8px 0', fontSize: 14 }}>{isDeduction ? formatCurrency(d.amount) : ''}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid #000', fontWeight: 600 }}>
                <td style={{ padding: '12px 0', fontSize: 14 }}>ИТОГО УДЕРЖАНО</td>
                <td></td>
                <td style={{ textAlign: 'right', padding: '12px 0', fontSize: 14 }}>{formatCurrency(entry.deductions)}</td>
              </tr>
            </tfoot>
          </table>

          {/* Net Amount */}
          <div style={{ background: '#f3f4f6', padding: 24, borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 18, fontWeight: 600, color: '#111827' }}>К ВЫПЛАТЕ:</span>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#111827' }}>{formatCurrency(entry.netAmount)} UZS</span>
          </div>

        </div>
      </div>
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-area, .print-area * {
              visibility: visible;
            }
            .print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .no-print {
              display: none !important;
            }
          }
        `}
      </style>
    </div>
  );
}
