import Link from 'next/link';
import SectionHeader from '@/components/SectionHeader';
import Table from '@/components/Table';
import { fetchJsonSafe } from '@/lib/api-client';
import type { ApiTokensList } from '@/lib/api-types';

const PAGE_SIZE = 25;

export default async function TokensPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const page = Math.max(1, Number(searchParams.page ?? '1'));

  const response = await fetchJsonSafe<ApiTokensList>(
    `/api/tokens?page=${page}&limit=${PAGE_SIZE}`,
    { next: { revalidate: 20 } }
  );

  const tokens = response?.data.items ?? [];

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-12">
      <SectionHeader title="ERC-20 Tokens" description={`Showing page ${page}`} />

      <Table
        rows={tokens}
        emptyMessage="No tokens indexed yet."
        columns={[
          {
            key: 'symbol',
            header: 'Symbol',
            render: (row) => row.symbol ?? '—',
          },
          {
            key: 'name',
            header: 'Name',
            render: (row) => row.name ?? '—',
          },
          {
            key: 'address',
            header: 'Address',
            render: (row) => (
              <Link href={`/token/${row.address}`} className="text-slate-200">
                {row.address}
              </Link>
            ),
          },
          {
            key: 'last_seen',
            header: 'Last Seen',
            render: (row) => row.last_seen_block ?? '—',
          },
        ]}
      />

      <div className="flex items-center justify-between text-sm text-slate-400">
        <Link
          href={`/tokens?page=${Math.max(1, page - 1)}`}
          className="rounded-full border border-slate-800 px-4 py-2"
        >
          Previous
        </Link>
        <span>Page {page}</span>
        <Link
          href={`/tokens?page=${page + 1}`}
          className="rounded-full border border-slate-800 px-4 py-2"
        >
          Next
        </Link>
      </div>
    </main>
  );
}
