# Videos — 开发指南

本指南面向开发模式下编辑应用源代码的 agent。关于应用操作和工具，请参阅 AGENTS.md。

## 技术栈

- **PNPM**：优先使用 pnpm
- **前端**：React 18 + React Router 6 (spa) + TypeScript + Vite + TailwindCSS 3
- **后端**：Nitro（通过 @agent-native/core）— 基于文件的 API 路由
- **测试**：Vitest
- **UI**：Radix UI + TailwindCSS 3 + Lucide React 图标
- **视频**：Remotion 用于程序化视频合成

## 项目结构

```
app/                      # React SPA 前端
├── pages/                # 路由组件 (Index.tsx = 首页)
├── components/ui/        # 预构建 UI 组件库
├── remotion/             # Remotion 合成、注册表、辅助函数
│   ├── registry.ts       # 所有合成的唯一事实来源
│   ├── trackAnimation.ts # 纯辅助函数：trackProgress(), getPropValue(), findTrack()
│   ├── compositions/     # 单个 Remotion 合成组件
│   └── hooks/            # 交互式合成辅助函数
├── root.tsx              # HTML 壳 + 全局提供者设置
└── global.css            # TailwindCSS 3 主题和全局样式

server/                   # Nitro API 服务器
├── routes/               # 基于文件的纯路由端点（Nitro 自动发现）
├── plugins/              # 服务器插件（启动逻辑）
└── lib/                  # 共享服务器模块

shared/                   # 客户端和服务器共用的类型
└── api.ts                # 共享 API 接口
```

## 框架基础（Nitro + @agent-native/core）

本应用使用 **Nitro**（通过 `@agent-native/core`）作为服务器。所有服务器代码位于 `server/` 中。

### 服务器目录

```
server/
  routes/     # 基于文件的纯路由端点（Nitro 自动发现）
  handlers/   # 路由处理器逻辑模块
  plugins/    # 服务器插件 — 启动时运行（认证、SSE 等）
  lib/        # 共享服务器模块（watcher 实例、辅助函数）
```

### 添加应用数据

普通应用数据从 action 开始，而非自定义路由。在 `actions/<verb>-<resource>.ts` 中添加 `defineAction`，将读取操作标记为 `http: { method: "GET" }`，并在 React 中使用 `useActionQuery` / `useActionMutation`（来自 `@agent-native/core/client`）调用读写操作。这使 UI 和 agent 保持同一契约，并让变更操作自动刷新 action 支持的查询。

### 添加纯路由端点

仅在无法建模为 JSON action 的协议时使用 `server/routes/api/`：多部分上传、流式/SSE/WebSocket、Webhook、OAuth 回调/重定向、公共 SEO/OG 端点或二进制/静态资源服务。不要为普通 CRUD、数据查询或 action 的透传包装添加 `/api/*` 路由；action 端点已存在于 `/_agent-native/actions/:name`。

每个纯路由端点仍导出默认的 `defineEventHandler`，但将共享应用逻辑放在 actions 或服务器库中，这样 agent 和 UI 行为不会分叉。

### 服务器插件

启动逻辑（认证、SSE 等）位于 `server/plugins/` 中。使用 core 的 `defineNitroPlugin`：

```ts
import { defineNitroPlugin } from "@agent-native/core";

export default defineNitroPlugin(async (nitroApp) => {
  // 服务器启动时运行一次
});
```

### `@agent-native/core` 关键导入

| 导入                                         | 用途                                                       |
| -------------------------------------------- | ---------------------------------------------------------- |
| `defineNitroPlugin`                          | 定义服务器插件（从 Nitro 重新导出）                         |
| `createDefaultSSEHandler`                    | 为 DB 变更事件创建 SSE 端点（服务器端）                     |
| `readAppState`, `writeAppState`              | 读/写应用状态（来自 `@agent-native/core/application-state`）|
| `readSetting`, `writeSetting`                | 读/写设置（来自 `@agent-native/core/settings`）            |
| `defineEventHandler`, `readBody`, `getQuery` | H3 路由处理器工具（重新导出）                               |
| `sendToAgentChat`                            | 从 UI 向 agent 发送消息（客户端）                           |
| `agentChat`                                  | 从脚本向 agent 发送消息（服务器端）                         |

## 路由系统

路由系统使用 React Router v7 框架模式的基于文件的路由：

- 路由通过 `flatRoutes()` 从 `app/routes/` 自动发现。
- `app/routes/_index.tsx` 是首页（`/`）。
- 创建文件即可添加路由（如 `app/routes/settings.tsx` → `/settings`）。
- 动态参数使用 `$` 前缀（如 `app/routes/c.$compositionId.tsx` → `/c/:compositionId`）。

### 样式系统

- **主要**：TailwindCSS 3 工具类
- **主题和设计令牌**：在 `app/global.css` 中配置
- **UI 组件**：`app/components/ui/` 中的预构建库
- **工具**：`cn()` 结合 `clsx` + `tailwind-merge` 处理条件类

### 路径别名

- `@shared/*` — 共享文件夹
- `@/*` — 客户端文件夹

### 数据库（云部署）

本地开发默认使用 `data/app.db` 处的 SQLite 文件。该本地文件仅用于开发；容器、预览和无服务器部署可能会重置其文件系统。对于生产/云部署，设置 `DATABASE_URL` 指向持久化 SQL 数据库。Turso 是可选的，非必需；常见选择包括 Neon、Supabase、Turso/libSQL、普通 Postgres、持久 SQLite、D1 绑定，以及可用的 Builder.io 托管环境。

真实凭据值仅存放在本地 `.env` 文件、部署配置或注册的 secrets/settings UI 中。绝不提交、记录、日志、返回、粘贴或在示例中包含真实密钥、令牌、Webhook URL、签名密钥或私有数据；使用空值或明显的占位符。

**环境变量：**

| 变量                    | 必需                           | 描述                                                                |
| ----------------------- | ------------------------------ | ------------------------------------------------------------------- |
| `DATABASE_URL`          | 生产环境是，本地开发否          | 持久化 SQL 连接字符串（本地开发默认：`file:./data/app.db`）        |
| `DATABASE_AUTH_TOKEN`   | 仅当提供者需要时                | Turso/libSQL 等提供者的认证令牌                                     |

## 构建和开发命令

```bash
pnpm dev        # 启动开发服务器（客户端 + 服务器）
pnpm build      # 生产构建
pnpm start      # 启动生产服务器
pnpm typecheck  # TypeScript 验证
pnpm test       # 运行 Vitest 测试
```

## 全面使用 TypeScript

本项目所有代码必须使用 TypeScript（`.ts`）。绝不创建 `.js`、`.cjs` 或 `.mjs` 文件。Node 22+ 原生运行 `.ts` 文件，因此脚本无需编译步骤。使用 ESM 导入（`import`），而非 CommonJS（`require`）。

## 扩展（框架功能）

框架提供 **Extensions** — 在 iframe 中运行的小型沙盒化 Alpine.js 应用。扩展让用户（或 agent）无需修改应用源代码即可创建交互式小部件、仪表板和工具。它们显示在侧边栏的 "Extensions" 部分下。（与 LLM 工具不同 — LLM 工具是 agent 调用的函数调用原语。）

- **创建扩展**：通过侧边栏 "+" 按钮、agent 聊天或 `POST /_agent-native/extensions`
- **API 调用**：扩展使用 `extensionFetch()`（旧别名 `toolFetch`），通过服务器代理请求并注入 `${keys.NAME}` 密钥
- **样式**：扩展自动继承主应用的 Tailwind v4 主题
- **共享**：默认私有，可与组织或特定用户共享（与其他可拥有资源模型相同）
- **安全**：iframe 沙盒 + CSP + 代理上的 SSRF 防护

完整实现细节请参阅 `.agents/skills/extensions/SKILL.md` 中的 `extensions` 技能。