import { Router } from 'express';
import prisma from '../db';

const router = Router();

// GET comments
router.get('/', async (req, res) => {
  try {
    const where: any = {};
    if (req.query.taskId) {
      where.taskId = req.query.taskId as string;
    } else if (req.query.projectId) {
      where.task = { projectId: req.query.projectId as string };
    } else {
      return res.status(400).json({ error: 'taskId or projectId is required' });
    }

    const comments = await prisma.arcanaComment.findMany({
      where,
      orderBy: { createdAt: 'asc' }
    });
    const mapped = comments.map(c => ({
      id: c.id,
      taskId: c.taskId,
      authorId: c.authorId,
      text: c.text,
      isSystem: c.isSystem,
      createdAt: c.createdAt.toISOString(),
    }));
    res.json(mapped);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// POST create comment
router.post('/', async (req, res) => {
  try {
    const { id, taskId, authorId, text, isSystem } = req.body;
    const comment = await prisma.arcanaComment.create({
      data: {
        id: id || undefined,
        taskId,
        authorId: authorId || 'unknown',
        text,
        isSystem: isSystem || false,
      }
    });
    res.status(201).json({
      id: comment.id,
      taskId: comment.taskId,
      authorId: comment.authorId,
      text: comment.text,
      isSystem: comment.isSystem,
      createdAt: comment.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

// DELETE comment
router.delete('/:id', async (req, res) => {
  try {
    await prisma.arcanaComment.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

export default router;
