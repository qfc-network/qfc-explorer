'use client';

import { useState } from 'react';

export default function AdminControls() {
  const [from, setFrom] = useState('0');
  const [message, setMessage] = useState<string | null>(null);

  const post = async (path: string, body?: unknown) => {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    const payload = await res.json().catch(() => null);
    if (!res.ok || !payload?.ok) {
      setMessage('Request failed');
      return;
    }
    setMessage('Request sent');
    setTimeout(() => setMessage(null), 1500);
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Admin Actions</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          value={from}
          onChange={(event) => setFrom(event.target.value)}
          className="w-40 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 px-4 py-2 text-sm text-slate-800 dark:text-slate-200"
          placeholder="Rescan from"
        />
        <button
          type="button"
          onClick={() => post('/api/admin/indexer/rescan', { from: Number(from) })}
          className="rounded-full border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-800 dark:text-slate-200"
        >
          Rescan
        </button>
        <button
          type="button"
          onClick={() => post('/api/admin/indexer/retry-failed')}
          className="rounded-full border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-800 dark:text-slate-200"
        >
          Retry Failed
        </button>
        {message ? <span className="text-xs text-slate-400">{message}</span> : null}
      </div>
    </div>
  );
}
