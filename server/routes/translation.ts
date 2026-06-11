import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { translateText } from '../services/aiService';

const router = Router();
const prisma = new PrismaClient();

router.post('/', async (req, res) => {
  try {
    const { text, sourceLang, targetLang } = req.body;
    
    if (!text || !sourceLang || !targetLang) {
      return res.status(400).json({ error: 'Missing required parameters: text, sourceLang, targetLang' });
    }

    if (sourceLang === targetLang) {
      return res.json({ translatedText: text });
    }

    // Check cache first
    const cached = await prisma.translationCache.findUnique({
      where: {
        sourceLang_targetLang_sourceText: {
          sourceLang,
          targetLang,
          sourceText: text
        }
      }
    });

    if (cached) {
      return res.json({ translatedText: cached.translated });
    }

    // Translate using AI
    const translatedText = await translateText(text, sourceLang, targetLang);

    // Save to cache (use upsert to avoid UniqueConstraintViolation on concurrent requests)
    await prisma.translationCache.upsert({
      where: {
        sourceLang_targetLang_sourceText: {
          sourceLang,
          targetLang,
          sourceText: text
        }
      },
      update: {
        translated: translatedText
      },
      create: {
        sourceLang,
        targetLang,
        sourceText: text,
        translated: translatedText
      }
    });

    res.json({ translatedText });
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ error: 'Failed to translate text' });
  }
});

export default router;
