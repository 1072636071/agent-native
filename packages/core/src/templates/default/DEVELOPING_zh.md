# {{APP_NAME}} — 开发指南

本指南适用于编辑此应用源代码的开发模式 agent。有关应用操作和工具，请参阅 AGENTS_zh.md。

## 框架基础

**客户端优先渲染：** 本应用使用 React Router v7 框架模式并设置 `ssr: true`，但所有应用内容**仅在客户端渲染**。服务器仅渲染 HTML 外壳（meta 标签、样式、脚本）加加载动画。这由 `root.tsx` 中的 `ClientOnly` 包装器强制执行——永远不要移除它。浏览器 API（`window`、`localStorage`、`new Date()`）在应用代码的任何地方都可以安全使用，因为组件从不在服务器上运行。

**不要在路由加载器中服务端获取数据**，除非页面确实需要 SEO/OG 内容。标准模式是：SSR 渲染外壳，客户端水合，React 通过 action 用 `useActionQuery` / `useActionMutation` 读写普通应用数据。

## 添加页面

在 `app/routes/` 中创建文件。文件名决定 URL 路径：

```
app/routes/_index.tsx              → /
app/routes/settings.tsx            → /settings
app/routes/inbox.tsx               → /inbox
app/routes/inbox.$threadId.tsx     → /inbox/:threadId
app/routes/$id.tsx                 → /:id（动态参数）
```

## 挂载的工作区路由

在工作区中，此应用可以挂载在 `/<app-id>` 下。React Router 已通过 `appBasePath()` 接收 `APP_BASE_PATH`/`VITE_APP_BASE_PATH`，因此路由代码保持应用本地：

| 路由文件              | 应用内部路由 | 挂载的浏览器 URL |
| ----------------------- | ------------------ | ------------------- |
| `app/routes/_index.tsx` | `/`                | `/<app-id>`         |
| `app/routes/review.tsx` | `/review`          | `/<app-id>/review`  |
| `app/routes/$id.tsx`    | `/:id`             | `/<app-id>/:id`     |

在此应用内使用 `<Link to="/review">` 和 `navigate("/review")`。不要在 React Router 路径前加 `/<app-id>`，否则 URL 可能双重前缀，如 `/<app-id>/<app-id>/review`。使用 `appPath()` 处理原始 `href`/静态资产，`agentNativePath()` 处理 `/_agent-native/*`，`appApiPath()` 仅用于合法的仅路由 `/api/*` 端点。

每个路由文件导出一个默认组件和可选的 `meta()`：

```tsx
import MyPage from "@/pages/MyPage";

export function meta() {
  return [{ title: "My Page" }];
}

export default function MyPageRoute() {
  return <MyPage />;
}
```

## 添加应用数据

普通应用数据从 action 开始，而非自定义路由。用 `defineAction` 添加 `actions/<verb>-<resource>.ts`，用 `http: { method: "GET" }` 标记读取，从 React 用 `@agent-native/core/client` 的 `useActionQuery` / `useActionMutation` 调用读写。这使 UI 和 agent 在一个契约上，并让变更 action 自动刷新 action 支持的查询。

## 添加仅路由端点

仅对无法建模为 JSON action 的协议使用 `server/routes/api/`：多部分上传、流式/SSE/WebSocket、Webhook、OAuth 回调/重定向、公开 SEO/OG 端点或二进制/静态资产服务。不要为普通 CRUD、数据查询或围绕 action 的透传包装器添加 `/api/*` 路由；action 端点已存在于 `/_agent-native/actions/:name`。

每个仅路由端点仍导出一个默认的 `defineEventHandler`，但将共享应用逻辑保留在 action 或服务器库中，这样 agent 和 UI 行为不会分叉。

## 服务器插件

启动逻辑（认证、SSE 等）位于 `server/plugins/`。使用 core 的 `defineNitroPlugin`：

```ts
import { defineNitroPlugin } from "@agent-native/core";

export default defineNitroPlugin(async (nitroApp) => {
  // 在服务器启动时运行一次
});
```

## 关键导入

| 导入                                       | 用途                                                                    |
| -------------------------------------------- | -------------------------------------------------------------------------- |
| `defineNitroPlugin`                          | 定义服务器插件（从 Nitro 重新导出）                            |
| `createDefaultSSEHandler`                    | 为 DB 变更事件创建 SSE 端点（服务器）                          |
| `readAppState`、`writeAppState`              | 读写 application state（来自 `@agent-native/core/application-state`） |
| `readSetting`、`writeSetting`                | 读写设置（来自 `@agent-native/core/settings`）                   |
| `readResource`、`writeResource`              | 读写资源（来自 `@agent-native/core/resources`）                 |
| `defineEventHandler`、`readBody`、`getQuery` | H3 路由处理器工具（重新导出）                                   |
| `sendToAgentChat`                            | 从 UI 向 agent 聊天发送或预填充消息（客户端）           |
| Agent 聊天上下文状态辅助函数             | 用于与暂存上下文芯片双向同步的可选高级辅助函数       |
| `agentChat`                                  | 从脚本向 agent 发送消息（服务器端）                          |

## 添加 Action

用 `defineAction` 创建 `actions/<verb>-<resource>.ts`。用 `pnpm action <name> --id value` 运行；React 调用者应使用 `useActionQuery` 处理 GET action，`useActionMutation` 处理变更 action，而非匹配的 `/api/*` 包装器。

## 发送到 Agent 聊天

**从 UI：**

```ts
import { sendToAgentChat } from "@agent-native/core/client";
sendToAgentChat({
  message: "Generate something",
  context: "...",
  submit: true,
});
```

对于大多数 UI 交接，直接用 `sendToAgentChat()` 传递隐藏上下文。当用户应先审查草稿时使用 `submit: false`。当按钮应启动完整 agent 运行而不打开或聚焦侧边栏时，使用 `newTab: true, background: true, openSidebar: false`。仅当高级 UI 需要读取、镜像、暂存、移除或清除暂存上下文芯片作为本地界面状态时，才使用 `useAgentChatContext`、`setAgentChatContextItem`、`listAgentChatContext`、`removeAgentChatContextItem` 和 `clearAgentChatContext`。

**从脚本：**

```ts
import { agentChat } from "@agent-native/core";
agentChat.submit("Generate something");
```

**服务端一次性文本转换：**

```ts
import { completeText } from "@agent-native/core/server";

const result = await completeText({
  systemPrompt: "Return exactly one category label.",
  input: body,
  maxOutputTokens: 16,
  temperature: 0,
});
```

仅对故意不需要工具、聊天历史或运行状态的狭窄转换使用此功能。对于面向用户的操作，在 action 内调用它，这样 UI 和 agent 共享相同的能力。

## 数据库

本地开发默认使用 `data/app.db` 处的 SQLite 文件。该本地文件仅用于开发；容器、预览和无服务器部署可能会重置其文件系统。对于生产/云部署，设置 `DATABASE_URL` 指向持久 SQL 数据库。Turso 是可选的，非必需；常见选择包括 Neon、Supabase、Turso/libSQL、纯 Postgres、持久 SQLite、D1 绑定和 Builder.io 管理的环境（如果可用）。

真实凭证值仅属于本地 `.env` 文件、部署配置或注册的密钥/设置 UI。永远不要提交、记录、返回、粘贴或在示例中包含真实的密钥、令牌、Webhook URL、签名密钥或私有数据；使用空值或明显的占位符。

添加应用数据时，使用 `@agent-native/core/db/schema` 辅助函数定义表，并使用 Drizzle 的查询构建器进行读写。不要从 `drizzle-orm/sqlite-core` 或 `drizzle-orm/pg-core` 导入方言特定的 schema 辅助函数，当 Drizzle 可以表达查询时不要在普通 action 或处理器中编写原始 SQL。原始 SQL 属于增量迁移、健康检查或精心范围的维护。

| 变量              | 是否必需                        | 描述                                                                |
| --------------------- | ------------------------------- | -------------------------------------------------------------------------- |
| `DATABASE_URL`        | 生产环境是，本地开发否    | 持久 SQL 连接字符串（本地开发默认：`file:./data/app.db`） |
| `DATABASE_AUTH_TOKEN` | 仅当提供商需要时 | Turso/libSQL 等提供商的认证令牌                              |

## 技术栈

- **框架：** @agent-native/core + React Router v7（框架模式）
- **前端：** React 18、Vite、TailwindCSS、shadcn/ui
- **路由：** 基于 `flatRoutes()` 的文件路由—— SSR 外壳 + 客户端渲染
- **后端：** Nitro（通过 @agent-native/core）——基于文件的 API 路由、服务器插件、随处部署预设
- **状态：** SQL 支持（SSE 用于实时更新）
- **构建：** `pnpm build`（React Router 构建——客户端 + SSR + Nitro 服务器）
- **开发：** `pnpm dev`（Vite 开发服务器，包含 React Router + Nitro 插件）
- **启动：** `node .output/server/index.mjs`（生产环境）