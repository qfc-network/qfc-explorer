'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

function isHex(value: string) {
  return /^0x[0-9a-fA-F]+$/.test(value);
}

type SuggestionResponse = {
  ok: true;
  data: {
    blockHeights: string[];
    blockHashes: Array<{ hash: string; height: string }>;
    txHashes: Array<{ hash: string; block_height: string }>;
    addresses: string[];
  };
};

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SuggestionResponse | null>(null);
  const [open, setOpen] = useState(false);
  const latestRequest = useRef(0);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSuggestions(null);
      setOpen(false);
      return;
    }

    const requestId = Date.now();
    latestRequest.current = requestId;

    const handle = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(trimmed)}`);
        if (!res.ok) {
          return;
        }
        const payload = (await res.json()) as SuggestionResponse;
        if (latestRequest.current === requestId) {
          if (payload.ok) {
            setSuggestions(payload);
          }
          setOpen(true);
        }
      } catch {
        setSuggestions(null);
      }
    }, 200);

    return () => clearTimeout(handle);
  }, [query]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }

    if (/^\d+$/.test(trimmed)) {
      router.push(`/blocks/${trimmed}`);
      return;
    }

    if (isHex(trimmed)) {
      if (trimmed.length === 66) {
        router.push(`/txs/${trimmed}`);
        return;
      }
      if (trimmed.length === 42) {
        router.push(`/address/${trimmed}`);
        return;
      }
    }

    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const handleSelect = (href: string) => {
    setOpen(false);
    setQuery('');
    router.push(href);
  };

  return (
    <div className="relative w-full max-w-xl">
      <form onSubmit={handleSubmit} className="flex w-full items-center gap-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by block height, tx hash, or address"
          className="w-full rounded-full border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600"
          onFocus={() => {
            if (suggestions) {
              setOpen(true);
            }
          }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
        <button
          type="submit"
          className="rounded-full border border-slate-700 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-200"
        >
          Search
        </button>
      </form>

      {open && suggestions ? (
        <div className="absolute z-20 mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950/95 p-4 text-sm text-slate-200 shadow-xl">
          <div className="space-y-2">
            {suggestions.data.blockHeights?.map((height) => (
              <button
                key={`height-${height}`}
                type="button"
                onMouseDown={() => handleSelect(`/blocks/${height}`)}
                className="block w-full rounded-lg px-3 py-2 text-left hover:bg-slate-900"
              >
                Block {height}
              </button>
            ))}
            {suggestions.data.blockHashes?.map((block) => (
              <button
                key={`block-${block.hash}`}
                type="button"
                onMouseDown={() => handleSelect(`/blocks/${block.height}`)}
                className="block w-full rounded-lg px-3 py-2 text-left hover:bg-slate-900"
              >
                Block {block.height} ({block.hash.slice(0, 10)}…)
              </button>
            ))}
            {suggestions.data.txHashes?.map((tx) => (
              <button
                key={`tx-${tx.hash}`}
                type="button"
                onMouseDown={() => handleSelect(`/txs/${tx.hash}`)}
                className="block w-full rounded-lg px-3 py-2 text-left hover:bg-slate-900"
              >
                Transaction {tx.hash.slice(0, 10)}…
              </button>
            ))}
            {suggestions.data.addresses?.map((addr) => (
              <button
                key={`addr-${addr}`}
                type="button"
                onMouseDown={() => handleSelect(`/address/${addr}`)}
                className="block w-full rounded-lg px-3 py-2 text-left hover:bg-slate-900"
              >
                Address {addr.slice(0, 10)}…
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
