export const dynamic = "force-dynamic";

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rich List | QFC Explorer',
  description: 'Top accounts ranked by QFC balance. View the wealthiest addresses on the QFC blockchain.',
  openGraph: {
    title: 'Rich List | QFC Explorer',
    description: 'Top accounts ranked by QFC balance on the QFC blockchain.',
    type: 'website',
  },
};

import Link from 'next/link';
import { fetchJsonSafe } from '@/lib/api-client';
import { shortenHash, formatWeiToQfc, formatNumber } from '@/lib/format';
import type { ApiRichList } from '@/lib/api-types';
import TranslatedText from '@/components/TranslatedText';
import RichListClient from './RichListClient';

export default async function RichListPage({
  searchParams,
}: {
  searchParams: { page?: string; type?: string };
}) {
  const page = Math.max(1, Number(searchParams.page) || 1);
  const type = ['all', 'eoa', 'contract'].includes(searchParams.type ?? '')
    ? searchParams.type!
    : 'all';
  const limit = 50;

  const response = await fetchJsonSafe<ApiRichList>(
    `/api/richlist?page=${page}&limit=${limit}&type=${type}`,
    { next: { revalidate: 30 } }
  );

  const data = response?.data ?? {
    page,
    limit,
    type,
    total: 0,
    total_supply: '0',
    top10_balance: '0',
    items: [],
  };

  const totalPages = Math.max(1, Math.ceil(data.total / limit));

  // Calculate top 10 percentage
  const totalSupplyBig = BigInt(data.total_supply || '0');
  const top10Big = BigInt(data.top10_balance || '0');
  const top10Pct = totalSupplyBig > 0n
    ? (Number((top10Big * 10000n) / totalSupplyBig) / 100).toFixed(2)
    : '0.00';

  // Find max balance (first item) for proportional bars
  const maxBalanceBig = data.items.length > 0
    ? BigInt(data.items[0].balance || '0')
    : 1n;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-white">
          <TranslatedText tKey="richlist.title" />
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          <TranslatedText tKey="richlist.description" />
        </p>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <div className="text-xs uppercase tracking-wider text-slate-500">
            <TranslatedText tKey="richlist.totalAccounts" />
          </div>
          <div className="mt-1 text-xl font-semibold text-white">
            {formatNumber(data.total)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <div className="text-xs uppercase tracking-wider text-slate-500">
            <TranslatedText tKey="richlist.totalSupply" />
          </div>
          <div className="mt-1 text-xl font-semibold text-white">
            {formatWeiToQfc(data.total_supply)} QFC
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <div className="text-xs uppercase tracking-wider text-slate-500">
            <TranslatedText tKey="richlist.top10Hold" />
          </div>
          <div className="mt-1 text-xl font-semibold text-white">
            {top10Pct}%
          </div>
        </div>
      </div>

      {/* Client-side interactive portion (filters + table + pagination) */}
      <RichListClient
        items={data.items}
        page={page}
        totalPages={totalPages}
        type={type}
        totalSupply={data.total_supply}
        maxBalance={maxBalanceBig.toString()}
      />
    </main>
  );
}
