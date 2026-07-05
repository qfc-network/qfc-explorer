import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // '/*?page=' keeps crawlers off deep pagination — bots walking stale
      // pre-reset block URLs page-by-page were a real SSR memory driver.
      disallow: ['/admin', '/api/', '/*?page='],
    },
    sitemap: 'https://explorer.testnet.qfc.network/sitemap.xml',
  };
}
