const en = {
  // Navigation
  'nav.home': 'Home',
  'nav.blockchain': 'Blockchain',
  'nav.blocks': 'Blocks',
  'nav.transactions': 'Transactions',
  'nav.pendingTxs': 'Pending Txs',
  'nav.gasTracker': 'Gas Tracker',
  'nav.tokens': 'Tokens',
  'nav.tokenList': 'Token List (ERC-20)',
  'nav.tokenTransfers': 'Token Transfers',
  'nav.approvalChecker': 'Approval Checker',
  'nav.tokenomics': 'QFC Tokenomics',
  'nav.contracts': 'Contracts',
  'nav.verifiedContracts': 'Verified Contracts',
  'nav.abiTools': 'ABI Tools',
  'nav.aiInference': 'AI Inference',
  'nav.network': 'Network',
  'nav.validators': 'Validators',
  'nav.analytics': 'Analytics',
  'nav.leaderboard': 'Leaderboard',
  'nav.governance': 'Governance',

  // Search
  'search.placeholder': 'Search by Address / Tx Hash / Block / Token',
  'search.button': 'Search',
  'search.block': 'Block',
  'search.transaction': 'Transaction',
  'search.address': 'Address',

  // Homepage
  'home.title': 'QFC Blockchain Explorer',
  'home.subtitle': 'Search transactions, blocks, addresses, tokens, and AI inference tasks.',
  'home.latestBlocks': 'Latest Blocks',
  'home.latestTransactions': 'Latest Transactions',
  'home.viewAll': 'View all',

  // Stat cards
  'stats.blockHeight': 'Block Height',
  'stats.blockTime': 'Block Time',
  'stats.tps': 'TPS',
  'stats.addresses': 'Addresses',
  'stats.chainId': 'Chain ID',
  'stats.finality': 'Finality',

  // Charts
  'chart.blockTime': 'Block Time (ms)',
  'chart.txsPerBlock': 'Txs per Block',
  'chart.activeAddresses': 'Active Addresses',

  // Common labels
  'common.block': 'Block',
  'common.transaction': 'Transaction',
  'common.address': 'Address',
  'common.value': 'Value',
  'common.age': 'Age',
  'common.from': 'From',
  'common.to': 'To',
  'common.hash': 'Hash',
  'common.height': 'Height',
  'common.status': 'Status',
  'common.gasUsed': 'Gas Used',
  'common.gasPrice': 'Gas Price',
  'common.loading': 'Loading...',
  'common.noData': 'No data available',
  'common.page': 'Page',
  'common.of': 'of',
  'common.back': 'Back',
  'common.previous': 'Previous',
  'common.next': 'Next',
  'common.producer': 'Producer',
  'common.txs': 'Txs',
  'common.timestamp': 'Timestamp',
  'common.validatedBy': 'Validated by',
  'common.unknownProducer': 'Unknown producer',
  'common.contractCreation': 'Contract Creation',

  // Footer
  'footer.docs': 'Docs',
  'footer.faucet': 'Faucet',

  // Blocks page
  'blocks.title': 'Blocks',
  'blocks.showingPage': 'Showing page',
  'blocks.noBlocks': 'No blocks indexed yet.',

  // Locale switcher
  'locale.switchLanguage': 'Switch Language',
} as const;

export type TranslationKey = keyof typeof en;
export default en;
