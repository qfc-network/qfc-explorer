'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useTranslation } from '@/components/LocaleProvider';
import { shortenHash } from '@/lib/format';
import TranslatedPagination from '@/components/TranslatedPagination';
import CsvExport from '@/components/CsvExport';

type Token = {
  address: string;
  name: string | null;
  symbol: string | null;
  decimals: number | null;
  total_supply: string | null;
  token_type: string;
};

function formatSupply(supply: string | null, decimals: number | null): string {
  if (!supply) return '—';
  try {
    const val = BigInt(supply);
    const dec = decimals ?? 18;
    const base = 10n ** BigInt(dec);
    const whole = val / base;
    if (whole > 1_000_000n) return `${(Number(whole) / 1_000_000).toFixed(2)}M`;
    if (whole > 1_000n) return `${(Number(whole) / 1_000).toFixed(2)}K`;
    return whole.toString();
  } catch {
    return supply;
  }
}

type Props = {
  tokens: Token[];
  page: number;
  pageSize: number;
};

export default function TokensPageClient({ tokens, page, pageSize }: Props) {
  const { t } = useTranslation();

  const csvData = useMemo(() =>
    tokens.map((token, i) => ({
      rank: String((page - 1) * pageSize + i + 1),
      name: token.name ?? '',
      symbol: token.symbol ?? '',
      type: token.token_type,
      address: token.address,
      decimals: token.decimals != null ? String(token.decimals) : '',
      total_supply: formatSupply(token.total_supply, token.decimals),
    })),
    [tokens, page, pageSize]
  );

  const csvColumns = useMemo(() => [
    { key: 'rank', label: '#' },
    { key: 'name', label: t('tokens.token') },
    { key: 'symbol', label: 'Symbol' },
    { key: 'type', label: t('tokens.type') },
    { key: 'address', label: t('tokens.contract') },
    { key: 'decimals', label: t('tokens.decimals') },
    { key: 'total_supply', label: t('tokens.totalSupply') },
  ], [t]);

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{t('tokens.title')}</h1>
          <p className="mt-1 text-sm text-slate-400">{t('tokens.description')}</p>
        </div>
        <CsvExport data={csvData} filename="qfc_tokens" columns={csvColumns} />
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800/60 text-left text-xs uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">{t('tokens.token')}</th>
              <th className="px-4 py-3">{t('tokens.type')}</th>
              <th className="px-4 py-3">{t('tokens.contract')}</th>
              <th className="px-4 py-3">{t('tokens.decimals')}</th>
              <th className="px-4 py-3 text-right">{t('tokens.totalSupply')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/40">
            {tokens.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  {t('tokens.noTokens')}
                </td>
              </tr>
            ) : (
              tokens.map((token, i) => (
                <tr key={token.address} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                  <td className="px-4 py-3 text-slate-500">{(page - 1) * pageSize + i + 1}</td>
                  <td className="px-4 py-3">
                    <Link href={`/token/${token.address}`} className="group">
                      <span className="font-medium text-slate-900 dark:text-white group-hover:text-cyan-300">{token.name ?? t('common.unknown')}</span>
                      {token.symbol && (
                        <span className="ml-2 text-xs text-slate-400">({token.symbol})</span>
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <TokenTypeBadge type={token.token_type} />
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/address/${token.address}`} className="font-mono text-xs text-cyan-400 hover:text-cyan-300">
                      {shortenHash(token.address)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{token.decimals ?? '—'}</td>
                  <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">
                    {formatSupply(token.total_supply, token.decimals)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4">
        <TranslatedPagination
          basePath="/tokens"
          page={page}
          hasPrevious={page > 1}
          hasNext={tokens.length === pageSize}
          prevHref={page > 1 ? `/tokens?page=${page - 1}` : undefined}
          nextHref={tokens.length === pageSize ? `/tokens?page=${page + 1}` : undefined}
        />
      </div>
    </>
  );
}

function TokenTypeBadge({ type }: { type: string }) {
  const config: Record<string, { label: string; className: string }> = {
    erc20: { label: 'ERC-20', className: 'bg-cyan-500/10 text-cyan-400' },
    erc721: { label: 'ERC-721', className: 'bg-purple-500/10 text-purple-400' },
    erc1155: { label: 'ERC-1155', className: 'bg-orange-500/10 text-orange-400' },
  };
  const c = config[type] ?? config.erc20;
  return <span className={`rounded px-2 py-0.5 text-xs font-medium ${c.className}`}>{c.label}</span>;
}
