import prisma from './server/db';
import bcrypt from 'bcryptjs';

async function createUser() {
  const passwordHash = await bcrypt.hash('password123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'ahmad@workspace.com' },
    update: {},
    create: {
      name: 'Ahmad',
      email: 'ahmad@workspace.com',
      passwordHash: passwordHash,
      role: 'member',
      status: 'active',
      permissions: JSON.stringify(['all']),
      jobTitle: 'Developer'
    }
  });
  console.log('User created:', user);
}
createUser().catch(console.error).finally(() => prisma.$disconnect());
