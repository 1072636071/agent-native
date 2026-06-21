---
name: server-plugins
description: >-
  框架服务器插件和 `/_agent-native/` 路由命名空间。在添加自定义服务器插件、决定是创建 `/api/` 路由还是 action、或调试自动挂载的框架路由时使用。
metadata:
  internal: true
---

# 服务器插件和框架路由

## 默认插件（自动挂载）

当你的应用在 `server/plugins/` 中没有自定义版本时，五个默认插件自动挂载：

| 插件          | 默认行为                                          | 何时自定义                                  |
| ------------- | ------------------------------------------------- | ------------------------------------------- |
| `agent-chat`  | Agent 聊天端点                                    | 自定义 `mentionProviders` 或 `systemPrompt` |
| `auth`        | 认证中间件                                        | 自定义 `publicPaths` 或 Google OAuth 配置   |
| `core-routes` | `/_agent-native/poll`、`/_agent-native/ping` 等   | 自定义 `envKeys` 或 `sseRoute`              |
| `resources`   | 资源 CRUD                                         | 很少                                        |
| `terminal`    | 终端模拟器                                        | 很少                                        |

**仅为你需要自定义的插件创建插件文件。** 让默认插件自动挂载。

## 框架路由命名空间：`/_agent-native/`

所有框架级路由都在 `/_agent-native/` 下，以避免与模板特定的 `/api/*` 路由冲突。

### 硬性规则

- **所有框架路由都在 `/_agent-native/` 下。**
- 模板仅拥有 `/api/*`，用于仅路由的领域关注点，如上传、流式传输、webhook、OAuth 回调或非 JSON 协议。
- 切勿将框架路由放在 `/api/` 下。
- 切勿将模板路由放在 `/_agent-native/` 下 — 该命名空间是保留的。
- 切勿创建仅包装、代理或重导出 action 的 `/api/*` 路由。使用现有的 `/_agent-native/actions/:name` 端点或 React action hook。

### 自动挂载的框架路由

| 路由                                                           | 用途                                   |
| -------------------------------------------------------------- | -------------------------------------- |
| `GET /_agent-native/poll`                                     | 用于 DB 更改检测的轮询端点            |
| `GET /_agent-native/events`                                   | 用于实时同步的 SSE 端点               |
| `GET /_agent-native/ping`                                     | 健康检查                               |
| `GET/PUT/DELETE /_agent-native/application-state/:key`        | Application state CRUD                 |
| `GET/PUT/DELETE /_agent-native/application-state/compose/:id` | 撰写草稿 CRUD                          |
| `POST /_agent-native/agent-chat`                              | Agent 聊天 SSE 端点                    |
| `GET /_agent-native/agent-chat/mentions`                      | 用于 @提及的搜索                       |
| `GET /_agent-native/env-status`                               | 环境变量配置状态                       |
| `POST /_agent-native/env-vars`                                | 保存环境变量                           |
| `/_agent-native/auth/*`                                       | 认证（登录、会话、登出）              |
| `/_agent-native/google/*`                                     | Google OAuth（回调、auth-url 等）      |
| `/_agent-native/resources/*`                                  | 资源 CRUD                              |
| `/_agent-native/actions/:name`                                | 自动挂载的 action 端点                 |
| `/_agent-native/available-clis`                               | 可用的 CLI 工具                        |
| `/_agent-native/agent-terminal-info`                          | 终端连接信息                           |
| `/_agent-native/collab/*`                                     | 实时协作（见 `real-time-collab`）      |
| `/_agent-native/a2a`                                          | A2A JSON-RPC 端点（见 `a2a-protocol`）|

## Action 优先方法

对于标准 CRUD 和数据操作，在 `actions/` 中使用 `defineAction` — 框架自动将它们作为 HTTP 端点挂载在 `/_agent-native/actions/:name`。仅当 action 无法完成时才创建自定义 `/api/*` 路由：

- 使用 multipart 表单数据的文件上传
- 流式响应
- 来自外部服务的 Webhook
- OAuth 回调

在添加路由之前，检查现有的 action 文件。如果 action 已经编码了业务规则则重用它，或者如果操作应该同时对 agent 和 UI 可用则添加新 action。其实现主要调用 action 的路由通常是错误的抽象。

Nitro Vite 插件通过 `server/routes/` 中基于文件的路由处理 `/api/` 和 `/_agent-native/` 前缀。

## 相关技能

- `actions` — 优先使用 action 而非自定义 `/api/` 路由
- `authentication` — 认证中间件和会话处理
- `portability` — 所有路由使用 H3（不是 Express）