'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/components/LocaleProvider';
import type { MultisigInfo } from '@/lib/api-types';
import { getApiBaseUrl } from '@/lib/api-client';
import { shortenHash } from '@/lib/format';

export default function MultisigBadge({ address }: { address: string }) {
  const { t } = useTranslation();
  const [multisig, setMultisig] = useState<MultisigInfo | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchMultisig() {
      try {
        const base = getApiBaseUrl();
        const isExternal = base.includes(':3001') ||
          (process.env.NEXT_PUBLIC_API_URL || '').length > 0;
        const path = isExternal
          ? `${base}/address/${address}/multisig`
          : `${base}/api/address/${address}/multisig`;

        const res = await fetch(path);
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled && json.ok && json.data) {
          setMultisig(json.data);
        }
      } catch {
        // silently ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchMultisig();
    return () => { cancelled = true; };
  }, [address]);

  if (loading || !multisig) return null;

  const badgeText = `${t('multisig.badge')} (${multisig.threshold}/${multisig.owners.length})`;

  return (
    <div className="inline-flex flex-col">
      <button
        onClick={() => setExpanded(!expanded)}
        className="inline-flex items-center gap-1.5 rounded bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400 hover:bg-amber-500/20 transition-colors"
        title={t('multisig.badge')}
      >
        {/* Shield icon */}
        <svg
          className="h-3.5 w-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        {badgeText}
        <svg
          className={`h-3 w-3 transition-transform ${expanded ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-2 rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-sm">
          <div className="grid gap-2">
            {/* Version */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400">{t('multisig.version')}</span>
              <span className="font-mono text-slate-200">Safe v{multisig.version}</span>
            </div>

            {/* Threshold */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400">{t('multisig.threshold')}</span>
              <span className="text-slate-200">
                {multisig.threshold} / {multisig.owners.length}
              </span>
            </div>

            {/* Nonce */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400">{t('multisig.nonce')}</span>
              <span className="font-mono text-slate-200">{multisig.nonce}</span>
            </div>

            {/* Owners */}
            <div>
              <span className="text-slate-400">{t('multisig.owners')}</span>
              <ul className="mt-1 space-y-1">
                {multisig.owners.map((owner) => (
                  <li key={owner}>
                    <Link
                      href={`/address/${owner}`}
                      className="font-mono text-xs text-sky-400 hover:text-sky-300 break-all"
                    >
                      {shortenHash(owner)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
