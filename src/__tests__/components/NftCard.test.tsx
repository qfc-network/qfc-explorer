import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import NftCard from '@/components/NftCard';

// Mock next/link to render a simple anchor
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

describe('NftCard', () => {
  const baseProps = {
    tokenAddress: '0x1234567890abcdef1234567890abcdef12345678',
    tokenId: '42',
    tokenType: 'erc721' as const,
  };

  it('renders with basic props', () => {
    render(<NftCard {...baseProps} />);
    expect(screen.getByText('NFT')).toBeInTheDocument();
  });

  it('displays token ID', () => {
    render(<NftCard {...baseProps} />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('shows collection name when provided', () => {
    render(<NftCard {...baseProps} collectionName="Cool Collection" />);
    expect(screen.getByText('Cool Collection')).toBeInTheDocument();
  });

  it('shows nft name over collection name', () => {
    render(<NftCard {...baseProps} collectionName="Collection" nftName="Special NFT" />);
    expect(screen.getByText('Special NFT')).toBeInTheDocument();
  });

  it('renders image when imageUrl provided', () => {
    render(<NftCard {...baseProps} imageUrl="https://example.com/nft.png" nftName="My NFT" />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/nft.png');
    expect(img).toHaveAttribute('alt', 'My NFT');
  });

  it('shows placeholder when no image', () => {
    render(<NftCard {...baseProps} />);
    expect(screen.getByText('#42')).toBeInTheDocument();
  });

  it('shows fallback placeholder on image error', () => {
    render(<NftCard {...baseProps} imageUrl="https://example.com/broken.png" />);
    const img = screen.getByRole('img');
    fireEvent.error(img);
    // After error, placeholder should appear
    expect(screen.getByText('#42')).toBeInTheDocument();
  });

  it('links to token page', () => {
    render(<NftCard {...baseProps} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', `/nft/${baseProps.tokenAddress}/${baseProps.tokenId}`);
  });

  it('shows 721 badge for erc721', () => {
    render(<NftCard {...baseProps} tokenType="erc721" />);
    expect(screen.getByText('721')).toBeInTheDocument();
  });

  it('shows 1155 badge for erc1155', () => {
    render(<NftCard {...baseProps} tokenType="erc1155" />);
    expect(screen.getByText('1155')).toBeInTheDocument();
  });

  it('shows balance for erc1155 when balance > 1', () => {
    render(<NftCard {...baseProps} tokenType="erc1155" balance="5" />);
    expect(screen.getByText('x5')).toBeInTheDocument();
  });

  it('does not show balance for erc1155 when balance is 1', () => {
    render(<NftCard {...baseProps} tokenType="erc1155" balance="1" />);
    expect(screen.queryByText('x1')).not.toBeInTheDocument();
  });

  it('truncates long token IDs', () => {
    render(<NftCard {...baseProps} tokenId="123456789012345" />);
    expect(screen.getByText('12345678...')).toBeInTheDocument();
  });

  it('uses alt text with # prefix when no nftName', () => {
    render(<NftCard {...baseProps} imageUrl="https://example.com/nft.png" />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('alt', '#42');
  });
});
