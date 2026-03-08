export const dynamic = "force-dynamic";

import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchJsonSafe } from '@/lib/api-client';
import type { ApiTransactionDetail } from '@/lib/api-types';
import { formatNumber, formatTimestampMs, formatWeiToQfc, shortenHash } from '@/lib/format';
import CopyButton from '@/components/CopyButton';
import StatusBadge from '@/components/StatusBadge';
import TransactionFlowSection from '@/components/TransactionFlowSection';
import TransactionLabel from '@/components/TransactionLabel';
import { decodeInput, formatParam, decodeEventTopic } from '@/lib/decode-input';
import { resolveAddressLabels } from '@/lib/labels';

export async function generateMetadata({ params }: { params: { hash: string } }): Promise<Metadata> {
  const short = shortenHash(params.hash);
  return {
    title: `Transaction ${short}`,
    description: `Transaction ${short} on the QFC blockchain — status, value, gas, and event logs.`,
    openGraph: {
      title: `Transaction ${short} | QFC Explorer`,
      description: `Transaction ${short} on the QFC blockchain.`,
      type: 'article',
    },
  };
}

export default async function TransactionDetailPage({
  params,
}: {
  params: { hash: string };
}) {
  const hash = params.hash;
  const response = await fetchJsonSafe<ApiTransactionDetail>(
    `/api/txs/${hash}`,
    { next: { revalidate: 10 } }
  );

  const tx = response?.data.transaction ?? null;
  const logs = response?.data.logs ?? [];
  const fromRpc = response?.data.source === 'rpc';
  const defiLabel = response?.data.defi_label ?? null;

  if (!tx) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-12">
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center">
          <p className="text-lg text-white">Transaction not found</p>
          <p className="mt-2 text-sm text-slate-400 font-mono break-all">{hash}</p>
          <Link href="/txs" className="mt-4 inline-block rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700">
            Back to transactions
          </Link>
        </div>
      </main>
    );
  }

  // Resolve address labels
  const addrList = [tx.from_address, tx.to_address].filter(Boolean) as string[];
  const labels = await resolveAddressLabels(addrList);

  const decoded = decodeInput(tx.data);
  const gasLimit = Number(tx.gas_limit);
  const gasUsed = tx.gas_used ? Number(tx.gas_used) : null;
  const gasPercent = gasUsed && gasLimit > 0 ? Math.min(100, (gasUsed / gasLimit) * 100) : null;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-lg font-semibold text-white">Transaction Details</h1>
        <StatusBadge status={tx.status} />
        {defiLabel && <TransactionLabel label={defiLabel} />}
      </div>

      {fromRpc && (
        <div className="mt-4 rounded-lg border border-amber-700/40 bg-amber-900/20 px-4 py-2.5 text-sm text-amber-200">
          Fetched live from the node — not yet indexed.
        </div>
      )}

      {/* Transaction Status Timeline */}
      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/40 px-5 py-4">
        <div className="flex items-center gap-0">
          <TimelineStep
            label="Created"
            active={true}
            completed={true}
          />
          <TimelineConnector completed={!fromRpc} />
          <TimelineStep
            label="Confirmed"
            active={!fromRpc}
            completed={!fromRpc && tx.status === '0x1'}
            failed={!fromRpc && tx.status !== '0x1'}
          />
          <TimelineConnector completed={!fromRpc && tx.status === '0x1'} />
          <TimelineStep
            label="Finalized"
            active={!fromRpc && tx.status === '0x1'}
            completed={!fromRpc && tx.status === '0x1'}
          />
        </div>
      </div>

      {/* Overview table */}
      <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/40 divide-y divide-slate-800/40">
        <Row label="Transaction Hash">
          <span className="font-mono text-sm text-white break-all">{tx.hash}</span>
          <CopyButton value={tx.hash} label="Copy" />
        </Row>
        <Row label="Block">
          <Link href={`/blocks/${tx.block_height}`} className="text-cyan-400 hover:text-cyan-300">
            {formatNumber(tx.block_height)}
          </Link>
        </Row>
        {tx.timestamp_ms && (
          <Row label="Timestamp">
            <span className="text-slate-300">{formatTimestampMs(tx.timestamp_ms)}</span>
          </Row>
        )}
        <Row label="From">
          <Link href={`/address/${tx.from_address}`} className="font-mono text-sm text-cyan-400 hover:text-cyan-300">
            {tx.from_address}
          </Link>
          {labels[tx.from_address.toLowerCase()]?.label && (
            <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-medium text-cyan-400">
              {labels[tx.from_address.toLowerCase()].label}
            </span>
          )}
          <CopyButton value={tx.from_address} label="Copy" />
        </Row>
        <Row label="To">
          {tx.to_address ? (
            <>
              <Link href={`/address/${tx.to_address}`} className="font-mono text-sm text-cyan-400 hover:text-cyan-300">
                {tx.to_address}
              </Link>
              {labels[tx.to_address.toLowerCase()]?.label && (
                <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-medium text-cyan-400">
                  {labels[tx.to_address.toLowerCase()].label}
                </span>
              )}
              <CopyButton value={tx.to_address} label="Copy" />
            </>
          ) : (
            <span className="text-emerald-400 text-sm">Contract Creation</span>
          )}
        </Row>
        <Row label="Value">
          <span className="text-white font-medium">{formatWeiToQfc(tx.value)} QFC</span>
        </Row>
        {tx.type && (
          <Row label="Tx Type">
            <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300 font-mono">{tx.type}</span>
          </Row>
        )}
        <Row label="Nonce">
          <span className="text-slate-300">{formatNumber(tx.nonce)}</span>
        </Row>

        {/* Gas section */}
        <Row label="Gas Limit">
          <span className="text-slate-300">{formatNumber(tx.gas_limit)}</span>
        </Row>
        {gasUsed != null && (
          <Row label="Gas Used">
            <div className="flex items-center gap-3">
              <span className="text-slate-300">{formatNumber(gasUsed)}</span>
              {gasPercent != null && (
                <div className="flex items-center gap-2">
                  <div className="h-2 w-32 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        gasPercent > 90 ? 'bg-red-400' : gasPercent > 70 ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${gasPercent}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500">{gasPercent.toFixed(1)}%</span>
                </div>
              )}
            </div>
          </Row>
        )}
        <Row label="Gas Price">
          <span className="text-slate-300">{formatWeiToQfc(tx.gas_price)} QFC</span>
        </Row>
      </div>

      {/* Input Data */}
      <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/40">
        <div className="flex items-center justify-between border-b border-slate-800/40 px-5 py-3">
          <h2 className="text-sm font-semibold text-white">Input Data</h2>
          {tx.data && <CopyButton value={tx.data} label="Copy" />}
        </div>
        <div className="p-5">
          {!tx.data || tx.data === '0x' ? (
            <p className="text-sm text-slate-500">No input data (simple transfer)</p>
          ) : decoded ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="rounded bg-cyan-500/10 px-2.5 py-1 text-sm font-medium text-cyan-400">
                  {decoded.functionName}
                </span>
                <span className="font-mono text-xs text-slate-500">0x{decoded.selector}</span>
              </div>
              {decoded.params.length > 0 && (
                <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                      <th className="py-1.5 pr-4">#</th>
                      <th className="py-1.5 pr-4">Name</th>
                      <th className="py-1.5">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/30">
                    {decoded.params.map((param, i) => {
                      const raw = decoded.rawParams[i] ?? '';
                      const formatted = formatParam(param, raw);
                      const isAddr = param.startsWith('address');
                      return (
                        <tr key={i}>
                          <td className="py-2 pr-4 text-slate-500">{i}</td>
                          <td className="py-2 pr-4 text-slate-400">{param}</td>
                          <td className="py-2 font-mono text-xs">
                            {isAddr ? (
                              <Link href={`/address/${formatted}`} className="text-cyan-400 hover:text-cyan-300">
                                {formatted}
                              </Link>
                            ) : (
                              <span className="text-slate-300">{formatted}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>
              )}
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-slate-500 hover:text-slate-400">
                  Raw hex data
                </summary>
                <p className="mt-2 break-all font-mono text-xs text-slate-400">{tx.data}</p>
              </details>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-slate-500">
                Function selector: <span className="font-mono text-slate-400">{tx.data.slice(0, 10)}</span>
                <span className="ml-2 text-slate-600">(not decoded)</span>
              </p>
              <p className="break-all font-mono text-xs text-slate-400">{tx.data}</p>
            </div>
          )}
        </div>
      </div>

      {/* Event Logs */}
      <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/40">
        <div className="border-b border-slate-800/40 px-5 py-3">
          <h2 className="text-sm font-semibold text-white">
            Event Logs
            {logs.length > 0 && (
              <span className="ml-2 rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                {logs.length}
              </span>
            )}
          </h2>
        </div>
        <div className="p-5">
          {logs.length === 0 ? (
            <p className="text-sm text-slate-500">No event logs.</p>
          ) : (
            <div className="space-y-4">
              {logs.map((log, index) => {
                const eventName = decodeEventTopic(log.topic0);
                return (
                  <div key={`${log.contract_address}-${index}`} className="rounded-lg border border-slate-800/60 p-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-[10px] font-medium text-slate-400">
                        {index}
                      </span>
                      <Link href={`/address/${log.contract_address}`} className="font-mono text-xs text-cyan-400 hover:text-cyan-300">
                        {shortenHash(log.contract_address)}
                      </Link>
                      {eventName && (
                        <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">
                          {eventName}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 space-y-1">
                      {[log.topic0, log.topic1, log.topic2, log.topic3]
                        .filter(Boolean)
                        .map((topic, ti) => (
                          <div key={ti} className="flex items-start gap-2">
                            <span className="shrink-0 text-[10px] text-slate-600 pt-0.5">
                              [{ti}]
                            </span>
                            <p className="break-all font-mono text-xs text-slate-400">
                              {topic}
                            </p>
                          </div>
                        ))}
                    </div>
                    {log.data && (
                      <div className="mt-2">
                        <p className="text-[10px] text-slate-600">data:</p>
                        <p className="break-all font-mono text-xs text-slate-400">{log.data}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Transaction Flow (Sankey diagram) */}
      <TransactionFlowSection hash={hash} />
    </main>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 px-5 py-3.5 sm:flex-row sm:items-center sm:gap-4">
      <span className="shrink-0 text-xs uppercase tracking-wider text-slate-500 sm:w-36">{label}</span>
      <div className="flex flex-wrap items-center gap-2 min-w-0">{children}</div>
    </div>
  );
}

function TimelineStep({ label, active, completed, failed }: { label: string; active: boolean; completed: boolean; failed?: boolean }) {
  const dotColor = failed
    ? 'bg-red-400 border-red-400/30'
    : completed
    ? 'bg-emerald-400 border-emerald-400/30'
    : active
    ? 'bg-cyan-400 border-cyan-400/30'
    : 'bg-slate-700 border-slate-700';
  const textColor = failed
    ? 'text-red-400'
    : completed
    ? 'text-emerald-400'
    : active
    ? 'text-cyan-400'
    : 'text-slate-600';

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={`h-3 w-3 rounded-full border-2 ${dotColor}`} />
      <span className={`text-[10px] font-medium uppercase tracking-wider ${textColor}`}>{label}</span>
    </div>
  );
}

function TimelineConnector({ completed }: { completed: boolean }) {
  return (
    <div className={`mx-1 h-0.5 flex-1 rounded-full ${completed ? 'bg-emerald-400/40' : 'bg-slate-700'}`} />
  );
}
