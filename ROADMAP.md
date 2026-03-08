# QFC Explorer Roadmap

对标 Etherscan，分阶段提升 QFC Explorer 至生产级区块链浏览器。

## 当前状态

已有功能：首页实时统计、区块/交易/地址浏览、合约验证与交互（单文件+多文件）、
ERC-20/721/1155 Token 追踪、Internal Transactions、AI 推理任务查询、
网络/验证者仪表板、分析图表+每日统计、数据导出（CSV/JSON）、
全文搜索+地址标签、WebSocket 实时推送、管理后台（含归档/标签/缓存监控）、
排行榜（余额/活跃/验证者/合约）、Prometheus 可观测性、Redis 缓存集群。

**后端已迁移至独立 Fastify API 服务 (qfc-explorer-api)**，前端通过 API_URL 调用。

---

## Phase 1: 首页改版 + 搜索增强 ✅

### 1.1 首页重设计
- [x] 顶部网络概览卡片栏：Block Height / Block Time / TPS / Addresses / Chain ID / Finality
- [x] 最新区块 + 最新交易双列实时滚动（参考 Etherscan 首页布局）
- [x] 迷你折线图：Block Time / Txs per Block / Active Addresses
- [x] 搜索框居中突出，支持 placeholder 提示 "Search by Address / Tx Hash / Block / Token"
- [ ] QFC Price / Market Cap（需要价格 API 接入，等主网上线）

### 1.2 全局搜索增强
- [x] 统一搜索框：地址 / TX Hash / Block Height / Block Hash
- [x] 搜索下拉实时建议（debounce 200ms）
- [x] 搜索历史记录（localStorage）
- [x] 无结果时显示友好提示 + 相似建议
- [x] Token Name / Contract Name / Address Label 搜索
- [x] 分类搜索结果（block / transaction / address / token / contract / label）

### 1.3 Header/Footer 优化
- [x] 固定导航栏：Home / Blockchain / Tokens / Contracts / AI Inference / Network
- [x] 下拉子菜单：Blockchain → Blocks, Transactions; Tokens → Token List, Tokenomics
- [x] Footer：链接到 qfc.network、Docs、GitHub、Faucet
- [x] 移动端响应式汉堡菜单

---

## Phase 2: 地址页 + 交易页深度增强 ✅

### 2.1 地址页 Tab 化
- [x] Overview：余额、Nonce、交易数、最后活跃
- [x] Transactions Tab：分页交易列表（IN/OUT 方向标签）
- [x] Token Transfers Tab：ERC-20 转账记录（含 Token 符号/精度）
- [x] Internal Transactions Tab：合约内部调用追踪（debug_traceTransaction）
- [x] Contract Tab（合约地址）：验证状态、创建交易、Code Hash

### 2.2 交易页增强
- [x] Input Data 解码：已知 ERC-20/721 函数选择器 + ABI 自动解码参数
- [x] Event Logs 解码（Transfer/Approval 等已知事件 + 已验证合约 ABI）
- [x] Gas 使用可视化（used / limit 进度条，三色标识）
- [x] Etherscan 风格 Row 布局 + 时间戳显示
- [x] Internal Transactions 显示
- [x] 交易状态时间线：Pending → Confirmed → Finalized
- [x] Archive fallback（老交易从归档表查询）

### 2.3 Pending Transactions 页
- [ ] 需要 qfc-core 新增 `txpool_content` RPC 端点
- [ ] 实时 mempool 展示（通过 RPC 轮询）
- [ ] 按 Gas Price 排序
- [ ] 自动刷新 + 确认后移除

---

## Phase 3: Token 生态完善 ✅

### 3.1 ERC-20 增强
- [x] Token 持有者排名页（Top Holders with percentage）
- [x] Token 详情页：总供应量、持有者数、转账次数、合约信息
- [x] 地址 Token 余额汇总（Portfolio 视图）
- [x] Token 转账筛选：按 In / Out 方向过滤

### 3.2 ERC-721 / ERC-1155 NFT 支持
- [x] NFT 合约识别（Transfer/TransferSingle/TransferBatch 事件）
- [x] NFT Token 页：Inventory tab with token IDs and owners
- [x] 地址 NFT 持有列表
- [x] NFT 转账历史
- [ ] NFT 图片/metadata 展示（需 tokenURI 调用 + IPFS gateway）

### 3.3 Token Indexer 扩展
- [x] 索引 ERC-721 Transfer 事件
- [x] 索引 ERC-1155 TransferSingle / TransferBatch
- [x] token_balances 表：实时余额快照（替代从 transfers 聚合计算）
- [x] 增量更新（每次 transfer 更新 token_balances）

---

## Phase 4: 合约工具增强 ✅

### 4.1 合约页增强
- [x] Proxy Contract 识别（EIP-1967 / EIP-1822 / Beacon）
- [x] Read as Proxy / Write as Proxy 交互
- [x] 合约创建者 + 创建交易链接
- [x] Similar Contracts 推荐（相同 bytecode hash）

### 4.2 合约验证增强
- [x] 单文件 Solidity 验证
- [x] 多文件 Solidity 验证（Standard JSON Input）
- [x] 验证状态徽章：Exact Match / Partial Match
- [x] 已验证合约排行榜
- [ ] Hardhat / Foundry 验证格式支持（etherscan-verify 兼容 API）

### 4.3 ABI 工具
- [x] ABI 编解码器（独立工具页）
- [x] 事件签名 → Topic 查询（Keccak256）
- [x] 函数选择器数据库（4bytes）
- [x] Calldata 解码 API（POST /contract/decode）
- [x] Event Log 解码 API（POST /contract/decode-log）

---

## Phase 5: 分析与排行榜 ✅

### 5.1 图表中心
- [x] TPS / Gas Usage / Block Time / Tx Volume 图表
- [x] 每日交易量图表（30/90/365 天，daily_stats 聚合表）
- [x] 每日活跃地址图表
- [x] 平均 Gas Price 趋势
- [x] 每日新增合约部署数
- [x] 区块大小 / Gas 使用率趋势
- [x] 验证者出块分布

### 5.2 排行榜
- [x] Top Accounts by Balance
- [x] Top Token Holders（per token）
- [x] Most Active Addresses（by tx count）
- [x] Top Verified Contracts（by interaction count）
- [x] Top Validators（by blocks produced）

### 5.3 AI 推理分析（QFC 特色）
- [x] 推理任务详情页（/task/[taskId]）
- [x] 推理总览页（统计 + 验证者算力 + 支持模型）
- [ ] 推理任务成功率趋势图
- [ ] 矿工算力排行榜
- [ ] 模型使用频率排名
- [ ] 推理费用趋势图

---

## Phase 6: 后端 API 分离 + 可观测性 ✅

### 6.1 Fastify API 服务 (qfc-explorer-api)
- [x] 独立 Fastify 5 + TypeScript API 服务
- [x] 所有 API 路由迁移（blocks, txs, addresses, tokens, contracts, search, analytics, admin）
- [x] 前端通过 API_URL / NEXT_PUBLIC_API_URL 调用
- [x] CORS 配置

### 6.2 Indexer 可观测性
- [x] Prometheus metrics (prom-client)：API (:3001/metrics) + Indexer (:9090/metrics)
- [x] block_process_duration, pipeline_stage_duration, rpc_call_duration 直方图
- [x] blocks_processed, txs_processed, token_transfers, contracts_detected 计数器
- [x] indexer_height, chain_height, lag_blocks 仪表

### 6.3 缓存与数据库
- [x] Redis 缓存（standalone + Cluster 模式自动切换）
- [x] PostgreSQL 读写分离（Primary + Replica via PgBouncer）
- [x] 数据归档系统（archive schema + 透明回退查询）
- [x] 地址标签系统（address_labels 表 + 全文搜索）

### 6.4 实时推送
- [x] Server-Sent Events (SSE)
- [x] WebSocket 订阅（blocks / txs / stats / address 频道）
- [x] 按需轮询（有连接时启动，无连接时停止）

---

## Phase 7: 缺失功能补全（当前阶段）

目标：补齐与 Etherscan 的核心功能差距。

### 7.1 Gas Tracker 页 ✅
- [x] 实时 Gas Price 展示（Low / Average / Median / High）
- [x] Block Gas Usage 可视化（进度条 + 利用率百分比）
- [x] Gas 消耗 Top Contracts 排名
- [ ] 每笔交易预估费用

### 7.2 Pending Transactions（Mempool）🔴 高优
- [ ] 依赖 qfc-core `txpool_content` / `txpool_status` RPC
- [ ] Mempool 实时展示页
- [ ] 按 Gas Price / Nonce / Age 排序
- [ ] 自动刷新 + 确认后移除

### 7.3 交易列表显示 Name Tags ✅
- [x] 区块详情页交易列表展示 address label
- [x] 交易列表页 from/to 旁边显示 label tag
- [x] 交易详情页 from/to 显示 label badge
- [x] 首页最新交易/区块显示 label（LatestBlocksAndTxs）
- [x] batch label 解析 API（POST /search/labels）

### 7.4 Token Transfers 独立页 ✅
- [x] `/token-transfers` — 全链 Token 转账流水
- [x] 筛选：ERC-20 / ERC-721 / ERC-1155（type filter tabs）
- [x] 按时间倒序分页 + Name Tags 显示

### 7.5 已验证合约前端页 ✅
- [x] `/contracts` 页已包含 Verified Contracts 排行榜（排名、编译器、交互次数）
- [x] API `GET /contract/verified` 已集成

### 7.6 NFT Gallery 视图 ✅
- [x] 地址页 NFT tab 改为网格布局（Grid/List 切换）
- [ ] tokenURI metadata 获取 + 图片展示（需 tokenURI 调用 + IPFS gateway）
- [ ] IPFS gateway 集成

### 7.7 Token Approval Checker
- [ ] 地址输入 → 展示所有 ERC-20 Approval 记录
- [ ] 显示 spender、allowance 金额
- [ ] 高亮 unlimited approval 风险

### 7.8 地址页 CSV 导出 ✅
- [x] 交易记录导出 CSV
- [x] Token 转账导出 CSV
- [ ] 日期范围筛选

---

## Phase 8: UX 与国际化

### 8.1 响应式优化
- [x] 移动端优先布局（表格横向滚动 / 卡片化切换）
- [x] 触摸友好的导航和交互
- [ ] PWA 支持（离线缓存首页骨架）

### 8.2 国际化 (i18n)
- [ ] next-intl 集成
- [ ] 语言：English / 中文 / 日本語 / 한국어
- [ ] URL 路由：/en/blocks, /zh/blocks 等
- [ ] 数字格式本地化（千分位、日期）

### 8.3 主题与无障碍
- [ ] Dark / Light 主题切换（当前仅 Dark）
- [ ] WCAG 2.1 AA 合规（对比度、键盘导航、ARIA）
- [x] 页面加载骨架屏优化

### 8.4 SEO
- [ ] 动态 metadata（每个页面的 title / description）
- [ ] sitemap.xml 自动生成
- [ ] Open Graph 标签（分享预览）

---

## Phase 9: 性能与扩展

### 9.1 Indexer 优化
- [ ] 动态 batch size 调整（根据处理速度自适应）
- [ ] WebSocket 订阅 newHeads 替代轮询
- [ ] 数据库分区（按 block_height 范围分区 transactions/events 表）

### 9.2 API 性能
- [ ] API 响应压缩 (gzip/brotli)
- [ ] 游标分页替代 OFFSET（大数据集性能）
- [ ] 数据库慢查询监控 + 自动告警

### 9.3 Etherscan 兼容 API
- [ ] `/api?module=account&action=txlist` 风格兼容接口
- [ ] `/api?module=contract&action=verifysourcecode` 兼容（Hardhat/Foundry 直接验证）
- [ ] API Key 管理 + 速率限制分级

---

## 优先级与里程碑

| 阶段 | 状态 | 用户影响 |
|------|------|---------|
| Phase 1 首页+搜索 | ✅ 完成 | 第一印象，核心交互 |
| Phase 2 地址+交易 | ✅ 完成 | 最高频页面 |
| Phase 3 Token 生态 | ✅ 完成 | 链活跃度指标 |
| Phase 4 合约工具 | ✅ 完成 | 开发者核心需求 |
| Phase 5 分析+排行 | ✅ 完成 | 数据分析增强信任度 |
| Phase 6 API+可观测 | ✅ 完成 | 稳定性保障 |
| **Phase 7 功能补全** | **进行中** | **补齐 Etherscan 差距** |
| Phase 8 UX+国际化 | 待开始 | 扩展用户群体 |
| Phase 9 性能+扩展 | 待开始 | 大数据量稳定运行 |

## 与 Etherscan 功能对照

| 功能 | Etherscan | QFC Explorer | 状态 |
|------|-----------|-------------|------|
| 首页信息密度 | 高 | 高 | ✅ |
| 统一搜索 | 强 | 强（含 FTS + 标签） | ✅ |
| 地址 Tab 化 | 完整 | 完整（含 Internal Txs） | ✅ |
| Input Data 解码 | 自动 | 自动（ABI + 已知选择器） | ✅ |
| Internal Txs | 完整 | 完整（debug_traceTransaction） | ✅ |
| ERC-20 | 完整 | 完整 | ✅ |
| NFT | 完整 | Gallery 网格视图（缺 metadata） | ✅ |
| 合约代理识别 | 自动 | 自动（EIP-1967/1822/Beacon） | ✅ |
| 合约验证 | 完整 | 完整（单文件+多文件） | ✅ |
| 排行榜 | 丰富 | 丰富 | ✅ |
| 图表中心 | 丰富 | 丰富（含每日统计） | ✅ |
| Gas Tracker | 有 | 有 | ✅ |
| Pending Txs | 有 | **无** | Phase 7（blocked on RPC） |
| Name Tags 显示 | 有 | 有 | ✅ |
| Token Transfers 页 | 有 | 有 | ✅ |
| Dark Mode | 有 | 仅 Dark | Phase 8 |
| 多语言 | 无 | 无 | Phase 8 |
| AI 推理 | 无 | **有（独家）** | ✅ 差异化优势 |
| WebSocket 实时 | 无 | **有** | ✅ 差异化优势 |
| 数据导出 | 有 | 有（CSV/JSON） | ✅ |
| Etherscan 兼容 API | — | 无 | Phase 9 |
