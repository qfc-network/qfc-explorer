'use client';

import { useState, useRef, useEffect } from 'react';
import { localeList, type Locale } from '@/lib/i18n';
import { useTranslation } from './LocaleProvider';

const FLAGS: Record<Locale, string> = {
  en: 'EN',
  zh: 'ZH',
  ja: 'JA',
  ko: 'KO',
};

export default function LocaleSwitcher() {
  const { locale, setLocale } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1.5 text-xs text-slate-300 hover:border-slate-700 hover:text-white transition-colors"
        aria-label="Select language"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
        <span>{FLAGS[locale]}</span>
        <svg aria-hidden="true" className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div role="listbox" aria-label="Select language" className="absolute right-0 top-full z-50 mt-1 min-w-[140px] rounded-lg border border-slate-800 bg-slate-950 py-1 shadow-xl">
          {localeList.map(([code, name]) => (
            <button
              key={code}
              role="option"
              aria-selected={locale === code}
              onClick={() => {
                setLocale(code);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors ${
                locale === code
                  ? 'bg-slate-900 text-cyan-400'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <span className="text-xs font-medium w-5">{FLAGS[code]}</span>
              <span>{name}</span>
              {locale === code && (
                <svg aria-hidden="true" className="ml-auto h-3.5 w-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
