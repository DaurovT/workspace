import { startOfDay } from 'date-fns';
let d1 = startOfDay(new Date('2026-03-16T00:00:00Z'));
let d2 = startOfDay(new Date('2026-03-23T00:00:00Z'));
console.log(d1 < d2);
