'use client';

import Link from 'next/link';
import { shortenHash, formatWeiToQfc } from '@/lib/format';

type Block = {
  height: string;
  hash: string;
  producer: string | null;
  tx_count: string | number;
  timestamp_ms: string;
};

type Transaction = {
  hash: string;
  from_address: string;
  to_address: string | null;
  value: string;
  block_height: string;
  timestamp_ms?: string;
};

function timeAgo(timestampMs: string | number): string {
  const ms = typeof timestampMs === 'string' ? Number(timestampMs) : timestampMs;
  if (!Number.isFinite(ms) || ms === 0) return '';
  const sec = Math.floor((Date.now() - ms) / 1000);
  if (sec < 5) return 'just now';
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

function BlockIcon() {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-400">
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    </div>
  );
}

function TxIcon() {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-400">
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    </div>
  );
}

type LabelMap = Record<string, { label: string; category: string | null }>;

export default function LatestBlocksAndTxs({
  blocks,
  transactions,
  labels = {},
}: {
  blocks: Block[];
  transactions: Transaction[];
  labels?: LabelMap;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Latest Blocks */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40">
        <div className="flex items-center justify-between border-b border-slate-800/60 px-5 py-4">
          <h2 className="text-sm font-semibold text-white">Latest Blocks</h2>
          <Link
            href="/blocks"
            className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            View all
          </Link>
        </div>
        <div className="divide-y divide-slate-800/40">
          {blocks.map((block) => (
            <div key={block.height} className="flex items-center gap-3 px-5 py-3.5">
              <BlockIcon />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link href={`/blocks/${block.height}`} className="text-sm font-medium text-cyan-400 hover:text-cyan-300">
                    {block.height}
                  </Link>
                  <span className="text-xs text-slate-500">{timeAgo(block.timestamp_ms)}</span>
                </div>
                <p className="mt-0.5 text-xs text-slate-400">
                  {block.producer ? (
                    <>
                      Validated by{' '}
                      <Link href={`/address/${block.producer}`} className="text-slate-300 hover:text-white">
                        {shortenHash(block.producer)}
                      </Link>
                      {labels[block.producer.toLowerCase()]?.label && (
                        <span className="ml-1 rounded bg-cyan-500/10 px-1 py-0.5 text-[10px] text-cyan-400">
                          {labels[block.producer.toLowerCase()].label}
                        </span>
                      )}
                    </>
                  ) : (
                    'Unknown producer'
                  )}
                </p>
              </div>
              <div className="shrink-0 rounded-md bg-slate-800/60 px-2 py-1 text-xs text-slate-300">
                {block.tx_count} txn{Number(block.tx_count) !== 1 ? 's' : ''}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Latest Transactions */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40">
        <div className="flex items-center justify-between border-b border-slate-800/60 px-5 py-4">
          <h2 className="text-sm font-semibold text-white">Latest Transactions</h2>
          <Link
            href="/txs"
            className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            View all
          </Link>
        </div>
        <div className="divide-y divide-slate-800/40">
          {transactions.map((tx) => (
            <div key={tx.hash} className="flex items-center gap-3 px-5 py-3.5">
              <TxIcon />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link href={`/txs/${tx.hash}`} className="text-sm font-medium text-cyan-400 hover:text-cyan-300">
                    {shortenHash(tx.hash)}
                  </Link>
                  {tx.timestamp_ms && (
                    <span className="text-xs text-slate-500">{timeAgo(tx.timestamp_ms)}</span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-slate-400">
                  <Link href={`/address/${tx.from_address}`} className="text-slate-300 hover:text-white">
                    {labels[tx.from_address.toLowerCase()]?.label ?? shortenHash(tx.from_address)}
                  </Link>
                  <span className="mx-1 text-slate-600">→</span>
                  {tx.to_address ? (
                    <Link href={`/address/${tx.to_address}`} className="text-slate-300 hover:text-white">
                      {labels[tx.to_address.toLowerCase()]?.label ?? shortenHash(tx.to_address)}
                    </Link>
                  ) : (
                    <span className="text-emerald-400">Contract Creation</span>
                  )}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs font-medium text-slate-300">
                  {formatWeiToQfc(tx.value)}
                </p>
                <p className="text-[10px] text-slate-500">QFC</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
