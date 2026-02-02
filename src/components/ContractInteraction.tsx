'use client';

import { useState } from 'react';

type Props = {
  address: string;
};

type FunctionInput = {
  name: string;
  type: string;
  value: string;
};

type FunctionDefinition = {
  name: string;
  inputs: FunctionInput[];
  outputs: { type: string }[];
  stateMutability: 'view' | 'pure' | 'nonpayable' | 'payable';
};

// Common ERC-20 read functions
const ERC20_READ_FUNCTIONS: FunctionDefinition[] = [
  { name: 'name', inputs: [], outputs: [{ type: 'string' }], stateMutability: 'view' },
  { name: 'symbol', inputs: [], outputs: [{ type: 'string' }], stateMutability: 'view' },
  { name: 'decimals', inputs: [], outputs: [{ type: 'uint8' }], stateMutability: 'view' },
  { name: 'totalSupply', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  {
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address', value: '' }],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'allowance',
    inputs: [
      { name: 'owner', type: 'address', value: '' },
      { name: 'spender', type: 'address', value: '' },
    ],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
];

// Common ERC-20 write functions
const ERC20_WRITE_FUNCTIONS: FunctionDefinition[] = [
  {
    name: 'transfer',
    inputs: [
      { name: 'to', type: 'address', value: '' },
      { name: 'amount', type: 'uint256', value: '' },
    ],
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address', value: '' },
      { name: 'amount', type: 'uint256', value: '' },
    ],
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    name: 'transferFrom',
    inputs: [
      { name: 'from', type: 'address', value: '' },
      { name: 'to', type: 'address', value: '' },
      { name: 'amount', type: 'uint256', value: '' },
    ],
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable',
  },
];

export default function ContractInteraction({ address }: Props) {
  const [activeTab, setActiveTab] = useState<'read' | 'write'>('read');
  const [customAbi, setCustomAbi] = useState('');
  const [useCustomAbi, setUseCustomAbi] = useState(false);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Contract Interaction</h2>
        <div className="flex rounded-lg border border-slate-700 overflow-hidden">
          <button
            onClick={() => setActiveTab('read')}
            className={`px-4 py-2 text-sm transition-colors ${
              activeTab === 'read'
                ? 'bg-blue-500 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Read Contract
          </button>
          <button
            onClick={() => setActiveTab('write')}
            className={`px-4 py-2 text-sm transition-colors ${
              activeTab === 'write'
                ? 'bg-green-500 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Write Contract
          </button>
        </div>
      </div>

      {/* Custom ABI input */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            id="customAbi"
            checked={useCustomAbi}
            onChange={(e) => setUseCustomAbi(e.target.checked)}
            className="rounded border-slate-600 bg-slate-700 text-blue-500"
          />
          <label htmlFor="customAbi" className="text-sm text-slate-300">
            Use custom ABI (paste JSON array)
          </label>
        </div>
        {useCustomAbi && (
          <textarea
            value={customAbi}
            onChange={(e) => setCustomAbi(e.target.value)}
            placeholder='[{"name": "balanceOf", "inputs": [...], "outputs": [...], "stateMutability": "view"}]'
            className="w-full h-24 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-mono text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          />
        )}
      </div>

      {activeTab === 'read' ? (
        <ReadContract address={address} customAbi={useCustomAbi ? customAbi : undefined} />
      ) : (
        <WriteContract address={address} customAbi={useCustomAbi ? customAbi : undefined} />
      )}
    </section>
  );
}

function ReadContract({ address, customAbi }: { address: string; customAbi?: string }) {
  const functions = customAbi ? parseAbi(customAbi, 'view') : ERC20_READ_FUNCTIONS;

  return (
    <div className="space-y-3">
      {functions.map((func, i) => (
        <FunctionCard key={i} address={address} func={func} mode="read" />
      ))}
    </div>
  );
}

function WriteContract({ address, customAbi }: { address: string; customAbi?: string }) {
  const functions = customAbi ? parseAbi(customAbi, 'write') : ERC20_WRITE_FUNCTIONS;

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-300">
        Write operations require a connected wallet. Connect your wallet to submit transactions.
      </div>
      {functions.map((func, i) => (
        <FunctionCard key={i} address={address} func={func} mode="write" />
      ))}
    </div>
  );
}

function FunctionCard({
  address,
  func,
  mode,
}: {
  address: string;
  func: FunctionDefinition;
  mode: 'read' | 'write';
}) {
  const [inputs, setInputs] = useState<Record<string, string>>(
    Object.fromEntries(func.inputs.map((inp) => [inp.name, '']))
  );
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleQuery = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/contract/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          function: func.name,
          inputs: func.inputs.map((inp) => ({
            type: inp.type,
            value: inputs[inp.name],
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Call failed');
      }

      setResult(data.data.result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${mode === 'read' ? 'bg-blue-500' : 'bg-green-500'}`} />
          <span className="font-mono text-slate-200">{func.name}</span>
          <span className="text-xs text-slate-500">
            ({func.inputs.map((i) => i.type).join(', ')})
          </span>
        </div>
        <svg
          className={`w-5 h-5 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-800">
          {func.inputs.map((inp) => (
            <div key={inp.name} className="mt-3">
              <label className="block text-xs text-slate-500 mb-1">
                {inp.name} ({inp.type})
              </label>
              <input
                type="text"
                value={inputs[inp.name]}
                onChange={(e) => setInputs({ ...inputs, [inp.name]: e.target.value })}
                placeholder={`Enter ${inp.type}`}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-mono text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
          ))}

          <button
            onClick={handleQuery}
            disabled={loading}
            className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              mode === 'read'
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            } disabled:opacity-50`}
          >
            {loading ? 'Querying...' : mode === 'read' ? 'Query' : 'Write'}
          </button>

          {result !== null && (
            <div className="rounded-lg bg-slate-800 p-3">
              <p className="text-xs text-slate-500 mb-1">Result:</p>
              <p className="font-mono text-sm text-green-400 break-all">{result}</p>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function parseAbi(abiJson: string, mode: 'view' | 'write'): FunctionDefinition[] {
  try {
    const abi = JSON.parse(abiJson);
    return abi
      .filter((item: { type?: string; stateMutability?: string }) => {
        if (item.type !== 'function') return false;
        if (mode === 'view') {
          return item.stateMutability === 'view' || item.stateMutability === 'pure';
        }
        return item.stateMutability === 'nonpayable' || item.stateMutability === 'payable';
      })
      .map((item: { name: string; inputs: { name: string; type: string }[]; outputs: { type: string }[]; stateMutability: string }) => ({
        name: item.name,
        inputs: item.inputs.map((inp: { name: string; type: string }) => ({
          name: inp.name,
          type: inp.type,
          value: '',
        })),
        outputs: item.outputs,
        stateMutability: item.stateMutability,
      }));
  } catch {
    return [];
  }
}
