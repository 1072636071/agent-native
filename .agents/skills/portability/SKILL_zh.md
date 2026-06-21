---
name: portability
description: >-
  如何保持模板代码数据库无关和托管无关。在定义 schema、编写原始 SQL、
  创建服务器路由或任何可能泄露仅 SQLite、仅 Postgres 或仅 Node
  假设的内容时使用。
metadata:
  internal: true
---

# 可移植性

## 规则

**永远不要编写只在一个数据库或一个托管平台上工作的代码。** 模板必须在可移植的 SQL 后端（SQLite、Postgres、D1、Turso/libSQL、Supabase、Neon、可用时的托管平台 SQL 环境）和任何 Nitro 部署目标（Node、Cloudflare、Netlify、Vercel、Deno、Lambda、Bun）上运行，无需代码更改。

## 数据库无关

使用 `@agent-native/core/db/schema` 中的方言无关 schema 辅助函数定义 schema，使用 Drizzle 的查询构建器进行读写：

```ts
import {
  table,
  text,
  integer,
  real,
  now,
  sql,
} from "@agent-native/core/db/schema";

export const meals = table("meals", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  calories: integer("calories").notNull(),
  weight: real("weight"),
  archived: integer("archived", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(now()),
});
```

| 辅助函数  | 用途                                                                                   |
| --------- | -------------------------------------------------------------------------------------- |
| `table`   | 根据方言委托给 `pgTable` 或 `sqliteTable`                                              |
| `text`    | 在两种方言中都工作，支持 `{ enum: [...] }`                                             |
| `integer` | `{ mode: "boolean" }` 自动映射到 Postgres `boolean`                                    |
| `real`    | SQLite 上为 `real`，Postgres 上为 `double precision`                                   |
| `now`     | 方言无关的当前时间戳——在文本时间戳列上与 `.default(now())` 一起使用                    |
| `sql`     | 从 `drizzle-orm` 重新导出用于原始 SQL 表达式                                           |

**永远不要在模板代码中直接从 `drizzle-orm/sqlite-core` 或 `drizzle-orm/pg-core` 导入。** 始终使用 `@agent-native/core/db/schema` 代替。

使用 Drizzle 的可移植查询 DSL 编写应用代码：

```ts
import { and, desc, eq } from "drizzle-orm";

const rows = await db
  .select()
  .from(meals)
  .where(and(eq(meals.ownerEmail, userEmail), eq(meals.archived, false)))
  .orderBy(desc(meals.createdAt));
```

当 Drizzle 可以表达查询时，避免在 action、处理器和存储中使用 `db.execute(...)`、`getDbExec()` 和手写 SQL。原始 SQL 应限于增量迁移、健康检查、仔细审查的高级查询或一次性维护脚本。对于 Drizzle schema 中的时间戳，使用 `.default(now())`；对于迁移 SQL，使用 `runMigrations()`，这样框架支持的兼容性重写和方言门控语句保持集中。

### 原始 SQL 辅助函数

- `getDbExec()`——自动将 `?` 参数转换为 Postgres 的 `$1`
- `isPostgres()`——运行时方言检查
- `intType()`——返回方言的正确整数类型

### 永远不要

永远不要在产品代码或文档示例中编写仅 SQLite 的语法：`INSERT OR REPLACE`、`AUTOINCREMENT`、`datetime('now')`。编写文档时，说"SQL 数据库"——而不是"SQLite"。

永远不要在共享应用代码中编写仅 Postgres 的语法：`ILIKE`、`::type` 类型转换、`jsonb_*`、`RETURNING` 假设、serial/identity 语法、`ON CONFLICT` upsert 或 `ALTER ... TYPE`，除非代码在方言门控的迁移块内。优先使用 Drizzle API 或框架辅助函数。

在提供部署指导时，对持久性要精确：本地 SQLite 是开发后备，而生产需要持久的 `DATABASE_URL`。不要引导用户将 Turso 作为唯一路径；它是 Neon、Supabase、Turso/libSQL、普通 Postgres、持久 SQLite、D1 绑定和可用时托管平台 SQL 环境中的一个选项。

## 托管无关

服务器在 **Nitro** 上运行，使用 **H3** 作为 HTTP 框架。模板必须可部署到任何 Nitro 支持的目标。

### 永远不要使用 Express

所有服务器代码使用 H3/Nitro：`defineEventHandler`、`readBody`、`getMethod`、`setResponseHeader` 等。Express 不是依赖。如果你在任何地方看到 Express 类型或模式，用 H3 等效项替换它们。

### 脚手架模板源代码中没有平台特定的配置

像 `netlify.toml`、`wrangler.toml`、`vercel.json` 和 `netlify/functions/` 这样的文件不得出现在 CLI 脚手架源代码（`packages/core/src/templates/`）中——为用户生成的应用保持托管无关，平台配置存在于 CI/托管仪表板中。

**例外：** 此 monorepo 自己的一等部署应用（`templates/*/netlify.toml`、根目录 `wrangler-*.toml` 文件）是_此_仓库的部署产物（mail.agent-native.com 等），预期存在。不要将它们当作意外垃圾删除——上面的规则是关于什么被脚手架到新应用中，而不是此仓库的部署配置。

### 服务器路由/插件中不使用 Node API

永远不要在服务器路由和插件中使用 `fs`、`child_process` 或 `path`。使用 Nitro 抽象。（`actions/` 中的 action 在 Node.js 中运行，可以自由使用 Node API。）

### 不假设持久进程

永远不要假设持久的服务器进程。对所有状态使用 SQL 数据库。

## 相关 Skill

- `storing-data`——Schema 模式和核心 SQL 存储
- `server-plugins`——框架路由和 H3 处理器模式
- `security`——通过参数化查询防止 SQL 注入