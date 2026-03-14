export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchJsonSafe } from '@/lib/api-client';
import { shortenHash, formatNumber } from '@/lib/format';
import SectionHeader from '@/components/SectionHeader';
import Table from '@/components/Table';
import AddressTag from '@/components/AddressTag';
import { resolveAddressLabels } from '@/lib/labels';
import type { ApiTokenTransfersList } from '@/lib/api-types';

export const metadata: Metadata = {
  title: 'Latest NFT Mints',
  description: 'Recently minted ERC-721 and ERC-1155 NFTs on the QFC blockchain.',
  openGraph: {
    title: 'Latest NFT Mints | QFC Explorer',
    description: 'Recently minted ERC-721 and ERC-1155 NFTs on the QFC blockchain.',
    type: 'website',
  },
};

const PAGE_SIZE = 25;
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

type TransferRow = ApiTokenTransfersList['data']['items'][number];

async function fetchTransfers(type: 'ERC-721' | 'ERC-1155', page: number) {
  const response = await fetchJsonSafe<ApiTokenTransfersList>(
    `/api/tokens/transfers?page=${page}&limit=${PAGE_SIZE * 3}&type=${encodeURIComponent(type)}`,
    { next: { revalidate: 10 } }
  );
  return response?.data?.items ?? [];
}

export default async function NftMintsPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const page = Math.max(1, Number(searchParams.page ?? '1'));
  const [erc721Transfers, erc1155Transfers] = await Promise.all([
    fetchTransfers('ERC-721', page),
    fetchTransfers('ERC-1155', page),
  ]);

  const mints = [...erc721Transfers, ...erc1155Transfers]
    .filter((row) => row.from_address.toLowerCase() === ZERO_ADDRESS)
    .sort((a, b) => Number(b.block_height) - Number(a.block_height))
    .slice(0, PAGE_SIZE);

  const allAddresses = mints.flatMap((t) => [t.to_address]);
  const labels = await resolveAddressLabels(allAddresses);

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-12">
      <SectionHeader
        title="Latest NFT Mints"
        description="Freshly minted ERC-721 and ERC-1155 items detected from zero-address transfers"
        action={
          <Link
            href="/nfts/transfers"
            className="rounded-full border border-slate-300 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-800 dark:border-slate-700 dark:text-slate-200"
          >
            Latest Transfers
          </Link>
        }
      />

      <Table
        rows={mints}
        emptyMessage="No NFT mints found."
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
            key: 'mintedTo',
            header: 'Minted To',
            render: (row: TransferRow) => (
              <AddressTag address={row.to_address} label={labels[row.to_address.toLowerCase()]?.label} />
            ),
          },
          {
            key: 'tokenId',
            header: 'Token ID',
            render: (row: TransferRow) => (
              <span className="text-slate-600 dark:text-slate-300">{row.token_id ? `#${row.token_id}` : row.value}</span>
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

      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 px-4 py-3 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
        Mints are inferred from NFT transfers where the sender is the zero address.
      </div>

      <div className="flex items-center justify-between text-sm text-slate-400">
        <Link
          href={`/nfts/mints?page=${Math.max(1, page - 1)}`}
          className="rounded-full border border-slate-200 px-4 py-2 dark:border-slate-800"
        >
          Previous
        </Link>
        <span>Page {page}</span>
        <Link
          href={`/nfts/mints?page=${page + 1}`}
          className="rounded-full border border-slate-200 px-4 py-2 dark:border-slate-800"
        >
          Next
        </Link>
      </div>
    </main>
  );
}
