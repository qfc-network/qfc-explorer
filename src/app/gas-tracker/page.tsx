export const dynamic = "force-dynamic";

export const metadata = { title: 'Gas Tracker', description: 'Real-time gas prices and block gas usage on QFC' };

import Link from 'next/link';
import { fetchJsonSafe } from '@/lib/api-client';
import { formatNumber, shortenHash } from '@/lib/format';
import SectionHeader from '@/components/SectionHeader';
import Table from '@/components/Table';
import AddressTag from '@/components/AddressTag';
import { resolveAddressLabels } from '@/lib/labels';
import type { ApiOk } from '@/lib/api-types';

type GasData = ApiOk<{
  prices: {
    low: string;
    median: string;
    average: string;
    high: string;
    sampleSize: number;
  };
  blocks: Array<{
    height: string;
    gasUsed: string;
    gasLimit: string;
    txCount: number;
    timestampMs: string;
  }>;
  topContracts: Array<{
    address: string;
    totalGas: string;
    txCount: number;
  }>;
}>;

function formatGwei(wei: string): string {
  const n = Number(wei);
  if (!Number.isFinite(n) || n === 0) return '0';
  const gwei = n / 1e9;
  if (gwei < 0.001) return '<0.001';
  if (gwei < 1) return gwei.toFixed(3);
  if (gwei < 100) return gwei.toFixed(2);
  return gwei.toFixed(0);
}

function formatFee(gasPriceWei: string, gasUnits: number): string {
  const price = Number(gasPriceWei);
  if (!Number.isFinite(price) || price === 0) return '0 QFC';
  const feeWei = price * gasUnits;
  const feeQfc = feeWei / 1e18;
  if (feeQfc < 0.000001) return '<0.000001 QFC';
  if (feeQfc < 0.001) return `${feeQfc.toFixed(6)} QFC`;
  if (feeQfc < 1) return `${feeQfc.toFixed(4)} QFC`;
  return `${feeQfc.toFixed(2)} QFC`;
}

function gasUtilization(used: string, limit: string): number {
  const u = Number(used);
  const l = Number(limit);
  if (!l) return 0;
  return Math.min(100, (u / l) * 100);
}

export default async function GasTrackerPage() {
  const response = await fetchJsonSafe<GasData>(
    '/api/analytics/gas',
    { next: { revalidate: 15 } }
  );

  const data = response?.data ?? null;
  const prices = data?.prices;
  const blocks = data?.blocks ?? [];
  const topContracts = data?.topContracts ?? [];

  const contractAddrs = topContracts.map((c) => c.address);
  const labels = await resolveAddressLabels(contractAddrs);

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-12">
      <SectionHeader
        title="Gas Tracker"
        description={prices ? `Based on ${prices.sampleSize} recent transactions` : 'Loading...'}
        action={
          <Link
            href="/analytics"
            className="rounded-full border border-slate-700 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-200"
          >
            Analytics
          </Link>
        }
      />

      {/* Gas Price Cards */}
      {prices && (
        <section className="grid gap-4 sm:grid-cols-4">
          <GasCard title="Low" gwei={formatGwei(prices.low)} color="green" sub="Minimum" />
          <GasCard title="Average" gwei={formatGwei(prices.average)} color="blue" sub="Mean" />
          <GasCard title="Median" gwei={formatGwei(prices.median)} color="yellow" sub="50th percentile" />
          <GasCard title="High" gwei={formatGwei(prices.high)} color="red" sub="Maximum" />
        </section>
      )}

      {/* Fee Estimates */}
      {prices && (
        <section className="space-y-4">
          <SectionHeader title="Estimated Transaction Fees" description="Based on current gas prices" />
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Operation</th>
                  <th className="px-4 py-3 text-right">Gas Units</th>
                  <th className="px-4 py-3 text-right">Low</th>
                  <th className="px-4 py-3 text-right">Average</th>
                  <th className="px-4 py-3 text-right">High</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {[
                  { op: 'QFC Transfer', gas: 21000 },
                  { op: 'ERC-20 Transfer', gas: 65000 },
                  { op: 'ERC-20 Approve', gas: 46000 },
                  { op: 'NFT Transfer', gas: 85000 },
                  { op: 'Swap (DEX)', gas: 150000 },
                  { op: 'Contract Deploy (small)', gas: 250000 },
                ].map(({ op, gas }) => (
                  <tr key={op} className="hover:bg-slate-900/60">
                    <td className="px-4 py-2.5 text-slate-300">{op}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-slate-400">{formatNumber(gas)}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-green-400">
                      {formatFee(prices.low, gas)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-blue-400">
                      {formatFee(prices.average, gas)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-red-400">
                      {formatFee(prices.high, gas)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Gas Usage per Block */}
      {blocks.length > 0 && (
        <section className="space-y-4">
          <SectionHeader title="Block Gas Usage" description="Gas utilization per recent block" />
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
            <div className="space-y-2">
              {blocks.slice(-20).map((block) => {
                const pct = gasUtilization(block.gasUsed, block.gasLimit);
                return (
                  <div key={block.height} className="flex items-center gap-3 text-sm">
                    <Link href={`/blocks/${block.height}`} className="w-20 shrink-0 text-cyan-400 hover:text-cyan-300 font-mono text-xs">
                      {formatNumber(block.height)}
                    </Link>
                    <div className="flex-1 h-4 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          pct > 90 ? 'bg-red-400' : pct > 70 ? 'bg-amber-400' : pct > 40 ? 'bg-cyan-400' : 'bg-emerald-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-14 shrink-0 text-right text-xs text-slate-400">{pct.toFixed(1)}%</span>
                    <span className="w-12 shrink-0 text-right text-xs text-slate-500">{block.txCount} tx</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Top Gas Consumers */}
      {topContracts.length > 0 && (
        <section className="space-y-4">
          <SectionHeader title="Top Gas Consumers" description="Contracts using the most gas in recent transactions" />
          <Table
            rows={topContracts}
            emptyMessage="No data"
            columns={[
              {
                key: 'rank',
                header: '#',
                render: (_, i) => <span className="text-slate-500">{(i ?? 0) + 1}</span>,
              },
              {
                key: 'address',
                header: 'Contract',
                render: (row) => (
                  <AddressTag address={row.address} label={labels[row.address.toLowerCase()]?.label} />
                ),
              },
              {
                key: 'gas',
                header: 'Total Gas Used',
                render: (row) => <span className="font-mono text-slate-300">{formatNumber(row.totalGas)}</span>,
              },
              {
                key: 'txs',
                header: 'Transactions',
                render: (row) => <span className="text-slate-300">{formatNumber(row.txCount)}</span>,
              },
            ]}
          />
        </section>
      )}
    </main>
  );
}

function GasCard({
  title,
  gwei,
  color,
  sub,
}: {
  title: string;
  gwei: string;
  color: 'green' | 'blue' | 'yellow' | 'red';
  sub: string;
}) {
  const colorClasses = {
    green: 'border-green-500/30 bg-green-500/10',
    blue: 'border-blue-500/30 bg-blue-500/10',
    yellow: 'border-yellow-500/30 bg-yellow-500/10',
    red: 'border-red-500/30 bg-red-500/10',
  };
  const textClasses = {
    green: 'text-green-400',
    blue: 'text-blue-400',
    yellow: 'text-yellow-400',
    red: 'text-red-400',
  };

  return (
    <div className={`rounded-xl border p-5 ${colorClasses[color]}`}>
      <p className={`text-xs uppercase tracking-wider ${textClasses[color]} opacity-70`}>{title}</p>
      <p className={`text-3xl font-semibold mt-2 ${textClasses[color]}`}>{gwei}</p>
      <p className="text-xs text-slate-500 mt-1">Gwei &middot; {sub}</p>
    </div>
  );
}
