'use client';

import { useState } from 'react';
import Link from 'next/link';
import SectionHeader from '@/components/SectionHeader';
import { MIN_PROPOSAL_THRESHOLD } from '@/lib/governor-contract';

type ProposalType = 'Parameter Change' | 'Protocol Upgrade' | 'Treasury' | 'General';
const PROPOSAL_TYPES: ProposalType[] = ['Parameter Change', 'Protocol Upgrade', 'Treasury', 'General'];

export default function CreateProposalPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ProposalType>('General');
  const [paramKey, setParamKey] = useState('');
  const [paramCurrent, setParamCurrent] = useState('');
  const [paramProposed, setParamProposed] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = title.trim().length > 0 && description.trim().length > 0 && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);

    // In production, this would connect wallet and call GovernorContract.propose()
    alert('Wallet connection required. This feature will be available when the Governor contract is deployed.');
    setSubmitting(false);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-12">
      <div>
        <Link href="/governance" className="text-sm text-cyan-500 hover:underline">
          ← Back to Governance
        </Link>
      </div>

      <SectionHeader
        title="Create Proposal"
        description="Submit a new governance proposal for community voting."
      />

      {/* Warning */}
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
        <p className="text-sm text-amber-300">
          Minimum {formatNumber(MIN_PROPOSAL_THRESHOLD)} QFC required to create a proposal.
          Ensure your wallet has sufficient balance before submitting.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-slate-900 dark:text-white">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Enter proposal title"
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-900 dark:text-white">
            Description
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe your proposal in detail..."
            rows={6}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-slate-900 dark:text-white">
            Proposal Type
          </label>
          <select
            value={type}
            onChange={e => setType(e.target.value as ProposalType)}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            {PROPOSAL_TYPES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Parameter Change fields */}
        {type === 'Parameter Change' && (
          <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/40">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Parameter Change Details
            </p>
            <div>
              <label className="block text-sm text-slate-700 dark:text-slate-300">
                Parameter Key
              </label>
              <input
                type="text"
                value={paramKey}
                onChange={e => setParamKey(e.target.value)}
                placeholder="e.g. dex.swapFee"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-mono text-slate-900 placeholder-slate-400 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm text-slate-700 dark:text-slate-300">
                  Current Value
                </label>
                <input
                  type="text"
                  value={paramCurrent}
                  onChange={e => setParamCurrent(e.target.value)}
                  placeholder="e.g. 0.3%"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-700 dark:text-slate-300">
                  Proposed Value
                </label>
                <input
                  type="text"
                  value={paramProposed}
                  onChange={e => setParamProposed(e.target.value)}
                  placeholder="e.g. 0.25%"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-lg bg-cyan-600 px-6 py-3 text-sm font-medium text-white hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Submitting...' : 'Submit Proposal'}
          </button>
          <Link
            href="/governance"
            className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </main>
  );
}

function formatNumber(n: number) {
  return new Intl.NumberFormat().format(n);
}
