import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'QFC Explorer — Blockchain Explorer for the QFC Network';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0a1628 0%, #0d2847 50%, #0a1628 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Logo area */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 80,
            height: 80,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #4fc3f7, #0288d1)',
            fontSize: 40,
            fontWeight: 800,
            color: '#ffffff',
            marginBottom: 32,
          }}
        >
          Q
        </div>

        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: '#e0f7fa',
            marginBottom: 16,
          }}
        >
          QFC Explorer
        </div>

        <div
          style={{
            fontSize: 24,
            color: '#4fc3f7',
            marginBottom: 48,
          }}
        >
          Blockchain Explorer for the QFC Network
        </div>

        {/* Stats row */}
        <div
          style={{
            display: 'flex',
            gap: 48,
          }}
        >
          <StatBox label="Chain ID" value="9000" />
          <StatBox label="Consensus" value="PoC" />
          <StatBox label="Network" value="Testnet" />
        </div>

        {/* Footer */}
        <div
          style={{
            position: 'absolute',
            bottom: 32,
            fontSize: 16,
            color: '#4a6a8a',
          }}
        >
          explorer.testnet.qfc.network
        </div>
      </div>
    ),
    { ...size }
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '16px 32px',
        borderRadius: 12,
        border: '1px solid #1e3a5f',
        background: 'rgba(15, 30, 55, 0.8)',
      }}
    >
      <span style={{ fontSize: 14, color: '#4a6a8a', textTransform: 'uppercase', letterSpacing: 2 }}>
        {label}
      </span>
      <span style={{ fontSize: 28, fontWeight: 700, color: '#e0f7fa', marginTop: 4 }}>
        {value}
      </span>
    </div>
  );
}
