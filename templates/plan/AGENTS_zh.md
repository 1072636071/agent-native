# Agent-Native Plan — 代理指南

Agent-Native Plan 是面向编码代理的本地优先结构化可视化计划模式。它的工作是将代理计划转化为可编辑的富文本块、图表、线框图、原型选项、批注和评论，供人员在代码变更发生之前审查。

## 核心规则

- 切勿硬编码 API 密钥、令牌、webhook URL、签名密钥、私有 Builder/内部数据、客户数据或看起来像凭据的字面量。使用 secrets/OAuth/运行时配置，在示例中使用明显的占位符。
- 遵循根框架规则：数据在 SQL 中，actions 优先，application state 用于导航/选择，共享代理聊天用于 AI 工作。
- 使用 actions 处理应用操作并保持前端/API 一致性。
- 保持数据库代码提供者无关且仅增量添加。
- 当活跃的页面/选择不清楚时，使用 `view-screen` 或 application state。
- 对于新功能，在适用时更新 UI、actions、skills/instructions 和 application state。
- 默认使用结构化可视化制品而不是长 Markdown。文本是一种块类型，不是整个计划。
- 当前应用 actions 需要真实的用户会话，这样计划保持范围限定和可分享。本地开发可以使用框架自动创建的开发账户；托管的持久化、私有分享、审查者链接和跨设备/团队工作流使用账户登录，在配置标准 Google OAuth 环境变量时显示 Google 登录。
- 运行时计划内容是 SQL 中的规范化 JSON。MDX 是源代码控制表面：`plan.mdx` 用于 frontmatter 加 markdown/文档块，`prototype.mdx` 用于可选的 Prototype/PrototypeScreen/PrototypeTransition 标记，`canvas.mdx` 用于可选的 DesignBoard/Section/Artboard/Screen/Annotation/Connector 标记，可选 `assets/`，和可选 `.plan-state.json`。
- 仅当材料假设会改变行为、数据、安全性、测试、部署或完成定义时才展示。
- 在编辑前，使用 `get-plan-feedback` 读取待处理的反馈。

## 应用状态

- `navigation.view` 是 `chat`、`plans`、`plan`、`extensions` 或 `team`。
- `navigation.planId` 在存在时标识活跃的可视化计划。
- `local-codebase` 由 Ask Plan 浏览器文件夹选择器在用户链接本地代码库时写入。它包含选定的文件夹名称以及最新代码索引、文件树和捕获的源快照的个人资源路径。
- `navigate` 将 UI 移动到计划列表或特定的可视化计划。

## 正常规划流程

`/visual-plan` 是主要命令。将其视为主机代理的标准规划模式：检查代码库，在有用时使用并行代理，收集所需信息，在需要时通过宿主的原生 ask-user-question 工具提出澄清问题，然后调用 `create-visual-plan` 发布计划。当用户粘贴、引用或已有 Codex / Claude Code / Markdown 计划时，保持 `/visual-plan` 作为命令并将源文本作为 `planText` 传递给 `create-visual-plan`，这样新的审查界面从他们已有的内容构建。

对于以产品界面为首的 UI 优先工作，使用 `/visual-plan` 并调用 `create-ui-plan`。

对于原型优先的工作 — 当用户需要在实现之前操作行为时 — 使用 `/visual-plan` 并调用 `create-prototype-plan`。原型计划必须是具有本地状态和真实控件的功能性审查界面；不要将静态的屏幕到屏幕导航当作原型。将静态模型保留在文档中，使用顶部查看器进行功能性审查、评论、粗略/干净模式、深色/浅色模式和原型弹出。
（`create-prototype-plan` 是从 `/visual-plan` 访问的 MCP 工具，不是单独的斜杠命令。）

对于实现前的全保真品牌 UI 设计，使用 `/visual-plan` 并调用 `create-plan-design`。研究真实的应用外壳、`design.md`（如果存在）、`.fig` 品牌套件/设计系统数据（如果可用）以及代码库 CSS/Tailwind/令牌信号。为 Design 标签页传递高保真有界 HTML/CSS 屏幕，为有针对性的元素样式编辑传递稳定的 `data-design-id` 属性，仅在匹配的 Prototype 标签页应可点击时传递过渡。将 Design 标签页视为视觉真实来源，将 Prototype 标签页视为相同方向的可交互版本。（`create-plan-design` 是从 `/visual-plan` 访问的 MCP 工具，不是单独的斜杠命令。）

当用户想要对已更改的 PR、提交、分支或 git diff 进行高级审查时使用 `/visual-recap`。回顾是反向计划：从真实 diff 派生块，使用回顾 MDX 源调用 `create-visual-recap`，将其发布为审查辅助工具，并声明审查者仍需检查实际更改的行。

markdown/文档部分应保持接近代理通常会产生的计划。图表、线框图、模型、批注和可选的底部 `question-form` 开放问题块是附加的审查辅助工具，不是单独的收集流程。

不要从 `/visual-plan` 自动调用 `create-visual-questions`。如果正常计划有可回答的未解决决策，将它们保留在同一计划中作为底部 `question-form` 块，包含单选、多选或自由格式问题，有用的推荐选项，以及视觉方向的线框图/图表预览。如果用户在规划前明确请求可视化收集问卷，从 `/visual-plan` 调用 `create-visual-questions`。
（`create-visual-questions` 是从 `/visual-plan` 访问的 MCP 工具，不是单独的斜杠命令。）

## 技能

计划技能拥有所有规划行为。在生成或编辑计划之前阅读匹配的 SKILL.md — 它们包含共享的线框图 & Canvas 和文档质量核心，因此不要在这里重述这些规则。

- `.agents/skills/visual-plan/SKILL.md` — `/visual-plan`，任何富计划的规范斜杠命令；还管理 MCP 工具模式：UI 优先（`create-ui-plan`）、原型优先（`create-prototype-plan`）、设计优先（`create-plan-design`）和可视化收集（`create-visual-questions`）。
- `.agents/skills/visual-recap/SKILL.md` — `/visual-recap`，用于 PR、提交、分支和 git diff 的高级可视化代码审查回顾。

当用户批评计划的外观或结构时，修复渲染器或同步守护的技能（不仅仅是一个存储的计划），这样改进才能持久。

## 审查回顾

- `columns` 是用于结构化比较的通用前后布局原语。将其用于并排的 schema、API、散文和模型块。
- PR Visual Recap GitHub Action 通过 LLM 编码代理（Claude Code 或 Codex，通过 `VISUAL_RECAP_AGENT` 选择；模型和推理深度通过 `VISUAL_RECAP_MODEL` / `VISUAL_RECAP_REASONING`）在每个 PR 上运行 `visual-recap` 技能，当配置了 `PLAN_RECAP_TOKEN` 和后端 API 密钥时，在运行时显示非必需的 `Visual Recap` 检查，然后发布带有内联截图的粘性评论。回顾是信息性的，不得暗示 diff 已被审查。

## 本地代码库聊天

- Ask Plan 页面可以链接浏览器选择的本地代码库文件夹。UI 索引安全的文本文件，跳过生成/密钥外观的路径，在 `instructions/local-codebases/` 下写入小型个人指令资源，并将捕获的文件快照存储在 `codebases/<id>/snapshots/<timestamp>/` 下。
- 对于实时代码库问题，当上下文不清楚时调用 `view-screen` 并检查 `localCodebase`。首先使用 `resources` 工具以 `scope: "personal"` 读取其 `indexPath`，然后在做出声明之前读取相关的捕获文件 `resourcePath`。不要仅从文件名推断 API 契约、schema 形状或 UI 行为。
- 如果回答所需的文件缺失或被跳过，请用户重新同步或附加文件，而不是猜测。
- 对于从本地代码库进行 API/schema/UI 可视化，在 `visual-answer` 之前调用 `get-plan-blocks` 或 `list-plan-components`，然后发布基于你读取的文件构建的 `openapi-spec`、`api-endpoint`、`data-model`、`diagram`、`file-tree`、`tabs` 和 `annotated-code` 等块。

## 源代码同步

- 当用户或外部代理想要计划文件检入仓库时，使用 `export-visual-plan` 或 `read-visual-plan-source`。
- 使用 `get-local-plan-folder` 从 `PLAN_LOCAL_DIR` 或仓库相对 `path` 读取无 DB 的本地 MDX 文件夹，使用 `update-local-plan-folder` 将结构化 `contentPatches` 应用回同一文件夹。当用户正在查看 `/local-plans/:slug?path=...` URL 时传递 `path`。这些本地文件夹 actions 不读写 SQL。
- 使用 `update-local-plan-comments` 在本地计划上添加、回复、解决或删除审查评论。它们持久化到 `plan.mdx` 旁边的 `comments.json` 附属文件（与计划一起提交，无 SQL），始终面向代理（`resolutionTarget: "agent"`），并由 `get-local-plan-folder` 显示。本地评论是到编码代理的单向交接 — 交付是编写器的"发送到代理"复制到剪贴板，不是通知或分享。在桥接模式下，只读桥接不提供评论，因此并置文件夹的 `comments.json` 被合并用于显示和持久化。
- 当临时本地计划应保存到仓库时使用 `promote-local-plan-folder`。其默认目标是 `agent-native.json` 中的 `apps.plan.roots[0].path/<slug>`，回退到 `plans/<slug>`。
- 使用 `import-visual-plan-source` 从 MDX 文件夹创建或替换计划。
- 使用 `patch-visual-plan-source` 通过稳定的语义 ID 进行小型源代码编辑。它修补 MDX AST，运行格式化，解析回规范化 JSON，并持久化运行时模型。当请求的更改是几行、一个批注、一个画板或一个线框图节点时，优先使用此方法而不是重新生成整个计划。
- 在 Agent Native Desktop 中，Plan 菜单可以链接用户选择的本地文件夹用于当前计划，将导出的 MDX 文件写入其中，通过 `import-visual-plan-source` 导入本地编辑，并可选地在托管计划更改时自动导出。这是原生桌面桥接；它不需要克隆的 Plan 应用或 CLI 进程。
- 不要分叉词汇表。MDX 组件必须映射到相同的运行时术语：`DesignBoard`、`Section`、`Artboard`、`Screen`、`Annotation`、`Connector`，以及 `shared/plan-content.ts` 中的线框图套件原语。

## 版本历史

- 计划在有意义的创作更改之前保留 DB 支持的快照。纯评论、反馈回复和评论状态更改不会创建历史快照。
- 使用 `list-plan-versions` 查看计划的已保存快照，使用 `get-plan-version` 在推荐回滚之前检查一个完整快照。
- 仅当用户要求恢复或回滚时使用 `restore-plan-version`。当前计划首先用 `Before restore` 快照，因此恢复是可逆的。恢复保留分享、所有权、托管发布元数据、评论和活动历史；它恢复计划的创作内容和旧版部分。

## 浏览器编辑

- `rich-text` 块中的散文使用共享的 `RichMarkdownEditor` 行内编辑，通过 `update-visual-plan` 以 `contentPatches: [{ op: "update-rich-text", blockId, markdown }]` 自动保存。
- 从 `PLAN_LOCAL_DIR` 或仓库相对 `?path=...` 打开的本地 `/local-plans/:slug` 文件夹使用相同的 Notion 风格浏览器编辑器，但通过 `update-local-plan-folder` 自动保存，这样更改被写入 `plan.mdx`、`canvas.mdx` 和 `prototype.mdx` 而不触及 Plan 数据库。
- 审查批注模式使散文临时只读，这样点击可以固定反馈。离开审查模式恢复行内散文编辑。
- Canvas、画板、线框图、图表和自定义视觉编辑仍然由评论、源代码补丁或结构化内容补丁驱动，而不是直接富文本编辑。
- 设计模式画板可以使用 `update-visual-plan` `contentPatches: [{ op: "update-design-element-style", frameId, blockId, elementId, styles }]` 进行元素编辑。元素必须有 `data-design-id` 或 `data-plan-design-id`；使用 `patch-wireframe-html` / `patch-prototype-html` 进行结构或文本更改。
- 计划评论包括审查者身份、@提及、解决者意图（`agent` 或 `human`）、精确锚点和 Figma 风格线程。当通过 `update-visual-plan` 添加人工反馈时，在已知时保留 `authorEmail` 和 `authorName`；传递 `parentCommentId` 以行内回复现有评论线程。文本反馈应锚定到最近的散文块，视觉/canvas 反馈应包含目标坐标加简洁的周围上下文。
- 仅当用户明确要求删除评论、撤销意外评论或清理过时线程时使用 `delete-plan-comment`。删除是软删除：正常评论视图隐藏评论，而数据库行保留用于审计/调试。删除线程根也会删除其回复。当反馈仅被处理时，优先使用 `resolve-plan-comment` 和 `consume-plan-feedback`，这样审查历史保持可见。
- 仅当所有者明确要求删除或恢复其托管计划/回顾数据时使用 `delete-visual-plan`。`mode=soft` 将资源移至已删除标签页并使正常读取/直接链接停止工作；`mode=restore` 取消删除；`mode=hard` 永久删除计划行加上计划范围的评论、部分、事件、版本、分享、报告、SQL 资产记录和协作快照。硬删除需要确切的确认短语 `DELETE <planId>`。
- `get-plan-feedback` 返回扁平评论、分组线程、锚点摘要、详细锚点行和描述编辑/评论增量的最近审查事件。在更改代码或更新计划之前使用这些字段，特别是区分代理应采取行动的评论和面向人工审查者的评论。
- **锚点解释。** `targetX`/`targetY` 是命名元素内的百分比；裸 `x`/`y` 是整个文档的百分比；`canvasX`/`canvasY` 是画板世界像素。线框图锚点携带 `targetNodeId`/`targetNodePath` — 优先使用这些而不是原始坐标；仅当没有节点 id 存在时回退到坐标加聚焦截图。使用 `contextBefore`/`contextAfter` 解析 `textQuote`；如果 `ambiguous: true`，询问用户。`detachedThreads` 中的线程不再匹配当前散文 — 协调，绝不丢弃。对 `resolutionTarget=agent` 采取行动；将 `human` 视为仅上下文；`@mentions` 是通知信号，不是路由。标记已消费的评论（`consumedCommentIds`）；仅在你实际处理过的代理目标评论上设置 `status=resolved`。
- 新的人工评论在配置了电子邮件时发送尽力而为的事务性电子邮件：根评论和回复通知计划所有者、@提及的成员，回复还通知该线程中之前的人工参与者。复用共享的 `renderEmail` 模板；不要发明单独的计划特定电子邮件样式。
- `report-visual-plan` 记录公共计划或回顾的有界滥用报告而不更改计划内容。它要求调用者范围限定到可访问的公共计划，接受固定原因加可选的简短详情，并更新来自同一报告者的现有开放报告而不是创建重复行。

## 事件

计划应用在框架事件总线上发出四个事件：`plan.created`、`plan.commented`、`plan.published` 和 `plan.status.changed`。自动化可以订阅其中任何一个 — 如果用户要求"当有人评论时通知我"或类似请求，调用 `manage-automations` 以 `action=define`（触发器 `plan.commented`，可选条件 `resolutionTarget`）而不是编写定制的集成代码。参见 `automations` 技能和 [Visual Plans 事件文档](/docs/template-plan#events) 了解载荷 schema 和配方示例。

在实现之前阅读相关的根技能：`adding-a-feature`、`actions`、`storing-data`、`real-time-sync`、`security`、`delegate-to-agent`、`frontend-design`、`shadcn-ui` 和 `self-modifying-code`。
