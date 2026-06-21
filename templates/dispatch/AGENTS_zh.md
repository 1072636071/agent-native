# Dispatch — 智能体指南

Dispatch 是工作区资源、共享集成、保管库密钥、消息路由、MCP/应用设置和智能体操作的控制平面。

详细的框架规则位于根技能中；此文件仅保留 Dispatch 特有的要点。

## 核心规则

- 绝不硬编码 API 密钥、令牌、Webhook URL、签名密钥、私有 Builder/内部数据、客户数据或类似凭据的字面量。使用密钥/OAuth/运行时配置，示例中使用明显的占位符。
- 将 Dispatch 视为工作区基础设施。优先使用 action 而非原始 SQL 处理
  保管库、集成、资源授权、消息、路由和审批。
- 不要暴露密钥值。保管库存储引用和加密值；应用
  接收授权或凭据引用，而非复制的令牌。
- 工作区集成拥有提供商身份、就绪状态、元数据和授权。
  领域应用仍拥有提供商特定的读取器和解释。
- 集成授权不是提供商能力限制。对于临时提供商
  检查、查询、报告或故障排除，调用
  `provider-api-catalog` / `provider-api-docs`，然后 `provider-api-request`
  访问提供商的真实 HTTP API。使用 `connectionId` 指定特定共享
  授权，使用 `accountId` 指定特定 OAuth 账户。不要暴露密钥
  值或在执行此操作时静默扩大应用访问范围。
- 对于集成 Webhook，使用队列-处理器模式。不要依赖
  无服务器响应后的即发即弃 promise。
- 当当前集成、资源、审批、路由或
  设置项不明确时，使用 `view-screen`。
- 保持审批和路由行为显式。绝不静默扩大对
  密钥、应用、集成或工作区资源的访问。

## 应用状态

- `navigation` 暴露当前 Dispatch 视图、选中的集成/资源、
  审批、路由或设置面板。
- `navigate` 将 UI 移动到设置、保管库、集成、资源、路由和
  审批界面。

## 技能

在进行更深入的工作之前，请阅读相关技能：

- 根 `secrets`、`onboarding`、`integration-webhooks`、`external-agents`、
  `a2a-protocol`、`automations` 和 `recurring-jobs` 用于基础设施工作。
- `actions`、`security`、`sharing`、`frontend-design` 和 `shadcn-ui` 用于
  框架实现。`actions` 技能包括用于灵活集成的共享提供商 API 模式。