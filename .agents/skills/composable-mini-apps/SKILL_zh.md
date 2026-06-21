---
name: composable-mini-apps
description: >-
  构建许多通过 agent 发现和 A2A 组合的专注工作区应用。在设计无头
  迷你应用或跨应用工作流时使用。
---

# 可组合迷你应用

## 规则

在工作区中优先使用多个单一职责应用，而不是一个超大的应用。无头应用可以拥有一个提供商、数据集、工作流或专家操作面，而不需要完整的 UI；主 agent 通过发现和 A2A 组合这些应用。

## 形状

- 给每个迷你应用一个清晰的职责、简洁的 `package.json` 描述和描述其拥有职责的 action 名称。
- 将提供商凭证和上游 API 详情保留在拥有该提供商或工作流的应用中。其他应用应委托给它，而不是复制其集成代码。
- 仅当用户需要检查状态时使用小型状态/配置屏幕。纯无头应用在其职责由 agent、自动化或兄弟应用调用时即可。
- 如果两个工作流仅共享一个辅助函数，将辅助函数放在 `packages/shared`；将工作流 action 保留在单独的应用中。

## 发现与调用

主 agent 应在假设能力之前发现可用的兄弟：

- 运行时 agent 接收由 `discoverAgents()` 构建的 `<available-apps>` 块。工作区兄弟由 `discoverWorkspaceAgents()` 分层加入。
- UI 壳、无头界面和脚本可以通过 `GET /_agent-native/agents?selfAppId=<app-id>` 读取相同的注册表。
- 代码或 CLI 调用者应使用一等 A2A 调用路径（`invokeAgent()` / `agent-native invoke`）当需要按 ID、名称或 URL 调用应用时。
- 在 agent 循环中，当另一个应用拥有工作或数据时，使用 `call-agent` 配合兄弟应用 ID。永远不要通过 `call-agent` 调用当前应用；使用本地 action 代替。

向兄弟发送窄化 prompt：命名确切的问题、相关 ID、日期范围和预期输出形状。原样保留返回的 ID 和 URL。

## 产物交接

迷你应用应交接紧凑的产物，而不是巨大的粘贴转录或提供商转储。当迷你应用创建另一个应用可能使用的内容时，返回或存储一个包含以下内容的产物：

- `artifactType`——这是什么类型的输出，如 `deal-set`、`call-evidence`、`brief`、`dashboard` 或 `report`。
- `artifactId`——稳定的应用拥有 ID、文件路径或资源 ID。
- `createdAt`——ISO 时间戳。
- `source`——用于创建它的提供商/应用/来源 ID。
- `summary`——简短的人类可读解释。
- `items` 或 `records`——下游应用需要的有界结构化数据。
- `links`——用户可见产物的完全限定 URL。

下游应用应接收产物 ID、URL 和窄化的后续问题。如果下游应用需要更多细节，它应回调到产物拥有的应用，而不是要求编排器将整个语料库粘贴到 prompt 中。

示例：`hubspot-pipeline` 返回 `{ artifactType: "deal-set", artifactId: "hubspot-pipeline:deal-set:2026-06-18" }`。`deal-brief` 将该 ID 传递给 `gong-evidence`，后者返回一个 `call-evidence` 产物 ID 和 URL。`deal-brief` 然后从产物 ID 和有界摘要合成最终简报。

## 提供商 API

提供商特定的 action 是快捷方式，不是限制。当上游 API 比一等快捷方式更好地回答问题时，根据需要调用 `provider-api-catalog` 和 `provider-api-docs`，然后对真实提供商端点调用 `provider-api-request`。对于广泛的连接、搜索或缺失声明，使用 `stageAs` 暂存有界语料库并用 `query-staged-dataset` 或代码减少它。

组合应用时，让拥有提供商的迷你应用执行那些 `provider-api-request` 调用。编排器应委托一个有界的任务；不应在本地重新实现每个提供商端点。

## 示例

对于销售智能工作区，将职责拆分为小应用：

| 应用 | 拥有 | 调用 |
| --- | --- | --- |
| `hubspot-pipeline` | CRM 交易、联系人、公司、关联 | 使用提供商 `hubspot` 的 `provider-api-request` |
| `gong-evidence` | 通话、转录、片段、说话人证据 | 使用提供商 `gong` 的 `provider-api-request` |
| `knowledge-base` | 内部文档、定价规则、手册 | 本地搜索/读取 action |
| `deal-brief` | 编排和最终简报 | 对三个应用的 `invokeAgent()` 或 `call-agent` |

流程：`deal-brief` 向 `hubspot-pipeline` 询问目标账户和开放交易，向 `gong-evidence` 询问关于这些交易的最近转录证据，向 `knowledge-base` 询问相关的手册指导，然后合成答案。这是一个由专注应用组成的 HubSpot→Gong→知识库链，而不是一个克隆每个提供商集成的单一应用。

## 不要

- 不要仅为复用其数据而克隆 Mail、Calendar、Analytics、Brain、Assets 或其他一等应用。委托或链接到现有应用。
- 不要将多提供商工作流隐藏在巨大的"杂项工具"应用中。
- 不要在 `provider-api-request` 可以安全表达上游 API 时添加一次性提供商端点。
- 不要创建仅重新导出另一个应用的 action 或 A2A 结果的包装路由。

## 相关 Skill

- **a2a-protocol**——应用如何暴露和调用 A2A 端点。
- **actions**——每个迷你应用如何暴露其自己的操作面。
- **external-agents**——外部 MCP 主机如何通过工作区应用路由。
- **storing-data**——应用拥有的数据如何保持 SQL 支持和可移植。