# QFC Explorer — Developer Guide

## Project Overview
QFC blockchain explorer built with Next.js 14 (App Router), PostgreSQL, Tailwind CSS.

## Tech Stack
- **Framework**: Next.js 14, React 18, TypeScript
- **Database**: PostgreSQL (via `pg` pool)
- **Styling**: Tailwind CSS
- **Indexer**: Custom block indexer (`src/indexer/`)
- **Solidity compiler**: `solc` (for contract verification)

## Key Commands
```bash
npm run dev          # Dev server
npm run build        # Production build
npm run typecheck    # TypeScript check (tsc --noEmit)
npm run db:migrate   # Run DB migrations
npm run indexer      # Start block indexer
npm test             # Run vitest
```

## Project Structure
```
src/
  app/                    # Next.js App Router pages & API routes
    api/
      contract/[address]/ # GET contract info (bytecode, balance, verification status)
      contracts/          # GET list contracts
      contracts/verify/   # POST verify contract source code
      blocks/, txs/       # Block & transaction APIs
      tokens/             # ERC-20 token APIs
      inference/          # AI inference APIs
      governance/         # Governance APIs
  components/             # React components
    ContractInteraction   # Read/write contract functions
    ContractVerification  # Source code verification form + display
  db/
    pool.ts               # PostgreSQL connection pool
    queries.ts            # DB query helpers
  indexer/                # Block indexer (processes blocks from RPC)
  lib/                    # Utilities (api-client, format, pagination)
scripts/
  migrations/             # SQL migrations (run sequentially)
    001_init.sql          # Base schema (blocks, transactions, accounts, contracts, events)
    002_contract_verification.sql  # Adds verification fields to contracts table
```

## Database Schema — contracts table
```sql
contracts (
  address TEXT PRIMARY KEY,
  creator_tx_hash TEXT,
  created_at_block BIGINT,
  code_hash TEXT,
  source_code TEXT,           -- Verified Solidity source
  abi JSONB,                  -- Parsed ABI from compilation
  compiler_version TEXT,      -- e.g. "v0.8.28"
  evm_version TEXT,           -- e.g. "paris" (default)
  optimization_runs INTEGER,  -- null = no optimization
  constructor_args TEXT,      -- ABI-encoded hex
  is_verified BOOLEAN,        -- true after successful verification
  verified_at TIMESTAMPTZ
)
```

## Contract Verification Flow
1. User submits source code + compiler settings to `POST /api/contracts/verify`
2. Server compiles with `solc` (standard JSON input)
3. Strips CBOR metadata from both deployed and compiled bytecodes
4. Compares stripped bytecodes — if match, stores source + ABI in DB
5. Contract page shows green "Verified" badge and source code

## QFC-Specific Notes
- **EVM version**: QFC does NOT support PUSH0 opcode. Always compile with `evmVersion: "paris"` (not "shanghai" or later).
- **eth_call quirk**: QFC testnet `eth_call` may return `0x` for view functions. Use `eth_getStorageAt` as workaround for reading contract state.
- **RPC URL**: Configured via `RPC_URL` env var (default: `http://127.0.0.1:8545`)
  - Testnet: `https://rpc.testnet.qfc.network` (Chain ID 9000)
  - Mainnet: `https://rpc.qfc.network` (Chain ID 9001)
- **Explorer URL**: `https://explorer.testnet.qfc.network`

## API Response Format
All API routes use `ok(data)` / `err(message, status)` from `src/lib/api-response.ts`:
```json
{ "ok": true, "data": { ... } }
{ "ok": false, "error": "message" }
```

## After DB Schema Changes
Run the new migration:
```bash
psql $DATABASE_URL < scripts/migrations/002_contract_verification.sql
```
Or add to `scripts/migrate.js` and run `npm run db:migrate`.
