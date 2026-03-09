'use client';

import { useState } from 'react';
import Link from 'next/link';
import { shortenHash } from '@/lib/format';
import { getApiBaseUrl } from '@/lib/api-client';
import SectionHeader from '@/components/SectionHeader';

type Approval = {
  tokenAddress: string;
  tokenName: string | null;
  tokenSymbol: string | null;
  tokenDecimals: number | null;
  spender: string;
  allowance: string;
  isUnlimited: boolean;
  blockHeight: string;
  txHash: string;
};

function formatAllowance(allowance: string, decimals: number | null, isUnlimited: boolean): string {
  if (isUnlimited) return 'Unlimited';
  if (decimals == null || decimals === 0) return allowance;
  try {
    const val = BigInt(allowance);
    const base = 10n ** BigInt(decimals);
    const whole = val / base;
    const frac = val % base;
    if (frac === 0n) return whole.toLocaleString();
    const fracStr = frac.toString().padStart(decimals, '0').slice(0, 4).replace(/0+$/, '');
    return `${whole.toLocaleString()}.${fracStr}`;
  } catch {
    return allowance;
  }
}

export default function ApprovalsPage() {
  const [address, setAddress] = useState('');
  const [approvals, setApprovals] = useState<Approval[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCheck() {
    const addr = address.trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) {
      setError('Please enter a valid address (0x...)');
      return;
    }
    setError('');
    setLoading(true);
    setApprovals(null);

    try {
      const base = getApiBaseUrl();
      const url = base ? `${base}/address/${addr}/approvals` : `/api/address/${addr}/approvals`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setApprovals(json.data?.approvals ?? []);
    } catch {
      setError('Failed to fetch approval data');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-12">
      <SectionHeader
        title="Token Approval Checker"
        description="Check ERC-20 token approvals for any address. Unlimited approvals are highlighted as potential risks."
      />

      {/* Search */}
      <div className="flex gap-3">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
          placeholder="Enter address (0x...)"
          className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
        />
        <button
          onClick={handleCheck}
          disabled={loading}
          className="rounded-lg bg-cyan-600 px-6 py-3 text-sm font-medium text-slate-900 dark:text-white hover:bg-cyan-500 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Checking...' : 'Check'}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      {/* Results */}
      {approvals !== null && (
        <div className="space-y-4">
          {approvals.length === 0 ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-8 text-center">
              <p className="text-sm text-slate-400">No active token approvals found for this address.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-400">
                Found <span className="text-slate-900 dark:text-white font-medium">{approvals.length}</span> active approval{approvals.length !== 1 ? 's' : ''}
                {approvals.filter((a) => a.isUnlimited).length > 0 && (
                  <span className="ml-2 text-red-400">
                    ({approvals.filter((a) => a.isUnlimited).length} unlimited)
                  </span>
                )}
              </p>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-left text-xs uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-3">Token</th>
                      <th className="px-4 py-3">Spender</th>
                      <th className="px-4 py-3 text-right">Allowance</th>
                      <th className="px-4 py-3">Risk</th>
                      <th className="px-4 py-3">Tx</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/40">
                    {approvals.map((a, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-900/60">
                        <td className="px-4 py-3">
                          <Link href={`/tokens/${a.tokenAddress}`} className="text-cyan-400 hover:text-cyan-300">
                            {a.tokenSymbol ?? a.tokenName ?? shortenHash(a.tokenAddress)}
                          </Link>
                          {a.tokenName && a.tokenSymbol && (
                            <span className="ml-1.5 text-xs text-slate-500">{a.tokenName}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/address/${a.spender}`} className="font-mono text-slate-600 dark:text-slate-300 hover:text-cyan-400">
                            {shortenHash(a.spender)}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-mono ${a.isUnlimited ? 'text-red-400' : 'text-slate-600 dark:text-slate-300'}`}>
                            {formatAllowance(a.allowance, a.tokenDecimals, a.isUnlimited)}
                          </span>
                          {a.tokenSymbol && !a.isUnlimited && (
                            <span className="ml-1 text-xs text-slate-500">{a.tokenSymbol}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {a.isUnlimited ? (
                            <span className="inline-flex items-center gap-1 rounded bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400">
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                              </svg>
                              High
                            </span>
                          ) : (
                            <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
                              Low
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/txs/${a.txHash}`} className="text-cyan-400 hover:text-cyan-300 font-mono text-xs">
                            {shortenHash(a.txHash)}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </main>
  );
}
