# QFC Explorer

**English** | [中文](./README.zh-CN.md)

Block explorer **frontend** for the QFC blockchain, built with Next.js 14 (App Router), React 18, TypeScript, and Tailwind CSS.

Live: https://explorer.testnet.qfc.network

> All backend logic — REST API, PostgreSQL, and the chain indexer — lives in [qfc-explorer-api](https://github.com/qfc-network/qfc-explorer-api). This repo is the UI only and talks to that service over HTTP.

## Features

- Blocks, transactions, addresses, tokens (ERC-20 / NFT), and contract pages
- Contract read/write interaction and source verification
- AI inference tasks, miner revenue dashboard, validators and network analytics
- DEX, bridge, and gas-tracker views
- i18n (English / 中文 / 日本語 / 한국어), dark mode, live updates

## Environment Variables

| Variable | Description | Example |
| --- | --- | --- |
| `API_URL` | Backend base URL for server-side (SSR) fetches; not exposed to the browser | `http://explorer-api:3001` |
| `NEXT_PUBLIC_API_URL` | Backend base URL for browser fetches; also the SSR fallback | `https://api.explorer.testnet.qfc.network` |

If neither is set, the app falls back to relative `/api` routes (useful behind a reverse proxy that routes `/api` to the backend).

## Quick Start

```bash
npm install
export NEXT_PUBLIC_API_URL=https://api.explorer.testnet.qfc.network
npm run dev
```

Open `http://localhost:3000`.

## Commands

```bash
npm run dev        # dev server
npm run build      # production build
npm run start      # serve the production build
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm test           # vitest
```

## Deployment

A `Dockerfile` is included; images are built by CI from the `staging` branch and deployed via [qfc-testnet](https://github.com/qfc-network/qfc-testnet). Point `API_URL` / `NEXT_PUBLIC_API_URL` at a running qfc-explorer-api instance.

## Related Repositories

| Repo | Role |
| --- | --- |
| [qfc-explorer-api](https://github.com/qfc-network/qfc-explorer-api) | REST API + PostgreSQL + chain indexer |
| [qfc-core](https://github.com/qfc-network/qfc-core) | Blockchain node (JSON-RPC source) |
| [qfc-testnet](https://github.com/qfc-network/qfc-testnet) | Testnet deployment infrastructure |
