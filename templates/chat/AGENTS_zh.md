# {{APP_NAME}} — 智能体指南

Chat 是最小的聊天优先 agent-native 应用模板。保持聊天作为
主要界面，添加 action 获得真实能力，仅当工作流需要围绕对话的
持久 UI 时才添加屏幕。

## 核心规则

- 绝不硬编码 API 密钥、令牌、Webhook URL、签名密钥、私有 Builder/内部数据、客户数据或类似凭据的字面量。使用密钥/OAuth/运行时配置，示例中使用明显的占位符。
- 遵循根框架契约：数据在 SQL 中、action 优先、应用
  状态用于导航/选择、共享智能体聊天用于 AI 工作。
- 使用 action 处理应用操作，保持前端/API 对等。
- 将聊天视为默认 UI。当用户要求某个能力时，优先
  添加或改进 action 表面，然后仅当用户需要检查、比较、
  批准或共享持久对象时才添加页面、表格、表单或小部件。
- 如果用户想要插入自己的智能体后端，保持应用 shell 和
  线程 UI 完整，通过框架的 `AgentChatRuntime`
  连接器辅助函数适配聊天，而非分叉转录/撰写器 UI。
- 保持 action 表面小而正交：每个 action 是模型上下文窗口中的一个工具，
  因此优先使用一个 CRUD 风格的 `update`（字段补丁）
  而非多个每字段 action，在铸造新读取 action 之前先尝试现有通用查询/逃生
  通道（`provider-api-*`、开发 `db-query`），
  将仅 UI 或程序化 action 标记为 `agentTool: false` 以从模型中隐藏
  （与 `toolCallable: false` 不同，后者仅门控扩展
  iframe），并删除或隐藏 UI 不再使用的 action。请参阅 `actions`
  技能。
- 保持数据库代码与提供商无关且为增量的。
- 当活跃页面/选择不明确时，使用 `view-screen` 或应用状态。
- 对于新功能，在适用时更新 UI、action、技能/指令和应用状态。

## 应用状态

- `navigation` 应描述当前视图和选中的实体 ID。默认聊天视图是 `chat`，位于 `/`。
- 当应用支持时，可使用 `navigate` 移动 UI。
- 当用户的可见上下文重要时，`view-screen` 是第一个要调用的工具。

## 框架文档查找

- 在实现或解释非平凡的 Agent Native 行为之前，使用
  `agent-native-docs` 技能和内置的 `docs-search` action/工具读取
  与 `@agent-native/core` 捆绑的版本匹配的框架文档。
- 当涉及包 API、生成应用约定、工作区、action 或智能体表面时，
  优先使用这些已安装的文档而非记忆或公共文档。

## 技能

在实现之前阅读相关的根技能：`adding-a-feature`、
`actions`、`agent-native-docs`、`storing-data`、`real-time-sync`、`security`、
`delegate-to-agent`、`frontend-design`、`shadcn-ui` 和
`self-modifying-code`。