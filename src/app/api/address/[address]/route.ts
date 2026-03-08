export const dynamic = "force-dynamic";

import {
  getAddressAnalysis,
  getAddressOverview,
  getAddressStats,
  getAddressTransactions,
  getTokenTransfersByAddress,
  getTokenHoldingsByAddress,
  getNftHoldingsByAddress,
  getContractByAddress,
} from '@/db/queries';
import { fail, ok } from '@/lib/api-response';
import { clamp, parseNumber, parseOrder } from '@/lib/pagination';

export async function GET(
  request: Request,
  { params }: { params: { address: string } }
) {
  const { searchParams } = new URL(request.url);
  const page = parseNumber(searchParams.get('page'), 1);
  const limit = clamp(parseNumber(searchParams.get('limit'), 25), 1, 100);
  const order = parseOrder(searchParams.get('order'));
  const tab = searchParams.get('tab') ?? 'transactions';
  const offset = (page - 1) * limit;

  const overview = await getAddressOverview(params.address);
  if (!overview) {
    return fail('Address not found', 404);
  }

  const [stats, analysis, contract, tokenHoldings, nftHoldings] = await Promise.all([
    getAddressStats(params.address),
    getAddressAnalysis(params.address),
    getContractByAddress(params.address),
    getTokenHoldingsByAddress(params.address),
    getNftHoldingsByAddress(params.address),
  ]);

  let transactions: Awaited<ReturnType<typeof getAddressTransactions>> = [];
  let tokenTransfers: Awaited<ReturnType<typeof getTokenTransfersByAddress>> = [];

  if (tab === 'token_transfers') {
    tokenTransfers = await getTokenTransfersByAddress(params.address, limit, offset, order);
  } else {
    transactions = await getAddressTransactions(params.address, limit, offset, order);
  }

  return ok({
    address: overview,
    stats,
    analysis,
    contract,
    tokenHoldings,
    nftHoldings,
    tab,
    page,
    limit,
    order,
    transactions,
    tokenTransfers,
  });
}
