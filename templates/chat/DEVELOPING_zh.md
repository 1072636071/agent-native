# {{APP_NAME}} — 开发指南

本指南适用于开发模式下编辑此应用源代码的智能体。有关应用操作和工具，请参阅 AGENTS.md。

## 技术栈

- **框架:** @agent-native/core + React Router v7 (框架模式)
- **前端:** React 18, Vite, TailwindCSS, shadcn/ui
- **路由:** 通过 `flatRoutes()` 的基于文件路由 — SSR shell + 客户端渲染
- **后端:** Nitro (via @agent-native/core) — 基于文件的 API 路由、服务器插件、随处部署预设
- **状态:** SQL 支持（SSE 用于实时更新）

## 命令

- **开发:** `pnpm dev`（Vite 开发服务器，同时包含 React Router + Nitro 插件）
- **构建:** `pnpm build`（React Router 构建 — 客户端 + SSR + Nitro 服务器）
- **启动:** `node .output/server/index.mjs`（生产环境）

## 目录结构

```
app/                   # React 前端
  root.tsx             # HTML shell + 全局提供者
  entry.client.tsx     # 客户端水合入口
  routes.ts            # 路由配置 — flatRoutes()
  routes/              # 基于文件的页面路由（自动发现）
    _index.tsx         # / (聊天页面)
  components/          # UI 组件
  hooks/               # React hooks
  lib/                 # 工具函数 (cn, 等)

server/                # Nitro API 服务器
  routes/
    api/               # 纯路由端点（上传、webhook、OAuth、流式）
    [...page].get.ts   # SSR 全捕获（委托给 React Router）
  plugins/             # 服务器插件（启动逻辑）
  lib/                 # 共享服务器模块

shared/                # 同构代码（客户端和服务器都导入）

actions/               # 共享应用操作 (defineAction; UI 使用 action hooks)
  run.ts               # 脚本调度器
  *.ts                 # 单个 action (pnpm action <name>)

data/                  # 本地开发数据库回退

react-router.config.ts # React Router 框架配置
.agents/skills/        # 智能体技能 — 每条规则的详细指导
```

## 框架基础

**SSR 优先框架，默认 CSR 内容：** 此应用使用 React Router v7 框架模式，`ssr: true`。但几乎每个路由仅渲染 SSR shell（加载旋转器 + meta 标签）。普通应用数据获取在客户端通过 action hooks 进行。服务器端数据获取是例外 — 仅用于需要 SEO/OG 标签的公共页面。

## 聊天优先形态

`/` 路由是应用的主要聊天界面。除非你有意替换整个聊天体验，否则保持使用
`AgentChatSurface`。左侧边栏通过 `useChatThreads` 拥有持久线程列表；
当应用特定屏幕变得有用时，可以将其作为导航项添加在旁边。

对于后来需要 UI 的无头应用，此模板是预期的着陆区：将现有 action 迁移过来，
保持其名称稳定，让聊天在添加额外屏幕之前调用它们。对于自定义智能体后端，
保持应用 shell 并使用 `AgentChatRuntime` 连接器交换聊天运行时，
而非重写撰写器/转录 UI。

## 添加页面

在 `app/routes/` 中创建文件。文件名决定 URL 路径：

```
app/routes/_index.tsx              → /
app/routes/settings.tsx            → /settings
app/routes/inbox.tsx               → /inbox
app/routes/inbox.$threadId.tsx     → /inbox/:threadId
app/routes/$id.tsx                 → /:id (动态参数)
```

每个路由文件导出默认组件、可选的 `meta()` 和可选的 `HydrateFallback()`：

```tsx
import MyPage from "@/pages/MyPage";

export function meta() {
  return [{ title: "My Page" }];
}

export function HydrateFallback() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
    </div>
  );
}

export default function MyPageRoute() {
  return <MyPage />;
}
```

**不要在路由加载器中服务器端获取数据**，除非页面确实需要 SEO/OG 内容。标准模式是：SSR 渲染 shell，客户端水合，React 通过 action 使用 `useActionQuery` / `useActionMutation` 读写普通应用数据。

## 添加应用数据

普通应用数据应从 action 开始，而非自定义路由。在 `actions/<verb>-<resource>.ts` 中使用 `defineAction`，将读取标记为 `http: { method: "GET" }`，并从 React 使用 `useActionQuery` / `useActionMutation`（来自 `@agent-native/core/client`）调用读写操作。这使 UI 和智能体保持同一契约，并让变更 action 自动刷新基于 action 的查询。

## 添加纯路由端点

仅在无法建模为 JSON action 的协议场景下使用 `server/routes/api/`：多部分上传、流式/SSE/WebSocket、Webhook、OAuth 回调/重定向、公共 SEO/OG 端点或二进制/静态资源服务。不要为普通 CRUD、数据查询或 action 的透传包装器添加 `/api/*` 路由；action 端点已存在于 `/_agent-native/actions/:name`。

每个纯路由端点仍导出默认的 `defineEventHandler`，但将共享应用逻辑放在 action 或服务器库中，以避免智能体和 UI 行为分叉。

## 添加服务器插件

启动逻辑（认证、SSE 等）位于 `server/plugins/` 中。使用核心的 `defineNitroPlugin`：

```ts
import { defineNitroPlugin } from "@agent-native/core";

export default defineNitroPlugin(async (nitroApp) => {
  // 在服务器启动时运行一次
});
```

## 来自 `@agent-native/core` 的关键导入

| 导入                                          | 用途                                                                    |
| --------------------------------------------- | ----------------------------------------------------------------------- |
| `defineNitroPlugin`                           | 定义服务器插件（从 Nitro 重新导出）                                    |
| `createDefaultSSEHandler`                     | 创建用于 DB 变更事件的 SSE 端点（服务器）                              |
| `readAppState`, `writeAppState`               | 读取/写入应用状态（来自 `@agent-native/core/application-state`）        |
| `readSetting`, `writeSetting`                 | 读取/写入设置（来自 `@agent-native/core/settings`）                    |
| `defineEventHandler`, `readBody`, `getQuery`  | H3 路由处理器工具（重新导出）                                          |
| `sendToAgentChat`                             | 从 UI 向智能体发送消息（客户端）                                       |
| `agentChat`                                   | 从脚本向智能体发送消息（服务器端）                                     |

## 添加 Action

在 `actions/<verb>-<resource>.ts` 中使用 `defineAction` 创建。使用 `pnpm action <name> --id value` 运行；React 调用者应使用 `useActionQuery` 处理 GET action，使用 `useActionMutation` 处理变更 action，而非创建匹配的 `/api/*` 包装器。

**从 UI 发送到智能体聊天：**

```ts
import { sendToAgentChat } from "@agent-native/core/client";
sendToAgentChat({
  message: "Generate something",
  context: "...",
  submit: true,
});
```

**从脚本发送到智能体聊天：**

```ts
import { agentChat } from "@agent-native/core";
agentChat.submit("Generate something");
```

## 数据库和环境变量

本地开发默认使用 `data/app.db` 处的 SQLite 文件。该本地文件仅用于开发；容器、预览和无服务器部署可能会重置其文件系统。对于生产/云部署，将 `DATABASE_URL` 设置为指向持久化 SQL 数据库。Turso 是可选的，不是必需的；常见选择包括 Neon、Supabase、Turso/libSQL、普通 Postgres、持久化 SQLite、D1 绑定和可用时的 Builder.io 管理环境。

真实凭据值仅属于本地 `.env` 文件、部署配置或注册的密钥/设置 UI。绝不提交、文档化、记录日志、返回、粘贴或在示例中包含真实密钥、令牌、Webhook URL、签名密钥或私有数据；使用空值或明显的占位符。

添加应用数据时，使用 `@agent-native/core/db/schema` 辅助函数定义表，使用 Drizzle 的查询构建器进行读写。不要从 `drizzle-orm/sqlite-core` 或 `drizzle-orm/pg-core` 导入特定方言的 schema 辅助函数，不要在 Drizzle 可以表达查询的普通 action 或处理器中编写原始 SQL。原始 SQL 属于增量迁移、健康检查或仔细限定范围的维护。

| 变量                   | 是否必需                       | 描述                                                                |
| ---------------------- | ------------------------------ | ------------------------------------------------------------------- |
| `DATABASE_URL`         | 生产是，本地开发否             | 持久化 SQL 连接字符串（本地开发默认：`file:./data/app.db`）        |
| `DATABASE_AUTH_TOKEN`  | 仅当提供商需要时               | 如 Turso/libSQL 等提供商的认证令牌                                 |
| `AUTH_DISABLED`        | 可选                           | 设置为 `true` 或 `1` 跳过登录/注册（仅限本地开发/预览）            |

## 扩展（框架功能）

框架提供了**扩展** — 在 iframe 中运行的沙盒化 Alpine.js 小应用。扩展允许用户（或智能体）创建交互式小部件、仪表板和实用工具，而无需修改应用的源代码。它们显示在侧边栏的"扩展"部分下。（与 LLM 工具不同 — LLM 工具是智能体调用的函数调用原语。）

- **创建扩展**：通过侧边栏的"+"按钮、智能体聊天或 `POST /_agent-native/extensions`
- **API 调用**：扩展使用 `extensionFetch()`（旧别名 `toolFetch`），它通过服务器代理请求并注入 `${keys.NAME}` 密钥
- **样式**：扩展自动继承主应用的 Tailwind v4 主题
- **共享**：默认为私有，可与组织或特定用户共享（与其他可拥有资源模型相同）
- **安全**：Iframe 沙盒 + CSP + 代理上的 SSRF 防护

完整实现细节请参阅 `.agents/skills/extensions/SKILL.md` 中的 `extensions` 技能。