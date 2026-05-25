import React, { useState } from 'react';
import { useProcurementStore, type ProcurementItem } from '../procurementStore';
import { X, Save, TrendingDown, TrendingUp } from 'lucide-react';

interface Props {
  item: ProcurementItem;
  onClose: () => void;
}

const ProcurementCalculator: React.FC<Props> = ({ item, onClose }) => {
  const updateItem = useProcurementStore(state => state.updateItem);
  
  const [formData, setFormData] = useState({
    tenderPrice: item.tenderPrice,
    supplierPrice: item.supplierPrice,
    logisticsCost: item.logisticsCost,
    brokerPct: item.brokerPct,
    brokerAmount: item.brokerAmount,
    certification: item.certification,
    customs: item.customs,
    otherExpenses: item.otherExpenses
  });

  const [saving, setSaving] = useState(false);

  const baseSum = item.quantity * formData.supplierPrice;
  const brokerAmountCalc = formData.brokerAmount > 0 ? formData.brokerAmount : (baseSum * (formData.brokerPct / 100));
  const additional = formData.logisticsCost + formData.certification + formData.customs + formData.otherExpenses;
  
  const netSum = baseSum + brokerAmountCalc + additional;
  
  const tenderSum = item.quantity * formData.tenderPrice;
  const diffSum = tenderSum - netSum;
  const isNegative = diffSum < 0;

  const handleSave = async () => {
    setSaving(true);
    await updateItem(item.id, formData);
    setSaving(false);
    onClose();
  };

  const InputRow = ({ label, field, type = 'number' }: any) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{label}</span>
      <input 
        type={type} 
        className="form-control"
        value={(formData as any)[field] || 0} 
        onChange={e => setFormData({...formData, [field]: parseFloat(e.target.value) || 0})}
        style={{ width: 140, textAlign: 'right' }}
      />
    </div>
  );

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ width: 500, maxWidth: '100%' }}>
        
        {/* Header */}
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Калькулятор: {item.productName}</h3>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 4 }}>Кол-во: {item.quantity} {item.unit}</div>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ overflowY: 'auto' }}>
          
          <div>
            <h4 style={{ margin: '0 0 12px 0', fontSize: 'var(--text-sm)', color: 'var(--color-warning)' }}>Основные цены</h4>
            <InputRow label="Цена поставщика (за ед.)" field="supplierPrice" />
            <InputRow label="Тендерная цена (за ед.)" field="tenderPrice" />
          </div>

          <div>
            <h4 style={{ margin: '0 0 12px 0', fontSize: 'var(--text-sm)', color: 'var(--color-warning)' }}>Доп. расходы (на весь объем)</h4>
            <InputRow label="Логистика" field="logisticsCost" />
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Брокерские услуги</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <input 
                  type="number" className="form-control" value={formData.brokerPct} 
                  onChange={e => setFormData({...formData, brokerPct: parseFloat(e.target.value) || 0, brokerAmount: 0})}
                  placeholder="%"
                  style={{ width: 60, textAlign: 'right' }}
                />
                <span style={{ color: 'var(--text-muted)', alignSelf: 'center' }}>или</span>
                <input 
                  type="number" className="form-control" value={formData.brokerAmount} 
                  onChange={e => setFormData({...formData, brokerAmount: parseFloat(e.target.value) || 0, brokerPct: 0})}
                  placeholder="Сумма"
                  style={{ width: 90, textAlign: 'right' }}
                />
              </div>
            </div>

            <InputRow label="Сертификация" field="certification" />
            <InputRow label="Таможня" field="customs" />
            <InputRow label="Прочие расходы" field="otherExpenses" />
          </div>

          <div style={{ background: 'var(--bg-elevated)', padding: 16, borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Приводная сумма:</span>
              <span style={{ color: 'var(--text-primary)' }}>{netSum.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Тендерная сумма:</span>
              <span style={{ color: 'var(--text-primary)' }}>{tenderSum.toLocaleString()}</span>
            </div>
            <div style={{ height: 1, background: 'var(--border-subtle)', margin: '12px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Разница (Чистая прибыль):</span>
              <span style={{ 
                color: isNegative ? 'var(--color-danger)' : 'var(--color-success)', 
                fontWeight: 700, fontSize: 'var(--text-xl)',
                display: 'flex', alignItems: 'center', gap: 4
              }}>
                {isNegative ? <TrendingDown size={18} /> : <TrendingUp size={18} />}
                {diffSum.toLocaleString()}
              </span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Отмена
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            <Save size={16} />
            {saving ? 'Сохранение...' : 'Сохранить расчет'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProcurementCalculator;
