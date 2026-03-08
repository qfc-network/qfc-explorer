'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getApiBaseUrl } from '@/lib/api-client';
import { shortenHash, formatWeiToQfc } from '@/lib/format';
import { decodeEventTopic, looksLikeWeiAmount } from '@/lib/decode-input';
import type { DecodedEventParam } from '@/lib/decode-input';

type EventLog = {
  contract_address: string;
  topic0: string | null;
  topic1: string | null;
  topic2: string | null;
  topic3: string | null;
  data: string | null;
};

type DecodedResult = {
  name: string;
  signature: string;
  params: DecodedEventParam[];
} | null;

type Props = {
  logs: EventLog[];
};

/**
 * Enhanced event log display that decodes event logs using the contract ABI
 * via the backend /contract/decode-log endpoint.
 */
export default function EventLogDecoder({ logs }: Props) {
  const [decodedMap, setDecodedMap] = useState<Record<number, DecodedResult>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (logs.length === 0) return;

    const base = getApiBaseUrl();
    setLoading(true);

    // Decode each log via the API
    const promises = logs.map(async (log, index): Promise<[number, DecodedResult]> => {
      if (!log.topic0) return [index, null];

      const topics = [log.topic0, log.topic1, log.topic2, log.topic3].filter(Boolean) as string[];
      const url = base
        ? `${base}/contract/decode-log`
        : '/api/contract/decode-log';

      try {
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: log.contract_address,
            topics,
            data: log.data || '0x',
          }),
        });
        if (!resp.ok) return [index, null];
        const json = await resp.json();
        return [index, json.data?.decoded ?? null];
      } catch {
        return [index, null];
      }
    });

    Promise.all(promises).then((results) => {
      const map: Record<number, DecodedResult> = {};
      for (const [idx, decoded] of results) {
        map[idx] = decoded;
      }
      setDecodedMap(map);
      setLoading(false);
    });
  }, [logs]);

  if (logs.length === 0) {
    return <p className="text-sm text-slate-500">No event logs.</p>;
  }

  return (
    <div className="space-y-4">
      {logs.map((log, index) => {
        const decoded = decodedMap[index];
        const fallbackName = decodeEventTopic(log.topic0);
        const topics = [log.topic0, log.topic1, log.topic2, log.topic3].filter(Boolean) as string[];

        return (
          <div key={`${log.contract_address}-${index}`} className="rounded-lg border border-slate-800/60 p-4">
            {/* Header: index, contract, event name */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-[10px] font-medium text-slate-400">
                {index}
              </span>
              <Link
                href={`/address/${log.contract_address}`}
                className="font-mono text-xs text-cyan-400 hover:text-cyan-300"
              >
                {shortenHash(log.contract_address)}
              </Link>
              {decoded ? (
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
                  {decoded.name}
                </span>
              ) : fallbackName ? (
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">
                  {fallbackName}
                </span>
              ) : null}
              {loading && !decoded && (
                <span className="text-[10px] text-slate-600 animate-pulse">decoding...</span>
              )}
            </div>

            {/* Decoded parameters */}
            {decoded && decoded.params.length > 0 ? (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-wider text-slate-600">
                      <th className="py-1 pr-3">#</th>
                      <th className="py-1 pr-3">Name</th>
                      <th className="py-1 pr-3">Type</th>
                      <th className="py-1">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/20">
                    {decoded.params.map((param, pi) => (
                      <DecodedParamRow key={pi} param={param} index={pi} />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Fallback: raw topics + data */
              <>
                <div className="mt-3 space-y-1">
                  {topics.map((topic, ti) => (
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
                {log.data && log.data !== '0x' && (
                  <div className="mt-2">
                    <p className="text-[10px] text-slate-600">data:</p>
                    <p className="break-all font-mono text-xs text-slate-400">{log.data}</p>
                  </div>
                )}
              </>
            )}

            {/* Collapsible raw data for decoded logs */}
            {decoded && (
              <details className="mt-2">
                <summary className="cursor-pointer text-[10px] text-slate-600 hover:text-slate-400">
                  Raw topics &amp; data
                </summary>
                <div className="mt-2 space-y-1">
                  {topics.map((topic, ti) => (
                    <div key={ti} className="flex items-start gap-2">
                      <span className="shrink-0 text-[10px] text-slate-600 pt-0.5">
                        [{ti}]
                      </span>
                      <p className="break-all font-mono text-xs text-slate-500">
                        {topic}
                      </p>
                    </div>
                  ))}
                  {log.data && log.data !== '0x' && (
                    <div className="mt-1">
                      <span className="text-[10px] text-slate-600">data: </span>
                      <span className="break-all font-mono text-xs text-slate-500">{log.data}</span>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DecodedParamRow({ param, index }: { param: DecodedEventParam; index: number }) {
  const isAddress = param.type === 'address';
  const isUint = param.type.startsWith('uint');
  const showWeiConversion = isUint && looksLikeWeiAmount(param.value);

  return (
    <tr>
      <td className="py-1.5 pr-3 text-slate-600 text-xs">{index}</td>
      <td className="py-1.5 pr-3">
        <span className="text-slate-400 text-xs">{param.name || `param${index}`}</span>
        {param.indexed && (
          <span className="ml-1.5 rounded bg-slate-800 px-1 py-0.5 text-[9px] text-slate-500">
            indexed
          </span>
        )}
      </td>
      <td className="py-1.5 pr-3">
        <span className="font-mono text-[10px] text-slate-500">{param.type}</span>
      </td>
      <td className="py-1.5 font-mono text-xs">
        {isAddress && param.value ? (
          <Link
            href={`/address/${param.value}`}
            className="text-cyan-400 hover:text-cyan-300"
          >
            {param.value}
          </Link>
        ) : showWeiConversion ? (
          <span className="text-slate-300">
            {param.value}
            <span className="ml-2 text-[10px] text-slate-500">
              ({formatWeiToQfc(param.value)} QFC)
            </span>
          </span>
        ) : (
          <span className="text-slate-300 break-all">{param.value}</span>
        )}
      </td>
    </tr>
  );
}
