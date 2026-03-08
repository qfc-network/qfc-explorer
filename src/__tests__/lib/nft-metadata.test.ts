import { describe, it, expect } from 'vitest';
import { resolveUri } from '@/lib/nft-metadata';

describe('resolveUri', () => {
  it('returns empty string for empty input', () => {
    expect(resolveUri('')).toBe('');
  });

  it('resolves ipfs:// URI', () => {
    expect(resolveUri('ipfs://QmTest123')).toBe('https://ipfs.io/ipfs/QmTest123');
  });

  it('resolves ipfs://ipfs/ URI (double ipfs prefix)', () => {
    expect(resolveUri('ipfs://ipfs/QmTest123')).toBe('https://ipfs.io/ipfs/QmTest123');
  });

  it('resolves ar:// URI', () => {
    expect(resolveUri('ar://txid123')).toBe('https://arweave.net/txid123');
  });

  it('returns data: URI as-is', () => {
    const dataUri = 'data:application/json;base64,eyJuYW1lIjoiVGVzdCJ9';
    expect(resolveUri(dataUri)).toBe(dataUri);
  });

  it('returns http:// URL as-is', () => {
    const url = 'http://example.com/metadata.json';
    expect(resolveUri(url)).toBe(url);
  });

  it('returns https:// URL as-is', () => {
    const url = 'https://example.com/metadata.json';
    expect(resolveUri(url)).toBe(url);
  });

  it('resolves bare CID starting with Qm', () => {
    const cid = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG';
    expect(resolveUri(cid)).toBe(`https://ipfs.io/ipfs/${cid}`);
  });

  it('resolves bare CID starting with bafy', () => {
    const cid = 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi';
    expect(resolveUri(cid)).toBe(`https://ipfs.io/ipfs/${cid}`);
  });

  it('trims whitespace', () => {
    expect(resolveUri('  ipfs://QmTest  ')).toBe('https://ipfs.io/ipfs/QmTest');
  });

  it('returns unknown URIs as-is', () => {
    expect(resolveUri('ftp://example.com/file')).toBe('ftp://example.com/file');
  });

  it('handles ipfs:// with path', () => {
    expect(resolveUri('ipfs://QmTest/metadata.json')).toBe('https://ipfs.io/ipfs/QmTest/metadata.json');
  });
});
