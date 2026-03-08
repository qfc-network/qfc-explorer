import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'API Documentation',
  description:
    'Complete API reference for the QFC Explorer REST API. Query blocks, transactions, addresses, tokens, contracts, and more.',
};

/* ---------------------------------------------------------------------------
 *  Sidebar category definitions
 * -------------------------------------------------------------------------*/

type Param = { name: string; type: string; required?: boolean; description: string; default?: string };
type Endpoint = {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  params?: Param[];
  body?: string;
  curl: string;
  response: string;
};
type Category = { id: string; title: string; endpoints: Endpoint[] };

const BASE = 'https://explorer-api.testnet.qfc.network';

const CATEGORIES: Category[] = [
  /* ---- Blocks --------------------------------------------------------- */
  {
    id: 'blocks',
    title: 'Blocks',
    endpoints: [
      {
        method: 'GET',
        path: '/blocks',
        description: 'Paginated list of blocks. Supports offset-based and cursor-based pagination.',
        params: [
          { name: 'page', type: 'number', description: 'Page number (offset pagination)', default: '1' },
          { name: 'limit', type: 'number', description: 'Items per page (1-100)', default: '25' },
          { name: 'order', type: 'string', description: '"desc" or "asc"', default: 'desc' },
          { name: 'producer', type: 'string', description: 'Filter by block producer address' },
          { name: 'cursor', type: 'string', description: 'Cursor token for cursor-based pagination (overrides page)' },
        ],
        curl: `curl "${BASE}/blocks?page=1&limit=5"`,
        response: `{
  "ok": true,
  "data": {
    "page": 1,
    "limit": 5,
    "order": "desc",
    "producer": null,
    "items": [
      {
        "hash": "0xabc...",
        "height": "42000",
        "producer": "0x1234...",
        "timestamp_ms": "1709900000000",
        "gas_used": "210000",
        "tx_count": 3
      }
    ],
    "next_cursor": "aGVpZ2h0OjQxOTk1"
  }
}`,
      },
      {
        method: 'GET',
        path: '/blocks/:height',
        description: 'Single block by height, including paginated transactions.',
        params: [
          { name: 'page', type: 'number', description: 'Transaction page', default: '1' },
          { name: 'limit', type: 'number', description: 'Transactions per page (1-100)', default: '25' },
          { name: 'order', type: 'string', description: '"desc" or "asc"', default: 'desc' },
        ],
        curl: `curl "${BASE}/blocks/42000"`,
        response: `{
  "ok": true,
  "data": {
    "block": {
      "hash": "0xabc...",
      "height": "42000",
      "producer": "0x1234...",
      "timestamp_ms": "1709900000000",
      "gas_used": "210000",
      "gas_limit": "30000000",
      "tx_count": 3
    },
    "transactions": [ ... ]
  }
}`,
      },
      {
        method: 'GET',
        path: '/blocks/:height/internal',
        description: 'Internal transactions within a block.',
        params: [
          { name: 'page', type: 'number', description: 'Page number', default: '1' },
          { name: 'limit', type: 'number', description: 'Items per page (1-100)', default: '25' },
        ],
        curl: `curl "${BASE}/blocks/42000/internal"`,
        response: `{
  "ok": true,
  "data": {
    "block_height": "42000",
    "page": 1,
    "limit": 25,
    "items": [ ... ],
    "total": 5
  }
}`,
      },
    ],
  },

  /* ---- Transactions --------------------------------------------------- */
  {
    id: 'transactions',
    title: 'Transactions',
    endpoints: [
      {
        method: 'GET',
        path: '/txs',
        description: 'Paginated list of transactions with optional filters.',
        params: [
          { name: 'page', type: 'number', description: 'Page number', default: '1' },
          { name: 'limit', type: 'number', description: 'Items per page (1-100)', default: '25' },
          { name: 'order', type: 'string', description: '"desc" or "asc"', default: 'desc' },
          { name: 'address', type: 'string', description: 'Filter by from or to address' },
          { name: 'status', type: 'string', description: 'Filter by status ("1" success, "0" fail)' },
          { name: 'min_value', type: 'string', description: 'Minimum value in wei' },
          { name: 'max_value', type: 'string', description: 'Maximum value in wei' },
          { name: 'method', type: 'string', description: 'Filter by function selector' },
          { name: 'from_date', type: 'string', description: 'Start date (YYYY-MM-DD)' },
          { name: 'to_date', type: 'string', description: 'End date (YYYY-MM-DD)' },
          { name: 'tx_type', type: 'string', description: 'Transaction type filter' },
          { name: 'cursor', type: 'string', description: 'Cursor-based pagination token' },
        ],
        curl: `curl "${BASE}/txs?page=1&limit=5&status=1"`,
        response: `{
  "ok": true,
  "data": {
    "page": 1,
    "limit": 5,
    "order": "desc",
    "items": [
      {
        "hash": "0xdef...",
        "block_height": "42000",
        "from_address": "0xaaaa...",
        "to_address": "0xbbbb...",
        "value": "1000000000000000000",
        "status": "1",
        "gas_used": "21000",
        "gas_price": "1000000000"
      }
    ],
    "next_cursor": "..."
  }
}`,
      },
      {
        method: 'GET',
        path: '/txs/:hash',
        description: 'Single transaction by hash. Falls back to archive, then RPC if not indexed.',
        curl: `curl "${BASE}/txs/0xdef..."`,
        response: `{
  "ok": true,
  "data": {
    "transaction": {
      "hash": "0xdef...",
      "block_height": "42000",
      "from_address": "0xaaaa...",
      "to_address": "0xbbbb...",
      "value": "1000000000000000000",
      "status": "1",
      "gas_used": "21000",
      "gas_price": "1000000000",
      "decoded_input": { "name": "transfer", "params": [ ... ] }
    },
    "defi_label": "Transfer",
    "logs": [ ... ],
    "decoded_logs": [ ... ],
    "source": "indexed"
  }
}`,
      },
      {
        method: 'GET',
        path: '/txs/:hash/internal',
        description: 'Internal transactions (traces) for a given transaction hash.',
        curl: `curl "${BASE}/txs/0xdef.../internal"`,
        response: `{
  "ok": true,
  "data": {
    "tx_hash": "0xdef...",
    "items": [
      { "from_address": "0x...", "to_address": "0x...", "value": "500000", "type": "CALL" }
    ],
    "total": 1
  }
}`,
      },
      {
        method: 'GET',
        path: '/txs/:hash/flow',
        description: 'Fund flow graph for Sankey visualization (native + ERC-20 + internal calls).',
        curl: `curl "${BASE}/txs/0xdef.../flow"`,
        response: `{
  "ok": true,
  "data": {
    "nodes": [
      { "address": "0xaaaa...", "label": "Deployer" }
    ],
    "links": [
      { "source": "0xaaaa...", "target": "0xbbbb...", "value": "1000000", "type": "native" }
    ]
  }
}`,
      },
    ],
  },

  /* ---- Addresses ------------------------------------------------------- */
  {
    id: 'addresses',
    title: 'Addresses',
    endpoints: [
      {
        method: 'GET',
        path: '/address/:address',
        description:
          'Comprehensive address overview: balance, stats, contract info, token holdings, NFTs, and paginated transactions or token transfers.',
        params: [
          { name: 'tab', type: 'string', description: '"transactions" | "token_transfers" | "internal_txs"', default: 'transactions' },
          { name: 'page', type: 'number', description: 'Page number', default: '1' },
          { name: 'limit', type: 'number', description: 'Items per page (1-100)', default: '25' },
          { name: 'order', type: 'string', description: '"desc" or "asc"', default: 'desc' },
        ],
        curl: `curl "${BASE}/address/0x1234...?tab=transactions&limit=10"`,
        response: `{
  "ok": true,
  "data": {
    "address": "0x1234...",
    "label": "Deployer",
    "overview": { "balance": "50000000000000000000", "nonce": 42 },
    "stats": { "sent": 100, "received": 55 },
    "contract": null,
    "tokenHoldings": [ ... ],
    "nftHoldings": [ ... ],
    "balance_usd": 125.50,
    "total_portfolio_usd": 340.00,
    "transactions": [ ... ]
  }
}`,
      },
      {
        method: 'GET',
        path: '/address/:address/export',
        description: 'CSV export of address transactions or token transfers with optional date range.',
        params: [
          { name: 'type', type: 'string', description: '"transactions" | "token_transfers"', default: 'transactions' },
          { name: 'limit', type: 'number', description: 'Max rows (100-10000)', default: '5000' },
          { name: 'order', type: 'string', description: '"desc" or "asc"', default: 'desc' },
          { name: 'start_date', type: 'string', description: 'Start date (YYYY-MM-DD)' },
          { name: 'end_date', type: 'string', description: 'End date (YYYY-MM-DD)' },
        ],
        curl: `curl "${BASE}/address/0x1234.../export?type=transactions&limit=100" -o txs.csv`,
        response: `hash,block_height,from_address,to_address,value,status,gas_used,gas_price
0xabc...,42000,0x1234...,0x5678...,1000000000000000000,1,21000,1000000000`,
      },
      {
        method: 'GET',
        path: '/address/:address/approvals',
        description: 'Token approval checker -- lists active ERC-20 approvals for the address.',
        curl: `curl "${BASE}/address/0x1234.../approvals"`,
        response: `{
  "ok": true,
  "data": {
    "address": "0x1234...",
    "approvals": [
      {
        "tokenAddress": "0xtoken...",
        "tokenSymbol": "USDT",
        "spender": "0xspender...",
        "allowance": "115792089237316195423570985008687907853269984665...",
        "isUnlimited": true,
        "txHash": "0x..."
      }
    ]
  }
}`,
      },
      {
        method: 'GET',
        path: '/address/:address/profile',
        description: 'Comprehensive activity analysis: value sums, gas spent, top interactions, activity heatmap, and activity level.',
        curl: `curl "${BASE}/address/0x1234.../profile"`,
        response: `{
  "ok": true,
  "data": {
    "address": "0x1234...",
    "total_sent": 100,
    "total_received": 55,
    "total_sent_value": "50000000000000000000",
    "total_gas_spent": "2100000000000000",
    "unique_interactions": 23,
    "activity_level": "active",
    "activity_heatmap": [
      { "day": "2026-03-01", "count": 5 }
    ],
    "top_interactions": [
      { "address": "0xbbbb...", "tx_count": 12 }
    ]
  }
}`,
      },
      {
        method: 'GET',
        path: '/address/:address/multisig',
        description: 'Detect if address is a Safe (Gnosis) multisig wallet and return details.',
        curl: `curl "${BASE}/address/0x1234.../multisig"`,
        response: `{
  "ok": true,
  "data": {
    "isSafe": true,
    "version": "1.3.0",
    "threshold": 2,
    "owners": ["0xaaaa...", "0xbbbb...", "0xcccc..."],
    "nonce": 15
  }
}`,
      },
      {
        method: 'GET',
        path: '/address/:address/nft-metadata',
        description: 'Fetch NFT tokenURI and metadata for up to 20 NFT holdings.',
        curl: `curl "${BASE}/address/0x1234.../nft-metadata"`,
        response: `{
  "ok": true,
  "data": {
    "address": "0x1234...",
    "nfts": [
      {
        "tokenAddress": "0xnft...",
        "tokenId": "42",
        "tokenName": "CoolNFT",
        "metadata": {
          "uri": "ipfs://...",
          "name": "Cool #42",
          "image": "https://ipfs.io/ipfs/..."
        }
      }
    ]
  }
}`,
      },
    ],
  },

  /* ---- Contracts ------------------------------------------------------- */
  {
    id: 'contracts',
    title: 'Contracts',
    endpoints: [
      {
        method: 'GET',
        path: '/contract',
        description: 'Paginated list of all deployed contracts.',
        params: [
          { name: 'limit', type: 'number', description: 'Items per page (1-100)', default: '25' },
          { name: 'offset', type: 'number', description: 'Offset', default: '0' },
        ],
        curl: `curl "${BASE}/contract?limit=10"`,
        response: `{
  "ok": true,
  "data": {
    "items": [
      { "address": "0x...", "creator_tx_hash": "0x...", "is_verified": true }
    ],
    "total": 150,
    "limit": 10,
    "offset": 0
  }
}`,
      },
      {
        method: 'GET',
        path: '/contract/verified',
        description: 'Top verified contracts ranked by interaction count.',
        curl: `curl "${BASE}/contract/verified"`,
        response: `{
  "ok": true,
  "data": {
    "items": [
      {
        "address": "0x...",
        "compiler_version": "v0.8.28",
        "token_name": "QFC Token",
        "interaction_count": 1234
      }
    ],
    "total": 15
  }
}`,
      },
      {
        method: 'GET',
        path: '/contract/:address',
        description: 'Deep contract info: bytecode, balance, verification status, ABI, proxy detection, similar contracts.',
        curl: `curl "${BASE}/contract/0xcontract..."`,
        response: `{
  "ok": true,
  "data": {
    "address": "0xcontract...",
    "is_contract": true,
    "balance": "0",
    "is_verified": true,
    "source_code": "pragma solidity ^0.8.0; ...",
    "abi": [ ... ],
    "compiler_version": "v0.8.28",
    "evm_version": "paris",
    "proxy_type": "EIP-1967",
    "implementation_address": "0ximpl...",
    "similar_contracts": [ ... ]
  }
}`,
      },
      {
        method: 'GET',
        path: '/contract/:address/proxy-abi',
        description: 'Get the implementation ABI for proxy contracts.',
        curl: `curl "${BASE}/contract/0xproxy.../proxy-abi"`,
        response: `{
  "ok": true,
  "data": {
    "isProxy": true,
    "implementation": "0ximpl...",
    "proxyType": "EIP-1967",
    "abi": [ ... ],
    "implementationVerified": true
  }
}`,
      },
      {
        method: 'GET',
        path: '/contract/diff',
        description: 'Compare source code of two verified contracts with unified diff output.',
        params: [
          { name: 'a', type: 'string', required: true, description: 'Address of contract A' },
          { name: 'b', type: 'string', required: true, description: 'Address of contract B' },
        ],
        curl: `curl "${BASE}/contract/diff?a=0xaaaa...&b=0xbbbb..."`,
        response: `{
  "ok": true,
  "data": {
    "contract_a": { "address": "0xaaaa...", "compiler": "v0.8.28" },
    "contract_b": { "address": "0xbbbb...", "compiler": "v0.8.28" },
    "hunks": [ ... ],
    "stats": { "additions": 5, "deletions": 3, "unchanged": 120 },
    "abi_diff": { "added": ["newFunc(uint256)"], "removed": [], "modified": [] }
  }
}`,
      },
      {
        method: 'POST',
        path: '/contract/verify',
        description: 'Verify a single-file Solidity contract by comparing compiled bytecode against deployed code.',
        body: `{
  "address": "0x...",
  "sourceCode": "pragma solidity ^0.8.0; ...",
  "compilerVersion": "v0.8.28",
  "evmVersion": "paris",
  "optimizationRuns": 200,
  "constructorArgs": "0x..."
}`,
        curl: `curl -X POST "${BASE}/contract/verify" \\
  -H "Content-Type: application/json" \\
  -d '{"address":"0x...","sourceCode":"...","compilerVersion":"v0.8.28"}'`,
        response: `{
  "ok": true,
  "data": {
    "address": "0x...",
    "verified": true,
    "contractName": "MyToken",
    "compiler": "v0.8.28",
    "evmVersion": "paris"
  }
}`,
      },
      {
        method: 'POST',
        path: '/contract/verify-json',
        description: 'Verify using Solidity Standard JSON Input (multi-file).',
        body: `{
  "address": "0x...",
  "standardJsonInput": "{ \\"language\\": \\"Solidity\\", ... }",
  "compilerVersion": "v0.8.28"
}`,
        curl: `curl -X POST "${BASE}/contract/verify-json" \\
  -H "Content-Type: application/json" \\
  -d '{"address":"0x...","standardJsonInput":"...","compilerVersion":"v0.8.28"}'`,
        response: `{
  "ok": true,
  "data": {
    "address": "0x...",
    "verified": true,
    "contractName": "contracts/Token.sol:Token"
  }
}`,
      },
      {
        method: 'POST',
        path: '/contract/verify-multi',
        description: 'Verify with multiple source files and an entry contract.',
        body: `{
  "address": "0x...",
  "compiler_version": "v0.8.28",
  "evm_version": "paris",
  "optimization_runs": 200,
  "files": { "contracts/Token.sol": "...", "contracts/IERC20.sol": "..." },
  "entry_contract": "contracts/Token.sol:Token"
}`,
        curl: `curl -X POST "${BASE}/contract/verify-multi" \\
  -H "Content-Type: application/json" \\
  -d '{"address":"0x...","compiler_version":"v0.8.28","files":{...},"entry_contract":"contracts/Token.sol:Token"}'`,
        response: `{
  "ok": true,
  "data": {
    "address": "0x...",
    "verified": true,
    "contractName": "contracts/Token.sol:Token"
  }
}`,
      },
      {
        method: 'POST',
        path: '/contract/verify-vyper',
        description: 'Verify a Vyper contract.',
        body: `{
  "address": "0x...",
  "source_code": "# @version ^0.3.10 ...",
  "compiler_version": "0.3.10",
  "evm_version": "paris"
}`,
        curl: `curl -X POST "${BASE}/contract/verify-vyper" \\
  -H "Content-Type: application/json" \\
  -d '{"address":"0x...","source_code":"...","compiler_version":"0.3.10"}'`,
        response: `{
  "ok": true,
  "data": {
    "address": "0x...",
    "verified": true,
    "contractName": "VyperContract",
    "compiler": "vyper:0.3.10"
  }
}`,
      },
      {
        method: 'POST',
        path: '/contract/call',
        description: 'Execute a read-only contract call (supports common functions like name, symbol, balanceOf, etc.).',
        body: `{
  "address": "0xtoken...",
  "function": "balanceOf",
  "inputs": [{ "type": "address", "value": "0xuser..." }]
}`,
        curl: `curl -X POST "${BASE}/contract/call" \\
  -H "Content-Type: application/json" \\
  -d '{"address":"0x...","function":"balanceOf","inputs":[{"type":"address","value":"0x..."}]}'`,
        response: `{
  "ok": true,
  "data": {
    "function": "balanceOf",
    "raw": "0x00000000000000000000000000000000000000000000003635c9adc5dea00000",
    "result": "1000000000000000000000"
  }
}`,
      },
      {
        method: 'POST',
        path: '/contract/decode',
        description: 'Decode calldata using a verified contract ABI.',
        body: `{
  "address": "0x...",
  "input": "0xa9059cbb000000000000000000000000..."
}`,
        curl: `curl -X POST "${BASE}/contract/decode" \\
  -H "Content-Type: application/json" \\
  -d '{"address":"0x...","input":"0xa9059cbb..."}'`,
        response: `{
  "ok": true,
  "data": {
    "decoded": {
      "name": "transfer",
      "params": [
        { "name": "to", "type": "address", "value": "0x..." },
        { "name": "amount", "type": "uint256", "value": "1000000000000000000" }
      ]
    }
  }
}`,
      },
      {
        method: 'POST',
        path: '/contract/decode-log',
        description: 'Decode an event log using a verified contract ABI.',
        body: `{
  "address": "0x...",
  "topics": ["0xddf252ad...", "0x000...sender", "0x000...receiver"],
  "data": "0x00000000000000000000000000000000000000000000003635c9adc5dea00000"
}`,
        curl: `curl -X POST "${BASE}/contract/decode-log" \\
  -H "Content-Type: application/json" \\
  -d '{"address":"0x...","topics":["0xddf252ad..."],"data":"0x..."}'`,
        response: `{
  "ok": true,
  "data": {
    "decoded": {
      "name": "Transfer",
      "params": [
        { "name": "from", "type": "address", "value": "0x..." },
        { "name": "to", "type": "address", "value": "0x..." },
        { "name": "value", "type": "uint256", "value": "1000000000000000000" }
      ]
    }
  }
}`,
      },
    ],
  },

  /* ---- Tokens --------------------------------------------------------- */
  {
    id: 'tokens',
    title: 'Tokens',
    endpoints: [
      {
        method: 'GET',
        path: '/tokens',
        description: 'Paginated token list with sorting, filtering by type, and market data.',
        params: [
          { name: 'page', type: 'number', description: 'Page number', default: '1' },
          { name: 'limit', type: 'number', description: 'Items per page (1-100)', default: '25' },
          { name: 'order', type: 'string', description: '"desc" or "asc"', default: 'desc' },
          { name: 'sort', type: 'string', description: '"market_cap" | "holders" | "volume" | "price" | "name" | "transfers"', default: 'market_cap' },
          { name: 'type', type: 'string', description: '"erc20" | "erc721" | "erc1155" | "all"', default: 'all' },
        ],
        curl: `curl "${BASE}/tokens?sort=holders&limit=10"`,
        response: `{
  "ok": true,
  "data": {
    "page": 1,
    "limit": 10,
    "sort": "holders",
    "type": "all",
    "total": 42,
    "items": [
      {
        "address": "0xtoken...",
        "name": "QFC Token",
        "symbol": "QFC",
        "decimals": 18,
        "token_type": "erc20",
        "price_usd": 2.50,
        "market_cap_usd": 25000000,
        "holder_count": 1500,
        "transfer_count": 8000
      }
    ]
  }
}`,
      },
      {
        method: 'GET',
        path: '/tokens/transfers',
        description: 'Recent token transfers across all tokens.',
        params: [
          { name: 'page', type: 'number', description: 'Page number', default: '1' },
          { name: 'limit', type: 'number', description: 'Items per page (1-100)', default: '25' },
          { name: 'order', type: 'string', description: '"desc" or "asc"', default: 'desc' },
          { name: 'type', type: 'string', description: 'Filter by token type: "ERC-20", "ERC-721", "ERC-1155"' },
        ],
        curl: `curl "${BASE}/tokens/transfers?limit=10&type=ERC-20"`,
        response: `{
  "ok": true,
  "data": {
    "page": 1,
    "limit": 10,
    "order": "desc",
    "type": "ERC-20",
    "items": [ ... ]
  }
}`,
      },
      {
        method: 'GET',
        path: '/tokens/:address',
        description: 'Token detail with price info and paginated transfer history.',
        params: [
          { name: 'page', type: 'number', description: 'Transfers page', default: '1' },
          { name: 'limit', type: 'number', description: 'Transfers per page (1-100)', default: '25' },
          { name: 'order', type: 'string', description: '"desc" or "asc"', default: 'desc' },
        ],
        curl: `curl "${BASE}/tokens/0xtoken..."`,
        response: `{
  "ok": true,
  "data": {
    "token": {
      "address": "0xtoken...",
      "name": "QFC Token",
      "symbol": "QFC",
      "decimals": 18,
      "total_supply": "100000000000000000000000000"
    },
    "price": { "priceUsd": 2.50 },
    "transfers": [ ... ]
  }
}`,
      },
      {
        method: 'GET',
        path: '/tokens/:address/holders',
        description: 'Top token holders (ERC-20 and NFT holders).',
        params: [
          { name: 'limit', type: 'number', description: 'Max holders (1-200)', default: '25' },
        ],
        curl: `curl "${BASE}/tokens/0xtoken.../holders?limit=10"`,
        response: `{
  "ok": true,
  "data": {
    "token": { ... },
    "holders": [
      { "address": "0x...", "balance": "50000000000000000000000" }
    ],
    "nftHolders": [ ... ]
  }
}`,
      },
      {
        method: 'GET',
        path: '/tokens/:address/sparkline',
        description: '7-day price history for sparkline charts.',
        curl: `curl "${BASE}/tokens/0xtoken.../sparkline"`,
        response: `{
  "ok": true,
  "data": {
    "tokenAddress": "0xtoken...",
    "sparkline": [2.40, 2.42, 2.45, 2.50, 2.48, 2.52, 2.50]
  }
}`,
      },
    ],
  },

  /* ---- Search --------------------------------------------------------- */
  {
    id: 'search',
    title: 'Search',
    endpoints: [
      {
        method: 'GET',
        path: '/search',
        description: 'Universal search across blocks, transactions, addresses, tokens, contracts, and labels.',
        params: [
          { name: 'q', type: 'string', required: true, description: 'Search query (block height, hash, address, or text)' },
        ],
        curl: `curl "${BASE}/search?q=0x1234..."`,
        response: `{
  "ok": true,
  "data": {
    "query": "0x1234...",
    "total": 2,
    "results": [
      { "type": "address", "data": { "balance": "...", "label": "Deployer" } },
      { "type": "contract", "data": { ... } }
    ]
  }
}`,
      },
      {
        method: 'GET',
        path: '/search/suggest',
        description: 'Autocomplete suggestions for the search bar.',
        params: [
          { name: 'q', type: 'string', required: true, description: 'Partial search query' },
        ],
        curl: `curl "${BASE}/search/suggest?q=QFC"`,
        response: `{
  "ok": true,
  "data": {
    "query": "QFC",
    "blockHeights": [],
    "tokens": [{ "address": "0x...", "name": "QFC Token", "symbol": "QFC" }],
    "contracts": [ ... ],
    "labels": [ ... ]
  }
}`,
      },
      {
        method: 'POST',
        path: '/search/labels',
        description: 'Batch-resolve addresses to human-readable labels (max 200).',
        body: `{ "addresses": ["0xaaaa...", "0xbbbb..."] }`,
        curl: `curl -X POST "${BASE}/search/labels" \\
  -H "Content-Type: application/json" \\
  -d '{"addresses":["0xaaaa...","0xbbbb..."]}'`,
        response: `{
  "ok": true,
  "data": {
    "0xaaaa...": { "label": "Deployer", "category": "system" },
    "0xbbbb...": { "label": "Faucet", "category": "infrastructure" }
  }
}`,
      },
    ],
  },

  /* ---- Analytics ------------------------------------------------------ */
  {
    id: 'analytics',
    title: 'Analytics',
    endpoints: [
      {
        method: 'GET',
        path: '/analytics',
        description: 'Network overview: totals, block time series (TPS, gas, block time), and validator stats.',
        curl: `curl "${BASE}/analytics"`,
        response: `{
  "ok": true,
  "data": {
    "overview": {
      "total_blocks": "42000",
      "total_transactions": "150000",
      "total_addresses": "3000",
      "total_gas_used": "8500000000"
    },
    "series": {
      "tps": [ { "label": "42000", "value": 3, "timestamp": 1709900000000 } ],
      "gas_used": [ ... ],
      "block_time": [ ... ]
    },
    "validators": [ ... ]
  }
}`,
      },
      {
        method: 'GET',
        path: '/analytics/daily',
        description: 'Historical daily aggregated metrics.',
        params: [
          { name: 'days', type: 'number', description: 'Number of days (1-365)', default: '30' },
        ],
        curl: `curl "${BASE}/analytics/daily?days=7"`,
        response: `{
  "ok": true,
  "data": {
    "days": 7,
    "stats": [
      { "date": "2026-03-01", "blocks": 1440, "transactions": 5000, "addresses": 120 }
    ]
  }
}`,
      },
      {
        method: 'GET',
        path: '/analytics/gas',
        description: 'Gas tracker: price percentiles, block gas usage, and top gas-consuming contracts.',
        curl: `curl "${BASE}/analytics/gas"`,
        response: `{
  "ok": true,
  "data": {
    "prices": {
      "low": "1000000000",
      "median": "2000000000",
      "average": "2500000000",
      "high": "10000000000",
      "sampleSize": 200
    },
    "blocks": [ ... ],
    "topContracts": [
      { "address": "0x...", "totalGas": "5000000", "txCount": 120 }
    ]
  }
}`,
      },
      {
        method: 'GET',
        path: '/analytics/export',
        description: 'Export analytics data as JSON or CSV.',
        params: [
          { name: 'type', type: 'string', description: '"tps" | "gas" | "block_time" | "validators" | "blocks" | "transactions"', default: 'tps' },
          { name: 'format', type: 'string', description: '"json" | "csv"', default: 'json' },
          { name: 'limit', type: 'number', description: 'Max rows for blocks/transactions (100-10000)', default: '1000' },
          { name: 'address', type: 'string', description: 'Filter transactions by address (type=transactions only)' },
        ],
        curl: `curl "${BASE}/analytics/export?type=blocks&format=csv&limit=100" -o blocks.csv`,
        response: `height,timestamp_ms,gas_used,gas_limit,tx_count,block_time_ms
42000,1709900000000,210000,30000000,3,5000`,
      },
    ],
  },

  /* ---- Network -------------------------------------------------------- */
  {
    id: 'network',
    title: 'Network',
    endpoints: [
      {
        method: 'GET',
        path: '/network',
        description: 'Network status: current epoch, node info, validators list, and total hashrate.',
        curl: `curl "${BASE}/network"`,
        response: `{
  "ok": true,
  "data": {
    "epoch": { "number": 100, "startBlock": 41000, "endBlock": 42000 },
    "nodeInfo": { "version": "0.5.0", "peers": 12 },
    "validators": [
      { "address": "0x...", "stake": "1000000", "providesCompute": true, "hashrate": 500 }
    ],
    "totalHashrate": 2500
  }
}`,
      },
    ],
  },

  /* ---- Stats ---------------------------------------------------------- */
  {
    id: 'stats',
    title: 'Stats',
    endpoints: [
      {
        method: 'GET',
        path: '/stats',
        description: 'Network overview stats and mini chart series for the homepage.',
        curl: `curl "${BASE}/stats"`,
        response: `{
  "ok": true,
  "data": {
    "stats": {
      "block_height": "42000",
      "total_transactions": "150000",
      "total_accounts": "3000",
      "avg_block_time_ms": 5000,
      "tps": 3.2
    },
    "series": { ... }
  }
}`,
      },
    ],
  },

  /* ---- Gas Oracle ------------------------------------------------------ */
  {
    id: 'gas-oracle',
    title: 'Gas Oracle',
    endpoints: [
      {
        method: 'GET',
        path: '/gas-oracle',
        description: 'Gas price oracle with percentile-based recommendations (slow/standard/fast), base fee, and suggested tip.',
        curl: `curl "${BASE}/gas-oracle"`,
        response: `{
  "ok": true,
  "data": {
    "slow": { "gwei": "1.00", "wait_sec": 30 },
    "standard": { "gwei": "2.00", "wait_sec": 15 },
    "fast": { "gwei": "3.50", "wait_sec": 5 },
    "base_fee_gwei": "0.50",
    "suggested_tip": "0.75",
    "block_number": 42000,
    "last_updated": "2026-03-08T12:00:00.000Z"
  }
}`,
      },
    ],
  },

  /* ---- Leaderboard ---------------------------------------------------- */
  {
    id: 'leaderboard',
    title: 'Leaderboard',
    endpoints: [
      {
        method: 'GET',
        path: '/leaderboard',
        description: 'Top accounts by balance, activity, block production, and contract interactions.',
        curl: `curl "${BASE}/leaderboard"`,
        response: `{
  "ok": true,
  "data": {
    "topBalances": [
      { "address": "0x...", "balance": "50000000000000000000000" }
    ],
    "mostActive": [
      { "address": "0x...", "sent": 500, "received": 300, "total": 800 }
    ],
    "topValidators": [
      { "address": "0x...", "blocks_produced": 1200 }
    ],
    "topContracts": [
      { "address": "0x...", "tx_count": 5000, "is_verified": true }
    ]
  }
}`,
      },
    ],
  },

  /* ---- Batch ---------------------------------------------------------- */
  {
    id: 'batch',
    title: 'Batch',
    endpoints: [
      {
        method: 'POST',
        path: '/batch/addresses',
        description: 'Query multiple addresses at once for balances, nonces, tx counts, labels, and contract status. Max 20 addresses.',
        body: `{ "addresses": ["0xaaaa...", "0xbbbb...", "0xcccc..."] }`,
        curl: `curl -X POST "${BASE}/batch/addresses" \\
  -H "Content-Type: application/json" \\
  -d '{"addresses":["0xaaaa...","0xbbbb..."]}'`,
        response: `{
  "ok": true,
  "data": {
    "addresses": [
      {
        "address": "0xaaaa...",
        "balance": "50000000000000000000",
        "nonce": 42,
        "tx_count": { "sent": 100, "received": 55 },
        "label": "Deployer",
        "is_contract": false
      }
    ]
  }
}`,
      },
    ],
  },

  /* ---- Auth ----------------------------------------------------------- */
  {
    id: 'auth',
    title: 'Authentication',
    endpoints: [
      {
        method: 'POST',
        path: '/auth/register',
        description: 'Register a new user account. Returns an access token and sets a refresh token cookie.',
        body: `{ "email": "user@example.com", "password": "securepassword" }`,
        curl: `curl -X POST "${BASE}/auth/register" \\
  -H "Content-Type: application/json" \\
  -d '{"email":"user@example.com","password":"securepassword"}'`,
        response: `{
  "ok": true,
  "data": {
    "user": { "id": "uuid", "email": "user@example.com", "displayName": null },
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}`,
      },
      {
        method: 'POST',
        path: '/auth/login',
        description: 'Log in with email and password.',
        body: `{ "email": "user@example.com", "password": "securepassword" }`,
        curl: `curl -X POST "${BASE}/auth/login" \\
  -H "Content-Type: application/json" \\
  -d '{"email":"user@example.com","password":"securepassword"}'`,
        response: `{
  "ok": true,
  "data": {
    "user": { "id": "uuid", "email": "user@example.com" },
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}`,
      },
      {
        method: 'POST',
        path: '/auth/refresh',
        description: 'Refresh the access token using the refresh token cookie. Performs token rotation.',
        curl: `curl -X POST "${BASE}/auth/refresh" --cookie "qfc_refresh=..."`,
        response: `{
  "ok": true,
  "data": { "accessToken": "eyJhbGciOiJIUzI1NiIs..." }
}`,
      },
      {
        method: 'POST',
        path: '/auth/logout',
        description: 'Revoke the refresh token and clear the cookie.',
        curl: `curl -X POST "${BASE}/auth/logout" --cookie "qfc_refresh=..."`,
        response: `{ "ok": true }`,
      },
      {
        method: 'GET',
        path: '/auth/me',
        description: 'Get the authenticated user profile. Requires Authorization header.',
        curl: `curl "${BASE}/auth/me" -H "Authorization: Bearer eyJ..."`,
        response: `{
  "ok": true,
  "data": {
    "user": { "id": "uuid", "email": "user@example.com", "displayName": "Alice" }
  }
}`,
      },
      {
        method: 'PATCH',
        path: '/auth/me',
        description: 'Update profile (display name, avatar URL). Requires auth.',
        body: `{ "displayName": "Alice", "avatarUrl": "https://..." }`,
        curl: `curl -X PATCH "${BASE}/auth/me" \\
  -H "Authorization: Bearer eyJ..." \\
  -H "Content-Type: application/json" \\
  -d '{"displayName":"Alice"}'`,
        response: `{
  "ok": true,
  "data": {
    "user": { "id": "uuid", "email": "user@example.com", "displayName": "Alice" }
  }
}`,
      },
      {
        method: 'POST',
        path: '/auth/password/forgot',
        description: 'Request a password reset email. Always returns success to prevent email enumeration.',
        body: `{ "email": "user@example.com" }`,
        curl: `curl -X POST "${BASE}/auth/password/forgot" \\
  -H "Content-Type: application/json" \\
  -d '{"email":"user@example.com"}'`,
        response: `{
  "ok": true,
  "data": { "message": "If that email is registered, a reset link has been sent." }
}`,
      },
      {
        method: 'POST',
        path: '/auth/password/reset',
        description: 'Reset password using a valid reset token.',
        body: `{ "token": "reset-token-uuid", "password": "newpassword123" }`,
        curl: `curl -X POST "${BASE}/auth/password/reset" \\
  -H "Content-Type: application/json" \\
  -d '{"token":"reset-token-uuid","password":"newpassword123"}'`,
        response: `{
  "ok": true,
  "data": { "message": "Password has been reset. Please log in again." }
}`,
      },
    ],
  },

  /* ---- Watchlist ------------------------------------------------------- */
  {
    id: 'watchlist',
    title: 'Watchlist',
    endpoints: [
      {
        method: 'GET',
        path: '/watchlist',
        description: 'List watched addresses with current balances. Requires auth.',
        curl: `curl "${BASE}/watchlist" -H "Authorization: Bearer eyJ..."`,
        response: `{
  "ok": true,
  "data": {
    "items": [
      {
        "address": "0x...",
        "label": "My Wallet",
        "balance": "50000000000000000000",
        "txCount": 155,
        "notifyIncoming": true,
        "notifyOutgoing": false
      }
    ]
  }
}`,
      },
      {
        method: 'POST',
        path: '/watchlist',
        description: 'Add an address to the watchlist (max 50). Requires auth.',
        body: `{
  "address": "0x...",
  "label": "My Wallet",
  "notifyIncoming": true,
  "notifyOutgoing": false,
  "notifyThreshold": "1000000000000000000",
  "webhookUrl": "https://..."
}`,
        curl: `curl -X POST "${BASE}/watchlist" \\
  -H "Authorization: Bearer eyJ..." \\
  -H "Content-Type: application/json" \\
  -d '{"address":"0x...","label":"My Wallet"}'`,
        response: `{
  "ok": true,
  "data": { "item": { "address": "0x...", "label": "My Wallet" } }
}`,
      },
      {
        method: 'PATCH',
        path: '/watchlist/:address',
        description: 'Update watchlist item settings (label, notifications, webhook). Requires auth.',
        body: `{ "label": "Updated Name", "notifyIncoming": false }`,
        curl: `curl -X PATCH "${BASE}/watchlist/0x..." \\
  -H "Authorization: Bearer eyJ..." \\
  -H "Content-Type: application/json" \\
  -d '{"label":"Updated Name"}'`,
        response: `{
  "ok": true,
  "data": { "item": { "address": "0x...", "label": "Updated Name" } }
}`,
      },
      {
        method: 'DELETE',
        path: '/watchlist/:address',
        description: 'Remove an address from the watchlist. Requires auth.',
        curl: `curl -X DELETE "${BASE}/watchlist/0x..." -H "Authorization: Bearer eyJ..."`,
        response: `{ "ok": true, "data": { "removed": true } }`,
      },
      {
        method: 'GET',
        path: '/watchlist/:address/check',
        description: 'Check if an address is in the authenticated user\'s watchlist.',
        curl: `curl "${BASE}/watchlist/0x.../check" -H "Authorization: Bearer eyJ..."`,
        response: `{
  "ok": true,
  "data": { "watching": true, "item": { "address": "0x...", "label": "My Wallet" } }
}`,
      },
    ],
  },

  /* ---- API Keys ------------------------------------------------------- */
  {
    id: 'api-keys',
    title: 'API Keys',
    endpoints: [
      {
        method: 'GET',
        path: '/api-keys',
        description: 'List user\'s API keys with usage stats. Requires auth.',
        curl: `curl "${BASE}/api-keys" -H "Authorization: Bearer eyJ..."`,
        response: `{
  "ok": true,
  "data": {
    "keys": [
      {
        "id": "uuid",
        "keyPrefix": "qfc_ab12",
        "name": "Production",
        "tier": "free",
        "rateLimit": 5,
        "dailyLimit": 10000,
        "requestsToday": 150,
        "usage": [{ "date": "2026-03-08", "count": 150 }]
      }
    ]
  }
}`,
      },
      {
        method: 'POST',
        path: '/api-keys',
        description: 'Create a new API key (max 3 per user). The full key is shown only once. Requires auth.',
        body: `{ "name": "Production" }`,
        curl: `curl -X POST "${BASE}/api-keys" \\
  -H "Authorization: Bearer eyJ..." \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Production"}'`,
        response: `{
  "ok": true,
  "data": {
    "key": "qfc_ab12cd34ef56...",
    "id": "uuid",
    "name": "Production",
    "tier": "free",
    "rateLimit": 5,
    "dailyLimit": 10000
  }
}`,
      },
      {
        method: 'PATCH',
        path: '/api-keys/:id',
        description: 'Rename an API key. Requires auth.',
        body: `{ "name": "New Name" }`,
        curl: `curl -X PATCH "${BASE}/api-keys/uuid" \\
  -H "Authorization: Bearer eyJ..." \\
  -H "Content-Type: application/json" \\
  -d '{"name":"New Name"}'`,
        response: `{ "ok": true, "data": { "updated": true } }`,
      },
      {
        method: 'DELETE',
        path: '/api-keys/:id',
        description: 'Revoke an API key. Requires auth.',
        curl: `curl -X DELETE "${BASE}/api-keys/uuid" -H "Authorization: Bearer eyJ..."`,
        response: `{ "ok": true, "data": { "revoked": true } }`,
      },
      {
        method: 'GET',
        path: '/api-keys/:id/usage',
        description: 'Usage stats for an API key over the last N days.',
        params: [
          { name: 'days', type: 'number', description: 'Number of days (1-90)', default: '30' },
        ],
        curl: `curl "${BASE}/api-keys/uuid/usage?days=7" -H "Authorization: Bearer eyJ..."`,
        response: `{
  "ok": true,
  "data": {
    "usage": [
      { "date": "2026-03-02", "count": 120 },
      { "date": "2026-03-03", "count": 85 }
    ]
  }
}`,
      },
    ],
  },

  /* ---- Health --------------------------------------------------------- */
  {
    id: 'health',
    title: 'Health',
    endpoints: [
      {
        method: 'GET',
        path: '/health',
        description: 'Health check: database connectivity, RPC status, and indexer lag.',
        curl: `curl "${BASE}/health"`,
        response: `{
  "ok": true,
  "data": {
    "db": true,
    "rpc": true,
    "indexer_lag": 0,
    "uptime_seconds": 86400
  }
}`,
      },
    ],
  },
];

/* ---------------------------------------------------------------------------
 *  Helper components (server-rendered)
 * -------------------------------------------------------------------------*/

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    POST: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
    PATCH: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    DELETE: 'bg-red-500/15 text-red-400 border-red-500/25',
  };
  return (
    <span
      className={`inline-flex min-w-[60px] items-center justify-center rounded border px-2 py-0.5 text-xs font-bold tracking-wide ${
        colors[method] ?? 'bg-slate-500/15 text-slate-400 border-slate-500/25'
      }`}
    >
      {method}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  // Rendered as a client island via a small inline script to keep the page a server component
  return (
    <button
      data-copy={text}
      className="copy-btn absolute right-2 top-2 rounded border border-slate-700 bg-slate-800 px-2 py-1 text-[10px] text-slate-400 opacity-0 transition-opacity hover:text-white group-hover:opacity-100"
      title="Copy"
    >
      Copy
    </button>
  );
}

/* ---------------------------------------------------------------------------
 *  Page
 * -------------------------------------------------------------------------*/

export default function ApiDocsPage() {
  const totalEndpoints = CATEGORIES.reduce((sum, c) => sum + c.endpoints.length, 0);

  return (
    <>
      {/* Copy-button script */}
      <script
        dangerouslySetInnerHTML={{
          __html: `document.addEventListener('click',function(e){var btn=e.target.closest('.copy-btn');if(!btn)return;var t=btn.getAttribute('data-copy');navigator.clipboard.writeText(t).then(function(){btn.textContent='Copied!';setTimeout(function(){btn.textContent='Copy'},1500)})});
document.addEventListener('click',function(e){var s=e.target.closest('[data-toggle]');if(!s)return;var id=s.getAttribute('data-toggle');var el=document.getElementById(id);if(!el)return;var open=el.style.display!=='none';el.style.display=open?'none':'block';s.querySelector('.toggle-icon').textContent=open?'+':'-'})`,
        }}
      />

      <main className="mx-auto flex max-w-[1400px] gap-0 px-4 py-10 lg:gap-8">
        {/* ---- Sidebar ---- */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <nav className="sticky top-20 space-y-1">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              API Reference
            </p>
            {CATEGORIES.map((cat) => (
              <a
                key={cat.id}
                href={`#${cat.id}`}
                className="block rounded-md px-3 py-1.5 text-sm text-slate-500 transition-colors hover:bg-slate-800/50 hover:text-white dark:hover:bg-slate-800/50"
              >
                {cat.title}
                <span className="ml-1.5 text-xs text-slate-600">{cat.endpoints.length}</span>
              </a>
            ))}
            <hr className="!my-3 border-slate-800" />
            <a href="#authentication" className="block rounded-md px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-800/50 hover:text-white">
              Authentication
            </a>
            <a href="#rate-limiting" className="block rounded-md px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-800/50 hover:text-white">
              Rate Limiting
            </a>
            <a href="#response-format" className="block rounded-md px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-800/50 hover:text-white">
              Response Format
            </a>
          </nav>
        </aside>

        {/* ---- Main content ---- */}
        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              QFC Explorer API
            </h1>
            <p className="mt-2 text-slate-500">
              Complete REST API reference for the QFC blockchain explorer.{' '}
              <span className="text-slate-600">{totalEndpoints} endpoints</span> across{' '}
              <span className="text-slate-600">{CATEGORIES.length} categories</span>.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-4 py-2">
                <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Base URL</p>
                <code className="text-sm text-cyan-400">{BASE}</code>
              </div>
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-4 py-2">
                <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Format</p>
                <code className="text-sm text-slate-300">JSON</code>
              </div>
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-4 py-2">
                <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Chain</p>
                <code className="text-sm text-slate-300">QFC Testnet (9000)</code>
              </div>
            </div>
          </div>

          {/* Response Format */}
          <section id="response-format" className="mb-12 scroll-mt-20">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Response Format</h2>
            <p className="text-sm text-slate-500 mb-4">
              All endpoints return a consistent JSON envelope. Check the <code className="text-cyan-400">ok</code> field to determine success or failure.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-1.5 text-xs font-medium text-emerald-400">Success</p>
                <pre className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4 text-sm text-slate-300 overflow-x-auto">
{`{
  "ok": true,
  "data": { ... }
}`}
                </pre>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-medium text-red-400">Error</p>
                <pre className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4 text-sm text-slate-300 overflow-x-auto">
{`{
  "ok": false,
  "error": "Human-readable message"
}`}
                </pre>
              </div>
            </div>
          </section>

          {/* Authentication */}
          <section id="authentication" className="mb-12 scroll-mt-20">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Authentication</h2>
            <p className="text-sm text-slate-500 mb-4">
              Most public endpoints (blocks, transactions, tokens, search, etc.) are accessible without authentication.
              User-specific endpoints (watchlist, API keys, profile) require a JWT access token.
            </p>
            <div className="space-y-4 text-sm text-slate-400">
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4">
                <p className="font-medium text-slate-300 mb-2">JWT Access Tokens</p>
                <p>
                  Obtained via <code className="text-cyan-400">/auth/login</code> or <code className="text-cyan-400">/auth/register</code>.
                  Pass as a Bearer token in the <code className="text-cyan-400">Authorization</code> header:
                </p>
                <pre className="mt-2 rounded border border-slate-700 bg-slate-900 p-3 text-xs text-slate-300 overflow-x-auto">
                  Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
                </pre>
              </div>
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4">
                <p className="font-medium text-slate-300 mb-2">API Keys</p>
                <p>
                  For programmatic access with higher rate limits. Create via <code className="text-cyan-400">/api-keys</code> (requires JWT auth).
                  Pass the key as a query parameter or header:
                </p>
                <pre className="mt-2 rounded border border-slate-700 bg-slate-900 p-3 text-xs text-slate-300 overflow-x-auto">
{`# Query parameter
curl "${BASE}/blocks?apikey=qfc_ab12cd34..."

# Header
curl "${BASE}/blocks" -H "X-Api-Key: qfc_ab12cd34..."`}
                </pre>
              </div>
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4">
                <p className="font-medium text-slate-300 mb-2">Refresh Tokens</p>
                <p>
                  Stored as an HTTP-only cookie (<code className="text-cyan-400">qfc_refresh</code>). Refreshed automatically via
                  {' '}<code className="text-cyan-400">/auth/refresh</code> with token rotation for security.
                </p>
              </div>
            </div>
          </section>

          {/* Rate Limiting */}
          <section id="rate-limiting" className="mb-12 scroll-mt-20">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Rate Limiting</h2>
            <p className="text-sm text-slate-500 mb-4">
              Requests are rate-limited per IP (anonymous) or per API key (authenticated).
              Exceeding limits returns <code className="text-cyan-400">429 Too Many Requests</code>.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-left">
                    <th className="pb-2 pr-6 font-medium text-slate-400">Tier</th>
                    <th className="pb-2 pr-6 font-medium text-slate-400">Rate Limit</th>
                    <th className="pb-2 pr-6 font-medium text-slate-400">Daily Limit</th>
                    <th className="pb-2 font-medium text-slate-400">Notes</th>
                  </tr>
                </thead>
                <tbody className="text-slate-400">
                  <tr className="border-b border-slate-800/50">
                    <td className="py-2 pr-6 text-slate-300">Anonymous</td>
                    <td className="py-2 pr-6">100 req/min/IP</td>
                    <td className="py-2 pr-6">--</td>
                    <td className="py-2">No API key required</td>
                  </tr>
                  <tr className="border-b border-slate-800/50">
                    <td className="py-2 pr-6 text-slate-300">Free</td>
                    <td className="py-2 pr-6">5 req/sec</td>
                    <td className="py-2 pr-6">10,000</td>
                    <td className="py-2">Default tier for new API keys</td>
                  </tr>
                  <tr className="border-b border-slate-800/50">
                    <td className="py-2 pr-6 text-slate-300">Standard</td>
                    <td className="py-2 pr-6">20 req/sec</td>
                    <td className="py-2 pr-6">100,000</td>
                    <td className="py-2">Available on request</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-6 text-slate-300">Pro</td>
                    <td className="py-2 pr-6">50 req/sec</td>
                    <td className="py-2 pr-6">Unlimited</td>
                    <td className="py-2">Available on request</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-slate-600">
              Auth endpoints (<code>/auth/*</code>) have a stricter limit of 10 requests per minute per IP.
            </p>
          </section>

          <hr className="my-10 border-slate-200 dark:border-slate-800" />

          {/* Endpoint categories */}
          {CATEGORIES.map((cat) => (
            <section key={cat.id} id={cat.id} className="mb-14 scroll-mt-20">
              <h2 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">
                {cat.title}
              </h2>

              <div className="space-y-4">
                {cat.endpoints.map((ep, i) => {
                  const toggleId = `${cat.id}-${i}`;
                  return (
                    <div
                      key={toggleId}
                      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 overflow-hidden"
                    >
                      {/* Summary row */}
                      <button
                        data-toggle={toggleId}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <span className="toggle-icon w-4 shrink-0 text-center text-slate-500 font-mono">+</span>
                        <MethodBadge method={ep.method} />
                        <code className="text-sm font-medium text-slate-200 dark:text-slate-200 text-slate-700">{ep.path}</code>
                        <span className="ml-auto text-xs text-slate-500 hidden sm:inline">{ep.description.slice(0, 60)}{ep.description.length > 60 ? '...' : ''}</span>
                      </button>

                      {/* Expandable detail */}
                      <div id={toggleId} style={{ display: 'none' }} className="border-t border-slate-200 dark:border-slate-800 px-4 py-4 space-y-4">
                        <p className="text-sm text-slate-400">{ep.description}</p>

                        {/* Query parameters */}
                        {ep.params && ep.params.length > 0 && (
                          <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Parameters</p>
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="border-b border-slate-700 text-left">
                                    <th className="pb-1.5 pr-4 font-medium text-slate-400">Name</th>
                                    <th className="pb-1.5 pr-4 font-medium text-slate-400">Type</th>
                                    <th className="pb-1.5 pr-4 font-medium text-slate-400">Default</th>
                                    <th className="pb-1.5 font-medium text-slate-400">Description</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {ep.params.map((p) => (
                                    <tr key={p.name} className="border-b border-slate-800/40">
                                      <td className="py-1.5 pr-4">
                                        <code className="text-cyan-400">{p.name}</code>
                                        {p.required && <span className="ml-1 text-red-400">*</span>}
                                      </td>
                                      <td className="py-1.5 pr-4 text-slate-500">{p.type}</td>
                                      <td className="py-1.5 pr-4 text-slate-600">{p.default ?? '--'}</td>
                                      <td className="py-1.5 text-slate-400">{p.description}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Request body */}
                        {ep.body && (
                          <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Request Body</p>
                            <pre className="group relative rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-xs text-slate-300 overflow-x-auto">
                              <CopyButton text={ep.body} />
                              {ep.body}
                            </pre>
                          </div>
                        )}

                        {/* Curl example */}
                        <div>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Example Request</p>
                          <pre className="group relative rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-xs text-emerald-300 overflow-x-auto">
                            <CopyButton text={ep.curl} />
                            {ep.curl}
                          </pre>
                        </div>

                        {/* Response example */}
                        <div>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Example Response</p>
                          <pre className="group relative rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-xs text-slate-300 overflow-x-auto max-h-80 overflow-y-auto">
                            <CopyButton text={ep.response} />
                            {ep.response}
                          </pre>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </main>
    </>
  );
}
