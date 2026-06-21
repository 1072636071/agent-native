# {{APP_NAME}} — Agent 指南

本应用遵循 agent-native 核心理念：agent 和 UI 是平等的伙伴。UI 能做的一切，agent 都可以通过 action 完成。Agent 始终通过 application state 了解你正在查看的内容。使用下面的框架文档查找获取版本匹配的 Agent Native 文档。

这是一个 **@agent-native/core** 应用——AI agent 和 UI 通过 SQL 数据库共享状态，使用 SSE 进行进程内实时同步，轮询作为跨进程/无服务器的回退。

### 核心原则

1. **共享 SQL 数据库** -- 所有应用状态存储在 SQL 中。本地 SQLite 位于 `data/app.db`，是零配置的开发回退；部署的应用需要持久的 `DATABASE_URL`，以便数据在容器/无服务器重启后存活。Turso 是可选的，非必需：Neon、Supabase、Turso/libSQL、纯 Postgres、持久 SQLite、D1 绑定和 Builder.io 管理的环境在部署支持时都是有效的。核心存储：`application_state`、`settings`、`oauth_tokens`、`sessions`、`resources`。
2. **通过正确的框架表面使用 AI** -- 产品工作流通过 `sendToAgentChat()` / `agentChat.submit()` 委托给 agent。使用 `sendToAgentChat({ message, context, submit })` 进行简单的 UI 交接和预填充/审查流程；当 agent 应静默工作而不聚焦侧边栏时，添加 `newTab: true, background: true, openSidebar: false`。仅当 UI 需要与暂存上下文芯片双向同步时，才使用 agent-chat 上下文状态辅助函数（`useAgentChatContext`、`setAgentChatContextItem`、`listAgentChatContext`、`removeAgentChatContextItem`、`clearAgentChatContext`）。对于故意不需要工具、聊天历史或运行状态的罕见服务端文本转换，在 action 内使用 `@agent-native/core/server` 的 `completeText()`，而非直接导入提供商 SDK。
3. **Action 用于应用操作** -- `pnpm action <name>` 分派到 `actions/` 中的可调用 action 文件；`defineAction` 还自动在 `/_agent-native/actions/:name` 暴露这些操作供 UI 使用。不要创建重新导出 action 的自定义 REST 路由。
4. **实时同步保持 UI 最新** -- 数据库写入首先通过 `/_agent-native/events` 流式传输，`/_agent-native/poll` 作为回退。**当你（agent）写入数据时，UI 必须在无需手动刷新的情况下反映更改。** 这是不可协商的。对 action 支持的数据使用 `useActionQuery` / `useActionMutation`（首选）。如果使用原始 `useQuery`，将 `useChangeVersions([<source>, "action"])` 折叠到键中以进行定向刷新。参见 `real-time-sync` 和 `adding-a-feature` 技能。
5. **Agent 可以更新代码** -- Agent 可以直接修改此应用的源代码。
6. **不硬编码密钥或私有数据** -- 永远不要将 API 密钥、令牌、Webhook URL、签名密钥、私有 Builder/内部数据、客户数据或类似凭证的字面量放在源码、文档、测试、固件、提示、截图、application state、action 响应或生成内容中。在示例中使用 secrets/OAuth/运行时配置和明显的占位符。

## 框架文档查找

版本匹配的 Agent Native 文档随 `@agent-native/core` 附带在
`node_modules/@agent-native/core/docs` 中。

- 使用 `pnpm action docs-search --query "<topic>"` 搜索框架文档、打包的 `AGENTS.md` 和代码库技能。
- 使用 `pnpm action docs-search --slug <slug>` 阅读完整页面。从 `actions`、`database`、`context-awareness`、`client`、`automations`、`recurring-jobs`、`a2a-protocol`、`external-agents`、`mcp-protocol`、`sharing`、`security`、`pure-agent-apps` 或 `agent-surfaces` 开始。
- 使用 `pnpm action docs-search --list` 查看所有可用内容。
- 如果 action 运行器不可用，直接阅读 `node_modules/@agent-native/core/docs/AGENTS.md` 并用 `rg` 搜索 `node_modules/@agent-native/core/docs/content/`。

在实现高级 Agent Native 功能之前阅读这些本地包文档。对于应用特定的规则，优先使用本应用的 `AGENTS.md` 和 `.agents/skills/`。

### 数据库代码

- 使用 `@agent-native/core/db/schema` 辅助函数（`table`、`text`、`integer`、`real`、`now`、共享辅助函数）定义表，永远不要使用 `drizzle-orm/sqlite-core` 或 `drizzle-orm/pg-core`。
- 使用 Drizzle 的查询构建器（`db.select`、`db.insert`、`db.update`、`db.delete`）加上 `drizzle-orm` 的可移植操作符（`eq`、`and`、`or`、`inArray`、`desc` 等）进行应用读写。
- 在普通 action、处理器和存储中不要使用原始 SQL。仅在增量迁移、健康检查或最后手段的维护中使用，并保持参数化和方言无关。
- 不要在产品代码中编写仅 SQLite 或仅 Postgres 的语法。同一应用应能在 SQLite、Postgres、libSQL/Turso、D1 和其他支持的 Drizzle 后端上运行。

### 认证

每个环境中的认证都是真实的 Better Auth——**没有开发绕过**：

- **开发环境**：与生产环境相同的 Better Auth 流程。首次运行时，框架自动创建一个临时开发账户并登录（这样你不会被卡在登录墙外）。`getSession()` 返回已登录的用户或 `null`——它永远不会返回 `local@localhost` 哨兵值。
- **生产环境**：Better Auth 支持 email/password + 社交提供商；内置组织。

服务端使用 `getSession(event)`，客户端使用 `useSession()`。当没有会话时，**抛出异常或返回 401**——永远不要回退到 `local@localhost`（那会将所有未认证请求合并到一个共享租户中）。

## 资源

资源是 SQL 支持的持久文件，用于笔记、学习记录和上下文。

**在每次对话开始时，阅读这些资源（工作区、共享和个人范围，视情况而定）：**

1. **`AGENTS.md`** -- 继承的工作区默认值、应用/团队指令和用户特定的上下文。
2. **`LEARNINGS.md`** -- 用户偏好、纠正和模式。阅读个人和共享范围。

**当你学到重要内容时更新 `LEARNINGS.md`。** 内置应用聊天 agent 使用带 `action` 参数的 `resources` 工具。外部 CLI agent 可以使用等效的 `pnpm action resource-*` 命令。

| 内置 agent 工具调用                                                | CLI 等效命令                                                                         | 用途                 |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ----------------------- |
| 带有 `action: "read"`、`path`、可选 `scope` 的 `resources`             | `pnpm action resource-read --path <path> [--scope personal\|shared]`                   | 读取资源         |
| 带有 `action: "write"`、`path`、`content`、可选 `scope` 的 `resources` | `pnpm action resource-write --path <path> --content <text> [--scope personal\|shared]` | 写入/更新资源 |
| 带有 `action: "list"`、可选 `prefix`/`scope` 的 `resources`            | `pnpm action resource-list [--prefix <path>] [--scope personal\|shared\|all]`          | 列出资源          |
| 带有 `action: "delete"`、`path`、可选 `scope` 的 `resources`           | `pnpm action resource-delete --path <path> [--scope personal\|shared]`                 | 删除资源       |

## Application State

临时 UI 状态存储在 SQL `application_state` 表中，通过 `@agent-native/core/application-state` 的 `readAppState(key)` 和 `writeAppState(key, value)` 访问。

| 状态键    | 用途                                   | 方向                  |
| ------------ | ----------------------------------------- | -------------------------- |
| `navigation` | 当前视图                              | UI -> Agent（只读）    |
| `navigate`   | 导航命令（一次性，自动删除） | Agent -> UI（自动删除） |

`navigation` 键在路由变化时由 UI 写入。`navigate` 键是一次性命令：agent 写入它，UI 读取并执行导航，然后删除它。

UI 代码应使用 `@agent-native/core/client` 的 `useAgentRouteState` / `useSemanticNavigationState` 进行导航同步，而非手写的 `fetch("/_agent-native/application-state/...")` 调用。将可共享的过滤器保留在 URL 查询参数中；框架将它们暴露为 `<current-url>`，内置 agent 可以用 `set-search-params` 更新它们。

## 挂载的工作区路由

此应用可能在工作区中挂载在 `/<app-id>` 下。在应用源码内，React Router 路径是应用本地的：使用 `<Link to="/review">` 和 `navigate("/review")`，而非 `/<app-id>/review`。工作区网关和 `APP_BASE_PATH` 在浏览器中添加挂载前缀；在 React Router 链接内硬编码它会导致 URL 重复，如 `/<app-id>/<app-id>/review`。

对于 React Router 外的原始路径，使用核心辅助函数：`appPath()` 用于静态资产或普通 href，`appApiPath()` 用于合法的仅路由 `/api/*` 端点，`agentNativePath()` 用于 `/_agent-native/*`。不要使用 `appApiPath()` 构建 action 支持的 CRUD 包装器。

## Agent 操作

**在编辑任何内容之前，始终了解用户当前正在查看什么。** 用户的视图可能在对话过程中改变。过期的 ID 会导致编辑错误的记录。

### 如果你是内置 agent-chat agent

`<current-screen>` 块会自动注入到每条用户消息中，包含当前视图、ID 和选中的项目。你可以在一个轮次的第一步操作中信任它，而无需调用 `view-screen`。如果用户在多次工具调用后说"这个"或"现在做 X"，用户可能已经导航——再次调用 `view-screen` 获取新快照。

### 如果你是外部 CLI agent（Claude Code、Codex、Cursor 等）

你不会获得自动注入的屏幕状态。**在每个任务开始时和任何编辑之前调用 `pnpm action view-screen`**，这样你操作的是用户当前看到的 ID，而非之前打开的内容。不要依赖之前轮次缓存的上下文。

### Action

在转向 SQL 或自定义路由之前，使用现有的领域 action。如果缺少某个能力，添加或扩展 `defineAction`，使 agent 和 UI 共享同一操作。不要创建仅调用、重新打包或代理 action 的 `/api/*` 路由。

| Action        | 参数                                                                           | 用途                                                                                 |
| ------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `view-screen` |                                                                                | 查看当前 UI 状态                                                                    |
| `navigate`    | `--view <name>` 或 `--path <url>`                                              | 导航 UI                                                                         |
| `hello`       | `[--name <name>]`                                                              | 示例脚本                                                                          |
| `db-schema`   |                                                                                | 显示所有表、列、类型                                                         |
| `db-query`    | `--sql "SELECT ..."`                                                           | 运行 SELECT 查询                                                                      |
| `db-exec`     | `--sql "UPDATE ..."`                                                           | 最后手段的临时维护；优先使用领域 action 和 Drizzle 代码处理产品工作 |
| `db-patch`    | `--table <t> --column <c> --where "<clause>" --find "<old>" --replace "<new>"` | 对大型文本列进行精确搜索/替换——发送差异而非完整值 |

**对于一次性维护，选择正确的 SQL 工具：**

- 首先使用领域 action。它们验证输入、强制访问并刷新 UI。
- 仅当没有领域 action 且你需要小的临时更改时使用 `db-exec UPDATE`。
- 当你只需要调整**大型**文本/JSON列（文档、幻灯片 HTML、仪表板/表单 JSON）的小片段时使用 `db-patch`。它通过发送 `{find, replace}` 而非重新传输整列来节省 token。每次调用精确目标一行——用主键缩小 `--where` 范围。支持 `--edits '[{find,replace},...]'` 进行批量编辑和 `--all` 进行替换所有出现。
- 如果存在模板特定的 action（如 `edit-document`、`update-slide`），优先使用它——它们还会向任何打开的协同编辑器推送实时更新。
- **数据库管理（仅开发环境）：** 在开发环境中，`db-admin-query` / `db-admin-mutate` / `db-admin-rows` / `db-admin-tables` / `db-admin-schema` 提供对任何表的**无范围、全数据库**访问——包括框架表和没有 `owner_email`/`org_id` 的表。对于数据库管理工作和任何非所有者范围的表，优先使用这些而非 `db-exec`/`db-query`：`db-exec`/`db-query` 自动限定为当前用户，在无范围表上返回 **0 行**。这些镜像应用内的数据库管理 UI，因此提示和 UI 做相同的事情。

## 技能

`.agents/skills/` 中的技能为每个架构规则提供详细指导。在进行更改之前阅读它们。

| 技能                 | 何时阅读                                                                      |
| --------------------- | --------------------------------------------------------------------------------- |
| `agent-native-docs`   | 在使用高级 Agent Native 框架 API 或生成的应用功能之前       |
| `adding-a-feature`    | **添加任何新功能时首先阅读**——四区域对等检查清单       |
| `real-time-sync`      | 在为 agent 可变的数据连接获取逻辑之前（必须自动刷新） |
| `storing-data`        | 在存储或读取任何应用状态之前                                           |
| `delegate-to-agent`   | 在添加 LLM 调用或 AI 委托之前                                          |
| `actions`             | 在创建或修改 action 之前                                              |
| `self-modifying-code` | 在编辑源码、组件或样式之前                                      |
| `capture-learnings`   | 在记录用户偏好或纠正之前                                  |
| `frontend-design`     | 在构建或重新样式化任何 UI 组件、页面或布局之前                    |
| `shadcn-ui`           | 在添加、更新或调试 shadcn/ui 组件之前                        |
| `agent-engines`       | 在切换 LLM 提供商或注册自定义引擎之前                     |
| `notifications`       | 在向用户显示警报/进度或添加渠道之前                   |
| `progress`            | 在运行任何超过几秒的任务之前                        |

## 添加功能时

**首先阅读 `adding-a-feature` 技能**——它有完整的四区域检查清单（UI / Action / Skills / App-State）。快速摘要：

1. **添加导航状态条目** — 扩展 `app/hooks/use-navigation-state.ts`，用 `useAgentRouteState` 跟踪新路由
2. **增强 view-screen** — 使 view-screen 脚本返回新视图的相关上下文
3. **创建领域 action** — 在 `actions/` 中为新数据模型的 CRUD 操作添加 action；不要围绕这些 action 创建 REST 包装器
4. **为自动刷新连接 UI** — 对普通 CRUD 使用 `useActionQuery` / `useActionMutation`。如果原始 `useQuery` 不可避免，将 `useChangeVersions([<source>, "action"])` 折叠到其键中并带 `placeholderData`。当 agent 变更此数据时，UI 必须在无需手动刷新的情况下反映更改。参见 `real-time-sync` 技能。
5. **创建领域技能** — 添加 `.agents/skills/<feature>/SKILL.md` 记录数据模型、存储模式和 agent 操作
6. **更新此 AGENTS.md** — 添加新的 action、状态键和常见任务

---

有关代码编辑和开发指导，请阅读 `DEVELOPING_zh.md`。