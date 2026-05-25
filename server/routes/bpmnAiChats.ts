import { Router } from 'express';
import prisma from '../db';
import { authContext } from '../context';

const router = Router();

// GET all chats
router.get('/', async (req, res) => {
  try {
    const chats = await prisma.bpmnAiChat.findMany({
      orderBy: { updatedAt: 'desc' }
    });
    // Parse messages
    const mapped = chats.map(c => ({
      ...c,
      messages: JSON.parse(c.messages)
    }));
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch AI chats' });
  }
});

// GET single chat
router.get('/:id', async (req, res) => {
  try {
    const chat = await prisma.bpmnAiChat.findUnique({
      where: { id: req.params.id }
    });
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    res.json({
      ...chat,
      messages: JSON.parse(chat.messages)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch AI chat' });
  }
});

// POST create or PUT update chat
router.post('/', async (req, res) => {
  try {
    const { id, title, messages } = req.body;
    const messagesStr = JSON.stringify(messages || []);
    
    let chat;
    if (id) {
      // Check if exists for update
      const existing = await prisma.bpmnAiChat.findUnique({ where: { id } });
      if (existing) {
        chat = await prisma.bpmnAiChat.update({
          where: { id },
          data: { title, messages: messagesStr }
        });
      } else {
        chat = await prisma.bpmnAiChat.create({
          data: { id, title, messages: messagesStr }
        });
      }
    } else {
      // Create new (auto-generate id)
      chat = await prisma.bpmnAiChat.create({
        data: { title, messages: messagesStr }
      });
    }
    res.status(200).json({
      ...chat,
      messages: JSON.parse(chat.messages)
    });
  } catch (error) {
    console.error('Error saving AI chat:', error);
    res.status(500).json({ error: 'Failed to save AI chat' });
  }
});

// DELETE chat
router.delete('/:id', async (req, res) => {
  try {
    await prisma.bpmnAiChat.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete AI chat' });
  }
});

export default router;
