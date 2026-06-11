import React from 'react';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

export const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const nextLang = i18n.language.startsWith('ru') ? 'uz' : 'ru';
    i18n.changeLanguage(nextLang);
  };

  return (
    <button 
      className="theme-toggle" 
      onClick={toggleLanguage} 
      data-tooltip-bottom={i18n.language.startsWith('ru') ? "O'zbek tili" : "Русский язык"}
      style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0 8px', fontSize: '12px', fontWeight: 600 }}
    >
      <Languages size={14} />
      <span>{i18n.language.startsWith('ru') ? 'RU' : 'UZ'}</span>
    </button>
  );
};
