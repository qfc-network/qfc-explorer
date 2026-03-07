'use client';

import { useState } from 'react';

type ArchiveLog = {
  table_name: string;
  partition_key: string;
  rows_archived: number;
  archived_at: string;
};

type Props = {
  threshold: string;
  tables: Array<{ table: string; rows: number }>;
  recentOperations: ArchiveLog[];
};

export default function ArchiveDashboard({ threshold, tables, recentOperations }: Props) {
  const [height, setHeight] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const triggerArchive = async () => {
    const h = Number(height);
    if (!Number.isFinite(h) || h < 1_000_000) {
      setMessage('Height must be >= 1,000,000');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ belowHeight: h }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setMessage(data?.error ?? 'Archive failed');
      } else {
        setMessage(`Archived ${data.data.totalRowsMoved} rows from ${data.data.partitionsArchived} partitions`);
      }
    } catch {
      setMessage('Request failed');
    }
    setLoading(false);
    setTimeout(() => setMessage(null), 5000);
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Archive Threshold</p>
          <p className="text-lg font-mono text-slate-200 mt-1">{threshold || '—'}</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Tables Tracked</p>
          <p className="text-lg font-mono text-slate-200 mt-1">{tables.length}</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Recent Operations</p>
          <p className="text-lg font-mono text-slate-200 mt-1">{recentOperations.length}</p>
        </div>
      </div>

      {/* Trigger */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-3">Archive Data</p>
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            className="w-48 rounded-full border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-200"
            placeholder="Archive below height"
          />
          <button
            type="button"
            onClick={triggerArchive}
            disabled={loading}
            className="rounded-full border border-slate-700 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-200 disabled:opacity-50"
          >
            {loading ? 'Archiving...' : 'Archive'}
          </button>
          {message && <span className="text-xs text-slate-400">{message}</span>}
        </div>
      </div>

      {/* Recent operations */}
      {recentOperations.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-800">
                <th className="px-4 py-3 font-medium">Table</th>
                <th className="px-4 py-3 font-medium">Partition</th>
                <th className="px-4 py-3 font-medium text-right">Rows</th>
                <th className="px-4 py-3 font-medium text-right">Archived At</th>
              </tr>
            </thead>
            <tbody>
              {recentOperations.map((op, i) => (
                <tr key={i} className="border-t border-slate-800">
                  <td className="px-4 py-2 font-mono text-slate-300">{op.table_name}</td>
                  <td className="px-4 py-2 font-mono text-slate-400">{op.partition_key}</td>
                  <td className="px-4 py-2 font-mono text-slate-300 text-right">{op.rows_archived.toLocaleString()}</td>
                  <td className="px-4 py-2 text-slate-400 text-right text-xs">{new Date(op.archived_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
