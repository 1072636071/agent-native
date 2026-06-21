---
name: storing-data
description: >-
  如何在 agent-native 应用中存储应用数据。所有数据存储在 SQL 中。
  在添加数据模型、决定数据存储位置或读取/写入应用数据时使用。
metadata:
  internal: true
---

# 存储数据 — SQL 是唯一真相源

## 规则

所有应用数据存储在 **SQL** 中（本地为 SQLite，生产环境为持久化数据库）。智能体和 UI 共享同一数据库。除非应用明确运行下面描述的本地文件模式工件流程，否则不要在文件系统中存储持久应用数据。

**本地文件模式例外：** 某些工件应用（Content、Plans、Slides、Dashboards、Designs 等）可以有意将仓库文件作为工件本身的真相源。这必须通过 `agent-native.json`、`AGENT_NATIVE_MODE=local-files` 或应用拥有的本地文件 action 辅助函数来明确声明。在该模式下，UI 和智能体仍通过应用 action 操作，但这些 action 通过 `@agent-native/core/local-artifacts` 读取/写入限定范围的文件，而不是 SQL 行。应用状态、认证、设置、凭据、协作元数据和托管数据库模式仍使用 SQL。文件到数据库或文件到提供商的同步是显式同步步骤，而非编辑的隐式副作用。

当你添加数据模型、列表或读取路径时，还应遵循 `performance` 技能：仅投影列表渲染所需的列，为热门查询的过滤/排序列建立索引，并避免查询瀑布 — 这样应用在数据增长时仍能保持快速。

## 工作原理

Agent-native 应用使用 Drizzle ORM 连接配置的 SQL 后端。本地开发开箱即用，使用 `data/app.db` 处的 SQLite 文件；生产和共享预览部署需要持久化的 `DATABASE_URL`，因为容器/无服务器文件系统可能会重置。代码在不同后端之间应表现一致，但本地 SQLite 文件在部署后不再持久。

对于应用代码，默认使用 Drizzle 的 schema/query DSL。原始 SQL 是用于增量迁移、健康检查或一次性维护的逃生通道，而非构建功能的常规方式。

### 核心 SQL 存储（自动创建，所有模板可用）

| 存储                | 用途                                              | 访问方式                                   |
| ------------------- | ------------------------------------------------- | ------------------------------------------ |
| `application_state` | 临时 UI 状态（撰写窗口、导航）                    | `readAppState()` / `writeAppState()`       |
| `settings`          | 持久化 KV 配置（偏好、应用设置）                  | `getSetting()` / `putSetting()`            |
| `oauth_tokens`      | OAuth 凭据                                        | `@agent-native/core/oauth-tokens`          |
| `sessions`          | 认证会话                                          | `@agent-native/core/server`               |

### 领域数据（按模板）

在 `server/db/schema.ts` 中使用框架 Drizzle 辅助函数定义 schema。通过 `const db = getDb()`（来自 `server/db/index.ts`）获取数据库实例。所有查询都是异步的。

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

不要在应用模板中从 `drizzle-orm/sqlite-core` 或 `drizzle-orm/pg-core` 导入 `sqliteTable` / `pgTable` 或列辅助函数。使用 `@agent-native/core/db/schema`，以便同一 schema 可以在 SQLite、Postgres、libSQL/Turso、D1 和其他支持的后端上运行。

| 模板         | 表                                             |
| ------------ | ---------------------------------------------- |
| **Mail**     | emails, labels (+ 连接时的 Gmail API)          |
| **Calendar** | events, bookings                               |
| **Forms**    | forms, responses                               |
| **Content**  | documents                                      |
| **Slides**   | decks (JSON 存储在 SQL 中)                     |
| **Videos**   | 注册表中的 compositions + localStorage         |

### 智能体访问

智能体使用特定应用的 action 读取/写入数据库。核心 DB 脚本用于检查和维护，而非实现常规产品行为：

- `pnpm action db-schema` — 显示所有表、列、类型
- `pnpm action db-query --sql "SELECT * FROM forms"` — 运行 SELECT 查询
- `pnpm action db-exec --sql "UPDATE ..."` — 最后手段的临时维护，用于短列、多列写入或当不存在领域 action 时的计算更新。对于多个相关写入，优先使用 `--statements '[{"sql":"...","args":[...]}]'`，以便它们在一个事务中顺序运行。Schema 变更被阻止；使用经过审查的增量迁移/启动代码代替。
- `pnpm action db-patch --table <t> --column <c> --where "<clause>" --find "<old>" --replace "<new>"` — **对大型文本列进行精确搜索/替换。** 发送差异而非重新传输整个值，因此在编辑多 KB 文档、幻灯片 HTML、仪表板/表单 JSON 等时，比 `db-exec UPDATE` 的 token 效率显著更高。每次调用仅针对一行 — 通过主键缩小 `--where` 范围。支持 `--edits '[{find,replace},...]'` 进行批量编辑和 `--all` 替换所有出现。
- 特定应用的领域操作 action — **当存在时，始终优先于原始 SQL。** 它们编码业务规则、为客户端 action hooks 提供支持，对于编辑器支持的表（文档、幻灯片），还会向打开的协作编辑器推送实时 Yjs 更新。`db-patch` 是没有专用编辑 action 的表的通用回退方案。

**对于一次性维护，如何在 `db-exec UPDATE` 和 `db-patch` 之间选择：**

| 场景                                                     | 使用          |
| -------------------------------------------------------- | ------------- |
| 对一行 `SET status = 'published'`                        | `db-exec`    |
| `SET calories = calories + 50`                           | `db-exec`    |
| 同时更新多个列                                           | `db-exec`    |
| 作为一个逻辑操作插入/更新多行                            | `db-exec --statements` |
| 修复 50KB markdown 文档 `content` 列中的拼写错误         | `db-patch`   |
| 更改仪表板 JSON blob 中的单个键                          | `db-patch`   |
| 调整存储在 `decks.data` 中的幻灯片 HTML 的一个段落       | `db-patch`   |
| 任何你否则会重新发送数千字符的编辑                       | `db-patch`   |

所有这些操作都遵守每用户/每组织的数据范围限制 — 无论选择哪个工具，你都无法读取或写入当前用户数据范围之外的行。

### 前端访问

前端使用客户端 API 的 React Query hooks 调用 action。框架拥有这些 hooks 背后的 HTTP 传输，因此组件不应使用原始 `fetch` 调用 action 路由。

```ts
import { useActionQuery, useActionMutation } from "@agent-native/core/client";

// 读取数据
const { data } = useActionQuery("list-meals", { date: "2025-01-01" });

// 写入数据
const { mutate } = useActionMutation("log-meal");
```

Action 是前端访问数据的**首选方式**。你很少需要自定义 `/api/` 路由 — 仅用于文件上传、流式传输、Webhook 或 OAuth 回调。

### 生产/云部署

本地 SQLite 开箱即用。要部署到生产环境或数据需要在重启后持久化的任何环境：

1. 将 `DATABASE_URL` 设置为持久化 SQL 数据库。
2. 仅当提供商需要单独令牌时（如 Turso/libSQL）才设置 `DATABASE_AUTH_TOKEN`。
3. 当 schema 和查询保持可移植时，不需要代码更改。

Turso 是一个有效选项，不是必需选项。常见选择包括 Neon 或 Supabase Postgres、Turso/libSQL、普通 Postgres、持久化 SQLite、Cloudflare D1 绑定以及可用时的托管平台 SQL 环境。

### 实时同步

轮询将数据库变更流式传输到 UI。当智能体通过脚本写入数据库时，UI 通过 `useDbSync()` 自动更新，该函数使 React Query 缓存失效。

## 应该做的

- 使用 Drizzle ORM 处理结构化领域数据（表单、预订、文档）
- 使用 Drizzle 查询构建器方法（`select`、`insert`、`update`、`delete`）和 `drizzle-orm` 中的可移植操作符（`eq`、`and`、`or`、`inArray`、`desc` 等）进行应用读写
- 使用 `@agent-native/core/db/schema` 中的框架 schema 辅助函数，而非特定方言的 Drizzle 导入
- 使用 `settings` 存储应用配置和用户偏好
- 使用 `application-state` 存储智能体和 UI 共享的临时 UI 状态
- 使用 `oauth-tokens` 存储 OAuth 凭据
- 使用核心 DB 脚本（`db-schema`、`db-query`、`db-exec`、`db-patch`）进行临时数据库操作
- 使用 `db-exec --statements` 而非多个单独的 `db-exec` 调用处理相关写入；它更快且在一条语句失败时回滚整个批次
- 在对大型文本/JSON 列进行小更改时，优先使用 `db-patch` 而非 `db-exec UPDATE` — 它在 token 消耗上更经济

## 不应该做的

- 不要将结构化应用数据存储为 JSON 文件
- 不要将应用状态存储在 localStorage、sessionStorage 或 cookies 中（仅限 UI 偏好如侧边栏宽度除外）
- 不要仅在内存中保持状态（服务器变量、全局存储）
- 不要使用 Redis 或任何外部状态存储来存储应用数据
- 不要在 Drizzle 可以表达查询时使用原始 SQL 或 `getDbExec()` 实现产品功能
- 不要在应用代码中编写仅限 SQLite 或仅限 Postgres 的 SQL
- 不要将用户输入直接插入 SQL 查询 — 使用 Drizzle ORM 的查询构建器

## 安全

- **SQL 注入** — 使用 Drizzle ORM 的查询构建器，绝不使用原始字符串插值进行 SQL 查询
- **写入前验证** — 在写入前检查数据形状，特别是用户提交的数据

## 应用状态和上下文感知

存储应用状态时，包含**导航状态** — 智能体需要知道用户正在查看什么。`application_state` 表保存智能体和 UI 共享的临时 UI 状态。关键模式：

- **`navigation` 键** — UI 在每次路由变更时写入当前视图和选择。智能体在操作前读取此状态。
- **`navigate` 键** — 智能体写入一次性命令来导航 UI。UI 处理并删除它们。
- **领域特定键**（如 `compose-{id}`）— 用于邮件草稿等功能的双向状态。

添加新数据模型或功能时，还应考虑需要通过 application-state 暴露哪些导航和选择状态。完整模式请参阅 **context-awareness** 技能。

## 相关技能

- **context-awareness** — 如何通过 application-state 暴露导航和选择状态
- **real-time-sync** — 设置轮询以便在数据库变更时更新 UI
- **actions** — 使用 `defineAction` 创建 action 来查询数据库
- **client-methods** — 将路由细节保留在命名辅助函数/hooks 之后
- **self-modifying-code** — 智能体也可以修改应用的源代码