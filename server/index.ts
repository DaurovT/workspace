import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRouter from './routes/auth';
import { createServer } from 'http';
import { Server } from 'socket.io';
import Redis from 'ioredis';
import { createAdapter } from '@socket.io/redis-adapter';
import jwt from 'jsonwebtoken';
import { authContext } from './context';
import { setSocketServer } from './socket';
import categoriesRouter from './routes/categories';
import accountsRouter from './routes/accounts';
import contractorsRouter from './routes/contractors';
import projectsRouter from './routes/projects';
import transactionsRouter from './routes/transactions';
import usersRouter from './routes/users';
import auditLogsRouter from './routes/auditLogs';
import notificationsRouter from './routes/notifications';
import invoicesRouter from './routes/invoices';
import purchasesRouter from './routes/purchases';
import financeDocumentsRouter from './routes/financeDocuments';
import settingsRouter from './routes/settings';
import copilotConversationsRouter from './routes/copilotConversations';
import paymentRequestsRouter from './routes/paymentRequests';
import fundsRouter from './routes/funds';
import plannedOperationsRouter from './routes/plannedOperations';
import importRulesRouter from './routes/importRules';
import budgetScenariosRouter from './routes/budgetScenarios';
import bdrBudgetsRouter from './routes/bdrBudgets';
import bddsBudgetsRouter from './routes/bddsBudgets';
import budgetLinesRouter from './routes/budgetLines';
import exchangeRatesRouter from './routes/exchangeRates';
import legalEntitiesRouter from './routes/legalEntities';
import productsRouter from './routes/products';
import loansRouter from './routes/loans';
import assetsRouter from './routes/assets';
import uploadsRouter from './routes/uploads';
import dealsRouter from './routes/deals';
import bpmnDiagramsRouter from './routes/bpmnDiagrams';
import bpmnAiChatsRouter from './routes/bpmnAiChats';
import employeesRouter from './routes/employees';
import absencesRouter from './routes/absences';
import payrollRouter from './routes/payroll';
import procurementRouter from './routes/procurement';
import serviceTicketsRouter from './routes/serviceTickets';
import shiftSchedulesRouter from './routes/shiftSchedules';
import orgPositionsRouter from './routes/orgPositions';
import workCalendarRouter from './routes/workCalendar';
import ledgerRouter from './routes/ledger';
import path from 'path';
import { requireWriteAccess } from './middleware/rbac';
import { requireProjectMember } from './middleware/arcanaAuth';
import arcanaProjectsRouter from './routes/arcanaProjects';
import arcanaTasksRouter from './routes/arcanaTasks';
import arcanaCommentsRouter from './routes/arcanaComments';
import translationRouter from './routes/translation';

import { initTelegramBot } from './services/telegramBot';
import { JWT_SECRET } from './config';

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
// Anti-CSRF Middleware
app.use((req, res, next) => {
  if (req.path.startsWith('/api/') && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    const isMobile = req.headers.authorization?.startsWith('Bearer ');
    const hasCsrfHeader = req.headers['x-requested-with'] === 'XMLHttpRequest';
    if (!isMobile && !hasCsrfHeader) {
      return res.status(403).json({ error: 'CSRF token missing or invalid' });
    }
  }
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());



// Global auth middleware to populate AsyncLocalStorage and enforce auth
app.use((req, res, next) => {
  // Allow public access to auth routes
  if (req.path.startsWith('/api/auth') || req.path.startsWith('/api/health') || req.path.startsWith('/uploads')) {
    return next();
  }

  // Exempt BPMN websocket or specific paths if necessary, but for API, require token
  if (req.path.startsWith('/api/')) {
    let token = req.cookies?.token;

    // Fallback to Authorization header for clients not using cookies (e.g. mobile apps)
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.slice(7);
    }

    if (!token) {
      console.error('[GLOBAL AUTH] Token missing for path:', req.path, 'Cookies:', req.cookies);
      return res.status(401).json({ error: 'Необходима авторизация' });
    }

    try {
      const payload = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role?: string };
      return authContext.run({ userId: payload.userId, userName: payload.email, role: payload.role || 'member' }, next);
    } catch (e) {
      console.error('[GLOBAL AUTH] Invalid token for path:', req.path, e);
      return res.status(401).json({ error: 'Недействительный токен' });
    }
  }

  // For non-API routes (if any), just continue
  next();
});

// ── Finance REST API ─────────────────────────────
app.use('/api/auth', authRouter);


// Global RBAC Middleware: Protect all subsequent routes from write operations based on specific roles
app.use((req, res, next) => {
  // Methods that modify data
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    // Exclude auth routes, upload, and arcana (which has its own project-based RBAC)
    if (
      !req.path.startsWith('/api/auth') &&
      !req.path.startsWith('/api/arcana') &&
      !req.path.startsWith('/api/bpmn') &&
      !req.path.startsWith('/api/upload')
    ) {
      return requireWriteAccess(req, res, next);
    }
  }
  next();
});

// ── BPMN REST API (no auth required for MVP) ────────
app.use('/api/bpmn/diagrams', bpmnDiagramsRouter);
app.use('/api/bpmn/chats', bpmnAiChatsRouter);

// ── Arcana REST API (no auth required for MVP) ──────

app.use('/api/arcana/projects', requireProjectMember, arcanaProjectsRouter);
app.use('/api/arcana/tasks', requireProjectMember, arcanaTasksRouter);
app.use('/api/arcana/comments', requireProjectMember, arcanaCommentsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/accounts', accountsRouter);
app.use('/api/contractors', contractorsRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/users', usersRouter);
app.use('/api/audit-logs', auditLogsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/invoices', invoicesRouter);
app.use('/api/purchases', purchasesRouter);
app.use('/api/finance-documents', financeDocumentsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/copilot-conversations', copilotConversationsRouter);
app.use('/api/payment-requests', paymentRequestsRouter);
app.use('/api/funds', fundsRouter);
app.use('/api/planned-operations', plannedOperationsRouter);
app.use('/api/import-rules', importRulesRouter);
app.use('/api/budget-scenarios', budgetScenariosRouter);
app.use('/api/bdr-budgets', bdrBudgetsRouter);
app.use('/api/bdds-budgets', bddsBudgetsRouter);
app.use('/api/budget-lines', budgetLinesRouter);
app.use('/api/exchange-rates', exchangeRatesRouter);
app.use('/api/legal-entities', legalEntitiesRouter);
app.use('/api/deals', dealsRouter);
app.use('/api/products', productsRouter);
app.use('/api/loans', loansRouter);
app.use('/api/assets', assetsRouter);
app.use('/api/upload', uploadsRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/absences', absencesRouter);
app.use('/api/payroll', payrollRouter);
app.use('/api/procurement', procurementRouter);
app.use('/api/service-tickets', serviceTicketsRouter);
app.use('/api/shift-schedules', shiftSchedulesRouter);
app.use('/api/org-positions', orgPositionsRouter);
app.use('/api/work-calendar', workCalendarRouter);
app.use('/api/ledger', ledgerRouter);
app.use('/api/translate', translationRouter);
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use(express.static(path.join(process.cwd(), 'dist')));
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
// ── Fallback for React SPA (serves index.html for non-API routes) ──
app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return next();
  }
  res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
});

// ── BPMN WebSocket (existing) ────────────────────
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.CORS_ORIGIN || '*', methods: ['GET', 'POST'] },
});
setSocketServer(io);

let redisClient: any = null;
if (process.env.REDIS_URL) {
  redisClient = new Redis(process.env.REDIS_URL);
  const subClient = redisClient.duplicate();
  io.adapter(createAdapter(redisClient, subClient));
  console.log('✅ Redis Adapter enabled');
}

const roomUsers = new Map<string, Map<string, { id: string; name: string; color: string; x: number; y: number }>>();

const getRoomUsers = async (roomId: string) => {
  if (redisClient) {
    const data = await redisClient.hgetall(`room:${roomId}`);
    const parsed: Record<string, any> = {};
    for (const [key, val] of Object.entries(data)) {
      parsed[key] = JSON.parse(val as string);
    }
    return parsed;
  }
  return Object.fromEntries(roomUsers.get(roomId) || []);
};

const addRoomUser = async (roomId: string, socketId: string, user: any) => {
  if (redisClient) {
    await redisClient.hset(`room:${roomId}`, socketId, JSON.stringify(user));
    await redisClient.expire(`room:${roomId}`, 86400); // 1 day expire
  } else {
    if (!roomUsers.has(roomId)) roomUsers.set(roomId, new Map());
    roomUsers.get(roomId)!.set(socketId, user);
  }
};

const removeRoomUser = async (roomId: string, socketId: string) => {
  if (redisClient) {
    await redisClient.hdel(`room:${roomId}`, socketId);
  } else {
    roomUsers.get(roomId)?.delete(socketId);
  }
};

const updateRoomUserCursor = async (roomId: string, socketId: string, x: number, y: number) => {
  if (redisClient) {
    const userStr = await redisClient.hget(`room:${roomId}`, socketId);
    if (userStr) {
      const user = JSON.parse(userStr);
      user.x = x;
      user.y = y;
      // We don't necessarily await this to save time
      redisClient.hset(`room:${roomId}`, socketId, JSON.stringify(user)).catch(() => { });
    }
  } else {
    const user = roomUsers.get(roomId)?.get(socketId);
    if (user) {
      user.x = x;
      user.y = y;
    }
  }
};

const getRandomColor = () => {
  const h = Math.floor(Math.random() * 360);
  return `hsl(${h}, 70%, 45%)`;
};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  let currentRoom: string | null = null;

  socket.on('join-diagram', async ({ roomId, userName }: { roomId: string; userName: string }) => {
    if (currentRoom) {
      socket.leave(currentRoom);
      await removeRoomUser(currentRoom, socket.id);
      const users = await getRoomUsers(currentRoom);
      io.to(currentRoom).emit('users-update', users);
    }
    currentRoom = roomId;
    socket.join(roomId);

    const userData = {
      id: socket.id,
      name: userName || `Аноним ${Math.floor(Math.random() * 1000)}`,
      color: getRandomColor(),
      x: -100,
      y: -100,
    };

    await addRoomUser(roomId, socket.id, userData);
    const users = await getRoomUsers(roomId);
    io.to(roomId).emit('users-update', users);
  });

  socket.on('cursor-move', ({ x, y }: { x: number; y: number }) => {
    if (!currentRoom) return;
    updateRoomUserCursor(currentRoom, socket.id, x, y);
    socket.to(currentRoom).emit('cursor-moved', { id: socket.id, x, y });
  });

  socket.on('diagram-update', ({ xml }: { xml: string }) => {
    if (!currentRoom) return;
    socket.to(currentRoom).emit('diagram-updated', { xml, senderId: socket.id });
  });

  socket.on('disconnect', async () => {
    if (currentRoom) {
      await removeRoomUser(currentRoom, socket.id);
      const users = await getRoomUsers(currentRoom);
      io.to(currentRoom).emit('users-update', users);
    }
  });
});

const PORT = parseInt(process.env.PORT as string, 10) || 3000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`✅  Finance API + BPMN WS Server running on http://localhost:${PORT}`);
  console.log(`   REST API: http://localhost:${PORT}/api/health`);
  initTelegramBot();
});
