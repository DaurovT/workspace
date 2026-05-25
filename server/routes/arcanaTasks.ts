import { Router } from 'express';
import prisma from '../db';
import { authContext } from '../context';

const router = Router();

// GET all tasks (optionally filter by projectId)
router.get('/', async (req, res) => {
  try {
    const where: any = {};
    if (req.query.projectId) where.projectId = req.query.projectId as string;

    const tasks = await prisma.arcanaTask.findMany({
      where,
      orderBy: { position: 'asc' }
    });
    const mapped = tasks.map(t => ({
      id: t.id,
      projectId: t.projectId,
      parentId: t.parentId || null,
      title: t.title,
      description: t.description,
      priority: t.priority,
      status: t.status,
      assigneeId: t.assigneeId || null,
      reporterId: t.reporterId,
      startDate: t.startDate,
      dueDate: t.dueDate,
      tags: JSON.parse(t.tags),
      estimatedHours: t.estimatedHours,
      loggedHours: t.loggedHours,
      position: t.position,
      progress: t.progress,
      dependencies: JSON.parse(t.dependencies),
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }));
    res.json(mapped);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// POST create task
router.post('/', async (req, res) => {
  try {
    const d = req.body;
    const task = await prisma.arcanaTask.create({
      data: {
        id: d.id || undefined,
        projectId: d.projectId,
        parentId: d.parentId || null,
        title: d.title,
        description: d.description || '',
        priority: d.priority || 'medium',
        status: d.status || 'todo',
        assigneeId: d.assigneeId || null,
        reporterId: d.reporterId || d.assigneeId || 'unknown',
        startDate: d.startDate,
        dueDate: d.dueDate,
        tags: JSON.stringify(d.tags || []),
        estimatedHours: d.estimatedHours || 0,
        loggedHours: d.loggedHours || 0,
        position: d.position || 0,
        progress: d.progress || 0,
        dependencies: JSON.stringify(d.dependencies || []),
      }
    });
    res.status(201).json({
      ...task,
      tags: JSON.parse(task.tags),
      dependencies: JSON.parse(task.dependencies),
      parentId: task.parentId || null,
      assigneeId: task.assigneeId || null,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PUT update task
router.put('/:id', async (req, res) => {
  try {
    const d = req.body;
    
    // Optimistic Concurrency Control (OCC)
    if (d.expectedVersion) {
      const existingTask = await prisma.arcanaTask.findUnique({ where: { id: req.params.id } });
      if (existingTask) {
        const existingTime = existingTask.updatedAt.getTime();
        const expectedTime = new Date(d.expectedVersion).getTime();
        
        // If the task in DB has a newer timestamp than what the client expected, it's a conflict!
        // We use Math.abs because JS dates might have slight precision mismatches, 
        // but if the existingTime is strictly greater (by more than ~1000ms usually), it's a conflict.
        // Actually, just checking if it's not equal is safer, but let's just do greater.
        if (existingTime > expectedTime + 1000) { // allow 1s precision difference
          return res.status(409).json({ error: 'Conflict: Task was modified by another user' });
        }
      }
    }

    const data: any = {};
    if (d.title !== undefined) data.title = d.title;
    if (d.description !== undefined) data.description = d.description;
    if (d.priority !== undefined) data.priority = d.priority;
    if (d.status !== undefined) data.status = d.status;
    if (d.assigneeId !== undefined) data.assigneeId = d.assigneeId;
    if (d.reporterId !== undefined) data.reporterId = d.reporterId;
    if (d.startDate !== undefined) data.startDate = d.startDate;
    if (d.dueDate !== undefined) data.dueDate = d.dueDate;
    if (d.tags !== undefined) data.tags = JSON.stringify(d.tags);
    if (d.estimatedHours !== undefined) data.estimatedHours = d.estimatedHours;
    if (d.loggedHours !== undefined) data.loggedHours = d.loggedHours;
    if (d.position !== undefined) data.position = d.position;
    if (d.progress !== undefined) data.progress = d.progress;
    if (d.dependencies !== undefined) data.dependencies = JSON.stringify(d.dependencies);
    if (d.parentId !== undefined) data.parentId = d.parentId;
    if (d.projectId !== undefined) data.projectId = d.projectId;

    const task = await prisma.arcanaTask.update({
      where: { id: req.params.id },
      data
    });
    res.json({
      ...task,
      tags: JSON.parse(task.tags),
      dependencies: JSON.parse(task.dependencies),
      parentId: task.parentId || null,
      assigneeId: task.assigneeId || null,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// PUT bulk update tasks
router.put('/bulk/update', async (req, res) => {
  try {
    const { ids, updates } = req.body;
    const data: any = {};
    if (updates.status !== undefined) data.status = updates.status;
    if (updates.priority !== undefined) data.priority = updates.priority;
    if (updates.assigneeId !== undefined) data.assigneeId = updates.assigneeId;
    if (updates.progress !== undefined) data.progress = updates.progress;

    await prisma.arcanaTask.updateMany({
      where: { id: { in: ids } },
      data
    });
    res.json({ success: true, count: ids.length });
  } catch (error) {
    console.error('Error bulk updating tasks:', error);
    res.status(500).json({ error: 'Failed to bulk update tasks' });
  }
});

// POST cascade recalculate tasks (Gantt logic)
router.post('/:id/cascade', async (req, res) => {
  try {
    const taskId = req.params.id;
    const { deltaDays } = req.body;
    
    if (deltaDays <= 0) return res.json({ updated: [] });

    // Fetch the task to get its projectId
    const targetTask = await prisma.arcanaTask.findUnique({ where: { id: taskId } });
    if (!targetTask) return res.status(404).json({ error: 'Task not found' });

    // Fetch all project tasks
    const tasks = await prisma.arcanaTask.findMany({ where: { projectId: targetTask.projectId } });
    
    // Map to GanttTask format
    const ganttTasks = tasks.map(t => ({
      id: t.id,
      startDate: t.startDate,
      dueDate: t.dueDate,
      status: t.status,
      parentId: t.parentId,
      dependencies: JSON.parse(t.dependencies)
    }));

    // Import and run logic
    const { cascadeRecalculate } = await import('../utils/ganttDeps');
    const recalculated = cascadeRecalculate(taskId, deltaDays, ganttTasks);

    // Find tasks whose dates have changed
    const changedTasks = recalculated.filter(rt => {
       const original = ganttTasks.find(ot => ot.id === rt.id);
       return original && (original.startDate !== rt.startDate || original.dueDate !== rt.dueDate);
    });

    // Update in a transaction
    const updates = await prisma.$transaction(
      changedTasks.map(ct => prisma.arcanaTask.update({
        where: { id: ct.id },
        data: { startDate: ct.startDate, dueDate: ct.dueDate }
      }))
    );

    res.json({ updated: updates.map(u => ({ id: u.id, startDate: u.startDate, dueDate: u.dueDate })) });
  } catch (error) {
    console.error('Error cascading tasks:', error);
    res.status(500).json({ error: 'Failed to cascade tasks' });
  }
});

// POST log time
router.post('/:id/time', async (req, res) => {
  try {
    const taskId = req.params.id;
    const { hours, notes, date } = req.body;

    const ctx = authContext.getStore();
    if (!ctx || !ctx.userId) return res.status(401).json({ error: 'Unauthorized' });
    const finalUserId = ctx.userId;

    // Create TimeLog and update task loggedHours in a transaction
    const [timeLog, task] = await prisma.$transaction([
      prisma.timeLog.create({
        data: {
          taskId,
          userId: finalUserId,
          hours: Number(hours),
          date: date || new Date().toISOString().slice(0, 10),
          notes: notes || ''
        }
      }),
      prisma.arcanaTask.update({
        where: { id: taskId },
        data: { loggedHours: { increment: Number(hours) } }
      })
    ]);

    res.json({ success: true, timeLog, task });
  } catch (error) {
    console.error('Error logging time:', error);
    res.status(500).json({ error: 'Failed to log time' });
  }
});

// DELETE task
router.delete('/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    const task = await prisma.arcanaTask.findUnique({ where: { id: taskId } });
    if (!task) return res.json({ success: true });

    // Fetch all project tasks to resolve descendants recursively
    const allProjectTasks = await prisma.arcanaTask.findMany({ 
      where: { projectId: task.projectId }, 
      select: { id: true, parentId: true } 
    });
    
    const toDelete = new Set<string>([taskId]);
    let added = true;
    while(added) {
       added = false;
       for (const t of allProjectTasks) {
          if (t.parentId && toDelete.has(t.parentId) && !toDelete.has(t.id)) {
             toDelete.add(t.id);
             added = true;
          }
       }
    }

    // Delete task and all its recursive subtasks
    await prisma.arcanaTask.deleteMany({
      where: { id: { in: Array.from(toDelete) } }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;
