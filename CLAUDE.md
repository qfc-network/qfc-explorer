# QFC Explorer — Developer Guide

## Project Overview
QFC blockchain explorer **frontend** built with Next.js 14 (App Router), Tailwind CSS.
All backend logic (API routes, database, indexer) lives in [qfc-explorer-api](https://github.com/qfc-network/qfc-explorer-api).

## Tech Stack
- **Framework**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **i18n**: Custom translation system (en/zh/ja/ko) via `TranslatedText` component
- **Testing**: Vitest + Testing Library

## Key Commands
```bash
npm run dev          # Dev server
npm run build        # Production build
npm run typecheck    # TypeScript check (tsc --noEmit)
npm test             # Run vitest
```

## Project Structure
```
src/
  app/                    # Next.js App Router pages (server components)
    address/[address]/    # Address detail page
    block/[height]/       # Block detail page
    tx/[hash]/            # Transaction detail page
    bridge/               # Bridge status page
    miner/[address]/      # Miner revenue dashboard
    admin/                # Admin dashboard
    ...
  components/             # React components
    Navbar                # Navigation bar (responsive, dark mode toggle)
    Table                 # Generic table component
    StatsCard             # Metric display card
    TranslatedText        # i18n text component
    ContractInteraction   # Read/write contract functions
    ContractVerification  # Source code verification form + display
  lib/
    api-client.ts         # Server-side: getApiBaseUrl(), resolveApiPath(), fetchJsonSafe()
    client-api.ts         # Client-side: apiUrl() for browser fetch calls
    format.ts             # Number/wei/hash formatting utilities
    i18n/                 # Translation files (en.ts, zh.ts, ja.ts, ko.ts)
```

## API Routing
The frontend proxies all data requests to `qfc-explorer-api` (Fastify, port 3001):

- **Server components**: Use `fetchJsonSafe()` from `src/lib/api-client.ts`
  - `API_URL` env var sets the backend base URL (e.g. `http://explorer-api:3001`)
  - `resolveApiPath()` strips the `/api/` prefix when routing externally
- **Client components**: Use `apiUrl()` from `src/lib/client-api.ts`
  - `NEXT_PUBLIC_API_URL` env var sets the browser-accessible backend URL
  - Also strips `/api/` prefix for external routing

## Environment Variables
| Variable | Default | Description |
|----------|---------|-------------|
| `API_URL` | — | Backend API URL for server-side requests |
| `NEXT_PUBLIC_API_URL` | — | Backend API URL for client-side requests |

## QFC-Specific Notes
- **Explorer URL**: `https://explorer.testnet.qfc.network`
- **Chain ID**: Testnet 9000, Mainnet 9001
