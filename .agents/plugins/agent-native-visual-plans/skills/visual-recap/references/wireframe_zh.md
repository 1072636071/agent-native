# HTML wireframe 质量 — 单一真相来源

本文件是 HTML wireframe / `<Screen>` / `WireframeBlock` 内容的规范质量标准，由 `/visual-plan` 和 `/visual-recap` 逐字共享。在编写任何 wireframe 之前完整阅读；不要从记忆中编写 wireframe 或按命令改写这些规则。

<!-- SHARED-CORE:wireframe-quality START -->

**Wireframe 是 HTML mockup。渲染器拥有外观；你编写内容。** 将 `data.html` 设置为屏幕的自包含语义 HTML 片段，并设置 `data.surface`。渲染器拥有表面足迹/纵横比、深/浅主题、手写字体和 rough.js 素描覆盖 — 你永远不写 `<html>`/`<body>`/`<script>`/`<style>` 标签或任何宽/高/坐标。你编写真实的 HTML 布局和真实的产品内容；渲染器样式化并粗糙化它。

**Wireframe 块的数据是 HTML 屏幕加 surface：**

```json
{
  "surface": "browser",
  "html": "<div style=\"display:flex;flex-direction:column;gap:10px;padding:16px;height:100%\"><h1>Sign in</h1><p class=\"wf-muted\">Use your work email to continue.</p><div class=\"wf-card\" style=\"display:flex;flex-direction:column;gap:10px\"><label>Email<input value=\"jane@acme.co\" /></label><label>Password<input value=\"••••••••\" /></label><label style=\"display:flex;align-items:center;gap:8px\"><input type=\"checkbox\" checked /> Remember me</label><button class=\"primary\">Sign in</button></div><a href=\"#\">Forgot password?</a></div>"
}
```

**编写纯语义 HTML，让渲染器样式化它。** 裸元素（`h1`/`h2`/`h3`、`p`、`button`、`input`、`<input type="checkbox">`、`a`、`hr`）自动主题化 — 无需类。辅助类承载其余：

- `.wf-card` / `.wf-box` — 带边框、带填充的容器（面板、列表项）。
- `.wf-pill` / `.wf-chip` — 圆角标签或过滤器；添加 `.accent`（`<span class="wf-pill accent">`）用于 accent 填充变体。
- `.wf-muted` — 次要/柔和文本（或使用 `<small>`）。
- `button.primary` 或任何带 `[data-primary]` 的元素 — accent 填充的主按钮。

**mockup 周围不要装饰性阴影。** 不要在 wireframe 帧、根容器、`.wf-card` / `.wf-box` 或 canvas 画板上放置 `box-shadow`、`filter: drop-shadow(...)`、Tailwind `shadow-*` 类或其他伪深度效果。Mockup 应读为平坦的、带边框的表面；使用间距、边框、标签和注释进行分隔。仅当真实产品 UI 已经有该阴影且它对正在审查的更改至关重要时才显示阴影。

**使用渲染器图标，而非可见图标文字。** 对于仅图标按钮或字段、芯片、菜单项和工具栏内的前导图标，编写空标记如 `<span data-icon="mail" aria-label="Email"></span>` 或 `<i data-icon="lock"></i>`。渲染器将其替换为 Tabler 风格的 SVG，`.wf-icon` 类将其大小调整为周围文本。支持的名称和别名：`mail`/`email`、`lock`/`password`、`search`、`plus`/`add`、`x`/`close`、`check`、`chevronDown`、`chevronUp`、`chevronLeft`、`chevronRight`、`dots`/`more`、`chevron`/`caret`/`dropdown`（向下 V 形）、`user`、`settings`、`calendar`、`bell`、`send`、`edit`、`arrowLeft` 和 `arrowRight`。不要在产品 UI 会显示图标的地方放置可见文字如"email"、"lock"、"search"、"chevron"或"more"；仅在它是用户会阅读的真实标签时使用文本。

**对任何自定义颜色使用 `--wf-*` token，永远不要用十六进制。** 渲染器在浅/深色之间翻转这些，因此读取它们是保持 mockup 在两个主题中正确的方式。对于任何内联边框、背景或文本颜色，引用一个 token：`style="border:1.4px solid var(--wf-line)"`。Token 是 `--wf-ink`（文本）、`--wf-muted`（次要文本）、`--wf-line`（边框/分隔线）、`--wf-paper`（页面背景）、`--wf-card`（容器表面）、`--wf-accent` / `--wf-accent-fg` / `--wf-accent-soft`（品牌操作）、`--wf-warn`、`--wf-ok` 和 `--wf-radius`。永远不要硬编码十六进制颜色，永远不要设置 `font-family` — 渲染器拥有 sketch/clean 字体。

**使用内联 `style` flex/grid 布局。** 你编写真实布局 — `display:flex; flex-direction:column; gap:10px; padding:16px` 等等 — 渲染器从不重新定位任何东西。组合真实产品：重现当前屏幕，然后显示修改。真实标签、真实计数、真实日期、真实按钮文本基于你读取的屏幕；不是 lorem 或灰色条。

**Surface 预设 — 匹配真实足迹，永远不要默认为桌面+移动。** 选择匹配用户实际看到的 `surface`：

- `browser`：需要浏览器 chrome 框架的网页。
- `desktop`：完整桌面应用页面或应用 shell。
- `mobile`：手机屏幕，仅当工作确实是移动端时。
- `popover`：小型浮动菜单、下拉菜单或内联弹出框。
- `panel`：侧面板、检查器或侧边栏小组件。

侧边栏弹出框渲染为小表面，而非桌面页面和手机帧。除非响应式行为实际改变布局，否则不要发出 `desktop` + `mobile` 变体。对于组件或小组件，仅当放置影响理解时显示一个更广的应用上下文帧，然后是聚焦的组件状态。

**为小表面建模实际组件 shell。** 渲染的 UI 更改属于 wireframe；将 `diagram` 保留给架构、依赖、状态或数据流关系。弹出框、下拉菜单、命令面板和上下文菜单使用 `surface: "popover"`，除非周围页面放置是更改的重点。对话框、工作表、检查器、侧边栏和长属性面板使用匹配的 `panel` / `desktop` 表面。显示真实 chrome：重要时的触发器或锚点、标题/头部行、右上角操作、分隔线、字段、选项、选中状态、正文内容和可见的工作流中的底部操作。

**修改，不要重新设计。** 当任务更改现有屏幕时，首先重现当前屏幕的真实布局和足迹，然后仅更改增量并用单个注释标注。不要将页面重新堆叠为新布局。对于全新表面，从真实应用 shell 组合。在绘制现有产品之前检查实际应用组件：侧边栏密度、工具栏操作、溢出菜单、属性面板和框架 chrome 应匹配产品，除非 plan 有意更改它们。

**保持产品屏幕纯粹。** 产品 wireframe 显示用户实际看到的应用状态。不要在屏幕内嵌入文件契约、架构箭头、仓库标签、模式解释或实现标注来解释 plan。将那些放在 canvas 注释、单独的图或文档正文中。次要 UI 如属性、历史、同步、导出或 agent 控制应出现在真实产品会放置它们的地方：溢出弹出框、工作表、面板或单独的框架侧边栏状态，而非通用永久右侧检查器，除非该检查器是实际设计。

**在实现之前分类 mockup 范围。** 在将 plan mockup 转换为源代码之前，决定每个画板代表整个页面/应用 shell、现有 shell 内的路由正文还是组件/子表面。如果画板包含导航、侧边栏、认证横幅或注册/登录表单，将这些片段映射到真实的共享 shell/认证组件，而非将整个 mockup 嵌套在当前页面内。当 mockup 引用产品的标准注册/登录页面时，找到并重用该现有实现；不要从 wireframe 近似它。

**放大子表面，不要重绘页面。** 对于小子表面（弹出框、菜单、对话框、toast），显示一次完整屏幕，然后添加一个小的单独画板，其 `html` 仅包含该子表面 — 不要围绕它重绘整个页面，不要放大重复项。选择匹配的 `surface`（例如 `popover`）以便足迹正确；永远不要将弹出框加宽到页面宽度。

**加载/骨架状态。** 在 wireframe 上设置 `data.skeleton: true`，用中性的、无文本的占位符几何体填充 `html` — 用 `<div>` 构建的盒子和条，`background:var(--wf-line)` 和显式高度/宽度，无标签或文案。渲染器自动将边框、sketch 和颜色放入骨架寄存器。永远不要逃逸到 `custom-html` 文档块来伪造加载器。

**编辑现有 mockup。** 要更改现有 html mockup 中的一个元素、文本或颜色，调用 `update-visual-plan` 带 `contentPatches: [{ op: "patch-wireframe-html", blockId, edits: [{ find, replace }] }]`。每个 `find` 是当前 html 的唯一片段（先用 `get-visual-plan` 读取它）；在编辑上设置 `all: true` 以替换每个出现。结果被重新清理。

**将 wireframe 边框视为可见设计的一部分。** 始终在绘制卡片、字段、标签、标签或控件之前，将 HTML wireframe 内容包裹在带真实内填充的根容器中。使用至少 14-16px 的填充、`box-sizing: border-box`、`height: 100%` 和子行之间的 `gap`，以便第一行永远不会紧贴屏幕边框。让文本远离边框：每个容器、字段、按钮、菜单项和注释需要足够的填充和行高，以便在渲染的 Plan 视图中清晰可读。

**安全布局子元素，使其永不碰撞。** 使用带 `gap`、`min-width: 0` 和合理溢出的 HTML flex/grid。避免负边距、绝对定位或固定子宽度，它们可能在渲染器切换浅/深色、sketch/clean 或不同缩放级别时碰撞。

**不要换行有意单行的标签。** 对于工具栏、标签轨道、面包屑、芯片/过滤器行、分支和文件名、文件芯片和代码文件名 — 任何有意单行的行 — 不要让长文本换行。在行上放置 `white-space: nowrap`（以及可能增长的单独标签上的 `overflow: hidden; text-overflow: ellipsis`），以便 wireframe 展示实际布局行为而非产生丑陋的堆叠或垂直文本。对溢出使用水平可滚动或裁剪的轨道。

**填充帧；保持标签简短。** 每个画板是固定大小的表面 — 组合足够的真实 HTML 以均匀的垂直节奏从上到下填充它；永远不要留下大片空白带。在桌面/应用 shell 侧边栏上，让导航堆栈 flex 填充（`flex:1`）并在其后添加任何持久底部操作/状态，以便轨道在更高帧中读起来完整。特别是在移动端上，让真实行向下流过整个屏幕（状态栏、头部，然后列表/详情内容），而非头部漂浮在间隙上方。保持每个标签足够短以在其列中坐在一行上 — 缩短文案而非依赖帧吸收它（长标签换行或裁剪）。

**持久 chrome 条跨越全帧宽度。** 顶部条、应用头部、工具栏和底部标签/导航条是全宽 chrome，不是居中内容。将每个布局为填充帧的单个 flex 行（`style="display:flex;align-items:center;width:100%"`），用 flex 间隔器（`<div style="flex:1"></div>`）将前导组和尾部组之间的尾部操作推到右边缘 — 永远不要在窄的居中块内居中条，永远不要让它折叠到其内容的宽度。在 Before/After 对中，即使一个状态有更少的控件，条在两个状态中都保持全宽；间隔器吸收差异，因此剩余控件保持其边缘对齐而非滑向中心。

**将底部条固定到帧的底部。** 对于移动标签条、页脚和任何持久底部操作行，使帧本身成为 `height:100%` 的 flex 列（`style="display:flex;flex-direction:column;height:100%"`），给滚动正文 `flex:1` 以便它吸收松弛，并将条放置为帧的最后一个子元素（或在其上设置 `margin-top:auto`）。条然后紧贴在表面的底部，而非直接浮在内容下方并留有空白带。

**Before/After 必须可比较。** 当显示状态更改时，在两个状态中保留未更改的控件，以便审查者可以准确看到什么移动或出现；不要将添加的控件显示为浮动在表面其他位置的通用框。将新/更改的控件放置在实现放置它的地方 — 例如，弹出框头部中新的 `Edit with AI` 操作属于右上角头部槽，与标题对齐，而非在正文或底部。在两侧使用相同的帧大小、缩放、外部填充、边框圆角和视觉密度，除非更改本身改变了这些属性，让帧高度适应内容而非留下高大的空白下半部分。

**用列标题命名状态，永远不要在帧内。** 对于文档正文 wireframe（回顾），将两个状态放在 `columns` 块中，并将每列的 `label` 设置为 `Before` 和 `After` — 渲染器将该标签绘制为每个帧上方的 `h4` 标题。不要在 wireframe `html` 中烘焙 `Before`/`After` 标签、标题或标题：放置在内部的标签读作产品 UI 的一部分，落在随机角落，并使比较混乱。列标题是状态名称唯一属于的地方。在 canvas 上，将两个状态画板放置为带帧标签的邻居 — 永远不要在 html 内编码 Before/After。

**让 surface 选择并排 vs 堆叠。** 对于文档正文 wireframe（回顾），`columns` 渲染器将窄表面（`mobile`、`popover`、`panel`）并排布局，并自动将宽表面（`desktop`、`browser`）以完整文档宽度垂直堆叠，因此大帧永远不会被压缩到半宽列并被裁剪。用真实的 `surface` 和匹配的 `Before`/`After` 列标签编写两个 wireframe；不要手工将这对堆叠为单独的顶级 wireframe 或将状态名称复制为正文内容。

**好示例 — 联系人列表，surface `browser`。** 一个小型、真实的屏幕，由辅助类和 token 组合，内联 flex 布局，无字体或十六进制颜色：

```html
<div
  style="display:flex;flex-direction:column;gap:12px;padding:16px;height:100%"
>
  <div style="display:flex;align-items:center;justify-content:space-between">
    <h1>Contacts</h1>
    <button class="primary">New contact</button>
  </div>
  <div style="display:flex;gap:6px">
    <span class="wf-pill accent">All 128</span>
    <span class="wf-pill">Favorites</span>
    <span class="wf-pill">Archived</span>
  </div>
  <div
    class="wf-card"
    style="display:flex;flex-direction:column;gap:0;padding:0"
  >
    <div
      style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1.4px solid var(--wf-line)"
    >
      <div
        style="width:32px;height:32px;border-radius:999px;background:var(--wf-accent-soft)"
      ></div>
      <div style="flex:1">
        <strong>Jane Cooper</strong><br /><small>jane@acme.co</small>
      </div>
      <span class="wf-pill">Lead</span>
    </div>
    <div style="display:flex;align-items:center;gap:10px;padding:10px 12px">
      <div
        style="width:32px;height:32px;border-radius:999px;background:var(--wf-accent-soft)"
      ></div>
      <div style="flex:1">
        <strong>Marcus Lee</strong><br /><small>marcus@globex.io</small>
      </div>
      <span class="wf-pill">Customer</span>
    </div>
  </div>
</div>
```

<!-- SHARED-CORE:wireframe-quality END -->