import React, { useState } from 'react';
import { Modal } from './Modal';
import { useFinanceStore } from '../financeStore';
import type { Product } from '../financeStore';
import { useTranslation } from 'react-i18next';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ProductFormModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
    const addProduct = useFinanceStore(state => state.addProduct);

  const [type, setType] = useState<'Товар' | 'Услуга'>('Товар');
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [unit, setUnit] = useState('шт.');
  const [price, setPrice] = useState('');
  const [vatRate, setVatRate] = useState('20');
  const [stockBalance, setStockBalance] = useState('0');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;

    const newProduct: Product = {
      id: `pr_${Date.now()}`,
      type,
      name,
      sku: sku || `SKU-${Math.floor(Math.random()*10000)}`,
      category: type === 'Товар' ? 'Товары' : 'Услуги',
      unit,
      price: Number(price),
      vatRate: Number(vatRate),
      costPrice: 0,
      stockBalance: type === 'Товар' ? Number(stockBalance) : 0,
      status: 'Активные'
    };

    addProduct(newProduct);
    onClose();
  };

  const inputStyle = { width: '100%', padding: '10px 14px', background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14 };
  const labelStyle = { display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t("Новая позиция", "Новая позиция")} width="450px">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        
        <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)', fontSize: 14, cursor: 'pointer' }}>
            <input id="productformmodal-radio-1" name="productformmodal-radio-1" type="radio" checked={type === 'Товар'} onChange={() => setType('Товар')} style={{ accentColor: '#38bdf8' }} />  {t("Товар", "Товар")}
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)', fontSize: 14, cursor: 'pointer' }}>
            <input id="productformmodal-radio-2" name="productformmodal-radio-2" type="radio" checked={type === 'Услуга'} onChange={() => setType('Услуга')} style={{ accentColor: '#38bdf8' }} />  {t("Услуга", "Услуга")}
          </label>
        </div>

        <div>
          <label style={labelStyle}>{t("Наименование", "Наименование")} <span style={{ color: '#38bdf8' }}>*</span></label>
          <input id="productformmodal-text-3" name="productformmodal-text-3" type="text" value={name} onChange={e => setName(e.target.value)} required placeholder={t("Например: Ноутбук Lenovo", "Например: Ноутбук Lenovo")} style={inputStyle} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>{t("Артикул (SKU)", "Артикул (SKU)")}</label>
            <input id="productformmodal-text-4" name="productformmodal-text-4" type="text" value={sku} onChange={e => setSku(e.target.value)} placeholder="LEN-123" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>{t("Ед. измерения", "Ед. измерения")}</label>
            <input id="productformmodal-text-5" name="productformmodal-text-5" type="text" value={unit} onChange={e => setUnit(e.target.value)} placeholder={t("шт / час / кг", "шт / час / кг")} style={inputStyle} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>{t("Цена (Без НДС)", "Цена (Без НДС)")} <span style={{ color: '#38bdf8' }}>*</span></label>
            <input id="productformmodal-number-6" name="productformmodal-number-6" type="number" value={price} onChange={e => setPrice(e.target.value)} required placeholder="0.00" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>{t("Ставка НДС (%)", "Ставка НДС (%)")}</label>
            <select id="productformmodal-select-8" name="productformmodal-select-8" value={vatRate} onChange={e => setVatRate(e.target.value)} style={inputStyle}>
              <option value="20">20%</option>
              <option value="10">10%</option>
              <option value="0">{t("0% (Без НДС)", "0% (Без НДС)")}</option>
            </select>
          </div>
        </div>

        {type === 'Товар' && (
          <div>
            <label style={labelStyle}>{t("Начальный остаток на складе", "Начальный остаток на складе")}</label>
            <input id="productformmodal-number-7" name="productformmodal-number-7" type="number" value={stockBalance} onChange={e => setStockBalance(e.target.value)} style={inputStyle} />
          </div>
        )}

        {price && (
          <div style={{ marginTop: 8, padding: 12, background: 'rgba(56, 189, 248, 0.1)', borderRadius: 8, border: '1px dashed rgba(56, 189, 248, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'rgba(56, 189, 248, 0.8)' }}>{t("Итоговая цена с НДС:", "Итоговая цена с НДС:")}</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#4ade80' }}>
              {new Intl.NumberFormat('ru-RU').format(Number(price) * (1 + Number(vatRate)/100))}
            </span>
          </div>
        )}

        <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button type="button" onClick={onClose} style={{ padding: '10px 16px', background: 'transparent', border: 'none', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer' }}>
            
            {t("Отозвать", "Отозвать")}
          </button>
          <button type="submit" style={{ padding: '10px 20px', background: '#38bdf8', border: 'none', borderRadius: 8, color: '#0f172a', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(56,189,248,0.3)' }}>
            
            {t("Сохранить позицию", "Сохранить позицию")}
          </button>
        </div>
      </form>
    </Modal>
  );
};
