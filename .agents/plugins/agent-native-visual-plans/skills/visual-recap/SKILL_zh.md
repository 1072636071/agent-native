---
name: visual-recap
description: >-
  将 PR、分支、提交或 git diff 转换为交互式可视化回顾，包含图表、文件映射、API/Schema
  摘要、标注差异和聚焦的审查笔记。
metadata:
  visibility: exported
---

# Visual Recap

`/visual-recap` 创建一个**从** diff 构建的可视化 plan，而非朝向一个 plan。它是正向规划的逆向：不是描述你即将进行的更改，而是描述刚刚完成的更改，但视角高于逐行审查。相同的 plan 数据模型服务于两个方向 — schema、API、文件和架构变更成为与正向 plan 相同的 `data-model`、`api-endpoint`、`file-tree` 和 `diagram` 块，只是现在它们总结已完成的工作。审查者在关注具体代码行之前，可以先扫描变更的轮廓。

## 本地文件隐私模式例外

当用户明确要求不写入数据库、不写入托管 Plan 数据库、不发布 Plan MCP、完全本地文件、离线/私有回顾，或设置了 `AGENT_NATIVE_PLANS_MODE=local-files` 时，使用本地文件隐私模式。这是下面托管发布规则的唯一例外。

在本地文件模式下：

- 仅从本地文件和 shell 命令读取 diff/统计/源码上下文。现有的 `npx @agent-native/core@latest recap collect-diff`、`scan` 和 `build-prompt --local-files` 辅助工具可以安全使用，因为它们操作本地文件且不写入 Plan 数据库。
- 在编写结构化 MDX 之前获取/读取块目录。当 Plan MCP 连接器未注册时，使用 `npx @agent-native/core@latest plan blocks --out plan-blocks.md`；它调用公开的无认证 `get-plan-blocks` 路由，不发送任何回顾内容。如果网络不可用，使用捆绑的参考文件并用 `plan local check` / `plan local serve` 验证。对于 `checklist` 和 `question-form`，逐字复制目录示例：checklist 项需要 `id` 和 `label`；question-form 问题需要 `id`、`title` 和 `mode`；每个选项需要 `id` 和 `label`。`plan local check` 根据渲染器 schema 验证这些必填字段。
- 将回顾写为本地 MDX 文件夹：当用户希望将制品签入仓库时使用 `plans/<slug>/`，当不应签入时使用仓库忽略/临时文件夹如 `.agent-native/plans/<slug>/` 或 `/tmp/agent-native-plans/<slug>/`。文件夹包含 `plan.mdx`、可选的 `canvas.mdx`、可选的 `prototype.mdx` 和可选的 `.plan-state.json`。在编写源文件时在 frontmatter/state 中设置 `kind: "recap"` 和 `localOnly: true`。
- 在提供服务之前运行 `npx @agent-native/core@latest plan local check --dir plans/<slug>`，然后运行 `npx @agent-native/core@latest plan local serve --dir plans/<slug> --kind recap --open`。报告从 stdout 或 `plans/<slug>/.plan-url` 返回的本地桥接 URL。将 `.plan-url` 视为本地令牌文件，不要提交它。该 URL 打开托管 Plan UI 但从本机上的 localhost 桥接读取，因此不能跨机器共享。在 macOS 上，`--open` 优先使用 Chromium 浏览器；如果 Safari 打开了，切换到 Chrome/Chromium，因为 Safari 可能阻止托管 HTTPS 页面获取 HTTP localhost 桥接。如果 Plan 应用本身在本地运行且使用相同的 `PLAN_LOCAL_DIR`，`/local-plans/<slug>` 路由也有效。
- 对于无头验证，运行 `npx @agent-native/core@latest plan local verify --dir plans/<slug> --kind recap`。它启动桥接，检查私有网络预检和 JSON 负载，打印诊断信息并退出。如果浏览器卡在"Loading plan"，从 verify/serve JSON 获取 `bridgeUrl` 以读取具体的验证错误。
- **不要**调用 `create-visual-recap`、`create-visual-plan`、`import-visual-plan-source`、`update-visual-plan`、`patch-visual-plan-source`、`get-plan-feedback`、`export-visual-plan`、`set-resource-visibility` 或任何该回顾的托管 Plan 工具，除了上面的仅 schema 块目录查找。
- 将审查反馈视为文件或聊天反馈：直接更新 MDX 文件，重新运行本地桥接命令，并总结新的本地桥接 URL。托管评论、共享、截图、使用附件和 PR 粘性评论发布在用户明确选择发布之前不可用。

本地文件模式防止回顾内容进入 Agent-Native Plan 数据库。它本身并不使编码代理的语言模型变为本地；要获得更强的隐私边界，宿主代理/模型也必须是本地的或经用户另行批准。

## 始终作为 Agent-Native Plan 发布 — 永远不要内联

交付物始终是通过 Plan MCP 连接器上的 `create-visual-recap` 工具创建的已发布 Agent-Native Plan。该连接器通常暴露为 `plan` 服务器，但旧版已安装的代理可能将相同的托管连接器暴露为 `agent-native-plans`；两个名称都有效。永远不要将回顾作为内联聊天内容交给用户 — 不是 Markdown 散文、不是 ASCII 草图、不是表格、不是围栏式"wireframe"、不是"这是回顾"的摘要。回顾的全部价值在于托管的、交互式的、可标注的 plan；内联摘要不是回顾，它是回顾要替代的东西。唯一支持的输出是发布 plan 并返回其绝对 URL。

除了上面明确的本地文件隐私模式外，如果 `plan` 或旧版 `agent-native-plans` Plan MCP 工具都不可用，不要即兴创建内联回顾作为后备。不要仅仅因为连接器名为 `agent-native-plans` 而非 `plan` 就报告连接器已断开。通常原因是连接器在此会话中未完成连接（它注册了零个工具），不一定是认证问题 — 所以不要假设用户必须认证。停下来告诉用户如何为他们当前的客户端恢复：在 Codex/Codex Desktop 中，运行 `npx -y @agent-native/core@latest reconnect https://plan.agent-native.com --client codex` 并启动新的 Codex 会话；在 Claude Code 中，运行 `/mcp` 并选择 Authenticate/Reconnect，或使用 `--client claude-code` 运行 reconnect 命令并重启 Claude。认证存储在每个客户端配置/会话中；`--client all` 刷新每个已有 Plan 条目的本地客户端配置，但每个运行中的客户端仍需重新加载其 MCP 工具。Reconnect 重新认证而无需重新安装，并通过 URL 查找条目而不受连接器名称影响。永远不要为了修复认证而从零重新安装。然后在工具可达后发布。回退到内联内容是一个缺陷，不是降级模式。

## 何时使用

当 PR 或提交很大、涉及多文件或触及 schema、API 契约或架构，且审查者在阅读原始 diff 之前会受益于看到变更映射到结构化块时，构建回顾。GitHub Action 可以从 PR diff 自动生成；代理可以按需生成（"回顾这个 PR"、"展示这个分支改了什么"）。对于小的、单文件的或显而易见的 diff 跳过它 — 回顾是审查开销，微小变更作为普通 diff 审查更快。

## 回顾整个工作单元

当 `/visual-recap` 在工作已完成后在聊天线程中被调用时，默认范围是整个当前工作单元/线程，而不仅仅是最近的用户消息、工具操作或后续修复。收集线程拥有的跨对话的变更：原始实现工作、后续 bug 修复、UI 后续、测试、changeset、skill/instruction 更新、生成的 plan/源码制品，以及使回顾打开所需的任何本地导入/链接修复。

使用当前 diff 加对话上下文将线程拥有的变更与线程之前存在的无关脏工作区分开。排除无关的预先存在的编辑。如果范围确实模糊且无法推断，在发布之前陈述假设或提出简洁的问题。

在反馈后更新现有回顾时，修改回顾使其仍然覆盖整个线程/工作单元加上新的修正。不要用仅最新反馈的狭窄回顾替换广泛回顾，除非用户明确要求该更窄的范围。

## 保持回顾正文精简

不要向生成的 plan 正文添加样板介绍、免责声明、来源或摘要散文块。特别是，不要创建 `rich-text` 块仅仅为了说明回顾是辅助工具、审查者仍应审查 diff、有多少文件更改或哪个 ref/工作树生成了回顾。plan 标题、简要说明和 `file-tree`（它携带每文件变更统计）已经承载了该上下文。

仅当散文块告诉审查者结构化块未传达的关于变更的具体内容时才添加：目标、真实的兼容性风险、diff 中可见的重要决策或有根据的审查笔记。

## 回顾必须有实质内容

精简不等于单薄。回顾不是单个 wireframe 加一句话 — 那样对审查者的服务不足，就像样板散文对他们的服务过度一样。除了视觉/结构化标题（wireframe、`data-model`、`api-endpoint`、`diagram`），有实质内容的回顾还携带实现证据：

- 在编写之前做一个简短的表面/状态清单：列出 diff 中可见的已更改路由、组件、弹出框/对话框、角色/访问状态、空/错误状态和共享抽象。最终回顾必须用块表示每个有意义的项目，或有意省略它，因为它很小、冗余或非用户可见。
- 带有每个条目 `change` 标志的已更改文件的 `file-tree`，以便审查者一目了然地看到工作的足迹。
- 关键更改文件的分割 `diff`，在单个水平 `tabs` 块中的 `## Key changes` `rich-text` 标题下分组（默认方向，每个文件一个标签），每行有一个一行 `summary` 和几个 `annotations` — 以便审查者可以从高海拔轮廓直接跳入承重代码。使用水平文件标签，而非垂直侧栏，以便选定的文件有足够宽度显示并排 diff。

仅对于真正微小的变更（作为普通 diff 审查更快，见"何时使用"）跳过 diff 附录；对于任何值得回顾的变更，file-tree 和关键更改 diff 属于 plan 中。

## 规范结构和预算

一个有力的回顾遵循一个骨架，从上到下：

1. UI 影响标题 — 当 diff 更改了渲染的 UI 时，wireframe 在前。
2. 简短的结果叙述（`rich-text`）：更改了什么以及为什么，1-3 段。
3. schema 和契约变更的 `data-model` / `api-endpoint` 块。
4. 带有 `change` 标志的已更改文件的 `file-tree`。
5. `## Key changes` — 一个水平 `tabs` 块的 `diff` / `annotated-code`。

保持回顾可审查的预算：

- 3-8 个关键更改标签。大型变更少于 3 个对审查者服务不足；超过 8 个就不再是摘要。
- 保持每个 diff/annotated-code 摘要聚焦 — 每个标签偏好 ~150 行以下；总结或链接长文件的其余部分而非倾倒。
- 标题最多 ~70 个字符；简要说明 1-3 句。

**好的示例。** 一个 25 文件的认证变更：登录表面的 Before/After wireframe、两段叙述、diff 感知的 sessions 表的 `data-model`、新 refresh 路由的 `api-endpoint`、带有 change 标志的 `file-tree`，以及 `## Key changes` 的五个聚焦标签，每个有一行 `summary` 和承重代码块上的几个注释。

**差的示例。** 一个没有摘要或注释的巨大未分割 diff 倾倒；或者一个 40 文件变更的稀疏三块回顾（一个 wireframe、一句话、一个文件列表），迫使审查者回到原始 diff。

## UI 影响需要 Wireframe

当 diff 更改渲染的 UI、布局、密度、视觉状态、交互可供性、导航、控件、菜单、对话框或设计 token 时，回顾必须包含一个或多个 wireframe。散文和文件 diff 不能替代视觉展示更改。

在选择 wireframe 之前，从 diff 进行 UI 覆盖扫描：

- 识别变更出现的入口表面，如页面头部、列表行、工具栏、路由 shell 或菜单触发器。
- 识别打开或更改的交互表面，如弹出框、对话框、标签页、工作表、下拉菜单、内联编辑器或 toast。
- 识别结果目标或持久状态，如公共页面、只读视图、空状态、错误状态、加载状态、权限拒绝状态或已保存/共享状态。
- 当权限更改时识别访问或角色变体。所有者/管理员/编辑者与查看者/非管理者的差异是视觉行为，需要紧凑的矩阵、配对的 wireframe 或清晰标记的状态序列。

对于 UI 密集的 PR，仅入口表面的单个 before/after 是不够的。展示已更改的入口点、主要更改的交互表面和结果/目标状态。当 diff 添加标签页、基于角色的控件、公开/私有可见性、邀请/管理流程、破坏性控件或空/错误分支时，添加更多状态。

选择使审查清晰的最小视觉表面：

- 当审查者受益于直接比较时使用 `Before` / `After` wireframe 对，如移除或添加的控件、更改的状态、布局密度、排序、导航或可见的组件替换。`references/wireframe.md` 负责如何布局该对（按几何形状的列 vs. 垂直堆叠）。
- 当变更是纯增量的或"之前"状态只会显示缺失而不增加审查价值时，使用仅 after 的 wireframe。
- 当 UI 变更依赖于流程、响应式或有状态时，使用超过两个 wireframe；按顺序展示有意义的状态，而非强制单个 before/after 对。
- 对于微小的表面如菜单、弹出框、对话框、toast 或面板，使用匹配的 `surface`（`popover`、`panel` 等）并展示聚焦的子表面。不要重绘整个页面，除非页面中的放置本身就是变更的一部分。

将每个 wireframe 建立在已更改的 UI 行为、组件名称、文件路径和 diff 可见的标签/状态上。如果精确像素是推断的而非捕获的，在 wireframe 标题或简洁的注释中说明。对于本地/手动回顾，导入或更新持有 wireframe 的 plan 源码，以便渲染的回顾打开时 UI 视觉可用。

## Wireframe 质量 — 阅读 `references/wireframe.md`

UI 回顾/plan wireframe 必须满足严格的质量标准 — 全宽 chrome、固定底部栏、真实产品内容、before/after 可比性、正确的 `surface` 预设、`--wf-*` token 而非十六进制，以及无 `<html>`/`<style>`/font 标签。在编写任何 wireframe / `<Screen>` / `WireframeBlock` 之前，阅读此 skill 目录中的 `references/wireframe.md` — 它是 HTML wireframe 质量的单一真相来源，与 `/visual-plan` 和 `/visual-recap` 逐字共享。不要从记忆中编写 wireframe。

使用标准的 `WireframeBlock` / `<Screen>` 格式，以便 Plan 查看器拥有表面帧、主题和 sketchy/clean 切换。HTML wireframe 在放置精度很重要时是合适的，特别是弹出框、菜单、对话框和密集表单。对于 HTML wireframe，保持 `renderMode` 未设置或为 `wireframe`，除非明确需要仅设计的可编辑 mockup，因为 `renderMode="design"` 禁用 sketchy rough 覆盖。

当浏览器工具可用时，在 Plan 查看器中渲染 UI 影响回顾并在共享之前以当前主题视觉检查它。如果任何标签、注释、工具栏或 wireframe 内容与另一个元素重叠，修复 MDX 并在报告链接之前重新导入。文本匹配截图不够；视觉检查捕获的图像。当没有浏览器可用时（例如无头 CI 代理），在回顾交接中说明这一点。

## 打开并报告回顾

在本地文件隐私模式下，首先运行 `plan local check`，然后报告从 `npx @agent-native/core@latest plan local serve --dir plans/<slug> --kind recap --open` 或 `plans/<slug>/.plan-url` 返回的本地桥接 URL。它打开托管 Plan UI 但从本机上的 localhost 桥接读取，因此不能跨机器共享。如果 Plan 应用本身在本地运行且使用相同的 `PLAN_LOCAL_DIR`，`/local-plans/<slug>` 路由也有效。不要虚构托管数据库 URL，也不要仅为获得绝对 Plan 链接而发布。

创建回顾后，用**实际持有 plan 的数据库所在源上的绝对 URL** 链接审查者到渲染的 plan。该源是你刚创建回顾的 Plan MCP 服务器 — 不是你碰巧知道正在运行的任何开发服务器。create 工具返回正确的链接；报告那个链接。永远不要将主链接设为本地 `plan.mdx` 文件、本地镜像文件夹或相对路径如 `/plans/<id>`。

当回顾发布到私有仓库的 PR 时，plan 链接不是公共 URL。使 PR 评论/交接副本明确：审查者可能需要使用对拥有组织有访问权限的账户登录 Agent-Native Plans 才能打开链接。使用这样的措辞："私有仓库回顾：如果 plan 未打开，请使用对此组织的访问权限登录。"不要在访问受仓库/组织可见性限制时暗示链接已损坏或是公开的。

回顾仅存在于创建它的 MCP 的数据库中。单独运行的本地开发服务器（例如 `http://localhost:8081`）有自己的数据库，不会包含通过托管 MCP 创建的回顾，因此手工构建的 `localhost` 链接返回"Plan not found"。这是最常见的回顾错误 — 不要猜测你未确认与 MCP 数据共享的源。

按此顺序解析 URL：

1. 使用 create 工具返回的绝对 URL — `openLink.webUrl`，否则返回的 `plan.mdx` frontmatter 中的 `visualUrl`，否则根据 MCP 服务器自己的源解析的 `url`/`path`（对于托管 MCP，即 `https://plan.agent-native.com`）。这始终指向拥有 plan 的数据库。
2. 仅当回顾是通过绑定到同一源的 Plan MCP 创建时才使用 `localhost`/开发源 — 即该 MCP 的 url 是 `http://localhost:<port>/_agent-native/mcp`。通过托管 MCP 创建并链接到 localhost 是导致 404 的精确不匹配。
3. 如果只有 plan id 可用，构建 MCP 源的绝对 URL（托管：`https://plan.agent-native.com/plans/<id>`）并说明是推断的。

如果用户想在 localhost 上审查但回顾是通过托管 MCP 创建的，直接说明：本地开发服务器无法看到它。要在 localhost 上查看回顾（例如为了使用未部署的本地渲染器更改），他们必须连接本地 Plan MCP（`http://localhost:<port>/_agent-native/mcp`）并通过它重新创建回顾以便它落入本地数据库；主动提供这样做，而非交出一个无法解析的 localhost URL。

当在 Codex 中运行且 Browser/应用内浏览器工具可用时，在创建后自动在那里打开返回的绝对回顾 URL。仍在最终响应中包含相同的绝对 URL。本地镜像文件如 `plans/<slug>/plan.mdx` 只能作为辅助的源码控制制品提及，而非打开回顾的主要方式。

## Diff → 块映射

将每种变更映射到承载它的块，从实际 diff 机械推导。下面的名称是概念块类型，而非 JSX 标签 — 在编写之前用 `get-plan-blocks` 工具将每个概念名称解析为其确切标签 + prop schema（见下面的"块参考"）。

- **Schema / 迁移变更** → `data-model` 用于结果实体、字段和关系。用 `change: "added" | "modified" | "removed" | "renamed"` 标记每个字段/实体的移动，对于更改的类型设置 `was` 为先前值（例如旧列类型）— 基于真实的迁移 diff。那个 diff 感知的 `data-model` 是标题；仅当精确语句仍然重要时才使用分割 `diff` 展示字面 SQL，而非默认。
- **API / action / 路由变更** → `api-endpoint` 包含变更后的方法、路径、参数、请求和响应。用 `change` 标记每个更改的参数/响应（并在类型/形状更改的参数上设置 `was`），并为完全添加或移除的路由在端点根上设置 `change`。用 `deprecated: true` 标记移除的端点并在散文中解释。除非它们是明确的 before/after 契约比较，否则将多个 API 端点保留在正常的单列文档流中。将每个请求/响应示例编写为单个有效的 JSON 值 — 一个可独立解析的顶层对象或数组 — 以便它在可折叠的 JSON 浏览器中渲染。不要在一个示例中放置 `//` 或 `/* */` 注释、散文、尾随逗号或两个或更多连接的顶层对象；不可解析的正文回退到纯文本并失去浏览器。当端点有几个不同的消息形状（例如单独的 websocket 帧类型，或成功正文与错误正文），给每个形状自己的示例和自己的标签，而非将它们塞入一个正文。
- **兼容性敏感变更** → 相关 `data-model` / `api-endpoint` 块旁边的简短 `rich-text` 笔记。命名更改的字段、端点或行为，并标记它是破坏性的、有风险的还是非破坏性的；将该笔记与分割 `diff` 配对以展示字面行。
- **任何有意义的代码块** → `diff`，`mode: "split"`，携带真实的 `before` / `after` 文本和 `filename` / `language`。分割模式是回顾代码审查的默认模式，因为 before/after 可读性是重点；仅对于真正狭窄的独立代码块使用 `mode: "unified"`，此时并排会隐藏代码。给每个 `diff` 一个一行 `summary` 说明代码块更改了什么以及为什么；它渲染为代码上方的描述，以便审查者先读意图。永远不要让 diff 无标签。对于关键更改文件，将 `annotations` 附加到 `diff`，以便回顾指出每个重要代码块的作用 — 这是标注关键更新文件的主要可供性。每个注释默认锚定到 AFTER 侧行号（设置 `side: "before"` 指向移除的行）。保持每个文件几个高信号笔记，而非每行一个。当几个关键文件各需要大量 diff 时，用 Markdown 为 `## Key changes` 的 `rich-text` 标题块引入组，然后将 `diff` 块放在可重用的 `tabs` 块中，水平方向（默认 — 省略 `orientation`），以便选定文件的分割 diff 获得完整文档宽度。让该标题标记该节 — 不要同时在 `tabs` 块上设置 `title`。保持每个标签标签为文件路径或短基本名加目录提示。如果回顾末尾有多个支持 diff，那个尾部 diff 附录应该是其自己 `## Key changes` 标题下的一个水平 `tabs` 块，而非一堆单独的 `diff` 块。
- **全新文件或没有有意义"之前"的大量添加块** → `annotated-code` 而非单侧分割 `diff`。携带真实的新代码及其 `filename` / `language`，并将几个高信号笔记锚定到重要的行，以便审查者阅读新代码做了什么，而非为代码而代码。将分割 `diff` 保留给移除行仍有意义的真正 before/after 代码块，并以与 diff 相同的方式将几个标注演练分组在水平 `tabs` 块中。
- **文件添加 / 移除 / 重命名** → `file-tree`，每个条目带有 `change` 标志（`added`、`removed`、`modified`、`renamed`）和简短 `note`；仅当一个 `snippet` 告诉审查者路径未传达的信息时才附加。
- **渲染的 UI / 交互变更** → 一个或多个 wireframe 在审查者阅读代码之前展示可见的 UI 差异。当比较澄清变更时使用 `Before` / `After` wireframe；否则使用仅 after 或短状态/流程序列。使用真实的 UI 表面：对于弹出框变更，展示带有标题行、右上角操作、选项/字段、标签页、选中/禁用状态、人员/列表/行以及锚定到正确触发器的任何打开的提示/菜单的弹出框。如果添加了路由，展示路由正文和 diff 实现的不可用/空状态。如果权限更改，展示管理者可以做什么以及查看者/非管理者看到什么。保持正文精简：wireframe 承载 UI 故事，而文件树和 `diff` 块承载实现证据。
- **架构或数据流转变** → `diagram`，`data.html` / `data.css` 作为双面板 before/after、分层或泳道布局，或 `mermaid` 用于快速图形。使用二维布局；不要将结构性变更简化为从左到右的链。不要将 `diagram` 用作渲染 UI 控件的替代；UI 变更需要 `wireframe` 块。使用渲染器拥有的 `.diagram-*` 原语（`.diagram-panel`、`.diagram-node`、`.diagram-pill`、`[data-rough]`、…）和 `references/wireframe.md` 定义的相同 `--wf-*` 主题 token 编写 diagram HTML/CSS — 永远不要用 `font-family`、十六进制、rgb/hsl 字面量或一次性深/浅调色板。
- **结果优先叙述** → `rich-text` 用于"更改了什么以及为什么"的散文：diff 服务的目标、其中可见的关键决策，以及审查者应权衡的风险。这是模型唯一自由写作的地方。

## 块参考 — 调用 `get-plan-blocks`，不要记忆标签

上面的概念块名称（`api-endpoint`、`data-model`、`json-explorer`、`tabs`、…）不是你编写的 JSX 标签，确切的标签、必填字段和 prop 形状会随着块库的演进而变化。不要从记忆的标签编写 — 它们会漂移并静默地产生错误标签（`ApiEndpoint` 而非 `Endpoint`、`JsonExplorer` 而非 `Json`、`Tabs` 而非 `TabsBlock`），导致导入时出错。

**在编写任何结构化 plan 内容之前，获取/读取块目录。** 在托管或自托管模式下，调用 Plan MCP 连接器（`plan` 或旧版 `agent-native-plans`）上的 `get-plan-blocks`。在本地文件模式下，或当 skill 作为纯文本安装且没有注册 MCP 工具时，运行 `npx @agent-native/core@latest plan blocks --out plan-blocks.md` 并首先读取该文件。CLI 命令调用公开的无认证 `get-plan-blocks` 路由，不发送任何 plan/回顾内容。如果网络不可用，使用捆绑的参考文件并用 `plan local check` / `plan local serve` 验证。

目录返回从应用自己的块注册表实时生成的权威的、始终最新的块词汇 — 与渲染器和 MDX 往返使用的相同配置 — 所以即使这个 SKILL.md 是旧版安装副本，它也不会过时：

- `get-plan-blocks`（默认 `format: "reference"`）→ 每个块的运行时 `type`、确切 MDX `<Tag>`、放置和关键数据字段的紧凑表。这是你从上面每个概念名称到其真实标签和 props 的映射。
- `get-plan-blocks`，`format: "schema"` → 每个块的完整 JSON Schema 加上工作示例，当你需要确切的字段类型、枚举或嵌套时（例如 `Diff.annotations`、`Endpoint.params[].in`、`DataModel.entities[].fields[]`）。

根据该调用返回的标签和 schema 编写回顾源码。有效块级标签的完整集合是 `get-plan-blocks` 列出的内容；任何其他大写标签在块级别将在导入时被拒绝并显示"Unknown plan block" / "did you mean"错误。`rich-text`/markdown 散文中的小写 HTML 标签（`<div>`、`<span>`、`<code>`、`<br>`、…）始终可以 — 只验证大写组件风格的块标签。

注册表表无法编码的几个回顾特定编写规则：

- 每个块需要一个必填的 `id`（在整个 plan 中唯一）加上共享的可选 `summary` / `editable` 信封；通过在块正上方放置带有 Markdown `###` 标题的 `rich-text` 块来给块添加标题（块不再接受 `title`）。
- 每个大写块组件必须自关闭（`<RichText ... />`）或显式关闭子元素（`<RichText ...>...</RichText>`）。永远不要在段落中留下裸开标签如 `<RichText ...>`；MDX 将其视为未关闭的 JSX，导入在回顾渲染之前就失败了。
- `Endpoint`：散文 `description` 是 MDX **子元素**（标签之间的正文），不是属性；对于 WebSocket 升级使用 `method="GET"`。每个请求/响应 `example` 是一个 JSON **字符串**（渲染器将其解析为 JSON 浏览器），所以保持它为单个可解析的 JSON 值。
- `TabsBlock`：整个 `tabs` 数组（包括嵌套子块）是一个 JSON `tabs={[…]}` prop — 没有嵌套的 `<Tab>` 元素。
- `WireframeBlock`：其正文是单个 `<Screen surface ... html=… />` 子树（嵌套 MDX，非扁平 prop）；`html` 必须是单引号字符串或静态模板字面量，永远不要是动态 `html={someVar}` 表达式。见 `references/wireframe.md` 了解 HTML 规则。
- `Diagram`：整个负载是一个 `data={{ html?, css?, nodes?, edges?, … }}` 属性，需要 `html` 或至少一个节点；`Mermaid` 是它自己独立的块（`source` 文本），不是 `Diagram` prop。

## Before / After 是标题

回顾的重心是 before/after 比较。对于文档正文比较，有两个原语，它们一起覆盖了全部需求：

- **`columns`** — 并排容器，用于**结构化**比较。使用标记为 `Before` 和 `After` 的两列，每列持有一个块（通常是 `data-model`、`api-endpoint` 或 `rich-text`），以便审查者一目了然地读取旧形状对新形状。这是"schema 从 X 变为 Y"或"端点契约像这样更改"的正确原语。不要仅为了压缩或分组 API 端点列表而使用 `columns`。
- **`diff`** — 用于**代码**。它渲染字面的移除和添加行。用于实际的代码块。回顾代码审查默认使用分割模式；保留 `mode: "unified"` 用于真正狭窄的独立代码块，此时并排会隐藏代码。关键文件 diff 组应使用水平标签，以便分割 diff 获得完整文档宽度。

对于 UI diff，wireframe 是视觉比较原语。当比较澄清变更时使用 before/after wireframe；当更匹配变更时使用仅 after 或状态序列。视觉标题必须在任何抽象解释之前展示精确放置、真实的 chrome 和足够的填充。当 diff 添加流程时不要停在第一个可见可供性；展示入口点、打开的表面和结果状态或页面，以便审查者可以追踪实际用户路径。`references/wireframe.md` 负责 before/after 布局选择 — `columns` 渲染器将窄表面并排保持，并自动将宽 `desktop`/`browser` 帧垂直堆叠；永远不要在 `custom-html` 中手工构建并排 wireframe 布局。对于文档正文比较，没有其他多列原语 — `columns` 加 `diff` 块是整个比较词汇。不要在 `custom-html` 中手工构建并排布局，也不要垂直堆叠两个 `data-model` 块并称之为比较，当 `columns` 存在可以将它们并排放置时。

## 基础规则

结构化块仅当从实际更改的行推导时才是**构造上真实的**。`diff`、`data-model`、`api-endpoint` 和 `file-tree` 块必须从真实 diff 机械构建 — 真实路径、真实字段、真实方法/路径、真实 before/after 文本 — 永远不要推断、四舍五入或发明。模型只编写散文："为什么"、叙述、风险解读。一个自信但错误的回顾在审查上下文中是危险的，因为信任摘要的审查者可能跳过摘要恰好弄错的那一行。当 diff 不包含某个事实时，省略它而非猜测；将模型推断的（非提取的）任何内容在散文中标记为推断。

## 安全

- **门控可见性。** 私有仓库的回顾是组织/登录门控的 — 将 plan 的可见性设置为拥有组织或登录，永远不要自动公开。回顾可能暴露未发布的 schema、内部端点和架构；将其视为它总结的源码。任何链接到回顾的 PR 评论或交接必须说明私有仓库回顾需要使用对拥有组织的访问权限登录（如果链接未加载）。
- **永远不要转录秘密。** diff 可能包含 API 密钥、token、webhook URL、签名秘密、`.env` 值或看起来像凭据的字面量。不要将其中任何一个复制到 `diff`、`file-tree` snippet、`api-endpoint` 或散文块中 — 编辑它们（`sk-•••`、`<redacted>`）。这映射了仓库的硬编码秘密规则：在任何块、标题或笔记中只使用明显假的占位符，永远不要使用真实值。

## 双向循环

因为回顾是一个真实的、可编辑的 plan，与正向 plan 相同的审查循环适用：审查者可以标注任何块，编码代理读取 `get-plan-feedback` 以驱动修复回到代码中 — 标注 → 代理 → diff，与正向 plan 使用的相同闭环流程。审查者标注一个块后，调用 `get-plan-feedback` 读取结构化反馈，然后用 `create-visual-recap`（传递现有 `planId` 以原地替换）更新回顾，或用 `update-visual-plan` 应用针对性更改。循环是活的且已连接。唯一尚未自动化的是 PR 评论触发的重新运行：GitHub Action 为每个 PR 创建初始回顾，但当新审查反馈在 GitHub 中发布时尚未自动重新运行 — 该自动重新运行是剩余的快速跟进。

## 相关技能

- **visual-plan** — 规范命令和共享的 Wireframe & Canvas 及文档质量核心的来源；回顾遵循相同的块规则，只是方向相反。
- **comment anchors** — 回顾评论使用与正向 plan 相同的锚规则；见 visual-plan skill 中的"Interpreting comment anchors"了解坐标帧、wireframe 节点 id、文本引用解析、分离线程、通过 `resolutionTarget` 路由和双轴 consumed/resolved 状态。
- **security** — 数据范围、秘密处理，以及回顾的编辑和可见性门控所映射的硬编码秘密规则。
- **sharing** — 持有回顾的 plan 的组织/登录门控可见性。