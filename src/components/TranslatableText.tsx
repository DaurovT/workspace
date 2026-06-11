import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Languages, Loader2 } from 'lucide-react';

interface TranslatableTextProps {
  text: string;
  sourceLang?: string; // e.g. 'ru'
  className?: string;
  style?: React.CSSProperties;
}

export const TranslatableText: React.FC<TranslatableTextProps> = ({ 
  text, 
  sourceLang = 'ru',
  className,
  style 
}) => {
  const { i18n, t } = useTranslation();
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showOriginal, setShowOriginal] = useState(true);

  // Determine current language from i18n
  const currentLang = i18n.language.split('-')[0]; // e.g. 'ru' or 'uz'

  const needsTranslation = currentLang !== sourceLang && text && text.trim().length > 0;

  const handleTranslate = React.useCallback(async (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
      
      if (translatedText) {
        setShowOriginal(!showOriginal);
        return;
      }
    }

    setIsTranslating(true);
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'include',
        body: JSON.stringify({
          text,
          sourceLang,
          targetLang: currentLang
        })
      });
      const data = await res.json();
      if (data.translatedText) {
        setTranslatedText(data.translatedText);
        setShowOriginal(false);
      }
    } catch (err) {
      console.error('Translation failed', err);
    } finally {
      setIsTranslating(false);
    }
  }, [text, sourceLang, currentLang, translatedText, showOriginal]);

  useEffect(() => {
    // Reset when text changes
    setTranslatedText(null);
    setShowOriginal(true);
    
    if (needsTranslation && text) {
      handleTranslate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, currentLang, needsTranslation]);

  return (
    <span className={className} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', ...style }}>
      <span>{showOriginal ? text : translatedText}</span>
      {needsTranslation && (
        <span
          title={t('common.translate')}
          style={{ 
            color: 'var(--text-muted)', 
            display: 'flex', 
            alignItems: 'center', 
            opacity: 0.6,
            marginLeft: '4px'
          }}
        >
          {isTranslating ? <Loader2 size={12} className="spinner" /> : <Languages size={10} style={{ opacity: 0.5 }} />}
        </span>
      )}
    </span>
  );
};
