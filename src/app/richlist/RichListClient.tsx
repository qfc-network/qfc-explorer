'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from '@/components/LocaleProvider';
import { shortenHash, formatWeiToQfc, formatNumber } from '@/lib/format';
import type { RichListAccount } from '@/lib/api-types';
import type { TranslationKey } from '@/lib/translations/en';

type Props = {
  items: RichListAccount[];
  page: number;
  totalPages: number;
  type: string;
  totalSupply: string;
  maxBalance: string;
};

const FILTERS: Array<{ key: string; labelKey: TranslationKey }> = [
  { key: 'all', labelKey: 'richlist.filterAll' },
  { key: 'eoa', labelKey: 'richlist.filterEoa' },
  { key: 'contract', labelKey: 'richlist.filterContract' },
];

export default function RichListClient({
  items,
  page,
  totalPages,
  type,
  totalSupply,
  maxBalance,
}: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  const totalSupplyBig = BigInt(totalSupply || '0');
  const maxBalanceBig = BigInt(maxBalance || '1');

  function buildHref(newType?: string, newPage?: number) {
    const params = new URLSearchParams();
    const tp = newType ?? type;
    const pg = newPage ?? 1;
    if (tp !== 'all') params.set('type', tp);
    if (pg > 1) params.set('page', String(pg));
    const qs = params.toString();
    return `/richlist${qs ? `?${qs}` : ''}`;
  }

  return (
    <>
      {/* Filter pills */}
      <div className="mt-6 flex gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={buildHref(f.key, 1)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              type === f.key
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                : 'bg-slate-800/60 text-slate-400 border border-slate-700/40 hover:text-white hover:border-slate-600'
            }`}
          >
            {t(f.labelKey)}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/40 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800/60 text-left text-xs uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3 w-16">{t('richlist.rank')}</th>
              <th className="px-4 py-3">{t('richlist.address')}</th>
              <th className="px-4 py-3 text-right">{t('richlist.balance')}</th>
              <th className="px-4 py-3 w-48">{t('richlist.percentage')}</th>
              <th className="px-4 py-3 text-right">{t('richlist.txCount')}</th>
              <th className="px-4 py-3 w-24">{t('richlist.type')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  {t('richlist.noData')}
                </td>
              </tr>
            ) : (
              items.map((account, i) => {
                const rank = (page - 1) * 50 + i + 1;
                const balanceBig = BigInt(account.balance || '0');

                // Percentage of total supply
                const supplyPct = totalSupplyBig > 0n
                  ? (Number((balanceBig * 10000n) / totalSupplyBig) / 100)
                  : 0;

                // Bar width proportional to max holder (first item on page 1)
                const barPct = maxBalanceBig > 0n
                  ? Number((balanceBig * 100n) / maxBalanceBig)
                  : 0;

                return (
                  <tr key={account.address} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-2.5 text-slate-500 font-medium">{rank}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/address/${account.address}`}
                          className="font-mono text-xs text-cyan-400 hover:text-cyan-300"
                        >
                          {shortenHash(account.address, 8, 6)}
                        </Link>
                        {account.label && (
                          <span className="rounded bg-slate-700/60 px-1.5 py-0.5 text-[10px] font-medium text-slate-300">
                            {account.label}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-300">
                      {formatWeiToQfc(account.balance)}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-28 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-cyan-400/60"
                            style={{ width: `${Math.min(100, barPct)}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400 w-14 text-right">
                          {supplyPct.toFixed(2)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-300">
                      {formatNumber(account.tx_count)}
                    </td>
                    <td className="px-4 py-2.5">
                      {account.is_contract ? (
                        <span className="rounded bg-purple-500/10 px-2 py-0.5 text-xs font-medium text-purple-400">
                          {t('richlist.contract')}
                        </span>
                      ) : (
                        <span className="rounded bg-slate-700/50 px-2 py-0.5 text-xs text-slate-400">
                          {t('richlist.eoa')}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
          {page > 1 ? (
            <Link
              href={buildHref(type, page - 1)}
              className="rounded-full border border-slate-800 px-4 py-2 hover:bg-slate-900 transition-colors"
            >
              {t('common.previous')}
            </Link>
          ) : (
            <span className="rounded-full border border-slate-800/40 px-4 py-2 text-slate-600">
              {t('common.previous')}
            </span>
          )}
          <span>
            {t('common.page')} {page} {t('common.of')} {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              href={buildHref(type, page + 1)}
              className="rounded-full border border-slate-800 px-4 py-2 hover:bg-slate-900 transition-colors"
            >
              {t('common.next')}
            </Link>
          ) : (
            <span className="rounded-full border border-slate-800/40 px-4 py-2 text-slate-600">
              {t('common.next')}
            </span>
          )}
        </div>
      )}
    </>
  );
}
