export const dynamic = "force-dynamic";

import { getBlockByHeight, getTransactionsByBlockHeight } from '@/db/queries';
import { fail, ok } from '@/lib/api-response';
import { clamp, parseNumber, parseOrder } from '@/lib/pagination';

export async function GET(
  request: Request,
  { params }: { params: { height: string } }
) {
  const { searchParams } = new URL(request.url);
  const page = parseNumber(searchParams.get('page'), 1);
  const limit = clamp(parseNumber(searchParams.get('limit'), 25), 1, 100);
  const order = parseOrder(searchParams.get('order'));
  const offset = (page - 1) * limit;

  const block = await getBlockByHeight(params.height);
  if (!block) {
    return fail('Block not found', 404);
  }

  const transactions = await getTransactionsByBlockHeight(params.height, limit, offset, order);

  return ok({ block, page, limit, order, transactions });
}
