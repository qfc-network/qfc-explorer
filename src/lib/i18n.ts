export type Locale = 'en' | 'zh' | 'ja' | 'ko';

export const defaultLocale: Locale = 'en';

export const locales: Record<Locale, string> = {
  en: 'English',
  zh: '中文',
  ja: '日本語',
  ko: '한국어',
};

export const localeList = Object.entries(locales) as [Locale, string][];

const LOCALE_KEY = 'qfc-locale';

export function getSavedLocale(): Locale | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(LOCALE_KEY);
    if (saved && saved in locales) return saved as Locale;
  } catch {}
  return null;
}

export function saveLocale(locale: Locale): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCALE_KEY, locale);
  } catch {}
}

export function detectLocale(): Locale {
  const saved = getSavedLocale();
  if (saved) return saved;

  if (typeof navigator === 'undefined') return defaultLocale;

  const browserLang = navigator.language?.toLowerCase() ?? '';
  if (browserLang.startsWith('zh')) return 'zh';
  if (browserLang.startsWith('ja')) return 'ja';
  if (browserLang.startsWith('ko')) return 'ko';
  return defaultLocale;
}
