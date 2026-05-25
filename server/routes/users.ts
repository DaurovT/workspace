import { Router, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../db";
import { authContext } from "../context";

const router = Router();

const mapUser = (u: any) => ({
  ...u,
  permissions: JSON.parse(u.permissions),
  allowedApps: u.allowedApps ? JSON.parse(u.allowedApps) : null,
  passwordHash: undefined,
  color: u.color || "#6366f1",
  isActive: u.isActive !== false,
  jobTitle: u.jobTitle || "",
});

const isAdminOrOwner = (role?: string) => role === "admin" || role === "owner";

// GET /api/users
router.get("/", async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users.map(mapUser));
  } catch (e) {
    console.error("[USERS] GET /", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/users
router.post("/", async (req: Request, res: Response) => {
  try {
    const ctx = authContext.getStore();
    if (!isAdminOrOwner(ctx?.role)) {
      return res.status(403).json({ error: "Only admins can create users" });
    }

    const { permissions, allowedApps, password, ...rest } = req.body;
    const defaultPassword = password || Math.random().toString(36).slice(-10) + "A1!";
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
    res.status(201).json({ ...mapUser(user), generatedPassword: !password ? defaultPassword : undefined });
  } catch (e) {
    console.error("[USERS] POST /", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/users/:id
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const ctx = authContext.getStore();
    const targetId = req.params.id as string;

    if (!isAdminOrOwner(ctx?.role) && ctx?.userId !== targetId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { permissions, allowedApps, passwordHash, password, role, ...rest } = req.body;
    const data: any = { ...rest };

    if (isAdminOrOwner(ctx?.role)) {
      if (permissions !== undefined) data.permissions = JSON.stringify(permissions);
      if (allowedApps !== undefined) data.allowedApps = allowedApps === null ? null : JSON.stringify(allowedApps);
      if (role !== undefined) data.role = role;
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      data.passwordHash = await bcrypt.hash(password, salt);
    }

    const user = await prisma.user.update({ where: { id: targetId }, data });
    res.json(mapUser(user));
  } catch (e) {
    console.error("[USERS] PUT /:id", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/users/:id
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const ctx = authContext.getStore();
    if (!isAdminOrOwner(ctx?.role)) {
      return res.status(403).json({ error: "Only admins can delete users" });
    }
    const userId = req.params.id as string;
    if (ctx?.userId === userId) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }
    await prisma.arcanaProjectMember.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    res.json({ success: true });
  } catch (e) {
    console.error("[USERS] DELETE /:id", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/users/:id/bind-code
router.post("/:id/bind-code", async (req: Request, res: Response) => {
  try {
    const ctx = authContext.getStore();
    const targetId = req.params.id as string;
    if (!isAdminOrOwner(ctx?.role) && ctx?.userId !== targetId) {
      return res.status(403).json({ error: "Access denied" });
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await prisma.user.update({ where: { id: targetId }, data: { telegramBindCode: code } });
    res.json({ code });
  } catch (e) {
    console.error("[USERS] POST /:id/bind-code", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
