export const dynamic = "force-dynamic";

import { getAddressOverview, getBlockByHash, getBlockByHeight, getTransactionByHash, searchTokensByName } from '@/db/queries';
import { fail, ok } from '@/lib/api-response';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('q') ?? '').trim();
  if (!query) {
    return fail('Missing query', 400);
  }

  const isNumeric = /^\d+$/.test(query);
  const isHex = /^0x[0-9a-fA-F]+$/.test(query);
  const isText = !isNumeric && !isHex && query.length >= 2;

  const [blockByHeight, blockByHash, txByHash, address, tokens] = await Promise.all([
    isNumeric ? getBlockByHeight(query) : Promise.resolve(null),
    isHex ? getBlockByHash(query) : Promise.resolve(null),
    isHex ? getTransactionByHash(query) : Promise.resolve(null),
    isHex && query.length === 42 ? getAddressOverview(query) : Promise.resolve(null),
    isText ? searchTokensByName(query, 10) : Promise.resolve([]),
  ]);

  return ok({
    query,
    blockByHeight,
    blockByHash,
    transaction: txByHash,
    address,
    tokens,
  });
}
