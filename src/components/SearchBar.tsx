'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { apiUrl } from '@/lib/client-api';

function isHex(value: string) {
  return /^0x[0-9a-fA-F]+$/.test(value);
}

type TokenSuggestion = { address: string; name: string | null; symbol: string | null; token_type: string };

type SuggestionResponse = {
  ok: true;
  data: {
    blockHeights: string[];
    blockHashes: Array<{ hash: string; height: string }>;
    txHashes: Array<{ hash: string; block_height: string }>;
    addresses: string[];
    tokens?: TokenSuggestion[];
  };
};

const HISTORY_KEY = 'qfc-search-history';
const MAX_HISTORY = 8;

function getHistory(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

function addHistory(query: string) {
  const history = getHistory().filter((h) => h !== query);
  history.unshift(query);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
}

export default function SearchBar({ prominent = false }: { prominent?: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SuggestionResponse | null>(null);
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const latestRequest = useRef(0);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

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
        const res = await fetch(apiUrl(`/api/search/suggest?q=${encodeURIComponent(trimmed)}`));
        if (!res.ok) return;
        const payload = (await res.json()) as SuggestionResponse;
        if (latestRequest.current === requestId && payload.ok) {
          setSuggestions(payload);
          setOpen(true);
        }
      } catch {
        setSuggestions(null);
      }
    }, 200);

    return () => clearTimeout(handle);
  }, [query]);

  const navigate = (href: string, searchQuery?: string) => {
    setOpen(false);
    if (searchQuery) addHistory(searchQuery);
    setQuery('');
    router.push(href);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    if (/^\d+$/.test(trimmed)) {
      navigate(`/blocks/${trimmed}`, trimmed);
      return;
    }
    if (isHex(trimmed)) {
      if (trimmed.length === 66) { navigate(`/txs/${trimmed}`, trimmed); return; }
      if (trimmed.length === 42) { navigate(`/address/${trimmed}`, trimmed); return; }
    }
    navigate(`/search?q=${encodeURIComponent(trimmed)}`, trimmed);
  };

  const showDropdown = open && suggestions;
  const showHistory = !open && !query && history.length > 0;

  const inputCls = prominent
    ? 'w-full rounded-xl border border-slate-700 bg-slate-900/80 px-5 py-3.5 text-sm text-slate-200 outline-none placeholder:text-slate-500 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-colors'
    : 'w-full rounded-lg border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-cyan-500/50 transition-colors';

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit} className="relative flex w-full items-center">
        <svg className={`absolute ${prominent ? 'left-4' : 'left-3'} h-4 w-4 text-slate-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by Address / Tx Hash / Block / Token"
          className={`${inputCls} ${prominent ? 'pl-11' : 'pl-9'}`}
          onFocus={() => {
            if (suggestions) setOpen(true);
          }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
        <button
          type="submit"
          className={`absolute right-2 rounded-lg bg-cyan-600 px-4 text-xs font-medium text-white hover:bg-cyan-500 transition-colors ${prominent ? 'py-2' : 'py-1.5'}`}
        >
          Search
        </button>
      </form>

      {/* Suggestions dropdown */}
      {showDropdown ? (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/95 py-1 text-sm shadow-xl backdrop-blur-sm">
          {suggestions.data.blockHeights?.map((height) => (
            <SuggestItem key={`h-${height}`} icon="block" label={`Block ${height}`} onSelect={() => navigate(`/blocks/${height}`, height)} />
          ))}
          {suggestions.data.blockHashes?.map((block) => (
            <SuggestItem key={`bh-${block.hash}`} icon="block" label={`Block ${block.height}`} sub={block.hash.slice(0, 16) + '...'} onSelect={() => navigate(`/blocks/${block.height}`, block.hash)} />
          ))}
          {suggestions.data.txHashes?.map((tx) => (
            <SuggestItem key={`tx-${tx.hash}`} icon="tx" label="Transaction" sub={tx.hash.slice(0, 20) + '...'} onSelect={() => navigate(`/txs/${tx.hash}`, tx.hash)} />
          ))}
          {suggestions.data.addresses?.map((addr) => (
            <SuggestItem key={`addr-${addr}`} icon="addr" label="Address" sub={addr} onSelect={() => navigate(`/address/${addr}`, addr)} />
          ))}
          {suggestions.data.tokens?.map((token) => (
            <SuggestItem
              key={`token-${token.address}`}
              icon="token"
              label={token.name || token.symbol || 'Token'}
              sub={`${token.symbol || ''} (${token.token_type})`}
              onSelect={() => navigate(`/token/${token.address}`, token.name || token.address)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SuggestItem({ icon, label, sub, onSelect }: { icon: string; label: string; sub?: string; onSelect: () => void }) {
  return (
    <button
      type="button"
      onMouseDown={onSelect}
      className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-900/80 transition-colors"
    >
      <span className="text-xs text-slate-500">
        {icon === 'block' ? '□' : icon === 'tx' ? '⇄' : icon === 'token' ? '●' : '◎'}
      </span>
      <span className="text-slate-200">{label}</span>
      {sub && <span className="text-xs text-slate-500 truncate">{sub}</span>}
    </button>
  );
}
