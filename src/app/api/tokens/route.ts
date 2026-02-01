export const dynamic = "force-dynamic";

import { getTokensPage } from '@/db/queries';
import { ok } from '@/lib/api-response';
import { clamp, parseNumber, parseOrder } from '@/lib/pagination';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseNumber(searchParams.get('page'), 1);
  const limit = clamp(parseNumber(searchParams.get('limit'), 25), 1, 100);
  const order = parseOrder(searchParams.get('order'));
  const offset = (page - 1) * limit;

  const tokens = await getTokensPage(limit, offset, order);

  return ok({ page, limit, order, items: tokens });
}
