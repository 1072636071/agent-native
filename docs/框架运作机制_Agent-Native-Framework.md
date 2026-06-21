# Agent-Native 框架运作机制

## 概述

Agent-Native 是一个让 AI Agent 与 UI 成为平等伙伴的应用框架。核心原则：**UI 能做的一切，Agent 也能通过相同的 SQL 数据和 Action 表面完成**。每个功能必须覆盖四个领域：UI、Actions、Skills/指令、Application State。

---

## 核心架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Frontend                           │
│  useDbSync ←→ useActionQuery/useActionMutation ←→ callAction   │
│  readClientAppState / writeClientAppState                       │
│  sendToAgentChat / AgentPanel / AssistantChat                   │
└──────────┬──────────────────────────┬──────────────────────────┘
           │ HTTP/SSE                  │ postMessage
           ▼                          ▼
┌──────────────────────────────────────────────────────────────────┐
│                     Nitro Server (H3)                            │
│                                                                  │
│  /_agent-native/actions/:name  ←→  action-routes.ts             │
│  /_agent-native/poll           ←→  poll.ts                      │
│  /_agent-native/events         ←→  sse.ts                       │
│  /_agent-native/agent-chat     ←→  agent-chat-plugin.ts         │
│  /_agent-native/application-state/:key ←→ handlers.ts           │
│  /_agent-native/extensions/*   ←→  extensions/routes.ts         │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Agent Loop (production-agent.ts)                         │  │
│  │  engine.stream() → tool calls → actionEntry.run()         │  │
│  │  → notifyActionChange() → poll events → UI refresh        │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Action Surface (defineAction)                             │  │
│  │  Single source of truth for UI + Agent + HTTP + CLI + MCP  │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────┬───────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────┐
│                    SQL Database (Drizzle)                         │
│  application_state | settings | tools (extensions) | tool_data   │
│  agent_runs | agent_run_events | chat_threads | app_secrets      │
│  *_shares | tool_history | tool_hidden_extensions                │
└──────────────────────────────────────────────────────────────────┘
```

---

## 1. Action 表面 — 框架的核心抽象

Action 是整个框架的单一操作真相来源。所有应用操作通过 `defineAction` 定义，Agent、UI、HTTP、CLI、MCP 五种调用方共享同一入口。

### 1.1 定义 Action

```typescript
import { defineAction } from "@agent-native/core";
import { z } from "zod";

export default defineAction({
  description: "Send an email",
  schema: z.object({
    to: z.string().describe("Recipient email"),
    subject: z.string().describe("Email subject"),
    body: z.string().describe("Email body"),
  }),
  needsApproval: true,
  run: async (args, ctx) => {
    // args 已通过 schema 验证
    // ctx.userEmail — 当前用户
    // ctx.caller — 调用来源："tool" | "http" | "frontend" | "cli" | "mcp"
    // ctx.send — SSE 事件发送
    // ctx.signal — AbortSignal
  },
});
```

### 1.2 五种调用路径

| 调用方 | 入口 | caller 标识 |
|--------|------|-------------|
| Agent | `runToolCall()` → `actionEntry.run()` | `"tool"` |
| 前端 | `useActionQuery`/`useActionMutation` → HTTP | `"frontend"` |
| HTTP | `POST/GET /_agent-native/actions/<name>` | `"http"` |
| CLI | `pnpm action <name>` | `"cli"` |
| MCP | `tools/call` | `"mcp"` |

### 1.3 关键配置项

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `http` | HTTP 暴露配置，`false` 表示仅 Agent 可用 | `POST` |
| `agentTool` | 是否暴露给 Agent | `true` |
| `readOnly` | 是否只读（GET 自动推断） | 自动推断 |
| `parallelSafe` | 是否可并发执行 | `false` |
| `toolCallable` | 是否可从扩展 iframe 调用 | `true` |
| `needsApproval` | 人工审批门控 | `false` |
| `publicAgent` | MCP/A2A 公开暴露配置 | — |

### 1.4 Action 发现与注册

1. 开发者在 `actions/` 目录创建 `.ts` 文件
2. 使用 `defineAction()` 默认导出
3. `autoDiscoverActions(import.meta.url)` 扫描目录
4. 自动挂载为 HTTP 端点 `/_agent-native/actions/<name>`
5. 自动暴露为 Agent 工具

---

## 2. 数据层 — SQL + Drizzle

### 2.1 方言无关设计

框架通过 `@agent-native/core/db/schema` 提供方言无关的 schema 定义，自动根据 `DATABASE_URL` 选择 PostgreSQL 或 SQLite：

```typescript
import { table, text, integer, now } from "@agent-native/core/db/schema";

export const users = table("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(now()),
});
```

- `table()` — 自动选择 `pgTable` 或 `sqliteTable`
- `integer({ mode: "boolean" })` — Postgres 映射为 `boolean`，SQLite 映射为 `integer`
- `now()` — 方言无关的当前时间戳表达式
- 支持后端：D1、Postgres、SQLite/libsql
- Per-app 数据库：先检查 `<APP_NAME>_DATABASE_URL`，回退到 `DATABASE_URL`

### 2.2 所有权与共享

```typescript
import { ownableColumns, createSharesTable } from "@agent-native/core/db/schema";

export const decks = table("decks", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  ...ownableColumns(),  // ownerEmail, orgId, visibility
});

export const deckShares = createSharesTable("deck_shares");
```

三层访问控制：
1. **直接所有权** — `owner_email = currentUser`
2. **可见性** — `private | org | public`
3. **共享行** — `*_shares` 表中的 per-user/per-org 授权

关键安全函数：
- `accessFilter()` — 列表/读取查询的行级过滤
- `assertAccess()` — 写入操作前的权限断言
- `resolveAccess()` — 读取单个资源的访问解析

---

## 3. Application State — 应用状态

Application State 是一个键值存储，用于跟踪 UI 导航、选择、焦点等运行时状态，让 Agent 能感知当前 UI 上下文。

### 3.1 数据模型

```sql
CREATE TABLE application_state (
  session_id TEXT NOT NULL,    -- 用户邮箱（作用域）
  key TEXT NOT NULL,           -- 状态键
  value TEXT NOT NULL,         -- JSON 值
  updated_at INTEGER NOT NULL, -- 时间戳
  PRIMARY KEY (session_id, key)
)
```

### 3.2 常用状态键

| 键 | 用途 |
|----|------|
| `navigate` | 导航状态 |
| `__set_url__` | URL 同步 |
| `__screen_refresh__` | 屏幕刷新 |
| `compose-{id}` | 撰写草稿 |

### 3.3 客户端 API

```typescript
import { readClientAppState, writeClientAppState, deleteClientAppState } from "@agent-native/core/client";

const nav = await readClientAppState("navigate");
await writeClientAppState("navigate", { view: "inbox", selectedId: "123" });
```

### 3.4 服务端路由

- `GET /_agent-native/application-state/:key`
- `PUT /_agent-native/application-state/:key`
- `DELETE /_agent-native/application-state/:key`

---

## 4. 实时同步 — useDbSync

### 4.1 双通道同步

```
写入端：
  Action/Setting/AppState 变更
    → emitAppStateChange() / recordChange()
    → 内存环形缓冲区 + EventEmitter
    → 持久化标记到 application_state（跨进程安全）

读取端：
  浏览器 useDbSync()
    → SyncTransport（SSE + Polling 双通道）
    → SSE: /_agent-native/events（实时推送，快速路径）
    → Poll: /_agent-native/poll?since=N（安全网，默认 2 秒间隔）
    → 版本游标追踪
    → React Query invalidateQueries()
    → UI 自动刷新
```

### 4.2 useDbSync Hook

```typescript
useDbSync({
  queryClient,
  pollUrl: "/_agent-native/poll",
  sseUrl: "/_agent-native/events",
  interval: 2000,           // 轮询间隔
  fallbackInterval: 15000,  // SSE 连接时的轮询间隔
  pauseWhenHidden: true,    // 标签页隐藏时暂停
  ignoreSource,             // 忽略自己发起的事件
  onEvent,                  // 事件回调
});
```

### 4.3 事件处理

| 事件来源 | 触发的 invalidate |
|----------|-------------------|
| `source: "action"` | 广泛 invalidate 所有查询 |
| `source: "app-state"` | invalidate `["app-state"]`、`["navigate-command"]`、`["__set_url__"]` |
| `source: "extensions"` | invalidate `["extension"]`、`["extensions"]` |
| `source: "screen-refresh"` | 递增 `useScreenRefreshKey()` 计数器 |

### 4.4 跨进程同步

- `checkExternalDbChanges()` 每秒检查 DB 的 `updated_at` 时间戳
- 检测 CLI action、cron job 等外部进程的写入
- Action 变更标记确保 serverless 调用也能触发刷新
- 事件按 `owner`/`orgId` 过滤，用户只能看到自己的事件

---

## 5. Agent 系统

### 5.1 Agent Loop 核心流程

```
1. 初始化：加载工具、处理器链、上下文指令
2. 循环：
   a. 应用上下文转换（context-xray）
   b. 应用观察记忆（observational memory）
   c. 调用 engine.stream() 获取 LLM 响应
   d. 处理流式事件（text-delta, thinking-delta, tool-call, usage, stop）
   e. 如果有工具调用：
      - 检查 needsApproval 门控
      - 检查重复只读调用缓存
      - 检查工具调用日志硬阻止
      - 执行工具（并行批处理：只读 + parallelSafe）
      - 发送 tool_start/tool_done 事件
      - 非只读工具完成后通知 UI 刷新
      - 将工具结果添加到消息历史
   f. 如果无工具调用（最终回答）：
      - 运行 finalResponseGuard
      - 发送 "done" 事件
      - 清理 ledger
      - 运行观察记忆压缩
3. 错误恢复：
   - 上下文过长：裁剪旧工具结果，重试一次
   - 可重试错误：指数退避重试
   - 可恢复错误：自动继续
   - 软超时：发出 auto_continue 信号
```

### 5.2 Agent Chat 事件类型

| 事件类型 | 说明 |
|----------|------|
| `text` | 文本流 |
| `thinking` | 思考过程 |
| `activity` | 活动指示 |
| `tool_start` | 工具调用开始 |
| `tool_done` | 工具调用完成 |
| `approval_required` | 需要人工审批 |
| `agent_call` | 子 Agent 调用 |
| `agent_task` | Agent 任务 |
| `done` | 完成 |
| `error` | 错误 |
| `auto_continue` | 自动继续 |
| `tripwire` | 处理器中止 |
| `loop_limit` | 循环限制 |

### 5.3 Run Manager

- 每个 thread 最多一个活跃 run
- 事件持久化到 SQL（跨 isolate 访问）
- 心跳机制（1.5 秒间隔）
- SQL 中止检查（3 秒间隔）
- 软超时（hosted 默认 40 秒）
- 完成后清理（5 分钟延迟）

### 5.4 Agent Engine 抽象

```typescript
interface AgentEngine {
  readonly name: string;           // "anthropic", "ai-sdk:openai" 等
  readonly label: string;
  readonly defaultModel: string;
  readonly supportedModels: readonly string[];
  readonly capabilities: EngineCapabilities;
  stream(opts: EngineStreamOptions): AsyncIterable<EngineEvent>;
}
```

内置引擎：
- `anthropic-engine` — Anthropic Claude
- `ai-sdk-engine` — AI SDK (OpenAI, Google 等)
- `builder-engine` — Builder.io Gateway

可通过 `registerAgentEngine()` 注册自定义引擎。

### 5.5 Agent 关键特性

| 特性 | 说明 |
|------|------|
| Plan Mode | 只读模式，只允许非变更操作 |
| Source Sweep Guard | 防止 Agent 对同一数据源反复调用（12 次阈值） |
| Tool Call Journal | 恢复安全，防止中断后重复执行写入操作 |
| Observational Memory | 长线程压缩，观察/反思层 |
| Context X-Ray | 上下文指令转换 |
| Final Response Guard | 最终回答守卫 |
| Human-in-the-Loop | `needsApproval` 门控 |
| Auto Continue | 软超时后自动继续 |

---

## 6. Provider API 模式

不是为每个 provider 端点硬编码一个 action，而是提供三个通用 action：

| Action | 说明 |
|--------|------|
| `provider-api-catalog` | 列出可用的 provider 和端点 |
| `provider-api-docs` | 获取 provider API 文档 |
| `provider-api-request` | 执行任意 provider API 请求 |

支持的 Provider（26 个）：amplitude, apollo, bigquery, commonroom, dataforseo, ga4, gcloud, github, gmail, gong, google_calendar, google_drive, granola, grafana, hubspot, jira, mixpanel, notion, posthog, prometheus, pylon, sentry, slack, stripe, twitter

认证类型：`none`、`bearer`、`basic`、`api-key-header`、`google-service-account`、`oauth-bearer`、`prometheus`

---

## 7. Extension 系统

Extension 是沙箱化的 Alpine.js 迷你应用，存储在 SQL 中。

### 7.1 数据模型

| 表 | 用途 |
|----|------|
| `tools` | Extension 本体（id, name, description, content, icon, owner_email, org_id, visibility） |
| `tool_data` | Extension 数据（id, tool_id, collection, item_id, data, scope） |
| `tool_shares` | 共享关系 |
| `tool_history` | 版本历史 |
| `tool_hidden_extensions` | 用户隐藏 |

### 7.2 Extension 可调用的桥接 API

| API | 说明 |
|-----|------|
| `appAction(name, params)` | 调用应用 action |
| `dbQuery(sql)` | 执行 SQL 查询 |
| `dbExec(sql)` | 执行 SQL 语句 |
| `appFetch(url)` | 调用允许的框架端点 |
| `extensionFetch(url)` | 调用外部 API（通过服务端代理） |

### 7.3 安全机制

- SSRF 防护
- 代理安全（密钥替换、输出脱敏）
- `toolCallable: false` — 阻止高影响操作从扩展调用

---

## 8. 认证与安全

### 8.1 认证

- Better Auth 集成（邮箱/密码、Google OAuth、GitHub OAuth）
- `getSession(event)` 获取当前会话
- `getRequestUserEmail()` / `getRequestOrgId()` 从请求上下文获取身份

### 8.2 凭据管理

- `app_secrets` 表 — 加密的用户级密钥覆盖
- 共享托管模式：拒绝部署级凭据回退，防止跨租户计费

### 8.3 Action 安全

- `requiresAuth` — 默认 true
- `toolCallable: false` — 阻止扩展 iframe 调用高影响操作
- `needsApproval` — 人工审批门控
- CORS 配置
- CSRF 保护

---

## 9. 项目结构

```
agent-native/
├── packages/core/           # 框架运行时（最核心）
│   └── src/
│       ├── action.ts        # defineAction 定义
│       ├── agent/            # Agent 系统
│       │   ├── production-agent.ts  # Agent 核心循环
│       │   ├── run-manager.ts       # 运行管理器
│       │   ├── engine/              # Agent Engine 抽象
│       │   └── types.ts             # 类型定义
│       ├── client/           # 客户端 API
│       │   ├── use-db-sync.ts       # 实时同步 hook
│       │   ├── application-state.ts # 应用状态客户端
│       │   └── use-action.ts        # Action hooks
│       ├── db/               # 数据库抽象
│       │   ├── schema.ts            # 方言无关 schema
│       │   ├── client.ts            # 数据库客户端
│       │   └── migrations.ts        # 迁移管理
│       ├── server/           # 服务端核心
│       │   ├── core-routes-plugin.ts # 框架路由
│       │   ├── agent-chat-plugin.ts  # Agent 聊天插件
│       │   ├── action-routes.ts      # Action HTTP 路由
│       │   ├── poll.ts               # 轮询处理器
│       │   ├── auth.ts               # 认证系统
│       │   └── action-discovery.ts   # Action 自动发现
│       ├── extensions/       # Extension 系统
│       ├── provider-api/     # Provider API 模式
│       └── application-state/ # 应用状态
├── packages/dispatch/       # Dispatch 包
├── packages/scheduling/     # Scheduling 包
├── templates/               # 模板应用
│   ├── mail/                # 邮件应用
│   ├── chat/                # 聊天应用
│   ├── forms/               # 表单应用
│   └── ...                  # 更多模板
├── .agents/skills/          # Agent 技能文档
└── docs/                    # 项目文档
```

每个模板应用的标准结构：

```
templates/<app>/
├── app/                # React 前端
│   ├── components/     # UI 组件
│   ├── hooks/          # 自定义 hooks
│   ├── pages/          # 页面
│   └── routes/         # 路由定义
├── actions/            # Action 定义
├── server/             # 服务端代码
│   ├── db/             # 数据库 schema
│   ├── handlers/       # 请求处理器
│   └── plugins/        # Nitro 插件
├── shared/             # 共享类型/工具
├── .agents/skills/     # Agent 技能文档
└── AGENTS.md           # Agent 行为规范
```

---

## 10. 框架路由一览

所有框架路由以 `/_agent-native/` 为前缀：

| 路由 | 方法 | 说明 |
|------|------|------|
| `/_agent-native/poll` | GET | 轮询变更事件 |
| `/_agent-native/events` | GET | SSE 事件流 |
| `/_agent-native/actions/:name` | POST/GET | Action HTTP 端点 |
| `/_agent-native/application-state/:key` | GET/PUT/DELETE | 应用状态 CRUD |
| `/_agent-native/agent-chat` | GET | Agent 聊天 SSE |
| `/_agent-native/threads/*` | — | 聊天线程管理 |
| `/_agent-native/settings/*` | — | 设置 CRUD |
| `/_agent-native/env-status` | GET | 环境变量状态 |
| `/_agent-native/ping` | GET | 健康检查 |
| `/_agent-native/open` | — | 打开应用视图 |
| `/_agent-native/embed/*` | — | 嵌入式认证 |
| `/_agent-native/mcp/*` | — | MCP 端点 |

---

## 11. 核心设计原则

1. **Action 是单一真相来源** — UI 和 Agent 通过相同的 Action 表面操作
2. **数据在 SQL** — Drizzle ORM，方言无关，支持 SQLite/Postgres/D1
3. **Agent 和 UI 平等** — 两者使用相同的数据和操作
4. **实时同步** — SSE + Polling 双通道，跨进程安全
5. **安全默认** — 认证、授权、CSRF、SSRF 防护、密钥管理
6. **可扩展引擎** — Agent Engine 插件化，支持多种 LLM 提供商
7. **可恢复运行** — 软超时、自动继续、工具调用日志、僵尸恢复
8. **Schema 变更必须加法** — 永远不删除、重命名、截断或破坏性修改表/列