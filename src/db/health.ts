import { getPool } from './pool';

const RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:8545';

export async function checkDatabaseHealth(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const start = Date.now();
  try {
    const pool = getPool();
    await pool.query('SELECT 1');
    return { ok: true, latencyMs: Date.now() - start };
  } catch (error) {
    return { ok: false, latencyMs: Date.now() - start, error: error instanceof Error ? error.message : 'unknown error' };
  }
}

export async function checkRpcHealth(): Promise<{ ok: boolean; latencyMs: number; blockNumber?: string; error?: string }> {
  const start = Date.now();
  try {
    const res = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 }),
      signal: AbortSignal.timeout(5000),
    });
    const json = await res.json();
    const blockNumber = json.result ? parseInt(json.result, 16).toString() : undefined;
    return { ok: true, latencyMs: Date.now() - start, blockNumber };
  } catch (error) {
    return { ok: false, latencyMs: Date.now() - start, error: error instanceof Error ? error.message : 'unknown error' };
  }
}

export async function checkIndexerLag(): Promise<{ ok: boolean; indexedHeight: string | null; rpcHeight: string | null; lag: number | null; error?: string }> {
  try {
    const pool = getPool();

    // Get last indexed block
    const indexerResult = await pool.query(
      `SELECT value FROM indexer_state WHERE key = 'last_processed_height' LIMIT 1`
    );
    const indexedHeight = indexerResult.rows[0]?.value ?? null;

    // Get RPC head
    const res = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 }),
      signal: AbortSignal.timeout(5000),
    });
    const json = await res.json();
    const rpcHeight = json.result ? parseInt(json.result, 16).toString() : null;

    const lag = indexedHeight && rpcHeight
      ? Number(rpcHeight) - Number(indexedHeight)
      : null;

    return {
      ok: lag !== null && lag < 100,
      indexedHeight,
      rpcHeight,
      lag,
    };
  } catch (error) {
    return {
      ok: false,
      indexedHeight: null,
      rpcHeight: null,
      lag: null,
      error: error instanceof Error ? error.message : 'unknown error',
    };
  }
}
