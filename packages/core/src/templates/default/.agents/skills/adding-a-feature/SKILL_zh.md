---
name: adding-a-feature
description: >-
  每个新功能必须完成的四区域清单。在添加任何功能、集成或能力时使用，以确保代理和 UI 保持对等。
metadata:
  internal: true
---

# 添加功能 — 四区域清单

## 规则

每个新功能必须更新所有四个区域。跳过任何一个都会破坏 agent-native 契约 — 代理和 UI 必须始终是平等的伙伴。

## 原因

Agent-native 应用由对等性定义：UI 能做的一切，代理也能做，反之亦然。仅有 UI 的功能对代理不可见。仅有脚本的功能对用户不可见。没有应用状态同步的功能意味着代理对用户正在做什么一无所知。

## 清单

添加新功能时，按顺序完成这四个区域：

### 1. UI 组件

构建面向用户的界面 — 页面、组件、对话框或路由。使用 `@agent-native/core/client` 中的 `useActionQuery` 和 `useActionMutation` 调用 actions 进行数据获取和变更。不要为了 React 能调用 action 支持的数据而创建自定义 REST 端点；action 端点已经存在。

**代理写入时自动刷新是不可协商的** — 当代理变更数据时，UI 必须在不手动刷新的情况下反映更改。有两条路径，你必须选择正确的：

- **`useActionQuery` / `useActionMutation`** — 自动覆盖。框架的 `useDbSync` 在每个变更事件上使 `["action"]` 失效，因此每个 `useActionQuery` 钩子在代理活动时重新获取。无需额外布线。**优先使用此路径。**
- **带自定义键的原始 `useQuery`** — 需要显式布线。将 `@agent-native/core/client` 中的 `useChangeVersions([<source>, "action"])` 折叠到 `queryKey` 中并设置 `placeholderData: (prev) => prev`。`action` 源是可靠信号（代理运行器在每次成功工具调用后发出）；资源特定源（`"dashboards"`、`"analyses"`、`"settings"` 等）是额外的。没有此布线，代理写入在手动刷新之前不可见 — 这破坏了框架的第一承诺。

  ```tsx
  import { useChangeVersions } from "@agent-native/core/client";
  import { useQuery } from "@tanstack/react-query";

  const v = useChangeVersions(["dashboards", "action"]);
  useQuery({
    queryKey: ["dashboard", id, v],
    queryFn: () => fetchDashboard(id),
    placeholderData: (prev) => prev, // no flicker on refetch
  });
  ```

  完整模式和源目录见 `real-time-sync` 技能。

### 2. Action

使用 `defineAction` 在 `actions/` 中创建 action。这双重作用：代理将其作为工具调用，UI 通过 `useActionQuery` / `useActionMutation` 调用它，而框架拥有 HTTP 传输。读取 actions 设置 `http: { method: "GET" }`，写入保持默认，仅代理 actions 如 `navigate` 和 `view-screen` 设置 `http: false`。

在添加新路由或端点之前，检查现有 actions。如果 action 已覆盖业务操作则重用它，如果共享契约不完整则扩展它，如果代理和 UI 都需要该能力则创建新 `defineAction`。不要添加重新导出 actions 的传递 `/api/*` 路由。如果客户端代码需要新的框架/应用路由，先暴露命名的辅助函数或钩子，然后从组件和文档中使用该辅助函数。

对于提供商支持的分析/查询/报告集成，不要将每个提供商端点或过滤器转换为刚性 action。优先使用 `@agent-native/core/provider-api` 中的共享 `provider-api-catalog` / `provider-api-docs` / `provider-api-request` 模式，然后仅为真正值得一流快捷方式的工作流添加窄便利 actions。将此视为能力要求而非锦上添花：便利 actions 绝不能成为代理可以要求提供商做什么的上限。当响应可能对聊天上下文太大时，将广泛的提供商访问与暂存或沙箱化代码执行配对。如果提供商凭据存在于资源/共享行上，先添加限定范围的解析器，以便广泛访问保留与应用 UI 相同的所有权边界。

如果功能需要凭据，在同一变更中设计凭据路径。永远不要在 action、UI、种子数据、固件、文档、提示或生成的扩展/应用内容中硬编码 API 密钥、token、webhook URL、签名密钥、私有 Builder/内部数据或客户数据。注册所需的密钥，使用 OAuth 辅助函数，或从 vault/凭据存储读取限定范围的值。

**如果 action 产生或列出可导航的资源**，添加一个 `link` 构建器，返回 `{ url: buildDeepLink({ app, view, params }), label }`。外部编码代理和 MCP 宿主（Claude / ChatGPT / Claude Code / Cowork / Codex，通过 MCP/A2A）然后获得一个"在…中打开 →"深层链接，将用户带回运行中的 UI 聚焦于记录 — 免费的。如果兼容的 MCP 宿主应渲染内联审查/编辑界面，还添加 `mcpApp` 和 `embedApp()`，以便 action 嵌入真实的 React 应用路由而非一次性 HTML UI。`link` 构建器和 `mcpApp` 元数据必须是纯的和同步的（无 I/O）。任何外部代理读取/摄取 action 必须是 `http: { method: "GET" }` + `readOnly: true` + `publicAgent: { expose: true, readOnly: true, requiresAuth: true }`。见 `external-agents` 技能。

### 3. 技能 / 指令

如果功能引入了代理需要了解的模式，更新 `AGENTS.md` 和/或在 `.agents/skills/` 中创建技能。至少，将新 actions 添加到模板 `AGENTS.md` 中的 action 表。

可重用 actions 是应用契约的一部分，不仅仅是实现细节。当 action 在一个屏幕之外有用时，在同一变更中更新代理指令，以便应用代理知道何时调用它、哪些参数重要以及要保留什么输出。如果能力是工作流密集的、跨应用的、提供商支持的或具有不明显的 action 序列，添加或更新技能而非将行为埋在一个长 `AGENTS.md` 段落中。

指令示例可以命名密钥如 `SLACK_WEBHOOK`，但必须使用 `${keys.SLACK_WEBHOOK}` 或 `<SLACK_WEBHOOK>` 等占位符。不要在指令中粘贴真实密钥、内部数据或客户数据作为示例。

对于应用支持的技能，在应用技能清单中声明技能可见性：

- `internal` — 仅应用自己的代理应使用它。
- `exported` — 市场安装接收它，但应用不需要在内部加载它。
- `both` — 在应用的内部代理和导出的市场包之间共享。

### 4. 应用状态同步

暴露导航和选择状态，以便代理知道用户正在查看什么。在路由变更时写入 `navigation` 应用状态键。更新 `view-screen` action 以获取新功能的相关数据。如果代理需要打开新视图，添加 `navigate` 命令。

## 示例

### 向邮件应用添加"撰写邮件"

| 区域            | 要构建的内容                                                                            |
| --------------- | ---------------------------------------------------------------------------------------- |
| UI              | 带标签页、to/cc/bcc 字段、正文编辑器的撰写面板。使用 `useActionQuery`/`useActionMutation` 获取数据。 |
| Action          | `manage-draft` action（创建/更新/删除草稿），`send-email` action                 |
| Skills/AGENTS   | 在 AGENTS.md 中记录撰写状态形状、草稿生命周期、action 参数                  |
| 应用状态同步    | 每个草稿标签页的 `compose-{id}` 键，`navigation` 包含撰写状态              |

### 向表单应用添加"创建表单"

| 区域            | 要构建的内容                                                                            |
| --------------- | ---------------------------------------------------------------------------------------- |
| UI              | 带拖放字段、预览、设置的表单构建器页面。使用 `useActionQuery` 获取列表。 |
| Action          | `create-form` action，`update-form` action，`list-forms` action（GET）                    |
| Skills/AGENTS   | 在 AGENTS.md 中记录表单模式形状、字段类型、验证规则                   |
| 应用状态同步  | `navigation` 包含 `{ view: "form-builder", formId: "..." }`，`view-screen` 获取表单数据 |

### 向分析应用添加"图表类型"

| 区域            | 要构建的内容                                                                            |
| --------------- | ---------------------------------------------------------------------------------------- |
| UI              | 新图表组件，仪表板中的图表类型选择器                                    |
| Action          | `create-chart` 或 `update-dashboard` action，设置图表类型和配置              |
| Skills/AGENTS   | 记录支持的图表类型、配置选项、数据要求                        |
| 应用状态同步  | `navigation` 包含选定的图表/仪表板，`view-screen` 返回图表配置       |

## 添加新路由

模板是带客户端路由的单页应用。应用外壳（AgentSidebar + 顶级导航）必须在导航间持久 — 它挂载一次，要么在 `root.tsx` 中围绕 `<Outlet />`，要么通过所有认证路由嵌套其下的无路径 `_app.tsx` 布局路由。

**永远不要在每个新路由中包装自己的 `<AppLayout>` / `<Layout>`。** 这会导致 React 在每次导航时卸载整个应用外壳，重新加载代理侧栏并销毁进行中的工作。

- 如果模板在 `root.tsx` 中有 `<AppLayout>` — 只在新路由文件中渲染页面内容，没有其他。
- 如果模板有 `app/routes/_app.tsx`（无路径布局）— 将新路由命名为 `_app.<segment>.tsx` 以继承外壳，或裸 `<segment>.tsx` 用于不应有外壳的公共路由。
- 如果页面需要按路由数据（如高亮侧栏中的活动项），从 `useParams()` / `useLocation()` 在布局中读取。不要通过每个路由文件作为 prop 传递。

完整详情见根 `CLAUDE.md` 中的"客户端路由"部分。

## 反模式

- **按路由的 `<AppLayout>` 包装器** — 每个路由文件将其内容包装在 `<AppLayout>` 或 `<Layout>` 中。React 在每次导航时在 outlet 处看到不同的组件并卸载整个外壳，导致代理侧栏在每次点击时重新加载。在 `<Outlet />` 上方挂载外壳一次（root.tsx 或 `_app.tsx` 无路径布局）。
- **没有 actions 的 UI** — 用户可以创建表单但代理不能。代理说"我无法访问那个"，而它应该能够做到。
- **没有 AGENTS.md 的 Actions** — Actions 存在但代理不知道它们，因为它们没有被记录。代理重新发明解决方案而非使用 actions。
- **重复的 API 路由** — 为 actions 已处理的操作创建 `/api/` 路由，包括仅调用或重新打包 action 的传递路由。使用 `useActionQuery`/`useActionMutation` 代替。
- **原始客户端路由调用** — 在组件中教学或添加 `fetch("/_agent-native/...")`、`fetch(agentNativePath(...))` 或模板 `/api/*` 调用用于正常应用工作。添加命名的客户端辅助函数/钩子并调用它代替。
- **没有应用状态的功能** — 代理无法看到用户正在查看特定的表单、邮件或图表。它问"哪一个？"而非对当前选择采取行动。
- **没有 UI 的 Actions** — 代理可以做用户不能做的事情。这不太常见但仍然破坏对等性。

## 验证

完成所有四个区域后，验证：

1. 用户可以从 UI 执行操作吗？
2. 代理可以通过 actions 执行相同的操作吗？
3. 当用户使用功能时，`pnpm action view-screen` 显示相关状态吗？
4. 代理可以通过 `navigate` action 导航到功能视图吗？
5. 功能在 AGENTS.md 中有 action 名称和参数的文档吗？
6. 凭据和敏感数据仅通过批准的运行时渠道提供，没有硬编码的真实密钥、token、webhook URL、Builder/内部数据或客户数据吗？

## 还有一个区域 — 共享

如果功能存储**用户创作的资源**（文档、仪表板、表单、演示文稿等），使它们可拥有，以便它们免费获得默认私有语义和共享对话框。见 `sharing` 技能。

TL;DR：将 `ownableColumns()` 展开到资源表中，配对 `createSharesTable(...)`，调用 `registerShareableResource(...)`，用 `accessFilter` 包装列表/读取查询，用 `assertAccess` 保护写入，并在资源头部放置 `<ShareButton>`。`share-resource`、`unshare-resource`、`list-resource-shares` 和 `set-resource-visibility` actions 是框架范围自动挂载的。

## 相关技能

- **sharing** — 如何使新资源可拥有（默认私有，与用户/组织/公众共享）
- **context-awareness** — 如何向代理暴露 UI 状态（第 4 区域详情）
- **actions** — 如何使用 `defineAction` 和 `http` 选项创建 actions（第 2 区域详情）
- **external-agents** — 添加 `link` 构建器以便外部代理（MCP/A2A）获得"在…中打开 →"深层链接
- **create-skill** — 如何为新模式创建技能（第 3 区域详情）
- **storing-data** — 在哪里存储功能的数据
- **real-time-sync** — 代理写入数据时 UI 如何保持同步