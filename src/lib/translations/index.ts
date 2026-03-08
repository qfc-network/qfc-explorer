import type { Locale } from '../i18n';
import en from './en';
import zh from './zh';
import ja from './ja';
import ko from './ko';

export type { TranslationKey } from './en';

const translations: Record<Locale, Record<string, string>> = {
  en,
  zh,
  ja,
  ko,
};

export default translations;
