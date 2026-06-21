# 认证

> **规范文档：**
>
> - **面向用户：** [packages/core/docs/content/authentication.md](../packages/core/docs/content/authentication_zh.md) — 文档站点上发布的内容。
> - **框架 agent：** [.agents/skills/authentication/SKILL.md](../.agents/skills/authentication/SKILL_zh.md) — 认证模式、会话、组织、BYOA。
> - **框架 agent：** [.agents/skills/security/SKILL.md](../.agents/skills/security/SKILL_zh.md) — 数据范围化、访问辅助函数、自定义路由。
>
> 本文件是一个薄指针；不要在这里重复细节。本文件的旧版本描述了仅 `ACCESS_TOKEN` 模型，该模型不再匹配框架。如果你发现矛盾，更新上方的规范文档并保持本文件不变。

## 简要说明

Agent-native 默认使用 **Better Auth** — 每个访客在首次访问时创建账户。会话在服务端通过 `getSession(event)` 和客户端通过 `useSession()` 提供。

认证模式：

| 模式                 | 何时使用                                                                         |
| -------------------- | -------------------------------------------------------------------------------- |
| Better Auth          | 默认。Email/密码 + Google / GitHub 社交登录 + 组织。                            |
| `AUTH_MODE=local`    | 单人本地开发。强制 `getSession()` → `{ email: "local@localhost" }`。             |
| `ACCESS_TOKEN(S)`    | 仅用于静态 MCP/连接 bearer 回退；不是浏览器认证。                                |
| `AUTH_DISABLED=true` | 跳过登录/注册；所有请求作为一个共享用户运行（仅限本地开发/预览）。               |
| 自定义 `getSession`  | BYOA — Auth.js、Clerk、Lucia、WorkOS 等。                                       |

完整配置参考、环境变量（`BETTER_AUTH_SECRET`、`GOOGLE_CLIENT_ID/SECRET`、`GITHUB_CLIENT_ID/SECRET`、`OAUTH_STATE_SECRET`、`A2A_SECRET` 等）、BYOA 契约、组织/orgs、带返回 URL 的登录流程和访问控制模式（`ownableColumns`、`accessFilter`、`resolveAccess`、`assertAccess`）请参见上方的规范文档。