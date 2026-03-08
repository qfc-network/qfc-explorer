export const dynamic = "force-dynamic";

import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchJsonSafe } from '@/lib/api-client';
import type { ApiValidatorsList } from '@/lib/api-types';
import { formatNumber, formatTimestampMs, shortenHash } from '@/lib/format';
import SectionHeader from '@/components/SectionHeader';
import StatsCard from '@/components/StatsCard';
import Table from '@/components/Table';
import TranslatedText from '@/components/TranslatedText';
import AddressTag from '@/components/AddressTag';

export const metadata: Metadata = {
  title: 'Validators',
  description: 'Block producers and validator statistics on the QFC blockchain.',
  openGraph: {
    title: 'Validators | QFC Explorer',
    description: 'Block producers and validator statistics on the QFC blockchain.',
    type: 'website',
  },
};

const PAGE_SIZE = 25;

export default async function ValidatorsPage({
  searchParams,
}: {
  searchParams: { page?: string; sort?: string };
}) {
  const page = Math.max(1, Number(searchParams.page ?? '1'));
  const sort = searchParams.sort === 'last_active' ? 'last_active' : 'blocks_produced';

  const response = await fetchJsonSafe<ApiValidatorsList>(
    `/api/validators?page=${page}&limit=${PAGE_SIZE}&sort=${sort}`,
    { next: { revalidate: 30 } }
  );

  const validators = response?.data.items ?? [];
  const totalValidators = response?.data.total_validators ?? 0;
  const totalBlocks = response?.data.total_blocks ?? 0;

  // Find most active validator
  const mostActive = validators.length > 0 ? validators[0] : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6">
      <SectionHeader
        title={<TranslatedText tKey="validators.title" />}
        description={<TranslatedText tKey="validators.description" />}
      />

      {/* Summary cards */}
      <section className="grid gap-4 sm:grid-cols-3">
        <StatsCard
          label={<TranslatedText tKey="validators.totalValidators" />}
          value={formatNumber(totalValidators)}
        />
        <StatsCard
          label={<TranslatedText tKey="validators.totalBlocks" />}
          value={formatNumber(totalBlocks)}
        />
        <StatsCard
          label={<TranslatedText tKey="validators.mostActive" />}
          value={mostActive ? (mostActive.label ?? shortenHash(mostActive.address)) : '—'}
          sub={mostActive ? `${formatNumber(mostActive.blocks_produced)} blocks` : undefined}
        />
      </section>

      {/* Sort controls */}
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <TranslatedText tKey="validators.sortBy" />
        <Link
          href={`/validators?page=1&sort=blocks_produced`}
          className={`rounded-full border px-3 py-1 text-xs transition-colors ${
            sort === 'blocks_produced'
              ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10'
              : 'border-slate-700 text-slate-400 hover:text-white'
          }`}
        >
          <TranslatedText tKey="validators.blocksProduced" />
        </Link>
        <Link
          href={`/validators?page=1&sort=last_active`}
          className={`rounded-full border px-3 py-1 text-xs transition-colors ${
            sort === 'last_active'
              ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10'
              : 'border-slate-700 text-slate-400 hover:text-white'
          }`}
        >
          <TranslatedText tKey="validators.lastActive" />
        </Link>
      </div>

      {/* Validators table */}
      <Table
        rows={validators as unknown as Record<string, unknown>[]}
        keyField="address"
        emptyMessage="No validators found."
        columns={[
          {
            key: 'rank',
            header: '#',
            render: (_row, index) => (
              <span className="text-slate-500">{(page - 1) * PAGE_SIZE + (index ?? 0) + 1}</span>
            ),
          },
          {
            key: 'address',
            header: 'Validator',
            render: (row) => (
              <Link href={`/validators/${row.address}`} className="inline-flex items-center gap-1.5">
                <AddressTag
                  address={row.address as string}
                  label={(row.label as string | null) ?? undefined}
                />
              </Link>
            ),
          },
          {
            key: 'blocks_produced',
            header: 'Blocks Produced',
            render: (row) => (
              <span className="font-mono text-slate-300">
                {formatNumber(row.blocks_produced as number)}
              </span>
            ),
          },
          {
            key: 'percentage',
            header: '% of Total',
            render: (row) => {
              const pct = totalBlocks > 0
                ? ((row.blocks_produced as number) / totalBlocks * 100).toFixed(2)
                : '0.00';
              return (
                <div className="flex items-center gap-2">
                  <span className="text-slate-300 text-xs w-12 text-right">{pct}%</span>
                  <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 rounded-full"
                      style={{ width: `${Math.min(100, Number(pct))}%` }}
                    />
                  </div>
                </div>
              );
            },
          },
          {
            key: 'last_active',
            header: 'Last Active',
            render: (row) => (
              <span className="text-slate-400 text-xs">
                {row.last_active_ms ? formatTimestampMs(row.last_active_ms as string) : '—'}
              </span>
            ),
          },
          {
            key: 'status',
            header: 'Status',
            render: (row) => {
              const lastActiveMs = Number(row.last_active_ms ?? 0);
              const now = Date.now();
              const isActive = lastActiveMs > 0 && (now - lastActiveMs) < 3600000; // 1 hour
              return (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    isActive
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-slate-500/20 text-slate-400'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-400' : 'bg-slate-500'}`} />
                  {isActive ? 'Active' : 'Inactive'}
                </span>
              );
            },
          },
        ]}
      />

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-slate-400">
        <Link
          href={`/validators?page=${Math.max(1, page - 1)}&sort=${sort}`}
          className={`rounded-full border border-slate-700 px-4 py-2 transition-colors hover:text-white ${
            page <= 1 ? 'pointer-events-none opacity-40' : ''
          }`}
        >
          <TranslatedText tKey="common.previous" />
        </Link>
        <span>
          <TranslatedText tKey="common.page" /> {page}
        </span>
        <Link
          href={`/validators?page=${page + 1}&sort=${sort}`}
          className={`rounded-full border border-slate-700 px-4 py-2 transition-colors hover:text-white ${
            validators.length < PAGE_SIZE ? 'pointer-events-none opacity-40' : ''
          }`}
        >
          <TranslatedText tKey="common.next" />
        </Link>
      </div>
    </main>
  );
}
