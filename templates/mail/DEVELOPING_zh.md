# Mail — 开发指南

本指南适用于开发模式下编辑此应用源代码的智能体。有关邮件操作和工具，请参阅 AGENTS.md。

## 技术栈

- **框架**: `@agent-native/core`
- **包管理器**: `pnpm`
- **前端**: React 18, React Router 6, TypeScript, Vite, TailwindCSS
- **后端**: Nitro (via @agent-native/core)
- **UI**: Radix UI + shadcn/ui
- **图标**: `@tabler/icons-react` — 所有图标均使用 Tabler 图标。不要使用 Lucide 或内联 SVG。
- **主题**: next-themes (深色/浅色/系统)
- **状态**: 通过 `@agent-native/core/settings` 和 `@agent-native/core/application-state` 实现的 SQL 支持状态
- **数据库**: Drizzle ORM，基于可移植 SQL (`DATABASE_URL`；本地开发默认为 SQLite)

## 项目结构

```
app/
  components/
    layout/       # AppLayout, Sidebar, CommandPalette
    email/        # EmailList, EmailListItem, EmailThread, ComposeModal
    ui/           # shadcn/ui 组件
  hooks/          # use-emails.ts (React Query), use-keyboard-shortcuts.ts
  pages/          # InboxPage, NotFound
  lib/            # utils.ts
server/
  routes/         # 基于文件的纯路由端点（由 Nitro 自动发现）
  handlers/       # 路由处理器模块
  plugins/        # 服务器插件（启动逻辑）
  lib/            # 共享服务器模块
shared/
  types.ts        # 共享 TypeScript 类型
actions/               # 共享应用操作 (defineAction; UI 使用 action hooks)
  run.ts          # 脚本调度器
data/
  app.db          # 本地开发数据库回退
```

## 框架基础 (Nitro + @agent-native/core)

此应用使用 **Nitro**（通过 `@agent-native/core`）作为服务器。所有服务器代码位于 `server/` 中。

### 服务器目录

```
server/
  routes/     # 基于文件的纯路由端点（由 Nitro 自动发现）
  handlers/   # 路由处理器逻辑模块
  plugins/    # 服务器插件 — 在启动时运行（数据库迁移、认证）
  lib/        # 共享服务器模块
```

### 添加应用数据

普通应用数据应从 action 开始，而非自定义路由。在 `actions/<verb>-<resource>.ts` 中使用 `defineAction`，将读取操作标记为 `http: { method: "GET" }`，并在 React 中通过 `useActionQuery` / `useActionMutation`（来自 `@agent-native/core/client`）调用读写操作。这使 UI 和智能体保持同一契约，并让变更操作自动刷新基于 action 的查询。

### 添加纯路由端点

仅在无法建模为 JSON action 的协议场景下使用 `server/routes/api/`：多部分上传、流式/SSE/WebSocket、Webhook、OAuth 回调/重定向、公共 SEO/OG 端点或二进制/静态资源服务。不要为普通 CRUD、数据查询或 action 的透传包装器添加 `/api/*` 路由；action 端点已存在于 `/_agent-native/actions/:name`。

每个纯路由端点仍导出默认的 `defineEventHandler`，但将共享应用逻辑放在 action 或服务器库中，以避免智能体和 UI 行为分叉。

### 服务器插件

启动逻辑（数据库迁移、认证）位于 `server/plugins/` 中。使用核心的 `defineNitroPlugin`：

```ts
import { defineNitroPlugin } from "@agent-native/core";

export default defineNitroPlugin(async (nitroApp) => {
  // 在服务器启动时运行一次
});
```

## 关键导入

### 来自 `@agent-native/core`

| 导入                                          | 用途                                           |
| --------------------------------------------- | ---------------------------------------------- |
| `defineNitroPlugin`                           | 定义服务器插件（从 Nitro 重新导出）            |
| `createSSEHandler`                            | 创建用于实时更新的 SSE 端点                    |
| `defineEventHandler`, `readBody`, `getQuery`  | H3 路由处理器工具（重新导出）                  |
| `sendToAgentChat`                             | 从 UI 向智能体发送消息（客户端）               |
| `agentChat`                                   | 从脚本向智能体发送消息（服务器端）             |

### 来自 `@agent-native/core/settings`

| 导入                                     | 用途                                     |
| ---------------------------------------- | ---------------------------------------- |
| `getSetting(key)` / `setSetting(key, v)` | 从 SQL 设置存储中读取/写入设置           |

### 来自 `@agent-native/core/application-state`

| 导入                                          | 用途                               |
| --------------------------------------------- | ---------------------------------- |
| `readAppState(key)` / `writeAppState(key, v)` | 在 SQL 中读取/写入临时应用状态     |

## 构建和开发命令

```bash
pnpm dev          # Vite 开发服务器 + Nitro 插件（单进程）
pnpm build        # 单次 Vite 构建（客户端 SPA + Nitro 服务器）
pnpm start        # node .output/server/index.mjs (生产环境)
pnpm typecheck    # TypeScript 验证
pnpm action <name> [--args]  # 运行一个 action
```

## 添加 Action

在 `actions/<verb>-<resource>.ts` 中使用 `defineAction` 创建。使用 `pnpm action <name> --id value` 运行；React 调用者应使用 `useActionQuery` 处理 GET action，使用 `useActionMutation` 处理变更 action，而不是创建匹配的 `/api/*` 包装器。

## 扩展（框架功能）

框架提供了**扩展** — 在 iframe 中运行的沙盒化 Alpine.js 小应用。扩展允许用户（或智能体）创建交互式小部件、仪表板和实用工具，而无需修改应用的源代码。它们显示在侧边栏的"扩展"部分下。（与 LLM 工具不同 — LLM 工具是智能体调用的函数调用原语。）

- **创建扩展**：通过侧边栏的"+"按钮、智能体聊天或 `POST /_agent-native/extensions`
- **API 调用**：扩展使用 `extensionFetch()`（旧别名 `toolFetch`），它通过服务器代理请求并注入 `${keys.NAME}` 密钥
- **样式**：扩展自动继承主应用的 Tailwind v4 主题
- **共享**：默认为私有，可与组织或特定用户共享（与其他可拥有资源模型相同）
- **安全**：Iframe 沙盒 + CSP + 代理上的 SSRF 防护

完整实现细节请参阅 `.agents/skills/extensions/SKILL.md` 中的 `extensions` 技能。