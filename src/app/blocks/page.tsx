export const dynamic = "force-dynamic";

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blocks',
  description: 'Browse all blocks on the QFC blockchain.',
  openGraph: {
    title: 'Blocks | QFC Explorer',
    description: 'Browse all blocks on the QFC blockchain.',
    type: 'website',
  },
};

import Link from 'next/link';
import { fetchJsonSafe } from '@/lib/api-client';
import type { ApiBlocksList } from '@/lib/api-types';
import SectionHeader from '@/components/SectionHeader';
import AutoRefresh from '@/components/AutoRefresh';
import TranslatedText from '@/components/TranslatedText';
import BlocksPageClient from '@/components/BlocksPageClient';

const PAGE_SIZE = 25;

export default async function BlocksPage({
  searchParams,
}: {
  searchParams: { page?: string; cursor?: string };
}) {
  const cursor = searchParams.cursor ?? null;
  const page = Math.max(1, Number(searchParams.page ?? '1'));

  // Use cursor-based fetch when cursor is present, otherwise fall back to page-based
  const apiQuery = cursor
    ? `/api/blocks?cursor=${encodeURIComponent(cursor)}&limit=${PAGE_SIZE}`
    : `/api/blocks?page=${page}&limit=${PAGE_SIZE}`;

  const response = await fetchJsonSafe<ApiBlocksList>(apiQuery, {
    next: { revalidate: 10 },
  });
  const blocks = response?.data.items ?? [];
  const nextCursor = response?.data.next_cursor ?? null;

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-12">
      <AutoRefresh intervalMs={20000} />
      <SectionHeader
        title={<TranslatedText tKey="blocks.title" />}
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

      <BlocksPageClient
        blocks={blocks}
        page={page}
        cursor={cursor}
        nextCursor={nextCursor}
        pageSize={PAGE_SIZE}
      />
    </main>
  );
}
