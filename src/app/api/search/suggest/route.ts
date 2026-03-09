export const dynamic = "force-dynamic";

import {
  searchAddressPrefix,
  searchBlockHeightPrefix,
  searchBlockHashPrefix,
  searchTransactionHashPrefix,
  searchTokensByName,
} from '@/db/queries';
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

  const [blockHeights, blockHashes, txHashes, addresses, tokens] = await Promise.all([
    isNumeric ? searchBlockHeightPrefix(query, 5) : Promise.resolve([]),
    isHex ? searchBlockHashPrefix(query, 5) : Promise.resolve([]),
    isHex ? searchTransactionHashPrefix(query, 5) : Promise.resolve([]),
    isHex ? searchAddressPrefix(query, 5) : Promise.resolve([]),
    isText ? searchTokensByName(query, 5) : Promise.resolve([]),
  ]);

  return ok({
    query,
    blockHeights,
    blockHashes,
    txHashes,
    addresses,
    tokens,
  });
}
