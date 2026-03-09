export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchJsonSafe } from '@/lib/api-client';
import SectionHeader from '@/components/SectionHeader';
import TranslatedText from '@/components/TranslatedText';
import TxPoolClient from '@/components/TxPoolClient';

export const metadata: Metadata = {
  title: 'Pending Transactions (Mempool)',
  description: 'View pending and queued transactions in the QFC blockchain mempool.',
  openGraph: {
    title: 'Pending Transactions | QFC Explorer',
    description: 'View pending and queued transactions in the QFC blockchain mempool.',
    type: 'website',
  },
};

type TxPoolTx = {
  hash: string;
  from: string;
  to: string | null;
  value: string;
  gasPrice: string;
  nonce: number;
  gas: string | null;
  input: string | null;
};

type TxPoolResponse = {
  ok: boolean;
  data: {
    pending: TxPoolTx[];
    queued: TxPoolTx[];
    totalPending: number;
    totalQueued: number;
    gasPriceStats: { min: number; max: number; avg: number };
    sort: string;
    order: string;
    limit: number;
  };
};

export default async function TxPoolPage() {
  const response = await fetchJsonSafe<TxPoolResponse>('/api/txpool?sort=gas_price&order=desc&limit=200');
  const data = response?.data ?? null;

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-12">
      <SectionHeader
        title={<TranslatedText tKey="txpool.title" />}
        description={<TranslatedText tKey="txpool.description" />}
        action={
          <Link
            href="/"
            className="rounded-full border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-800 dark:text-slate-200"
          >
            <TranslatedText tKey="common.back" />
          </Link>
        }
      />

      <TxPoolClient initialData={data} />
    </main>
  );
}
