import { apiFetch } from './api';

// One-off RU->UZ translation for reference names. Result is cached server-side
// (TranslationCache), so repeated translations are free and stored in nameUz.
export async function translateToUz(text: string): Promise<string> {
  const t = text.trim();
  if (!t) return '';
  try {
    const res = await apiFetch('/api/translate', {
      method: 'POST',
      body: JSON.stringify({ text: t, sourceLang: 'ru', targetLang: 'uz' }),
    });
    if (!res.ok) return '';
    const data = await res.json();
    return (data && data.translatedText) || '';
  } catch {
    return '';
  }
}
