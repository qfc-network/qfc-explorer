import { ImageResponse } from 'next/og';
import { getApiBaseUrl } from '@/lib/api-client';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'QFC Token';

function shorten(value: string, head = 6, tail = 4): string {
  if (!value || value.length <= head + tail + 2) return value || '';
  return `${value.slice(0, head + 2)}...${value.slice(-tail)}`;
}

function formatSupply(supply: string | null, decimals: number | null): string {
  if (!supply) return '--';
  try {
    const val = BigInt(supply);
    const dec = decimals ?? 18;
    const base = 10n ** BigInt(dec);
    const whole = Number(val / base);
    if (whole >= 1_000_000_000) return `${(whole / 1_000_000_000).toFixed(2)}B`;
    if (whole >= 1_000_000) return `${(whole / 1_000_000).toFixed(2)}M`;
    if (whole >= 1_000) return `${(whole / 1_000).toFixed(2)}K`;
    return whole.toLocaleString('en-US');
  } catch {
    return supply;
  }
}

export default async function OgImage({ params }: { params: { address: string } }) {
  const address = params.address.toLowerCase();
  const base = getApiBaseUrl();

  let tokenName = 'Token';
  let symbol: string | null = null;
  let totalSupply: string | null = null;
  let decimals: number | null = null;
  let holderCount = '--';
  let tokenType = 'ERC-20';

  try {
    const [tokenRes, holdersRes] = await Promise.all([
      fetch(`${base}/api/tokens/${address}?limit=1`, { cache: 'no-store' }),
      fetch(`${base}/api/tokens/${address}/holders?limit=1`, { cache: 'no-store' }),
    ]);

    if (tokenRes.ok) {
      const json = await tokenRes.json();
      const token = json?.data?.token;
      if (token) {
        tokenName = token.name ?? 'Token';
        symbol = token.symbol;
        totalSupply = token.total_supply;
        decimals = token.decimals;
        const typeMap: Record<string, string> = { erc20: 'ERC-20', erc721: 'ERC-721', erc1155: 'ERC-1155' };
        tokenType = typeMap[token.token_type] ?? 'ERC-20';
      }
    }

    if (holdersRes.ok) {
      const json = await holdersRes.json();
      const holders = json?.data?.holders ?? [];
      const nftHolders = json?.data?.nftHolders ?? [];
      holderCount = String(holders.length + nftHolders.length);
    }
  } catch {
    // Fall back to minimal display
  }

  const displayName = symbol ? `${tokenName} (${symbol})` : tokenName;
  const typeColor = tokenType === 'ERC-721' ? '#a78bfa' : tokenType === 'ERC-1155' ? '#fb923c' : '#4fc3f7';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #0a1628 0%, #0d2847 50%, #0a1628 100%)',
          fontFamily: 'sans-serif',
          padding: 48,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #4fc3f7, #0288d1)',
              fontSize: 24,
              fontWeight: 800,
              color: '#fff',
            }}
          >
            Q
          </div>
          <span style={{ fontSize: 24, color: '#4a6a8a', fontWeight: 600 }}>QFC Explorer</span>
          <div style={{ flex: 1 }} />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 20px',
              borderRadius: 24,
              background: `${typeColor}1f`,
              color: typeColor,
              fontSize: 20,
              fontWeight: 700,
            }}
          >
            {tokenType}
          </div>
        </div>

        {/* Title */}
        <div style={{ fontSize: 20, color: '#4a6a8a', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 8 }}>
          Token
        </div>
        <div style={{ fontSize: 36, color: '#e0f7fa', fontWeight: 700, marginBottom: 8 }}>
          {displayName}
        </div>
        <div style={{ fontSize: 18, color: '#4a6a8a', marginBottom: 48 }}>
          {shorten(address, 10, 8)}
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 24 }}>
          {totalSupply && (
            <InfoCard label="Total Supply" value={`${formatSupply(totalSupply, decimals)}${symbol ? ' ' + symbol : ''}`} />
          )}
          <InfoCard label="Holders" value={holderCount} />
          <InfoCard label="Standard" value={tokenType} />
        </div>

        {/* Footer */}
        <div style={{ position: 'absolute', bottom: 32, left: 48, fontSize: 16, color: '#4a6a8a' }}>
          explorer.testnet.qfc.network
        </div>
      </div>
    ),
    { ...size }
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 24px',
        borderRadius: 12,
        border: '1px solid #1e3a5f',
        background: 'rgba(15, 30, 55, 0.8)',
        minWidth: 200,
      }}
    >
      <span style={{ fontSize: 13, color: '#4a6a8a', textTransform: 'uppercase', letterSpacing: 2 }}>
        {label}
      </span>
      <span style={{ fontSize: 22, fontWeight: 700, color: '#e0f7fa', marginTop: 4 }}>
        {value}
      </span>
    </div>
  );
}
