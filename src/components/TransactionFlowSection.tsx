'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

const TransactionFlow = dynamic(() => import('@/components/TransactionFlow'), { ssr: false });

export default function TransactionFlowSection({ hash }: { hash: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/40">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-3 text-left transition-colors hover:bg-slate-800/30"
      >
        <h2 className="text-sm font-semibold text-white">Transaction Flow</h2>
        <span className="text-xs text-slate-400">
          {expanded ? 'Hide Flow Diagram' : 'Show Flow Diagram'}
          <svg
            className={`ml-1.5 inline-block h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      {expanded && (
        <div className="border-t border-slate-800/40 p-5">
          <TransactionFlow txHash={hash} />
        </div>
      )}
    </div>
  );
}
