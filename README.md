# QFC Explorer

## Quick start (Docker)

1) Set `RPC_URL` in your environment:
```bash
export RPC_URL=https://rpc.testnet.qfc.network
```

2) Start services:
```bash
docker compose up --build
```

3) Run migrations:
```bash
docker compose exec explorer npm run db:migrate
```

Explorer will be at http://localhost:3000

## Local development

```bash
npm install
cp .env.example .env
# set DATABASE_URL and RPC_URL
npm run db:migrate
npm run dev
```
