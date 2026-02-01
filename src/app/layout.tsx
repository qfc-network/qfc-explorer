import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'QFC Explorer',
  description: 'QFC blockchain explorer',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
          {children}
        </div>
      </body>
    </html>
  );
}
