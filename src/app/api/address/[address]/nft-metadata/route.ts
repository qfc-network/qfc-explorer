export const dynamic = 'force-dynamic';

import { getNftHoldingsByAddress } from '@/db/queries';
import { ok, fail } from '@/lib/api-response';
import { fetchNftMetadataBatch } from '@/lib/nft-metadata';

export async function GET(
  _request: Request,
  { params }: { params: { address: string } },
) {
  const address = params.address.toLowerCase();
  if (!/^0x[0-9a-f]{40}$/i.test(address)) {
    return fail('Invalid address', 400);
  }

  const holdings = await getNftHoldingsByAddress(address);
  if (!holdings || holdings.length === 0) {
    return ok({ nfts: [] });
  }

  // Limit to first 50 to avoid excessive RPC/IPFS calls
  const items = holdings.slice(0, 50).map((h) => ({
    contractAddress: h.token_address,
    tokenId: h.token_id,
  }));

  const rpcUrl = process.env.RPC_URL || 'http://127.0.0.1:8545';
  const results = await fetchNftMetadataBatch(items, rpcUrl, 4);

  const nfts = results.map((r) => ({
    tokenAddress: r.contractAddress,
    tokenId: r.tokenId,
    metadata: r.metadata
      ? {
          uri: r.metadata.tokenUri ?? '',
          name: r.metadata.name,
          description: r.metadata.description,
          image: r.metadata.image,
        }
      : null,
  }));

  return ok({ nfts });
}
