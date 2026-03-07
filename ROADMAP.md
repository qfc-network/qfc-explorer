# QFC Explorer Roadmap

对标 Etherscan，分阶段提升 QFC Explorer 至生产级区块链浏览器。

## 当前状态

已有功能：首页实时统计、区块/交易/地址浏览、合约验证与交互、ERC-20 Token 追踪、
AI 推理任务查询、网络/验证者仪表板、分析图表、数据导出、管理后台。

---

## Phase 1: 首页改版 + 搜索增强

目标：第一印象对标 Etherscan，信息密度和交互体验大幅提升。

### 1.1 首页重设计
- [x] 顶部网络概览卡片栏：Block Height / Block Time / TPS / Addresses / Chain ID / Finality
- [x] 最新区块 + 最新交易双列实时滚动（参考 Etherscan 首页布局）
- [x] 迷你折线图：Block Time / Txs per Block / Active Addresses
- [x] 搜索框居中突出，支持 placeholder 提示 "Search by Address / Tx Hash / Block / Token"
- [ ] QFC Price / Market Cap（需要价格 API 接入）

### 1.2 全局搜索增强
- [x] 统一搜索框：地址 / TX Hash / Block Height / Block Hash
- [x] 搜索下拉实时建议（debounce 200ms）
- [x] 搜索历史记录（localStorage）
- [ ] 无结果时显示友好提示 + 相似建议
- [ ] Token Name / Contract Name 搜索

### 1.3 Header/Footer 优化
- [x] 固定导航栏：Home / Blockchain / Tokens / Contracts / AI Inference / Network
- [x] 下拉子菜单：Blockchain → Blocks, Transactions; Tokens → Token List, Tokenomics
- [x] Footer：链接到 qfc.network、Docs、GitHub、Faucet
- [x] 移动端响应式汉堡菜单

---

## Phase 2: 地址页 + 交易页深度增强

目标：地址页信息完整度对标 Etherscan Address 页面。

### 2.1 地址页 Tab 化
- [x] Overview：余额、Nonce、交易数、最后活跃
- [x] Transactions Tab：分页交易列表（IN/OUT 方向标签）
- [x] Token Transfers Tab：ERC-20 转账记录（含 Token 符号/精度）
- [x] Contract Tab（合约地址）：验证状态、创建交易、Code Hash
- [ ] Internal Transactions Tab：合约内部调用追踪

### 2.2 交易页增强
- [x] Input Data 解码：已知 ERC-20/721 函数选择器自动解码参数
- [x] Event Logs 解码（Transfer/Approval 等已知事件）
- [x] Gas 使用可视化（used / limit 进度条，三色标识）
- [x] Etherscan 风格 Row 布局 + 时间戳显示
- [ ] Internal Transactions 显示
- [ ] 交易状态时间线：Pending → Confirmed → Finalized

### 2.3 Pending Transactions 页
- [ ] 需要 qfc-core 新增 `txpool_content` RPC 端点
- [ ] 实时 mempool 展示（通过 RPC 轮询）
- [ ] 按 Gas Price 排序
- [ ] 自动刷新 + 确认后移除

---

## Phase 3: Token 生态完善

目标：Token 页功能完整，支持 NFT。

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
- [ ] NFT Token 页：图片/metadata 展示（需 tokenURI 调用）

### 3.3 Token Indexer 扩展
- [x] 索引 ERC-721 Transfer 事件
- [x] 索引 ERC-1155 TransferSingle / TransferBatch
- [x] token_balances 表：实时余额快照（替代从 transfers 聚合计算）
- [x] 增量更新（每次 transfer 更新 token_balances）

---

## Phase 4: 合约工具增强

目标：合约开发者体验对标 Etherscan Contract 页。

### 4.1 合约页增强
- [ ] Proxy Contract 识别（EIP-1967 / EIP-1822）
- [ ] Read as Proxy / Write as Proxy 交互
- [x] 合约创建者 + 创建交易链接
- [x] Similar Contracts 推荐（相同 bytecode hash）

### 4.2 合约验证增强
- [ ] 多文件 Solidity 验证（Standard JSON Input）
- [ ] Hardhat / Foundry 验证格式支持
- [ ] 验证状态徽章：Exact Match / Partial Match
- [ ] 已验证合约排行榜

### 4.3 ABI 工具
- [ ] ABI 编解码器（独立工具页）
- [ ] 事件签名 → Topic 查询
- [ ] 函数选择器数据库（4bytes）

---

## Phase 5: 分析与排行榜

目标：数据分析能力对标 Etherscan Charts + 排行榜。

### 5.1 图表中心
- [x] TPS / Gas Usage / Block Time / Tx Volume 图表（已有 Analytics 页）
- [x] 每日交易量图表（30/90/365 天，需日聚合表）
- [x] 每日活跃地址图表
- [x] 平均 Gas Price 趋势
- [x] 每日新增合约部署数
- [x] 区块大小 / Gas 使用率趋势（Analytics 页已有）
- [x] 验证者出块分布（Analytics 页 + Leaderboard Validators tab）

### 5.2 排行榜
- [x] Top Accounts by Balance
- [x] Top Token Holders（per token，已在 Token Detail 页）
- [x] Most Active Addresses（by tx count）
- [x] Top Verified Contracts（by interaction count）
- [x] Top Validators（by blocks produced）

### 5.3 AI 推理分析（QFC 特色）
- [ ] 推理任务成功率趋势
- [ ] 矿工算力排行榜
- [ ] 模型使用频率排名
- [ ] 推理费用趋势图

---

## Phase 6: UX 与国际化

目标：移动端友好，多语言支持。

### 6.1 响应式重构
- [ ] 移动端优先布局（表格横向滚动 / 卡片化切换）
- [ ] 触摸友好的导航和交互
- [ ] PWA 支持（离线缓存首页骨架）

### 6.2 国际化 (i18n)
- [ ] next-intl 集成
- [ ] 语言：English / 中文 / 日本語 / 한국어
- [ ] URL 路由：/en/blocks, /zh/blocks 等
- [ ] 数字格式本地化（千分位、日期）

### 6.3 主题与无障碍
- [ ] Dark / Light 主题切换
- [ ] WCAG 2.1 AA 合规（对比度、键盘导航、ARIA）
- [x] 页面加载骨架屏优化

---

## Phase 7: 性能与基础设施

目标：大数据量下稳定运行。

### 7.1 Indexer 优化
- [ ] 并行 receipt 获取（当前已有 batch=8，优化到动态调整）
- [ ] 增量索引模式（WebSocket 订阅 newHeads 替代轮询）
- [ ] 数据库分区（按 block_height 范围分区 transactions/events 表）
- [ ] 归档表：老数据自动迁移到冷存储

### 7.2 API 性能
- [ ] Redis 缓存热点查询（首页统计、最新区块）
- [ ] API 响应压缩 (gzip/brotli)
- [ ] 游标分页替代 OFFSET（大数据集性能）
- [ ] 数据库连接池调优 + 慢查询监控

### 7.3 可观测性
- [ ] Prometheus 指标导出（indexer lag, API latency, error rate）
- [ ] 结构化日志 (JSON)
- [ ] Healthcheck 增强：DB connectivity + RPC reachability + indexer lag

---

## 优先级与里程碑

| 阶段 | 预计工作量 | 优先级 | 用户影响 |
|------|-----------|--------|---------|
| Phase 1 | 中 | P0 | 首页是第一印象，搜索是核心交互 |
| Phase 2 | 大 | P0 | 地址页和交易页是最高频页面 |
| Phase 3 | 中 | P1 | Token 生态是链活跃度指标 |
| Phase 4 | 中 | P1 | 合约开发者核心需求 |
| Phase 5 | 中 | P2 | 数据分析增强信任度 |
| Phase 6 | 中 | P2 | 国际化扩展用户群体 |
| Phase 7 | 大 | P1 | 稳定性保障，随数据增长必须做 |

## 与 Etherscan 功能对照

| 功能 | Etherscan | QFC Explorer | 差距 |
|------|-----------|-------------|------|
| 首页信息密度 | 高 | 中 | Phase 1 |
| 统一搜索 | 强 | 基础 | Phase 1 |
| 地址 Tab 化 | 完整 | 单页 | Phase 2 |
| Input Data 解码 | 自动 | 无 | Phase 2 |
| Internal Txs | 完整 | 无 | Phase 2 |
| ERC-20 | 完整 | 基础 | Phase 3 |
| NFT | 完整 | 无 | Phase 3 |
| 合约代理识别 | 自动 | 无 | Phase 4 |
| 排行榜 | 丰富 | 无 | Phase 5 |
| 图表中心 | 丰富 | 基础 | Phase 5 |
| Dark Mode | 有 | 无 | Phase 6 |
| 多语言 | 无 | 无 | Phase 6 (我们领先) |
| AI 推理 | 无 | 有 | 差异化优势 |
| 合约验证 | 完整 | 基础 | Phase 4 |
| Gas Tracker | 有 | 无 | Phase 1 |
