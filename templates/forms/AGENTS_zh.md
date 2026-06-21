# Forms — 智能体指南

Forms 是一个 agent-native 表单构建器和响应工作区。智能体通过 action 和 SQL 支持的状态
创建、编辑、发布、共享和分析表单。第一个屏幕是聊天：首先帮助用户构建、设置、
检查或分析他们的表单工作区，然后在需要更丰富的编辑器或表格时导航到应用视图。

详细的构建、发布、响应、存储和 UI 规则位于 `.agents/skills/` 中。

## 核心规则

- 绝不硬编码 API 密钥、令牌、Webhook URL、签名密钥、私有 Builder/内部数据、客户数据或类似凭据的字面量。使用密钥/OAuth/运行时配置，示例中使用明显的占位符。
- 使用 action 处理表单生命周期、字段、发布、响应、导航、
  共享和数据库工作。不要绕过可拥有访问检查。
- 在开发中，使用 `pnpm action <name>` 调用 action；在生产中，使用原生
  工具。Action schema 是权威的。
- 当活跃的表单、选中的字段、发布状态或响应表不明确时，使用 `view-screen`。
- 对于响应分析，调用 `response-insights` 而非编造 SQL。
  图表请求传递 `displayMode: "chart"`，仅当用户要求表格/行时传递 `displayMode: "table"`，
  组合仪表板/报告请求传递 `displayMode: "insights"`。
- 对于表单设置/配置预览，调用 `preview-form`。它返回
  原生内联摘要/表格和"打开编辑器"扩展路径。
- 表单 UX 应保持聚焦：清晰的标签、合理的验证、最少的
  必填字段和高级设置的逐步展示。
- 公共表单提交端点必须有意为公共；保持管理
  路由已认证。
- 对表单和响应资源使用框架共享 action。

## 应用状态

- `navigation` 暴露主页聊天、构建器、已发布表单、响应、
  response-insights、选中的字段和构建器标签页上下文
  （`activeTab`：`edit`、`responses`、`settings` 或 `integrations`）。
- `navigate` 在主页、表单、构建器、响应、
  response-insights、预览和团队/设置式视图之间移动 UI。对于构建器
  子标签页，使用 `view=form`、表单 ID 和
  `tab=edit|responses|settings|integrations` 调用 `navigate`。

## 聊天优先工作流

- `/` 路由是主要聊天界面。使用它提出澄清问题、
  创建或编辑表单、解释设置和展示响应洞察。
- 当用户需要专注的工作区时，调用 `navigate` 打开 `/forms`、
  `/forms/:id?tab=edit`、`/forms/:id?tab=responses`、
  `/forms/:id?tab=settings`、`/forms/:id?tab=integrations`、
  `/forms/:id/responses` 或 `/response-insights`。
- 当用户要求查看、打开或浏览表单的所有响应时，导航到
  响应视图而非在聊天中渲染响应行。使用 `view-screen` 的当前
  表单或 @-标记的表单 ID。
- 对于设置问题，首先检查当前状态。使用 `db-status` 和
  `db-connect` 进行数据库/云设置，使用表单 action 进行发布、
  字段、共享和响应审核。
- 当用户 @-标记表单时，直接使用引用的表单 ID 与
  `preview-form`、`response-insights`、`list-responses` 或 `navigate`。
- 对于聊天中的表格或图表，使用类型化的 action 结果。`response-insights`
  是原生响应表和提交图表的第一方路径，但
  除非用户要求两者，否则不要同时包含两者；iframe/MCP App 渲染
  仅是外部主机的回退。

## 技能

在进行更深入的工作之前，请阅读相关技能：

- `form-building` 用于 schema/字段创建和编辑。
- `form-publishing` 用于公共表单、提交行为和共享。
- `form-responses` 用于响应审核和分析。
- `storing-data`、`real-time-sync`、`security`、`actions`、`frontend-design`
  和 `shadcn-ui` 用于框架工作。