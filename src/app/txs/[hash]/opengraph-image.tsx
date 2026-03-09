import { ImageResponse } from 'next/og';
import { getApiBaseUrl } from '@/lib/api-client';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'QFC Transaction';

function shorten(value: string, head = 6, tail = 4): string {
  if (!value || value.length <= head + tail + 2) return value || '';
  return `${value.slice(0, head + 2)}...${value.slice(-tail)}`;
}

function weiToQfc(value: string): string {
  if (!value) return '0';
  try {
    const wei = BigInt(value.startsWith('0x') ? value : /^[0-9]+$/.test(value) ? value : '0x' + value);
    const base = 10n ** 18n;
    const whole = wei / base;
    const fraction = wei % base;
    const wholeStr = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    if (fraction === 0n) return wholeStr;
    return `${wholeStr}.${fraction.toString().padStart(18, '0').slice(0, 4)}`;
  } catch {
    return value;
  }
}

export default async function OgImage({ params }: { params: { hash: string } }) {
  const hash = params.hash;
  const base = getApiBaseUrl();
  let tx: {
    hash: string;
    block_height: string;
    from_address: string;
    to_address: string | null;
    value: string;
    status: string;
  } | null = null;

  try {
    const response = await fetch(`${base}/api/txs/${hash}`, { cache: 'no-store' });
    if (response.ok) {
      const json = await response.json();
      tx = json?.data?.transaction ?? null;
    }
  } catch {
    // Fall back to hash-only display
  }

  const isSuccess = tx?.status === '0x1';
  const statusText = tx ? (isSuccess ? 'Success' : 'Failed') : 'Transaction';
  const statusColor = tx ? (isSuccess ? '#4ade80' : '#f87171') : '#4fc3f7';

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
              background: isSuccess ? 'rgba(74,222,128,0.12)' : tx ? 'rgba(248,113,113,0.12)' : 'rgba(79,195,247,0.12)',
              color: statusColor,
              fontSize: 20,
              fontWeight: 700,
            }}
          >
            {statusText}
          </div>
        </div>

        {/* Title */}
        <div style={{ fontSize: 20, color: '#4a6a8a', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 8 }}>
          Transaction
        </div>
        <div style={{ fontSize: 32, color: '#e0f7fa', fontWeight: 700, marginBottom: 40 }}>
          {shorten(hash, 10, 8)}
        </div>

        {/* Details grid */}
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {tx && (
            <>
              <InfoCard label="Value" value={`${weiToQfc(tx.value)} QFC`} />
              <InfoCard label="Block" value={`#${Number(tx.block_height).toLocaleString('en-US')}`} />
              <InfoCard label="From" value={shorten(tx.from_address, 8, 6)} />
              <InfoCard label="To" value={tx.to_address ? shorten(tx.to_address, 8, 6) : 'Contract Creation'} />
            </>
          )}
          {!tx && (
            <InfoCard label="Hash" value={shorten(hash, 14, 10)} />
          )}
        </div>

        {/* Arrow */}
        {tx && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 40, gap: 16 }}>
            <span style={{ fontSize: 18, color: '#4a6a8a' }}>{shorten(tx.from_address, 8, 6)}</span>
            <span style={{ fontSize: 28, color: '#4fc3f7' }}>&rarr;</span>
            <span style={{ fontSize: 18, color: '#4a6a8a' }}>{tx.to_address ? shorten(tx.to_address, 8, 6) : 'New Contract'}</span>
          </div>
        )}

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
