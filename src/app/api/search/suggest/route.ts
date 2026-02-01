import { NextResponse } from 'next/server';
import {
  searchAddressPrefix,
  searchBlockHeightPrefix,
  searchBlockHashPrefix,
  searchTransactionHashPrefix,
} from '@/db/queries';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('q') ?? '').trim();
  if (!query) {
    return NextResponse.json({ error: 'Missing query' }, { status: 400 });
  }

  const isNumeric = /^\d+$/.test(query);
  const isHex = /^0x[0-9a-fA-F]+$/.test(query);

  const [blockHeights, blockHashes, txHashes, addresses] = await Promise.all([
    isNumeric ? searchBlockHeightPrefix(query, 5) : Promise.resolve([]),
    isHex ? searchBlockHashPrefix(query, 5) : Promise.resolve([]),
    isHex ? searchTransactionHashPrefix(query, 5) : Promise.resolve([]),
    isHex ? searchAddressPrefix(query, 5) : Promise.resolve([]),
  ]);

  return NextResponse.json({
    query,
    blockHeights,
    blockHashes,
    txHashes,
    addresses,
  });
}
