---
name: authentication
description: >-
  Agent-Native 应用中的认证工作方式。在接入登录/注册、配置认证模式、设置组织、保护路由或调试会话问题时使用。
metadata:
  internal: true
---

# 认证

## 规则

认证由 **Better Auth** 驱动，采用账户优先设计。每个新用户在首次访问时创建账户。使用 `getSession(event)` 认证自定义路由；action 自动受保护。

## 认证模式

| 模式                                    | 行为                                                                                                                                     |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **开发（默认）**                         | 真正的 Better Auth — 与生产相同的流程。**没有认证绕过**。首次运行时框架自动创建一次性开发账户并登录（凭据打印一次到控制台；使用 `AGENT_NATIVE_DISABLE_AUTO_DEV_ACCOUNT=1` 禁用），因此你不会卡在登录墙后。`getSession()` 返回已登录用户或 `null` — 它永远不会回退到哨兵身份。 |
| **生产（默认）**                         | Better Auth，支持邮箱/密码 + 社交提供商（Google、GitHub）。内置组织支持。                                                                   |
| **`AUTH_MODE=local`**                   | **不是**浏览器认证绕过，也永远不会返回 `local@localhost`。它只影响 CLI/Agent 身份：它让 `pnpm action` / 本地 Agent 循环自动绑定到 `sessions` 表中的单个真实已登录开发用户（参见 `scripts/dev-session.ts`）。浏览器登录不变。 |
| **`AUTH_SKIP_EMAIL_VERIFICATION=1`**    | 真实邮箱/密码账户的 QA/预览逃生舱。注册跳过邮箱验证，不发送注册验证邮件。本地开发/测试默认跳过验证；仅在测试验证本身时设置 `AUTH_SKIP_EMAIL_VERIFICATION=0`。测试账户使用 `+qa` 邮箱。 |
| **`AUTH_DISABLED=true`**                | 完全跳过登录/注册 — 每个请求以 `dev@local.test` 运行。仅用于本地开发、云预览和内部演示；不适用于有真实用户的生产环境。                         |
| **`ACCESS_TOKEN` / `ACCESS_TOKENS`**    | 无法使用 OAuth 的 MCP/连接客户端的静态 Bearer 回退。不是浏览器认证，也不是令牌登录页面。                                                   |
| **自定义**                              | 将你自己的 `getSession` 传递给 `autoMountAuth(app, { getSession })`。                                                                     |

> **永远不要**在应用代码中使用 `local@localhost` 作为回退身份
> （`getRequestUserEmail() ?? "local@localhost"`、`session?.email ?? "local@localhost"`
> 等）。没有开发认证垫片。该模式将每个未认证请求汇集到一个共享租户，导致了 2026-04-29 凭据泄露。
> 当没有会话时，**抛出异常或返回 401** — 永远不要替换为哨兵。由 `scripts/guard-no-localhost-fallback.mjs` 强制执行。

## 远程 MCP OAuth

每个应用的 `/_agent-native/mcp` 端点也是标准的受保护 MCP 资源。支持 OAuth 的主机仅使用远程 MCP URL 连接，接收 `WWW-Authenticate` 质询，发现 `/.well-known/oauth-protected-resource` 和 `/.well-known/oauth-authorization-server`，动态注册公共客户端，并在 `/_agent-native/mcp/oauth/authorize` / `/_agent-native/mcp/oauth/token` 完成授权码 + PKCE。访问令牌绑定到确切 MCP URL 的受众，并携带用户/组织身份以及 `mcp:read`、`mcp:write` 和/或 `mcp:apps`；刷新令牌以哈希存储并轮换。保留 `ACCESS_TOKEN` 和 `pnpm exec agent-native connect` 用于本地 stdio 代理和回退客户端。CLI 默认使用 OAuth 原生的仅 URL 入口用于 Claude Code/Claude Code CLI；当客户端需要显式 Bearer 头时，使用 Connect 页面或 `npx @agent-native/core@latest connect --token <token>`。

## 本地 → 真实账户迁移

从 `local@localhost` 升级到真实账户会保留 SQL 支持的工作区数据。内置迁移移动 `application_state`、用户范围的 `settings`、`oauth_tokens` 以及任何使用 `owner_email` 的模板表。

具有旧版全局设置的模板可以在升级流程期间提供 `POST /api/local-migration` 进行一次性重新归属。

## 组织

组织是**框架管理的**，不是由 Better Auth 的组织插件处理的（该插件有意未注册）。组织数据存在于框架自己的 `organizations`、`org_members` 和 `org_invitations` 表中。每个应用都支持创建组织、邀请成员和基于角色的访问（owner/admin/member）。

活动组织自动流转：`session.orgId` — 由 `getOrgContext` 从 `org_members` 加用户的 `active-org-id` 设置解析（_不是_从 Better Auth 会话字段）— → `AGENT_ORG_ID` → SQL 作用域（参见 `security` 技能）。

**如果你的模板需要组织才能运行**（数据按 `organization_id` 限定作用域，核心功能没有组织无法运行），在 `.env` 中设置 `AUTO_CREATE_DEFAULT_ORG=1`。框架将在首次登录时，当没有成员资格存在时，自动创建默认组织（以用户命名）。这发生在 `getOrgContext` 内部 — 无需模板集成。

作为安全网，还要用 `@agent-native/core/client/org` 的 `<RequireActiveOrg>` 包裹你的应用外壳。如果自动创建失败或账户早于它，它会用"创建你的组织"面板（以及待处理邀请的接受 CTA）阻止被包裹的区域。将其放在 Agent 侧边栏**内部**，这样设置检查清单、聊天和 CLI 在设置期间仍然可用。

## A2A 身份

在所有需要互相验证身份的应用上设置 `A2A_SECRET`（相同值）。

- 出站 A2A 调用使用 JWT 签名
- 入站调用通过加密验证
- 没有 `A2A_SECRET`，A2A 调用未认证（本地开发可以）

## 跨应用 SSO（Dispatch 身份中心）

每个托管的 `*.agent-native.com` 应用都有**自己的用户存储**，因此"一次登录"是身份联邦，不是共享 Cookie。**Dispatch 是身份权威。**

- **按应用通过一个环境变量选择加入：** 设置 `AGENT_NATIVE_IDENTITY_HUB_URL=https://dispatch.agent-native.com`，应用显示"使用 Agent-Native 登录"选项。**未设置 = 零行为变更** — 整个路径处于休眠状态。随时可逆。
- **流程：** 应用 → `GET <hub>/_agent-native/identity/authorize?app=&redirect_uri=&state=` → 用户在 Dispatch 登录 → 302 回调，携带短期（`≤5分钟`）`A2A_SECRET` 签名的身份 JWT（`sub`/`email`/`name`/`org_domain`/`scope:"identity"`）。严格的 `redirect_uri` 允许列表（`*.agent-native.com` + localhost）。应用验证令牌，**严格通过已验证邮箱 JIT 关联**（现有相同邮箱用户 → 不变复用；新邮箱 → 创建），然后铸造正常的本地会话。
- **不变量（不要破坏）：** 身份行只被**添加** — 永远不被修改、重命名或删除。启用 SSO 会登出用户，但他们总是重新登录到**相同的邮箱匹配账户，数据完好**。邮箱是唯一跨越信任边界的东西；应用永远不信任来自网络的用户 ID、角色或组织。
- **金丝雀发布：** 在所有地方未设置环境变量部署（无操作） → 仅在**一个**应用（mail）上设置 → 验证（登出 → SSO → Dispatch → 回到相同的既有账户，数据完好，直接登录仍然有效） → 逐应用扩展 → 回滚 = 在该应用的部署上取消设置环境变量（即时，无数据变更）。

完整运行手册 + 流程详情：[跨应用 SSO 文档](/docs/cross-app-sso)。

## Builder 浏览器访问

应用可以通过 `cli-auth` 流程连接到 Builder，并在 `.env` 中持久化共享浏览器凭据。Agent 然后使用内置的 `get-browser-connection` 工具通过 AI Services 配置真实的浏览器会话。

## 保护自定义路由

Action 自动受保护。不要为正常 CRUD、数据查询或 action 支持的操作创建自定义 `/api/` 路由；使用 `defineAction` 和自动挂载的 action 端点。如果仅路由关注点强制使用自定义路由：

```ts
import { getSession } from "@agent-native/core/server";

export default defineEventHandler(async (event) => {
  const session = await getSession(event);
  if (!session) throw createError({ statusCode: 401 });
  // ...
});
```

永远不要创建修改数据的未保护路由。

## 从公共页面登录

对于需要匿名查看者登录并返回原位的公共页面（分享链接、嵌入、营销页面），通过框架的登录入口导航——永远不要自己实现：

```ts
const ret = window.location.pathname + window.location.search;
window.location.href =
  "/_agent-native/sign-in?return=" + encodeURIComponent(ret);
```

成功登录后（令牌 / 邮箱密码 / Google OAuth），框架 302 到 `return`。路径通过 URL 解析器验证为同源 — 开放重定向/头注入输入回退到 `/`。

书签的私有路径在请求**到达服务器时**已经可以工作 — 认证守卫在请求的 URL 提供登录页面，登录后重新加载将用户返回那里。

## 门控应用外壳（避免登出无限旋转）

服务端认证守卫只保护实际到达 Nitro 函数的请求。静态提供的 / CDN 缓存的 SPA 外壳，或会话过期后进行的客户端（React Router）导航，永远不会重新触及守卫 — 因此应用以**无会话**启动，每个数据查询 401，UI 永远卡在加载状态。仅服务端保护不够；也要在客户端门控。

对于完全私有的应用（每个页面都需要认证，如 mail），用框架的 `RequireSession` 包裹路由外壳。它在客户端解析会话，将登出的访问者重定向到 `/_agent-native/sign-in?return=…`，而不是旋转：

```tsx
import { AppProviders, RequireSession } from "@agent-native/core/client";

<AppProviders queryClient={queryClient}>
  <RequireSession bypass={isMcpEmbedSurface()}>
    <AppLayout>
      <Outlet />
    </AppLayout>
  </RequireSession>
</AppProviders>;
```

- 将其放在 `AppProviders` **内部**（这样加载回退有主题）和布局/outlet **周围** — 也围绕任何始终挂载的效果（轮询、自动化触发器），这样它们不会为登出访问者触发 401。
- 为通过其他机制认证的表面（携带自己令牌的嵌入/弹出 iframe）传递 `bypass`，这样它们永远不会被弹到登录。
- 有公共/匿名路由（分享页面）的应用**不能**包裹整个应用 — 仅门控私有子树，或使用 `redirect={false}` + `signedOut` props 渲染内联行动号召而不是重定向。

## 相关技能

- `security` — 数据作用域、SQL 注入、密钥
- `actions` — 由认证守卫自动保护
- [跨应用 SSO 文档](/docs/cross-app-sso) — Dispatch 身份中心、联邦流程、金丝雀运行手册