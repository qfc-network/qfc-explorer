export const dynamic = "force-dynamic";

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tokens',
  description: 'ERC-20 and NFT tokens on the QFC blockchain.',
  openGraph: {
    title: 'Tokens | QFC Explorer',
    description: 'ERC-20 and NFT tokens on the QFC blockchain.',
    type: 'website',
  },
};

import Link from 'next/link';
import { fetchJsonSafe } from '@/lib/api-client';
import type { ApiTokensList } from '@/lib/api-types';
import { shortenHash } from '@/lib/format';

const PAGE_SIZE = 25;

function formatSupply(supply: string | null, decimals: number | null): string {
  if (!supply) return '—';
  try {
    const val = BigInt(supply);
    const dec = decimals ?? 18;
    const base = 10n ** BigInt(dec);
    const whole = val / base;
    if (whole > 1_000_000n) return `${(Number(whole) / 1_000_000).toFixed(2)}M`;
    if (whole > 1_000n) return `${(Number(whole) / 1_000).toFixed(2)}K`;
    return whole.toString();
  } catch {
    return supply;
  }
}

export default async function TokensPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const page = Math.max(1, Number(searchParams.page ?? '1'));
  const response = await fetchJsonSafe<ApiTokensList>(
    `/api/tokens?page=${page}&limit=${PAGE_SIZE}`,
    { next: { revalidate: 20 } }
  );
  const tokens = response?.data.items ?? [];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Token Tracker</h1>
          <p className="mt-1 text-sm text-slate-400">All tokens indexed on QFC network (ERC-20, ERC-721, ERC-1155)</p>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/40 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800/60 text-left text-xs uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Token</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Contract</th>
              <th className="px-4 py-3">Decimals</th>
              <th className="px-4 py-3 text-right">Total Supply</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {tokens.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No tokens indexed yet.
                </td>
              </tr>
            ) : (
              tokens.map((token, i) => (
                <tr key={token.address} className="hover:bg-slate-900/40">
                  <td className="px-4 py-3 text-slate-500">{(page - 1) * PAGE_SIZE + i + 1}</td>
                  <td className="px-4 py-3">
                    <Link href={`/token/${token.address}`} className="group">
                      <span className="font-medium text-white group-hover:text-cyan-300">{token.name ?? 'Unknown'}</span>
                      {token.symbol && (
                        <span className="ml-2 text-xs text-slate-400">({token.symbol})</span>
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <TokenTypeBadge type={token.token_type} />
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/address/${token.address}`} className="font-mono text-xs text-cyan-400 hover:text-cyan-300">
                      {shortenHash(token.address)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{token.decimals ?? '—'}</td>
                  <td className="px-4 py-3 text-right text-slate-300">
                    {formatSupply(token.total_supply, token.decimals)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
        {page > 1 ? (
          <Link href={`/tokens?page=${page - 1}`} className="rounded-lg border border-slate-800 px-4 py-2 hover:bg-slate-900">
            Previous
          </Link>
        ) : (
          <span className="rounded-lg border border-slate-800/40 px-4 py-2 text-slate-600">Previous</span>
        )}
        <span>Page {page}</span>
        {tokens.length === PAGE_SIZE ? (
          <Link href={`/tokens?page=${page + 1}`} className="rounded-lg border border-slate-800 px-4 py-2 hover:bg-slate-900">
            Next
          </Link>
        ) : (
          <span className="rounded-lg border border-slate-800/40 px-4 py-2 text-slate-600">Next</span>
        )}
      </div>
    </main>
  );
}

function TokenTypeBadge({ type }: { type: string }) {
  const config: Record<string, { label: string; className: string }> = {
    erc20: { label: 'ERC-20', className: 'bg-cyan-500/10 text-cyan-400' },
    erc721: { label: 'ERC-721', className: 'bg-purple-500/10 text-purple-400' },
    erc1155: { label: 'ERC-1155', className: 'bg-orange-500/10 text-orange-400' },
  };
  const c = config[type] ?? config.erc20;
  return <span className={`rounded px-2 py-0.5 text-xs font-medium ${c.className}`}>{c.label}</span>;
}
