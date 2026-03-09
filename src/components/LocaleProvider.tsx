'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { Locale } from '@/lib/i18n';
import { defaultLocale, detectLocale, saveLocale } from '@/lib/i18n';
import translations from '@/lib/translations';
import type { TranslationKey } from '@/lib/translations';

type TranslateFn = (key: TranslationKey) => string;

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslateFn;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLocaleState(detectLocale());
    setMounted(true);
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    saveLocale(newLocale);
  }, []);

  const t = useCallback(
    (key: TranslationKey): string => {
      const dict = translations[locale];
      return dict[key] ?? translations.en[key] ?? key;
    },
    [locale]
  );

  // During SSR / hydration, render with default locale to avoid mismatch
  const value: LocaleContextValue = {
    locale: mounted ? locale : defaultLocale,
    setLocale,
    t: mounted
      ? t
      : (key: TranslationKey) => translations.en[key] ?? key,
  };

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error('useTranslation must be used within a LocaleProvider');
  }
  return ctx;
}
