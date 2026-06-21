---
name: sharing
description: >-
  用户创建资源（仪表板、文档、表单、牌组等）的框架级共享和隐私。在使资源表可拥有、接入列表/读取/更新访问检查、或将标准共享对话框放入模板时使用。
metadata:
  internal: true
---

# 共享 — 默认私有，显式共享

## 规则

用户**创建**的任何资源（仪表板、文档、表单、牌组、组合、预订链接、问题、分析）默认**对创建者私有**，仅当被**显式共享**或创建者将可见性更改为 `org` 或 `public` 时才对其他人可见。

这是框架级原语。每个可拥有的资源免费获得 — 相同的 API、相同的 UI、相同的技能。

## 概念

### 三个可见性级别

- **`private`** — 仅所有者 + 显式共享授权。默认。
- **`org`** — 所有者 + 显式授权 + 同一组织中的任何人（只读）。
- **`public`** — 所有者 + 显式授权 + **任何有链接的人**（只读）。公共文档不会出现在其他用户的列表/侧边栏/搜索结果中 — `accessFilter` 默认排除它们。它们可以通过 id 访问（`resolveAccess` 允许它们），因此直接链接和 SSR 路由如 `/p/:id` 继续工作。如果列表端点确实需要跨用户公共发现（模板画廊等），传递 `accessFilter(table, shares, ctx, minRole, { includePublic: true })`。

可见性是粗粒度的。显式共享授权是细粒度的（按用户或按组织）。

### 共享授权上的角色

- **`viewer`** — 只读。
- **`editor`** — 读取 + 写入。
- **`admin`** — 读取 + 写入 + 管理共享。不替代资源上的唯一 `owner_email`。

### 匿名公共 URL 保持独立

表单"发布"slug、预订链接 slug、任何向未认证用户暴露 URL 的功能 — 这些是不同的轴，不由共享系统控制。将它们与共享系统并存。

## 使资源可拥有

在你的模板的 `server/db/schema.ts` 中：

```ts
import {
  table,
  text,
  integer,
  now,
  ownableColumns,
  createSharesTable,
} from "@agent-native/core/db/schema";

export const decks = table("decks", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  data: text("data").notNull(),
  createdAt: text("created_at").notNull().default(now()),
  updatedAt: text("updated_at").notNull().default(now()),
  ...ownableColumns(), // 添加 owner_email, org_id, visibility
});

export const deckShares = createSharesTable("deck_shares");
```

然后在 **`server/db/index.ts`** 中注册（不是 schema 文件 — 保持 schema 文件不含 `getDb` 闭包并避免循环导入）：

```ts
// server/db/index.ts
import * as schema from "./schema.js";
import { createGetDb } from "@agent-native/core/db";
import { registerShareableResource } from "@agent-native/core/sharing";

export const getDb = createGetDb(schema);
export { schema };

registerShareableResource({
  type: "deck",
  resourceTable: schema.decks,
  sharesTable: schema.deckShares,
  displayName: "Deck",
  titleColumn: "title",
  getResourcePath: (deck) => `/deck/${deck.id}`,
  getDb,
});
```

`type` 字符串是 UI 和 action 使用的稳定 id。`getDb` 是必需的 — 框架级共享 action 使用它来访问你的模板的 DB。

### 限制公共可见性和跨组织用户共享

某些资源不应被任意已认证用户即使有链接也能访问，也不应共享给组织外的 email。两个可选的注册标志锁定这些轴：

```ts
registerShareableResource({
  type: "extension",
  // ...
  allowPublic: false, // 在共享对话框中隐藏"Public"并在服务端拒绝
  requireOrgMemberForUserShares: true, // 用户共享必须针对组织成员或待定邀请者
});
```

- **`allowPublic: false`** — `set-resource-visibility('public')` 抛出 `ForbiddenError`，`accessFilter` / `resolveAccess` 将任何存储的 `'public'` 行视为私有（对坏数据的纵深防御），共享弹出框隐藏"Public"选项。`list-resource-shares` 返回 `policy.allowPublic: false` 以便 UI 遵循服务器。
- **`requireOrgMemberForUserShares: true`** — `share-resource` 在 `org_members` 和 `org_invitations`（待定）中查找资源的 `orgId` 的 `principalId`，并拒绝向其他任何人的用户共享。同一标志还将 `principalType: "org"` 共享固定到资源自己的组织 — 共享给*不同*的组织会让该组织的成员在查看者的认证上下文中运行代码（与公共扩展相同的威胁模型）。（标志名称为了向后兼容而保留；将其视为"同时锁定用户和组织共享到资源的组织"。）

对于以*查看者*凭据执行代码或暴露特权数据的资源，两者都使用。扩展两者都设置了：扩展的 HTML 以查看者身份调用 action / SQL / 注入密钥的代理，因此公共或跨组织共享的扩展会让陌生人以他人的认证上下文运行任意代码。`scripts/guard-extension-no-public.mjs`（CI + `pnpm prep`）静态强制扩展注册保持两个标志设置。

默认值匹配历史行为：`allowPublic: true`、`requireOrgMemberForUserShares: false`。未设置标志的资源与以前一样工作。

## 过滤列表/读取查询

```ts
import { accessFilter } from "@agent-native/core/sharing";

const rows = await db
  .select()
  .from(schema.decks)
  .where(accessFilter(schema.decks, schema.deckShares));
```

`accessFilter` 允许当前用户拥有的行、已被共享的行、或用户可以通过 `org` 可见性访问的行。`public` 行默认不被允许 — 见上方可见性部分了解原因和如何选择加入。

## 保护写入 action

```ts
import { assertAccess } from "@agent-native/core/sharing";

export default defineAction({
  schema: z.object({ id: z.string(), title: z.string() }),
  run: async (args) => {
    await assertAccess("deck", args.id, "editor");
    // ...继续
  },
});
```

对于删除 action 使用 `"admin"`（或折叠 `"owner"` 以要求真正的所有者）。

## 创建 action 必须设置所有者

插入新行时，从请求上下文填充 `ownerEmail` 和 `orgId`：

```ts
import {
  getRequestUserEmail,
  getRequestOrgId,
} from "@agent-native/core/server/request-context";

const ownerEmail = getRequestUserEmail();
// 切勿回退到如 "local@localhost" 的哨兵 — 那会将每个
// 未认证写入汇集到一个共享租户中（见 2026-04-29 泄露和
// guard-no-localhost-fallback）。当没有会话时抛出 / 401。
if (!ownerEmail) throw new Error("Not authenticated");

await db.insert(schema.decks).values({
  id: nanoid(),
  title,
  data,
  ownerEmail,
  orgId: getRequestOrgId(),
  // visibility 默认为 'private'
  // ...
});
```

## 放入共享 UI

```tsx
import { ShareButton } from "@agent-native/core/client";

// 在资源的头部/工具栏中：
<ShareButton
  resourceType="deck"
  resourceId={deck.id}
  resourceTitle={deck.title}
/>
```

对于列表视图，在每个资源旁边显示 `<VisibilityBadge visibility={row.visibility} />`。

## 到处可用的 Action

框架在每个模板中自动挂载这些 action — 无需按模板样板：

| Action                      | 参数                                                                           | 用途                                   |
| --------------------------- | ------------------------------------------------------------------------------ | -------------------------------------- |
| `share-resource`            | `resourceType, resourceId, principalType, principalId, role, notify?, resourceUrl?` | 授予用户或组织访问权限。`notify` 对个人用户共享默认为 true；`resourceUrl` 可提供通知邮件中使用的直接应用链接。 |
| `unshare-resource`          | `resourceType, resourceId, principalType, principalId`                         | 撤销访问。                             |
| `list-resource-shares`      | `resourceType, resourceId`                                                     | 当前可见性 + 所有共享授权。            |
| `set-resource-visibility`   | `resourceType, resourceId, visibility`                                         | 更改为 `private` / `org` / `public`。  |

Agent 和 UI 使用相同的 action。Agent 将它们作为工具调用；UI 代码应使用 `ShareButton` / `ShareDialog` 或 action 客户端 hook，而非手写路由调用。

## 现有表的迁移模式

在改造现有资源表时：

1. 添加 `owner_email`、`org_id`、`visibility` 列（默认值 `'local@localhost'`、`NULL`、`'private'`）。
2. 从任何先前的创建者记录回填 `owner_email`；否则保留默认值。
3. 添加伴随的 `{type}_shares` 表。
4. 通过 `registerShareableResource` 注册。
5. 更新列表/读取 action 以使用 `accessFilter`。
6. 更新更新/删除 action 以使用正确角色的 `assertAccess`。
7. 在资源头部添加 `<ShareButton>`。
8. 在注册中添加 `getResourcePath`，以便 agent 触发的共享可以发送直接链接的邮件，即使 UI 未提供 `resourceUrl`。

## 选择退出的模板

共享不适用于：

- **个人数据应用**（mail、macros）— 按设计是用户范围的。
- **外部真相来源应用**（issues → Jira、recruiting → Greenhouse）— ACL 存在于上游系统中。
- **演示/样板**（starter）— 没有资源。

对于这些，在模板的 `AGENTS.md` 中添加简短说明解释原因。

## 分析（后续）

`analytics` 模板中的仪表板和分析目前存在于设置 KV 存储中（`u:<email>:dashboard-*` 键），而非 SQL。共享需要将它们迁移到 SQL 表（然后应用此技能）或用并行共享覆盖扩展设置存储。这是一个跟踪中的后续 — 见 analytics 模板的 `AGENTS.md`。

## 调试

- action 中的 `ForbiddenError` 意味着当前用户不是所有者 / 未被共享 / 无法达到角色要求。
- 如果 agent 看不到它刚创建的资源，检查插入是否确实从请求上下文设置了 `owner_email`。
- 如果共享在 UI 中未生效，确认模板的 `list-*` action 使用了 `accessFilter` — 共享行存在但还没有东西在读取它们。