---
name: security
description: >-
  agent-native 应用的安全编码实践：输入验证、SQL 注入、XSS、密钥、数据范围和认证。在编写任何涉及用户数据或外部输入的 action、路由或组件时使用。
metadata:
  internal: true
---

# 安全

## 规则

在所有地方使用框架的安全原语。绝不绕过它们。

## 绝对密钥规则

绝不硬编码密钥值或真实私有数据。这适用于源代码、文档、测试、固定数据、生成的提示、截图、种子数据和扩展 HTML，与生产代码同等重要。

不要粘贴或编造看起来真实的 API 密钥、bearer 令牌、OAuth 刷新令牌、Webhook URL、签名密钥、私有 Builder/内部数据或客户数据到仓库中。示例必须使用明显的占位符，如 `<OPENAI_API_KEY>`、`${keys.SLACK_WEBHOOK}`、`sk-test-example` 或 `example.customer@example.com`。测试字面值应明显是假的，当 `example` 令牌可以时，不得匹配真实提供者令牌格式。

凭据值仅通过批准的运行时渠道进入系统：部署环境变量用于部署级密钥，加密的 `app_secrets` 保管库或 `saveCredential` / `resolveCredential` 用于用户/组织/工作区 API 密钥，`oauth_tokens` 用于 OAuth。代码和指令可以命名凭据键（`OPENAI_API_KEY`），但绝不能包含凭据值。

## 输入验证

每个 action 使用带 Zod `schema:` 的 `defineAction`。框架自动验证输入，为 HTTP 调用者返回清晰的 400 错误，为 agent 工具调用返回结构化错误结果。

```ts
export default defineAction({
  schema: z.object({
    email: z.string().email(),
    role: z.enum(["admin", "member"]),
    limit: z.coerce.number().int().min(1).max(100).default(25),
  }),
  run: async (args) => { /* args 已完全类型化和验证 */ },
});
```

旧版 `parameters:` 字段（纯 JSON Schema）没有运行时验证 — 不要在新代码中使用。

## SQL 注入

绝不将用户输入拼接到 SQL 字符串中。使用 Drizzle ORM 的查询构建器（始终安全）或参数化查询：

```ts
// 安全 — Drizzle ORM
await db.select().from(users).where(eq(users.email, args.email));

// 安全 — 参数化原始 SQL
await client.execute({ sql: "SELECT * FROM users WHERE id = ?", args: [id] });

// 绝不要这样做
await client.execute(`SELECT * FROM users WHERE id = '${id}'`);
```

## XSS

- React 自动转义 JSX 内容 — 信任它。
- 绝不将 `dangerouslySetInnerHTML`、`innerHTML`、`eval()` 或 `document.write()` 用于用户控制的内容。
- 对于富文本编辑，使用 TipTap（框架依赖）。
- 对于渲染 markdown，使用 `react-markdown`。

## SSRF

任何用户或 agent 控制的 URL 的服务器端 `fetch` 必须通过框架 SSRF 防护 — 裸 `fetch()` 可能被指向云元数据（`169.254.169.254`）、`localhost` 或内部服务。

```ts
import { ssrfSafeFetch } from "@agent-native/core/extensions/url-safety";
// 阻止私有/内部目标，在连接时重新检查解析的 IP
// （DNS 重绑定），并重新验证每个重定向跳。
const res = await ssrfSafeFetch(userProvidedUrl, {}, { maxRedirects: 3 });
```

对于仅预检的检查（例如在流式或一次性 fetch 之前），使用同一模块的 `isBlockedExtensionUrlWithDns(url)` 加 `createSsrfSafeDispatcher()`，并设置 `redirect: "manual"`。绝不让默认 `fetch` 为不受信任的 URL 跟随重定向 — 公共 URL 可以通过 30x 重定向到私有网络。

## 密钥

- OAuth 令牌通过 `saveOAuthTokens()` 存入 `oauth_tokens` 存储。
- 每用户/每组织 API 密钥通过 `saveCredential` / `resolveCredential`（`@agent-native/core/credentials`）或 `app_secrets` 保管库。两者都使用 AES-256-GCM 静态加密值（由 `SECRETS_ENCRYPTION_KEY` 密钥，回退到 `BETTER_AUTH_SECRET`；生产环境没有其中一个则拒绝启动）。
- 绝不将密钥手工写入 `settings`、`application_state`、源代码或发送到客户端的 action 响应。上述凭据/保管库 API 是唯一认可的存储。
- 绝不在示例或固定数据中提交真实密钥、令牌、Webhook URL、签名密钥或私有 Builder/客户数据。使用不可能被误认为有效凭据的占位符。

## 用户凭据是每用户数据 — 绝不是 `process.env`

用户凭据（API 密钥、第三方令牌）是每用户（或每组织）数据。它们必须存在于 SQL 中，按用户（`u:<email>:credential:KEY`）或按组织（`o:<orgId>:credential:KEY`）范围化。始终使用请求上下文读取：

```ts
import { resolveCredential } from "@agent-native/core/credentials";
const apiKey = await resolveCredential("OPENAI_API_KEY", { userEmail, orgId });
```

值在静态时加密（AES-256-GCM，共享 `secrets/crypto.ts`）：`saveCredential` 在写入时加密，`resolveCredential` 在读取时解密，对旧版明文行有透明回退。Agent 的原始 `db-query` / `db-exec` 工具也无法读取凭据行 — 它们被排除在范围化的 `settings` 视图之外。要就地加密预存在的行，运行 `pnpm action db-migrate-encrypt-credentials`（幂等、非破坏性；需要与应用相同的 `SECRETS_ENCRYPTION_KEY` / `BETTER_AUTH_SECRET`）。

在 2026-04-29，旧版单参数 `resolveCredential(key)` 形式回退到 `process.env[key]` 和未范围化的全局 `settings` 行，因此每个登录用户继承了部署的凭据。两个防护现在在 CI 中阻止此情况（`pnpm prep`）：

- `scripts/guard-no-env-credentials.mjs` — 禁止在 `packages/core/src/credentials/`、`secrets/`、`vault/` 和 `templates/*/server/{lib,routes/api}/credential*` 路径中读取 `process.env.<KEY>`，明确的允许列表除外（`DATABASE_URL`、`BETTER_AUTH_SECRET`、`NETLIFY_*` 等部署级变量）。逐行选择退出：`// guard:allow-env-credential — <reason>`。
- `scripts/guard-no-unscoped-credentials.mjs` — 禁止单参数调用 `resolveCredential` / `hasCredential` / `saveCredential` / `deleteCredential`。逐行选择退出：`// guard:allow-unscoped-credential — <reason>`。

如果部署级值确实需要环境变量（CI 设置的令牌、主机密钥），它不是用户凭据 — 将其排除在 credentials/ secrets/ vault/ 路径之外，env-credentials 防护不会检测到它。

## 防护

另外两个 CI 防护（也接入 `pnpm prep`）针对 2026-04 跨租户泄漏类别 — 请求状态逃逸到共享进程状态，以及开发模式哨兵身份用作生产回退。

- `scripts/guard-no-env-mutation.mjs` — 禁止在生产代码中 `process.env.<KEY> = …`（以及括号/复合形式）。在无服务器环境中，每个热容器在一个 Node 进程中处理多个并发请求，因此 `process.env` 变更会跨进行中的请求泄漏（处理程序末尾的"恢复"行存在竞争且从无帮助 — 最近一次是 Zoom webhook）。改用 `runWithRequestContext({ userEmail, orgId, timezone }, fn)` 来自 `@agent-native/core/server` — 它基于 AsyncLocalStorage 且每请求安全。允许列表路径：`scripts/`、`*.spec.ts` / `*.test.ts`、`packages/core/src/dev**`、`templates/*/test/`、`/cli/` 或 `/scaffold/` 下的任何内容。逐行选择退出：`process.env.X = y // guard:allow-env-mutation — <reason>`。
- `scripts/guard-no-localhost-fallback.mjs` — 禁止在生产代码中使用字面量 `"local@localhost"` / `'local@localhost'` / `` `local@localhost` ``。Bug 类别：`getRequestUserEmail() ?? "local@localhost"` 静默地将每个未认证请求汇入单个共享租户，在账户之间泄漏凭据、工具和 `application_state` 行。正确行为是在没有会话时抛出/返回 401。允许列表路径：开发模式认证 shim（`packages/core/src/server/auth.ts`）、`packages/core/src/dev**`、测试、`scripts/`、`seed/` / `seeds/`，以及一些有意检查或迁移开发身份的框架辅助函数。SQL DDL `DEFAULT 'local@localhost'` 和 Drizzle 辅助 `.default('local@localhost')` 按行跳过 — schema 列默认是有意的开发固定数据，不是危险的后备模式。逐行选择退出：`email ?? "local@localhost" // guard:allow-localhost-fallback — <reason>`。

## 认证

- 所有 actions 由认证防护自动保护。
- 优先使用 actions 处理普通应用数据。不要为了添加认证而手写 `/api/*` 路由用于 CRUD、数据查询或 action 重新导出；action 端点已获得认证和请求上下文。
- 如果你必须创建自定义 `/api/` 路由，始终调用 `getSession(event)` 并拒绝没有会话的请求：

```ts
import { getSession } from "@agent-native/core/server";

export default defineEventHandler(async (event) => {
  const session = await getSession(event);
  if (!session) throw createError({ statusCode: 401 });
  // ...
});
```

- 绝不创建修改数据的未保护路由。

## 高后果操作的人工审批

对于少数面向外部的、难以撤销的操作 — 发送电子邮件、扣款、删除账户、公开发布 — 认证和访问控制是必要的但不够的：你也不希望 **agent** 自主执行它们。在 `defineAction` 上设置 `needsApproval`，这样 agent 不能在人类批准特定调用之前运行该 action。

```ts
export default defineAction({
  description: "通过 Gmail 发送电子邮件。",
  schema: z.object({ to: z.string(), subject: z.string(), body: z.string() }),
  needsApproval: true, // 或 (args, ctx) => boolean | Promise<boolean>
  run: async (args) => {
    /* ...实际发送... */
  },
});
```

当门控为真且调用尚未批准时，循环发出 `approval_required` 事件并**停止轮次 — `run()` 永远不会执行**。人类通过聊天 UI 的批准功能进行批准，该功能使用调用的稳定 `approvalKey` 重新发出轮次；只有那时 action 才运行。谓词有条件地门控（例如仅外部收件人）并**失败关闭** — 抛出被视为"需要批准"。

规则：

- 仅对真正高后果的操作使用 `needsApproval`。默认关闭，框架有意保持审批稀少 — 过度门控将 agent 变成点击向导。典型的（也是有意唯一的）框架示例是 Mail 的 `send-email`。
- `needsApproval` **不是** `accessFilter` / `assertAccess` 的替代品，也不是用 `agentTool: false` / `toolCallable: false` 向模型隐藏敏感操作。它是"人类必须明确祝福这个特定的面向外部调用"的层，不是用于范围化数据。完整表面请参阅 `actions` 技能。

## 自定义 HTTP 路由必须自行应用访问控制

这是代码库中最常失败的规则。自动挂载的 action 路由（`/_agent-native/actions/...`）自动获得请求上下文。**手写的 `/api/*` Nitro 路由不会。** 如果你的处理器查询可拥有资源（任何带有 `...ownableColumns()` 的表），你必须：

1. 读取会话：`const session = await getSession(event).catch(() => null)`。
2. 在 `runWithRequestContext({ userEmail: session?.email, orgId: session?.orgId }, fn)` 内运行工作，来自 `@agent-native/core/server`。
3. 在 `fn` 内，通过以下之一查询：
   - `accessFilter(table, sharesTable)` 在 WHERE 子句中用于列表/读取多个。
   - `resolveAccess("<type>", id)` 用于按 ID 读取（无访问权限时返回 null — 返回 404 而非 403，这样不会泄漏存在性）。
   - `assertAccess("<type>", id, "viewer"|"editor"|"admin")` 用于写入/按 ID 删除。

```ts
// 错误 — Brent 的注册因此确切形状泄漏了其他每个用户的牌组。
export default defineEventHandler(async () => {
  const db = getDb();
  return db.select().from(schema.decks); // 没有访问过滤器！
});

// 正确
import { getSession, runWithRequestContext } from "@agent-native/core/server";
import { accessFilter } from "@agent-native/core/sharing";
export default defineEventHandler(async (event) => {
  const session = await getSession(event).catch(() => null);
  return runWithRequestContext(
    { userEmail: session?.email, orgId: session?.orgId },
    async () => {
      const db = getDb();
      return db
        .select()
        .from(schema.decks)
        .where(accessFilter(schema.decks, schema.deckShares));
    },
  );
});
```

`scripts/guard-no-unscoped-queries.mjs` 在 `pnpm prep` 中运行，如果 `templates/*/server/`、`templates/*/actions/` 或 `packages/*/src/` 中的任何文件在没有访问辅助函数之一的情况下查询可拥有表，则构建失败。最后手段的选择退出是标记注释 `// guard:allow-unscoped — <reason>` — 仅在共享原语本身或共享令牌公共查看者端点等情况下使用，并始终包含审查者可读的原因。

## 数据范围化

在生产中，框架使用临时视图自动将所有 agent SQL 查询限制为当前用户的数据。这在 SQL 层面强制执行 — agent 无法绕过它。

`db-query` / `db-exec` 工具（以及共享相同路径的扩展 SQL 桥）拒绝模式限定的表引用，如 `public.<table>` 或 `main.<table>` — 限定名解析为基础表并会跳过临时视图。使用裸表名；范围化自动应用。

### 每用户范围化（`owner_email`）

每个包含用户数据的模板表**必须**有 `owner_email` 文本列：

1. 框架通过 schema 内省检测 `owner_email`
2. 在每次查询前创建临时视图 `WHERE owner_email = <current user>`
3. 自动将 `owner_email` 注入 INSERT 语句

当前用户从 `AGENT_USER_EMAIL` 解析（从会话自动设置）。

### 每组织范围化（`org_id`）

对于多组织应用，表还需要 `org_id`：

1. 添加 `WHERE org_id = <current org>`（如果存在 `owner_email` 则额外添加）
2. `org_id` 自动注入 INSERT 语句

在 agent-chat 插件中启用组织范围化：

```ts
createAgentChatPlugin({
  resolveOrgId: async (event) => {
    const ctx = await getOrgContext(event);
    return ctx.orgId;
  },
});
```

### 列约定

| 列            | 用途             | 必需                           |
| ------------- | ---------------- | ------------------------------ |
| `owner_email` | 每用户数据隔离    | 是，所有面向用户的表            |
| `org_id`      | 每组织数据隔离    | 是，多组织应用                  |

运行 `pnpm action db-check-scoping` 验证。多组织应用使用 `--require-org`。

## 检查清单

- [ ] 新 action 使用带 Zod `schema:` 的 `defineAction`
- [ ] 没有用户输入的 SQL 字符串拼接
- [ ] 没有用户内容的 `dangerouslySetInnerHTML`
- [ ] 用户/agent URL 的服务器端 fetch 使用 `ssrfSafeFetch`，而非裸 `fetch`
- [ ] 密钥通过 `saveCredential` / 保管库存储（加密），绝不在 `settings` 或响应中明文
- [ ] 没有硬编码的 API 密钥、令牌、Webhook URL、签名密钥、真实凭据式字符串、私有 Builder/内部数据或客户数据
- [ ] 新环境变量仅在 `.env` 中，不提交
- [ ] 新用户数据表有 `owner_email` 列
- [ ] 自定义路由调用 `getSession` 并拒绝未认证请求

## 相关技能

- `storing-data` — SQL 模式和 agent 的 db 工具
- `actions` — 带 Zod schema 验证的 `defineAction`
- `authentication` — 认证模式、会话和组织上下文