import 'dotenv/config';
import { getPool } from '@/db/pool';
import type { PoolClient } from 'pg';
import { RpcClient } from './rpc';
import type { RpcBlock, RpcReceipt, RpcTransaction } from './types';
import { hexToBigIntString, hexToBuffer, stripHexPrefix } from './utils';

const INDEXER_STATE_KEY = 'last_processed_height';
const INDEXER_STATS_KEY = 'last_batch_stats';
const INDEXER_FAILED_KEY = 'failed_blocks';

async function getLastProcessedHeight(): Promise<bigint | null> {
  const pool = getPool();
  const result = await pool.query(
    'SELECT value FROM indexer_state WHERE key = $1',
    [INDEXER_STATE_KEY]
  );
  if (result.rowCount === 0) {
    return null;
  }
  try {
    return BigInt(result.rows[0].value);
  } catch {
    return null;
  }
}

async function setLastProcessedHeight(height: bigint): Promise<void> {
  const pool = getPool();
  await pool.query(
    `
    INSERT INTO indexer_state (key, value)
    VALUES ($1, $2)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `,
    [INDEXER_STATE_KEY, height.toString(10)]
  );
}

function parseHeight(hexValue: string): bigint {
  const parsed = hexToBigIntString(hexValue);
  if (!parsed) {
    throw new Error(`Invalid hex height: ${hexValue}`);
  }
  return BigInt(parsed);
}

async function upsertBlock(client: PoolClient, block: RpcBlock): Promise<void> {
  const height = parseHeight(block.number);

  await client.query(
    `
    INSERT INTO blocks (
      hash,
      height,
      parent_hash,
      state_root,
      transactions_root,
      receipts_root,
      producer,
      timestamp_ms,
      gas_limit,
      gas_used,
      extra_data,
      tx_count
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    ON CONFLICT (hash) DO UPDATE SET
      height = EXCLUDED.height,
      parent_hash = EXCLUDED.parent_hash,
      state_root = EXCLUDED.state_root,
      transactions_root = EXCLUDED.transactions_root,
      receipts_root = EXCLUDED.receipts_root,
      producer = EXCLUDED.producer,
      timestamp_ms = EXCLUDED.timestamp_ms,
      gas_limit = EXCLUDED.gas_limit,
      gas_used = EXCLUDED.gas_used,
      extra_data = EXCLUDED.extra_data,
      tx_count = EXCLUDED.tx_count
    `,
    [
      block.hash,
      height.toString(10),
      block.parentHash,
      block.stateRoot,
      block.transactionsRoot,
      block.receiptsRoot,
      block.miner,
      parseHeight(block.timestamp).toString(10),
      parseHeight(block.gasLimit).toString(10),
      parseHeight(block.gasUsed).toString(10),
      hexToBuffer(block.extraData),
      block.transactions?.length ?? block.transactionHashes?.length ?? 0,
    ]
  );
}

async function upsertTransaction(
  client: PoolClient,
  tx: RpcTransaction,
  blockHash: string,
  blockHeight: bigint,
  txIndex: number,
  status: string | null
): Promise<void> {
  await client.query(
    `
    INSERT INTO transactions (
      hash,
      block_hash,
      block_height,
      tx_index,
      type,
      from_address,
      to_address,
      value,
      nonce,
      gas_limit,
      gas_price,
      status,
      data
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    ON CONFLICT (hash) DO UPDATE SET
      block_hash = EXCLUDED.block_hash,
      block_height = EXCLUDED.block_height,
      tx_index = EXCLUDED.tx_index,
      from_address = EXCLUDED.from_address,
      to_address = EXCLUDED.to_address,
      value = EXCLUDED.value,
      nonce = EXCLUDED.nonce,
      gas_limit = EXCLUDED.gas_limit,
      gas_price = EXCLUDED.gas_price,
      status = EXCLUDED.status,
      data = EXCLUDED.data
    `,
    [
      tx.hash,
      blockHash,
      blockHeight.toString(10),
      txIndex,
      'unknown',
      tx.from,
      tx.to ?? null,
      stripHexPrefix(tx.value) ?? '0',
      parseHeight(tx.nonce).toString(10),
      parseHeight(tx.gas).toString(10),
      stripHexPrefix(tx.gasPrice) ?? '0',
      status ?? 'unknown',
      hexToBuffer(tx.input),
    ]
  );
}

async function bulkUpsertTransactions(
  client: PoolClient,
  txs: RpcTransaction[],
  blockHash: string,
  blockHeight: bigint
): Promise<void> {
  if (txs.length === 0) {
    return;
  }

  const values: string[] = [];
  const params: Array<string | number | Buffer | null> = [];
  let idx = 1;

  for (let i = 0; i < txs.length; i += 1) {
    const tx = txs[i];
    values.push(
      `($${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++})`
    );
    params.push(
      tx.hash,
      blockHash,
      blockHeight.toString(10),
      i,
      'unknown',
      tx.from,
      tx.to ?? null,
      stripHexPrefix(tx.value) ?? '0',
      parseHeight(tx.nonce).toString(10),
      parseHeight(tx.gas).toString(10),
      stripHexPrefix(tx.gasPrice) ?? '0',
      'unknown',
      hexToBuffer(tx.input)
    );
  }

  await client.query(
    `
    INSERT INTO transactions (
      hash,
      block_hash,
      block_height,
      tx_index,
      type,
      from_address,
      to_address,
      value,
      nonce,
      gas_limit,
      gas_price,
      status,
      data
    ) VALUES ${values.join(',')}
    ON CONFLICT (hash) DO UPDATE SET
      block_hash = EXCLUDED.block_hash,
      block_height = EXCLUDED.block_height,
      tx_index = EXCLUDED.tx_index,
      from_address = EXCLUDED.from_address,
      to_address = EXCLUDED.to_address,
      value = EXCLUDED.value,
      nonce = EXCLUDED.nonce,
      gas_limit = EXCLUDED.gas_limit,
      gas_price = EXCLUDED.gas_price,
      status = EXCLUDED.status,
      data = EXCLUDED.data
    `,
    params
  );
}

async function upsertAccounts(client: PoolClient, addresses: string[], blockHeight: bigint): Promise<void> {
  if (addresses.length === 0) {
    return;
  }

  const values: string[] = [];
  const params: Array<string> = [];
  let idx = 1;
  for (const address of addresses) {
    values.push(`($${idx++}, $${idx++}, $${idx++})`);
    params.push(address, blockHeight.toString(10), blockHeight.toString(10));
  }

  await client.query(
    `
    INSERT INTO accounts (address, first_seen_block, last_seen_block)
    VALUES ${values.join(',')}
    ON CONFLICT (address) DO UPDATE SET
      last_seen_block = EXCLUDED.last_seen_block,
      updated_at = NOW()
    `,
    params
  );
}

async function refreshAccountState(
  client: PoolClient,
  rpc: RpcClient,
  address: string,
  blockHex: string,
  blockHeight: bigint
): Promise<void> {
  const balanceHex = await rpc.callWithRetry<string>('eth_getBalance', [address, blockHex]);
  const nonceHex = await rpc.callWithRetry<string>('eth_getTransactionCount', [address, blockHex]);
  const balance = hexToBigIntString(balanceHex) ?? '0';
  const nonce = parseHeight(nonceHex).toString(10);

  await client.query(
    `
    INSERT INTO accounts (address, balance, nonce, first_seen_block, last_seen_block)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (address) DO UPDATE SET
      balance = EXCLUDED.balance,
      nonce = EXCLUDED.nonce,
      last_seen_block = EXCLUDED.last_seen_block,
      updated_at = NOW()
    `,
    [address, balance, nonce, blockHeight.toString(10), blockHeight.toString(10)]
  );
}

async function upsertReceipt(
  client: PoolClient,
  receipt: RpcReceipt,
  blockHeight: bigint
): Promise<void> {
  const status = receipt.status === '0x1' ? 'success' : 'failure';

  for (let i = 0; i < receipt.logs.length; i += 1) {
    const log = receipt.logs[i];
    await client.query(
      `
      INSERT INTO events (
        tx_hash,
        block_height,
        log_index,
        contract_address,
        topic0,
        topic1,
        topic2,
        topic3,
        data
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      ON CONFLICT (tx_hash, log_index) DO UPDATE SET
        block_height = EXCLUDED.block_height,
        contract_address = EXCLUDED.contract_address,
        topic0 = EXCLUDED.topic0,
        topic1 = EXCLUDED.topic1,
        topic2 = EXCLUDED.topic2,
        topic3 = EXCLUDED.topic3,
        data = EXCLUDED.data
      `,
      [
        receipt.transactionHash,
        blockHeight.toString(10),
        i,
        log.address,
        log.topics[0] ?? null,
        log.topics[1] ?? null,
        log.topics[2] ?? null,
        log.topics[3] ?? null,
        hexToBuffer(log.data),
      ]
    );
  }

  if (receipt.contractAddress) {
    await client.query(
      `
      INSERT INTO contracts (address, creator_tx_hash, created_at_block)
      VALUES ($1, $2, $3)
      ON CONFLICT (address) DO UPDATE SET
        creator_tx_hash = EXCLUDED.creator_tx_hash,
        created_at_block = EXCLUDED.created_at_block,
        updated_at = NOW()
      `,
      [receipt.contractAddress, receipt.transactionHash, blockHeight.toString(10)]
    );
  }

  await client.query(
    `
    UPDATE transactions
    SET status = $1
    WHERE hash = $2
    `,
    [status, receipt.transactionHash]
  );
}

async function bulkUpsertReceipts(
  client: PoolClient,
  receipts: RpcReceipt[],
  blockHeight: bigint
): Promise<void> {
  if (receipts.length === 0) {
    return;
  }

  const logValues: string[] = [];
  const logParams: Array<string | number | Buffer | null> = [];
  const contractValues: string[] = [];
  const contractParams: Array<string | number> = [];
  const statusValues: string[] = [];
  const statusParams: Array<string> = [];
  let logIdx = 1;
  let contractIdx = 1;
  let statusIdx = 1;

  for (const receipt of receipts) {
    const status = receipt.status === '0x1' ? 'success' : 'failure';
    statusValues.push(`($${statusIdx++}, $${statusIdx++})`);
    statusParams.push(receipt.transactionHash, status);

    if (receipt.contractAddress) {
      contractValues.push(`($${contractIdx++}, $${contractIdx++}, $${contractIdx++})`);
      contractParams.push(receipt.contractAddress, receipt.transactionHash, blockHeight.toString(10));
    }

    for (let i = 0; i < receipt.logs.length; i += 1) {
      const log = receipt.logs[i];
      logValues.push(
        `($${logIdx++}, $${logIdx++}, $${logIdx++}, $${logIdx++}, $${logIdx++}, $${logIdx++}, $${logIdx++}, $${logIdx++}, $${logIdx++})`
      );
      logParams.push(
        receipt.transactionHash,
        blockHeight.toString(10),
        i,
        log.address,
        log.topics[0] ?? null,
        log.topics[1] ?? null,
        log.topics[2] ?? null,
        log.topics[3] ?? null,
        hexToBuffer(log.data)
      );
    }
  }

  if (logValues.length > 0) {
    await client.query(
      `
      INSERT INTO events (
        tx_hash,
        block_height,
        log_index,
        contract_address,
        topic0,
        topic1,
        topic2,
        topic3,
        data
      ) VALUES ${logValues.join(',')}
      ON CONFLICT (tx_hash, log_index) DO UPDATE SET
        block_height = EXCLUDED.block_height,
        contract_address = EXCLUDED.contract_address,
        topic0 = EXCLUDED.topic0,
        topic1 = EXCLUDED.topic1,
        topic2 = EXCLUDED.topic2,
        topic3 = EXCLUDED.topic3,
        data = EXCLUDED.data
      `,
      logParams
    );
  }

  if (contractValues.length > 0) {
    await client.query(
      `
      INSERT INTO contracts (address, creator_tx_hash, created_at_block)
      VALUES ${contractValues.join(',')}
      ON CONFLICT (address) DO UPDATE SET
        creator_tx_hash = EXCLUDED.creator_tx_hash,
        created_at_block = EXCLUDED.created_at_block,
        updated_at = NOW()
      `,
      contractParams
    );
  }

  if (statusValues.length > 0) {
    await client.query(
      `
      UPDATE transactions AS t
      SET status = v.status
      FROM (VALUES ${statusValues.join(',')}) AS v(hash, status)
      WHERE t.hash = v.hash
      `,
      statusParams
    );
  }
}

async function setLastBatchStats(stats: {
  height: bigint;
  blocks: number;
  txs: number;
  receipts: number;
  durationMs: number;
}): Promise<void> {
  const pool = getPool();
  await pool.query(
    `
    INSERT INTO indexer_state (key, value)
    VALUES ($1, $2)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `,
    [
      INDEXER_STATS_KEY,
      JSON.stringify({
        height: stats.height.toString(10),
        blocks: stats.blocks,
        txs: stats.txs,
        receipts: stats.receipts,
        durationMs: stats.durationMs,
      }),
    ]
  );
}

async function recordFailedBlock(height: bigint, error: unknown): Promise<void> {
  const pool = getPool();
  const message = error instanceof Error ? error.message : String(error);
  await pool.query(
    `
    INSERT INTO indexer_state (key, value)
    VALUES ($1, $2)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `,
    [
      INDEXER_FAILED_KEY,
      JSON.stringify({
        height: height.toString(10),
        error: message,
        at: new Date().toISOString(),
      }),
    ]
  );
}

async function indexBlock(client: RpcClient, height: bigint): Promise<number> {
  const blockHex = `0x${height.toString(16)}`;
  const block = await client.callWithRetry<RpcBlock>('eth_getBlockByNumber', [blockHex, true]);

  if (!block) {
    return 0;
  }

  const txs = block.transactions ?? [];
  const addressSet = new Set<string>();

  const pool = getPool();
  const dbClient = await pool.connect();
  try {
    await dbClient.query('BEGIN');

    await upsertBlock(dbClient, block);

    await bulkUpsertTransactions(dbClient, txs, block.hash, height);

    for (const tx of txs) {
      if (tx.from) {
        addressSet.add(tx.from);
      }
      if (tx.to) {
        addressSet.add(tx.to);
      }
    }
    await upsertAccounts(dbClient, Array.from(addressSet), height);

    await dbClient.query('COMMIT');
  } catch (error) {
    await dbClient.query('ROLLBACK');
    throw error;
  } finally {
    dbClient.release();
  }

  if (addressSet.size > 0) {
    const accountClient = await pool.connect();
    try {
      await accountClient.query('BEGIN');
      const addresses = Array.from(addressSet);
      const concurrency = 5;
      for (let i = 0; i < addresses.length; i += concurrency) {
        const batch = addresses.slice(i, i + concurrency);
        await Promise.all(
          batch.map((address) => refreshAccountState(accountClient, client, address, blockHex, height))
        );
      }
      await accountClient.query('COMMIT');
    } catch (error) {
      await accountClient.query('ROLLBACK');
      throw error;
    } finally {
      accountClient.release();
    }
  }

  const receiptClient = await pool.connect();
  try {
    await receiptClient.query('BEGIN');
    const concurrency = 8;
    for (let i = 0; i < txs.length; i += concurrency) {
      const batch = txs.slice(i, i + concurrency);
      const receipts = await Promise.all(
        batch.map((tx) =>
          client.callWithRetry<RpcReceipt>('eth_getTransactionReceipt', [tx.hash])
        )
      );
      const filtered = receipts.filter(Boolean) as RpcReceipt[];
      await bulkUpsertReceipts(receiptClient, filtered, height);
    }
    await receiptClient.query('COMMIT');
  } catch (error) {
    await receiptClient.query('ROLLBACK');
    throw error;
  } finally {
    receiptClient.release();
  }

  await setLastProcessedHeight(height);
  return txs.length;
}

async function indexBlockWithRetry(
  client: RpcClient,
  height: bigint,
  attempts: number,
  skipOnError: boolean
): Promise<number | null> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const txCount = await indexBlock(client, height);
      return txCount;
    } catch (error) {
      lastError = error;
      console.error(`Failed to index block ${height} (attempt ${attempt}/${attempts})`, error);
    }
  }

  if (skipOnError) {
    console.warn(`Skipping block ${height} after ${attempts} failed attempts`);
    await recordFailedBlock(height, lastError);
    return null;
  }

  throw lastError instanceof Error ? lastError : new Error('Failed to index block');
}

async function resolveFinalizedHeight(client: RpcClient, latest: bigint): Promise<bigint> {
  try {
    const finalizedHex = await client.callWithRetry<string>('qfc_getFinalizedBlock');
    const finalized = parseHeight(finalizedHex);
    return finalized <= latest ? finalized : latest;
  } catch (error) {
    console.warn('Failed to fetch finalized block, falling back to latest', error);
    return latest;
  }
}

async function runOnce(
  client: RpcClient,
  startHeight: bigint,
  useFinalized: boolean,
  blockRetries: number,
  skipOnError: boolean
): Promise<bigint> {
  const latestHex = await client.callWithRetry<string>('eth_blockNumber');
  const latest = parseHeight(latestHex);
  const target = useFinalized ? await resolveFinalizedHeight(client, latest) : latest;
  const startedAt = Date.now();
  let totalTxs = 0;
  let totalReceipts = 0;
  let indexedBlocks = 0;
  let skippedBlocks = 0;

  if (startHeight > target) {
    console.log(`Indexer up to date at height ${target}`);
    return target;
  }

  console.log(`Indexing from ${startHeight} to ${target}`);
  for (let height = startHeight; height <= target; height += 1n) {
    console.log(`Indexing block ${height}`);
    const txCount = await indexBlockWithRetry(client, height, blockRetries, skipOnError);
    if (txCount === null && skipOnError) {
      skippedBlocks += 1;
      continue;
    }
    indexedBlocks += 1;
    const count = txCount ?? 0;
    totalTxs += count;
    totalReceipts += count;
  }

  console.log('Indexing complete');
  const durationMs = Date.now() - startedAt;
  const tps = durationMs > 0 ? (totalTxs / (durationMs / 1000)).toFixed(2) : '0';
  console.log(
    `Batch stats: blocks=${indexedBlocks}, skipped=${skippedBlocks}, txs=${totalTxs}, receipts=${totalReceipts}, duration=${durationMs}ms, tps=${tps}`
  );
  await setLastBatchStats({
    height: target,
    blocks: indexedBlocks,
    txs: totalTxs,
    receipts: totalReceipts,
    durationMs,
  });
  return target;
}

async function run(): Promise<void> {
  const rpcUrl = process.env.RPC_URL;
  if (!rpcUrl) {
    throw new Error('RPC_URL is not set');
  }

  const startHeightEnv = process.env.INDEXER_START_HEIGHT;
  const startHeight = startHeightEnv ? BigInt(startHeightEnv) : 0n;
  const pollIntervalMs = process.env.INDEXER_POLL_INTERVAL_MS
    ? Number(process.env.INDEXER_POLL_INTERVAL_MS)
    : 10_000;
  const useFinalized = process.env.INDEXER_USE_FINALIZED !== 'false';
  const blockRetries = process.env.INDEXER_BLOCK_RETRIES
    ? Number(process.env.INDEXER_BLOCK_RETRIES)
    : 3;
  const skipOnError = process.env.INDEXER_SKIP_ON_ERROR === 'true';

  const client = new RpcClient(rpcUrl);

  const lastProcessed = await getLastProcessedHeight();
  let current = lastProcessed !== null ? lastProcessed + 1n : startHeight;

  await runOnce(client, current, useFinalized, blockRetries, skipOnError);

  // Continuous polling mode
  while (pollIntervalMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    const last = await getLastProcessedHeight();
    current = last !== null ? last + 1n : startHeight;
    await runOnce(client, current, useFinalized, blockRetries, skipOnError);
  }
}

run().catch((error) => {
  console.error('Indexer failed:', error);
  process.exit(1);
});
