export const dynamic = "force-dynamic";

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Transactions',
  description: 'Browse all transactions on the QFC blockchain.',
  openGraph: {
    title: 'Transactions | QFC Explorer',
    description: 'Browse all transactions on the QFC blockchain.',
    type: 'website',
  },
};

import Link from 'next/link';
import { fetchJsonSafe } from '@/lib/api-client';
import type { ApiTransactionsList } from '@/lib/api-types';
import SectionHeader from '@/components/SectionHeader';
import AutoRefresh from '@/components/AutoRefresh';
import TranslatedText from '@/components/TranslatedText';
import TxsPageClient from '@/components/TxsPageClient';
import { resolveAddressLabels } from '@/lib/labels';

const PAGE_SIZE = 25;

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: { page?: string; cursor?: string };
}) {
  const cursor = searchParams.cursor ?? null;
  const page = Math.max(1, Number(searchParams.page ?? '1'));

  // Use cursor-based fetch when cursor is present, otherwise fall back to page-based
  const apiQuery = cursor
    ? `/api/transactions?cursor=${encodeURIComponent(cursor)}&limit=${PAGE_SIZE}`
    : `/api/transactions?page=${page}&limit=${PAGE_SIZE}`;

  const response = await fetchJsonSafe<ApiTransactionsList>(apiQuery, {
    next: { revalidate: 10 },
  });
  const transactions = response?.data.items ?? [];
  const nextCursor = response?.data.next_cursor ?? null;

  // Resolve address labels
  const allAddresses = transactions.flatMap((tx) => [tx.from_address, tx.to_address].filter(Boolean) as string[]);
  const labels = await resolveAddressLabels(allAddresses);

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-12">
      <AutoRefresh intervalMs={20000} />
      <SectionHeader
        title={<TranslatedText tKey="txs.title" />}
        description={cursor ? <TranslatedText tKey="common.browsingData" /> : <><TranslatedText tKey="common.showingPage" /> {page}</>}
        action={
          <Link
            href="/"
            className="rounded-full border border-slate-700 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-200"
          >
            <TranslatedText tKey="common.back" />
          </Link>
        }
      />

      <TxsPageClient
        transactions={transactions}
        labels={labels}
        page={page}
        cursor={cursor}
        nextCursor={nextCursor}
        pageSize={PAGE_SIZE}
      />
    </main>
  );
}
