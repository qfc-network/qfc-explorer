import { getTokenByAddress, getTokenTransfers } from '@/db/queries';
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

  const token = await getTokenByAddress(params.address.toLowerCase());
  if (!token) {
    return fail('Token not found', 404);
  }

  const transfers = await getTokenTransfers(params.address.toLowerCase(), limit, offset, order);

  return ok({ token, page, limit, order, transfers });
}
