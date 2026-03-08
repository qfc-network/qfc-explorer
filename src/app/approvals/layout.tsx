import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Token Approvals',
  description: 'Check and manage ERC-20 token approvals on the QFC blockchain.',
  openGraph: {
    title: 'Token Approvals | QFC Explorer',
    description: 'Check and manage ERC-20 token approvals on the QFC blockchain.',
    type: 'website',
  },
};

export default function ApprovalsLayout({ children }: { children: ReactNode }) {
  return children;
}
