import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function run() {
  const translations = await prisma.translationCache.findMany({
    where: { targetLang: 'uz' }
  });

  const dict: Record<string, string> = {};
  for (const t of translations) {
    dict[t.sourceText] = t.translated;
  }

  const dir = path.join(process.cwd(), 'public', 'locales', 'uz');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(path.join(dir, 'translation.json'), JSON.stringify(dict, null, 2));
  console.log(`Dumped ${translations.length} translations to public/locales/uz/translation.json`);
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
