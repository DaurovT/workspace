import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all notes
router.get('/', async (req: Request, res: Response) => {
  try {
    const notes = await prisma.knowledgeNote.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(notes);
  } catch (error) {
    console.error('Error fetching knowledge notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// Create note or folder
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, content, parentId, authorId } = req.body;
    const note = await prisma.knowledgeNote.create({
      data: {
        title: title || 'New Note',
        content: content || '',
        parentId: parentId || null,
        authorId: authorId || null,
      },
    });
    res.json(note);
  } catch (error) {
    console.error('Error creating knowledge note:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// Update note
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { title, content, parentId } = req.body;
    
    const note = await prisma.knowledgeNote.update({
      where: { id },
      data: {
        title,
        content,
        parentId,
      },
    });
    res.json(note);
  } catch (error) {
    console.error('Error updating knowledge note:', error);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// Delete note
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.knowledgeNote.delete({
      where: { id },
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting knowledge note:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

export default router;
