---
name: visual-plan
description: >-
  将普通文本计划转换为丰富的交互式可视化计划，包含图表、文件映射、标注代码、开放问题和
  UI/原型审查（当有用时）。
metadata:
  visibility: exported
---

# Agent-Native Plans

Agent-Native Plans 是编码代理的结构化可视化规划模式。构建你通常会以 Markdown 编写的 plan，但作为带有混合可编辑块的可扫描文档：内联图表、代码片段、开放问题，以及可选的顶部视觉审查区域（wireframe canvas、实时原型，或两者在标签页中）。架构和后端 plan 保持仅文档；UI 和产品 plan 从顶部 canvas/原型开始（Visual Surface Choice 部分拥有该规则）。

`/visual-plan` 是打包命令和主要入口点。从任务中选择审查模式：UI-first 当工作主要是产品 UI 且审查应从屏幕开始时，prototype-first 当审查应从功能性实时原型开始时，design-first 当审查需要全保真品牌屏幕时，或 visual-intake 当用户明确想要在规划前填写问卷时。当 Codex、Claude Code、Markdown 或粘贴的 plan 已存在时，`/visual-plan` 使用该源 plan 作为起点并从中构建审查表面，而非从头开始。

## 何时使用

当 plan 作为可审查制品比聊天段落更好时，创建或调整可视化 plan。这包括适度的工作，如带有状态的单个 UI 表面、小型工作流、before/after 产品变更，或需要对齐的组件/API/数据形状决策，以及更大的多文件、模糊、长期运行、有风险或 UI 密集的工作。当架构/数据流/UI 方向/选项/开放问题受益于内联图表或结构化块时使用它，当用户需要在实现之前对方向做出反应时使用它，或当现有文本 plan 需要更丰富的审查表面时使用它。

## Plan 纪律

- **审慎门控。** 可视化 plan 是更丰富的审查表面，不仅是巨型项目的工具。当用户需要在编码前看到、比较、评论或批准方向时使用它，即使对于适度的 UI/状态/工作流变更。对于真正琐碎、明确的工作跳过它 — 错别字、单行修复、单个明确指定的函数、任何你可以在一句话中描述其 diff 的东西 — 直接做更改。永远不要用填充物填充 plan，永远不要发布单步 plan。
- **先研究再起草。** 先读取真实文件、actions、schema 和模式；命名实际文件、符号和数据形状而非发明它们。在提出端点之前检查现有 `actions/`，并优先使用命名的客户端辅助函数而非原始 fetch。将广泛探索委托给子代理。以复用为先：对于每个步骤，命名它复用了什么 — 现有 actions、schema、组件、辅助函数 — 然后是它添加了什么，以便 plan 解释真正的新增量而非重新描述已存在的内容。
- **先决定难以逆转的赌注。** 对于非平凡的后端、数据或 API 工作，勾勒功能的走向，然后指出一旦数据或调用者依赖它们就代价高昂的决策 — 线格式、公共 id、数据模型形状、认证和所有权边界 — 并在 plan 中正确处理它们，即使大部分功能稍后才发布。然后将范围缩小到证明方法可行且不关闭它的最小首次切割，同时说明包含什么和明确推迟了什么。
- **在正确的高度保持示例。** 当用户的想法是一个广泛的框架、产品或运营模式变更时，不要将其折叠为他们提到的第一个具体示例、提供者或同步路径。将核心抽象与激励示例和应用/提供者适配器分开。使用示例使 plan 可读，但将它们标记为示例，除非它们是整个请求的范围。
- **发布独立的 plan。** 如果用户粘贴、引用或已有 Codex / Claude Code / Markdown plan，将其视为源材料，但将发布的 plan 重写为干净的独立提案。保留源 plan 的有用意图和代码库事实，将推断的视觉标记为推断，避免修订语言如"保留先前的 plan"、"不要丢弃旧想法"、"与先前版本不同"或"此修订更改了…"。从未看过聊天或早期草稿的读者应该能理解 plan。
- **让首次阅读具体。** 如果 plan 旨在与聊天外的人共享，或概念是抽象的，在顶部附近用一个具体的产品示例领先于模式表、架构或路线图。对于支持 UI 的概念，这通常意味着一个顶部 canvas 应用状态，以产品术语展示真实用户工作流。不要依赖仅在对话中有意义的短语，不要将 plan 框架为"不是旧想法"；直接陈述正向模型。
- **规划是只读的。** 在构建或审查 plan 时不进行源码编辑。仅在用户批准方向后开始编辑。
- **澄清 vs. 假设。** 不要问如何构建 — 探索并在 plan 中呈现方法和选项。仅当歧义会改变设计且你无法从代码中解决时才提出澄清问题；使用宿主代理的正常 ask-user-question 流程，在最终确定前批量提出 2-4 个高杠杆问题。不要从 `/visual-plan` 调用 `create-visual-questions`。否则明确陈述假设并继续，将任何未解决的内容保留在 plan 的单个底部 `question-form` 开放问题块中。对于复杂 plan，在交接前做最后一次开放问题扫描：如果某个决策会影响架构、范围、UX、数据形状或推出，要么在 plan 中带理由决定它，要么将其放入底部表单并附推荐默认值。
- **Plan 是审批门。** 展示后，请用户审查并在编写代码之前批准，并命名工作触及的文件/区域。展示 plan 并请求签字就是审批步骤 — 不要再问一个单独的"这看起来好吗？"问题。
- **文档是真相来源，不是聊天。** 当范围变化时，用 `update-visual-plan` 更新 plan，而非仅在聊天中改变方向，并使更新的文档独立存在。不要在 plan 本身中将更新描述为对早期草稿的修正。在主要步骤之前重新阅读已批准的 plan。

## 创建结构化 Agent-Native Plan — 永远不要内联

交付物始终是结构化 Agent-Native Plan，而非仅聊天 plan。托管 Plan MCP 连接器（`plan` 服务器，或旧版 `agent-native-plans`）是默认的协作和评论表面；它不是拒绝规划模式作为外部依赖或租用层的理由。Plan 是可移植的源码制品（`plan.mdx`、可选的 `canvas.mdx` / `prototype.mdx`、JSON 和 HTML 导出），对所有权敏感的工作流可以使用本地文件模式或自托管/自定义 Plan 应用 URL，而不放弃 skill 的审查纪律。不要建议用户因为默认表面是托管的就跳过 `/visual-plan`；为用户的所有权、隐私、共享和品牌需求选择正确的 Plan 模式。

默认情况下，通过 Plan MCP 连接器创建 plan。永远不要将 plan 作为内联聊天内容交给用户 — 不用 Markdown 散文、ASCII 草图、表格或围栏式 wireframe。如果连接器的工具缺失，不要回退到内联输出：通常原因是连接器在此会话中未完成连接（它注册了零个工具），而非认证。停下来给用户他们当前客户端的确切恢复步骤：在 Codex/Codex Desktop 中运行 `npx -y @agent-native/core@latest reconnect https://plan.agent-native.com --client codex` 并启动新的 Codex 会话；在 Claude Code 中运行 `/mcp` 并选择 Authenticate/Reconnect（或使用 `--client claude-code` 运行相同的 reconnect 命令并重启 Claude）。认证存储在每个客户端配置/会话中，所以一个客户端的 reconnect 不会使另一个运行中的客户端加载工具。永远不要为了修复认证而从零重新安装。在工具可达后发布。本地文件隐私模式（在工具指导之后）是例外。

## 核心工作流

1. 遵循宿主代理的正常规划流程：检查代码库，在有用时委托广泛探索，收集所需信息，并在生成 plan 之前根据需要提出原生澄清问题。如果源 plan 已存在，从用户的粘贴、引用的文件或最近的可见代理上下文收集其确切文本；不要发明源文本。
2. 调用 `get-plan-blocks` 获取权威块目录 — 不要从记忆的标签编写。然后调用模式匹配的创建工具：`create-visual-plan` 用于文档优先的 plan（架构、后端、数据、重构、API），`create-ui-plan` 用于 UI 优先的 plan，`create-prototype-plan` 用于原型优先的 plan，`create-plan-design` 用于设计优先的 plan，`create-visual-questions` 仅当用户明确要求可视化接收问卷时。当源 plan 已存在时，将其作为 `planText` 传递，并在产生独立 plan 文档的同时保留原始 plan 的有用意图，而非修订备忘录。
3. 对于 UI/产品 plan，首先用主要 wireframe 和标注状态组合顶部 canvas，然后用原生块编写文档（见 `references/canvas.md` 和 `references/document-quality.md`）。对于有用户面影响的广泛产品架构 plan，在抽象架构或模式表之前添加一个具体的"这在应用中看起来像什么"视觉。保持文档接近代理通常输出的独立 Markdown plan。如果提供了现有 plan，传递正确的事实和决策，而不引用先前草稿或解释此版本有何不同。对于非视觉 plan，跳过顶部视觉表面（Visual Surface Choice 以下拥有该规则），并将 `diagram`、`data-model`、`api-endpoint`、`diff`、`file-tree`、`code` 和 `annotated-code` 块直接放在相关散文旁边。
4. 展示返回的 Plans 链接或内联 MCP App 并请用户审查。始终在聊天中包含实际 URL，以便下一步在 CLI 或其他纯文本宿主中是点击。当宿主暴露嵌入式浏览器/预览面板且工具可以在那里打开任意 URL 时，自动打开返回的 plan URL 以方便审查 — 这是便利和冒烟测试，永远不是唯一的交接或访问模型。Plan 应该为本地代理和本地浏览器会话开箱即用；如果签名的嵌入式浏览器无法读取匿名/工具检查可以读取的本地 plan，修复应用/action 所有权或访问路径，而非手动修补一个 plan。对于高风险 plan（架构、后端、数据、多文件或有风险），还在用户阅读时启动 Self-Review Before Handoff 中的自审查扫描，而非在其上阻塞交接。
5. 在编辑前、审查后、任何长时间暂停后和最终响应前调用 `get-plan-feedback`。将 `anchorDetails`、解析器意图、最近的审查事件和浏览器交接的任何聚焦截图视为确切更改了什么和每个评论指向什么的真相来源。
6. 用 `update-visual-plan` 应用更改，优先使用针对性的 `contentPatches`。将顶层 `content` 负载视为完全替换，而非合并；不要发送部分 `content` 对象来添加 canvas 或一个块。如果完全替换不可避免，首先读取完整的 plan 源/内容，向前携带每个现有块和视觉表面，并在之后验证源/导出，以便文档正文未被截断。当用户想要源码控制友好的编辑时，使用 `patch-visual-plan-source` 对 MDX 文件而非重新生成 plan。
7. 仅当用户想要可共享的收据或仓库签入制品时才用 `export-visual-plan` 导出。

## 交接前自审查

对于高风险 plan — 架构、后端、数据模型、迁移、多文件或其他有风险的工作 — 在将 plan 视为最终之前运行一次对抗性自审查扫描。对于小的、仅 UI 的或单决策 plan 跳过它，此时成本超过价值。保持扫描廉价且非阻塞：

- **先展示 plan，并行审查。** 发布链接让用户开始阅读，然后并行运行审查 — 永远不要让用户等待。
- **审查已写的 plan；不要重新研究。** 批评 plan 文本及其自己的块。基础工作已在起草时完成，所以审查检查输出而非重新探索仓库。
- **生成一个怀疑的审查者**，其唯一工作是发现什么是弱的、缺失的或错误的 — 而非赞扬。指向：隐式或未做出的难以逆转的决策（线格式、公共 id、数据模型形状、认证、所有权）；未锚定在真实文件或符号中的步骤；plan 应该承诺一个的选项菜单；明显的缺失决策（"当 X 时会发生什么？"、"为什么不是 Y？"）；以及填充物或单步填充。
- **修复 vs. 询问。** 用 `update-visual-plan` `contentPatches` 自己应用明确的修复 — 模糊的非目标、未锚定的声明、明显缺失的决策。将真正的判断调用路由回用户：将它们添加到底部 `question-form` 开放问题块或批量到正常的 ask-user-question 流程。不要静默决定它们。
- **不要在用户阅读中途制造意外。** 在大型 plan 上，在编辑器加载之前应用补丁；否则简要说明自审查正在运行，所以 plan 在他们下方更改是预期的。当你下次响应时，总结审查更改了什么以及它为用户决策浮出了什么。

## 视觉表面选择

在创建 plan 或读取源 plan 之前选择表面。不要默认添加视觉 chrome：

对于 UI/产品 plan，顶部 canvas 通常是主要审查表面。将第一个有意义的 wireframe 放在那里，而非埋为文档正文块。当状态重要时使用多个 canvas 画板，如默认视图、溢出菜单或弹出框、侧面板、加载或错误。将短注释放在帧旁边，使用 `targetId` 加 `placement`；将实现细节、权衡、文件映射、数据契约、风险和验证保留在 canvas 下方的文档正文中。

保持产品 wireframe 和解释性/元图表分开。从看起来像讨论中的应用状态的纯屏幕开始，不在 UI 内嵌入标注散文或架构笔记。将箭头、标签、契约、数据流和模式解释放在单独的注释、单独的 canvas 图或文档正文中。

当 plan 涉及现有应用时，在绘制之前检查当前 shell/组件。第一个画板应该看起来像相同密度的真实应用：现有侧边栏、工具栏放置、溢出菜单、应用 chrome 和框架代理 chrome 保持在它们的真实位置。将次要表面建模为单独的状态，如右上角溢出弹出框、工作表、面板、加载状态或单独的 AgentSidebar，而非发明永久检查器或将框架 chrome 折叠到产品 UI 中。

- **无视觉表面** 用于仅架构、仅后端、数据迁移、仅复制或否则非视觉的 plan。不要将顶部 canvas 用于架构图、依赖映射、文件计划、API 契约或仅数据流审查。使用带有本地内联图表的强文档，仅当关系需要视觉解释时，通常每个建议或决策一个空间图。偏好分组区域、图层、象限、矩阵或 before/after 面板，而非单轴链，除非关系确实是顺序的。
- **仅 Canvas** 用于一个静态屏幕、before/after 比较、组件状态、小弹出框或不需要点击的视觉方向。将这些 wireframe 放在 `content.canvas` 中，省略 `content.prototype`。
- **Canvas + 原型** 用于多步 UI 流程、引导、向导、审查/批准流程、导航更改或任何审查者需要操作行为的地方。将静态 wireframe 保留在 `content.canvas` 中，在 `content.prototype` 中添加对齐的功能原型，并依赖顶部视觉标签在它们之间切换。
- **原型优先** 当用户要求操作 UI 或交互是主要问题时。使用 `create-prototype-plan`，它仍在有用处保留静态 mockup。

对于混合 canvas + 原型 plan，在两个表面上重用相同的真实标签、应用状态和屏幕 id。Canvas 是可检查的静态参考；原型是同一流程的交互版本，而非单独的设计方向。

## Wireframe 质量 — 阅读 `references/wireframe.md`

UI 回顾/plan wireframe 必须满足严格的质量标准 — 全宽 chrome、固定底部栏、真实产品内容、before/after 可比性、正确的 `surface` 预设、`--wf-*` token 而非十六进制，以及无 `<html>`/`<style>`/font 标签。在编写任何 wireframe / `<Screen>` / `WireframeBlock` 之前，阅读此 skill 目录中的 `references/wireframe.md` — 它是 HTML wireframe 质量的单一真相来源，与 `/visual-plan` 和 `/visual-recap` 逐字共享。不要从记忆中编写 wireframe。

## Canvas — 阅读 `references/canvas.md`

Canvas 是静态 UI mockup 的单一真相来源：`surface` 锁定每个画板的足迹，混合表面在通道中布局，注释是纯文本设计者笔记，由 `targetId`/`placement` 锚定，编辑是外科手术式的 `contentPatches`。在编写或编辑任何 canvas、画板或注释之前，阅读此 skill 目录中的 `references/canvas.md` — 它是 canvas/画板机制的单一真相来源。不要从记忆中编写 canvas 布局。

## 文档质量 — 阅读 `references/document-quality.md`

文档是严肃的技术 plan，不是营销：结果优先、散文优先、自包含，从正确的原生块构建，开放问题在单个底部 `question-form` 中，以及交接前视觉检查。在编写 plan 文档之前，阅读此 skill 目录中的 `references/document-quality.md` — 它是文档质量标准的单一真相来源。不要从记忆中编写文档。

## 好与坏的示例 — 阅读 `references/exemplar.md`

对于标准的工作示例 — 一个优秀的 UI 优先 plan 和 `/visual-plan`，加上要避免的反模式 — 在编写 plan 之前阅读此 skill 目录中的 `references/exemplar.md`。

## 工具指导

- `create-visual-plan`：每个代理任务/运行启动一个结构化可视化 plan，或通过传递 `planText` 导入现有文本 plan；`content` 可不包括视觉表面、仅 canvas 或 canvas + 原型。
- `create-ui-plan`：当工作主要是产品 UI 时启动 UI 优先 plan。
- `create-prototype-plan`：启动带有功能顶部审查表面的原型优先 plan。
- `create-plan-design`：启动带有可选匹配 Prototype 标签的全保真品牌 Design 标签 plan。
- `convert-visual-plan-to-prototype`：将现有 HTML wireframe canvas 转换为原型 plan。
- `create-visual-questions`：仅当用户明确要求可视化接收问卷时使用，不作为 `/visual-plan` 预检。
- `update-visual-plan`：用针对性的 `contentPatches` 修订内容、状态或评论（见核心工作流步骤 6）。
- `read-visual-plan-source`：将规范化 plan 读取为 `plan.mdx`、可选的 `canvas.mdx`、可选的 `.plan-state.json` 和 JSON。
- `patch-visual-plan-source`：按稳定的块、画板、注释、组件或 wireframe 节点 id 应用粒度 MDX AST 补丁。
- `import-visual-plan-source`：从 MDX 文件夹创建或替换 plan。
- `get-visual-plan`：读取当前结构化 plan、导出的 HTML 和注释；它还返回源码工作流的 MDX 文件夹。
- `get-plan-feedback`：读取未消费的人类反馈。频繁使用它；它返回分组的线程、确切的锚详情、预期的解析器和最近的审查事件负载，以便代理只处理针对它们的评论。
- `get-plan-blocks`：在编写之前解析块标签 — 不要记忆标签；先调用此获取实时块注册表中的权威标签名称、必填字段和 prop 形状。
- `export-visual-plan`：导出 HTML、Markdown 回退、结构化 JSON 和 MDX 文件用于仓库签入。

当用户批评 plan 的外观或结构时，修复渲染器或此 skill — 永远不要手动编辑一个存储的 plan。将反馈转化为更好的指导。

## 本地文件隐私模式

当用户明确要求不写入数据库、不写入托管 Plan 数据库、不发布 Plan MCP、完全本地文件、离线/私有规划、仓库拥有/源码控制的规划制品，或设置了 `AGENT_NATIVE_PLANS_MODE=local-files` 时，使用本地文件隐私模式。当用户或仓库策略说 plan 必须留在他们自己的品牌、域名、源码控制或基础设施下时也使用它。在此模式下，plan 数据绝不能发送到 Plan MCP 服务器或 Plan 应用 action 表面。仅 schema 的块目录查找是允许的，因为它不发送 plan 内容：如果 MCP `get-plan-blocks` 工具已可用则使用它，或运行 `npx @agent-native/core@latest plan blocks --out plan-blocks.md` 并在编写 MDX 之前读取该文件。

本地文件契约是：

- 仅从本地文件和 shell 命令读取源码上下文。
- 在编写结构化 MDX 之前获取/读取块目录。`plan blocks` 命令调用公开的无认证 `get-plan-blocks` 路由，仅将注册表元数据写入磁盘；如果需要确切的嵌套字段，使用 `--format schema`。如果网络不可用，使用捆绑的参考文件并依赖 `plan local check` / `plan local serve` 捕获无效标签。对于 `checklist` 和 `question-form`，逐字复制目录示例：checklist 项需要 `id` 和 `label`；question-form 问题需要 `id`、`title` 和 `mode`；每个选项需要 `id` 和 `label`。`plan local check` 根据渲染器 schema 验证这些必填字段。
- 将 plan 写为本地 MDX 文件夹：当用户希望将制品签入仓库时使用 `plans/<slug>/`，当不应签入时使用仓库忽略/临时文件夹如 `.agent-native/plans/<slug>/` 或 `/tmp/agent-native-plans/<slug>/`。文件夹包含 `plan.mdx`、可选的 `canvas.mdx`、可选的 `prototype.mdx` 和可选的 `.plan-state.json`。
- 在提供服务之前运行 `npx @agent-native/core@latest plan local check --dir plans/<slug>`，然后运行 `npx @agent-native/core@latest plan local serve --dir plans/<slug> --kind plan --open`。报告从 stdout 或 `plans/<slug>/.plan-url` 返回的本地桥接 URL。将 `.plan-url` 视为本地令牌文件，不要提交它。该 URL 打开托管 Plan UI 但从本机上的 localhost 桥接读取，因此不能跨机器共享。在 macOS 上，`--open` 优先使用 Chromium 浏览器；如果 Safari 打开了，切换到 Chrome/Chromium，因为 Safari 可能阻止托管 HTTPS 页面获取 HTTP localhost 桥接。如果 Plan 应用本身在本地运行且使用相同的 `PLAN_LOCAL_DIR`，`/local-plans/<slug>` 路由也有效。
- 对于无头验证，运行 `npx @agent-native/core@latest plan local verify --dir plans/<slug> --kind plan`。它启动桥接，检查私有网络预检和 JSON 负载，打印诊断信息并退出。如果浏览器卡在"Loading plan"，从 verify/serve JSON 获取 `bridgeUrl` 以读取具体的验证错误。
- **不要**调用 `create-visual-plan`、`create-ui-plan`、`create-prototype-plan`、`create-plan-design`、`import-visual-plan-source`、`update-visual-plan`、`patch-visual-plan-source`、`get-plan-feedback`、`export-visual-plan` 或任何该 plan 的托管 Plan 工具，除了上面的仅 schema 块目录查找。
- 将反馈视为文件或聊天反馈：直接更新 MDX 文件，重新运行本地桥接命令，并总结新的本地桥接 URL。托管评论、共享、历史和发布/导出收据在用户明确选择发布之前不可用。

本地文件模式防止 plan 内容进入 Agent-Native Plan 数据库。它本身并不使编码代理的语言模型变为本地；要获得更强的隐私边界，宿主代理/模型也必须是本地的或经用户另行批准。

## 解释评论锚点

`get-plan-feedback` 返回丰富的锚点 — 在处理任何评论之前阅读它们。

- **坐标帧。** `targetX`/`targetY` 是 `targetSelector`/`targetKind` 命名元素*内*的百分比。裸 `x`/`y` 是整个 plan 文档的百分比。`canvasX`/`canvasY` 是设计 canvas 上的原始板世界像素（板大小在可用时给出）。
- **Wireframe 钉。** wireframe 上的锚包括 `targetNodeId` 和 `targetNodePath`（例如 `card > list > listItem "Acme Inc"`），标识确切的 kit 节点。直接将 `targetNodeId` 与 wireframe 节点补丁操作一起使用；将设计画板中的 `data-design-id` 值与 `update-design-element-style` 一起使用。偏好节点 id/路径而非原始坐标；仅当没有节点 id 时才回退到坐标加聚焦截图（红环标记精确点）。
- **文本引用。** 使用 `contextBefore`/`contextAfter` 进行消歧，针对当前散文解析 `textQuote`。如果 `ambiguous: true`，询问用户 — 不要猜测指的是哪个出现。
- **分离的评论。** `get-plan-feedback` 将引用文本不再存在的线程标记为 `detached`（在 `detachedThreads` 中）。针对重写内容协调这些 — 永远不要静默丢弃它们。
- **路由。** `resolutionTarget` 是唯一的路由信号：对 `agent` 采取行动，将 `human` 仅视为上下文。`@mentions` 是要通知的人，永远不是路由信号。
- **双轴状态。** 将每个摄入的评论标记为 consumed（`update-visual-plan` 上的 `consumedCommentIds`）。仅在你实际处理了的代理目标评论上设置 `status=resolved`；将人类目标评论保持打开。

## 可见性与共享

使用 `set-resource-visibility` 更改谁可以看到 plan（例如公开、登录或组织范围）。使用 `share-resource` 按电子邮件或角色授予特定用户或角色访问权限。在共享任何涵盖未发布或私有工作的 plan 之前门控可见性 — 默认为满足审查需求的最窄范围。

## 设置与认证

有两种方式进入 Plans。

**编码代理 (CLI)。** 使用 Agent-Native CLI 一次性安装。该命令安装 Plans skills，注册托管 Plans MCP 连接器，并在同一步骤中为选定的本地客户端运行认证/设置（设置时的一次性浏览器登录 — 这是预期的），因此该客户端中的第一个工具调用不会碰到 OAuth 墙：

```bash
npx @agent-native/core@latest skills add visual-plan
```

之后，`/visual-plan` 和 `/visual-recap` 是两个已安装的斜杠命令。其他规划模式（`create-ui-plan`、`create-prototype-plan`、`create-plan-design`、`create-visual-questions`）是可从 `/visual-plan` 访问的 MCP 工具，而非单独的斜杠命令。传递 `--no-connect` 在不认证的情况下注册连接器，然后在你准备好时运行 `npx @agent-native/core@latest connect https://plan.agent-native.com --client all`，或选择更窄的 `--client`。认证和 MCP 工具加载是每个客户端配置/会话的。

**浏览器（你与之共享的人）。** 打开 Plans 编辑器并在无需注册的情况下创建和编辑 — 你以访客身份工作。仅在你想要保存或共享时登录；登录将你作为访客创建的 plan 认领到你的账户中。

共享和评论需要账户：公开/共享的 plan 任何有链接的人都可以查看，但评论它们需要 agent-native 账户。

对于完全离线、无账户的使用，在本地运行 Plans 应用并将 plan 作为 MDX 同步到你的仓库。此本地模式是单独的高级路径，非默认的托管流程。

如果 Plans 工具返回 `needs auth`、`Unauthorized` 或 `Session terminated`，不要继续重试该工具。停下来给用户他们正在使用的客户端的 reconnect 步骤：Codex/Codex Desktop 应运行 `npx -y @agent-native/core@latest reconnect https://plan.agent-native.com --client codex` 并启动新的 Codex 会话；Claude Code 应运行 `/mcp` 并为 plan 连接器选择 Authenticate/Reconnect，或使用 `--client claude-code` 运行 reconnect 命令并重启 Claude。要刷新每个已有 Plan 条目的本地客户端配置，使用 `--client all`，然后重启/重新加载每个客户端。Reconnect 重新认证而无需重新安装，并通过 URL 查找条目而不受连接器名称影响。永远不要为了修复认证而从零重新安装。在连接器可用后继续。

托管默认：连接 `https://plan.agent-native.com/_agent-native/mcp`。不要在 skill 文件中放置共享秘密。