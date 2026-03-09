'use client';

import Link from 'next/link';
import { shortenHash } from '@/lib/format';

type Validator = {
  address: string;
  stake?: string;
  contribution_score?: string;
  uptime?: string;
  is_active?: boolean;
};

type ValidatorStat = {
  address: string;
  blocks_produced: number;
  contribution_score: string;
  uptime: string;
};

type Props = {
  validators: Validator[];
  stats?: ValidatorStat[];
};

export default function ValidatorTable({ validators, stats = [] }: Props) {
  // Merge validator data with stats
  const mergedData = validators.map((v) => {
    const stat = stats.find((s) => s.address.toLowerCase() === v.address.toLowerCase());
    return {
      ...v,
      blocks_produced: stat?.blocks_produced ?? 0,
    };
  });

  if (mergedData.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 p-8 text-center text-slate-500">
        No validator data available
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
            <th className="px-4 py-3 font-medium">Validator</th>
            <th className="px-4 py-3 font-medium text-right">Blocks Produced</th>
            <th className="px-4 py-3 font-medium text-right">Contribution Score</th>
            <th className="px-4 py-3 font-medium text-right">Uptime</th>
            <th className="px-4 py-3 font-medium text-center">Status</th>
          </tr>
        </thead>
        <tbody>
          {mergedData.map((v, i) => (
            <tr
              key={v.address}
              className="border-b border-slate-200 dark:border-slate-800/50 last:border-0 hover:bg-slate-100 dark:hover:bg-slate-800/30 transition-colors"
            >
              <td className="px-4 py-3">
                <Link
                  href={`/address/${v.address}`}
                  className="font-mono text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  {shortenHash(v.address)}
                </Link>
              </td>
              <td className="px-4 py-3 text-right font-mono text-slate-600 dark:text-slate-300">
                {v.blocks_produced.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right">
                <ScoreBar value={parseScore(v.contribution_score)} />
              </td>
              <td className="px-4 py-3 text-right">
                <UptimeBar value={parseUptime(v.uptime)} />
              </td>
              <td className="px-4 py-3 text-center">
                <StatusBadge active={v.is_active !== false} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ScoreBar({ value }: { value: number }) {
  const percentage = Math.min(100, Math.max(0, value));
  const color = percentage >= 70 ? 'bg-green-500' : percentage >= 40 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="flex items-center gap-2 justify-end">
      <span className="text-slate-600 dark:text-slate-300 text-xs w-10 text-right">{percentage.toFixed(1)}%</span>
      <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function UptimeBar({ value }: { value: number }) {
  const percentage = Math.min(100, Math.max(0, value));
  const color = percentage >= 99 ? 'bg-green-500' : percentage >= 95 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="flex items-center gap-2 justify-end">
      <span className="text-slate-600 dark:text-slate-300 text-xs w-12 text-right">{percentage.toFixed(2)}%</span>
      <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
        active
          ? 'bg-green-500/20 text-green-400'
          : 'bg-red-500/20 text-red-400'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-green-400' : 'bg-red-400'}`} />
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

function parseScore(score?: string): number {
  if (!score) return 0;
  const hex = score.startsWith('0x') ? score : `0x${score}`;
  // Score is typically 0-10000 representing 0-100%
  return Number(BigInt(hex)) / 100;
}

function parseUptime(uptime?: string): number {
  if (!uptime) return 0;
  const hex = uptime.startsWith('0x') ? uptime : `0x${uptime}`;
  // Uptime is typically 0-10000 representing 0-100%
  return Number(BigInt(hex)) / 100;
}
