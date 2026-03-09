'use client';

import { useMemo } from 'react';
import CsvExport from '@/components/CsvExport';

type Holder = {
  address: string;
  balance: string;
};

type Props = {
  holders: Holder[];
  tokenDecimals: number | null;
  tokenSymbol: string | null;
};

function formatTokenValue(value: string, decimals: number | null): string {
  if (!value) return '0';
  try {
    const val = BigInt(value);
    const dec = decimals ?? 18;
    const base = 10n ** BigInt(dec);
    const whole = val / base;
    const frac = val % base;
    const wholeStr = whole.toLocaleString('en-US');
    if (frac === 0n) return wholeStr;
    const fracStr = frac.toString().padStart(dec, '0').slice(0, 4).replace(/0+$/, '');
    return `${wholeStr}.${fracStr}`;
  } catch {
    return value;
  }
}

export default function TokenHoldersCsvExport({ holders, tokenDecimals, tokenSymbol }: Props) {
  const totalBalance = useMemo(() =>
    holders.reduce((sum, h) => {
      try { return sum + BigInt(h.balance); } catch { return sum; }
    }, 0n),
    [holders]
  );

  const csvData = useMemo(() =>
    holders.map((h, i) => {
      let pct = '—';
      try {
        const val = BigInt(h.balance);
        if (totalBalance > 0n) {
          pct = `${(Number((val * 10000n) / totalBalance) / 100).toFixed(2)}%`;
        }
      } catch { /* ignore */ }
      return {
        rank: String(i + 1),
        address: h.address,
        balance: `${formatTokenValue(h.balance, tokenDecimals)} ${tokenSymbol ?? ''}`.trim(),
        percentage: pct,
      };
    }),
    [holders, tokenDecimals, tokenSymbol, totalBalance]
  );

  const csvColumns = useMemo(() => [
    { key: 'rank', label: 'Rank' },
    { key: 'address', label: 'Address' },
    { key: 'balance', label: 'Balance' },
    { key: 'percentage', label: 'Percentage' },
  ], []);

  return <CsvExport data={csvData} filename="qfc_token_holders" columns={csvColumns} />;
}
