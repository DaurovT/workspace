
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function test() {
  await prisma.payrollRun.deleteMany(); // clean up old seeds
  console.log('Deleted old runs');
  const res = await fetch('http://localhost/api/payroll', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ month: 5, year: 2026, createdBy: 'system' })
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
test().catch(console.error).finally(() => prisma.$disconnect());

