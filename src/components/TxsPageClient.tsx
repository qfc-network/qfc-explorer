'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useTranslation } from '@/components/LocaleProvider';
import { formatWeiToQfc, shortenHash } from '@/lib/format';
import Table from '@/components/Table';
import StatusBadge from '@/components/StatusBadge';
import AddressTag from '@/components/AddressTag';
import TranslatedPagination from '@/components/TranslatedPagination';
import TransactionLabel from '@/components/TransactionLabel';
import CsvExport from '@/components/CsvExport';
import MethodIdBadge from '@/components/MethodIdBadge';
import type { DefiLabel } from '@/lib/api-types';

type Transaction = {
  hash: string;
  from_address: string;
  to_address: string | null;
  value: string;
  status: string;
  defi_label?: DefiLabel;
  method_id?: string;
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

  const csvData = useMemo(() =>
    transactions.map((tx) => ({
      hash: tx.hash,
      from: tx.from_address,
      to: tx.to_address ?? '',
      value: formatWeiToQfc(tx.value),
      status: tx.status,
    })),
    [transactions]
  );

  const csvColumns = useMemo(() => [
    { key: 'hash', label: t('common.hash') },
    { key: 'from', label: t('common.from') },
    { key: 'to', label: t('common.to') },
    { key: 'value', label: t('common.value') },
    { key: 'status', label: t('common.status') },
  ], [t]);

  return (
    <>
      <div className="mb-4 flex justify-end">
        <CsvExport data={csvData} filename="qfc_transactions" columns={csvColumns} />
      </div>
      <Table
        rows={transactions}
        keyField="hash"
        emptyMessage={t('txs.noTxs')}
        columns={[
          {
            key: 'hash',
            header: t('common.hash'),
            render: (row) => (
              <Link href={`/txs/${row.hash}`} className="text-slate-800 dark:text-slate-200">
                {shortenHash(row.hash)}
              </Link>
            ),
          },
          {
            key: 'method',
            header: 'Method',
            render: (row) => <MethodIdBadge selector={row.method_id} />,
          },
          {
            key: 'action',
            header: t('defi.action'),
            render: (row) =>
              row.defi_label ? (
                <TransactionLabel label={row.defi_label} />
              ) : (
                <span className="text-xs text-slate-600">-</span>
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
