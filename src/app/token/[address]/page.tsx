export const dynamic = "force-dynamic";

import Link from 'next/link';
import SectionHeader from '@/components/SectionHeader';
import Table from '@/components/Table';
import { fetchJsonSafe } from '@/lib/api-client';
import type { ApiTokenDetail, ApiTokenHolders } from '@/lib/api-types';
import { formatWeiToQfc, shortenHash } from '@/lib/format';

const PAGE_SIZE = 25;

export default async function TokenDetailPage({
  params,
  searchParams,
}: {
  params: { address: string };
  searchParams: { page?: string };
}) {
  const page = Math.max(1, Number(searchParams.page ?? '1'));
  const address = params.address.toLowerCase();

  const [response, holdersResponse] = await Promise.all([
    fetchJsonSafe<ApiTokenDetail>(
    `/api/tokens/${address}?page=${page}&limit=${PAGE_SIZE}`,
    { next: { revalidate: 20 } }
    ),
    fetchJsonSafe<ApiTokenHolders>(
      `/api/tokens/${address}/holders?limit=10`,
      { next: { revalidate: 30 } }
    ),
  ]);

  const token = response?.data.token ?? null;
  const transfers = response?.data.transfers ?? [];
  const holders = holdersResponse?.data.holders ?? [];

  if (!token) {
    return (
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-12">
        <SectionHeader title="Token not found" description={address} />
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-12">
      <SectionHeader title={`${token.name ?? 'Token'} (${token.symbol ?? '—'})`} description={token.address} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Decimals</p>
          <p className="mt-2 text-lg text-white">{token.decimals ?? '—'}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Total Supply</p>
          <p className="mt-2 text-lg text-white">{token.total_supply ? formatWeiToQfc(token.total_supply) : '—'}</p>
        </div>
      </div>

      <section className="space-y-4">
        <SectionHeader title="Transfers" description={`Showing page ${page}`} />
        <Table
          rows={transfers}
          emptyMessage="No transfers indexed yet."
          columns={[
            {
              key: 'tx',
              header: 'Tx',
              render: (row) => (
                <Link href={`/txs/${row.tx_hash}`} className="text-slate-200">
                  {shortenHash(row.tx_hash)}
                </Link>
              ),
            },
            {
              key: 'from',
              header: 'From',
              render: (row) => shortenHash(row.from_address),
            },
            {
              key: 'to',
              header: 'To',
              render: (row) => shortenHash(row.to_address),
            },
            {
              key: 'value',
              header: 'Value',
              render: (row) => formatWeiToQfc(row.value),
            },
            {
              key: 'block',
              header: 'Block',
              render: (row) => row.block_height,
            },
          ]}
        />

        <div className="flex items-center justify-between text-sm text-slate-400">
          <Link
            href={`/token/${address}?page=${Math.max(1, page - 1)}`}
            className="rounded-full border border-slate-800 px-4 py-2"
          >
            Previous
          </Link>
          <span>Page {page}</span>
          <Link
            href={`/token/${address}?page=${page + 1}`}
            className="rounded-full border border-slate-800 px-4 py-2"
          >
            Next
          </Link>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader title="Top Holders" description="Based on indexed transfers" />
        <Table
          rows={holders}
          emptyMessage="No holders indexed yet."
          columns={[
            {
              key: 'address',
              header: 'Address',
              render: (row) => shortenHash(row.address),
            },
            {
              key: 'balance',
              header: 'Balance',
              render: (row) => formatWeiToQfc(row.balance),
            },
          ]}
        />
      </section>
    </main>
  );
}
