import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const contractors = [
    {
      name: 'ООО "Агро-Мясной Двор"',
      shortName: 'Агро-Мясо',
      legalForm: 'МЧЖ',
      group: 'Поставщики',
      inn: '302111222',
      nds: true,
    },
    {
      name: 'АО "Узметкомбинат"',
      shortName: 'Узметкомбинат',
      legalForm: 'АЖ',
      group: 'Клиенты',
      inn: '201333444',
      nds: true,
    },
    {
      name: 'ЧП "Свежие Овощи"',
      shortName: 'Свежие Овощи',
      legalForm: 'ЯТТ',
      group: 'Поставщики',
      inn: '405555666',
      nds: false,
    },
    {
      name: 'ООО "УзАвтоТранс"',
      shortName: 'УзАвтоТранс',
      legalForm: 'МЧЖ',
      group: 'Поставщики',
      inn: '307888999',
      nds: true,
    }
  ];

  for (const c of contractors) {
    const exists = await prisma.contractor.findFirst({ where: { name: c.name } });
    if (!exists) {
      await prisma.contractor.create({ data: c });
    }
  }
  console.log('Demo contractors seeded!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
