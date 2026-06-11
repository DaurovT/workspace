// Единый источник правды для типов учётных статей
// Используется в CategoriesTreeTable и ReferencesCategoriesPage

export const ROOT_GROUPS = [
  { id: 'root_income',    label: 'Выручка (Revenue)',       type: 'income',    color: '#10b981' },
  { id: 'root_expense',   label: 'Расходы',       type: 'expense',   color: '#ef4444' },
  { id: 'root_asset',     label: 'Активы',        type: 'asset',     color: '#3b82f6' },
  { id: 'root_liability', label: 'ОБЯЗАТЕЛЬСТВА', type: 'liability', color: '#f59e0b' },
  { id: 'root_equity',    label: 'Капитал',       type: 'equity',    color: '#8b5cf6' },
  { id: 'root_transfer',  label: 'Переводы',      type: 'transfer',  color: '#64748b' },
  { id: 'root_accrual',   label: 'Начисления',    type: 'accrual',   color: '#0ea5e9' },
] as const;

export type CategoryTypeName = typeof ROOT_GROUPS[number]['type'];

export const ROOT_GROUP_BY_TYPE = Object.fromEntries(
  ROOT_GROUPS.map(g => [g.type, g])
) as Record<CategoryTypeName, typeof ROOT_GROUPS[number]>;

export const ACTIVITY_LABELS: Record<string, string> = {
  operating: 'Операционный',
  financing:  'Финансовая',
  investing:  'Инвестиционный',
};

export const TYPE_LABELS: Record<string, string> = {
  income:    'Выручка (Revenue)',
  expense:   "Расход",
  asset:     'Активы',
  liability: 'Обязательство',
  equity:    'Капитал',
  transfer:  "Перевод",
  accrual:   'Начисление',
};
