import { Router } from 'express';
import db from '../db';
import { notifyUser } from '../services/telegramBot';
import { t } from '../services/botLocales';

const router = Router();

// GET all active tickets
router.get('/', async (req, res) => {
  try {
    const tickets = await db.serviceTicket.findMany({
      where: { status: { not: 'closed' } },
      orderBy: { createdAt: 'desc' },
      include: { comments: true }
    });
    res.json(tickets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// GET archived tickets with pagination
router.get('/archive', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [tickets, total] = await Promise.all([
      db.serviceTicket.findMany({
        where: { status: 'closed' },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.serviceTicket.count({ where: { status: 'closed' } })
    ]);

    res.json({ tickets, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch archived tickets' });
  }
});

// POST new ticket
router.post('/', async (req, res) => {
  try {
    const ticket = await db.serviceTicket.create({
      data: req.body
    });
    res.json(ticket);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

// PUT update ticket status
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, category, assigneeId } = req.body;
    
    const existingTicket = await db.serviceTicket.findUnique({ where: { id } });
    if (!existingTicket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const updated = await db.serviceTicket.update({
      where: { id },
      data: { status, priority, category, assigneeId }
    });

    // Notify user via Telegram if status changed and user has chat ID
    if (existingTicket.telegramChatId && existingTicket.status !== status && status) {
      const reporterProfile = await db.telegramProfile.findUnique({ where: { chatId: existingTicket.telegramChatId } });
      const lang = reporterProfile?.language || 'ru';
      const statusKey = `status_${status}`;
      const statusText = t(lang, statusKey);
      
      const text = t(lang, 'statusChanged', { number: updated.number, title: updated.title, status: statusText });
      await notifyUser(existingTicket.telegramChatId, text);
    }

    // Notify assignee if newly assigned
    if (assigneeId && existingTicket.assigneeId !== assigneeId) {
      const workerProfile = await db.telegramProfile.findFirst({ where: { userId: assigneeId } });
      if (workerProfile) {
        const lang = workerProfile.language || 'ru';
        const text = t(lang, 'workerAssigned', { number: updated.number, title: updated.title });
        await notifyUser(workerProfile.chatId, text);
      }
    }

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});

// POST new comment
router.post('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const authorId = req.cookies?.token ? (require('jsonwebtoken').decode(req.cookies.token) as any)?.userId : null;
    
    const ticket = await db.serviceTicket.findUnique({ where: { id } });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    const comment = await db.serviceTicketComment.create({
      data: {
        ticketId: id,
        text,
        authorId,
        isSystem: false,
      }
    });

    // Notify reporter in Telegram if it's an employee commenting
    if (ticket.telegramChatId) {
      const reporterProfile = await db.telegramProfile.findUnique({ where: { chatId: ticket.telegramChatId } });
      const lang = reporterProfile?.language || 'ru';
      const notificationText = `💬 ${t(lang, 'newComment', { number: ticket.number })}\n\n${text}`;
      await notifyUser(ticket.telegramChatId, notificationText);
    }

    res.json(comment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

export default router;
