import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { DomTranslator } from './domTranslator';

export type Language = 'fr' | 'en';

const STORAGE_KEY = 'mirador-language';

const readLanguage = (): Language => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'fr';
  } catch {
    return 'fr';
  }
};

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
}

const LanguageContext = createContext<LanguageContextValue>({ language: 'fr', setLanguage: () => {} });

/**
 * The screens are written in French. In English, the DomTranslator rewrites what they display; the dictionary
 * is only downloaded then. Going back to French reloads the page, which redraws every text in its original form.
 */
export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(readLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
    if (language !== 'en') return;
    let translator: DomTranslator | null = null;
    let cancelled = false;
    void import('./en.json').then(module => {
      if (cancelled) return;
      translator = new DomTranslator(module.default);
      translator.start();
    });
    return () => {
      cancelled = true;
      translator?.stop();
    };
  }, [language]);

  const setLanguage = (next: Language) => {
    if (next === language) return;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // the choice then lasts until the page is reloaded
    }
    if (next === 'fr') {
      window.location.reload();
      return;
    }
    setLanguageState(next);
  };

  return <LanguageContext.Provider value={{ language, setLanguage }}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);

/**
 * FR | EN switch shown in the header and on the sign-in page. Radio inputs rather than buttons: the app restyles
 * every <button> (automatic icons, background overrides in index.css).
 */
export const LanguageSwitcher: React.FC<{ dark?: boolean }> = ({ dark = true }) => {
  const { language, setLanguage } = useLanguage();
  const option = (value: Language, label: string, name: string) => (
    <label
      title={name}
      className={`cursor-pointer select-none px-2.5 py-1 text-xs font-bold rounded-md transition-colors ${
        language === value ? 'text-white' : (dark ? 'text-white/70 hover:text-white' : 'text-gray-600 hover:text-gray-900')
      }`}
      style={{ backgroundColor: language === value ? (dark ? '#2563eb' : '#154a63') : 'transparent' }}
    >
      <input
        type="radio"
        name="mirador-language"
        value={value}
        checked={language === value}
        onChange={() => setLanguage(value)}
        className="sr-only"
        aria-label={name}
      />
      {label}
    </label>
  );
  return (
    <div
      role="radiogroup"
      aria-label="Langue / Language"
      data-no-translate
      className={`inline-flex items-center gap-0.5 rounded-lg border p-0.5 ${dark ? 'border-white/15' : 'border-gray-300'}`}
    >
      {option('fr', 'FR', 'Français')}
      {option('en', 'EN', 'English')}
    </div>
  );
};
