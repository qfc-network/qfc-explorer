'use client';

import { useEffect, useRef } from 'react';
import { useTranslation } from '@/components/LocaleProvider';

type ShortcutsModalProps = {
  open: boolean;
  onClose: () => void;
};

type ShortcutEntry = {
  keys: string[];
  labelKey: string;
};

const SHORTCUT_GROUPS: { titleKey: string; items: ShortcutEntry[] }[] = [
  {
    titleKey: 'shortcuts.general',
    items: [
      { keys: ['/'], labelKey: 'shortcuts.focusSearch' },
      { keys: ['?'], labelKey: 'shortcuts.showHelp' },
      { keys: ['Esc'], labelKey: 'shortcuts.closeModal' },
    ],
  },
  {
    titleKey: 'shortcuts.navigation',
    items: [
      { keys: ['g', 'b'], labelKey: 'shortcuts.goBlocks' },
      { keys: ['g', 't'], labelKey: 'shortcuts.goTransactions' },
      { keys: ['g', 'k'], labelKey: 'shortcuts.goTokens' },
      { keys: ['g', 'c'], labelKey: 'shortcuts.goContracts' },
      { keys: ['g', 'a'], labelKey: 'shortcuts.goAnalytics' },
      { keys: ['g', 'n'], labelKey: 'shortcuts.goNetwork' },
    ],
  },
];

function KeyBadge({ label }: { label: string }) {
  return (
    <kbd className="inline-flex h-6 min-w-[24px] items-center justify-center rounded border border-slate-300 bg-slate-100 px-1.5 font-mono text-xs font-medium text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
      {label}
    </kbd>
  );
}

export default function ShortcutsModal({ open, onClose }: ShortcutsModalProps) {
  const { t } = useTranslation();
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="mx-4 w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {t('shortcuts.title')}
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.titleKey} className="mb-5 last:mb-0">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t(group.titleKey as Parameters<typeof t>[0])}
              </h3>
              <div className="space-y-2">
                {group.items.map((item) => (
                  <div
                    key={item.labelKey}
                    className="flex items-center justify-between rounded-lg px-2 py-1.5"
                  >
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {t(item.labelKey as Parameters<typeof t>[0])}
                    </span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((key, i) => (
                        <span key={i} className="flex items-center gap-1">
                          {i > 0 && (
                            <span className="text-xs text-slate-400">then</span>
                          )}
                          <KeyBadge label={key} />
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-3 dark:border-slate-700">
          <p className="text-center text-xs text-slate-400">
            {t('shortcuts.hint')}
          </p>
        </div>
      </div>
    </div>
  );
}
