export const dynamic = "force-dynamic";

import { getReceiptLogsByTxHash, getTransactionByHash } from '@/db/queries';
import { RpcClient } from '@/indexer/rpc';
import type { RpcReceipt, RpcTransaction } from '@/indexer/types';
import { hexToBigIntString } from '@/indexer/utils';
import { fail, ok } from '@/lib/api-response';

async function fetchGasUsed(hash: string): Promise<string | null> {
  const rpcUrl = process.env.RPC_URL;
  if (!rpcUrl) return null;
  try {
    const rpc = new RpcClient(rpcUrl);
    const receipt = await rpc.call<RpcReceipt | null>('eth_getTransactionReceipt', [hash]);
    if (receipt?.gasUsed) {
      return hexToBigIntString(receipt.gasUsed) ?? null;
    }
  } catch {
    // ignore
  }
  return null;
}

async function fetchFromRpc(hash: string) {
  const rpcUrl = process.env.RPC_URL;
  if (!rpcUrl) return null;

  const rpc = new RpcClient(rpcUrl);

  let tx: RpcTransaction | null;
  try {
    tx = await rpc.call<RpcTransaction | null>('eth_getTransactionByHash', [hash]);
  } catch {
    return null;
  }
  if (!tx) return null;

  let receipt: RpcReceipt | null = null;
  try {
    receipt = await rpc.call<RpcReceipt | null>('eth_getTransactionReceipt', [hash]);
  } catch {
    // receipt may not exist yet for pending txs
  }

  const status = receipt
    ? receipt.status === '0x1' ? 'success' : 'failure'
    : 'pending';

  const blockHeight = tx.blockNumber
    ? hexToBigIntString(tx.blockNumber) ?? '0'
    : '0';

  return {
    transaction: {
      hash: tx.hash,
      block_height: blockHeight,
      from_address: tx.from,
      to_address: tx.to ?? null,
      value: hexToBigIntString(tx.value) ?? '0',
      status,
      gas_limit: hexToBigIntString(tx.gas) ?? '0',
      gas_price: hexToBigIntString(tx.gasPrice) ?? '0',
      gas_used: receipt?.gasUsed ? hexToBigIntString(receipt.gasUsed) ?? null : null,
      nonce: hexToBigIntString(tx.nonce) ?? '0',
      data: tx.input && tx.input !== '0x' ? tx.input : null,
      type: (tx as Record<string, unknown>).type as string | null ?? null,
      timestamp_ms: null as string | null,
    },
    logs: (receipt?.logs ?? []).map((log) => ({
      contract_address: log.address,
      topic0: log.topics[0] ?? null,
      topic1: log.topics[1] ?? null,
      topic2: log.topics[2] ?? null,
      topic3: log.topics[3] ?? null,
      data: log.data && log.data !== '0x' ? log.data : null,
    })),
    source: 'rpc' as const,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: { hash: string } }
) {
  // Try DB first (indexed data)
  const tx = await getTransactionByHash(params.hash);
  if (tx) {
    const [logs, gasUsed] = await Promise.all([
      getReceiptLogsByTxHash(params.hash),
      fetchGasUsed(params.hash),
    ]);
    return ok({ transaction: { ...tx, gas_used: gasUsed }, logs });
  }

  // Fallback: query RPC directly
  const rpcResult = await fetchFromRpc(params.hash);
  if (rpcResult) {
    return ok(rpcResult);
  }

  return fail('Transaction not found', 404);
}
