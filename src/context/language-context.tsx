import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { en, si, ta, type Strings } from '@/i18n/strings';
import { setApiLanguage } from '@/lib/api';
import { languageStorage } from '@/lib/storage';

export type Language = 'en' | 'si' | 'ta';

export const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'si', label: 'සිංහල' },
  { code: 'ta', label: 'தமிழ்' },
];

const DICTIONARIES: Record<Language, Strings> = { en, si, ta };

/** Locale tags for dates, so a timestamp reads naturally in each language. */
const DATE_LOCALES: Record<Language, string> = { en: 'en-LK', si: 'si-LK', ta: 'ta-LK' };

type Params = Record<string, string | number>;

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  /** Looks up a dotted key such as "home.title" and fills {placeholders}. */
  t: (key: string, params?: Params) => string;
  strings: Strings;
  dateLocale: string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function lookup(dictionary: Strings, key: string): string | undefined {
  const value = key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], dictionary);
  return typeof value === 'string' ? value : undefined;
}

function isLanguage(value: string | null): value is Language {
  return value === 'en' || value === 'si' || value === 'ta';
}

const languageListeners = new Set<(language: Language) => void>();

/** Lets non-React code (push registration) react to a language change. */
export function onLanguageChange(listener: (language: Language) => void): () => void {
  languageListeners.add(listener);
  return () => languageListeners.delete(listener);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    languageStorage
      .get()
      .then((stored) => {
        if (isLanguage(stored)) {
          setApiLanguage(stored);
          setLanguageState(stored);
        }
      })
      .catch(() => {});
  }, []);

  const setLanguage = useCallback((next: Language) => {
    setApiLanguage(next);
    setLanguageState(next);
    languageStorage.set(next).catch(() => {});
    languageListeners.forEach((listener) => listener(next));
  }, []);

  const value = useMemo<LanguageContextValue>(() => {
    const dictionary = DICTIONARIES[language];
    return {
      language,
      setLanguage,
      strings: dictionary,
      dateLocale: DATE_LOCALES[language],
      t: (key, params) => {
        const template = lookup(dictionary, key) ?? lookup(en, key) ?? key;
        return params ? template.replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match)) : template;
      },
    };
  }, [language, setLanguage]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider');
  return context;
}
