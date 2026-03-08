'use client';

import { useMemo } from 'react';
import CsvExport from '@/components/CsvExport';

type VerifiedContract = {
  address: string;
  compiler_version: string | null;
  verified_at: string | null;
  token_name: string | null;
  token_symbol: string | null;
  interaction_count: number;
};

type Props = {
  contracts: VerifiedContract[];
};

export default function ContractsCsvExport({ contracts }: Props) {
  const csvData = useMemo(() =>
    contracts.map((c, i) => ({
      rank: String(i + 1),
      address: c.address,
      name: c.token_name ?? c.token_symbol ?? '',
      compiler: c.compiler_version ?? '',
      interactions: String(c.interaction_count),
      verified_at: c.verified_at ?? '',
    })),
    [contracts]
  );

  const csvColumns = useMemo(() => [
    { key: 'rank', label: '#' },
    { key: 'address', label: 'Address' },
    { key: 'name', label: 'Name' },
    { key: 'compiler', label: 'Compiler' },
    { key: 'interactions', label: 'Interactions' },
    { key: 'verified_at', label: 'Verified Date' },
  ], []);

  return <CsvExport data={csvData} filename="qfc_verified_contracts" columns={csvColumns} />;
}
