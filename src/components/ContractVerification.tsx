'use client';

import { useState } from 'react';
import { apiUrl } from '@/lib/client-api';

type Props = {
  address: string;
  isVerified: boolean;
  sourceCode?: string;
  compilerVersion?: string;
  evmVersion?: string;
  optimizationRuns?: number;
  verifiedAt?: string;
};

const COMPILER_VERSIONS = [
  'v0.8.28',
  'v0.8.26',
  'v0.8.24',
  'v0.8.22',
  'v0.8.20',
  'v0.8.19',
  'v0.8.17',
  'v0.8.13',
  'v0.8.0',
];

const EVM_VERSIONS = ['paris', 'london', 'berlin', 'istanbul', 'constantinople', 'byzantium'];

export default function ContractVerification({
  address,
  isVerified,
  sourceCode: existingSource,
  compilerVersion: existingCompiler,
  evmVersion: existingEvm,
  optimizationRuns: existingOptRuns,
  verifiedAt,
}: Props) {
  const [showForm, setShowForm] = useState(false);
  const [sourceCode, setSourceCode] = useState('');
  const [compilerVersion, setCompilerVersion] = useState('v0.8.20');
  const [evmVersion, setEvmVersion] = useState('paris');
  const [optimize, setOptimize] = useState(false);
  const [optimizationRuns, setOptimizationRuns] = useState('200');
  const [constructorArgs, setConstructorArgs] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const handleVerify = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(apiUrl('/api/contracts/verify'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          sourceCode,
          compilerVersion,
          evmVersion,
          optimizationRuns: optimize ? parseInt(optimizationRuns) : undefined,
          constructorArgs: constructorArgs || undefined,
        }),
      });

      const data = await response.json();

      if (data.ok) {
        setResult({ ok: true, message: `Contract verified successfully! (${data.data.contractName})` });
      } else {
        setResult({ ok: false, message: data.error || 'Verification failed' });
      }
    } catch (e) {
      setResult({ ok: false, message: e instanceof Error ? e.message : 'Request failed' });
    } finally {
      setLoading(false);
    }
  };

  // Verified contract: show source code
  if (isVerified && existingSource) {
    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-white">Contract Source Code</h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-2.5 py-0.5 text-xs font-medium text-green-400 border border-green-500/30">
              <svg aria-hidden="true" className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Verified
            </span>
          </div>
        </div>

        {/* Compiler info */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="grid gap-3 sm:grid-cols-4 text-sm">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Compiler</p>
              <p className="text-slate-200 font-mono">{existingCompiler}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">EVM Version</p>
              <p className="text-slate-200 font-mono">{existingEvm}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Optimization</p>
              <p className="text-slate-200 font-mono">
                {existingOptRuns != null ? `Yes (${existingOptRuns} runs)` : 'No'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Verified At</p>
              <p className="text-slate-200 text-xs">
                {verifiedAt ? new Date(verifiedAt).toLocaleString() : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Source code */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-800/50">
            <span className="text-sm text-slate-400 font-mono">Contract.sol</span>
            <button
              onClick={() => navigator.clipboard.writeText(existingSource)}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Copy
            </button>
          </div>
          <pre className="p-4 text-sm text-slate-300 font-mono overflow-x-auto whitespace-pre max-h-[600px] overflow-y-auto leading-relaxed">
            {existingSource}
          </pre>
        </div>
      </section>
    );
  }

  // Not verified: show verify button / form
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Contract Verification</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
          >
            Verify & Publish Source
          </button>
        )}
      </div>

      {showForm && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
          {/* Compiler settings */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">
                Compiler Version
              </label>
              <select
                value={compilerVersion}
                onChange={(e) => setCompilerVersion(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
              >
                {COMPILER_VERSIONS.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">
                EVM Version
              </label>
              <select
                value={evmVersion}
                onChange={(e) => setEvmVersion(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
              >
                {EVM_VERSIONS.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Optimization */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="optimize"
                checked={optimize}
                onChange={(e) => setOptimize(e.target.checked)}
                className="rounded border-slate-600 bg-slate-700 text-blue-500"
              />
              <label htmlFor="optimize" className="text-sm text-slate-300">
                Optimization enabled
              </label>
            </div>
            {optimize && (
              <input
                type="number"
                value={optimizationRuns}
                onChange={(e) => setOptimizationRuns(e.target.value)}
                placeholder="200"
                className="w-24 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm font-mono text-slate-200 focus:border-blue-500 focus:outline-none"
              />
            )}
          </div>

          {/* Source code */}
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">
              Solidity Source Code
            </label>
            <textarea
              value={sourceCode}
              onChange={(e) => setSourceCode(e.target.value)}
              placeholder="// SPDX-License-Identifier: MIT&#10;pragma solidity ^0.8.20;&#10;&#10;contract MyToken {&#10;  ...&#10;}"
              rows={16}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-mono text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none leading-relaxed"
            />
          </div>

          {/* Constructor args */}
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">
              Constructor Arguments (ABI-encoded hex, optional)
            </label>
            <input
              type="text"
              value={constructorArgs}
              onChange={(e) => setConstructorArgs(e.target.value)}
              placeholder="0x000000000000..."
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-mono text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleVerify}
              disabled={loading || !sourceCode.trim()}
              className="rounded-lg bg-blue-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify & Publish'}
            </button>
            <button
              onClick={() => { setShowForm(false); setResult(null); }}
              className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
          </div>

          {/* Result */}
          {result && (
            <div
              className={`rounded-lg p-3 text-sm ${
                result.ok
                  ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                  : 'bg-red-500/10 border border-red-500/30 text-red-400'
              }`}
            >
              {result.message}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
