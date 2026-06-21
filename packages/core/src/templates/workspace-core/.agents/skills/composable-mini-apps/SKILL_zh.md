---
name: composable-mini-apps
description: >-
  构建许多专注的工作区应用，通过 Agent 发现和 A2A 组合。在设计无头迷你应用或跨应用工作流时使用。
---

# 可组合迷你应用

## 规则

在工作区中优先使用许多单一职责的应用而不是一个过大的应用。无头应用可以拥有提供商、数据集、工作流或专业 action 表面，而无需完整 UI；主 Agent 通过发现和 A2A 组合这些应用。

## 形状

- 给每个迷你应用一个清晰的职责、简洁的 `package.json` 描述，以及描述其职责的 action 名称。
- 将提供商凭据和上游 API 详情保留在拥有该提供商或工作流的应用中。其他应用应该委托给它而不是复制其集成代码。
- 仅当用户需要检查状态时使用微型状态/配置屏幕。当其职责由 Agent、自动化或兄弟应用调用时，纯无头应用即可。
- 如果两个工作流只共享一个辅助函数，将辅助函数放在 `packages/shared`；将工作流 action 保留在单独的应用中。

## 发现和调用

主 Agent 在假设能力之前应先发现可用的兄弟应用：

- 运行时 Agent 接收从 `discoverAgents()` 构建的 `<available-apps>` 块。工作区兄弟应用由 `discoverWorkspaceAgents()` 分层加入。
- UI 外壳、无头表面和脚本可以通过 `GET /_agent-native/agents?selfAppId=<app-id>` 读取相同的注册表。
- 代码或 CLI 调用者当需要按 ID、名称或 URL 调用应用时，应使用一等 A2A 调用路径（`invokeAgent()` / `agent-native invoke`）。
- 在 Agent 循环中，当另一个应用拥有工作或数据时，使用 `call-agent` 加兄弟应用 ID。永远不要通过 `call-agent` 调用当前应用；改用本地 action。

向兄弟应用发送窄提示：命名确切问题、相关 ID、日期范围和预期输出形状。原样保留返回的 ID 和 URL。

## 工件交接

迷你应用应该交接紧凑的工件，而不是巨大的粘贴转录或提供商转储。当迷你应用创建另一个应用可能使用的内容时，返回或存储包含以下内容的工件：

- `artifactType` - 这是什么类型的输出，如 `deal-set`、`call-evidence`、`brief`、`dashboard` 或 `report`。
- `artifactId` - 稳定的应用自有 ID、文件路径或资源 ID。
- `createdAt` - ISO 时间戳。
- `source` - 用于创建它的提供商/应用/来源 ID。
- `summary` - 简短的人类可读说明。
- `items` 或 `records` - 下游应用需要的有界结构化数据。
- `links` - 用户可见工件的完全限定 URL。

下游应用应该接收工件 ID、URL 和窄后续问题。如果下游应用需要更多细节，它应该回调到工件拥有的应用，而不是要求编排器将整个语料库粘贴到提示中。

示例：`hubspot-pipeline` 返回 `{ artifactType: "deal-set", artifactId: "hubspot-pipeline:deal-set:2026-06-18" }`。`deal-brief` 将该 ID 传递给 `gong-evidence`，后者返回 `call-evidence` 工件 ID 和 URL。`deal-brief` 然后从工件 ID 和有界摘要综合最终简报。

## 提供商 API

提供商特定的 action 是快捷方式，不是限制。当上游 API 可以比一等快捷方式更好地回答问题时，按需调用 `provider-api-catalog` 和 `provider-api-docs`，然后对真实提供商端点调用 `provider-api-request`。对于广泛的连接、搜索或缺失声明，使用 `stageAs` 暂存有界语料库，并用 `query-staged-dataset` 或代码进行缩减。

组合应用时，让拥有提供商的迷你应用执行那些 `provider-api-request` 调用。编排器应该委托一个有界的任务；它不应该在本地重新实现每个提供商端点。

## 示例

对于销售智能工作区，将职责拆分为小应用：

| 应用 | 拥有 | 调用 |
| --- | --- | --- |
| `hubspot-pipeline` | CRM 交易、联系人、公司、关联 | 带提供商 `hubspot` 的 `provider-api-request` |
| `gong-evidence` | 通话、转录、片段、说话人证据 | 带提供商 `gong` 的 `provider-api-request` |
| `knowledge-base` | 内部文档、定价规则、手册 | 本地搜索/读取 action |
| `deal-brief` | 编排和最终简报 | 对三个应用的 `invokeAgent()` 或 `call-agent` |

流程：`deal-brief` 向 `hubspot-pipeline` 请求目标账户和开放交易，向 `gong-evidence` 请求关于这些交易的最近转录证据，向 `knowledge-base` 请求相关手册指导，然后综合答案。这是一个由专注应用组成的 HubSpot→Gong→knowledge-base 链，而不是一个克隆每个提供商集成的单一应用。

## 禁止

- 不要为了复用其数据而克隆 Mail、Calendar、Analytics、Brain、Assets 或其他一等应用。委托或链接到现有应用。
- 不要将多提供商工作流隐藏在一个巨大的"杂项工具"应用中。
- 当 `provider-api-request` 可以安全表达上游 API 时，不要添加一次性提供商端点。
- 不要创建仅重导出另一个应用的 action 或 A2A 结果的包装路由。

## 相关技能

- **a2a-protocol** - 应用如何暴露和调用 A2A 端点。
- **actions** - 每个迷你应用如何暴露自己的操作表面。
- **external-agents** - 外部 MCP 主机如何通过工作区应用路由。
- **storing-data** - 应用自有数据如何保持 SQL 支持和可移植。