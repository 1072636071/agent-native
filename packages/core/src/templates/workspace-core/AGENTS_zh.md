# {{APP_TITLE}} 工作区指令

这些指令适用于 {{APP_TITLE}} 工作区中的每个应用。仅在此处保留应跨所有应用共享的规则。应用特定的行为应放在该应用自己的 `AGENTS.md` 或 `.agents/skills/` 目录中。

## 框架文档查找

版本匹配的 Agent Native 文档随 `@agent-native/core` 一起安装在 `node_modules/@agent-native/core/docs` 中。

- 从应用目录，使用 `pnpm action docs-search --query "<topic>"`、`pnpm action docs-search --slug <slug>` 或 `pnpm action docs-search --list`。
- 如果 action 运行器不可用，读取 `node_modules/@agent-native/core/docs/AGENTS.md` 并使用 `rg` 直接搜索 `node_modules/@agent-native/core/docs/content/`。
- 对于高级工作区功能，从 `workspace`、`multi-app-workspace`、`a2a-protocol`、`pure-agent-apps`、`automations`、`recurring-jobs`、`external-agents`、`mcp-protocol`、`sharing` 和 `security` 开始。

使用包文档了解框架 API，使用此 `AGENTS.md` 加 `.agents/skills/` 了解工作区特定的约定。

## 共享上下文

添加每个应用代理都应了解的公司、产品、合规或支持上下文说明。

## 共享约定

- 所有 AI/LLM 行为都通过应用的代理聊天进行。UI 和服务器代码不得直接调用模型提供商、AI SDK `generateText()` / `streamText()` 或其他内联 LLM API。使用 `sendToAgentChat()` 进行本地应用-代理工作，包括隐藏的 `context` 和 `submit: false` 预填充/审查流程。仅当 UI 需要与暂存上下文芯片双向同步时，才使用 `useAgentChatContext`、`setAgentChatContextItem`、`listAgentChatContext`、`removeAgentChatContextItem` 和 `clearAgentChatContext`。在构建代理驱动的 UI 或"AI"功能之前，阅读 `.agents/skills/delegate-to-agent/SKILL.md`。
- 仅当多个应用需要时，才将共享代码放在 `packages/shared` 中。
- 将应用特定的屏幕、actions、状态和技能保留在 `apps/<app>` 内。
- 将共享运行时配置存储在工作区根 `.env` 中；仅将 `apps/<app>/.env` 用于应用特定的覆盖。永远不要在源文件、文档、提示、固件、应用状态、action 响应或生成的应用内容中硬编码 API 密钥、token、webhook URL、签名密钥、私有 Builder/内部数据、客户数据或凭据式字面量。使用 secrets/OAuth/运行时配置和明显的占位符示例。
- 在工作区有真正的自定义规则、组件、插件、action 或技能需要共享之前，优先使用框架默认值。
- 保持工作区文件视图用于用户创作或用户请求的资源。代理可以创建隐藏的 `agent_scratch` 资源存放临时工作笔记、脚本、任务计划或中间输出，但仅当用户明确要求保留或管理文件时才将其提升到正常的工作区可见性。
- 运行时可编辑的全局资源可以从 Dispatch Resources 管理。使用 `AGENTS.md` 或 `instructions/<slug>.md` 用于始终启用的护栏，`skills/<slug>/SKILL.md` 用于工作区技能，`context/<slug>.md` 用于角色/定位/消息/公司事实/品牌指南，`agents/<slug>.md` 用于自定义代理配置。当每个工作区应用都应继承它们时，将其范围设为所有应用。所有应用资源在运行时继承；不要将它们复制或同步到单个应用中。

## 添加应用

当用户从 Dispatch 聊天或通过在 Slack 中标记 `@agent-native` 请求创建、构建、制作、搭建或生成一个"代理"时，先分类请求。简单的 Dispatch 原生行为如提醒、摘要、监控、路由规则、保存的指令或循环工作流可以留在 Dispatch 中作为循环作业/资源/目的地。需要自己的 UI、数据模型、actions、集成或领域工作流的健壮独特产品或队友应成为 `apps/<app-name>` 下的独立工作区应用，挂载在 `/<app-name>`。

不要通过向 `apps/chat` 或其他现有应用添加路由、页面、组件或文件来实现新应用，除非用户明确要求修改该现有应用。

Dispatch vault 访问默认是工作区范围的：每个保存的 vault 密钥对每个工作区应用都可用。仅当 Dispatch 的 vault 访问设置切换到手动模式时，才创建或请求按应用的 vault 授权。

工作区应用从 `apps/<app-name>/package.json` 发现。没有单独的工作区应用注册表需要编辑以让 Dispatch 列出该应用。始终在那里保存简洁的、人类可读的 `description`；Dispatch 列表和 A2A 连接代理上下文使用应用名称加描述，以便代理了解该应用的功能。使用相对工作区链接如 `/<app-name>`，永远不要在应用卡片、指令、重定向或导航中硬编码 `localhost`、`127.0.0.1`、`8080`、`8100` 或任何开发端口；活动的工作区网关/浏览器源拥有端口。React Router 应用必须通过 `appBasePath()` 在 `app/entry.client.tsx` 中保留 `APP_BASE_PATH` / `VITE_APP_BASE_PATH`，以便应用在挂载于 `/<app-name>` 时正确水合。使用框架/模板 UI 栈作为标准 UI：shadcn/ui 组件和 `@tabler/icons-react`。不要添加 `lucide-react` 或其他图标库。在添加、更新或调试 shadcn 组件之前，阅读 `.agents/skills/shadcn-ui/SKILL.md`。

正常的应用数据必须通过 actions 流动。对于代理可以执行的 CRUD，在 `actions/` 中创建 `defineAction` 文件，用 `http: { method: "GET" }` 标记读取，并使用 `useActionQuery` / `useActionMutation` 从 React 调用。不要为相同数据在 `/api/*` 下添加重复的 JSON CRUD 路由，除非路由用于上传、流式传输、webhook、OAuth 或其他仅路由关注点。不要添加主要工作是包装、代理或重新导出 action 的路由；action 端点已存在于 `/_agent-native/actions/:name`。基于 action 的 UI 使代理创建或代理编辑的记录无需手动刷新即可出现。

应用数据库代码必须与提供商无关。使用 `@agent-native/core/db/schema` 辅助函数定义模式，使用 Drizzle 的查询构建器和可移植的 `drizzle-orm` 操作符编写应用读/写。不要在应用模板中从 `drizzle-orm/sqlite-core` 或 `drizzle-orm/pg-core` 导入。将原始 SQL 保留用于增量迁移、健康检查或仔细范围的维护，永远不要编写仅 SQLite 或仅 Postgres 的产品代码。

在本地开发中，从工作区根运行 `pnpm exec agent-native create <app-name> --template=<template>`。在生产中，Dispatch 将新应用请求发送到 Builder 分支创建；Builder 仍应搭建独立的工作区应用。工作区开发网关（`pnpm dev`）自动检测新的 `apps/<app-name>` 目录。

使用 chat 模板时，仅将其视为脚手架。完成的应用必须以请求的应用品牌化，拥有自己的主屏幕、导航、包元数据、清单和领域工作流。不要在 chat 派生的应用中留下可见的 `Chat`、`Starter`、`Blank app`、`Start building` 或 `New app` UI。