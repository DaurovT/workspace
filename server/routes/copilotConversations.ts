import { Router, type Request, type Response } from 'express';
import prisma from '../db';

const router = Router();

// GET /api/copilot-conversations
router.get('/', async (req: Request, res: Response) => {
  try {
    const convos = await prisma.copilotConversation.findMany({
      orderBy: { updatedAt: 'desc' }
    });
    // Parse the messages field back to JSON
    const parsed = convos.map(c => ({
      ...c,
      messages: c.messages ? JSON.parse(c.messages) : []
    }));
    res.json(parsed);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /api/copilot-conversations
router.post('/', async (req: Request, res: Response) => {
  try {
    const { messages, ...data } = req.body;
    const convo = await prisma.copilotConversation.create({
      data: {
        ...data,
        messages: JSON.stringify(messages || [])
      }
    });
    res.status(201).json({
      ...convo,
      messages: convo.messages ? JSON.parse(convo.messages) : []
    });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// PUT /api/copilot-conversations/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { messages, ...data } = req.body;
    const updateData: any = { ...data };
    if (messages) {
      updateData.messages = JSON.stringify(messages);
    }
    
    const convo = await prisma.copilotConversation.update({
      where: { id: req.params.id as string },
      data: updateData
    });
    res.json({
      ...convo,
      messages: convo.messages ? JSON.parse(convo.messages) : []
    });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// DELETE /api/copilot-conversations/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.copilotConversation.delete({
      where: { id: req.params.id as string }
    });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
