import { ImageResponse } from 'next/og';
import { getApiBaseUrl } from '@/lib/api-client';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'QFC Block';

function shorten(value: string, head = 6, tail = 4): string {
  if (!value || value.length <= head + tail + 2) return value || '';
  return `${value.slice(0, head + 2)}...${value.slice(-tail)}`;
}

function formatTimestamp(ms: string): string {
  const num = Number(ms);
  if (!Number.isFinite(num)) return '--';
  return new Date(num).toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
}

export default async function OgImage({ params }: { params: { height: string } }) {
  const height = params.height;
  const base = getApiBaseUrl();

  let producer: string | null = null;
  let timestampMs: string | null = null;
  let txCount = '--';
  let gasUsed: string | null = null;

  try {
    const response = await fetch(`${base}/api/blocks/${height}?limit=1`, { cache: 'no-store' });
    if (response.ok) {
      const json = await response.json();
      const block = json?.data?.block;
      const txs = json?.data?.transactions;
      if (block) {
        producer = block.producer;
        timestampMs = block.timestamp_ms;
        gasUsed = block.gas_used;
      }
      if (txs) {
        txCount = String(txs.length);
      }
    }
  } catch {
    // Fall back to height-only display
  }

  const formattedHeight = Number(height).toLocaleString('en-US');

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
        </div>

        {/* Title */}
        <div style={{ fontSize: 20, color: '#4a6a8a', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 8 }}>
          Block
        </div>
        <div style={{ fontSize: 48, color: '#e0f7fa', fontWeight: 700, marginBottom: 48 }}>
          #{formattedHeight}
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <InfoCard label="Transactions" value={txCount} />
          {producer && <InfoCard label="Producer" value={shorten(producer, 8, 6)} />}
          {timestampMs && <InfoCard label="Timestamp" value={formatTimestamp(timestampMs)} />}
          {gasUsed && <InfoCard label="Gas Used" value={Number(gasUsed).toLocaleString('en-US')} />}
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
        minWidth: 180,
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
