import React from 'react';
import { useFinanceStore } from '../financeStore';
import { MoreVertical, Package, Wrench } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const ProductsTable: React.FC = () => {
  const { t } = useTranslation();
    const { products } = useFinanceStore();

  const thS: React.CSSProperties = {
    padding: '8px 14px',
    textAlign: 'right',
    fontWeight: 700,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    color: 'var(--text-muted)',
    borderBottom: '1px solid var(--border-subtle)',
    background: 'var(--bg-surface)',
    whiteSpace: 'nowrap',
  };

  const tdS: React.CSSProperties = {
    padding: '8px 14px',
    borderBottom: '1px solid var(--border-subtle)',
    fontSize: 12,
    color: 'var(--text-primary)',
  };

  return (
    <div style={{ background: 'var(--bg-surface)', borderRadius: 10, border: '1px solid var(--border-subtle)', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
        <thead>
          <tr>
            <th style={{ ...thS, textAlign: 'center', width: 36 }}>
              <input id="products-checkbox-1" name="products-checkbox-1" type="checkbox" style={{ accentColor: 'var(--color-primary)' }} />
            </th>
            <th style={{ ...thS, textAlign: 'left' }}>{t("Номенклатура / Артикул", "Номенклатура / Артикул")}</th>
            <th style={{ ...thS, textAlign: 'left' }}>{t("Свойства", "Свойства")}</th>
            <th style={{ ...thS }}>{t("Цена продажи", "Цена продажи")}<br />{t("(без НДС)", "(без НДС)")}</th>
            <th style={{ ...thS }}>{t("Цена", "Цена")}<br />{t("(с НДС)", "(с НДС)")}</th>
            <th style={{ ...thS }}>{t("Себестоимость", "Себестоимость")}<br />{t("(закупка)", "(закупка)")}</th>
            <th style={{ ...thS }}>{t("Остаток", "Остаток")}</th>
            <th style={{ ...thS, textAlign: 'center' }}>{t("Действия", "Действия")}</th>
          </tr>
        </thead>
        <tbody>
          {products.map(pr => {
            const priceWithVat = pr.price * (1 + pr.vatRate / 100);
            return (
              <tr
                key={pr.id}
                style={{ opacity: pr.status === 'В архиве' ? 0.5 : 1 }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ ...tdS, textAlign: 'center' }}>
                  <input id="products-checkbox-2" name="products-checkbox-2" type="checkbox" style={{ accentColor: 'var(--color-primary)' }} />
                </td>
                <td style={{ ...tdS, textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ padding: 6, background: 'var(--bg-elevated)', borderRadius: 6, flexShrink: 0 }}>
                      {pr.type === 'Товар'
                        ? <Package size={15} color="var(--color-primary)" />
                        : <Wrench size={15} color="var(--text-muted)" />}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2, fontSize: 12 }}>{pr.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>SKU: {pr.sku}</div>
                    </div>
                  </div>
                </td>
                <td style={{ ...tdS, textAlign: 'left' }}>
                  <span style={{ display: 'inline-block', background: 'var(--bg-elevated)', padding: '3px 8px', borderRadius: 4, fontSize: 11, border: '1px solid var(--border-subtle)', marginBottom: 4 }}>
                    {pr.category}
                  </span>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t("Ед. изм:", "Ед. изм:")} {pr.unit}</div>
                </td>
                <td style={{ ...tdS, textAlign: 'right' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{new Intl.NumberFormat('ru-RU').format(pr.price)}</span>
                </td>
                <td style={{ ...tdS, textAlign: 'right' }}>
                  <span style={{ fontWeight: 700, color: '#10b981' }}>{new Intl.NumberFormat('ru-RU').format(priceWithVat)}</span>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{t("НДС:", "НДС:")} {pr.vatRate}%</div>
                </td>
                <td style={{ ...tdS, textAlign: 'right' }}>
                  {pr.costPrice > 0
                    ? <span style={{ fontWeight: 600, color: 'var(--color-danger)' }}>{new Intl.NumberFormat('ru-RU').format(pr.costPrice)}</span>
                    : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                </td>
                <td style={{ ...tdS, textAlign: 'right' }}>
                  {pr.type === 'Товар'
                    ? <span style={{ fontWeight: 600, color: pr.stockBalance > 0 ? 'var(--text-primary)' : 'var(--color-danger)' }}>{pr.stockBalance} {pr.unit}</span>
                    : <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t("N/A (услуга)", "N/A (услуга)")}</span>}
                </td>
                <td style={{ ...tdS, textAlign: 'center' }}>
                  <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
                    <MoreVertical size={14} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
