import { Router } from 'express';
import prisma from '../db';

const router = Router();

// GET all projects for the current user
router.get('/', async (_req, res) => {
  try {
    const { authContext } = await import('../context');
    const ctx = authContext.getStore();
    
    const projects = await prisma.arcanaProject.findMany({
      where: { members: { some: { userId: ctx?.userId } } },
      include: { members: true },
      orderBy: { createdAt: 'asc' }
    });
    // Map to frontend format
    const mapped = projects.map(p => ({
      id: p.id,
      name: p.name,
      color: p.color,
      icon: p.icon,
      description: p.description,
      status: p.status,
      createdAt: p.createdAt.toISOString(),
      members: p.members.map(m => ({ userId: m.userId, role: m.role }))
    }));
    res.json(mapped);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// POST create project
router.post('/', async (req, res) => {
  try {
    const { name, color, icon, description, status, members } = req.body;
    
    // Create Arcana Project
    const project = await prisma.arcanaProject.create({
      data: {
        name: name || 'Новый проект',
        color: color || '#654ef1',
        icon: icon || '📁',
        description: description || '',
        status: status || 'active',
        members: {
          create: (members || []).map((m: any) => ({ userId: m.userId, role: m.role || 'member' }))
        }
      },
      include: { members: true }
    });

    // M2: Auto-sync to Finance Project
    try {
      await prisma.project.create({
        data: {
          id: project.id,
          name: project.name,
          status: project.status === 'active' ? 'В работе' : 'Завершен',
          description: project.description
        }
      });
    } catch (e) {
      console.warn('Failed to sync project to finance module:', e);
      // We don't fail the arcana project creation if finance sync fails
    }

    res.status(201).json({
      id: project.id,
      name: project.name,
      color: project.color,
      icon: project.icon,
      description: project.description,
      status: project.status,
      createdAt: project.createdAt.toISOString(),
      members: project.members.map(m => ({ userId: m.userId, role: m.role }))
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// PUT update project
router.put('/:id', async (req, res) => {
  try {
    const ctx = authContext.getStore();
    const member = await prisma.arcanaProjectMember.findFirst({ where: { projectId: req.params.id, userId: ctx?.userId } });
    if (!member || (member.role !== 'admin' && ctx?.role !== 'admin' && ctx?.role !== 'owner')) {
      return res.status(403).json({ error: 'Only project admins can update this project' });
    }
    const { name, color, icon, description, status } = req.body;
    const project = await prisma.arcanaProject.update({
      where: { id: req.params.id },
      data: { name, color, icon, description, status },
      include: { members: true }
    });

    // M2: Auto-sync to Finance Project
    if (name !== undefined || status !== undefined || description !== undefined) {
      try {
        await prisma.project.update({
          where: { id: req.params.id },
          data: {
            ...(name !== undefined && { name }),
            ...(status !== undefined && { status: status === 'active' ? 'В работе' : 'Завершен' }),
            ...(description !== undefined && { description })
          }
        });
      } catch (e) {
        // If the finance project doesn't exist, we ignore the error
      }
    }

    res.json({
      id: project.id,
      name: project.name,
      color: project.color,
      icon: project.icon,
      description: project.description,
      status: project.status,
      createdAt: project.createdAt.toISOString(),
      members: project.members.map(m => ({ userId: m.userId, role: m.role }))
    });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// POST add member
router.post('/:id/members', async (req, res) => {
  try {
    const ctx = authContext.getStore();
    const member = await prisma.arcanaProjectMember.findFirst({ where: { projectId: req.params.id, userId: ctx?.userId } });
    if (!member || (member.role !== 'admin' && ctx?.role !== 'admin' && ctx?.role !== 'owner')) {
      return res.status(403).json({ error: 'Only project admins can manage members' });
    }
    const { userId, role } = req.body;
    await prisma.arcanaProjectMember.create({
      data: { projectId: req.params.id, userId, role: role || 'member' }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add member' });
  }
});

// DELETE remove member
router.delete('/:id/members/:userId', async (req, res) => {
  try {
    const ctx = authContext.getStore();
    const member = await prisma.arcanaProjectMember.findFirst({ where: { projectId: req.params.id, userId: ctx?.userId } });
    if (!member || (member.role !== 'admin' && ctx?.role !== 'admin' && ctx?.role !== 'owner')) {
      return res.status(403).json({ error: 'Only project admins can manage members' });
    }
    await prisma.arcanaProjectMember.deleteMany({
      where: { projectId: req.params.id, userId: req.params.userId }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

// PUT update member role
router.put('/:id/members/:userId', async (req, res) => {
  try {
    const ctx = authContext.getStore();
    const member = await prisma.arcanaProjectMember.findFirst({ where: { projectId: req.params.id, userId: ctx?.userId } });
    if (!member || (member.role !== 'admin' && ctx?.role !== 'admin' && ctx?.role !== 'owner')) {
      return res.status(403).json({ error: 'Only project admins can manage members' });
    }
    const { role } = req.body;
    await prisma.arcanaProjectMember.updateMany({
      where: { projectId: req.params.id, userId: req.params.userId },
      data: { role }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update member role' });
  }
});

export default router;
