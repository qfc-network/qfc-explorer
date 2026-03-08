'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiUrl } from '@/lib/client-api';
import type { ApiContractDiff } from '@/lib/api-types';
import DiffView from '@/components/DiffView';
import SectionHeader from '@/components/SectionHeader';

export default function ContractDiffPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [addressA, setAddressA] = useState(searchParams.get('a') || '');
  const [addressB, setAddressB] = useState(searchParams.get('b') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiContractDiff['data'] | null>(null);

  const runCompare = useCallback(async (a: string, b: string) => {
    if (!a || !b) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(
        apiUrl(`/api/contract/diff?a=${encodeURIComponent(a)}&b=${encodeURIComponent(b)}`)
      );
      const json = await res.json();
      if (!json.ok) {
        setError(json.error || 'Comparison failed');
      } else {
        setResult(json.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-compare if both params are provided on mount
  useEffect(() => {
    const a = searchParams.get('a');
    const b = searchParams.get('b');
    if (a && b) {
      setAddressA(a);
      setAddressB(b);
      runCompare(a, b);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCompare = () => {
    const params = new URLSearchParams();
    if (addressA) params.set('a', addressA);
    if (addressB) params.set('b', addressB);
    router.push(`/contract/diff?${params.toString()}`);
    runCompare(addressA, addressB);
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-6 py-12">
      {/* Breadcrumbs */}
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Link href="/" className="text-slate-500 hover:text-slate-300">Home</Link>
          <span className="text-slate-600">/</span>
          <Link href="/contracts" className="text-slate-500 hover:text-slate-300">Contracts</Link>
          <span className="text-slate-600">/</span>
          <span className="text-slate-300">Diff</span>
        </div>
        <h1 className="text-3xl font-semibold text-white">Contract Source Diff</h1>
        <p className="text-sm text-slate-400">Compare source code of two verified smart contracts side by side.</p>
      </header>

      {/* Input section */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Contract A</label>
            <input
              type="text"
              value={addressA}
              onChange={(e) => setAddressA(e.target.value.trim())}
              placeholder="0x..."
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 font-mono text-sm text-slate-200 placeholder-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Contract B</label>
            <input
              type="text"
              value={addressB}
              onChange={(e) => setAddressB(e.target.value.trim())}
              placeholder="0x..."
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 font-mono text-sm text-slate-200 placeholder-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleCompare}
            disabled={loading || !addressA || !addressB}
            className="rounded-lg bg-cyan-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Comparing...' : 'Compare'}
          </button>
          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}
        </div>
      </section>

      {/* Results */}
      {result && (
        <>
          {/* Contract info cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-1">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Contract A</p>
              <Link
                href={`/contract/${result.contract_a.address}`}
                className="font-mono text-sm text-cyan-400 hover:text-cyan-300 break-all"
              >
                {result.contract_a.address}
              </Link>
              {result.contract_a.compiler && (
                <p className="text-xs text-slate-500">Compiler: {result.contract_a.compiler}</p>
              )}
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-1">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Contract B</p>
              <Link
                href={`/contract/${result.contract_b.address}`}
                className="font-mono text-sm text-cyan-400 hover:text-cyan-300 break-all"
              >
                {result.contract_b.address}
              </Link>
              {result.contract_b.compiler && (
                <p className="text-xs text-slate-500">Compiler: {result.contract_b.compiler}</p>
              )}
            </div>
          </div>

          {/* Source code diff */}
          <section className="space-y-4">
            <SectionHeader
              title="Source Code Diff"
              description="Line-by-line comparison of verified source code"
            />
            <DiffView hunks={result.hunks} stats={result.stats} />
          </section>

          {/* ABI diff */}
          {(result.abi_diff.added.length > 0 || result.abi_diff.removed.length > 0 || result.abi_diff.modified.length > 0) && (
            <section className="space-y-4">
              <SectionHeader
                title="ABI Differences"
                description="Functions and events added or removed between contracts"
              />
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
                {result.abi_diff.added.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-green-400 mb-2">Added</h3>
                    <div className="flex flex-wrap gap-2">
                      {result.abi_diff.added.map((sig) => (
                        <span
                          key={sig}
                          className="inline-block rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-1 font-mono text-xs text-green-300"
                        >
                          {sig}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {result.abi_diff.removed.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-red-400 mb-2">Removed</h3>
                    <div className="flex flex-wrap gap-2">
                      {result.abi_diff.removed.map((sig) => (
                        <span
                          key={sig}
                          className="inline-block rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1 font-mono text-xs text-red-300"
                        >
                          {sig}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {result.abi_diff.modified.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-amber-400 mb-2">Modified</h3>
                    <div className="flex flex-wrap gap-2">
                      {result.abi_diff.modified.map((sig) => (
                        <span
                          key={sig}
                          className="inline-block rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1 font-mono text-xs text-amber-300"
                        >
                          {sig}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}
