// Pure column/aggregation logic for the payment calendar (extracted from the
// 588-line PaymentCalendarTable — audit P3 #21). Months are 0-based app-wide.

export const MONTH_LABELS = ['янв','Фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];

export interface DataCol {
  key: string;
  headerLabel: string;
  subLabel: string;          // 'факт' | 'план'
  year: number;
  month: number;             // 0-based; for summary = first summary month
  summaryMonths?: number[];
  day?: number;
  isPlan: boolean;
  isSummary: boolean;
  isToday: boolean;
  isGroupFirst: boolean;
}

export function buildCols(viewMode: string, year: number, month: number, now: Date = new Date()): DataCol[] {
  const cols: DataCol[] = [];
  const sumLabel = viewMode === 'По дням'
    ? `${MONTH_LABELS[month]} '${String(year).slice(2)}`
    : `Итого '${String(year).slice(2)}`;
  const summaryMonths = viewMode === 'По дням' ? [month] : [0,1,2,3,4,5,6,7,8,9,10,11];

  cols.push({ key: 'sum-f', headerLabel: sumLabel, subLabel: 'факт', year, month: summaryMonths[0], summaryMonths, isPlan: false, isSummary: true, isToday: false, isGroupFirst: true });
  cols.push({ key: 'sum-p', headerLabel: '', subLabel: 'план', year, month: summaryMonths[0], summaryMonths, isPlan: true, isSummary: true, isToday: false, isGroupFirst: false });

  if (viewMode === 'По дням') {
    const days = new Date(year, month + 1, 0).getDate();
    for (let d = 1; d <= days; d++) {
      const isToday = now.getFullYear() === year && now.getMonth() === month && now.getDate() === d;
      cols.push({ key: `d-${d}`, headerLabel: String(d), subLabel: 'факт', year, month, day: d, isPlan: false, isSummary: false, isToday, isGroupFirst: true });
    }
  } else if (viewMode === 'По кварталам') {
    for (let q = 0; q < 4; q++) {
      const sm = q * 3;
      const isToday = now.getFullYear() === year && Math.floor(now.getMonth() / 3) === q;
      cols.push({ key: `q-${q}`, headerLabel: `Q${q+1} '${String(year).slice(2)}`, subLabel: 'факт', year, month: sm, isPlan: false, isSummary: false, isToday, isGroupFirst: true });
    }
  } else {
    for (let m = 0; m < 12; m++) {
      const isToday = now.getFullYear() === year && now.getMonth() === m;
      cols.push({ key: `m-${m}`, headerLabel: `${MONTH_LABELS[m]} '${String(year).slice(2)}`, subLabel: 'факт', year, month: m, isPlan: false, isSummary: false, isToday, isGroupFirst: true });
    }
  }
  return cols;
}

export interface TxLite {
  categoryId?: string | null;
  type: string;
  date: string;
  amount: number;
  baseAmount?: number | null;
}

/**
 * Sum transactions for one column.
 * FIX (extracted-and-fixed): in 'По кварталам' the old inline code rejected any
 * month != quarter start before the quarter range check, so quarter columns
 * only showed their first month. Quarter range is now checked first.
 */
export function sumTx(txs: TxLite[], catId: string, type: string, col: DataCol, viewMode: string): number {
  return txs.filter(t => {
    if (t.categoryId !== catId || t.type !== type) return false;
    const d = new Date(t.date);
    if (col.isSummary) {
      const months = col.summaryMonths ?? [0,1,2,3,4,5,6,7,8,9,10,11];
      return d.getFullYear() === col.year && months.includes(d.getMonth());
    }
    if (d.getFullYear() !== col.year) return false;
    if (viewMode === 'По кварталам' && col.day === undefined) {
      return d.getMonth() >= col.month && d.getMonth() < col.month + 3;
    }
    if (d.getMonth() !== col.month) return false;
    if (col.day !== undefined) return d.getDate() === col.day;
    return true;
  }).reduce((s, t) => s + (t.baseAmount ?? t.amount), 0);
}
