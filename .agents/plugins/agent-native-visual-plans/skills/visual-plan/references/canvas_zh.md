# Canvas 和画板放置 — 单一真相来源

本文件是 visual-plan canvas 工作方式的规范指南：画板放置、泳道布局、注释、修补和遗留 kit tree。在编写或编辑任何 canvas/画板内容之前完整阅读；不要从记忆中编写 canvas 布局或按模式改写这些规则。

<!-- SHARED-CORE:canvas-surface START -->

**坐标规则。** `surface` 锁定每个画板的足迹和纵横比 — 永远不要设置画板宽/高，永远不要在 wireframe HTML 内使用坐标；板级画板 `x`/`y` 在创建清晰泳道时是允许的。让 canvas 自动放置处理简单的单行板。

**在泳道中布局混合 canvas。** 当 canvas 包含宽大的 browser / desktop 帧加紧凑的 `mobile`、`popover` 或 `panel` 表面时，不要把所有东西放在一个水平条中。使用板级画板 `x`/`y` 预留带充裕空白空间的泳道：主流在一行，紧凑表面在它们自己的列或行，加载/错误状态在较低的行。在渲染的画板矩形之间保持至少 96px，加上注释槽的空间。仅连接相邻步骤；永远不要画跳过无关帧的长连接器。在交付前，以默认缩放检查顶部 canvas，移动任何其标签、连接器或注释穿过另一个帧的帧。

**Canvas 注释是画板上的设计者笔记。** 当顶部 canvas 存在时，在它们解释的帧附近撒上 Figma 风格的笔记：简短标题、支持文本和要点 — 纯文本层，永远不是带边框或阴影的卡片，永远不是围绕帧的框。渲染器将笔记间隔远离帧，因此将每个笔记放在它描述的帧旁边。仅当指向一个特定控件或转换时使用箭头；对于广泛的帧级笔记，在帧旁边写文本不带连接器。连接器仅用于真实序列 — 永远不要在独立状态之间伪造"Step 1 → Step 2"线。

**不要创建重叠注释。** 用 `targetId` + `placement`（top/right/bottom/left）将每个普通笔记锚定到它解释的帧，并省略 `type` 或使用 `type: "note"`。渲染器将笔记停放在帧旁边的槽中并自动布局。不要对普通笔记使用 `type: "callout"`、`type: "text"`、`type: "arrow"`、x/y 或 points；那些是自由格式审查标记层，必须保留给开放 canvas 空间中的有意标记。保留箭头仅用于必须指向帧内一个特定控件的笔记；简单坐在其帧旁边的笔记不需要箭头。

**修补。** 用针对性的 `contentPatches`（例如 `patch-wireframe-html`、`patch-diagram-html`、`update-block`、`replace-blocks`、`update-canvas-annotation`）编辑一个 wireframe、canvas 注释、图或块，而非重新生成整个 plan。`contentPatches` 是公共 MCP action schema 的一部分，因此 Claude Code、Codex、Cursor 和其他宿主可以进行精确编辑。如果 agent 从导出的源文件工作，使用 `read-visual-plan-source` / `patch-visual-plan-source`：`plan.mdx` 保存 frontmatter 加 markdown/文档块，`canvas.mdx` 保存 `<DesignBoard>/<Section>/<Artboard>/<Screen>/<Annotation>/<Connector>`，patch action 将 MDX 规范化回相同的 JSON 运行时模型。JSON 是规范的运行时形状；MDX 是仓库友好的编写/导出表面。在浏览器中，人类内联编辑 `rich-text` 散文；agent 仍应使用 `update-rich-text` 内容补丁或源补丁处理散文，使用 comments/structured patches 处理 canvas、画板、wireframe 和图编辑。永远不要发送部分顶级 `content` 对象作为添加 canvas、帧或块的快捷方式：`content` 是完整的结构化替换，因此省略的块或表面可能消失。如果完整替换确实不可避免，先读取完整的 source/JSON，在新载荷中包含每个现有块和表面，并在更新后立即验证 source/export。

**永远不要发出没有内部 wireframe 内容的带标题画板。** 你放在 canvas 上的每个画板必须携带 `html` wireframe 或通过 `blockId` 引用 wireframe 块；使用 `blockId` 时，被引用的 `wireframe` / `legacy-wireframe` 块必须保留在 plan 中。如果你从文档正文中删除重复的 wireframe，先将其 `data` 内联移动到相应的 `content.canvas.frames[*].wireframe` / `legacyWireframe`。仅标签的帧或指向已删除块的帧渲染为空并在解析时被拒绝。如果你只有一个标题，将其写为节标题或注释，而非空画板。

**UI mockup 属于顶部视觉审查区域。** 静态 UI/产品视觉存在于 canvas 上；多步骤 UI 流程同时获得 canvas wireframe 和 prototype。当用户要求 mockup、UI 状态、加载状态、布局、屏幕或视觉比较时，使 canvas 成为该静态视觉的主要归宿。当用户要求 prototype 或 plan 包含审查者必须感受的序列时，保留 canvas 画板并添加 `content.prototype`，以便顶部表面显示 Wireframes / Prototype 标签页。架构/代码图保留在文档中内联（SKILL.md Visual Surface Choice 部分拥有该规则），除非用户明确要求空间板。文档块可以解释、比较或映射实现，但它们不应托管主要 UI mockup 或 prototype，仅因为 `custom-html`、截图或散文更容易产生。如果 canvas/prototype 表面无法表示请求的 UI 保真度，仍保持最接近的顶部表面表示，并指出或扩展所需的渲染器能力。骨架/加载 mockup 也存在于 canvas 画板中 — 永远不要将 mockup 移出 canvas。

对于抽象产品概念，使用 canvas 创建第一个"我明白了"的时刻：顶部附近一个真实应用状态展示概念如何对用户出现，后面跟单独的注释或图用于机制。不要让第一个画板成为应用 UI 和架构笔记的混合体；应用屏幕应该可以独立作为产品 UI 检查。

**遗留 kit tree。** 旧 plan 设置 `screen` 数组的 `{ el, ...props }` kit 节点而非 `html`；渲染器仍接受并显示它，但新 plan 发出 `html`。不要编写新的 kit-tree 屏幕 — 改写 HTML mockup。同样，旧或导入的 plan 可能携带基于坐标的区域或笔记上的自由浮动 x/y；那些是渲染器仍显示的遗留逃生舱，但你必须永远不要产生。槽通过 `targetId` + `placement` 停放笔记，本文件顶部的坐标规则管辖所有新 plan 的放置。

<!-- SHARED-CORE:canvas-surface END -->