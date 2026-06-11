import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.account.createMany({
    data: [
      {
        name: 'Взаиморасчеты — ООО Анис',
        balance: 0,
        currency: 'UZS',
        type: 'Взаиморасчеты'
      },
      {
        name: 'Взаиморасчеты — ООО Ангреен',
        balance: 0,
        currency: 'UZS',
        type: 'Взаиморасчеты'
      }
    ]
  });
  console.log("Accounts created successfully.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
