import type { MetadataRoute } from 'next';

const BASE_URL = 'https://explorer.testnet.qfc.network';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    '',
    '/blocks',
    '/txs',
    '/tokens',
    '/token-transfers',
    '/contracts',
    '/gas-tracker',
    '/analytics',
    '/leaderboard',
    '/network',
    '/inference',
    '/tools',
    '/approvals',
    '/search',
    '/governance/models',
    '/token/qfc',
  ];

  return staticPages.map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '' ? 'always' : 'hourly',
    priority: path === '' ? 1.0 : 0.8,
  }));
}
