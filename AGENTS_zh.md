# Agent-Native 框架

本仓库构建的应用中，AI agent 和 UI 是平等的伙伴：UI 能做的一切，agent 也能通过相同的 SQL 数据和操作面完成。保持本文件精简。将详细工作流放在 `.agents/skills/*` 中，在修改相关区域前先阅读对应的 skill。

## 始终生效的规则

- 保持在当前 git 分支上。除非 Steve 在当前任务中明确要求执行该分支操作，否则不要创建、切换、删除、重置、变基、暂存或以其他方式移动分支。
- 不要在提交中添加 `Co-Authored-By` 或其他 agent 署名。
- PR 使用当前分支，除非 Steve 明确要求新分支。PR 默认为可审查状态，而非草稿，除非另有要求。
- 不要在用户可见的 GitHub 元数据中使用 `[codex]`、`codex` 或类似的 agent 标签，除非明确要求。
- 每次回复时，考虑聊天标题是否仍然匹配当前工作。
- 当 Agent Teams 可用时，充分利用子 agent 处理复杂的独立工作；保持主线程专注于编排。
- 添加包依赖或框架集成时，先用 `npm view`/`pnpm view` 或当前文档验证最新版本。不要依赖记忆中的版本。

## 最终状态块

每次最终回复必须以三行状态块结尾：

```md
---

⠀
🟢 实际的简明状态语句
```

图标后面的文字是针对本次回复的简短、任务特定的状态；永远不要字面使用占位文本 `Brief status`。当请求的编码/工作单元在当前分支上完成时使用 `🟢`，即使常规的提交/PR/部署/CI 尚未完成。当非常规工作或手动步骤仍待处理时使用 `🟡`。仅在等待用户输入时使用 `🔴`。

## 架构契约

- 数据默认通过 Drizzle 存储在 SQL 中。通过 `agent-native.json` 声明的显式本地文件模式产物可以使用仓库文件作为数据源，但应用状态、认证、设置以及托管/协作模式仍使用 SQL。保持 schema 与提供商无关。
- Action 是唯一的真实来源。在 `actions/` 中使用 `defineAction` 定义应用操作；agent 将其作为工具调用，前端通过 `useActionQuery` / `useActionMutation` 调用共享的操作面。
- 客户端代码应导入命名的辅助函数、hooks 或客户端模块，而不是手写对框架路由或模板 `/api/*` 路由的 REST 调用。如果浏览器工作流需要路由且不存在辅助函数，先添加辅助函数，然后在 docs/skills 中教授该方法，而不是教授原始 `fetch`。
- 在为应用数据添加任何自定义 API 或 Nitro 路由之前，先检查现有 action。复用或扩展操作面，而不是创建 REST 包装器、透传端点或重新导出 action 的重复 CRUD 路由。
- 对于用于临时分析、查询、报告或跨源研究的提供商集成，优先使用 `@agent-native/core/provider-api` 中的共享 `provider-api-catalog`、`provider-api-docs` 和 `provider-api-request` action 模式，而不是为每个提供商端点/过滤器硬编码一个 action。这是一个框架原则：一等公民 action 是符合人体工程学的快捷方式，而不是人为的能力限制。当上游 API 可以表达端点、过滤器、分页模式或负载时，agent 应该有安全的方式通过提供商 API 基底直接调用它。如果应用在资源/共享行上存储提供商凭证，在暴露原始提供商请求之前添加一个保留访问检查的限定范围解析器。
- 对于可组合的工作区工作流，优先使用多个专注的无头或小型 UI 迷你应用，它们通过 A2A 相互发现和调用，而不是一个超大的应用。在应用之间传递产物 ID、URL 和有界摘要，而不是通过 prompt 粘贴大型提供商转储。在设计跨应用编排之前阅读 `composable-mini-apps`。
- 所有 AI 工作都通过 agent 聊天进行。UI 不直接调用 LLM。
- 应用状态属于 SQL `application_state`，以便 agent 可以知道当前的导航、选择和聚焦对象。
- 轮询通过 `useDbSync()` 和 `/_agent-native/poll` 保持 UI 同步。
- agent 可以修改应用代码；在设计 UI 和数据流时要考虑到这一点。

每个功能在适用时必须涉及四个方面：UI、action、skill 或指令，以及应用状态。

## Plan 产品知识聊天

- Plan 的 `/` 路由是 Ask Plan 聊天界面。使用它来回答由可视化计划、已合并 PR 回顾和可视化答案支撑的产品和代码问题。
- 对于历史产品问题，如"上周发布了什么"、"这个 API 什么时候改的"或"那个 UI 长什么样"，先调用 `search-pr-recaps`。默认范围仅限已合并的 pull request。仅在用户明确要求查看未合并或进行中的工作时才包含未合并的 PR 回顾。
- 找到回顾后，调用 `get-visual-plan` 并检查结构化块：`wireframe`、`diagram`、`api-endpoint`、`openapi-spec`、`data-model`、`diff`、`file-tree`、`tabs` 和 `annotated-code`。
- 对于实时代码问题，如"这个的 API 规范是什么"、"现在长什么样"或"x 的 schema 模型是什么"，在通过本地仓库、Plan 桥接或 GitHub 检查真实代码后，使用 `visual-answer`。
- 在生成或更新可视化内容之前，调用 `get-plan-blocks` 或 `list-plan-components`。自定义组件只有在注册到规范化 schema、共享/服务器注册表和浏览器注册表后才能在聊天中可见。

## 数据与安全

- Schema 变更必须是增量的。永远不要在迁移或启动代码中删除、重命名、截断或破坏性地修改表或列。
- 永远不要对生产数据库使用 `drizzle-kit push`。
- 带有 `ownableColumns()` 的表需要通过 `accessFilter`、`resolveAccess` 或 `assertAccess` 进行限定范围的读写。自定义 Nitro 路由必须在查询可拥有数据之前建立请求上下文。
- 永远不要在源代码、文档、测试、夹具、截图、prompt 或生成的扩展/应用内容中硬编码 API 密钥、令牌、webhook URL、签名密钥、私有 Builder/内部数据、客户数据或看起来像凭证的字面量。在示例中使用明显虚假的占位符。
- 当工作区集成授权可用时，不要将提供商令牌复制到应用中。Vault/secrets 拥有秘密值；应用拥有应用特定的读取器和解释。
- 使用 `security`、`storing-data`、`sharing`、`portability` 和 `integration-webhooks` skill 获取实现细节。

## 前端与 UX

- 全面使用 TypeScript。不要添加 `.js` 或 `.mjs` 源文件。
- 对修改的源文件运行 Prettier。
- 使用 shadcn/ui 原语作为标准控件和对话框。不要使用绝对定位构建自定义下拉菜单/弹出框/模态框。
- 使用 Tabler Icons 作为 UI 图标。不要使用 emoji 作为一等图标。
- 不使用浏览器 `alert`、`confirm` 或 `prompt`；使用 shadcn 对话框。
- Agent prompt 输入必须使用共享的编辑器栈：`AgentComposerFrame`、`PromptComposer` 和 `TiptapComposer`。
- 后台 agent 必须使用核心 run-manager / agent-teams 基础设施，除非在处理现有的本地 Code 例外。
- 已登录的应用页面可以使用 CSR。公共/SEO 页面必须 SSR 真实内容。
- UI 默认应是乐观的：立即更新缓存并导航，出错时回滚，除破坏性或不可逆操作外避免点击阻塞的加载指示器。
- 保持模板 UX 简洁并渐进式展示。不要通过添加始终可见的控件来解决反馈问题，除非那明显是主要工作流。
- 使用 `frontend-design`、`shadcn-ui`、`client-side-routing`、`real-time-sync` 和 `delegate-to-agent` skill 获取详细信息。

## 包与发布

- `packages/core`、`packages/dispatch`、`packages/scheduling` 或 `packages/pinpoint` 中的可发布包源代码变更需要一个 `.changeset/*.md`。
- 不要手动提升包版本；changesets 在合并时处理版本。
- 公共模板白名单由 `packages/shared-app-config/templates.ts` 加上镜像的 CLI/文档界面控制。隐藏模板不得出现在公共目录中，除非先明确取消隐藏。

## 扩展

扩展是存储在 SQL 中的沙箱化 Alpine.js 迷你应用。当用户要求创建或编辑扩展/小部件/仪表板/计算器/迷你应用时，使用扩展 action 和 `extensionData` 而不是源代码更改。扩展可以从 iframe 桥接调用 `appAction` 获取应用 action/数据、`dbQuery`、`dbExec`、`appFetch` 获取允许的框架端点，以及 `extensionFetch` 获取外部 API。使用 `extensions` skill 获取完整规则。

## 项目地图

```txt
app/                 React 前端
actions/             暴露给 agent 和前端的应用操作
server/              Nitro API、插件、数据库、框架路由
packages/core/       框架运行时
packages/dispatch/   Dispatch 包
packages/scheduling/ Scheduling 包
templates/*/         模板应用
.agents/skills/      详细实现指南
```

## Skill 索引

在修改相关区域之前先阅读对应的 skill：

- `adding-a-feature` 用于四方面检查清单。
- `context-xray` 用于检查和管理实时 agent 上下文窗口。
- `actions` 用于 action 定义和调用。
- `storing-data`、`portability`、`security`、`sharing` 用于数据工作。
- `performance` 用于保持列表、读取和页面加载快速——列投影、索引热路径查询和避免往返瀑布流。
- `real-time-sync`、`context-awareness`、`client-side-routing` 用于 UI 状态。
- `client-methods` 用于必须使用命名辅助函数而非原始 REST 调用的浏览器/客户端 API。
- `delegate-to-agent` 用于 LLM/agent 委托。
- `composable-mini-apps` 用于多个单一职责的无头应用，它们发现兄弟应用并通过 `invoke` / `call-agent` 组合。
- `visual-answer` 用于以可视化 Plan 产物回答代码/产品问题。
- `harness-agents` 用于完整的 agent 运行时，如 Claude Code、Codex、Pi、Cursor 或 Mastra。
- `self-modifying-code` 用于 agent 进行源代码编辑。
- `server-plugins` 用于 `/_agent-native/*` 路由和插件。
- `authentication`、`onboarding`、`secrets` 用于设置/认证/凭证。
- `automations`、`recurring-jobs`、`integration-webhooks` 用于后台工作。
- `frontend-design`、`shadcn-ui` 用于界面工作。
- `extensions` 用于沙箱化迷你应用。
- `observability`、`tracking`、`voice-transcription`、`a2a-protocol`、`external-agents` 以及特定模板的 skill 按需使用。