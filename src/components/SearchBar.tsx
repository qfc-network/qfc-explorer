'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

function isHex(value: string) {
  return /^0x[0-9a-fA-F]+$/.test(value);
}

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }

    const normalized = trimmed.startsWith('0x') ? trimmed : trimmed;

    if (/^\d+$/.test(normalized)) {
      router.push(`/blocks/${normalized}`);
      return;
    }

    if (isHex(normalized)) {
      if (normalized.length === 66) {
        router.push(`/txs/${normalized}`);
        return;
      }
      if (normalized.length === 42) {
        router.push(`/address/${normalized}`);
        return;
      }
    }

    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-xl items-center gap-3">
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search by block height, tx hash, or address"
        className="w-full rounded-full border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600"
      />
      <button
        type="submit"
        className="rounded-full border border-slate-700 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-200"
      >
        Search
      </button>
    </form>
  );
}
