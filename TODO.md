# QFC Explorer — TODO

按“从能跑到可用再到完善”的顺序逐条实现。

## MVP 基础
- [x] 初始化目录结构（`src/app`、`src/components`、`src/lib`、`src/db`、`src/indexer`、`src/api`）
- [x] 配置环境变量与示例文件（`.env.example`，包含 DB/RPC）
- [x] 连接数据库（`pg` 连接池、健康检查）
- [x] 搭建 Next.js 基础布局与全局样式（含 Tailwind 初始化）

## 数据库与索引
- [x] 设计表结构：`blocks`、`transactions`、`accounts`、`contracts`、`events`
- [x] 实现迁移脚本（`scripts/migrate.js`）
- [x] 实现基础索引器（轮询 RPC 拉取区块，写入 DB）
- [x] 实现重放/断点续扫机制（保存 last_processed_height）

## 核心页面
- [x] 首页概览（最新区块、交易统计）
- [x] 区块列表页
- [x] 区块详情页
- [x] 交易列表页
- [x] 交易详情页
- [x] 地址详情页（余额/交易记录）

## API 层
- [x] REST API：区块、交易、地址查询
- [x] 分页、排序、过滤
- [x] 错误处理与统一响应格式

## 性能与可用性
- [x] 数据库索引优化
- [x] 服务器端缓存（近期区块/交易）
- [x] 轮询/订阅刷新机制（前端实时更新）

## 增强功能
- [x] 搜索栏（按 hash/高度/地址）
- [x] 状态图表（TPS、区块时间、活跃地址）
- [x] 代币/合约页面（如有）

## 测试与部署
- [ ] 索引器单元测试
- [ ] API 集成测试
- [x] Docker 化与 production build
