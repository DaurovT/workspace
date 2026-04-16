const { addDays, startOfWeek, subWeeks, startOfDay, addMonths, differenceInDays, getDaysInMonth, endOfMonth } = require('date-fns');

const CELL_W = { day: 44, week: 120, month: 60 };
const COL_COUNT = { day: 365, week: 156, month: 36 };
const viewStart = startOfWeek(subWeeks(new Date(), 2), { weekStartsOn: 1 });
const ganttScale = 'week';
const n = COL_COUNT[ganttScale];
const columns = Array.from({ length: Math.min(n, 5) }, (_, i) => addDays(viewStart, i * 7));
console.log(columns);
