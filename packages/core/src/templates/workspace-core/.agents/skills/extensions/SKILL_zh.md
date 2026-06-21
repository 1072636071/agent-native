---
name: extensions
description: >-
  创建、编辑和管理扩展 — 在 iframe 中运行的沙箱化 Alpine.js 迷你应用。当用户要求仪表板、小部件、计算器或任何调用外部 API 的交互式迷你应用时使用。与 LLM "工具"（函数调用）不同 — 见下文说明。
metadata:
  internal: true
---

# 扩展

> **术语说明。** 本技能是关于**扩展** — 框架的用户编写迷你应用原语（在 iframe 中渲染的沙箱化 Alpine.js HTML）。它与 **LLM "工具"** 不是同一回事，后者是 AI Agent 使用的函数调用原语（action、MCP 工具等）。其他技能仍然说"Agent 将 action 作为工具调用" — 那是 LLM 概念，保持不变。当本文档不加限定地说"工具"时，它指 LLM 工具。当它说"扩展"时，它指沙箱化迷你应用。
>
> 历史命名：扩展以前被称为"工具"。物理 SQL 表名（`tools`、`tool_data`、`tool_shares`）和一些旧版 iframe 内全局变量（`toolFetch`、`toolData`）为保持向后兼容而保留 — 参见 `references/api.md` 中的向后兼容表。

## 参考

- **`references/api.md`** — 详尽的辅助函数/全局变量表（`appAction`、`appFetch`、`dbQuery`、`dbExec`、`extensionFetch`、`extensionData`）、密钥、Tailwind 类、共享、导航、路由和完整的向后兼容命名表。当你需要任何辅助函数的精确签名、作用域选项或路由时阅读此文件。
- **`references/examples.md`** — 五个完整的 HTML 扩展示例（API 状态仪表板、天气小部件、带 `extensionData` 的待办列表、快速笔记）。当你想要一个完整的可复制粘贴起点时阅读此文件。

## 关键：扩展是什么（和不是什么）

扩展是存储在 SQL `tools` 表中的**自包含 Alpine.js HTML 片段**（表名保持向后兼容；Drizzle 导出为 `extensions`）。它在沙箱化 iframe 中运行，拥有自己的 Tailwind CSS 和 Alpine.js 运行时。

**扩展不是：**

- React 组件
- 新的源代码文件
- 数据库 schema 变更
- `actions/` 中的 action 文件
- 路由

**当用户要求"制作扩展"、"创建扩展"或"构建 ... 扩展"（或旧版措辞"制作工具" / "创建工具"）时：**

1. 编写 Alpine.js HTML
2. 用 HTML 作为 `content` 调用 `create-extension`
3. 就这样 — 无需创建文件、无需 schema 变更、无需 action

扩展通过注入到 iframe 中的辅助函数完全访问应用数据（完整签名见 `references/api.md`）：

- `appAction(name, params)` — 调用任何应用 action
- `appFetch(path, options)` — 调用 `/_agent-native/*` 下允许的框架端点
- `dbQuery(sql, args)` — 从 SQL 读取
- `dbExec(sql, args)` — 写入 SQL
- `extensionFetch(url, options)` — 通过代理调用外部 API。旧版别名：`toolFetch` — 保持与重命名前编写的扩展体的向后兼容；两个名称指向同一辅助函数。
- `extensionData.set/list/get/remove(collection, ...)` — 每扩展持久化自定义数据（支持 `{ scope: 'user' | 'org' | 'all' }` 选项）。旧版别名：`toolData` — 保持向后兼容；两个名称指向同一存储。

## 数据持久化内置

**每个扩展都有 `extensionData` — 一个每扩展的键值存储。无需源代码变更、无需 Builder、无需新表。**

当用户要求在扩展中"添加持久化"、"保存数据"、"记住状态"或"存储设置"时，使用 `extensionData`。它自动处理表创建、作用域和 upsert。数据按每扩展组织到集合中：

```javascript
// 保存私有项（默认 — 只有当前用户可以看到）
await extensionData.set('notes', 'note-1', { title: 'My Note', body: 'Hello' });

// 保存组织共享项（组织内所有人可见）
await extensionData.set('notes', 'note-1', { title: 'Team Note', body: 'Hello' }, { scope: 'org' });

// 按作用域列出项
const myNotes = await extensionData.list('notes');                        // 用户作用域（默认）
const orgNotes = await extensionData.list('notes', { scope: 'org' });    // 仅组织作用域
const allNotes = await extensionData.list('notes', { scope: 'all' });    // 用户 + 组织
```

> 旧版全局变量 `toolData` 仍然被注入并指向同一存储 — 引用 `toolData.set(...)` 的旧版扩展体无需更改即可继续工作。在新代码中优先使用 `extensionData`。

**对于扩展特定的持久化，优先使用 `extensionData` 而不是原始 `dbExec`** — 它自动处理一切。仅在查询应用现有表时使用 `dbQuery`/`dbExec`。完整 `get`/`remove`/作用域参考见 `references/api.md`。

## 扩展是什么

扩展是在沙箱化 iframe 中运行的迷你 Alpine.js 应用。它们可以通过 `extensionFetch()` 调用外部 API，该函数通过注入密钥值的服务端代理路由。扩展自动共享主应用的 Tailwind v4 主题。

## 创建扩展

调用 `create-extension` action：

```bash
pnpm action create-extension \
  --name "GitHub PR Dashboard" \
  --description "Shows open PRs for the repo" \
  --content '<div x-data="...">...</div>'
```

或通过 HTTP API：

```
POST /_agent-native/extensions
{ "name": "GitHub PR Dashboard", "description": "Shows open PRs", "content": "<div ...>...</div>" }
```

action 接受：

| 字段                    | 类型     | 必需 | 用途                                                |
| ----------------------- | -------- | ---- | --------------------------------------------------- |
| `name`                  | `string` | 是   | 扩展的显示名称                                      |
| `description`           | `string` | 否   | 简短摘要                                            |
| `content`               | `string` | 是*  | Alpine.js HTML 正文（*除非 `contentFromAttachment`）|
| `contentFromAttachment` | `string` | 否   | 按引用托管粘贴/附件的文件                           |
| `icon`                  | `string` | 否   | 图标名称或短标签                                    |

完整可运行的 `content` 正文见 `references/examples.md`。

### 托管粘贴文件（按引用）

当用户**粘贴大文件**（例如完成的 HTML/Alpine 应用）并要求你将其作为扩展托管时，不要将该文件复制到 `content` 参数中。大的粘贴在你的上下文中显示为 `<attachment name="pasted-text-…">` 块；将其重新键入为工具参数会消耗数千输出令牌，并经常在流中途被截断，导致轮次停滞。

相反，将 `content` 留空并传递 `contentFromAttachment` 设为该附件的 `name` — 或字面字符串 `"latest"` 用于最近的粘贴块。服务端逐字读取附件并将其存储为扩展内容：

```json
{ "name": "My Dashboard", "contentFromAttachment": "latest" }
```

`update-extension` 接受相同的 `contentFromAttachment` 用于完整正文替换。内联 `content` 仍然适用于你自己编写的所有内容 — 仅在你已经粘贴的内容时使用 `contentFromAttachment` 以避免回吐。

## 编辑扩展

使用 `update-extension` action。对于精确更改，优先使用细粒度 `edits` 而不是重新生成完整 HTML。对于中/大型扩展，在主要块周围添加稳定的节注释，以便未来的 Agent 可以定位它们而不触及无关的缩进：

```html
<!-- agent-native:section npm-daily-chart -->
<section>...</section>
<!-- /agent-native:section npm-daily-chart -->
```

然后只更新该节：

```json
{
  "id": "EXTENSION_ID",
  "edits": "[{\"op\":\"replace-section\",\"section\":\"npm-daily-chart\",\"content\":\"<section>...</section>\"}]",
  "format": true
}
```

支持的 `edits` 操作：

| 操作               | 用于                                       |
| ------------------ | ------------------------------------------ |
| `replace`          | 字面查找/替换；默认匹配一次               |
| `insert-before`    | 在精确标记前插入内容                       |
| `insert-after`     | 在精确标记后插入内容                       |
| `replace-between`  | 替换两个精确标记之间的内容                 |
| `replace-section`  | 替换命名的注释节                           |
| `wrap-section`     | 在命名节周围添加包装器                     |
| `remove-section`   | 移除命名节                                 |
| `regex-replace`    | 小心限定范围的 regex 替换                  |

当歧义有危险时使用 `expectedMatches`。缺失的必需目标会失败而不是静默地什么都不做。传递 `format: true` 在补丁后对最终 HTML 运行 Prettier。完整 `content` 替换仍可用于广泛的重写。

旧版 `patches` 仍然适用于简单的字面替换：

```
PUT /_agent-native/extensions/:id
{
  "patches": [
    { "find": "old HTML fragment", "replace": "new HTML fragment" }
  ]
}
```

每个补丁对当前内容执行字符串查找和替换。使用它来更改单个元素、修复 URL 或更新类，而无需重写所有内容。

要替换完整内容：

```
PUT /_agent-native/extensions/:id
{ "content": "full new HTML" }
```

## 历史和回滚

扩展在 SQL 中保留快照历史。当扩展被创建、元数据或 HTML 内容变更以及恢复先前版本时，会记录一个版本。早于历史功能的现有扩展在首次编辑时将其当前状态保存为基线。

当用户询问变更了什么、想要变更日志/diff 或想要回到过去时，使用这些 action：

| Action                              | 用途                                                       |
| ----------------------------------- | ---------------------------------------------------------- |
| `list-extension-history`            | 列出一个扩展的已保存版本                                   |
| `get-extension-history-version`     | 读取一个版本及前版本 diff                                  |
| `restore-extension-history-version` | 从版本恢复名称、描述、图标和 HTML 内容                     |

恢复版本**不会**恢复共享/所有权；访问保持现状。在 UI 中，使用扩展查看器中的历史按钮检查版本、查看 diff 和恢复旧内容。

## Alpine.js 模式

扩展 HTML 使用 Alpine.js 指令实现响应性。无构建步骤，无导入。

| 指令            | 用途             | 示例                                        |
| --------------- | ---------------- | ------------------------------------------- |
| `x-data`        | 响应式状态对象   | `x-data="{ count: 0, items: [] }"`          |
| `x-init`        | 挂载时运行（获取数据） | `x-init="fetchData()"`                      |
| `x-show`        | 切换可见性       | `x-show="isOpen"`                           |
| `x-if`          | 条件渲染（template） | `<template x-if="loaded">...</template>`    |
| `x-for`         | 循环             | `<template x-for="item in items">...</template>` |
| `x-text`        | 设置文本内容     | `x-text="item.name"`                        |
| `x-html`        | 设置内部 HTML    | `x-html="item.richContent"`                 |
| `x-on:click`    | 事件处理器       | `x-on:click="count++"`                      |
| `x-model`       | 双向绑定         | `x-model="searchQuery"`                     |
| `x-bind:class`  | 动态类           | `x-bind:class="{ 'font-bold': active }"`    |

始终将 `x-if` 和 `x-for` 包裹在 `<template>` 标签中。

## 组件形状：内联 `x-data` vs. `Alpine.data()`

对于简单组件（几个状态字段、无方法、无字符串模板）内联 `x-data="{ count: 0, items: [] }"` 可以。**对于超出此范围的任何内容 — 多个方法、字符串格式化、分类逻辑、带分支的异步获取 — 将组件放在 `<script>` 块中并用 `Alpine.data()` 注册。** 内联形式是 HTML 属性中的字符串；它越长越脆弱（一个错误的引号、一个闭合标签形状的子字符串、一个模板字面量，属性就提前终止 — Alpine 然后评估一个半解析的表达式并抛出 `ReferenceError: <var> is not defined`）。

**对于任何非平凡扩展使用此模式：**

```html
<div x-data="customerAnalyzer" class="p-4">
  <button @click="analyze()" class="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground cursor-pointer">
    Analyze
  </button>
  <template x-if="error"><p class="text-red-500" x-text="error"></p></template>
  <template x-if="results">
    <div class="space-y-2">
      <div class="rounded-lg border p-3">
        <p class="font-medium">Action — Builder Side</p>
        <p class="text-sm text-muted-foreground" x-text="results.builderActions.length + ' items'"></p>
      </div>
      <!-- ...其他桶... -->
    </div>
  </template>
</div>

<script>
  document.addEventListener('alpine:init', () => {
    Alpine.data('customerAnalyzer', () => ({
      loading: false,
      error: '',
      results: null,
      async analyze() {
        this.loading = true;
        this.error = '';
        try {
          const { emails } = await appAction('list-emails', { view: 'inbox', limit: 50 });
          // ...分类为 3 个桶...
          this.results = {
            builderActions: emails.filter((e) => /* ... */),
            waitingOnCustomer: emails.filter((e) => /* ... */),
            fyi: emails.filter((e) => /* ... */),
          };
        } catch (e) {
          this.error = e?.message || 'Analysis failed';
        } finally {
          this.loading = false;
        }
      },
    }));
  });
</script>
```

**`x-data` / `x-*` 属性的硬性规则：**

- 永远不要在 HTML 属性内放置模板字面量（反引号）。使用字符串拼接或在脚本块中预格式化。反引号可能触发 HTML 解析器，而且结果字符串反正也不是 JS 模板字面量 — 属性作为纯文本读取。
- 永远不要内联放置多方法对象字面量。将方法移入 `Alpine.data()`。
- 在 `<script>` 块中，写正常 JS — 模板字面量、async/await、可选链都可以。
- 状态的一个事实来源：在 `Alpine.data()` 对象的初始状态上定义从任何 `x-text`、`x-show`、`x-if`、`x-for`、`:class` 等引用的每个变量。如果 `x-text="results.foo"` 引用 `results`，`results` 必须是数据对象的属性 — null 是一个很好的初始值，只要你用 `<template x-if="results">` 保护。
- 显示错误时，渲染 `error.message` 风格的文本，永远不要渲染原始布尔值。`x-text="error"` 仅在 `error` 是字符串时正确；如果是 `true`，用户会看到字面词"true"。

## 扩展中的 AI / LLM 功能

扩展可以通过两种方式做 AI 工作。慎重选择 — 静默回退最终会渲染出像字面文本 `true` 这样的无意义内容。

1. **委托给 Agent 聊天。** 如果用户说"分析我的邮件"、"总结这个"、"分类这些工单"且没有已配置的相关提供商 API 密钥，优先在 Agent 聊天中而不是扩展内完成工作。扩展可以有一个按钮调用 `parent.postMessage({ type: 'agent-native-send-to-chat', message: '...' })`，或者你可以在聊天中回答并跳过扩展。不要发布带有占位符 AI 步骤的扩展 — 那就是最终渲染出红色 `true` 的方式。
2. **通过 `extensionFetch` 直接调用 LLM。** 需要用户已设置的真实密钥。通过 `${keys.OPENAI_API_KEY}` / `${keys.ANTHROPIC_API_KEY}` 引用它，并在代理报告密钥未配置时显示清晰的错误。告诉用户在哪里添加密钥：工作区应用用 Dispatch Vault，独立应用用应用设置 → API 密钥和连接。

如果你不确定密钥是否已配置，在生成主要价值是 AI 步骤的扩展之前先询问用户。

## 扩展中的密钥和敏感数据

永远不要将真实 API 密钥、令牌、Webhook URL、签名密钥、私有 Builder/内部数据、客户数据或凭据外观的字面量放入扩展 HTML、内联脚本、文档、示例或扩展种子内容中。扩展存储在 SQL 中并在浏览器中渲染；写入扩展正文的所有内容都应被视为可见的。

对于外部 API 调用，使用 `extensionFetch()` 配合单引号字符串内的 `${keys.NAME}` 占位符，例如 `Authorization: 'Bearer ${keys.GITHUB_TOKEN}'`。代理在服务端解析值。如果用户未配置密钥，显示设置错误而不是替换复制的密钥或演示值。

## 指导原则

- **依赖默认画布内边距。** iframe 外壳添加适度的 body 内边距，因此简单扩展不会紧贴边缘。除非设计需要额外呼吸空间，否则不要添加外部 `p-4` / `p-6`。对于全出血扩展如地图、画布或自定义编辑器，在最外层元素上放置 `data-tool-layout="full-bleed"` 或 `data-tool-padding="none"`。（`data-tool-*` 属性名称保持与 iframe 运行时的向后兼容。）
- **使用语义 Tailwind 颜色实现原生主题。** 始终使用 `bg-background`、`text-foreground`、`bg-primary`、`text-primary-foreground`、`border-border`、`bg-muted`、`text-muted-foreground` 等。扩展继承父应用的确切主题变量，因此在亮色和暗色模式下都会看起来完全原生。
- **保持扩展专注。** 一个扩展，一个职责。"GitHub PR 仪表板"应该显示 PR，不应该同时管理问题。
- **处理加载和错误状态。** 在获取期间始终显示加载指示器并优雅地处理失败。
- **Alpine 表达式中引用的所有函数必须在 `x-data` 中定义。** 如果你使用 `@click="add()"`，组件的 `x-data` 对象中必须有 `add()` 方法。未定义的引用会导致运行时错误。
- **对于非平凡组件，使用 `<script>` + `Alpine.data('name', () => ({...}))` 块并用 `x-data="name"` 引用。** 内联 `x-data="{ ...大对象... }"` 很脆弱：将许多方法、分支逻辑或任何反引号模板字面量塞入 HTML 属性会导致半解析表达式和 `ReferenceError` 失败。参见上面的"组件形状"部分。
- **不要发布占位符 AI 步骤。** 如果扩展的价值是"AI 分析"且没有 LLM 密钥配置，要么将工作路由到 Agent 聊天，要么告诉用户添加哪个密钥 — 永远不要渲染占位符/布尔值作为结果。
- **永远不要硬编码密钥或私有数据。** 对外部凭据使用 `${keys.NAME}` 占位符，对演示使用合成示例数据。
- **使用正确的 fetch 辅助函数。** `appAction()` 用于应用 action 和应用数据，`appFetch()` 用于允许的框架 `/_agent-native/*` 端点，`extensionFetch()` 用于外部 API。永远不要从扩展调用模板 `/api/*` 路由，永远不要使用原始 `fetch()` — 密钥不会被注入且 CORS 会阻止外部 API。
- **`${keys.*}` 周围使用单引号**以防止浏览器端模板字面量评估。
- **编辑现有扩展时优先使用补丁而不是完整重写。** 较小的差异更不容易出错。

## 相关技能

- `extension-points` -- 扩展如何通过命名 UI 槽位在其他应用中渲染为小部件。
- `secrets` -- 创建和管理 `${keys.NAME}` 替换的 API 密钥。
- `sharing` -- 扩展的可见性和访问控制。
- `actions` -- 支持扩展 CRUD 和回滚的 `create-extension`、`update-extension` 和扩展历史 action。
- `frontend-design` -- 样式化扩展 HTML 时的设计指导。