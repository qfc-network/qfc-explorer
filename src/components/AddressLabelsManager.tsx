'use client';

import { useState } from 'react';

type Label = {
  address: string;
  label: string;
  category: string | null;
  description: string | null;
  website: string | null;
  created_at: string;
};

type Props = {
  labels: Label[];
};

export default function AddressLabelsManager({ labels: initialLabels }: Props) {
  const [labels, setLabels] = useState(initialLabels);
  const [address, setAddress] = useState('');
  const [label, setLabel] = useState('');
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const addLabel = async () => {
    if (!address || !label) {
      setMessage('Address and label required');
      return;
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      setMessage('Invalid address format');
      return;
    }
    try {
      const res = await fetch('/api/admin/labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, label, category: category || undefined }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setMessage(data?.error ?? 'Failed');
        return;
      }
      setMessage('Label added');
      // Add to local list
      setLabels((prev) => [
        { address: data.data.address, label: data.data.label, category: category || null, description: null, website: null, created_at: new Date().toISOString() },
        ...prev.filter((l) => l.address !== data.data.address),
      ]);
      setAddress('');
      setLabel('');
      setCategory('');
    } catch {
      setMessage('Request failed');
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const filtered = searchQuery
    ? labels.filter(
        (l) =>
          l.address.includes(searchQuery.toLowerCase()) ||
          l.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (l.category ?? '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : labels;

  return (
    <div className="space-y-4">
      {/* Add form */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-3">Add / Update Label</p>
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-96 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 px-4 py-2 text-sm text-slate-800 dark:text-slate-200 font-mono"
            placeholder="0x address"
          />
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-40 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 px-4 py-2 text-sm text-slate-800 dark:text-slate-200"
            placeholder="Label"
          />
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-32 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 px-4 py-2 text-sm text-slate-800 dark:text-slate-200"
            placeholder="Category"
          />
          <button
            type="button"
            onClick={addLabel}
            className="rounded-full border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-800 dark:text-slate-200"
          >
            Save
          </button>
          {message && <span className="text-xs text-slate-400">{message}</span>}
        </div>
      </div>

      {/* Search + list */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 px-4 py-2 text-sm text-slate-800 dark:text-slate-200"
            placeholder="Search labels..."
          />
        </div>
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="text-center text-slate-500 py-8">No labels found</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white dark:bg-slate-900">
                <tr className="text-left text-slate-500">
                  <th className="px-4 pb-3 font-medium">Address</th>
                  <th className="px-4 pb-3 font-medium">Label</th>
                  <th className="px-4 pb-3 font-medium">Category</th>
                  <th className="px-4 pb-3 font-medium text-right">Created</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => (
                  <tr key={l.address} className="border-t border-slate-200 dark:border-slate-800">
                    <td className="px-4 py-2 font-mono text-slate-600 dark:text-slate-300 text-xs">
                      {l.address.slice(0, 10)}...{l.address.slice(-8)}
                    </td>
                    <td className="px-4 py-2 text-slate-800 dark:text-slate-200">{l.label}</td>
                    <td className="px-4 py-2">
                      {l.category && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs">
                          {l.category}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-slate-400 text-right text-xs">
                      {new Date(l.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
