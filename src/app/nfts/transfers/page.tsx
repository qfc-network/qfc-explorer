export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchJsonSafe } from '@/lib/api-client';
import { shortenHash, formatNumber } from '@/lib/format';
import SectionHeader from '@/components/SectionHeader';
import Table from '@/components/Table';
import AddressTag from '@/components/AddressTag';
import { resolveAddressLabels } from '@/lib/labels';
import type { ApiNftActivityList } from '@/lib/api-types';

export const metadata: Metadata = {
  title: 'Latest NFT Transfers',
  description: 'Recent ERC-721 and ERC-1155 transfer activity on the QFC blockchain.',
  openGraph: {
    title: 'Latest NFT Transfers | QFC Explorer',
    description: 'Recent ERC-721 and ERC-1155 transfer activity on the QFC blockchain.',
    type: 'website',
  },
};

const PAGE_SIZE = 25;

type TransferRow = ApiNftActivityList['data']['items'][number];

async function fetchTransfers(page: number) {
  const response = await fetchJsonSafe<ApiNftActivityList>(
    `/api/tokens/nfts/transfers?page=${page}&limit=${PAGE_SIZE}`,
    { next: { revalidate: 10 } }
  );
  return response?.data?.items ?? [];
}

export default async function NftTransfersPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const page = Math.max(1, Number(searchParams.page ?? '1'));
  const transfers = await fetchTransfers(page);

  const allAddresses = transfers.flatMap((t) => [t.from_address, t.to_address]);
  const labels = await resolveAddressLabels(allAddresses);

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-12">
      <SectionHeader
        title="Latest NFT Transfers"
        description="Recent ERC-721 and ERC-1155 transfer activity across NFT collections"
        action={
          <Link
            href="/nfts"
            className="rounded-full border border-slate-300 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-800 dark:border-slate-700 dark:text-slate-200"
          >
            Top NFTs
          </Link>
        }
      />

      <Table
        rows={transfers}
        emptyMessage="No NFT transfers found."
        columns={[
          {
            key: 'tx',
            header: 'Tx Hash',
            render: (row: TransferRow) => (
              <Link href={`/txs/${row.tx_hash}`} className="text-slate-800 dark:text-slate-200">
                {shortenHash(row.tx_hash)}
              </Link>
            ),
          },
          {
            key: 'block',
            header: 'Block',
            render: (row: TransferRow) => (
              <Link href={`/blocks/${row.block_height}`} className="text-slate-600 dark:text-slate-300">
                {formatNumber(row.block_height)}
              </Link>
            ),
          },
          {
            key: 'from',
            header: 'From',
            render: (row: TransferRow) => (
              <AddressTag address={row.from_address} label={labels[row.from_address.toLowerCase()]?.label} />
            ),
          },
          {
            key: 'to',
            header: 'To',
            render: (row: TransferRow) => (
              <AddressTag address={row.to_address} label={labels[row.to_address.toLowerCase()]?.label} />
            ),
          },
          {
            key: 'tokenId',
            header: 'Token ID',
            render: (row: TransferRow) => (
              <span className="text-slate-600 dark:text-slate-300">{row.token_id ? `#${row.token_id}` : '—'}</span>
            ),
          },
          {
            key: 'collection',
            header: 'Collection',
            render: (row: TransferRow) => (
              <Link href={`/token/${row.token_address}?tab=inventory&page=1`} className="text-cyan-400 hover:text-cyan-300 text-xs">
                {row.token_name ?? row.token_symbol ?? shortenHash(row.token_address)}
                {row.token_type && <span className="ml-1 text-slate-500">{row.token_type}</span>}
              </Link>
            ),
          },
        ]}
      />

      <div className="flex items-center justify-between text-sm text-slate-400">
        <Link
          href={`/nfts/transfers?page=${Math.max(1, page - 1)}`}
          className="rounded-full border border-slate-200 px-4 py-2 dark:border-slate-800"
        >
          Previous
        </Link>
        <span>Page {page}</span>
        <Link
          href={`/nfts/transfers?page=${page + 1}`}
          className="rounded-full border border-slate-200 px-4 py-2 dark:border-slate-800"
        >
          Next
        </Link>
      </div>
    </main>
  );
}
