'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from '@/components/LocaleProvider';

type Props = {
  compilers: string[];
  total: number;
};

export default function ContractsFilter({ compilers, total }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const compiler = searchParams.get('compiler') ?? '';
  const sort = searchParams.get('sort') ?? 'verified_at';
  const order = searchParams.get('order') ?? 'desc';

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      // Reset to page 1 when filters change
      params.delete('page');
      router.push(`/contracts?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        updateParams({ search: value });
      }, 300);
    },
    [updateParams]
  );

  // Sync search input with URL on external navigation
  useEffect(() => {
    setSearch(searchParams.get('search') ?? '');
  }, [searchParams]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const hasFilters = search || compiler || sort !== 'verified_at' || order !== 'desc';

  const clearFilters = useCallback(() => {
    setSearch('');
    router.push('/contracts');
  }, [router]);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">
          {t('contracts.filter.resultsCount').replace('{count}', String(total))}
        </span>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            {t('contracts.filter.clear')}
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {/* Search input */}
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={t('contracts.filter.searchPlaceholder')}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Compiler dropdown */}
        <select
          value={compiler}
          onChange={(e) => updateParams({ compiler: e.target.value })}
          className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:border-blue-500 focus:outline-none"
        >
          <option value="">{t('contracts.filter.allCompilers')}</option>
          {compilers.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>

        {/* Sort selector */}
        <select
          value={sort}
          onChange={(e) => updateParams({ sort: e.target.value })}
          className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:border-blue-500 focus:outline-none"
        >
          <option value="verified_at">{t('contracts.filter.sortVerifiedDate')}</option>
          <option value="created_at">{t('contracts.filter.sortCreatedDate')}</option>
          <option value="name">{t('contracts.filter.sortName')}</option>
        </select>

        {/* Order toggle */}
        <button
          onClick={() => updateParams({ order: order === 'desc' ? 'asc' : 'desc' })}
          className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
          title={order === 'desc' ? t('contracts.filter.descending') : t('contracts.filter.ascending')}
        >
          {order === 'desc' ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          )}
          {order === 'desc' ? t('contracts.filter.descending') : t('contracts.filter.ascending')}
        </button>
      </div>
    </div>
  );
}
