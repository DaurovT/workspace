const { startOfDay, addDays, differenceInDays } = require('date-fns');

const tasks = [
  { id: 't1', parentId: undefined, startDate: '2026-03-12T00:00:00Z', dueDate: '2026-03-24T00:00:00Z' },
  { id: 't2', parentId: 't1', startDate: '2026-03-16T00:00:00Z', dueDate: '2026-03-16T00:00:00Z' }
];

const viewStart = new Date('2026-03-16T00:00:00Z');
const ganttScale = 'week';

function dateToPixel(date, vs, scale) {
  const dX = differenceInDays(date, vs);
  return dX * (100 / 7);
}

const getBar = (task) => {
    let start = startOfDay(new Date(task.startDate));
    let end   = startOfDay(new Date(task.dueDate));
    
    let left  = dateToPixel(start, viewStart, ganttScale);
    let right = dateToPixel(addDays(end, 1), viewStart, ganttScale);

    if (task.parentId) {
      const parent = tasks.find((t) => t.id === task.parentId);
      if (parent) {
        const pStart = startOfDay(new Date(parent.startDate));
        const pEnd = startOfDay(new Date(parent.dueDate));
        const pLeft = dateToPixel(pStart, viewStart, ganttScale);
        const pRight = dateToPixel(addDays(pEnd, 1), viewStart, ganttScale);
        
        console.log(`Subtask Before: left=${left}`);
        console.log(`Parent Bounds: pLeft=${pLeft}, pRight=${pRight}`);
        
        if (left < pLeft) left = pLeft;
        if (right > pRight) right = pRight;
        if (right < left) right = left;
        
        console.log(`Subtask After: left=${left}`);
      }
    }

    return { left, width: Math.max(right - left, 10) };
  };

console.log("PARENT:", getBar(tasks[0]));
console.log("SUBTASK:", getBar(tasks[1]));
