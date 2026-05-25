import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../db';

import { JWT_SECRET } from '../config';

const router = Router();
const JWT_EXPIRES = '8h';

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    let { email, password } = req.body;
    
    if (email) {
      email = email.toLowerCase().trim();
    }

    if (!email || !password) {
      return res.status(400).json({ error: 'Email и пароль обязательны' });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      console.log(`[AUTH/LOGIN] Failed: User not found for email: '${email}'`);
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    if (user.status !== 'active') {
      console.log(`[AUTH/LOGIN] Failed: User inactive for email: '${email}'`);
      return res.status(403).json({ error: 'Аккаунт заблокирован. Обратитесь в ИТ-отдел.' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      console.log(`[AUTH/LOGIN] Failed: Invalid password for email: '${email}'`);
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    console.log(`[AUTH/LOGIN] Success: User logged in: '${email}'`);

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    // Set HTTP-Only Cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: false, // Ensure this works over HTTP
      sameSite: 'strict',
      path: '/',
      maxAge: 8 * 60 * 60 * 1000 // 8 hours
    });

    // Return user info
    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        permissions: JSON.parse(user.permissions),
        avatar: user.avatar,
        allowedApps: user.allowedApps ? JSON.parse(user.allowedApps) : null,
      }
    });
  } catch (e) {
    return console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/auth/me  — validate token and return current user
router.get('/me', async (req: Request, res: Response) => {
  try {
    let token = req.cookies?.token;
    console.log('[AUTH/ME] Cookie token:', !!token);

    // Fallback to Authorization header
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.slice(7);
      console.log('[AUTH/ME] Fallback to Auth header:', !!token);
    }

    if (!token) {
      console.error('[AUTH/ME] Token missing entirely');
      return res.status(401).json({ error: 'Токен отсутствует' });
    }

    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    console.log('[AUTH/ME] Token verified for userId:', payload.userId);

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      console.error('[AUTH/ME] User not found');
      return res.status(401).json({ error: 'Пользователь не найден' });
    }
    if (user.status !== 'active') {
      console.error('[AUTH/ME] User inactive');
      return res.status(401).json({ error: 'Пользователь заблокирован' });
    }

    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      permissions: JSON.parse(user.permissions),
      avatar: user.avatar,
      allowedApps: user.allowedApps ? JSON.parse(user.allowedApps) : null,
    });
  } catch (e) {
    console.error('[AUTH/ME] Catch error:', e);
    return res.status(401).json({ error: 'Недействительный токен' });
  }
});

// POST /api/auth/logout
router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('token', { path: '/' });
  return res.json({ message: 'Выход выполнен' });
});

export default router;
