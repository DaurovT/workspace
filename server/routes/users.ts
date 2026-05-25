import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../db';

const router = Router();

const mapUser = (u: any) => ({
  ...u,
  permissions: JSON.parse(u.permissions),
  allowedApps: u.allowedApps ? JSON.parse(u.allowedApps) : null,
  passwordHash: undefined, // never expose
  color: u.color || '#6366f1',
  isActive: u.isActive !== false, // default to true if null/undefined
  jobTitle: u.jobTitle || '',
});

// GET /api/users
router.get('/', async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users.map(mapUser));
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /api/users
router.post('/', async (req: Request, res: Response) => {
  try {
    const { permissions, allowedApps, password, ...rest } = req.body;
    const defaultPassword = password || '12345678';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(defaultPassword, salt);

    const user = await prisma.user.create({
      data: {
        ...rest,
        passwordHash,
        permissions: JSON.stringify(permissions ?? []),
        allowedApps: allowedApps !== undefined ? JSON.stringify(allowedApps) : null,
      },
    });
    res.status(201).json(mapUser(user));
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// PUT /api/users/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { permissions, allowedApps, passwordHash, password, ...rest } = req.body;
    const data: any = { ...rest };
    if (permissions !== undefined) data.permissions = JSON.stringify(permissions);
    if (allowedApps !== undefined) data.allowedApps = allowedApps === null ? null : JSON.stringify(allowedApps);
    if (password) {
      const salt = await bcrypt.genSalt(10);
      data.passwordHash = await bcrypt.hash(password, salt);
    }
    const user = await prisma.user.update({
      where: { id: req.params.id as string },
      data,
    });
    res.json(mapUser(user));
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// DELETE /api/users/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.params.id as string;
    // Clean up ProjectMember
    await prisma.arcanaProjectMember.deleteMany({ where: { userId } });
    
    // We explicitly leave assigneeId and reporterId as the deleted user's ID.
    // The frontend will treat tasks with an unknown assigneeId as "Ghosts" 
    // and force the user to reassign them.
    
    await prisma.user.delete({ where: { id: userId } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /api/users/:id/bind-code
router.post('/:id/bind-code', async (req: Request, res: Response) => {
  try {
    const userId = req.params.id as string;
    
    // Generate a random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    const user = await prisma.user.update({
      where: { id: userId },
      data: { telegramBindCode: code },
    });
    
    res.json({ code });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
