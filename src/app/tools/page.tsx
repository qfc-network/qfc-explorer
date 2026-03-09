'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { apiUrl } from '@/lib/client-api';

// Known function selectors (from decode-input.ts + extras)
const KNOWN_SELECTORS: Record<string, string> = {
  'a9059cbb': 'transfer(address,uint256)',
  '095ea7b3': 'approve(address,uint256)',
  '23b872dd': 'transferFrom(address,address,uint256)',
  '70a08231': 'balanceOf(address)',
  'dd62ed3e': 'allowance(address,address)',
  '18160ddd': 'totalSupply()',
  '42842e0e': 'safeTransferFrom(address,address,uint256)',
  'b88d4fde': 'safeTransferFrom(address,address,uint256,bytes)',
  '6352211e': 'ownerOf(uint256)',
  '8da5cb5b': 'owner()',
  '715018a6': 'renounceOwnership()',
  'f2fde38b': 'transferOwnership(address)',
  '3ccfd60b': 'withdraw()',
  'd0e30db0': 'deposit()',
  '3659cfe6': 'upgradeTo(address)',
  '4f1ef286': 'upgradeToAndCall(address,bytes)',
  '06fdde03': 'name()',
  '95d89b41': 'symbol()',
  '313ce567': 'decimals()',
  'e8a3d485': 'contractURI()',
  'c87b56dd': 'tokenURI(uint256)',
  '01ffc9a7': 'supportsInterface(bytes4)',
  'a22cb465': 'setApprovalForAll(address,bool)',
  'e985e9c5': 'isApprovedForAll(address,address)',
  '081812fc': 'getApproved(uint256)',
  '2f745c59': 'tokenOfOwnerByIndex(address,uint256)',
  '4f6ccce7': 'tokenByIndex(uint256)',
  '150b7a02': 'onERC721Received(address,address,uint256,bytes)',
  'f23a6e61': 'onERC1155Received(address,address,uint256,uint256,bytes)',
  'bc197c81': 'onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)',
  '40c10f19': 'mint(address,uint256)',
  '9dc29fac': 'burn(address,uint256)',
  '42966c68': 'burn(uint256)',
  'a0712d68': 'mint(uint256)',
  '2e1a7d4d': 'withdraw(uint256)',
  'b6b55f25': 'deposit(uint256)',
  '5c975abb': 'paused()',
  '8456cb59': 'pause()',
  '3f4ba83a': 'unpause()',
  'e449f341': 'setBaseURI(string)',
  '55f804b3': 'setBaseURI(string)',
};

const KNOWN_TOPICS: Record<string, string> = {
  'ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef': 'Transfer(address,address,uint256)',
  '8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925': 'Approval(address,address,uint256)',
  'e1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c': 'Deposit(address,uint256)',
  '7fcf532c15f0a6db0bd6d0e038bea71d30d808c7d98cb3bf7268a95bf5081b65': 'Withdrawal(address,uint256)',
  '17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31': 'ApprovalForAll(address,address,bool)',
  'c3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62': 'TransferSingle(address,address,address,uint256,uint256)',
  '4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb': 'TransferBatch(address,address,address,uint256[],uint256[])',
  '8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0': 'OwnershipTransferred(address,address)',
  '62e78cea01bee320cd4e420270b5ea74000d11b0c9f74754ebdbfc544b05a258': 'Paused(address)',
  '5db9ee0a495bf2e6ff9c91a7834c1ba4fdd244a5e8aa4e537bd38aeae4b073aa': 'Unpaused(address)',
  'bc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b': 'Upgraded(address)',
  '7e644d79422f17c01e4894b5f4f588d331ebfa28653d42ae832dc59e38c9798f': 'AdminChanged(address,address)',
};

// Simple keccak256 via SubtleCrypto (SHA-256 fallback note: real keccak256 needs a library)
// For a client-side tool, we'll compute it server-side via an API call
async function computeKeccak256(input: string): Promise<string | null> {
  try {
    const res = await fetch(apiUrl(`/api/tools/keccak256?input=${encodeURIComponent(input)}`));
    const json = await res.json();
    return json.ok ? json.data.hash : null;
  } catch {
    return null;
  }
}

export default function ToolsPage() {
  const [selectorInput, setSelectorInput] = useState('');
  const [topicInput, setTopicInput] = useState('');
  const [calldataInput, setCalldataInput] = useState('');
  const [sigInput, setSigInput] = useState('');
  const [sigResult, setSigResult] = useState<{ topic: string; selector: string } | null>(null);
  const [sigLoading, setSigLoading] = useState(false);
  const [encodeType, setEncodeType] = useState('address');
  const [encodeValue, setEncodeValue] = useState('');

  const selectorClean = selectorInput.replace(/^0x/, '').toLowerCase().slice(0, 8);
  const selectorMatch = selectorClean.length === 8 ? KNOWN_SELECTORS[selectorClean] ?? null : null;

  const topicClean = topicInput.replace(/^0x/, '').toLowerCase();
  const topicMatch = topicClean.length === 64 ? KNOWN_TOPICS[topicClean] ?? null : null;

  // Decode calldata
  const calldataClean = calldataInput.replace(/^0x/, '').toLowerCase();
  const calldataSelector = calldataClean.length >= 8 ? calldataClean.slice(0, 8) : '';
  const calldataFn = calldataSelector ? KNOWN_SELECTORS[calldataSelector] ?? null : null;
  const calldataParams: string[] = [];
  if (calldataClean.length > 8) {
    const paramsHex = calldataClean.slice(8);
    for (let i = 0; i < paramsHex.length; i += 64) {
      const chunk = paramsHex.slice(i, i + 64);
      if (chunk.length === 64) calldataParams.push(chunk);
    }
  }

  const handleSigHash = useCallback(async () => {
    const sig = sigInput.trim();
    if (!sig) return;
    setSigLoading(true);
    const hash = await computeKeccak256(sig);
    if (hash) {
      setSigResult({
        topic: hash,
        selector: hash.slice(0, 10),
      });
    }
    setSigLoading(false);
  }, [sigInput]);

  // ABI encode helper
  const encodedValue = (() => {
    const val = encodeValue.trim();
    if (!val) return null;
    try {
      if (encodeType === 'address') {
        const addr = val.replace(/^0x/, '').toLowerCase();
        if (addr.length !== 40) return null;
        return '0x' + addr.padStart(64, '0');
      }
      if (encodeType === 'uint256') {
        const n = BigInt(val);
        return '0x' + n.toString(16).padStart(64, '0');
      }
      if (encodeType === 'bool') {
        const b = val === 'true' || val === '1';
        return '0x' + (b ? '1' : '0').padStart(64, '0');
      }
      if (encodeType === 'bytes32') {
        const hex = val.replace(/^0x/, '');
        if (hex.length > 64) return null;
        return '0x' + hex.padEnd(64, '0');
      }
    } catch {
      return null;
    }
    return null;
  })();

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-lg font-semibold text-slate-900 dark:text-white">ABI Tools</h1>
      <p className="mt-1 text-sm text-slate-400">Decode function selectors, event topics, encode values, and compute hashes</p>

      <div className="mt-8 space-y-8">
        {/* Event Signature → Topic Hash */}
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-5">
          <h2 className="text-sm font-medium text-slate-900 dark:text-white">Signature → Hash</h2>
          <p className="mt-1 text-xs text-slate-400">Compute keccak256 of a function or event signature to get its selector/topic</p>
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={sigInput}
              onChange={(e) => setSigInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSigHash()}
              placeholder="Transfer(address,address,uint256)"
              className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-sm font-mono text-slate-900 dark:text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
            <button
              onClick={handleSigHash}
              disabled={sigLoading}
              className="rounded-lg bg-cyan-600 px-4 py-2.5 text-xs font-medium text-slate-900 dark:text-white hover:bg-cyan-500 disabled:opacity-50 transition-colors"
            >
              {sigLoading ? '...' : 'Hash'}
            </button>
          </div>
          {sigResult && (
            <div className="mt-3 space-y-2">
              <div className="rounded-lg bg-slate-100 dark:bg-slate-800/50 p-3">
                <p className="text-xs text-slate-500">Event Topic (keccak256)</p>
                <p className="mt-1 font-mono text-xs text-emerald-400 break-all">{sigResult.topic}</p>
              </div>
              <div className="rounded-lg bg-slate-100 dark:bg-slate-800/50 p-3">
                <p className="text-xs text-slate-500">Function Selector (first 4 bytes)</p>
                <p className="mt-1 font-mono text-sm text-cyan-400">{sigResult.selector}</p>
              </div>
            </div>
          )}
        </section>

        {/* ABI Encoder */}
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-5">
          <h2 className="text-sm font-medium text-slate-900 dark:text-white">ABI Encoder</h2>
          <p className="mt-1 text-xs text-slate-400">Encode a value to ABI-packed 32-byte format</p>
          <div className="mt-3 flex gap-2">
            <select
              value={encodeType}
              onChange={(e) => setEncodeType(e.target.value)}
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="address">address</option>
              <option value="uint256">uint256</option>
              <option value="bool">bool</option>
              <option value="bytes32">bytes32</option>
            </select>
            <input
              type="text"
              value={encodeValue}
              onChange={(e) => setEncodeValue(e.target.value)}
              placeholder={encodeType === 'address' ? '0x1234...' : encodeType === 'uint256' ? '1000000' : encodeType === 'bool' ? 'true' : '0xabcd...'}
              className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-sm font-mono text-slate-900 dark:text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>
          {encodedValue && (
            <div className="mt-3 rounded-lg bg-slate-100 dark:bg-slate-800/50 p-3">
              <p className="text-xs text-slate-500">Encoded ({encodeType})</p>
              <p className="mt-1 font-mono text-xs text-emerald-400 break-all">{encodedValue}</p>
            </div>
          )}
        </section>

        {/* Function Selector Lookup */}
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-5">
          <h2 className="text-sm font-medium text-slate-900 dark:text-white">Function Selector Lookup</h2>
          <p className="mt-1 text-xs text-slate-400">Enter a 4-byte function selector (e.g. a9059cbb)</p>
          <input
            type="text"
            value={selectorInput}
            onChange={(e) => setSelectorInput(e.target.value)}
            placeholder="0xa9059cbb"
            className="mt-3 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-sm font-mono text-slate-900 dark:text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
          {selectorClean.length === 8 && (
            <div className="mt-3 rounded-lg bg-slate-100 dark:bg-slate-800/50 p-3">
              <p className="text-xs text-slate-500">Result</p>
              {selectorMatch ? (
                <p className="mt-1 font-mono text-sm text-emerald-400">{selectorMatch}</p>
              ) : (
                <p className="mt-1 text-sm text-slate-400">Unknown selector</p>
              )}
            </div>
          )}
        </section>

        {/* Event Topic Lookup */}
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-5">
          <h2 className="text-sm font-medium text-slate-900 dark:text-white">Event Topic Lookup</h2>
          <p className="mt-1 text-xs text-slate-400">Enter a 32-byte event topic0 hash</p>
          <input
            type="text"
            value={topicInput}
            onChange={(e) => setTopicInput(e.target.value)}
            placeholder="0xddf252ad..."
            className="mt-3 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-sm font-mono text-slate-900 dark:text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
          {topicClean.length === 64 && (
            <div className="mt-3 rounded-lg bg-slate-100 dark:bg-slate-800/50 p-3">
              <p className="text-xs text-slate-500">Result</p>
              {topicMatch ? (
                <p className="mt-1 font-mono text-sm text-emerald-400">{topicMatch}</p>
              ) : (
                <p className="mt-1 text-sm text-slate-400">Unknown event topic</p>
              )}
            </div>
          )}
        </section>

        {/* Calldata Decoder */}
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-5">
          <h2 className="text-sm font-medium text-slate-900 dark:text-white">Calldata Decoder</h2>
          <p className="mt-1 text-xs text-slate-400">Paste transaction input data to decode</p>
          <textarea
            value={calldataInput}
            onChange={(e) => setCalldataInput(e.target.value)}
            placeholder="0xa9059cbb000000000000000000000000..."
            rows={3}
            className="mt-3 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-sm font-mono text-slate-900 dark:text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none resize-none"
          />
          {calldataSelector && (
            <div className="mt-3 space-y-3">
              <div className="rounded-lg bg-slate-100 dark:bg-slate-800/50 p-3">
                <p className="text-xs text-slate-500">Function</p>
                <p className="mt-1 font-mono text-sm">
                  <span className="text-cyan-400">0x{calldataSelector}</span>
                  {calldataFn ? (
                    <span className="ml-2 text-emerald-400">{calldataFn}</span>
                  ) : (
                    <span className="ml-2 text-slate-400">Unknown</span>
                  )}
                </p>
              </div>
              {calldataParams.length > 0 && (
                <div className="rounded-lg bg-slate-100 dark:bg-slate-800/50 p-3">
                  <p className="text-xs text-slate-500">Parameters ({calldataParams.length})</p>
                  <div className="mt-2 space-y-1.5">
                    {calldataParams.map((param, i) => {
                      const isAddress = param.startsWith('000000000000000000000000') && param.length === 64;
                      const decoded = isAddress
                        ? `0x${param.slice(24)}`
                        : (() => { try { return BigInt(`0x${param}`).toString(); } catch { return param; } })();
                      return (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <span className="text-slate-500 w-8 shrink-0">[{i}]</span>
                          <span className="font-mono text-slate-400 break-all">{param}</span>
                          <span className="text-slate-500">&rarr;</span>
                          {isAddress ? (
                            <Link href={`/address/${decoded}`} className="font-mono text-cyan-400 hover:text-cyan-300 shrink-0">
                              {decoded}
                            </Link>
                          ) : (
                            <span className="font-mono text-slate-900 dark:text-white shrink-0">{decoded}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Reference Tables */}
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-5">
          <h2 className="text-sm font-medium text-slate-900 dark:text-white">Known Selectors ({Object.keys(KNOWN_SELECTORS).length})</h2>
          <div className="mt-3 max-h-64 overflow-y-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="pb-2 pr-4">Selector</th>
                  <th className="pb-2">Function</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/40">
                {Object.entries(KNOWN_SELECTORS).map(([sel, fn]) => (
                  <tr key={sel} className="hover:bg-slate-100 dark:hover:bg-slate-800/30">
                    <td className="py-1.5 pr-4 font-mono text-cyan-400">0x{sel}</td>
                    <td className="py-1.5 font-mono text-slate-600 dark:text-slate-300">{fn}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-5">
          <h2 className="text-sm font-medium text-slate-900 dark:text-white">Known Event Topics ({Object.keys(KNOWN_TOPICS).length})</h2>
          <div className="mt-3 max-h-64 overflow-y-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="pb-2 pr-4">Topic</th>
                  <th className="pb-2">Event</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/40">
                {Object.entries(KNOWN_TOPICS).map(([topic, event]) => (
                  <tr key={topic} className="hover:bg-slate-100 dark:hover:bg-slate-800/30">
                    <td className="py-1.5 pr-4 font-mono text-cyan-400 break-all">0x{topic.slice(0, 16)}...</td>
                    <td className="py-1.5 font-mono text-slate-600 dark:text-slate-300">{event}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
