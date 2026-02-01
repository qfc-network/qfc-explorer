import { getTokenHolders } from '@/db/queries';
import { fail, ok } from '@/lib/api-response';
import { clamp, parseNumber } from '@/lib/pagination';

export async function GET(
  request: Request,
  { params }: { params: { address: string } }
) {
  const { searchParams } = new URL(request.url);
  const limit = clamp(parseNumber(searchParams.get('limit'), 25), 1, 200);
  const tokenAddress = params.address.toLowerCase();

  const holders = await getTokenHolders(tokenAddress, limit);
  if (!holders) {
    return fail('Token not found', 404);
  }

  return ok({ token: tokenAddress, holders });
}
