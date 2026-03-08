'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useTranslation } from '@/components/LocaleProvider';
import { formatNumber, formatTimestampMs, shortenHash } from '@/lib/format';
import Table from '@/components/Table';
import TranslatedPagination from '@/components/TranslatedPagination';
import CsvExport from '@/components/CsvExport';

type Block = {
  height: string;
  hash: string;
  producer: string | null;
  tx_count: string | number;
  timestamp_ms: string;
};

type Props = {
  blocks: Block[];
  page: number;
  cursor: string | null;
  nextCursor: string | null;
  pageSize: number;
};

export default function BlocksPageClient({ blocks, page, cursor, nextCursor, pageSize }: Props) {
  const { t } = useTranslation();

  const csvData = useMemo(() =>
    blocks.map((b) => ({
      height: b.height,
      hash: b.hash,
      producer: b.producer ?? '',
      tx_count: String(b.tx_count),
      timestamp: formatTimestampMs(b.timestamp_ms),
    })),
    [blocks]
  );

  const csvColumns = useMemo(() => [
    { key: 'height', label: t('common.height') },
    { key: 'hash', label: t('common.hash') },
    { key: 'producer', label: t('common.producer') },
    { key: 'tx_count', label: t('common.txs') },
    { key: 'timestamp', label: t('common.timestamp') },
  ], [t]);

  return (
    <>
      <div className="mb-4 flex justify-end">
        <CsvExport data={csvData} filename="qfc_blocks" columns={csvColumns} />
      </div>
      <Table
        rows={blocks}
        keyField="hash"
        emptyMessage={t('blocks.noBlocks')}
        columns={[
          {
            key: 'height',
            header: t('common.height'),
            render: (row) => (
              <Link href={`/blocks/${row.height}`} className="text-slate-200">
                {formatNumber(row.height)}
              </Link>
            ),
          },
          {
            key: 'hash',
            header: t('common.hash'),
            render: (row) => (
              <Link href={`/blocks/${row.height}`} className="text-slate-200">
                {shortenHash(row.hash)}
              </Link>
            ),
          },
          {
            key: 'producer',
            header: t('common.producer'),
            render: (row) =>
              row.producer ? (
                <Link href={`/address/${row.producer}`} className="text-slate-200">
                  {shortenHash(row.producer)}
                </Link>
              ) : (
                '—'
              ),
          },
          {
            key: 'tx_count',
            header: t('common.txs'),
            render: (row) => formatNumber(row.tx_count),
          },
          {
            key: 'timestamp',
            header: t('common.timestamp'),
            render: (row) => formatTimestampMs(row.timestamp_ms),
          },
        ]}
      />

      <TranslatedPagination
        basePath="/blocks"
        page={page}
        hasPrevious={!!cursor || page > 1}
        hasNext={!!nextCursor || blocks.length === pageSize}
        prevHref={cursor ? '/blocks' : page > 1 ? `/blocks?page=${page - 1}` : undefined}
        nextHref={nextCursor
          ? `/blocks?cursor=${encodeURIComponent(nextCursor)}`
          : blocks.length === pageSize
            ? `/blocks?page=${page + 1}`
            : undefined
        }
        cursor={cursor}
      />
    </>
  );
}
