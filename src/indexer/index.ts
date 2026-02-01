import 'dotenv/config';
import { getPool } from '@/db/pool';
import type { PoolClient } from 'pg';
import { RpcClient } from './rpc';
import type { RpcBlock, RpcReceipt, RpcTransaction } from './types';
import { hexToBigIntString, hexToBuffer, stripHexPrefix } from './utils';

const INDEXER_STATE_KEY = 'last_processed_height';

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

async function upsertAccounts(client: PoolClient, addresses: string[], blockHeight: bigint): Promise<void> {
  for (const address of addresses) {
    await client.query(
      `
      INSERT INTO accounts (address, first_seen_block, last_seen_block)
      VALUES ($1, $2, $3)
      ON CONFLICT (address) DO UPDATE SET
        last_seen_block = EXCLUDED.last_seen_block,
        updated_at = NOW()
      `,
      [address, blockHeight.toString(10), blockHeight.toString(10)]
    );
  }
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

async function indexBlock(client: RpcClient, height: bigint): Promise<void> {
  const blockHex = `0x${height.toString(16)}`;
  const block = await client.callWithRetry<RpcBlock>('eth_getBlockByNumber', [blockHex, true]);

  if (!block) {
    return;
  }

  const txs = block.transactions ?? [];
  const addressSet = new Set<string>();

  const pool = getPool();
  const dbClient = await pool.connect();
  try {
    await dbClient.query('BEGIN');

    await upsertBlock(dbClient, block);

    for (let i = 0; i < txs.length; i += 1) {
      const tx = txs[i];
      await upsertTransaction(dbClient, tx, block.hash, height, i, null);
      const addresses = [tx.from, tx.to].filter(Boolean) as string[];
      await upsertAccounts(dbClient, addresses, height);
      for (const address of addresses) {
        addressSet.add(address);
      }
    }

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
      for (const address of addressSet) {
        await refreshAccountState(accountClient, client, address, blockHex, height);
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
    for (const tx of txs) {
      const receipt = await client.callWithRetry<RpcReceipt>('eth_getTransactionReceipt', [tx.hash]);
      if (receipt) {
        await upsertReceipt(receiptClient, receipt, height);
      }
    }
    await receiptClient.query('COMMIT');
  } catch (error) {
    await receiptClient.query('ROLLBACK');
    throw error;
  } finally {
    receiptClient.release();
  }

  await setLastProcessedHeight(height);
}

async function runOnce(client: RpcClient, startHeight: bigint): Promise<bigint> {
  const latestHex = await client.callWithRetry<string>('eth_blockNumber');
  const latest = parseHeight(latestHex);

  if (startHeight > latest) {
    console.log(`Indexer up to date at height ${latest}`);
    return latest;
  }

  console.log(`Indexing from ${startHeight} to ${latest}`);
  for (let height = startHeight; height <= latest; height += 1n) {
    console.log(`Indexing block ${height}`);
    await indexBlock(client, height);
  }

  console.log('Indexing complete');
  return latest;
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

  const client = new RpcClient(rpcUrl);

  const lastProcessed = await getLastProcessedHeight();
  let current = lastProcessed !== null ? lastProcessed + 1n : startHeight;

  await runOnce(client, current);

  // Continuous polling mode
  while (pollIntervalMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    const last = await getLastProcessedHeight();
    current = last !== null ? last + 1n : startHeight;
    await runOnce(client, current);
  }
}

run().catch((error) => {
  console.error('Indexer failed:', error);
  process.exit(1);
});
