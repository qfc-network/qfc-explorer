import { ImageResponse } from 'next/og';
import { getApiBaseUrl } from '@/lib/api-client';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'QFC Address';

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

export default async function OgImage({ params }: { params: { address: string } }) {
  const address = params.address;
  const base = getApiBaseUrl();

  let balance = '—';
  let txCount = '—';
  let isContract = false;
  let label: string | null = null;

  try {
    const response = await fetch(`${base}/api/address/${address}?limit=1`, { cache: 'no-store' });
    if (response.ok) {
      const json = await response.json();
      const data = json?.data;
      if (data?.address) {
        balance = weiToQfc(data.address.balance);
        const stats = data.stats;
        if (stats) {
          txCount = String(Number(stats.sent) + Number(stats.received));
        }
        isContract = data.contract != null;
      }
    }
  } catch {
    // Fall back to address-only display
  }

  const typeBadge = isContract ? 'Contract' : 'EOA';
  const badgeColor = isContract ? '#a78bfa' : '#4fc3f7';
  const badgeBg = isContract ? 'rgba(167,139,250,0.12)' : 'rgba(79,195,247,0.12)';

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
              background: badgeBg,
              color: badgeColor,
              fontSize: 20,
              fontWeight: 700,
            }}
          >
            {typeBadge}
          </div>
        </div>

        {/* Title */}
        <div style={{ fontSize: 20, color: '#4a6a8a', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 8 }}>
          Address
        </div>
        <div style={{ fontSize: 30, color: '#e0f7fa', fontWeight: 700, marginBottom: 48 }}>
          {shorten(address, 12, 10)}
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 24 }}>
          <InfoCard label="Balance" value={`${balance} QFC`} />
          <InfoCard label="Transactions" value={txCount} />
          <InfoCard label="Type" value={typeBadge} />
        </div>

        {label && (
          <div style={{ marginTop: 24, fontSize: 20, color: '#4fc3f7' }}>
            {label}
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
