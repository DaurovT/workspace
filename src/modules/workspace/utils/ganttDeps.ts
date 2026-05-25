/**
 * ganttDeps.ts
 * Pure (no-React) dependency engine for Gantt chart.
 */

import { addDays, differenceInDays, startOfDay } from 'date-fns';

// ─── Types (mirrored from store so this file has zero React deps) ────────────
export type DependencyType = 'FS' | 'SS' | 'FF' | 'SF' | 'relates_to' | 'blocks' | 'blocked_by';

export interface GanttDep {
  taskId: string;        // predecessor ID
  type: DependencyType;
  lag?: number;          // days; positive = delay, negative = lead
}

export interface GanttTask {
  id: string;
  startDate: string;
  dueDate: string;
  status: string;
  parentId?: string | null;
  dependencies?: GanttDep[];
}

// ─── Constraint check ────────────────────────────────────────────────────────
/**
 * Returns true if the successor satisfies the constraint imposed by pred.
 */
export function checkConstraint(pred: GanttTask, succ: GanttTask, dep: GanttDep): boolean {
  if (dep.type === 'relates_to') return true;
  const lag = dep.lag ?? 0;
  const predStart = startOfDay(new Date(pred.startDate));
  const predEnd   = startOfDay(new Date(pred.dueDate));
  const succStart = startOfDay(new Date(succ.startDate));
  const succEnd   = startOfDay(new Date(succ.dueDate));

  switch (dep.type) {
    case 'FS': return succStart >= addDays(predEnd,   lag + 1); // B starts after A ends (next day)
    case 'SS': return succStart >= addDays(predStart, lag);     // B starts after A starts
    case 'FF': return succEnd   >= addDays(predEnd,   lag);     // B ends after A ends
    case 'SF': return succEnd   >= addDays(predStart, lag);     // B ends after A starts
    default:   return true;
  }
}

// ─── Conflict detection ──────────────────────────────────────────────────────
/**
 * Returns a Set of task IDs that have at least one violated dependency.
 */
export function findAllConflicts(tasks: GanttTask[]): Set<string> {
  const taskMap = new Map(tasks.map(t => [t.id, t]));
  const conflicts = new Set<string>();

  for (const task of tasks) {
    if (!task.dependencies) continue;
    for (const dep of task.dependencies) {
      if (dep.type === 'relates_to') continue;
      const pred = taskMap.get(dep.taskId);
      if (!pred) continue;
      if (!checkConstraint(pred, task, dep)) {
        conflicts.add(task.id);   // successor is the conflicting one
        conflicts.add(pred.id);   // also highlight the predecessor
      }
    }
  }
  return conflicts;
}

// ─── Cycle detection ─────────────────────────────────────────────────────────
/**
 * Returns true if adding an edge from `succId` depending on `predId`
 * would create a cycle in the dependency graph.
 */
export function wouldCreateCycle(succId: string, predId: string, tasks: GanttTask[]): boolean {
  if (succId === predId) return true;

  // Build adjacency: successor → [predecessors]
  const preds = new Map<string, string[]>();
  for (const t of tasks) {
    if (!t.dependencies) continue;
    for (const dep of t.dependencies) {
      if (!preds.has(t.id)) preds.set(t.id, []);
      preds.get(t.id)!.push(dep.taskId);
    }
  }
  // Temporarily add the new edge
  if (!preds.has(succId)) preds.set(succId, []);
  preds.get(succId)!.push(predId);

  // DFS from predId — if we can reach succId, there's a cycle
  const visited = new Set<string>();
  const stack = [predId];
  while (stack.length) {
    const cur = stack.pop()!;
    if (cur === succId) return true;
    if (visited.has(cur)) continue;
    visited.add(cur);
    // Walk PREDECESSORS of cur (i.e. if cur has deps, follow them)
    const curPreds = preds.get(cur) ?? [];
    stack.push(...curPreds);
  }
  return false;
}

// ─── Cascade recalculation ───────────────────────────────────────────────────
/**
 * When a task is moved by `deltaDays`, cascade the shift to all
 * FS/SS/FF/SF successors that would be violated.
 * Returns a new array of tasks with updated dates (immutable).
 */
export function cascadeRecalculate(
  movedTaskId: string,
  deltaDays: number,
  tasks: GanttTask[],
): GanttTask[] {
  if (deltaDays <= 0) return tasks; // Only cascade right-shifts automatically

  const taskMap = new Map(tasks.map(t => [t.id, { ...t }]));

  // BFS: starting from movedTaskId's direct successors
  const queue: string[] = [movedTaskId];
  const visited = new Set<string>();

  while (queue.length) {
    const curId = queue.shift()!;
    if (visited.has(curId)) continue;
    visited.add(curId);

    const cur = taskMap.get(curId)!;

    // Find all tasks that depend on curId
    for (const [, t] of taskMap) {
      if (!t.dependencies) continue;
      for (const dep of t.dependencies) {
        if (dep.type === 'relates_to') continue;
        if (dep.taskId !== curId) continue;

        // Check if constraint is violated
        if (!checkConstraint(cur, t, dep)) {
          // Calculate how much we need to shift the successor
          const lag = dep.lag ?? 0;
          const predStart = startOfDay(new Date(cur.startDate));
          const predEnd   = startOfDay(new Date(cur.dueDate));
          const succStart = startOfDay(new Date(t.startDate));
          const succEnd   = startOfDay(new Date(t.dueDate));
          const duration  = differenceInDays(succEnd, succStart);

          let newStart: Date;
          switch (dep.type) {
            case 'FS': newStart = addDays(predEnd, lag + 1); break;
            case 'SS': newStart = addDays(predStart, lag);   break;
            case 'FF': {
              // Keep duration, shift so succEnd = predEnd + lag
              const newEnd = addDays(predEnd, lag);
              newStart = addDays(newEnd, -duration);
              break;
            }
            case 'SF': {
              const newEnd = addDays(predStart, lag);
              newStart = addDays(newEnd, -duration);
              break;
            }
            default: continue;
          }

          const newEnd = addDays(newStart, duration);
          taskMap.set(t.id, {
            ...t,
            startDate: newStart.toISOString(),
            dueDate:   newEnd.toISOString(),
          });

          queue.push(t.id);
        }
      }
    }
  }

  return tasks.map(t => taskMap.get(t.id) ?? t);
}

// ─── Validate drag ─────────────────────────────────────────────────────────
/**
 * Check if moving `taskId` to a new start/end date would violate
 * any of its INCOMING dependencies (predecessors).
 * Returns list of violated predecessor IDs, empty = OK to move.
 */
export function validateDrag(
  taskId: string,
  newStart: Date,
  newEnd: Date,
  tasks: GanttTask[],
): string[] {
  const taskMap = new Map(tasks.map(t => [t.id, t]));
  const task = taskMap.get(taskId);
  if (!task || !task.dependencies) return [];

  const violations: string[] = [];
  const tentativeTask = { ...task, startDate: newStart.toISOString(), dueDate: newEnd.toISOString() };

  for (const dep of task.dependencies) {
    if (dep.type === 'relates_to') continue;
    const pred = taskMap.get(dep.taskId);
    if (!pred) continue;
    if (!checkConstraint(pred, tentativeTask, dep)) {
      violations.push(dep.taskId);
    }
  }
  return violations;
}

// ─── Human-readable dependency label ─────────────────────────────────────────
export const DEP_LABELS: Record<DependencyType, string> = {
  FS: 'Финиш → Старт',
  SS: 'Старт → Старт',
  FF: 'Финиш → Финиш',
  SF: 'Старт → Финиш',
  relates_to: 'Связана',
  blocks: 'Блокирует',
  blocked_by: 'Заблокирована',
};
