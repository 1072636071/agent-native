# Agent-Native Plan — 开发指南

本指南面向开发模式下编辑此应用源代码的代理。有关应用操作和工具，请参阅 AGENTS.md。

## 技术栈

- **框架:** @agent-native/core + React Router v7（框架模式）
- **前端:** React 19, Vite, TailwindCSS, shadcn/ui
- **路由:** 通过 `flatRoutes()` 基于文件 — SSR 外壳 + 客户端渲染
- **后端:** Nitro（通过 @agent-native/core）— 基于文件的 API 路由、服务器插件、随处部署预设
- **状态:** SQL 支持（SSE 用于实时更新）

## 命令

- **开发:** `pnpm dev`（带 React Router + Nitro 插件的 Vite 开发服务器 — 默认 http://localhost:8080）
- **构建:** `pnpm build`（React Router 构建 — 客户端 + SSR + Nitro 服务器）
- **启动:** `node .output/server/index.mjs`（生产环境）

## 目录结构

```
app/                   # React frontend
  root.tsx             # HTML shell + global providers
  entry.client.tsx     # Client hydration entry
  routes.ts            # Route config — flatRoutes()
  routes/              # File-based page routes (auto-discovered)
    _index.tsx         # / (home page)
  components/          # UI components
  hooks/               # React hooks
  lib/                 # Utilities (cn, etc)

server/                # Nitro API server
  routes/
    api/               # Route-only endpoints (uploads, webhooks, OAuth, streaming)
    [...page].get.ts   # SSR catch-all (delegates to React Router)
  plugins/             # Server plugins (startup logic)
  lib/                 # Shared server modules

shared/                # Isomorphic code (imported by both client & server)

actions/               # Shared app operations (defineAction; UI uses action hooks)
  run.ts               # Script dispatcher
  *.ts                 # Individual actions (pnpm action <name>)

data/                  # Local development database fallback

react-router.config.ts # React Router framework config
.agents/skills/        # Agent skills — detailed guidance for each rule
```

## 框架基础

**SSR 优先框架，CSR 默认内容：** 此应用使用 `ssr: true` 的 React Router v7 框架模式。但几乎每个路由只渲染一个 SSR 外壳（加载旋转器 + meta 标签）。正常的应用数据获取通过 action hooks 在客户端进行。服务器端数据获取是例外 — 仅用于需要 SEO/OG 标签的公共页面。

## 添加页面

在 `app/routes/` 中创建文件。文件名决定 URL 路径：

```
app/routes/_index.tsx              → /
app/routes/settings.tsx            → /settings
app/routes/inbox.tsx               → /inbox
app/routes/inbox.$threadId.tsx     → /inbox/:threadId
app/routes/$id.tsx                 → /:id (dynamic param)
```

每个路由文件导出一个默认组件、可选的 `meta()` 和可选的 `HydrateFallback()`：

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

**不要在路由 loader 中服务器端获取数据**，除非页面确实需要 SEO/OG 内容。标准模式是：SSR 渲染外壳，客户端注水，React 通过 actions 使用 `useActionQuery` / `useActionMutation` 读写正常的应用数据。

## 添加应用数据

正常的应用数据从 action 开始，而不是自定义路由。在 `actions/<verb>-<resource>.ts` 中添加 `defineAction`，将读取标记为 `http: { method: "GET" }`，并在 React 中通过 `useActionQuery` / `useActionMutation`（来自 `@agent-native/core/client`）调用读取/写入。这使 UI 和代理保持在一个契约上，并让变更 action 自动刷新 action 支持的查询。

## 添加自定义 MDX 块

Plan MDX 不渲染任意导入的 JSX。将自定义 MDX 标签注册为 Plan 块，这样服务器可以解析/序列化它们，浏览器可以渲染/编辑它们，代理可以通过 `get-plan-blocks` 发现它们。

使用此结构：

- Put the React-free data schema and `BlockMdxConfig` in `shared/*.config.ts`.
  Import server-safe helpers from `@agent-native/core/blocks/server`.
- Extend `PlanBlockType`, the `PlanBlock` union, and `planBlockSchema` in
  `shared/plan-content.ts` so saves/imports/patches accept the custom type.
- Register a server spec in `shared/plan-block-registry.ts` with
  `defineBlock`, `Read: () => null`, a stable `type`, stable `mdx.tag`, clear
  `label`, `description`, and `placement`.
- Register the browser spec in `app/components/plan/planBlocks.tsx` with the
  same schema and MDX config, plus `Read` and optional `Edit` React components.
- Do not include `id`, `title`, `summary`, or `editable` in `toAttrs`; the
  registry serializes those base attributes.
- Register overrides after `registerLibraryBlocks` /
  `registerLibraryBlockConfigs`. Last registration wins for `type` and MDX
  `tag`.

完整示例请参阅 Visual Plans 文档（`packages/core/docs/content/template-plan.md`）中的"Custom MDX blocks"部分。

## 添加纯路由端点

仅在协议无法建模为 JSON actions 时使用 `server/routes/api/`：多部分上传、流式/SSE/WebSocket、webhook、OAuth 回调/重定向、公共 SEO/OG 端点或二进制/静态资源服务。不要为普通 CRUD、数据查询或 action 的透传包装器添加 `/api/*` 路由；action 端点已存在于 `/_agent-native/actions/:name`。

每个纯路由端点仍然导出默认的 `defineEventHandler`，但将共享应用逻辑放在 actions 或服务器库中，这样代理和 UI 的行为就不会分叉。

## 添加服务器插件

启动逻辑（认证、SSE 等）位于 `server/plugins/` 中。使用 core 的 `defineNitroPlugin`：

```ts
import { defineNitroPlugin } from "@agent-native/core";

export default defineNitroPlugin(async (nitroApp) => {
  // 在服务器启动时运行一次
});
```

## `@agent-native/core` 的关键导入

| 导入                                         | 用途                                                          |
| -------------------------------------------- | ------------------------------------------------------------- |
| `defineNitroPlugin`                          | 定义服务器插件（从 Nitro 重新导出）                           |
| `createDefaultSSEHandler`                    | 为 DB 变更事件创建 SSE 端点（服务器端）                      |
| `readAppState`, `writeAppState`              | 读取/写入应用状态（来自 `@agent-native/core/application-state`）|
| `readSetting`, `writeSetting`                | 读取/写入设置（来自 `@agent-native/core/settings`）           |
| `defineEventHandler`, `readBody`, `getQuery` | H3 路由处理器工具（重新导出）                                 |
| `sendToAgentChat`                            | 从 UI 向代理发送消息（客户端）                                |
| `agentChat`                                  | 从脚本向代理发送消息（服务器端）                              |

## 添加 Action

创建 `actions/<verb>-<resource>.ts` 并使用 `defineAction`。使用 `pnpm action <name> --id value` 运行；React 调用者应使用 `useActionQuery` 处理 GET actions，使用 `useActionMutation` 处理变更 actions，而不是匹配的 `/api/*` 包装器。

**从 UI 发送到代理聊天：**

```ts
import { sendToAgentChat } from "@agent-native/core/client";
sendToAgentChat({
  message: "Generate something",
  context: "...",
  submit: true,
});
```

**从脚本发送到代理聊天：**

```ts
import { agentChat } from "@agent-native/core";
agentChat.submit("Generate something");
```

## 数据库和环境变量

本地开发默认使用 `data/app.db` 处的 SQLite 文件。该本地文件仅用于开发；容器、预览和无服务器部署可能会重置其文件系统。对于生产/云部署，设置 `DATABASE_URL` 指向持久化的 SQL 数据库。Turso 是可选的，不是必需的；常见选择包括 Neon、Supabase、Turso/libSQL、普通 Postgres、持久化 SQLite、D1 绑定以及 Builder.io 管理的环境（如果可用）。

真实的凭据值只应存在于本地 `.env` 文件、部署配置或已注册的 secrets/settings UI 中。切勿提交、记录、记录日志、返回、粘贴或在示例中包含真实的密钥、令牌、webhook URL、签名密钥或私有数据；使用空值或明显的占位符。

当添加应用数据时，使用 `@agent-native/core/db/schema` 辅助函数定义表，并使用 Drizzle 的查询构建器进行读写。不要从 `drizzle-orm/sqlite-core` 或 `drizzle-orm/pg-core` 导入特定方言的 schema 辅助函数，当 Drizzle 可以表达查询时不要在普通 actions 或处理器中编写原始 SQL。原始 SQL 属于增量迁移、健康检查或仔细限定的维护。

| 变量              | 是否必需                        | 描述                                                                |
| --------------------- | ------------------------------- | ------------------------------------------------------------------- |
| `DATABASE_URL`        | 生产环境必需，本地开发不需要    | 持久化 SQL 连接字符串（本地开发默认：`file:./data/app.db`）        |
| `DATABASE_AUTH_TOKEN` | 仅当提供者需要时                | 用于 Turso/libSQL 等提供者的认证令牌                                |

**数据库覆盖：** `<APP_NAME>_DATABASE_URL`（例如 `PLAN_DATABASE_URL`）优先于 `DATABASE_URL`，在启动时首先检查。`file:` 前缀选择 SQLite 驱动 — 当共享 Postgres 数据库的表由另一个角色拥有且迁移因权限不足而停止时很有用。

## 扩展（框架功能）

框架提供 **Extensions** — 在 iframe 中运行的小型沙箱化 Alpine.js 应用。扩展允许用户（或代理）创建交互式小部件、仪表板和实用工具，而无需修改应用的源代码。它们显示在侧边栏的"Extensions"部分下。（与 LLM 工具不同 — LLM 工具是代理调用的函数调用原语。）

- **创建扩展**：通过侧边栏的"+"按钮、代理聊天或 `POST /_agent-native/extensions`
- **API 调用**：扩展使用 `extensionFetch()`（旧别名 `toolFetch`），它通过服务器代理请求并注入 `${keys.NAME}` 密钥
- **样式**：扩展自动继承主应用的 Tailwind v4 主题
- **分享**：默认私有，可与组织或特定用户分享（与其他可拥有资源相同的模型）
- **安全性**：Iframe 沙箱 + CSP + 代理上的 SSRF 防护

完整实现细节请参阅 `.agents/skills/extensions/SKILL.md` 中的 `extensions` 技能。
