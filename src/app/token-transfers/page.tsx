export const dynamic = "force-dynamic";

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Token Transfers',
  description: 'Recent token transfer activity on the QFC blockchain.',
  openGraph: {
    title: 'Token Transfers | QFC Explorer',
    description: 'Recent token transfer activity on the QFC blockchain.',
    type: 'website',
  },
};

import Link from 'next/link';
import { fetchJsonSafe } from '@/lib/api-client';
import { shortenHash, formatNumber } from '@/lib/format';
import SectionHeader from '@/components/SectionHeader';
import Table from '@/components/Table';
import AddressTag from '@/components/AddressTag';
import { resolveAddressLabels } from '@/lib/labels';
import type { ApiTokenTransfersList } from '@/lib/api-types';

const PAGE_SIZE = 25;

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'ERC-20', label: 'ERC-20' },
  { value: 'ERC-721', label: 'ERC-721' },
  { value: 'ERC-1155', label: 'ERC-1155' },
];

function formatTokenValue(value: string, decimals: number | null, tokenId: string | null): string {
  if (tokenId) return `#${tokenId}`;
  if (decimals == null || decimals === 0) return value;
  const raw = BigInt(value);
  const divisor = BigInt(10 ** decimals);
  const whole = raw / divisor;
  const frac = raw % divisor;
  if (frac === 0n) return whole.toLocaleString();
  const fracStr = frac.toString().padStart(decimals, '0').slice(0, 4).replace(/0+$/, '');
  return `${whole.toLocaleString()}.${fracStr}`;
}

export default async function TokenTransfersPage({
  searchParams,
}: {
  searchParams: { page?: string; type?: string };
}) {
  const page = Math.max(1, Number(searchParams.page ?? '1'));
  const type = searchParams.type || '';
  const typeParam = type ? `&type=${encodeURIComponent(type)}` : '';

  const response = await fetchJsonSafe<ApiTokenTransfersList>(
    `/api/tokens/transfers?page=${page}&limit=${PAGE_SIZE}${typeParam}`,
    { next: { revalidate: 10 } }
  );
  const transfers = response?.data?.items ?? [];

  const allAddresses = transfers.flatMap((t) => [t.from_address, t.to_address]);
  const labels = await resolveAddressLabels(allAddresses);

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-12">
      <SectionHeader
        title="Token Transfers"
        description="All ERC-20, ERC-721, and ERC-1155 token transfers"
        action={
          <Link
            href="/tokens"
            className="rounded-full border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-800 dark:text-slate-200"
          >
            Token List
          </Link>
        }
      />

      {/* Type filter */}
      <div className="flex items-center gap-2">
        {TYPE_OPTIONS.map((opt) => (
          <Link
            key={opt.value}
            href={`/token-transfers?type=${opt.value}&page=1`}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              type === opt.value
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-300 dark:border-slate-700 hover:text-slate-200'
            }`}
          >
            {opt.label}
          </Link>
        ))}
      </div>

      <Table
        rows={transfers}
        emptyMessage="No token transfers found."
        columns={[
          {
            key: 'tx',
            header: 'Tx Hash',
            render: (row) => (
              <Link href={`/txs/${row.tx_hash}`} className="text-slate-800 dark:text-slate-200">
                {shortenHash(row.tx_hash)}
              </Link>
            ),
          },
          {
            key: 'block',
            header: 'Block',
            render: (row) => (
              <Link href={`/blocks/${row.block_height}`} className="text-slate-600 dark:text-slate-300">
                {formatNumber(row.block_height)}
              </Link>
            ),
          },
          {
            key: 'from',
            header: 'From',
            render: (row) => (
              <AddressTag address={row.from_address} label={labels[row.from_address.toLowerCase()]?.label} />
            ),
          },
          {
            key: 'to',
            header: 'To',
            render: (row) => (
              <AddressTag address={row.to_address} label={labels[row.to_address.toLowerCase()]?.label} />
            ),
          },
          {
            key: 'value',
            header: 'Value',
            render: (row) => (
              <span className="text-slate-600 dark:text-slate-300">
                {formatTokenValue(row.value, row.token_decimals, row.token_id)}
              </span>
            ),
          },
          {
            key: 'token',
            header: 'Token',
            render: (row) => (
              <Link href={`/token/${row.token_address}`} className="text-cyan-400 hover:text-cyan-300 text-xs">
                {row.token_symbol ?? shortenHash(row.token_address)}
                {row.token_type && row.token_type !== 'ERC-20' && (
                  <span className="ml-1 text-slate-500">{row.token_type}</span>
                )}
              </Link>
            ),
          },
        ]}
      />

      <div className="flex items-center justify-between text-sm text-slate-400">
        <Link
          href={`/token-transfers?page=${Math.max(1, page - 1)}&type=${type}`}
          className="rounded-full border border-slate-200 dark:border-slate-800 px-4 py-2"
        >
          Previous
        </Link>
        <span>Page {page}</span>
        <Link
          href={`/token-transfers?page=${page + 1}&type=${type}`}
          className="rounded-full border border-slate-200 dark:border-slate-800 px-4 py-2"
        >
          Next
        </Link>
      </div>
    </main>
  );
}
