# QFC Explorer 前后端分离技术选型分析

## 1. 当前架构

```
qfc-explorer (Next.js 14 全栈单体)
  ├── src/app/          前端页面 (SSR + CSR)
  ├── src/app/api/      API Routes (与前端同进程)
  ├── src/db/           PostgreSQL 直连 (pg pool)
  └── src/indexer/      区块索引器 (独立进程)
```

**优点**：部署简单，开发效率高，一个 Docker 搞定
**瓶颈**：API 无法独立扩缩容，无常驻进程（无法做 Prometheus histogram），前后端耦合

---

## 2. 后端技术选型

### 候选方案对比

| 维度 | Fastify + TS | Express + TS | NestJS | Go (Gin/Fiber) | Rust (Axum) |
|------|-------------|-------------|--------|----------------|-------------|
| 性能 | 极高 (schema 序列化) | 中等 | 中等 | 极高 | 极高 |
| 生态 | 丰富 | 最丰富 | 丰富 | 丰富 | 中等 |
| 类型安全 | TS 原生 | TS 原生 | TS + 装饰器 | 编译期 | 编译期 |
| 学习成本 | 低 (团队已用 TS) | 最低 | 中 (DI/装饰器) | 中 (新语言) | 高 |
| 迁移成本 | 低 (复用现有 DB 层) | 低 | 中 | 高 (重写) | 高 (重写) |
| Prometheus | prom-client 原生 | prom-client 原生 | 内置支持 | prometheus/client_golang | prometheus crate |
| WebSocket | @fastify/websocket | ws/socket.io | 内置 gateway | gorilla/websocket | tokio-tungstenite |
| 启动速度 | 快 | 快 | 较慢 (DI 初始化) | 极快 | 极快 |

### 推荐：Fastify + TypeScript

**理由**：

1. **代码复用最大化** — 现有 `src/db/queries.ts`、`src/lib/format.ts` 等可直接迁移，零重写
2. **性能优异** — Fastify 的 JSON Schema 序列化比 Express 快 2-3x，接近 Go 水平
3. **Prometheus 天然支持** — 常驻进程 + `prom-client` 库，histogram/counter/gauge 全支持
4. **WebSocket 原生** — `@fastify/websocket` 插件，实时推送新区块/交易
5. **团队一致性** — 前后端统一 TypeScript，降低维护成本
6. **插件体系** — 中间件即插件，CORS / Auth / Rate Limit / Swagger 开箱即用

### 为什么不选其他方案？

| 方案 | 不选原因 |
|------|---------|
| Express | 性能不如 Fastify，中间件模型更松散 |
| NestJS | 过度设计，区块链浏览器 API 不需要 DI / 模块化 / 装饰器 |
| Go | 需要重写所有 DB 查询和业务逻辑，团队学习成本高 |
| Rust | 开发效率低，区块链浏览器 API 是 IO 密集型不是 CPU 密集型 |

---

## 3. 前端技术选型

### 候选方案对比

| 维度 | Next.js (保持) | React + Vite SPA | Vue 3 + Vite | Svelte/SvelteKit |
|------|---------------|-------------------|-------------|-----------------|
| SSR/SEO | 内置 SSR/SSG | 无 (纯 CSR) | Nuxt 可选 | SvelteKit 可选 |
| 首屏速度 | 快 (服务端渲染) | 慢 (需下载 JS) | 中等 | 快 |
| 迁移成本 | 零 | 高 (重写路由/SSR) | 极高 (换框架) | 极高 |
| Bundle 大小 | 自动分割 | 需手动配置 | 自动分割 | 最小 |
| 生态 | 最丰富 | 丰富 | 丰富 | 发展中 |
| 学习曲线 | 中 (RSC 概念) | 低 | 低 | 低 |

### 推荐：保持 Next.js

**理由**：

1. **SEO 是刚需** — 区块链浏览器的地址页、交易页、合约页需要被搜索引擎收录。用户搜索 `0x1234... qfc` 应该能直接找到对应页面。纯 SPA 做不到
2. **零迁移成本** — 当前 `src/app/` 下几十个页面都是 Next.js App Router 写法，无需改动
3. **分离 ≠ 换框架** — 前后端分离的核心是把 `src/app/api/` 抽到 Fastify，前端改为 `fetch` 外部 API。框架本身不需要换
4. **SSR + CSR 混合** — 首页、详情页用 SSR（SEO + 首屏快），交互组件用 CSR（流畅体验）
5. **已有组件库** — SearchBar、Table、DailyCharts、ContractInteraction 等组件稳定运行

### 什么时候选 Vite SPA？

- 纯 DApp（钱包交互、Swap 界面）— 不需要 SEO
- 内部管理后台 — 不需要搜索引擎收录
- 嵌入式 Widget — 嵌入到其他网站的小组件

区块链浏览器不属于以上场景。

---

## 4. 分离后的目标架构

```
                    +---------------+
                    |  Cloudflare   |
                    |  CDN / Proxy  |
                    +-------+-------+
                            |
              +-------------+-------------+
              |                           |
        +-----+------+            +------+------+
        | qfc-explorer|           | qfc-api     |
        | (Next.js)   |           | (Fastify)   |
        | 前端渲染     |---------->| 常驻 API    |
        | Port: 3000  |  fetch()  | Port: 3001  |
        +-------------+           +------+------+
                                         |
                                  +------+------+
                                  |   Redis     |
                                  |  缓存层     |
                                  +------+------+
                                         |
                                  +------+------+
                                  | PostgreSQL  |
                                  +------+------+
                                         |
                                  +------+------+
                                  | qfc-indexer |
                                  | 独立进程     |
                                  +-------------+
```

### 各层职责

| 层 | 职责 | 技术 |
|----|------|------|
| **qfc-explorer** | 页面渲染、静态资源、SEO | Next.js 14, Tailwind CSS |
| **qfc-api** | 数据查询、业务逻辑、指标导出 | Fastify, TypeScript, prom-client |
| **Redis** | 热数据缓存、Rate Limit | Redis 7 |
| **PostgreSQL** | 持久化存储 | PostgreSQL 16 |
| **qfc-indexer** | 链上数据索引 | Node.js 独立进程 |

---

## 5. 迁移策略

### 原则：渐进式，不停服

```
Phase A (现在)     Phase B (分离)          Phase C (优化)
+-----------+      +-----------+           +-----------+
| Next.js   |      | Next.js   |           | Next.js   |
| API Routes|  ->  | fetch()   |  ->       | fetch()   |
| DB 直连   |      |     |     |           |     |     |
+-----------+      |  Fastify  |           |  Fastify  |
                   |  DB 直连  |           |  Redis    |
                   +-----------+           |  DB 读写分离|
                                           +-----------+
```

### Phase B 迁移步骤

#### Step 1: 创建 qfc-api 项目骨架

```
qfc-api/
  src/
    server.ts          # Fastify 入口
    routes/
      blocks.ts        # /blocks, /blocks/:id
      transactions.ts  # /txs, /txs/:hash
      addresses.ts     # /address/:addr
      contracts.ts     # /contract/:addr
      tokens.ts        # /tokens, /tokens/:addr
      analytics.ts     # /analytics/daily, /analytics/stats
      search.ts        # /search, /search/suggest
      tools.ts         # /tools/keccak256, /tools/abi-encode
      health.ts        # /health, /metrics
    db/
      pool.ts          # 从 qfc-explorer/src/db/ 迁移
      queries.ts       # 从 qfc-explorer/src/db/ 迁移
    middleware/
      metrics.ts       # Prometheus 计时中间件
      cors.ts          # CORS 配置
      rateLimit.ts     # 限流
    lib/
      format.ts        # 从 qfc-explorer/src/lib/ 迁移
  package.json
  tsconfig.json
  Dockerfile
```

#### Step 2: 逐个迁移 API Route

```typescript
// 迁移前: qfc-explorer/src/app/api/blocks/route.ts
import { getPool } from '@/db/pool';
export async function GET() {
  const pool = getPool();
  const result = await pool.query('SELECT ...');
  return Response.json({ ok: true, data: result.rows });
}

// 迁移后: qfc-api/src/routes/blocks.ts
import { FastifyInstance } from 'fastify';
import { getPool } from '../db/pool';

export default async function blocksRoutes(app: FastifyInstance) {
  app.get('/blocks', async (request, reply) => {
    const pool = getPool();
    const result = await pool.query('SELECT ...');
    return { ok: true, data: result.rows };
  });
}
```

#### Step 3: 前端改为调用外部 API

```typescript
// 迁移前: qfc-explorer/src/lib/api-client.ts
const BASE = process.env.NEXT_PUBLIC_API_URL || '';
// fetch('/api/blocks') → 同进程 API Route

// 迁移后:
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
// fetch('http://localhost:3001/blocks') → 独立 Fastify 服务
```

#### Step 4: Prometheus 指标

```typescript
// qfc-api/src/middleware/metrics.ts
import { register, Histogram, Counter, Gauge } from 'prom-client';

const httpDuration = new Histogram({
  name: 'qfc_api_request_duration_seconds',
  help: 'API request duration in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
});

const httpErrors = new Counter({
  name: 'qfc_api_errors_total',
  help: 'Total API errors',
  labelNames: ['route', 'status'],
});

const indexerLag = new Gauge({
  name: 'qfc_indexer_lag_blocks',
  help: 'Blocks behind RPC head',
});

// Fastify hook: 每个请求自动计时
app.addHook('onResponse', (request, reply, done) => {
  httpDuration
    .labels(request.method, request.routeOptions.url || '', String(reply.statusCode))
    .observe(reply.elapsedTime / 1000);
  if (reply.statusCode >= 400) {
    httpErrors.labels(request.routeOptions.url || '', String(reply.statusCode)).inc();
  }
  done();
});

// GET /metrics
app.get('/metrics', async (req, reply) => {
  reply.type(register.contentType);
  return register.metrics();
});
```

#### Step 5: WebSocket 实时推送

```typescript
// qfc-api/src/routes/ws.ts
import { FastifyInstance } from 'fastify';

export default async function wsRoutes(app: FastifyInstance) {
  app.get('/ws', { websocket: true }, (socket, req) => {
    // 订阅新区块事件
    const onBlock = (block: any) => {
      socket.send(JSON.stringify({ type: 'new_block', data: block }));
    };

    blockEmitter.on('block', onBlock);
    socket.on('close', () => blockEmitter.off('block', onBlock));
  });
}
```

---

## 6. 部署方案

### Docker Compose (开发/测试)

```yaml
version: '3.8'
services:
  explorer:
    build: ./qfc-explorer
    ports: ['3000:3000']
    environment:
      NEXT_PUBLIC_API_URL: http://api:3001
    depends_on: [api]

  api:
    build: ./qfc-api
    ports: ['3001:3001']
    environment:
      DATABASE_URL: postgres://...
      REDIS_URL: redis://redis:6379
      RPC_URL: http://qfc-node:8545
    depends_on: [postgres, redis]

  indexer:
    build: ./qfc-api
    command: ['node', 'dist/indexer.js']
    environment:
      DATABASE_URL: postgres://...
      RPC_URL: http://qfc-node:8545
    depends_on: [postgres]

  postgres:
    image: postgres:16
    volumes: ['pgdata:/var/lib/postgresql/data']

  redis:
    image: redis:7-alpine

  prometheus:
    image: prom/prometheus
    volumes: ['./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml']
    ports: ['9090:9090']
```

### 生产环境

```
                  Cloudflare CDN
                       |
              +--------+--------+
              |                 |
         explorer:3000     api:3001
         (x2 replicas)    (x3 replicas)
                               |
                          Redis Cluster
                               |
                    +----------+----------+
                    |                     |
               PG Primary           PG Replica
               (写入)                (读取)
```

---

## 7. 执行优先级

| 优先级 | 任务 | 前提 | 工作量 |
|--------|------|------|--------|
| P0 | 保持现状，继续完善功能 | 无 | - |
| P1 | 创建 qfc-api 骨架 + 迁移 health/metrics | Phase A 完成 | 小 |
| P1 | 迁移核心 API (blocks/txs/address) | qfc-api 骨架就绪 | 中 |
| P2 | 迁移全部 API + 前端改调外部 | 核心 API 稳定 | 中 |
| P2 | Redis 缓存 + WebSocket | API 完全独立 | 中 |
| P3 | Prometheus + Grafana 部署 | API 独立 | 小 |
| P3 | DB 读写分离 + Indexer 拆分 | 数据量增长后 | 大 |

---

## 8. 结论

| 选择 | 推荐 | 理由 |
|------|------|------|
| **后端** | Fastify + TypeScript | 性能高、代码复用、Prometheus 原生支持 |
| **前端** | 保持 Next.js | SEO 刚需、零迁移成本、SSR + CSR 混合 |
| **缓存** | Redis | 热点查询、Rate Limit、Session |
| **监控** | Prometheus + Grafana | 行业标准、与 qfc-core 监控统一 |
| **部署** | Docker Compose → K8s | 渐进式，按需扩展 |

**核心原则**：不过早优化。Testnet 阶段保持 Next.js 全栈单体，Mainnet 前再拆分。
