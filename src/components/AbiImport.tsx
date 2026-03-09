'use client';

import { useState, useRef, useCallback } from 'react';
import { useTranslation } from '@/components/LocaleProvider';

type Props = {
  address: string;
  onAbiImported: (abi: unknown[]) => void;
};

function getStorageKey(address: string): string {
  return `abi:${address.toLowerCase()}`;
}

export function getStoredAbi(address: string): unknown[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(getStorageKey(address));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {}
  return null;
}

export function clearStoredAbi(address: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(getStorageKey(address));
  } catch {}
}

function validateAbi(data: unknown): data is unknown[] {
  if (!Array.isArray(data)) return false;
  if (data.length === 0) return false;
  // Check that at least some entries look like ABI items
  return data.some((item) => {
    if (typeof item !== 'object' || item === null) return false;
    const obj = item as Record<string, unknown>;
    // Valid ABI entries have a type field (function, event, constructor, etc.)
    if (typeof obj.type !== 'string') return false;
    // Functions and events should have a name
    if ((obj.type === 'function' || obj.type === 'event') && typeof obj.name !== 'string') {
      return false;
    }
    return true;
  });
}

export default function AbiImport({ address, onAbiImported }: Props) {
  const { t } = useTranslation();
  const [abiText, setAbiText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = useCallback(() => {
    setError(null);
    setSuccess(false);

    if (!abiText.trim()) {
      setError(t('abi.invalid'));
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(abiText.trim());
    } catch {
      setError(t('abi.invalid'));
      return;
    }

    if (!validateAbi(parsed)) {
      setError(t('abi.invalid'));
      return;
    }

    try {
      localStorage.setItem(getStorageKey(address), JSON.stringify(parsed));
    } catch {
      setError(t('abi.invalid'));
      return;
    }

    setSuccess(true);
    onAbiImported(parsed as unknown[]);
  }, [abiText, address, onAbiImported, t]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        setAbiText(text);
        setError(null);
        setSuccess(false);
      }
    };
    reader.readAsText(file);

    // Reset file input so the same file can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  if (!isOpen) {
    return (
      <section className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/30 p-6 text-center">
        <p className="text-sm text-slate-400 mb-3">
          This contract is not verified. Import an ABI to interact with it.
        </p>
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-400 hover:bg-cyan-500/20 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          {t('abi.import')}
        </button>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t('abi.import')}</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-slate-400 hover:text-slate-200 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div>
        <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">
          {t('abi.paste')}
        </label>
        <textarea
          value={abiText}
          onChange={(e) => {
            setAbiText(e.target.value);
            setError(null);
            setSuccess(false);
          }}
          placeholder='[{"type":"function","name":"balanceOf","inputs":[{"name":"account","type":"address"}],"outputs":[{"type":"uint256"}],"stateMutability":"view"}]'
          className="w-full h-40 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3 py-2 text-sm font-mono text-slate-800 dark:text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none resize-y"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleImport}
          className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-900 dark:text-white hover:bg-cyan-600 transition-colors"
        >
          {t('abi.validate')}
        </button>

        <label className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          {t('abi.upload')}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-green-500/10 border border-green-500/30 p-3">
          <p className="text-sm text-green-400">{t('abi.success')}</p>
        </div>
      )}
    </section>
  );
}
