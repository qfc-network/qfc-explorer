export type ApiOk<T> = { ok: true; data: T };
export type ApiError = { ok: false; error: string };

export type DefiLabel = {
  action: string;
  category: string;
  protocolName?: string;
  icon?: string;
};

export type ApiBlocksList = ApiOk<{
  page: number;
  limit: number;
  order: string;
  producer?: string | null;
  next_cursor?: string | null;
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
  next_cursor?: string | null;
  items: Array<{
    hash: string;
    block_height: string;
    from_address: string;
    to_address: string | null;
    value: string;
    status: string;
    defi_label?: DefiLabel;
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
    gas_used: string | null;
    nonce: string;
    data: string | null;
    type: string | null;
    timestamp_ms: string | null;
  };
  defi_label?: DefiLabel;
  logs: Array<{
    contract_address: string;
    topic0: string | null;
    topic1: string | null;
    topic2: string | null;
    topic3: string | null;
    data: string | null;
  }>;
  source?: 'rpc';
}>;

export type ApiAddressDetail = ApiOk<{
  address: {
    address: string;
    balance: string;
    nonce: string;
    last_seen_block: string;
  };
  stats: { sent: string; received: string } | null;
  analysis?: {
    sent_count: string;
    received_count: string;
    sent_value: string;
    received_value: string;
  } | null;
  contract?: {
    creator_tx_hash: string | null;
    created_at_block: string | null;
    code_hash: string | null;
    is_verified: boolean;
  } | null;
  tokenHoldings: Array<{
    token_address: string;
    token_name: string | null;
    token_symbol: string | null;
    token_decimals: number | null;
    token_type: string;
    balance: string;
  }>;
  nftHoldings: Array<{
    token_address: string;
    token_name: string | null;
    token_symbol: string | null;
    token_type: string;
    token_id: string;
    balance: string;
  }>;
  tab: string;
  page: number;
  limit: number;
  order: string;
  next_cursor?: string | null;
  transactions: Array<{
    hash: string;
    block_height: string;
    from_address: string;
    to_address: string | null;
    value: string;
    status: string;
  }>;
  tokenTransfers: Array<{
    tx_hash: string;
    block_height: string;
    token_address: string;
    from_address: string;
    to_address: string;
    value: string;
    token_name: string | null;
    token_symbol: string | null;
    token_decimals: number | null;
  }>;
  internalTxs?: Array<{
    tx_hash: string;
    block_height: string;
    trace_index: number;
    call_type: string;
    depth: number;
    from_address: string;
    to_address: string;
    value: string;
    gas: string;
    gas_used: string;
    error: string | null;
  }>;
}>;

export interface FlowNode {
  address: string;
  label?: string;
}

export interface FlowLink {
  source: string;
  target: string;
  value: string;
  token?: string;
  type: 'native' | 'erc20' | 'internal';
}

export type ApiTxFlow = ApiOk<{
  nodes: FlowNode[];
  links: FlowLink[];
}>;

export type TokenSearchResult = { address: string; name: string | null; symbol: string | null; token_type: string };

export type ApiSearch = ApiOk<{
  query: string;
  blockByHeight: { height: string } | null;
  blockByHash: { hash: string; height: string } | null;
  transaction: { hash: string } | null;
  address: { address: string } | null;
  tokens: TokenSearchResult[];
}>;

export type ApiSearchSuggest = ApiOk<{
  query: string;
  blockHeights: string[];
  blockHashes: Array<{ hash: string; height: string }>;
  txHashes: Array<{ hash: string; block_height: string }>;
  addresses: string[];
  tokens?: TokenSearchResult[];
}>;

export type ApiNetwork = ApiOk<{
  epoch: { number: string; startTime: string; durationMs: string };
  nodeInfo: { version: string; chainId: string; peerCount: number; isValidator: boolean; syncing: boolean };
  validators: Array<{
    address: string;
    stake: string;
    contributionScore: string;
    uptime: string;
    isActive: boolean;
    providesCompute: boolean;
    hashrate: string;
    inferenceScore: string;
    computeMode: string;
    tasksCompleted: string;
  }>;
  totalHashrate?: string;
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
    token_type: string;
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
    token_type: string;
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
    token_id: string | null;
  }>;
}>;

export type ApiTokenHolders = ApiOk<{
  token: string;
  holders: Array<{
    address: string;
    balance: string;
  }>;
  nftHolders: Array<{
    address: string;
    token_id: string;
    balance: string;
  }>;
}>;

export type ApiGovernanceModels = ApiOk<{
  proposals: Array<{
    proposalId: string;
    proposer: string;
    modelName: string;
    modelVersion: string;
    description: string;
    minMemoryMb: number;
    minTier: string;
    sizeMb: number;
    votesFor: number;
    votesAgainst: number;
    status: string;
    createdAt: number;
    votingDeadline: number;
  }>;
  models: Array<{
    name: string;
    version: string;
    minMemoryMb: number;
    minTier: string;
    approved: boolean;
  }>;
}>;

export type ApiInference = ApiOk<{
  stats: {
    tasksCompleted: string;
    avgTimeMs: string;
    flopsTotal: string;
    passRate: string;
  };
  computeInfo: {
    backend: string;
    supportedModels: string[];
    gpuMemoryMb: number;
    inferenceScore: string;
    gpuTier: string;
    providesCompute: boolean;
  };
  validators: Array<{
    address: string;
    stake: string;
    contributionScore: string;
    uptime: string;
    isActive: boolean;
    providesCompute: boolean;
    hashrate: string;
    inferenceScore: string;
    computeMode: string;
    tasksCompleted: string;
  }>;
  models: Array<{
    name: string;
    version: string;
    minMemoryMb: number;
    minTier: string;
    approved: boolean;
  }>;
}>;

export type ApiTaskStatus = ApiOk<{
  taskId: string;
  status: string;
  submitter: string;
  taskType: string;
  modelId: string;
  createdAt: number;
  deadline: number;
  maxFee: string;
  result?: string;
  resultSize?: number;
  minerAddress?: string;
  executionTimeMs?: number;
}>;

export type ApiTxPool = ApiOk<{
  pending: Array<{
    hash: string;
    from: string;
    to: string | null;
    value: string;
    gasPrice: string;
    nonce: number;
    gas: string | null;
  }>;
  count: number;
  queued: number;
  sort: string;
  order: string;
  limit: number;
}>;

export type ApiTxPoolStatus = ApiOk<{
  pending: number;
  queued: number;
}>;

export type ApiGasTracker = ApiOk<{
  prices: {
    low: string;
    median: string;
    average: string;
    high: string;
    sampleSize: number;
  };
  blocks: Array<{
    height: string;
    gasUsed: string;
    gasLimit: string;
    txCount: number;
    timestampMs: string;
  }>;
  topContracts: Array<{
    address: string;
    totalGas: string;
    txCount: number;
  }>;
}>;

export type ApiGasOracle = ApiOk<{
  slow: { gwei: string; wait_sec: number };
  standard: { gwei: string; wait_sec: number };
  fast: { gwei: string; wait_sec: number };
  base_fee_gwei: string | null;
  suggested_tip?: string;
  block_number: number;
  last_updated: string;
}>;

export type ApiAdminIndexer = ApiOk<{
  items: Array<{ key: string; value: string; updated_at: string }>;
  lastBatch: {
    fromBlock: string;
    toBlock: string;
    blocks: number;
    transactions: number;
    durationMs: number;
    timestamp: string;
  } | null;
  failed: {
    block: string;
    error: string;
    timestamp: string;
  } | null;
}>;

export type ApiAdminDb = ApiOk<{
  pool: { total: number; idle: number; waiting: number };
}>;

export type ApiAdminRateLimit = ApiOk<{
  config: { windowMs: number; maxRequests: number; windowSeconds: number };
  stats: { activeIps: number; totalRequests: number; limitedRequests: number; limitedPercentage: string };
  topIps: Array<{ ip: string; requests: number; limited: boolean; resetAt: number }>;
  recentRequests: Array<{ ip: string; path: string; timestamp: number; limited: boolean }>;
}>;

export type ApiAdminArchive = ApiOk<{
  threshold: string;
  tables: Array<{ table: string; rows: number }>;
  recentOperations: Array<{ table_name: string; partition_key: string; rows_archived: number; archived_at: string }>;
}>;

export type ApiAdminLabels = ApiOk<{
  labels: Array<{ address: string; label: string; category: string | null; description: string | null; website: string | null; created_at: string }>;
}>;

export type ApiAdminWs = ApiOk<{
  connections: number;
  channels: number;
  addresses: number;
  polling: boolean;
}>;

export type ApiAdminRedis = ApiOk<{
  mode: string;
  nodes: number;
  connected: boolean;
}>;

export type ApiBatchAddressItem = {
  address: string;
  balance: string;
  nonce: number;
  tx_count: { sent: number; received: number };
  label: string | null;
  is_contract: boolean;
};

export type ApiBatchAddresses = ApiOk<{
  addresses: ApiBatchAddressItem[];
}>;

export type MultisigInfo = {
  type: 'safe';
  version: string;
  owners: string[];
  threshold: number;
  nonce: number;
};

export type ApiMultisig = ApiOk<MultisigInfo | null>;

// --- Contract Comments & Ratings ---

export type ContractComment = {
  id: string;
  contract_address: string;
  user_id: string;
  body: string;
  is_flagged: boolean;
  created_at: string;
  updated_at: string;
  display_name: string | null;
  email: string;
};

export type ApiContractComments = ApiOk<{
  comments: ContractComment[];
  total: number;
  page: number;
  limit: number;
}>;

export type ApiContractRating = ApiOk<{
  average: number | null;
  count: number;
  userRating: number | null;
}>;

export type ApiContractRatingUpsert = ApiOk<{
  rating: {
    contract_address: string;
    user_id: string;
    rating: number;
    created_at: string;
  };
  average: number | null;
  count: number;
}>;

// --- Contract Diff ---

export type DiffHunkLine = {
  type: 'same' | 'added' | 'removed';
  content: string;
};

export type DiffHunk = {
  a_start: number;
  b_start: number;
  lines: DiffHunkLine[];
};

export type DiffStats = {
  additions: number;
  deletions: number;
  unchanged: number;
};

export type DiffContractInfo = {
  address: string;
  name: string | null;
  compiler: string;
};

export type ApiContractDiff = ApiOk<{
  contract_a: DiffContractInfo;
  contract_b: DiffContractInfo;
  hunks: DiffHunk[];
  stats: DiffStats;
  abi_diff: {
    added: string[];
    removed: string[];
    modified: string[];
  };
}>;

// --- NFT Gallery & Detail ---

export type NftGalleryItem = {
  token_id: string;
  owner: string;
  balance: string;
  image: string | null;
  name: string | null;
};

export type ApiNftGallery = ApiOk<{
  items: NftGalleryItem[];
  total: number;
  page: number;
  limit: number;
}>;

export type NftTransfer = {
  tx_hash: string;
  block_height: string;
  from_address: string;
  to_address: string;
  value: string;
};

export type NftAttribute = {
  trait_type?: string;
  value?: string | number;
};

export type ApiNftDetail = ApiOk<{
  token: {
    name: string | null;
    symbol: string | null;
    standard: string;
  };
  nft: {
    token_id: string;
    owner: string | null;
    metadata: {
      name: string | null;
      description: string | null;
      image: string | null;
      attributes: NftAttribute[];
    };
    transfers: NftTransfer[];
  };
}>;

// --- Validators ---

export type ValidatorItem = {
  address: string;
  blocks_produced: number;
  first_block: string;
  last_block: string;
  last_active_ms: string;
  total_gas_used: string;
  label: string | null;
  category: string | null;
};

export type ApiValidatorsList = ApiOk<{
  page: number;
  limit: number;
  sort: string;
  total_validators: number;
  total_blocks: number;
  items: ValidatorItem[];
}>;

export type ApiValidatorDetail = ApiOk<{
  stats: {
    address: string;
    blocks_produced: number;
    first_block: string;
    last_block: string;
    last_active_ms: string;
    total_gas_used: string;
    avg_gas_used: string;
    total_blocks: number;
    avg_block_time_ms: string | null;
    label: string | null;
    category: string | null;
  };
  recent_blocks: Array<{
    hash: string;
    height: string;
    timestamp_ms: string;
    tx_count: number;
    gas_used: string;
  }>;
  timeline: Array<{
    date: string;
    block_count: number;
  }>;
}>;

// --- Balance History ---

export type BalanceHistoryPoint = {
  date: string;
  balance: string;
};

export type ApiBalanceHistory = ApiOk<{
  points: BalanceHistoryPoint[];
  current_balance: string;
}>;

// --- Activity Heatmap ---

export type ActivityDay = {
  date: string;
  count: number;
};

export type ApiAddressActivity = ApiOk<{
  days: ActivityDay[];
}>;

// --- Rich List ---

export type RichListAccount = {
  address: string;
  balance: string;
  nonce: string;
  is_contract: boolean;
  tx_count: number;
  label: string | null;
  label_category: string | null;
};

export type ApiRichList = ApiOk<{
  page: number;
  limit: number;
  type: string;
  total: number;
  total_supply: string;
  top10_balance: string;
  items: RichListAccount[];
}>;

export type ApiTokenTransfersList = ApiOk<{
  page: number;
  limit: number;
  order: string;
  type: string | null;
  items: Array<{
    tx_hash: string;
    block_height: string;
    token_address: string;
    from_address: string;
    to_address: string;
    value: string;
    token_id: string | null;
    token_name: string | null;
    token_symbol: string | null;
    token_decimals: number | null;
    token_type: string | null;
  }>;
}>;
