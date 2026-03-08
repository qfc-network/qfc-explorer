export const dynamic = "force-dynamic";

import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchJsonSafe } from '@/lib/api-client';
import type { ApiAddressDetail } from '@/lib/api-types';
import { formatNumber, formatWeiToQfc, shortenHash } from '@/lib/format';
import CopyButton from '@/components/CopyButton';
import AddressTabs from '@/components/AddressTabs';
import TranslatedText from '@/components/TranslatedText';
import AddressOverview from '@/components/AddressOverview';
import MultisigBadge from '@/components/MultisigBadge';
import BalanceChartSection from '@/components/BalanceChartSection';
import ActivityHeatmapSection from '@/components/ActivityHeatmapSection';

export async function generateMetadata({ params }: { params: { address: string } }): Promise<Metadata> {
  const short = shortenHash(params.address);
  return {
    title: `Address ${short}`,
    description: `Address ${short} on the QFC blockchain — balance, transactions, and token holdings.`,
    openGraph: {
      title: `Address ${short} | QFC Explorer`,
      description: `Address ${short} on the QFC blockchain.`,
      type: 'article',
    },
  };
}

const PAGE_SIZE = 25;

export default async function AddressDetailPage({
  params,
  searchParams,
}: {
  params: { address: string };
  searchParams: { page?: string; tab?: string; cursor?: string };
}) {
  const address = params.address;
  const cursor = searchParams.cursor ?? null;
  const page = Math.max(1, Number(searchParams.page ?? '1'));
  const tab = searchParams.tab ?? 'transactions';

  const apiQuery = cursor
    ? `/api/address/${address}?cursor=${encodeURIComponent(cursor)}&limit=${PAGE_SIZE}&tab=${tab}`
    : `/api/address/${address}?page=${page}&limit=${PAGE_SIZE}&tab=${tab}`;

  const response = await fetchJsonSafe<ApiAddressDetail>(apiQuery, {
    next: { revalidate: 20 },
  });

  const overview = response?.data.address ?? null;
  const stats = response?.data.stats ?? null;
  const analysis = response?.data.analysis ?? null;
  const contract = response?.data.contract ?? null;
  const tokenHoldings = response?.data.tokenHoldings ?? [];
  const nftHoldings = response?.data.nftHoldings ?? [];
  const transactions = response?.data.transactions ?? [];
  const tokenTransfers = response?.data.tokenTransfers ?? [];
  const internalTxs = response?.data.internalTxs ?? [];
  const nextCursor = response?.data.next_cursor ?? null;

  if (!overview) {
    return (
      <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-12">
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center">
          <p className="text-lg text-white"><TranslatedText tKey="address.notFound" /></p>
          <p className="mt-2 text-sm text-slate-400 font-mono break-all">{address}</p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700"
          >
            <TranslatedText tKey="common.backToHome" />
          </Link>
        </div>
      </main>
    );
  }

  const isContract = contract != null;
  const totalTxs = stats ? Number(stats.sent) + Number(stats.received) : 0;

  const overviewCards = [
    { labelKey: 'common.balance' as const, value: `${formatWeiToQfc(overview.balance)} QFC` },
    { labelKey: 'common.nonce' as const, value: formatNumber(overview.nonce) },
    {
      labelKey: 'address.transactions' as const,
      value: stats ? `${formatNumber(totalTxs)}` : '—',
      sub: stats ? `${stats.sent} ${/* sent */''} / ${stats.received}` : undefined,
    },
    { labelKey: 'address.lastActive' as const, value: `Block ${formatNumber(overview.last_seen_block)}` },
  ];

  const analysisCards = analysis ? [
    { labelKey: 'address.totalSent' as const, value: `${formatWeiToQfc(analysis.sent_value)} QFC` },
    { labelKey: 'address.totalReceived' as const, value: `${formatWeiToQfc(analysis.received_value)} QFC` },
  ] : [];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-lg font-semibold text-white">
          {isContract ? <TranslatedText tKey="contract.title" /> : <TranslatedText tKey="address.title" />}
        </h1>
        {isContract && contract.is_verified && (
          <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
            <TranslatedText tKey="common.verified" />
          </span>
        )}
        {isContract && <MultisigBadge address={address} />}
        <span className="font-mono text-sm text-slate-400 break-all">{address}</span>
        <CopyButton value={address} label="Copy" />
      </div>

      {/* Overview cards */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AddressOverview cards={overviewCards} />
      </div>

      {/* Value summary */}
      {analysisCards.length > 0 && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <AddressOverview cards={analysisCards} />
        </div>
      )}

      {/* Balance History Chart — collapsible, only for addresses with txs */}
      {totalTxs > 0 && (
        <BalanceChartSection address={address} />
      )}

      {/* Activity Heatmap — collapsible, only for addresses with txs */}
      {totalTxs > 0 && (
        <ActivityHeatmapSection address={address} />
      )}

      {/* Tabs */}
      <div className="mt-8">
        <AddressTabs
          address={address}
          transactions={transactions}
          tokenTransfers={tokenTransfers}
          internalTxs={internalTxs}
          tokenHoldings={tokenHoldings}
          nftHoldings={nftHoldings}
          contract={contract}
          currentTab={tab}
          page={page}
          nextCursor={nextCursor}
          txCount={stats ? String(Number(stats.sent) + Number(stats.received)) : '0'}
          tokenTransferCount="0"
          internalTxCount="0"
        />
      </div>
    </main>
  );
}
