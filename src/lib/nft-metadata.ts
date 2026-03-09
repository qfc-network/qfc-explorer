/**
 * NFT metadata utilities — fetch tokenURI from contracts, resolve IPFS URIs,
 * and parse ERC-721 / ERC-1155 metadata JSON.
 */

const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';

// In-memory cache: key = `${contractAddress}:${tokenId}`
const metadataCache = new Map<string, NftMetadata | null>();

export type NftMetadata = {
  name?: string;
  description?: string;
  image?: string;
  attributes?: Array<{ trait_type?: string; value?: string | number }>;
  /** Raw tokenURI before resolution */
  tokenUri?: string;
};

// ----- ABI selectors -----
// tokenURI(uint256) → 0xc87b56dd
// uri(uint256)      → 0x0e89341c
const TOKEN_URI_SELECTOR = '0xc87b56dd';
const URI_SELECTOR = '0x0e89341c';

/**
 * Encode a uint256 as a 32-byte ABI word (zero-padded hex, no 0x prefix).
 */
function encodeUint256(tokenId: string): string {
  let hex = BigInt(tokenId).toString(16);
  return hex.padStart(64, '0');
}

/**
 * Decode an ABI-encoded string from hex `eth_call` return data.
 * Layout: offset (32 bytes) + length (32 bytes) + data (ceil to 32).
 */
function decodeString(hex: string): string {
  // Strip 0x prefix
  const data = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (data.length < 128) return ''; // minimum: offset + length = 64 bytes
  // offset is first 32 bytes — skip it, read length from next 32 bytes
  const lenHex = data.slice(64, 128);
  const len = parseInt(lenHex, 16);
  if (isNaN(len) || len === 0) return '';
  const strHex = data.slice(128, 128 + len * 2);
  // Decode hex to UTF-8
  const bytes = new Uint8Array(strHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(strHex.slice(i * 2, i * 2 + 2), 16);
  }
  return new TextDecoder().decode(bytes);
}

/**
 * Call `tokenURI(uint256)` or `uri(uint256)` on a contract via JSON-RPC eth_call.
 */
export async function fetchTokenURI(
  contractAddress: string,
  tokenId: string,
  rpcUrl?: string,
): Promise<string | null> {
  const url = rpcUrl || process.env.RPC_URL || 'http://127.0.0.1:8545';
  const encoded = encodeUint256(tokenId);

  // Try ERC-721 tokenURI first, then ERC-1155 uri
  for (const selector of [TOKEN_URI_SELECTOR, URI_SELECTOR]) {
    try {
      const callData = selector + encoded;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_call',
          params: [{ to: contractAddress, data: callData }, 'latest'],
        }),
      });

      if (!res.ok) continue;

      const json = await res.json();
      if (json.error || !json.result || json.result === '0x') continue;

      const uri = decodeString(json.result);
      if (uri && uri.length > 0) return uri;
    } catch {
      // contract may not implement this selector — try next
    }
  }
  return null;
}

/**
 * Convert IPFS or data URIs to HTTP-fetchable URLs.
 * - `ipfs://Qm...`     → `https://ipfs.io/ipfs/Qm...`
 * - `ipfs://ipfs/Qm...` → `https://ipfs.io/ipfs/Qm...`
 * - `ar://...`           → `https://arweave.net/...`
 * - `data:...`           → returned as-is
 * - `http(s)://...`      → returned as-is
 */
export function resolveUri(uri: string): string {
  if (!uri) return '';
  const trimmed = uri.trim();

  if (trimmed.startsWith('ipfs://ipfs/')) {
    return IPFS_GATEWAY + trimmed.slice('ipfs://ipfs/'.length);
  }
  if (trimmed.startsWith('ipfs://')) {
    return IPFS_GATEWAY + trimmed.slice('ipfs://'.length);
  }
  if (trimmed.startsWith('ar://')) {
    return 'https://arweave.net/' + trimmed.slice('ar://'.length);
  }
  if (trimmed.startsWith('data:') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // If it looks like a bare CID (Qm... or bafy...)
  if (/^(Qm[1-9A-Za-z]{44}|bafy[a-z0-9]+)/i.test(trimmed)) {
    return IPFS_GATEWAY + trimmed;
  }

  return trimmed;
}

/**
 * Fetch and parse NFT metadata JSON for a given contract + tokenId.
 * Results are cached in-memory.
 */
export async function fetchNftMetadata(
  contractAddress: string,
  tokenId: string,
  rpcUrl?: string,
): Promise<NftMetadata | null> {
  const cacheKey = `${contractAddress.toLowerCase()}:${tokenId}`;
  if (metadataCache.has(cacheKey)) {
    return metadataCache.get(cacheKey) ?? null;
  }

  try {
    const tokenUri = await fetchTokenURI(contractAddress, tokenId, rpcUrl);
    if (!tokenUri) {
      metadataCache.set(cacheKey, null);
      return null;
    }

    const resolvedUri = resolveUri(tokenUri);

    // Handle data URIs with JSON
    if (resolvedUri.startsWith('data:application/json')) {
      const json = resolvedUri.includes(',')
        ? resolvedUri.slice(resolvedUri.indexOf(',') + 1)
        : '';
      let parsed;
      if (resolvedUri.includes('base64,')) {
        parsed = JSON.parse(Buffer.from(json, 'base64').toString('utf-8'));
      } else {
        parsed = JSON.parse(decodeURIComponent(json));
      }
      const metadata = normalizeMetadata(parsed, tokenUri);
      metadataCache.set(cacheKey, metadata);
      return metadata;
    }

    // Fetch JSON from HTTP(S) URL
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(resolvedUri, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeout);

      if (!res.ok) {
        metadataCache.set(cacheKey, null);
        return null;
      }

      const contentType = res.headers.get('content-type') ?? '';
      // Some servers return HTML for invalid URIs
      if (contentType.includes('text/html')) {
        metadataCache.set(cacheKey, null);
        return null;
      }

      const parsed = await res.json();
      const metadata = normalizeMetadata(parsed, tokenUri);
      metadataCache.set(cacheKey, metadata);
      return metadata;
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    metadataCache.set(cacheKey, null);
    return null;
  }
}

function normalizeMetadata(raw: Record<string, unknown>, tokenUri: string): NftMetadata {
  const meta: NftMetadata = { tokenUri };

  if (typeof raw.name === 'string') meta.name = raw.name;
  if (typeof raw.description === 'string') meta.description = raw.description;

  // image field can be `image`, `image_url`, or `image_data`
  const imageRaw = raw.image ?? raw.image_url ?? raw.image_data;
  if (typeof imageRaw === 'string' && imageRaw.length > 0) {
    meta.image = resolveUri(imageRaw);
  }

  if (Array.isArray(raw.attributes)) {
    meta.attributes = raw.attributes.map((a: Record<string, unknown>) => ({
      trait_type: typeof a.trait_type === 'string' ? a.trait_type : undefined,
      value: typeof a.value === 'string' || typeof a.value === 'number' ? a.value : undefined,
    }));
  }

  return meta;
}

/**
 * Bulk-fetch metadata for multiple NFTs. Limits concurrency to avoid
 * hammering IPFS gateways and the RPC.
 */
export async function fetchNftMetadataBatch(
  items: Array<{ contractAddress: string; tokenId: string }>,
  rpcUrl?: string,
  concurrency = 4,
): Promise<Array<{ contractAddress: string; tokenId: string; metadata: NftMetadata | null }>> {
  const results: Array<{ contractAddress: string; tokenId: string; metadata: NftMetadata | null }> = [];
  const queue = [...items];

  async function worker() {
    while (queue.length > 0) {
      const item = queue.shift()!;
      const metadata = await fetchNftMetadata(item.contractAddress, item.tokenId, rpcUrl);
      results.push({ ...item, metadata });
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);

  return results;
}

/** Clear the in-memory metadata cache (useful for testing). */
export function clearMetadataCache() {
  metadataCache.clear();
}
