# QFC Explorer 架构分析：对标 Etherscan

## 1. Etherscan 架构推测

Etherscan 是闭源项目，以下根据公开信息（招聘需求、技术分享、可观测行为）推断：

```
                    +---------------+
                    |    CDN / LB   |
                    +-------+-------+
                            |
              +-------------+-------------+
              |             |             |
        +-----+-----+ +----+----+ +------+-----+
        |  Web App  | |   API   | |   Admin    |
        | (ASP.NET) | | Service | |   Panel    |
        +-----+-----+ +----+----+ +------+-----+
              |             |             |
              +-------------+-------------+
                            |
                    +-------+-------+
                    |     Redis     |  <-- 热数据缓存
                    +-------+-------+
                            |
                    +-------+-------+
                    |  SQL Server   |  <-- 主数据库（分区/分片）
                    +-------+-------+
                            |
              +-------------+-------------+
              |             |             |
        +-----+-----+ +----+----+ +------+------+
        |   Block   | |  Token  | |  Contract   |
        |  Indexer  | | Indexer | |   Indexer   |
        +-----------+ +---------+ +-------------+
              |             |             |
              +-------------+-------------+
                            |
                    +-------+-------+
                    |   RPC Nodes   |
                    | (Geth / 多节点) |
                    +---------------+
```

### Etherscan 各层特点

| 层       | 技术选型             | 说明                                         |
|----------|---------------------|----------------------------------------------|
| Web      | ASP.NET MVC         | 服务端渲染，CDN 缓存静态资源                    |
| API      | 独立服务             | `api.etherscan.io`，与 Web 分离部署             |
| Indexer  | 多个独立服务          | Block / Token / Contract / Internal Tx 各自独立 |
| Cache    | Redis               | 首页统计、热门地址、最新区块等高频数据            |
| Database | SQL Server           | 按 block_height 范围分区，读写分离              |
| 监控     | Prometheus + Grafana | 全链路指标采集                                 |
| RPC      | 多节点 + 负载均衡    | Archive 节点用于历史查询                        |

---

## 2. QFC Explorer 现状

```
qfc-explorer/
  src/
    app/              <-- Next.js 前端页面（SSR + CSR）
    app/api/          <-- API Routes（与前端同进程）
    db/               <-- PostgreSQL 直连（pg pool）
    indexer/          <-- 区块索引器（独立进程：npm run indexer）
```

### 与 Etherscan 的对比

| 维度       | Etherscan                | QFC Explorer 现状          | 差距   |
|-----------|--------------------------|---------------------------|--------|
| Web 层    | ASP.NET MVC 服务端渲染    | Next.js 14 SSR + CSR      | 相当   |
| API 层    | 独立服务，常驻进程         | Next.js API Routes（无状态）| 中等   |
| Indexer   | 多个独立服务              | 单一进程                    | 中等   |
| Cache     | Redis，重度依赖           | 无缓存层                    | 较大   |
| Database  | SQL Server，分区 + 读写分离| PostgreSQL 单实例，无分区    | 较大   |
| 监控      | Prometheus + Grafana 全链路| 基础 healthcheck            | 较大   |
| RPC       | 多节点 + Archive           | 单节点                      | 中等   |

---

## 3. 演进路线建议

### Phase A: 短期优化（保持现有架构）

> 保持 Next.js 全栈单体，不拆分服务。

**适用阶段**：Testnet，数据量 < 100 万区块

```
qfc-explorer (Next.js)
  |
  +-- src/app/         前端页面
  +-- src/app/api/     API Routes
  +-- src/db/          PostgreSQL
  +-- src/indexer/     Indexer（独立进程）
```

优化项：

- [ ] `/api/metrics` 端点：从 DB 读取快照指标（indexer lag, 总区块数, 总交易数）
- [ ] Next.js middleware 记录 API 请求日志到 DB（latency, status code）
- [ ] Redis 缓存热点查询（首页统计、最新区块列表）
- [ ] 数据库索引优化 + 慢查询监控

**优点**：部署简单（一个 Docker），改动小
**缺点**：API Routes 无状态，无法在内存中累积 Prometheus histogram

---

### Phase B: 中期架构（API 层独立）

> 将 API 拆为独立的常驻 Node.js 服务，前端只做 SSR。

**适用阶段**：Mainnet 上线前，数据量 > 100 万区块

```
+------------------+     +-------------------+     +------------+
|  qfc-explorer    |     | qfc-explorer-api  |     | qfc-indexer|
|  (Next.js SSR)   |---->|  (Fastify/Express)|     | (独立服务)  |
|  前端页面渲染     |     |  常驻进程          |     |            |
+------------------+     +--------+----------+     +-----+------+
                                  |                       |
                          +-------+-------+               |
                          |     Redis     |               |
                          +-------+-------+               |
                                  |                       |
                          +-------+-------+               |
                          |  PostgreSQL   |<--------------+
                          +---------------+
```

收益：

- [x] Prometheus 指标自然支持（常驻进程内存累积 counter / histogram）
- [x] WebSocket 实时推送（新区块、新交易）
- [x] API 独立扩缩容（前端和 API 可以不同副本数）
- [x] Redis 缓存与 API 紧密集成
- [x] Indexer 拆分为多个专职服务（Block / Token / Contract）

拆分方式：

```
# 原来
src/app/api/blocks/route.ts     -> import { getPool } from '@/db/pool'

# 拆分后
qfc-explorer/src/app/api/       -> fetch('http://api:3001/blocks')
qfc-explorer-api/src/routes/    -> 直接查 DB，Prometheus 中间件计时
```

---

### Phase C: 长期架构（生产级）

> 对标 Etherscan 生产环境。

```
                    +---------------+
                    |  Cloudflare   |
                    |  CDN / WAF    |
                    +-------+-------+
                            |
              +-------------+-------------+
              |                           |
        +-----+------+            +------+------+
        | qfc-explorer|           | qfc-api     |
        | (Next.js)   |           | (Fastify)   |
        | x2 replicas |           | x3 replicas |
        +-------------+           +------+------+
                                         |
                                  +------+------+
                                  |   Redis     |
                                  |  Cluster    |
                                  +------+------+
                                         |
                            +------------+------------+
                            |                         |
                     +------+------+          +-------+-------+
                     |  PG Primary |          |  PG Replica   |
                     |  (写入)      |          |  (读取)        |
                     +------+------+          +---------------+
                            |
              +-------------+-------------+
              |             |             |
        +-----+-----+ +----+----+ +------+------+
        |   Block   | |  Token  | |  Contract   |
        |  Indexer  | | Indexer | |   Indexer   |
        +-----------+ +---------+ +-------------+
              |
        +-----+-----+
        |  Archive  |
        | RPC Node  |
        +-----------+

        +-------------------+
        | Prometheus        |
        | + Grafana         |
        | + AlertManager    |
        +-------------------+
```

新增：

- PostgreSQL 读写分离（Primary + Replica）
- 数据库按 block_height 分区
- Redis Cluster（缓存 + session + rate limit）
- 多 RPC 节点 + Archive 节点
- Indexer 拆分为 Block / Token / Contract / Internal Tx
- Prometheus + Grafana + AlertManager 全链路监控
- 归档表：老数据迁移到冷存储

---

## 4. Prometheus 指标实现方案

### 方案 A: DB 快照式（Phase A 适用）

在现有 Next.js 中加 `/api/metrics` 端点，每次请求从 DB 读取：

```
# HELP qfc_indexer_height Last indexed block height
# TYPE qfc_indexer_height gauge
qfc_indexer_height 123456

# HELP qfc_rpc_height Current RPC block height
# TYPE qfc_rpc_height gauge
qfc_rpc_height 123460

# HELP qfc_indexer_lag_blocks Blocks behind RPC head
# TYPE qfc_indexer_lag_blocks gauge
qfc_indexer_lag_blocks 4

# HELP qfc_total_blocks Total indexed blocks
# TYPE qfc_total_blocks gauge
qfc_total_blocks 123456

# HELP qfc_total_transactions Total indexed transactions
# TYPE qfc_total_transactions gauge
qfc_total_transactions 567890

# HELP qfc_total_accounts Total known accounts
# TYPE qfc_total_accounts gauge
qfc_total_accounts 1234

# HELP qfc_db_healthy Database connectivity
# TYPE qfc_db_healthy gauge
qfc_db_healthy 1

# HELP qfc_rpc_healthy RPC node connectivity
# TYPE qfc_rpc_healthy gauge
qfc_rpc_healthy 1
```

**优点**：零依赖，10 分钟实现
**缺点**：没有 API latency histogram 和 error rate counter

### 方案 B: 常驻进程式（Phase B 适用）

API 拆为独立 Fastify 服务后，用 `prom-client` 库：

```typescript
import { register, Histogram, Counter } from 'prom-client';

const httpDuration = new Histogram({
  name: 'qfc_api_request_duration_seconds',
  help: 'API request duration',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
});

const httpErrors = new Counter({
  name: 'qfc_api_errors_total',
  help: 'API error count',
  labelNames: ['route', 'status'],
});

// GET /metrics
app.get('/metrics', async (req, res) => {
  res.type(register.contentType);
  res.send(await register.metrics());
});
```

**优点**：完整的 latency / error rate / 自定义指标
**缺点**：需要拆分 API 层

---

## 5. 建议的执行顺序

| 优先级 | 任务                           | 阶段    | 工作量 |
|--------|-------------------------------|---------|--------|
| P0     | `/api/metrics` DB 快照式       | Phase A | 小     |
| P0     | Redis 缓存热点查询             | Phase A | 中     |
| P1     | 数据库分区 + 索引优化           | Phase A | 中     |
| P1     | API 请求日志记录               | Phase A | 小     |
| P2     | API 层拆分为独立服务            | Phase B | 大     |
| P2     | Prometheus + Grafana 部署      | Phase B | 中     |
| P3     | 读写分离 + Indexer 拆分         | Phase C | 大     |
| P3     | Archive 节点 + 多 RPC          | Phase C | 大     |

---

## 6. 结论

当前 Next.js 全栈架构在 Testnet 阶段完全够用。建议：

1. **现在**：做 Phase A（DB 快照式 metrics + Redis 缓存），不拆分
2. **Mainnet 前**：做 Phase B（API 独立 + 完整 Prometheus）
3. **数据量增长后**：做 Phase C（读写分离 + 分区 + Indexer 拆分）

不要过早优化。Etherscan 也是从单体逐步演进到现在的架构。
