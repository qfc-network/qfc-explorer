import { getTransactionsPage } from '@/db/queries';
import { ok } from '@/lib/api-response';
import { clamp, parseNumber, parseOrder } from '@/lib/pagination';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseNumber(searchParams.get('page'), 1);
  const limit = clamp(parseNumber(searchParams.get('limit'), 25), 1, 100);
  const order = parseOrder(searchParams.get('order'));
  const address = searchParams.get('address') ?? undefined;
  const status = searchParams.get('status') ?? undefined;
  const offset = (page - 1) * limit;

  const transactions = await getTransactionsPage(limit, offset, order, { address, status });

  return ok({ page, limit, order, address, status, items: transactions });
}
