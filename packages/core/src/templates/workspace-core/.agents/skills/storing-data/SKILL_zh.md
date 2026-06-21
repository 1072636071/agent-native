---
name: storing-data
description: >-
  如何在 Agent-Native 应用中存储应用数据。所有数据存在于 SQL 中。在添加数据模型、决定数据存储位置或读写应用数据时使用。
metadata:
  internal: true
---

# 存储数据 — SQL 是事实来源

## 规则

所有应用数据存在于 **SQL** 中（本地为 SQLite，生产中为持久数据库）。Agent 和 UI 共享同一个数据库。不要在文件系统中存储持久应用数据，除非应用明确运行下面描述的本地文件模式工件流程。

**本地文件模式例外：** 某些工件应用（Content、Plans、Slides、Dashboards、Designs 等）可以有意使用仓库文件作为工件本身的事实来源。这必须通过 `agent-native.json`、`AGENT_NATIVE_MODE=local-files` 或应用拥有的本地文件 action 辅助函数显式声明。在该模式下，UI 和 Agent 仍然通过应用 action，但这些 action 通过 `@agent-native/core/local-artifacts` 读取/写入限定作用域的文件而不是 SQL 行。应用状态、认证、设置、凭据、协作元数据和托管数据库模式仍然是 SQL。文件到数据库或文件到提供商的同步是显式同步步骤，不是编辑的隐式副作用。

添加数据模型、列表或读取路径时，也要遵循 `performance` 技能：只投影列表渲染的列，索引热查询过滤/排序的列，避免查询瀑布 — 这样应用在数据增长时保持快速。

## 工作原理

Agent-Native 应用在配置的 SQL 后端上使用 Drizzle ORM。本地开发开箱即用 SQLite 文件 `data/app.db`；生产和共享预览部署需要持久的 `DATABASE_URL`，因为容器/Serverless 文件系统可能重置。代码在后端间应行为一致，但本地 SQLite 文件一旦部署就不再持久。

对于应用代码，默认使用 Drizzle 的 schema/query DSL。原始 SQL 是附加迁移、健康检查或一次性维护的逃生舱，不是构建功能的常规方式。

### 核心 SQL 存储（自动创建，所有模板可用）

| 存储                  | 用途                                               | 访问方式                                    |
| -------------------- | -------------------------------------------------- | ------------------------------------------- |
| `application_state`  | 临时 UI 状态（撰写窗口、导航）                      | `readAppState()` / `writeAppState()`        |
| `settings`           | 持久 KV 配置（偏好、应用设置）                      | `getSetting()` / `putSetting()`             |
| `oauth_tokens`       | OAuth 凭据                                         | `@agent-native/core/oauth-tokens`           |
| `sessions`           | 认证会话                                           | `@agent-native/core/server`                 |

### 领域数据（每模板）

在 `server/db/schema.ts` 中使用框架 Drizzle 辅助函数定义 schema。使用 `const db = getDb()` 从 `server/db/index.ts` 获取数据库实例。所有查询都是异步的。

```ts
import { eq } from "drizzle-orm";
import { table, text, integer, now } from "@agent-native/core/db/schema";

export const tasks = table("tasks", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  completed: integer("completed", { mode: "boolean" })
    .notNull()
    .default(false),
  createdAt: text("created_at").notNull().default(now()),
});

const rows = await db.select().from(tasks).where(eq(tasks.id, taskId));
```

永远不要在应用模板中从 `drizzle-orm/sqlite-core` 或 `drizzle-orm/pg-core` 导入 `sqliteTable` / `pgTable` 或列辅助函数。使用 `@agent-native/core/db/schema`，这样相同的 schema 可以在 SQLite、Postgres、libSQL/Turso、D1 和其他支持的后端上运行。

| 模板         | 表                                            |
| ------------ | --------------------------------------------- |
| **Mail**     | emails, labels（连接时 + Gmail API）          |
| **Calendar** | events, bookings                              |
| **Forms**    | forms, responses                              |
| **Content**  | documents                                     |
| **Slides**   | decks（JSON 存储在 SQL 中）                   |
| **Videos**   | 注册表中的 compositions + localStorage        |

### Agent 访问

Agent 使用应用特定的 action 读写数据库。核心 DB 脚本用于检查和维护，不是用于实现正常产品行为：

- `pnpm action db-schema` — 显示所有表、列、类型
- `pnpm action db-query --sql "SELECT * FROM forms"` — 运行 SELECT 查询
- `pnpm action db-exec --sql "UPDATE ..."` — 最后手段的临时维护，用于短列、多列写入或当没有领域 action 存在时的计算更新。对于多个相关写入，优先使用 `--statements '[{"sql":"...","args":[...]}]'`，这样它们在一个事务中顺序运行。Schema 变更被阻止；使用经过审查的附加迁移/启动代码。
- `pnpm action db-patch --table <t> --column <c> --where "<clause>" --find "<old>" --replace "<new>"` — **对大型文本列的精确搜索/替换。** 发送差异而不是重新传输整个值，因此在编辑多 KB 文档、幻灯片 HTML、仪表板/表单 JSON 等时，比 `db-exec UPDATE` 在令牌效率上大幅提升。每次调用精确针对一行 — 用主键缩小 `--where`。支持 `--edits '[{find,replace},...]'` 批量编辑和 `--all` 替换每次出现。
- 应用特定的 action 用于领域操作 — **当存在时始终优先于原始 SQL。** 它们编码业务规则，为客户端 action 钩子提供动力，对于编辑器支持的表（文档、幻灯片）还会向打开的协作编辑器推送实时 Yjs 更新。`db-patch` 是没有专用编辑 action 的表的通用回退。

**一次性维护，如何在 `db-exec UPDATE` 和 `db-patch` 之间选择：**

| 场景                                                       | 使用          |
| ---------------------------------------------------------- | ------------- |
| 在一行上 `SET status = 'published'`                        | `db-exec`     |
| `SET calories = calories + 50`                             | `db-exec`     |
| 同时更新多列                                               | `db-exec`     |
| 作为一个逻辑操作插入/更新多行                              | `db-exec --statements` |
| 修复 50KB Markdown 文档 `content` 列中的拼写错误           | `db-patch`    |
| 更改仪表板 JSON blob 中的单个键                            | `db-patch`    |
| 微调存储在 `decks.data` 中的幻灯片 HTML 的一个段落         | `db-patch`    |
| 任何你否则需要重新发送数千字符的编辑                       | `db-patch`    |

所有这些都遵守每用户/每组织数据作用域 — 无论选择哪个工具，你都无法读取或写入当前用户数据之外的行。

### 前端访问

前端使用客户端 API 的 React Query 钩子调用 action。框架拥有这些钩子背后的 HTTP 传输，因此组件不应使用原始 `fetch` 调用 action 路由。

```ts
import { useActionQuery, useActionMutation } from "@agent-native/core/client";

// 读取数据
const { data } = useActionQuery("list-meals", { date: "2025-01-01" });

// 写入数据
const { mutate } = useActionMutation("log-meal");
```

Action 是前端访问数据的**首选方式**。你很少需要自定义 `/api/` 路由 — 仅用于文件上传、流式传输、Webhook 或 OAuth 回调。

### 生产 / 云部署

本地 SQLite 开箱即用。要部署到生产或数据必须在重启后存活的任何环境：

1. 将 `DATABASE_URL` 设置为持久 SQL 数据库。
2. 仅当提供商需要单独令牌时设置 `DATABASE_AUTH_TOKEN`，如 Turso/libSQL。
3. 当 schema 和查询保持可移植时，不需要代码更改。

Turso 是一个有效选项，不是必需选项。常见选择包括 Neon 或 Supabase Postgres、Turso/libSQL、普通 Postgres、持久 SQLite、Cloudflare D1 绑定以及可用时的托管平台 SQL 环境。

### 实时同步

轮询将数据库变更流式传输到 UI。当 Agent 通过脚本写入数据库时，UI 通过 `useDbSync()` 自动更新，该函数使 React Query 缓存失效。

## 应该做

- 使用 Drizzle ORM 处理结构化领域数据（表单、预订、文档）
- 使用 Drizzle 查询构建器方法（`select`、`insert`、`update`、`delete`）和 `drizzle-orm` 的可移植操作符（`eq`、`and`、`or`、`inArray`、`desc` 等）进行应用读写
- 使用 `@agent-native/core/db/schema` 的框架 schema 辅助函数，而不是方言特定的 Drizzle 导入
- 使用 `settings` 存储应用配置和用户偏好
- 使用 `application-state` 存储 Agent 和 UI 共享的临时 UI 状态
- 使用 `oauth-tokens` 存储 OAuth 凭据
- 使用核心 DB 脚本（`db-schema`、`db-query`、`db-exec`、`db-patch`）进行临时数据库操作
- 对相关写入使用 `db-exec --statements` 而不是多个单独的 `db-exec` 调用；它更快，如果一条语句失败则回滚整个批次
- 当你对大型文本/JSON 列进行小更改时，选择 `db-patch` 而不是 `db-exec UPDATE` — 它在令牌上便宜得多

## 禁止

- 不要将结构化应用数据存储为 JSON 文件
- 不要将应用状态存储在 localStorage、sessionStorage 或 cookie 中（仅限 UI 偏好如侧边栏宽度除外）
- 不要仅将状态保留在内存中（服务器变量、全局存储）
- 不要使用 Redis 或任何外部状态存储来存储应用数据
- 不要在 Drizzle 可以表达查询时使用原始 SQL 或 `getDbExec()` 实现产品功能
- 不要在应用代码中编写仅 SQLite 或仅 Postgres 的 SQL
- 不要将用户输入直接插入 SQL 查询 — 使用 Drizzle ORM 的查询构建器

## 安全

- **SQL 注入** — 使用 Drizzle ORM 的查询构建器，永远不要对 SQL 查询使用原始字符串插值
- **写入前验证** — 写入前检查数据形状，特别是用户提交的数据

## 应用状态和上下文感知

存储应用状态时，包含**导航状态** — Agent 需要知道用户正在查看什么。`application_state` 表保存 Agent 和 UI 共享的临时 UI 状态。关键模式：

- **`navigation` 键** — UI 在每次路由变更时写入当前视图和选择。Agent 在行动前读取它。
- **`navigate` 键** — Agent 写入一次性命令来导航 UI。UI 处理并删除它们。
- **领域特定键**（例如 `compose-{id}`）— 用于邮件草稿等功能的双向状态。

添加新数据模型或功能时，还要考虑什么导航和选择状态需要通过应用状态暴露。完整模式请参阅 **context-awareness** 技能。

## 相关技能

- **context-awareness** — 如何通过应用状态暴露导航和选择状态
- **real-time-sync** — 设置轮询以便数据库变更时 UI 更新
- **actions** — 使用 `defineAction` 创建 action 来查询数据库
- **client-methods** — 将路由细节保留在命名的客户端辅助函数/钩子之后
- **self-modifying-code** — Agent 也可以修改应用自身的源代码