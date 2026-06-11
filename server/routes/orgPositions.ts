import { Router, type Request, type Response } from 'express';
import prisma from '../db';
import { authContext } from '../context';

const router = Router();

const isAdmin = () => {
  const ctx = authContext.getStore();
  return ctx?.role === 'admin' || ctx?.role === 'owner';
};

function buildTree(items: any[], parentId: string | null = null): any[] {
  return items
    .filter(i => i.parentId === parentId)
    .map(i => ({ ...i, children: buildTree(items, i.id) }));
}

// GET /api/org-positions
router.get('/', async (_req: Request, res: Response) => {
  try {
    const positions = await (prisma as any).orgPosition.findMany({
      include: { _count: { select: { employees: true } } },
      orderBy: [{ level: 'asc' }, { name: 'asc' }],
    });
    res.json(positions);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Internal server error' }); }
});

// GET /api/org-positions/tree
router.get('/tree', async (_req: Request, res: Response) => {
  try {
    const positions = await (prisma as any).orgPosition.findMany({
      include: { _count: { select: { employees: true } } },
      orderBy: [{ level: 'asc' }, { name: 'asc' }],
    });
    res.json(buildTree(positions, null));
  } catch (e) { console.error(e); res.status(500).json({ error: 'Internal server error' }); }
});

// PUT /api/org-positions/:id
router.put('/:id', async (req: Request, res: Response) => {
  if (!isAdmin()) return res.status(403).json({ error: 'Access denied' });
  try {
    const { staffLimit, name, note } = req.body;
    const data: any = {};
    if (staffLimit !== undefined) data.staffLimit = staffLimit === null ? null : Number(staffLimit);
    if (name !== undefined) data.name = name;
    if (note !== undefined) data.note = note;
    const pos = await (prisma as any).orgPosition.update({
      where: { id: req.params.id },
      data,
      include: { _count: { select: { employees: true } } },
    });
    res.json(pos);
  } catch (e: any) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Not found' });
    console.error(e); res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/org-positions
router.post('/', async (req: Request, res: Response) => {
  if (!isAdmin()) return res.status(403).json({ error: 'Access denied' });
  try {
    const { code, name, department, section, level, parentId, staffLimit, note } = req.body;
    if (!name) return res.status(400).json({ error: 'name обязателен' });
    const pos = await (prisma as any).orgPosition.create({
      data: {
        code: code || null, name, department: department || null,
        section: section || null, level: Number(level ?? 1),
        parentId: parentId || null, staffLimit: staffLimit != null ? Number(staffLimit) : 1,
        note: note || null,
      },
      include: { _count: { select: { employees: true } } },
    });
    res.status(201).json(pos);
  } catch (e: any) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'Такой код уже существует' });
    console.error(e); res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/org-positions/:id
router.delete('/:id', async (req: Request, res: Response) => {
  if (!isAdmin()) return res.status(403).json({ error: 'Access denied' });
  try {
    const pos = await (prisma as any).orgPosition.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { employees: true } } },
    });
    if (!pos) return res.status(404).json({ error: 'Not found' });
    if (pos._count.employees > 0) return res.status(409).json({ error: `Нельзя удалить: ${pos._count.employees} сотрудников привязаны` });
    const children = await (prisma as any).orgPosition.count({ where: { parentId: req.params.id } });
    if (children > 0) return res.status(409).json({ error: `Нельзя удалить: есть дочерние должности (${children})` });
    await (prisma as any).orgPosition.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e: any) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Not found' });
    console.error(e); res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
