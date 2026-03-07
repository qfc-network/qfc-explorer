'use client';

import { useState } from 'react';
import Link from 'next/link';

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
};

export default function ToolsPage() {
  const [selectorInput, setSelectorInput] = useState('');
  const [topicInput, setTopicInput] = useState('');
  const [calldataInput, setCalldataInput] = useState('');

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

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-lg font-semibold text-white">ABI Tools</h1>
      <p className="mt-1 text-sm text-slate-400">Decode function selectors, event topics, and calldata</p>

      <div className="mt-8 space-y-8">
        {/* Function Selector Lookup */}
        <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
          <h2 className="text-sm font-medium text-white">Function Selector Lookup</h2>
          <p className="mt-1 text-xs text-slate-400">Enter a 4-byte function selector (e.g. a9059cbb)</p>
          <input
            type="text"
            value={selectorInput}
            onChange={(e) => setSelectorInput(e.target.value)}
            placeholder="0xa9059cbb"
            className="mt-3 w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-mono text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
          {selectorClean.length === 8 && (
            <div className="mt-3 rounded-lg bg-slate-800/50 p-3">
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
        <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
          <h2 className="text-sm font-medium text-white">Event Topic Lookup</h2>
          <p className="mt-1 text-xs text-slate-400">Enter a 32-byte event topic0 hash</p>
          <input
            type="text"
            value={topicInput}
            onChange={(e) => setTopicInput(e.target.value)}
            placeholder="0xddf252ad..."
            className="mt-3 w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-mono text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
          {topicClean.length === 64 && (
            <div className="mt-3 rounded-lg bg-slate-800/50 p-3">
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
        <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
          <h2 className="text-sm font-medium text-white">Calldata Decoder</h2>
          <p className="mt-1 text-xs text-slate-400">Paste transaction input data to decode</p>
          <textarea
            value={calldataInput}
            onChange={(e) => setCalldataInput(e.target.value)}
            placeholder="0xa9059cbb000000000000000000000000..."
            rows={3}
            className="mt-3 w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-mono text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none resize-none"
          />
          {calldataSelector && (
            <div className="mt-3 space-y-3">
              <div className="rounded-lg bg-slate-800/50 p-3">
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
                <div className="rounded-lg bg-slate-800/50 p-3">
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
                          <span className="text-slate-500">→</span>
                          {isAddress ? (
                            <Link href={`/address/${decoded}`} className="font-mono text-cyan-400 hover:text-cyan-300 shrink-0">
                              {decoded}
                            </Link>
                          ) : (
                            <span className="font-mono text-white shrink-0">{decoded}</span>
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
        <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
          <h2 className="text-sm font-medium text-white">Known Selectors ({Object.keys(KNOWN_SELECTORS).length})</h2>
          <div className="mt-3 max-h-64 overflow-y-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="pb-2 pr-4">Selector</th>
                  <th className="pb-2">Function</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {Object.entries(KNOWN_SELECTORS).map(([sel, fn]) => (
                  <tr key={sel} className="hover:bg-slate-800/30">
                    <td className="py-1.5 pr-4 font-mono text-cyan-400">0x{sel}</td>
                    <td className="py-1.5 font-mono text-slate-300">{fn}</td>
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
