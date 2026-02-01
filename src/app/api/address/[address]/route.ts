export const dynamic = "force-dynamic";

import { getAddressAnalysis, getAddressOverview, getAddressStats, getAddressTransactions } from '@/db/queries';
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
  const offset = (page - 1) * limit;

  const overview = await getAddressOverview(params.address);
  if (!overview) {
    return fail('Address not found', 404);
  }

  const [transactions, stats, analysis] = await Promise.all([
    getAddressTransactions(params.address, limit, offset, order),
    getAddressStats(params.address),
    getAddressAnalysis(params.address),
  ]);

  return ok({
    address: overview,
    stats,
    analysis,
    page,
    limit,
    order,
    transactions,
  });
}
