'use client';

import { useState, useEffect, useCallback } from 'react';
import { keccak256, toUtf8Bytes, getAddress, isAddress } from 'ethers';

/* ── Tab definitions ─────────────────────────────────────────────────── */
const TABS = ['Unit Converter', 'Keccak256', 'ABI Decoder', 'Address Tools', 'Timestamp'] as const;
type Tab = (typeof TABS)[number];

/* ── Known selectors for ABI Decoder ─────────────────────────────────── */
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
  '06fdde03': 'name()',
  '95d89b41': 'symbol()',
  '313ce567': 'decimals()',
  'c87b56dd': 'tokenURI(uint256)',
  '01ffc9a7': 'supportsInterface(bytes4)',
  'a22cb465': 'setApprovalForAll(address,bool)',
  '40c10f19': 'mint(address,uint256)',
  '9dc29fac': 'burn(address,uint256)',
  '42966c68': 'burn(uint256)',
};

/* ── Common amounts for reference ────────────────────────────────────── */
const COMMON_AMOUNTS = [
  { label: '1 Wei', wei: '1', gwei: '0.000000001', qfc: '0.000000000000000001' },
  { label: '1 Gwei', wei: '1000000000', gwei: '1', qfc: '0.000000001' },
  { label: '0.01 QFC', wei: '10000000000000000', gwei: '10000000', qfc: '0.01' },
  { label: '0.1 QFC', wei: '100000000000000000', gwei: '100000000', qfc: '0.1' },
  { label: '1 QFC', wei: '1000000000000000000', gwei: '1000000000', qfc: '1' },
  { label: '10 QFC', wei: '10000000000000000000', gwei: '10000000000', qfc: '10' },
];

/* ── Helpers ──────────────────────────────────────────────────────────── */
function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
}

function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        copyToClipboard(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="ml-2 rounded bg-slate-200 dark:bg-slate-700 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function OutputBox({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="rounded-lg bg-slate-100 dark:bg-slate-800/50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <div className="mt-1 flex items-start">
        <p className="font-mono text-xs text-emerald-400 break-all flex-1">{value}</p>
        <CopyBtn value={value} />
      </div>
    </div>
  );
}

/* ── Unit Converter ──────────────────────────────────────────────────── */
function UnitConverter() {
  const [qfc, setQfc] = useState('');
  const [gwei, setGwei] = useState('');
  const [wei, setWei] = useState('');

  const updateFrom = useCallback((source: 'qfc' | 'gwei' | 'wei', val: string) => {
    if (source === 'qfc') setQfc(val);
    if (source === 'gwei') setGwei(val);
    if (source === 'wei') setWei(val);

    if (!val || val === '.' || val === '0.') {
      if (source !== 'qfc') setQfc('');
      if (source !== 'gwei') setGwei('');
      if (source !== 'wei') setWei('');
      return;
    }

    try {
      let weiBig: bigint;
      if (source === 'wei') {
        weiBig = BigInt(val);
      } else if (source === 'gwei') {
        const parts = val.split('.');
        const whole = BigInt(parts[0] || '0') * 10n ** 9n;
        const frac = parts[1]
          ? BigInt(parts[1].padEnd(9, '0').slice(0, 9))
          : 0n;
        weiBig = whole + frac;
      } else {
        const parts = val.split('.');
        const whole = BigInt(parts[0] || '0') * 10n ** 18n;
        const frac = parts[1]
          ? BigInt(parts[1].padEnd(18, '0').slice(0, 18))
          : 0n;
        weiBig = whole + frac;
      }

      if (source !== 'wei') setWei(weiBig.toString());

      // To Gwei
      if (source !== 'gwei') {
        const gWhole = weiBig / 10n ** 9n;
        const gFrac = weiBig % 10n ** 9n;
        setGwei(gFrac === 0n ? gWhole.toString() : `${gWhole}.${gFrac.toString().padStart(9, '0').replace(/0+$/, '')}`);
      }

      // To QFC
      if (source !== 'qfc') {
        const qWhole = weiBig / 10n ** 18n;
        const qFrac = weiBig % 10n ** 18n;
        setQfc(qFrac === 0n ? qWhole.toString() : `${qWhole}.${qFrac.toString().padStart(18, '0').replace(/0+$/, '')}`);
      }
    } catch {
      // Invalid input — leave other fields as-is
    }
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1.5">QFC</label>
          <input
            type="text"
            value={qfc}
            onChange={(e) => updateFrom('qfc', e.target.value)}
            placeholder="0.0"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-sm font-mono text-slate-900 dark:text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1.5">Gwei</label>
          <input
            type="text"
            value={gwei}
            onChange={(e) => updateFrom('gwei', e.target.value)}
            placeholder="0.0"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-sm font-mono text-slate-900 dark:text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1.5">Wei</label>
          <input
            type="text"
            value={wei}
            onChange={(e) => updateFrom('wei', e.target.value)}
            placeholder="0"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-sm font-mono text-slate-900 dark:text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="rounded-lg bg-slate-100 dark:bg-slate-800/50 p-4">
        <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Common Amounts</p>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="pb-2 pr-4">Name</th>
              <th className="pb-2 pr-4">Wei</th>
              <th className="pb-2 pr-4">Gwei</th>
              <th className="pb-2">QFC</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/40">
            {COMMON_AMOUNTS.map((a) => (
              <tr key={a.label} className="hover:bg-slate-200/50 dark:hover:bg-slate-700/30">
                <td className="py-1.5 pr-4 text-slate-600 dark:text-slate-300">{a.label}</td>
                <td className="py-1.5 pr-4 font-mono text-slate-900 dark:text-white">{a.wei}</td>
                <td className="py-1.5 pr-4 font-mono text-slate-900 dark:text-white">{a.gwei}</td>
                <td className="py-1.5 font-mono text-slate-900 dark:text-white">{a.qfc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Keccak256 Hash ──────────────────────────────────────────────────── */
function Keccak256Tool() {
  const [input, setInput] = useState('');
  const [hash, setHash] = useState('');

  const compute = useCallback(() => {
    if (!input) {
      setHash('');
      return;
    }
    try {
      setHash(keccak256(toUtf8Bytes(input)));
    } catch {
      setHash('Error computing hash');
    }
  }, [input]);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1.5">Text Input</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), compute())}
          placeholder="Enter text to hash..."
          rows={3}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-sm font-mono text-slate-900 dark:text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none resize-none"
        />
      </div>
      <button
        onClick={compute}
        className="rounded-lg bg-cyan-600 px-4 py-2.5 text-xs font-medium text-white hover:bg-cyan-500 transition-colors"
      >
        Hash
      </button>
      <OutputBox label="Keccak256 Hash" value={hash} />
    </div>
  );
}

/* ── ABI Decoder ─────────────────────────────────────────────────────── */
function AbiDecoder() {
  const [calldata, setCalldata] = useState('');
  const [abiJson, setAbiJson] = useState('');

  const calldataClean = calldata.replace(/^0x/, '').toLowerCase();
  const selector = calldataClean.length >= 8 ? calldataClean.slice(0, 8) : '';
  const selectorMatch = selector ? KNOWN_SELECTORS[selector] ?? null : null;

  const params: string[] = [];
  if (calldataClean.length > 8) {
    const hex = calldataClean.slice(8);
    for (let i = 0; i < hex.length; i += 64) {
      const chunk = hex.slice(i, i + 64);
      if (chunk.length === 64) params.push(chunk);
    }
  }

  // ABI-based decoding
  let abiDecoded: { name: string; types: string[]; values: string[] } | null = null;
  if (abiJson.trim() && calldata.trim()) {
    try {
      const abi = JSON.parse(abiJson);
      const fns = (Array.isArray(abi) ? abi : [abi]).filter(
        (e: { type?: string }) => e.type === 'function',
      );
      for (const fn of fns) {
        const sig = `${fn.name}(${fn.inputs.map((i: { type: string }) => i.type).join(',')})`;
        const fnSelector = keccak256(toUtf8Bytes(sig)).slice(2, 10);
        if (fnSelector === selector) {
          abiDecoded = {
            name: fn.name,
            types: fn.inputs.map((i: { type: string; name: string }) => `${i.type} ${i.name}`),
            values: params,
          };
          break;
        }
      }
    } catch {
      // Invalid JSON — ignore
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1.5">Calldata (hex)</label>
        <textarea
          value={calldata}
          onChange={(e) => setCalldata(e.target.value)}
          placeholder="0xa9059cbb000000000000000000000000..."
          rows={3}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-sm font-mono text-slate-900 dark:text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none resize-none"
        />
      </div>

      {selector && (
        <div className="space-y-3">
          <div className="rounded-lg bg-slate-100 dark:bg-slate-800/50 p-3">
            <p className="text-xs text-slate-500">Function Selector</p>
            <p className="mt-1 font-mono text-sm">
              <span className="text-cyan-400">0x{selector}</span>
              {selectorMatch ? (
                <span className="ml-2 text-emerald-400">{selectorMatch}</span>
              ) : (
                <span className="ml-2 text-slate-400">Unknown</span>
              )}
            </p>
          </div>

          {params.length > 0 && (
            <div className="rounded-lg bg-slate-100 dark:bg-slate-800/50 p-3">
              <p className="text-xs text-slate-500">Parameters ({params.length})</p>
              <div className="mt-2 space-y-1.5">
                {params.map((param, i) => {
                  const isAddr = param.startsWith('000000000000000000000000') && param.length === 64;
                  const decoded = isAddr
                    ? `0x${param.slice(24)}`
                    : (() => { try { return BigInt(`0x${param}`).toString(); } catch { return param; } })();
                  return (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <span className="text-slate-500 w-8 shrink-0">[{i}]</span>
                      <span className="font-mono text-slate-400 break-all">{param}</span>
                      <span className="text-slate-500">&rarr;</span>
                      <span className="font-mono text-slate-900 dark:text-white shrink-0">{decoded}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <div>
        <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1.5">ABI JSON (optional — for full param decoding)</label>
        <textarea
          value={abiJson}
          onChange={(e) => setAbiJson(e.target.value)}
          placeholder='[{"type":"function","name":"transfer","inputs":[...]}]'
          rows={4}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-sm font-mono text-slate-900 dark:text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none resize-none"
        />
      </div>

      {abiDecoded && (
        <div className="rounded-lg bg-slate-100 dark:bg-slate-800/50 p-3">
          <p className="text-xs text-slate-500">ABI Decoded</p>
          <p className="mt-1 font-mono text-sm text-emerald-400">{abiDecoded.name}()</p>
          <div className="mt-2 space-y-1">
            {abiDecoded.types.map((t, i) => (
              <div key={i} className="flex gap-2 text-xs">
                <span className="text-slate-500">{t}:</span>
                <span className="font-mono text-slate-900 dark:text-white break-all">
                  {abiDecoded!.values[i] ?? '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Address Tools ───────────────────────────────────────────────────── */
function AddressTools() {
  const [input, setInput] = useState('');

  const trimmed = input.trim();
  const valid = trimmed.length > 0 && isAddress(trimmed);
  let checksummed = '';
  let checksumValid: boolean | null = null;

  if (valid) {
    try {
      checksummed = getAddress(trimmed);
      // Check if original input matches checksum (only if input has mixed case)
      if (trimmed !== trimmed.toLowerCase() && trimmed !== trimmed.toUpperCase()) {
        checksumValid = trimmed === checksummed;
      } else {
        checksumValid = null; // no mixed case — can't validate
      }
    } catch {
      checksummed = '';
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1.5">Address Input</label>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18"
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-sm font-mono text-slate-900 dark:text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
        />
      </div>

      {trimmed.length > 0 && (
        <div className="space-y-3">
          {!valid ? (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
              <p className="text-sm text-red-400">Invalid Ethereum address</p>
            </div>
          ) : (
            <>
              <OutputBox label="EIP-55 Checksum" value={checksummed} />
              <OutputBox label="Lowercase" value={trimmed.toLowerCase()} />

              {checksumValid !== null && (
                <div className={`rounded-lg p-3 ${checksumValid ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                  <p className="text-sm">
                    {checksumValid ? (
                      <span className="text-emerald-400">Checksum valid</span>
                    ) : (
                      <span className="text-red-400">Checksum invalid — expected {checksummed}</span>
                    )}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Timestamp ───────────────────────────────────────────────────────── */
function TimestampTool() {
  const [now, setNow] = useState(Date.now());
  const [unixInput, setUnixInput] = useState('');
  const [dateInput, setDateInput] = useState('');

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const unixToDate = (() => {
    if (!unixInput.trim()) return '';
    const n = Number(unixInput);
    if (!Number.isFinite(n)) return 'Invalid';
    // Auto-detect seconds vs milliseconds
    const ms = n > 1e12 ? n : n * 1000;
    return new Date(ms).toLocaleString('en-US', { hour12: false, timeZoneName: 'short' });
  })();

  const dateToUnix = (() => {
    if (!dateInput.trim()) return '';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return 'Invalid date';
    return Math.floor(d.getTime() / 1000).toString();
  })();

  return (
    <div className="space-y-4">
      {/* Current time */}
      <div className="rounded-lg bg-slate-100 dark:bg-slate-800/50 p-4">
        <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Current Time</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <p className="text-[10px] text-slate-400">Unix (seconds)</p>
            <p className="font-mono text-lg text-slate-900 dark:text-white">{Math.floor(now / 1000)}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400">Human-readable</p>
            <p className="font-mono text-lg text-slate-900 dark:text-white">
              {new Date(now).toLocaleString('en-US', { hour12: false })}
            </p>
          </div>
        </div>
      </div>

      {/* Unix → Date */}
      <div>
        <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1.5">Unix Timestamp → Date</label>
        <input
          type="text"
          value={unixInput}
          onChange={(e) => setUnixInput(e.target.value)}
          placeholder="1710633600"
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-sm font-mono text-slate-900 dark:text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
        />
        <OutputBox label="Date" value={unixToDate} />
      </div>

      {/* Date → Unix */}
      <div>
        <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1.5">Date → Unix Timestamp</label>
        <input
          type="text"
          value={dateInput}
          onChange={(e) => setDateInput(e.target.value)}
          placeholder="2026-03-12T12:00:00Z"
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-sm font-mono text-slate-900 dark:text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
        />
        <OutputBox label="Unix Timestamp (seconds)" value={dateToUnix} />
      </div>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────────────── */
export default function ToolsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Unit Converter');

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Developer Tools</h1>
      <p className="mt-1 text-sm text-slate-400">Unit converter, hashing, ABI decoder, address tools, and timestamp utilities</p>

      {/* Tabs */}
      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tool Card */}
      <div className="mt-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-5">
        {activeTab === 'Unit Converter' && <UnitConverter />}
        {activeTab === 'Keccak256' && <Keccak256Tool />}
        {activeTab === 'ABI Decoder' && <AbiDecoder />}
        {activeTab === 'Address Tools' && <AddressTools />}
        {activeTab === 'Timestamp' && <TimestampTool />}
      </div>
    </main>
  );
}
