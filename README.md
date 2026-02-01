# QFC Explorer

QFC 区块浏览器（Next.js + PostgreSQL + Indexer）。

## 环境变量

| 变量 | 说明 | 示例 |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL 连接串 | `postgres://qfc:qfc@localhost:5432/qfc_explorer` |
| `RPC_URL` | QFC 节点 JSON-RPC 地址 | `http://127.0.0.1:8545` |
| `NEXT_PUBLIC_BASE_URL` | SSR 请求 API 的基础 URL | `http://localhost:3000` |
| `INDEXER_START_HEIGHT` | 索引起始高度 | `0` |
| `INDEXER_END_HEIGHT` | 索引结束高度（可选） | `1000` |
| `INDEXER_POLL_INTERVAL_MS` | 轮询间隔 | `10000` |
| `INDEXER_USE_FINALIZED` | 使用 finalized 高度 | `true` |
| `INDEXER_BLOCK_RETRIES` | 单块重试次数 | `3` |
| `INDEXER_SKIP_ON_ERROR` | 失败跳过 | `false` |
| `INDEXER_RETRY_FAILED` | 启动时重试失败块 | `false` |
| `INDEXER_HEALTH_MAX_AGE_MS` | 健康检查最大滞后 | `300000` |
| `SSE_INTERVAL_MS` | 实时推送间隔（最小 3000） | `5000` |

生产环境模板：`.env.production.example`

## 快速开始（本地）

```bash
npm install
cp .env.example .env
# set DATABASE_URL and RPC_URL
npm run db:migrate
npm run dev
```

## 快速开始（Docker）

```bash
export RPC_URL=http://127.0.0.1:8545

docker compose up --build

docker compose exec explorer npm run db:migrate
```

使用 profiles 只启动某个服务：
```bash
docker compose --profile explorer up --build
docker compose --profile indexer up --build
```

访问：`http://localhost:3000`

## 常用命令

```bash
npm run db:migrate        # 迁移
npm run indexer           # 运行索引器
npm run indexer:health    # 索引器健康检查
npm run data:check        # 数据一致性检查
npm test                  # 测试
```

## API 概览

- `GET /api/blocks?page&limit&order&producer`
- `GET /api/blocks/:height?page&limit&order`
- `GET /api/transactions?page&limit&order&address&status`
- `GET /api/txs/:hash`
- `GET /api/address/:address?page&limit&order`
- `GET /api/tokens?page&limit&order`
- `GET /api/tokens/:address?page&limit&order`
- `GET /api/tokens/:address/holders?limit`
- `GET /api/search?q=`
- `GET /api/search/suggest?q=`
- `GET /api/network`
- `GET /api/stats`

响应统一格式：
```json
{ "ok": true, "data": { ... } }
```

## 备注
- Indexer 需要可用的 QFC RPC。
- API 集成测试要求服务可访问（`NEXT_PUBLIC_BASE_URL`）。
