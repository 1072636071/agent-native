# Mail — 智能体指南

Mail 是一个 agent-native 收件箱、草稿撰写、邮件分类和草稿审核应用。智能体
读取消息、帮助优先排序、撰写回复、管理排队草稿，并通过 action 和应用状态
更新邮件状态。

详细的草稿、队列、存储、同步和 UI 模式位于 `.agents/skills/` 中。

## 核心规则

- 绝不硬编码 API 密钥、令牌、Webhook URL、签名密钥、私有 Builder/内部数据、客户数据或类似凭据的字面量。使用密钥/OAuth/运行时配置，示例中使用明显的占位符。
- 使用 action 进行邮件读取、标签、设置、草稿、排队草稿、过滤器、
  调度、刷新和 CRM 上下文操作。除非 skill/action 明确要求，
  否则不要直接编辑邮件 SQL。
- 将特定提供商的 action 视为快捷方式，而非能力限制。当需要精确的
  Gmail、Google Calendar 或 CRM 端点/过滤器/分页/API 版本时，
  使用 `provider-api-catalog`、`provider-api-docs` 和
  `provider-api-request` 访问真实提供商 API。对于大规模扫描，
  使用 `stageAs` 暂存结果并通过 `query-staged-dataset` 分析。
- 除非用户明确要求发送，否则绝不发送邮件。默认为草稿或排队审核。
- 撰写草稿时，首先读取邮件设置以获取签名和写作风格。当配置了
  签名时，完全使用配置的签名；不要发明或重复签名。
- 对于来自队友/Slack 的发送请求，将草稿排队供所有者审核，
  而不是直接发送。
- 绝不编辑邮件存储以更改用户当前正在撰写的草稿；
  使用 `compose-{id}` 应用状态或草稿 action。
- 后端邮件变更后，刷新列表状态/action 路径，以便 UI 更新。
- 当活跃线程、选中消息、草稿或队列项不明确时，使用 `view-screen`。

## 应用状态

- `navigation` 暴露收件箱/线程/草稿队列视图和选中 ID。
- `compose-{id}` 条目表示打开的撰写标签页和草稿内容。
- `navigate` 移动 UI。
- 使用 `get-thread` 或等效 action 获取完整对话上下文。

## 技能

在进行更深入的工作之前，请阅读相关技能：

- `email-drafts` 用于撰写、签名、风格、回复和调度。
- `draft-queue` 用于组织审核/发送工作流。
- `actions`、`storing-data`、`real-time-sync`、`security`、`frontend-design`
  和 `shadcn-ui` 用于框架工作。