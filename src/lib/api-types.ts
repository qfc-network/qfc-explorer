export type ApiOk<T> = { ok: true; data: T };
export type ApiError = { ok: false; error: string };

export type ApiBlocksList = ApiOk<{
  page: number;
  limit: number;
  order: string;
  producer?: string | null;
  items: Array<{
    hash: string;
    height: string;
    parent_hash: string | null;
    producer: string | null;
    timestamp_ms: string;
    tx_count: number;
  }>;
}>;

export type ApiBlockDetail = ApiOk<{
  block: {
    hash: string;
    height: string;
    parent_hash: string | null;
    producer: string | null;
    timestamp_ms: string;
    gas_limit: string;
    gas_used: string;
    state_root: string | null;
    transactions_root: string | null;
    receipts_root: string | null;
  };
  page: number;
  limit: number;
  order: string;
  transactions: Array<{
    hash: string;
    block_height: string;
    from_address: string;
    to_address: string | null;
    value: string;
    status: string;
  }>;
}>;

export type ApiTransactionsList = ApiOk<{
  page: number;
  limit: number;
  order: string;
  address?: string | null;
  status?: string | null;
  items: Array<{
    hash: string;
    block_height: string;
    from_address: string;
    to_address: string | null;
    value: string;
    status: string;
  }>;
}>;

export type ApiTransactionDetail = ApiOk<{
  transaction: {
    hash: string;
    block_height: string;
    from_address: string;
    to_address: string | null;
    value: string;
    status: string;
    gas_limit: string;
    gas_price: string;
    nonce: string;
    data: string | null;
  };
  logs: Array<{
    contract_address: string;
    topic0: string | null;
    topic1: string | null;
    topic2: string | null;
    topic3: string | null;
    data: string | null;
  }>;
}>;

export type ApiAddressDetail = ApiOk<{
  address: {
    address: string;
    balance: string;
    nonce: string;
    last_seen_block: string;
  };
  stats: { sent: string; received: string } | null;
  page: number;
  limit: number;
  order: string;
  transactions: Array<{
    hash: string;
    block_height: string;
    from_address: string;
    to_address: string | null;
    value: string;
    status: string;
  }>;
}>;

export type ApiSearch = ApiOk<{
  query: string;
  blockByHeight: { height: string } | null;
  blockByHash: { hash: string; height: string } | null;
  transaction: { hash: string } | null;
  address: { address: string } | null;
}>;

export type ApiSearchSuggest = ApiOk<{
  query: string;
  blockHeights: string[];
  blockHashes: Array<{ hash: string; height: string }>;
  txHashes: Array<{ hash: string; block_height: string }>;
  addresses: string[];
}>;

export type ApiNetwork = ApiOk<{
  epoch: { number: string; startTime: string; durationMs: string };
  nodeInfo: { version: string; chainId: string; peerCount: number; isValidator: boolean; syncing: boolean };
  validators: Array<{ address: string; stake: string; contributionScore: string; uptime: string; isActive: boolean }>;
}>;

export type ApiStats = ApiOk<{
  stats: {
    latest_block: string | null;
    latest_timestamp_ms: string | null;
    avg_block_time_ms: string | null;
    tps: string | null;
    active_addresses: string | null;
  };
  series: {
    block_time_ms: Array<{ label: string; value: number }>;
    tps: Array<{ label: string; value: number }>;
    active_addresses: Array<{ label: string; value: number }>;
  };
}>;

export type ApiTokensList = ApiOk<{
  page: number;
  limit: number;
  order: string;
  items: Array<{
    address: string;
    name: string | null;
    symbol: string | null;
    decimals: number | null;
    total_supply: string | null;
    last_seen_block: string | null;
  }>;
}>;

export type ApiTokenDetail = ApiOk<{
  token: {
    address: string;
    name: string | null;
    symbol: string | null;
    decimals: number | null;
    total_supply: string | null;
    last_seen_block: string | null;
  };
  page: number;
  limit: number;
  order: string;
  transfers: Array<{
    tx_hash: string;
    block_height: string;
    from_address: string;
    to_address: string;
    value: string;
  }>;
}>;
