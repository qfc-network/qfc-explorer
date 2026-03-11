'use client';

import { useState, useRef, useCallback } from 'react';
import { apiUrl } from '@/lib/client-api';
import { useTranslation } from '@/components/LocaleProvider';

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

const VYPER_COMPILER_VERSIONS = ['0.4.0', '0.3.10', '0.3.9', '0.3.7'];

type VerifyTab = 'single' | 'multi' | 'vyper';

type SourceFile = {
  id: string;
  filename: string;
  content: string;
};

export default function ContractVerification({
  address,
  isVerified,
  sourceCode: existingSource,
  compilerVersion: existingCompiler,
  evmVersion: existingEvm,
  optimizationRuns: existingOptRuns,
  verifiedAt,
}: Props) {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<VerifyTab>('single');

  // Single-file state
  const [sourceCode, setSourceCode] = useState('');
  const [compilerVersion, setCompilerVersion] = useState('v0.8.20');
  const [evmVersion, setEvmVersion] = useState('paris');
  const [optimize, setOptimize] = useState(false);
  const [optimizationRuns, setOptimizationRuns] = useState('200');
  const [constructorArgs, setConstructorArgs] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Multi-file state
  const [multiFiles, setMultiFiles] = useState<SourceFile[]>([
    { id: crypto.randomUUID(), filename: '', content: '' },
  ]);
  const [entryContract, setEntryContract] = useState('');
  const [multiCompilerVersion, setMultiCompilerVersion] = useState('v0.8.20');
  const [multiEvmVersion, setMultiEvmVersion] = useState('paris');
  const [multiOptimize, setMultiOptimize] = useState(false);
  const [multiOptimizationRuns, setMultiOptimizationRuns] = useState('200');
  const [multiConstructorArgs, setMultiConstructorArgs] = useState('');
  const [multiLoading, setMultiLoading] = useState(false);
  const [multiResult, setMultiResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Vyper state
  const [vyperSource, setVyperSource] = useState('');
  const [vyperCompilerVersion, setVyperCompilerVersion] = useState('0.3.10');
  const [vyperEvmVersion, setVyperEvmVersion] = useState('paris');
  const [vyperConstructorArgs, setVyperConstructorArgs] = useState('');
  const [vyperContractName, setVyperContractName] = useState('');
  const [vyperLoading, setVyperLoading] = useState(false);
  const [vyperResult, setVyperResult] = useState<{ ok: boolean; message: string } | null>(null);

  const handleVerify = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(apiUrl('/api/contract/verify'), {
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
        setResult({ ok: true, message: `${t('verify.success')} (${data.data.contractName})` });
      } else {
        setResult({ ok: false, message: data.error || t('verify.failed') });
      }
    } catch (e) {
      setResult({ ok: false, message: e instanceof Error ? e.message : t('verify.requestFailed') });
    } finally {
      setLoading(false);
    }
  };

  const addFile = () => {
    setMultiFiles(prev => [...prev, { id: crypto.randomUUID(), filename: '', content: '' }]);
  };

  const removeFile = (id: string) => {
    setMultiFiles(prev => prev.length > 1 ? prev.filter(f => f.id !== id) : prev);
  };

  const updateFile = (id: string, field: 'filename' | 'content', value: string) => {
    setMultiFiles(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const handleFileUpload = useCallback((uploadedFiles: FileList | null) => {
    if (!uploadedFiles) return;
    const newFiles: SourceFile[] = [];

    Array.from(uploadedFiles).forEach(file => {
      if (!file.name.endsWith('.sol')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        newFiles.push({
          id: crypto.randomUUID(),
          filename: file.name,
          content,
        });
        // When all files are read, update state
        if (newFiles.length === Array.from(uploadedFiles).filter(f => f.name.endsWith('.sol')).length) {
          setMultiFiles(prev => {
            // Replace empty first entry or append
            const hasContent = prev.some(f => f.filename || f.content);
            return hasContent ? [...prev, ...newFiles] : newFiles;
          });
        }
      };
      reader.readAsText(file);
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

  const handleMultiVerify = async () => {
    setMultiLoading(true);
    setMultiResult(null);

    // Build files map
    const filesMap: Record<string, string> = {};
    for (const f of multiFiles) {
      if (f.filename && f.content) {
        filesMap[f.filename] = f.content;
      }
    }

    if (Object.keys(filesMap).length === 0) {
      setMultiResult({ ok: false, message: t('verify.noFilesProvided') });
      setMultiLoading(false);
      return;
    }

    if (!entryContract) {
      setMultiResult({ ok: false, message: t('verify.entryContractRequired') });
      setMultiLoading(false);
      return;
    }

    try {
      const response = await fetch(apiUrl('/api/contract/verify-multi'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          compiler_version: multiCompilerVersion,
          evm_version: multiEvmVersion,
          optimization_runs: multiOptimize ? parseInt(multiOptimizationRuns) : null,
          constructor_args: multiConstructorArgs || undefined,
          files: filesMap,
          entry_contract: entryContract,
        }),
      });

      const data = await response.json();

      if (data.ok) {
        setMultiResult({ ok: true, message: `${t('verify.success')} (${data.data.contractName})` });
      } else {
        setMultiResult({ ok: false, message: data.error || t('verify.failed') });
      }
    } catch (e) {
      setMultiResult({ ok: false, message: e instanceof Error ? e.message : t('verify.requestFailed') });
    } finally {
      setMultiLoading(false);
    }
  };

  const handleVyperVerify = async () => {
    setVyperLoading(true);
    setVyperResult(null);

    try {
      const response = await fetch(apiUrl('/api/contract/verify-vyper'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          source_code: vyperSource,
          compiler_version: vyperCompilerVersion,
          evm_version: vyperEvmVersion,
          constructor_args: vyperConstructorArgs || undefined,
          contract_name: vyperContractName || undefined,
        }),
      });

      const data = await response.json();

      if (data.ok) {
        setVyperResult({ ok: true, message: `${t('verify.success')} (${data.data.contractName})` });
      } else {
        setVyperResult({ ok: false, message: data.error || t('verify.failed') });
      }
    } catch (e) {
      setVyperResult({ ok: false, message: e instanceof Error ? e.message : t('verify.requestFailed') });
    } finally {
      setVyperLoading(false);
    }
  };

  // Build entry contract options from uploaded file names
  const entryOptions: string[] = [];
  for (const f of multiFiles) {
    if (f.filename && f.content) {
      // Extract contract names from source using a simple regex
      const contractMatches = f.content.matchAll(/\bcontract\s+(\w+)\s*(?:is\s|{)/g);
      for (const match of contractMatches) {
        entryOptions.push(`${f.filename}:${match[1]}`);
      }
    }
  }

  // Verified contract: show source code
  if (isVerified && existingSource) {
    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{t('verify.sourceCode')}</h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-2.5 py-0.5 text-xs font-medium text-green-400 border border-green-500/30">
              <svg aria-hidden="true" className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {t('common.verified')}
            </span>
          </div>
        </div>

        {/* Compiler info */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 p-4">
          <div className="grid gap-3 sm:grid-cols-4 text-sm">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">{t('verify.compiler')}</p>
              <p className="text-slate-800 dark:text-slate-200 font-mono">{existingCompiler}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">{t('verify.evmVersion')}</p>
              <p className="text-slate-800 dark:text-slate-200 font-mono">{existingEvm}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">{t('verify.optimization')}</p>
              <p className="text-slate-800 dark:text-slate-200 font-mono">
                {existingOptRuns != null ? `${t('common.yes')} (${existingOptRuns} runs)` : t('common.no')}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">{t('verify.verifiedAt')}</p>
              <p className="text-slate-800 dark:text-slate-200 text-xs">
                {verifiedAt ? new Date(verifiedAt).toLocaleString() : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Source code */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50">
            <span className="text-sm text-slate-400 font-mono">
              {existingCompiler?.startsWith('vyper:') ? 'Contract.vy' : 'Contract.sol'}
            </span>
            <button
              onClick={() => navigator.clipboard.writeText(existingSource)}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              {t('common.copy')}
            </button>
          </div>
          <pre className="p-4 text-sm text-slate-600 dark:text-slate-300 font-mono overflow-x-auto whitespace-pre max-h-[600px] overflow-y-auto leading-relaxed">
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
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{t('verify.title')}</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-slate-900 dark:text-white hover:bg-blue-600 transition-colors"
          >
            {t('verify.verifyPublish')}
          </button>
        )}
      </div>

      {showForm && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 p-6 space-y-4">
          {/* Tab selector */}
          <div className="flex border-b border-slate-300 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('single')}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === 'single'
                  ? 'text-blue-400 border-blue-400'
                  : 'text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              {t('verify.singleFile')}
            </button>
            <button
              onClick={() => setActiveTab('multi')}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === 'multi'
                  ? 'text-blue-400 border-blue-400'
                  : 'text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              {t('verify.multiFile')}
            </button>
            <button
              onClick={() => setActiveTab('vyper')}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === 'vyper'
                  ? 'text-blue-400 border-blue-400'
                  : 'text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              {t('verify.vyper')}
            </button>
          </div>

          {/* ======== SINGLE FILE TAB ======== */}
          {activeTab === 'single' && (
            <div className="space-y-4">
              {/* Compiler settings */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">
                    {t('verify.compilerVersion')}
                  </label>
                  <select
                    value={compilerVersion}
                    onChange={(e) => setCompilerVersion(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:border-blue-500 focus:outline-none"
                  >
                    {COMPILER_VERSIONS.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">
                    {t('verify.evmVersion')}
                  </label>
                  <select
                    value={evmVersion}
                    onChange={(e) => setEvmVersion(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:border-blue-500 focus:outline-none"
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
                  <label htmlFor="optimize" className="text-sm text-slate-600 dark:text-slate-300">
                    {t('verify.optimizationEnabled')}
                  </label>
                </div>
                {optimize && (
                  <input
                    type="number"
                    value={optimizationRuns}
                    onChange={(e) => setOptimizationRuns(e.target.value)}
                    placeholder="200"
                    className="w-24 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-sm font-mono text-slate-800 dark:text-slate-200 focus:border-blue-500 focus:outline-none"
                  />
                )}
              </div>

              {/* Source code */}
              <div>
                <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">
                  {t('verify.soliditySource')}
                </label>
                <textarea
                  value={sourceCode}
                  onChange={(e) => setSourceCode(e.target.value)}
                  placeholder="// SPDX-License-Identifier: MIT&#10;pragma solidity ^0.8.20;&#10;&#10;contract MyToken {&#10;  ...&#10;}"
                  rows={16}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-3 text-sm font-mono text-slate-800 dark:text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Constructor args */}
              <div>
                <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">
                  {t('verify.constructorArgs')}
                </label>
                <input
                  type="text"
                  value={constructorArgs}
                  onChange={(e) => setConstructorArgs(e.target.value)}
                  placeholder="0x000000000000..."
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3 py-2 text-sm font-mono text-slate-800 dark:text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Submit */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleVerify}
                  disabled={loading || !sourceCode.trim()}
                  className="rounded-lg bg-blue-500 px-6 py-2.5 text-sm font-medium text-slate-900 dark:text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {loading ? t('verify.verifying') : t('verify.verifyPublish')}
                </button>
                <button
                  onClick={() => { setShowForm(false); setResult(null); }}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {t('verify.cancel')}
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

          {/* ======== MULTI FILE TAB ======== */}
          {activeTab === 'multi' && (
            <div className="space-y-4">
              {/* Compiler settings */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">
                    {t('verify.compilerVersion')}
                  </label>
                  <select
                    value={multiCompilerVersion}
                    onChange={(e) => setMultiCompilerVersion(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:border-blue-500 focus:outline-none"
                  >
                    {COMPILER_VERSIONS.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">
                    {t('verify.evmVersion')}
                  </label>
                  <select
                    value={multiEvmVersion}
                    onChange={(e) => setMultiEvmVersion(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:border-blue-500 focus:outline-none"
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
                    id="multi-optimize"
                    checked={multiOptimize}
                    onChange={(e) => setMultiOptimize(e.target.checked)}
                    className="rounded border-slate-600 bg-slate-700 text-blue-500"
                  />
                  <label htmlFor="multi-optimize" className="text-sm text-slate-600 dark:text-slate-300">
                    {t('verify.optimizationEnabled')}
                  </label>
                </div>
                {multiOptimize && (
                  <input
                    type="number"
                    value={multiOptimizationRuns}
                    onChange={(e) => setMultiOptimizationRuns(e.target.value)}
                    placeholder="200"
                    className="w-24 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-sm font-mono text-slate-800 dark:text-slate-200 focus:border-blue-500 focus:outline-none"
                  />
                )}
              </div>

              {/* File upload drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
                  dragOver
                    ? 'border-blue-400 bg-blue-500/10'
                    : 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 hover:border-slate-600'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".sol"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files)}
                />
                <svg className="mx-auto h-8 w-8 text-slate-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm text-slate-400">{t('verify.dropFilesHere')}</p>
                <p className="text-xs text-slate-500 mt-1">{t('verify.solFilesOnly')}</p>
              </div>

              {/* File list / textareas */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-slate-500 uppercase tracking-wider">
                    {t('verify.sourceFiles')}
                  </label>
                  <button
                    onClick={addFile}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    + {t('verify.addFile')}
                  </button>
                </div>

                {multiFiles.map((file) => (
                  <div key={file.id} className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                      <input
                        type="text"
                        value={file.filename}
                        onChange={(e) => updateFile(file.id, 'filename', e.target.value)}
                        placeholder={t('verify.filenamePlaceholder')}
                        className="flex-1 bg-transparent text-sm font-mono text-slate-800 dark:text-slate-200 placeholder-slate-500 focus:outline-none"
                      />
                      {multiFiles.length > 1 && (
                        <button
                          onClick={() => removeFile(file.id)}
                          className="text-slate-500 hover:text-red-400 transition-colors"
                          title={t('verify.removeFile')}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <textarea
                      value={file.content}
                      onChange={(e) => updateFile(file.id, 'content', e.target.value)}
                      placeholder={t('verify.pasteSourceCode')}
                      rows={8}
                      className="w-full px-3 py-2 text-sm font-mono text-slate-800 dark:text-slate-200 placeholder-slate-500 bg-transparent focus:outline-none leading-relaxed resize-y"
                    />
                  </div>
                ))}
              </div>

              {/* Entry contract selector */}
              <div>
                <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">
                  {t('verify.entryContract')}
                </label>
                {entryOptions.length > 0 ? (
                  <select
                    value={entryContract}
                    onChange={(e) => setEntryContract(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">{t('verify.selectEntryContract')}</option>
                    {entryOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={entryContract}
                    onChange={(e) => setEntryContract(e.target.value)}
                    placeholder="contracts/Token.sol:MyToken"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3 py-2 text-sm font-mono text-slate-800 dark:text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                )}
                <p className="text-xs text-slate-500 mt-1">{t('verify.entryContractHint')}</p>
              </div>

              {/* Constructor args */}
              <div>
                <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">
                  {t('verify.constructorArgs')}
                </label>
                <input
                  type="text"
                  value={multiConstructorArgs}
                  onChange={(e) => setMultiConstructorArgs(e.target.value)}
                  placeholder="0x000000000000..."
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3 py-2 text-sm font-mono text-slate-800 dark:text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Submit */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleMultiVerify}
                  disabled={multiLoading || multiFiles.every(f => !f.content.trim()) || !entryContract}
                  className="rounded-lg bg-blue-500 px-6 py-2.5 text-sm font-medium text-slate-900 dark:text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {multiLoading ? t('verify.verifying') : t('verify.verifyPublish')}
                </button>
                <button
                  onClick={() => { setShowForm(false); setMultiResult(null); }}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {t('verify.cancel')}
                </button>
              </div>

              {/* Result */}
              {multiResult && (
                <div
                  className={`rounded-lg p-3 text-sm ${
                    multiResult.ok
                      ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                      : 'bg-red-500/10 border border-red-500/30 text-red-400'
                  }`}
                >
                  {multiResult.message}
                </div>
              )}
            </div>
          )}

          {/* ======== VYPER TAB ======== */}
          {activeTab === 'vyper' && (
            <div className="space-y-4">
              {/* Compiler settings */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">
                    {t('verify.vyperCompilerVersion')}
                  </label>
                  <select
                    value={vyperCompilerVersion}
                    onChange={(e) => setVyperCompilerVersion(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:border-blue-500 focus:outline-none"
                  >
                    {VYPER_COMPILER_VERSIONS.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">
                    {t('verify.evmVersion')}
                  </label>
                  <select
                    value={vyperEvmVersion}
                    onChange={(e) => setVyperEvmVersion(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:border-blue-500 focus:outline-none"
                  >
                    {EVM_VERSIONS.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Contract name (optional) */}
              <div>
                <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">
                  {t('verify.vyperContractName')}
                </label>
                <input
                  type="text"
                  value={vyperContractName}
                  onChange={(e) => setVyperContractName(e.target.value)}
                  placeholder={t('verify.vyperContractNamePlaceholder')}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3 py-2 text-sm font-mono text-slate-800 dark:text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Vyper source code */}
              <div>
                <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">
                  {t('verify.vyperSource')}
                </label>
                <textarea
                  value={vyperSource}
                  onChange={(e) => setVyperSource(e.target.value)}
                  placeholder={t('verify.vyperSourcePlaceholder')}
                  rows={16}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-3 text-sm font-mono text-slate-800 dark:text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Constructor args */}
              <div>
                <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">
                  {t('verify.constructorArgs')}
                </label>
                <input
                  type="text"
                  value={vyperConstructorArgs}
                  onChange={(e) => setVyperConstructorArgs(e.target.value)}
                  placeholder="0x000000000000..."
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3 py-2 text-sm font-mono text-slate-800 dark:text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Submit */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleVyperVerify}
                  disabled={vyperLoading || !vyperSource.trim()}
                  className="rounded-lg bg-blue-500 px-6 py-2.5 text-sm font-medium text-slate-900 dark:text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {vyperLoading ? t('verify.verifying') : t('verify.verifyPublish')}
                </button>
                <button
                  onClick={() => { setShowForm(false); setVyperResult(null); }}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {t('verify.cancel')}
                </button>
              </div>

              {/* Result */}
              {vyperResult && (
                <div
                  className={`rounded-lg p-3 text-sm ${
                    vyperResult.ok
                      ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                      : 'bg-red-500/10 border border-red-500/30 text-red-400'
                  }`}
                >
                  {vyperResult.message}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
