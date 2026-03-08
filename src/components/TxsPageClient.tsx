'use client';

import Link from 'next/link';
import { useTranslation } from '@/components/LocaleProvider';
import { formatWeiToQfc, shortenHash } from '@/lib/format';
import Table from '@/components/Table';
import StatusBadge from '@/components/StatusBadge';
import AddressTag from '@/components/AddressTag';
import TranslatedPagination from '@/components/TranslatedPagination';

type Transaction = {
  hash: string;
  from_address: string;
  to_address: string | null;
  value: string;
  status: string;
};

type Props = {
  transactions: Transaction[];
  labels: Record<string, { label?: string }>;
  page: number;
  cursor: string | null;
  nextCursor: string | null;
  pageSize: number;
};

export default function TxsPageClient({ transactions, labels, page, cursor, nextCursor, pageSize }: Props) {
  const { t } = useTranslation();

  return (
    <>
      <Table
        rows={transactions}
        keyField="hash"
        emptyMessage={t('txs.noTxs')}
        columns={[
          {
            key: 'hash',
            header: t('common.hash'),
            render: (row) => (
              <Link href={`/txs/${row.hash}`} className="text-slate-200">
                {shortenHash(row.hash)}
              </Link>
            ),
          },
          {
            key: 'from',
            header: t('common.from'),
            render: (row) => (
              <AddressTag address={row.from_address} label={labels[row.from_address.toLowerCase()]?.label} />
            ),
          },
          {
            key: 'to',
            header: t('common.to'),
            render: (row) =>
              row.to_address ? (
                <AddressTag address={row.to_address} label={labels[row.to_address.toLowerCase()]?.label} />
              ) : (
                <span className="text-emerald-400 text-xs">{t('common.contractCreation')}</span>
              ),
          },
          {
            key: 'value',
            header: t('common.value'),
            render: (row) => `${formatWeiToQfc(row.value)} QFC`,
          },
          {
            key: 'status',
            header: t('common.status'),
            render: (row) => <StatusBadge status={row.status} />,
          },
        ]}
      />

      <TranslatedPagination
        basePath="/txs"
        page={page}
        hasPrevious={!!cursor || page > 1}
        hasNext={!!nextCursor || transactions.length === pageSize}
        prevHref={cursor ? '/txs' : page > 1 ? `/txs?page=${page - 1}` : undefined}
        nextHref={nextCursor
          ? `/txs?cursor=${encodeURIComponent(nextCursor)}`
          : transactions.length === pageSize
            ? `/txs?page=${page + 1}`
            : undefined
        }
        cursor={cursor}
      />
    </>
  );
}
