export const dynamic = "force-dynamic";

import Link from 'next/link';
import { fetchJsonSafe } from '@/lib/api-client';
import { shortenHash, formatWeiToQfc, formatNumber } from '@/lib/format';

type LeaderboardData = {
  ok: boolean;
  data: {
    topBalances: Array<{ address: string; balance: string; nonce: string; last_seen_block: string }>;
    mostActive: Array<{ address: string; sent: string; received: string; total: string; balance: string }>;
    topValidators: Array<{ address: string; blocks_produced: number; first_block: string; last_block: string }>;
    topContracts: Array<{ address: string; is_verified: boolean; token_name: string | null; tx_count: string }>;
  };
};

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const tab = searchParams.tab ?? 'balances';
  const response = await fetchJsonSafe<LeaderboardData>(
    '/api/leaderboard',
    { next: { revalidate: 60 } }
  );

  const data = response?.data ?? {
    topBalances: [],
    mostActive: [],
    topValidators: [],
    topContracts: [],
  };

  const tabs = [
    { key: 'balances', label: 'Top Balances', count: data.topBalances.length },
    { key: 'active', label: 'Most Active', count: data.mostActive.length },
    { key: 'validators', label: 'Top Validators', count: data.topValidators.length },
    { key: 'contracts', label: 'Top Contracts', count: data.topContracts.length },
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div>
        <h1 className="text-lg font-semibold text-white">Leaderboard</h1>
        <p className="mt-1 text-sm text-slate-400">Top accounts, validators, and contracts on QFC network</p>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-0 border-b border-slate-800">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/leaderboard?tab=${t.key}`}
            className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.key
                ? 'border-cyan-400 text-white'
                : 'border-transparent text-slate-400 hover:text-white hover:border-slate-600'
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className="ml-1.5 rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">{t.count}</span>
            )}
          </Link>
        ))}
      </div>

      <div className="mt-4">
        {tab === 'balances' && <BalancesTable rows={data.topBalances} />}
        {tab === 'active' && <ActiveTable rows={data.mostActive} />}
        {tab === 'validators' && <ValidatorsTable rows={data.topValidators} />}
        {tab === 'contracts' && <ContractsTable rows={data.topContracts} />}
      </div>
    </main>
  );
}

function BalancesTable({ rows }: { rows: LeaderboardData['data']['topBalances'] }) {
  // Find max balance for bar width
  const maxBalance = rows.length > 0 ? BigInt(rows[0].balance || '0') : 1n;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-800/60 text-left text-xs uppercase tracking-wider text-slate-500">
            <th className="px-4 py-3">Rank</th>
            <th className="px-4 py-3">Address</th>
            <th className="px-4 py-3 text-right">Balance (QFC)</th>
            <th className="px-4 py-3">Distribution</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/40">
          {rows.length === 0 ? (
            <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">No data available.</td></tr>
          ) : rows.map((r, i) => {
            const pct = maxBalance > 0n ? Number((BigInt(r.balance) * 100n) / maxBalance) : 0;
            return (
              <tr key={r.address} className="hover:bg-slate-900/40">
                <td className="px-4 py-2.5 text-slate-500">{i + 1}</td>
                <td className="px-4 py-2.5">
                  <Link href={`/address/${r.address}`} className="font-mono text-xs text-cyan-400 hover:text-cyan-300">
                    {shortenHash(r.address, 8, 6)}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-right text-slate-300">{formatWeiToQfc(r.balance)}</td>
                <td className="px-4 py-2.5">
                  <div className="h-2 w-32 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-cyan-400/60" style={{ width: `${Math.min(100, pct)}%` }} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ActiveTable({ rows }: { rows: LeaderboardData['data']['mostActive'] }) {
  const maxTx = rows.length > 0 ? Number(rows[0].total) : 1;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-800/60 text-left text-xs uppercase tracking-wider text-slate-500">
            <th className="px-4 py-3">Rank</th>
            <th className="px-4 py-3">Address</th>
            <th className="px-4 py-3 text-right">Sent</th>
            <th className="px-4 py-3 text-right">Received</th>
            <th className="px-4 py-3 text-right">Total Txs</th>
            <th className="px-4 py-3">Activity</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/40">
          {rows.length === 0 ? (
            <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No data available.</td></tr>
          ) : rows.map((r, i) => {
            const pct = maxTx > 0 ? (Number(r.total) / maxTx) * 100 : 0;
            return (
              <tr key={r.address} className="hover:bg-slate-900/40">
                <td className="px-4 py-2.5 text-slate-500">{i + 1}</td>
                <td className="px-4 py-2.5">
                  <Link href={`/address/${r.address}`} className="font-mono text-xs text-cyan-400 hover:text-cyan-300">
                    {shortenHash(r.address, 8, 6)}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-right text-slate-300">{formatNumber(r.sent)}</td>
                <td className="px-4 py-2.5 text-right text-slate-300">{formatNumber(r.received)}</td>
                <td className="px-4 py-2.5 text-right font-medium text-white">{formatNumber(r.total)}</td>
                <td className="px-4 py-2.5">
                  <div className="h-2 w-32 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-400/60" style={{ width: `${Math.min(100, pct)}%` }} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ValidatorsTable({ rows }: { rows: LeaderboardData['data']['topValidators'] }) {
  const maxBlocks = rows.length > 0 ? rows[0].blocks_produced : 1;
  const totalBlocks = rows.reduce((sum, r) => sum + r.blocks_produced, 0);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-800/60 text-left text-xs uppercase tracking-wider text-slate-500">
            <th className="px-4 py-3">Rank</th>
            <th className="px-4 py-3">Validator</th>
            <th className="px-4 py-3 text-right">Blocks Produced</th>
            <th className="px-4 py-3 text-right">Share</th>
            <th className="px-4 py-3">Block Range</th>
            <th className="px-4 py-3">Distribution</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/40">
          {rows.length === 0 ? (
            <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No data available.</td></tr>
          ) : rows.map((r, i) => {
            const pct = maxBlocks > 0 ? (r.blocks_produced / maxBlocks) * 100 : 0;
            const sharePct = totalBlocks > 0 ? ((r.blocks_produced / totalBlocks) * 100).toFixed(1) : '0';
            return (
              <tr key={r.address} className="hover:bg-slate-900/40">
                <td className="px-4 py-2.5 text-slate-500">{i + 1}</td>
                <td className="px-4 py-2.5">
                  <Link href={`/address/${r.address}`} className="font-mono text-xs text-cyan-400 hover:text-cyan-300">
                    {shortenHash(r.address, 8, 6)}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-right font-medium text-white">{formatNumber(r.blocks_produced)}</td>
                <td className="px-4 py-2.5 text-right text-slate-300">{sharePct}%</td>
                <td className="px-4 py-2.5 text-xs text-slate-400">
                  <Link href={`/blocks/${r.first_block}`} className="hover:text-white">{r.first_block}</Link>
                  {' — '}
                  <Link href={`/blocks/${r.last_block}`} className="hover:text-white">{r.last_block}</Link>
                </td>
                <td className="px-4 py-2.5">
                  <div className="h-2 w-32 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-amber-400/60" style={{ width: `${Math.min(100, pct)}%` }} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ContractsTable({ rows }: { rows: LeaderboardData['data']['topContracts'] }) {
  const maxTx = rows.length > 0 ? Number(rows[0].tx_count) : 1;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-800/60 text-left text-xs uppercase tracking-wider text-slate-500">
            <th className="px-4 py-3">Rank</th>
            <th className="px-4 py-3">Contract</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Interactions</th>
            <th className="px-4 py-3">Activity</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/40">
          {rows.length === 0 ? (
            <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No contracts found.</td></tr>
          ) : rows.map((r, i) => {
            const pct = maxTx > 0 ? (Number(r.tx_count) / maxTx) * 100 : 0;
            return (
              <tr key={r.address} className="hover:bg-slate-900/40">
                <td className="px-4 py-2.5 text-slate-500">{i + 1}</td>
                <td className="px-4 py-2.5">
                  <Link href={`/contract/${r.address}`} className="font-mono text-xs text-cyan-400 hover:text-cyan-300">
                    {shortenHash(r.address, 8, 6)}
                  </Link>
                  {r.token_name && (
                    <span className="ml-2 text-xs text-slate-400">{r.token_name}</span>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  {r.is_verified ? (
                    <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">Verified</span>
                  ) : (
                    <span className="rounded bg-slate-700/50 px-2 py-0.5 text-xs text-slate-400">Unverified</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-right font-medium text-white">{formatNumber(r.tx_count)}</td>
                <td className="px-4 py-2.5">
                  <div className="h-2 w-32 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-purple-400/60" style={{ width: `${Math.min(100, pct)}%` }} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
