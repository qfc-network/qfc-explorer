# QFC Explorer — TODO

按“从能跑到可用再到完善”的顺序逐条实现。

## MVP 基础
- 初始化目录结构（`src/app`、`src/components`、`src/lib`、`src/db`、`src/indexer`、`src/api`）
- 配置环境变量与示例文件（`.env.example`，包含 DB/RPC）
- 连接数据库（`pg` 连接池、健康检查）
- 搭建 Next.js 基础布局与全局样式（含 Tailwind 初始化）

## 数据库与索引
- 设计表结构：`blocks`、`transactions`、`accounts`、`contracts`、`events`
- 实现迁移脚本（`scripts/migrate.js`）
- 实现基础索引器（轮询 RPC 拉取区块，写入 DB）
- 实现重放/断点续扫机制（保存 last_processed_height）

## 核心页面
- 首页概览（最新区块、交易统计）
- 区块列表页
- 区块详情页
- 交易列表页
- 交易详情页
- 地址详情页（余额/交易记录）

## API 层
- REST API：区块、交易、地址查询
- 分页、排序、过滤
- 错误处理与统一响应格式

## 性能与可用性
- 数据库索引优化
- 服务器端缓存（近期区块/交易）
- 轮询/订阅刷新机制（前端实时更新）

## 增强功能
- 搜索栏（按 hash/高度/地址）
- 状态图表（TPS、区块时间、活跃地址）
- 代币/合约页面（如有）

## 测试与部署
- 索引器单元测试
- API 集成测试
- Docker 化与 production build
