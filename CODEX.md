# CODEX Progress

Last updated: 2026-02-01

## Summary
This file tracks implementation progress for `qfc-explorer` beyond TODO checkboxes.

## Completed
- Project scaffold (Next.js + Tailwind) and base layout
- PostgreSQL connection pool + health endpoint
- Database schema + migrations
- Indexer with:
  - polling, finalized-height usage, retries, and skip-on-error
  - batch inserts for txs/logs
  - account balance/nonce refresh
  - failure tracking and batch stats in `indexer_state`
- Explorer pages:
  - home, blocks list/detail, tx list/detail, address detail
  - search results + suggestions
  - network dashboard (validators/epoch/node info)
  - loading skeletons + copy buttons + status badges
- API layer:
  - unified responses (`ok`/`fail`)
  - blocks/txs/address/detail/search/network/stats endpoints
  - pagination, sorting, filtering
- Docker deployment (Dockerfile + docker-compose)
- Health checks + data consistency checks
- Tokenomics page (QFC native token)
- ERC-20 indexing (Transfer logs) + token list/detail pages

## In Progress / Not Done
- Database index optimization (beyond initial indexes)
- Real-time updates (client polling or WS)
- Charts/visualizations for stats
- Token/contract pages
- Automated tests (indexer + API)

## Next Suggested Steps
1) DB index tuning based on query patterns
2) Real-time refresh for key pages
3) Charts for TPS/block time/active addresses
4) Token/contract discovery pages
5) Add tests

## Key Commands
- Migrate: `npm run db:migrate`
- Indexer: `npm run indexer`
- Health: `npm run indexer:health`
- Data checks: `npm run data:check`
- Docker: `docker compose up --build`
