# QFC 区块浏览器

[English](./README.md) | **中文**

QFC 区块链浏览器**前端**,基于 Next.js 14(App Router)、React 18、TypeScript 和 Tailwind CSS 构建。

线上地址:https://explorer.testnet.qfc.network

> 所有后端逻辑——REST API、PostgreSQL、链上索引器——都在 [qfc-explorer-api](https://github.com/qfc-network/qfc-explorer-api) 仓库。本仓库只是 UI,通过 HTTP 调用该服务。

## 功能

- 区块、交易、地址、代币(ERC-20 / NFT)、合约页面
- 合约读写交互与源码验证
- AI 推理任务、矿工收益仪表盘、验证人与网络分析
- DEX、跨链桥、Gas 追踪视图
- 多语言(English / 中文 / 日本語 / 한국어)、暗色模式、实时更新

## 环境变量

| 变量 | 说明 | 示例 |
| --- | --- | --- |
| `API_URL` | 服务端(SSR)请求的后端基础 URL,不暴露给浏览器 | `http://explorer-api:3001` |
| `NEXT_PUBLIC_API_URL` | 浏览器请求的后端基础 URL,同时是 SSR 的回退值 | `https://api.explorer.testnet.qfc.network` |

两者都未设置时,应用回退到相对路径 `/api`(适用于由反向代理把 `/api` 转发到后端的部署)。

## 快速开始

```bash
npm install
export NEXT_PUBLIC_API_URL=https://api.explorer.testnet.qfc.network
npm run dev
```

访问 `http://localhost:3000`。

## 常用命令

```bash
npm run dev        # 开发服务器
npm run build      # 生产构建
npm run start      # 运行生产构建
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm test           # vitest
```

## 部署

仓库内含 `Dockerfile`;CI 从 `staging` 分支构建镜像,经 [qfc-testnet](https://github.com/qfc-network/qfc-testnet) 部署。将 `API_URL` / `NEXT_PUBLIC_API_URL` 指向运行中的 qfc-explorer-api 实例即可。

## 相关仓库

| 仓库 | 角色 |
| --- | --- |
| [qfc-explorer-api](https://github.com/qfc-network/qfc-explorer-api) | REST API + PostgreSQL + 链上索引器 |
| [qfc-core](https://github.com/qfc-network/qfc-core) | 区块链节点(JSON-RPC 数据源) |
| [qfc-testnet](https://github.com/qfc-network/qfc-testnet) | 测试网部署基础设施 |
