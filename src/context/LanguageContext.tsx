import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { en, Translations } from '../i18n/en';
import { th } from '../i18n/th';
import { zhCN } from '../i18n/zh-CN';
import { zhTW } from '../i18n/zh-TW';

export type Language = 'en' | 'th' | 'zh-CN' | 'zh-TW';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof Translations) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const savedLang = localStorage.getItem('app_language') as Language;
    if (savedLang && (savedLang === 'en' || savedLang === 'th' || savedLang === 'zh-CN' || savedLang === 'zh-TW')) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
  };

  const t = (key: keyof Translations): string => {
    const translations: any = language === 'en' ? en : language === 'th' ? th : language === 'zh-CN' ? zhCN : zhTW;
    return translations[key] || en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
