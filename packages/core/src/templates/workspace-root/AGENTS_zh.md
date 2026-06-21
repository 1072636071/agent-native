# {{APP_TITLE}} 工作区指令

这些指令适用于工作区根。应用特定的行为应放在 `apps/<app>/AGENTS.md` 中；共享的跨应用行为应放在 `packages/shared/AGENTS.md` 或 `packages/shared/.agents/skills/` 中。根 `.agents/skills` 路径指向共享包的技能，以便本地编码代理可以从根发现相同的工作区范围指导。

## 框架文档查找

版本匹配的 Agent Native 文档随 `@agent-native/core` 一起安装在 `node_modules/@agent-native/core/docs` 中。

- 从应用目录，使用 `pnpm action docs-search --query "<topic>"`、`pnpm action docs-search --slug <slug>` 或 `pnpm action docs-search --list`。
- 从工作区根，读取 `node_modules/@agent-native/core/docs/AGENTS.md` 并使用 `rg` 直接搜索 `node_modules/@agent-native/core/docs/content/`。
- 对于高级工作区功能，从 `workspace`、`multi-app-workspace`、`a2a-protocol`、`pure-agent-apps`、`automations`、`recurring-jobs`、`external-agents`、`mcp-protocol`、`sharing` 和 `security` 开始。

使用包文档了解框架 API，使用 `packages/shared/AGENTS.md` 加 `packages/shared/.agents/skills/` 了解工作区特定的约定。

## 核心代理规则

- 所有 AI/LLM 行为都通过应用的代理聊天进行。UI 和服务器代码不得直接调用模型提供商、AI SDK `generateText()` / `streamText()` 或其他内联 LLM API。使用 `sendToAgentChat()` 进行本地应用-代理工作，包括隐藏的 `context` 和 `submit: false` 预填充/审查流程。仅当 UI 需要与暂存上下文芯片双向同步时，才使用 `useAgentChatContext`、`setAgentChatContextItem`、`listAgentChatContext`、`removeAgentChatContextItem` 和 `clearAgentChatContext`。在构建代理驱动的 UI 或"AI"功能之前，阅读 `packages/shared/.agents/skills/delegate-to-agent/SKILL.md`。

## 工作区资源

- 工作区文件视图用于用户创作或用户请求的资源，他们有意添加、编辑或管理这些资源。
- 代理可以使用隐藏的 `agent_scratch` 资源存放临时工作笔记、脚本、任务计划或中间输出。默认保持这些草稿文件隐藏，仅当用户明确要求保留或管理文件时才提升它们。
- 持久化的指令、技能、作业、记忆、自定义代理和用户明确要求保存的文件属于正常的工作区可见性。
- 运行时可编辑的全局资源从 Dispatch Resources 管理。使用 `AGENTS.md` 或 `instructions/<slug>.md` 用于始终启用的护栏，`skills/<slug>/SKILL.md` 用于工作区技能，`context/<slug>.md` 用于角色/定位/消息/公司事实/品牌指南，`agents/<slug>.md` 用于自定义代理配置。
- 当每个工作区应用都应继承 Dispatch 资源时，将其设置为所有应用。仅对不应为全局的资源使用选定应用授权。

## 工作区范围

- 保持根更改集中在工作区编排、共享配置、部署设置和 monorepo 工具上。
- 将应用路由、actions、服务器插件和应用状态保留在相关的 `apps/<app>` 目录内，除非多个应用需要相同的行为。
- 仅在至少两个应用需要时，才将可重用代码放在 `packages/shared` 中。
- 永远不要将实时凭据、API 密钥、token、webhook URL、签名密钥、个人邮箱地址、客户数据、私有 Builder/内部数据或公司特定的占位符值复制到源文件、文档、提示、固件、应用状态、action 响应或生成的应用内容中。使用 secrets/OAuth/运行时配置和明显的占位符示例。

## 新工作区应用

- 当用户从 Dispatch 聊天或通过在 Slack 中标记 `@agent-native` 请求创建、构建、制作、搭建或生成一个"代理"时，先分类请求。简单的 Dispatch 原生行为如提醒、摘要、监控、路由规则、保存的指令或循环工作流可以留在 Dispatch 中作为循环作业/资源/目的地。需要自己的 UI、数据模型、actions、集成或领域工作流的健壮独特产品或队友应成为 `apps/<app-id>` 下的独立工作区应用，挂载在 `/<app-id>`。
- 当用户明确要求新应用或工作区应用时，创建独立的工作区应用。
- 对于可组合的工作流，优先使用许多单任务的无头或小 UI 应用，通过 A2A 发现并调用兄弟应用。在设计跨应用编排之前，阅读 `packages/shared/.agents/skills/composable-mini-apps/SKILL.md`。
- Dispatch vault 访问默认是工作区范围的：每个保存的 vault 密钥对每个工作区应用都可用。仅当 Dispatch 的 vault 访问设置切换到手动模式时，才创建或请求按应用的 vault 授权。
- 不要通过向 `apps/chat` 或其他现有应用添加路由、页面、组件或文件来满足新应用请求，除非用户明确要求修改该现有应用。
- 将 Mail、Calendar、Analytics、Brain、Assets 和 Dispatch 等第一方应用视为现有的托管/连接邻居，可通过链接和 A2A/默认连接代理访问。例如，Mail、Calendar、Analytics、Brain 和 Assets 已存在于 `https://mail.agent-native.com`、`https://calendar.agent-native.com`、`https://analytics.agent-native.com`、`https://brain.agent-native.com` 和 `https://assets.agent-native.com`。
- 如果新应用需要使用 Mail、Calendar、Analytics、Brain、Assets 或类似的第一方数据/代理，仅构建真正新的工作流并委托/链接到那些现有应用。不要在新应用内创建包装应用、子应用、嵌套模板副本或克隆的 Mail/Calendar/Analytics/Brain/Assets 实现仅为了提供访问。
- 仅当用户明确要求该应用的自定义分叉/副本时，才创建第一方应用副本。否则优先使用托管/共享应用，以便基础模板改进继续自动流动。
- 工作区应用从 `apps/<app-id>/package.json` 发现。没有单独的工作区应用注册表需要编辑以让 Dispatch 列出该应用。
- 始终在生成的应用的 `apps/<app-id>/package.json` 中保存简洁的、人类可读的 `description`。Dispatch 列表和 A2A 连接代理上下文使用应用名称加此描述，以便其他代理了解该应用的功能。Dispatch 用户稍后可以从应用页面编辑显示的名称/描述，而无需更改源代码。
- 所有兄弟工作区应用默认可通过 A2A 通过 `call-agent` 访问。代理在提示上下文中接收可用应用名称和描述的紧凑列表；仅在需要更多细节时使用工具搜索或应用特定的 actions。
- 使用相对工作区链接如 `/<app-id>`。永远不要在应用卡片、指令、重定向或导航中硬编码 `localhost`、`127.0.0.1`、`8080`、`8100` 或任何开发端口；活动的工作区网关/浏览器源拥有端口。
- React Router 应用必须通过 `appBasePath()` 在 `app/entry.client.tsx` 中保留 `APP_BASE_PATH` / `VITE_APP_BASE_PATH`，以便应用在挂载于 `/<app-id>` 时正确水合。
- 使用框架/模板 UI 栈作为标准 UI：shadcn/ui 组件和 `@tabler/icons-react`。不要添加 `lucide-react` 或其他图标库。在添加、更新或调试 shadcn 组件之前，阅读 `packages/shared/.agents/skills/shadcn-ui/SKILL.md`。
- 正常的应用数据必须通过 actions 流动。对于代理可以执行的 CRUD，在 `actions/` 中创建 `defineAction` 文件，用 `http: { method: "GET" }` 标记读取，并使用 `useActionQuery` / `useActionMutation` 从 React 调用。不要为相同数据在 `/api/*` 下添加重复的 JSON CRUD 路由，除非路由用于上传、流式传输、webhook、OAuth 或其他仅路由关注点。不要添加主要工作是包装、代理或重新导出 action 的路由；action 端点已存在于 `/_agent-native/actions/:name`。基于 action 的 UI 使代理创建或代理编辑的记录无需手动刷新即可出现。
- 应用数据库代码必须与提供商无关。使用 `@agent-native/core/db/schema` 辅助函数定义模式，使用 Drizzle 的查询构建器和可移植的 `drizzle-orm` 操作符编写应用读/写。不要在应用模板中从 `drizzle-orm/sqlite-core` 或 `drizzle-orm/pg-core` 导入。将原始 SQL 保留用于增量迁移、健康检查或仔细范围的维护，永远不要编写仅 SQLite 或仅 Postgres 的产品代码。
- 在本地开发中，从工作区根使用 `pnpm exec agent-native create <app-id> --template=<template>` 搭建应用。在生产中，Dispatch 将请求发送到 Builder 分支创建；Builder 分支仍应创建独立的工作区应用，而不是修补 chat。本地工作区网关自动检测新应用目录并在首次访问时延迟启动每个应用服务器。
- 使用 chat 模板时，仅将其视为脚手架。完成的应用必须以请求的应用品牌化，拥有自己的主屏幕、导航、包元数据、清单和领域工作流。不要在 chat 派生的应用中留下可见的 `Chat`、`Starter`、`Blank app`、`Start building` 或 `New app` UI。

## 工作区身份

使用工作区根 `.env` 进行共享身份和跨应用信任设置：

- `WORKSPACE_ORG_NAME` — 人类可读的组织名称。
- `WORKSPACE_ORG_DOMAIN` — 工作区拥有的裸域名，不含协议或路径。
- `WORKSPACE_OWNER_EMAIL` — 用于修复和集成默认值的初始所有者/管理员邮箱。
- `A2A_SECRET` — 跨应用 A2A 签名的共享密钥。使用 `openssl rand -hex 32` 或 `pnpm repair:workspace-org -- --name ...` 生成。

`DISPATCH_DEFAULT_OWNER_EMAIL` 是可选的。仅在你信任的、单工作区部署中设置，其中未关联的集成请求应以工作区所有者身份运行，并优先使用与 `WORKSPACE_OWNER_EMAIL` 相同的值。

## 组织修复

当被要求修复工作区组织或 A2A 配置时：

1. 首先读取 `.env`。不要从旧示例推断组织、域名、所有者邮箱或密钥。
2. 运行 `pnpm repair:workspace-org -- --name "<org>" --domain example.com --owner-email owner@example.com` 来创建或更新通用工作区身份值。
3. 优先使用应用的组织设置 UI 或认证的组织路由来更改 `allowed_domain` 和 `a2a_secret`。
4. 如果无法避免直接 SQL，首先检查实时模式并仅使用参数化的 `INSERT` 或 `UPDATE` 语句。确保目标组织有 `organizations.name`、`organizations.allowed_domain`、`organizations.a2a_secret`，以及 `WORKSPACE_OWNER_EMAIL` 的 `org_members` 所有者行。
5. 永远不要使用 `DROP`、`TRUNCATE`、破坏性的 `ALTER` 或未限定范围的 `DELETE`。不要在未更新信任它的每个应用的情况下轮换 `A2A_SECRET`。