---
name: adding-a-feature
description: >-
  每个新功能必须完成的四方面检查清单。在添加任何功能、集成或能力时使用，
  以确保 agent 和 UI 保持对等。
metadata:
  internal: true
---

# 添加功能——四方面检查清单

## 规则

每个新功能必须更新所有四个方面。跳过任何一个都会破坏 agent-native 契约——agent 和 UI 必须始终是平等的伙伴。

## 为什么

Agent-native 应用由对等性定义：UI 能做的一切，agent 也能做，反之亦然。仅有 UI 的功能对 agent 不可见。仅有脚本的功能对用户不可见。没有应用状态同步的功能意味着 agent 对用户正在做的事情一无所知。

## 检查清单

添加新功能时，按顺序完成这四个方面：

### 1. UI 组件

构建面向用户的界面——页面、组件、对话框或路由。使用 `@agent-native/core/client` 中的 `useActionQuery` 和 `useActionMutation` 调用 action 进行数据获取和变更。不要为了 React 能调用 action 支持的数据而创建自定义 REST 端点；action 端点已经存在。

**Agent 写入时自动刷新是不可协商的**——当 agent 变更数据时，UI 必须在不手动刷新的情况下反映变更。有两条路径，你必须选择正确的：

- **`useActionQuery` / `useActionMutation`**——自动覆盖。框架的 `useDbSync` 在每个变更事件上使 `["action"]` 失效，因此每个 `useActionQuery` hook 在 agent 活动时重新获取。无需额外接线。**优先使用此路径。**
- **带自定义键的原始 `useQuery`**——需要显式接线。将 `@agent-native/core/client` 中的 `useChangeVersions([<source>, "action"])` 折叠到 `queryKey` 中并设置 `placeholderData: (prev) => prev`。`action` 源是可靠信号（agent 运行器在每次成功工具调用后发出它）；资源特定源（`"dashboards"`、`"analyses"`、`"settings"` 等）在发出时是额外的。没有此接线，agent 写入在手动刷新之前将不可见——这破坏了框架的第一承诺。

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

  参见 `real-time-sync` skill 获取完整模式和源目录。

### 2. Action

在 `actions/` 中使用 `defineAction` 创建 action。这具有双重职责：agent 将其作为工具调用，UI 通过 `useActionQuery` / `useActionMutation` 调用，而框架拥有 HTTP 传输。读取 action 设置 `http: { method: "GET" }`，写入保留默认值，或为仅 agent 的 action（如 `navigate` 和 `view-screen`）设置 `http: false`。

在添加新路由或端点之前，检查现有 action。如果 action 已覆盖业务操作则复用它，
如果共享契约不完整则扩展它，如果 agent 和 UI 都需要该能力则创建新的
`defineAction`。不要添加重新导出 action 的透传 `/api/*` 路由。如果客户端
代码需要新的框架/应用路由，先暴露命名的辅助函数或 hook，然后从组件和文档中
使用该辅助函数。

对于提供商支持的分析/查询/报告集成，不要将每个提供商端点或过滤器转换为
刚性 action。优先使用 `@agent-native/core/provider-api` 中的共享
`provider-api-catalog` / `provider-api-docs` / `provider-api-request` 模式，
然后仅为真正值得一等快捷方式的工作流添加窄便利 action。将此视为
能力要求，而非锦上添花：便利 action 绝不能成为 agent 能要求提供商做的事情的
上限。当响应可能对聊天上下文过大时，将广泛的提供商访问与暂存或沙箱化
代码执行配对。如果提供商凭证存在于资源/共享行上，先添加限定范围的
解析器，以便广泛访问保留与应用 UI 相同的所有权边界。

如果功能需要凭证，在同一变更中设计凭证路径。
永远不要在 action、UI、种子数据、夹具、文档、prompt 或生成的扩展/应用内容中
硬编码 API 密钥、令牌、webhook URL、签名密钥、私有 Builder/内部数据或客户数据。
注册所需的 secrets，使用 OAuth 辅助函数，或从 vault/credential 存储读取限定范围的值。

**如果 action 产生或列出可导航的资源**，添加一个 `link` 构建器，返回 `{ url: buildDeepLink({ app, view, params }), label }`。外部编码 agent 和 MCP 主机（Claude / ChatGPT / Claude Code / Cowork / Codex，通过 MCP/A2A）然后会显示一个"在……中打开 →"的深度链接，将用户带回聚焦于记录的运行 UI——免费获得。如果兼容的 MCP 主机应渲染内联审查/编辑界面，还需添加 `mcpApp` 配合 `embedApp()`，这样 action 嵌入真实的 React 应用路由而不是一次性 HTML UI。`link` 构建器和 `mcpApp` 元数据必须是纯函数且同步的（无 I/O）。任何外部 agent 读取/摄取 action 必须是 `http: { method: "GET" }` + `readOnly: true` + `publicAgent: { expose: true, readOnly: true, requiresAuth: true }`。参见 `external-agents` skill。

### 3. Skill / 指令

如果功能引入了 agent 需要知道的模式，更新 `AGENTS.md` 和/或在 `.agents/skills/` 中创建 skill。至少，将新 action 添加到模板 `AGENTS.md` 中的 action 表。

可复用的 action 是应用契约的一部分，而不仅仅是实现细节。当 action 在一个屏幕之外有用时，在同一变更中更新 agent 指令，以便应用 agent 知道何时调用它、哪些参数重要以及保留什么输出。如果能力是工作流密集的、跨应用的、提供商支持的或具有非显而易见的 action 序列，添加或更新 skill，而不是将行为埋在一个冗长的 `AGENTS.md` 段落中。

指令示例可以命名密钥如 `SLACK_WEBHOOK`，但必须使用
如 `${keys.SLACK_WEBHOOK}` 或 `<SLACK_WEBHOOK>` 的占位符。不要将
真实密钥、内部数据或客户数据粘贴到指令中作为示例。

对于应用支持的 skill，在应用 skill 清单中声明 skill 可见性：

- `internal`——仅应用自己的 agent 应使用它。
- `exported`——市场安装接收它，但应用不需要在内部加载它。
- `both`——在应用的内部 agent 和导出的市场包之间共享。

### 4. 应用状态同步

暴露导航和选择状态，以便 agent 知道用户正在查看什么。在路由变更时写入 `navigation` 应用状态键。更新 `view-screen` action 以获取新功能的相关数据。如果 agent 需要打开新视图，添加 `navigate` 命令。

## 示例

### 为邮件应用添加"撰写邮件"

| 方面            | 要构建的内容                                                                              |
| --------------- | ---------------------------------------------------------------------------------------- |
| UI              | 带标签页的撰写面板、to/cc/bcc 字段、正文编辑器。使用 `useActionQuery`/`useActionMutation` 获取数据。 |
| Action          | `manage-draft` action（创建/更新/删除草稿）、`send-email` action                         |
| Skill/AGENTS    | 在 AGENTS.md 中文档化撰写状态形状、草稿生命周期、action 参数                              |
| 应用状态同步    | 每个草稿标签页的 `compose-{id}` 键，`navigation` 包含撰写状态                             |

### 为表单应用添加"创建表单"

| 方面            | 要构建的内容                                                                              |
| --------------- | ---------------------------------------------------------------------------------------- |
| UI              | 带拖放字段、预览、设置的表单构建器页面。使用 `useActionQuery` 获取列表。                   |
| Action          | `create-form` action、`update-form` action、`list-forms` action（GET）                    |
| Skill/AGENTS    | 在 AGENTS.md 中文档化表单 schema 形状、字段类型、验证规则                                  |
| 应用状态同步    | `navigation` 包含 `{ view: "form-builder", formId: "..." }`，`view-screen` 获取表单数据    |

### 为分析应用添加"图表类型"

| 方面            | 要构建的内容                                                                              |
| --------------- | ---------------------------------------------------------------------------------------- |
| UI              | 新图表组件，仪表板中的图表类型选择器                                                       |
| Action          | `create-chart` 或 `update-dashboard` action，设置图表类型和配置                            |
| Skill/AGENTS    | 文档化支持的图表类型、配置选项、数据需求                                                   |
| 应用状态同步    | `navigation` 包含选定的图表/仪表板，`view-screen` 返回图表配置                             |

## 添加新路由

模板是使用客户端路由的单页应用。应用壳（AgentSidebar + 顶级导航）必须在导航间持久——它只挂载一次，要么在 `root.tsx` 中围绕 `<Outlet />`，要么通过所有认证路由嵌套其下的无路径 `_app.tsx` 布局路由。

**永远不要在每个新路由中包裹自己的 `<AppLayout>` / `<Layout>`。** 这会导致 React 在每次导航时卸载整个应用壳，重新加载 agent 侧边栏并破坏进行中的工作。

- 如果模板在 `root.tsx` 中有 `<AppLayout>`——只需在新路由文件中渲染页面内容，不需要其他。
- 如果模板有 `app/routes/_app.tsx`（无路径布局）——将新路由命名为 `_app.<segment>.tsx` 以继承壳，或裸 `<segment>.tsx` 用于不应有壳的公共路由。
- 如果页面需要每路由数据（例如侧边栏中高亮活动项），从布局中的 `useParams()` / `useLocation()` 读取。不要通过每个路由文件作为 prop 传递。

完整细节见根 `CLAUDE.md` 中的"Client-Side Routing"部分。

## 反模式

- **每路由的 `<AppLayout>` 包装器**——每个路由文件将其内容包裹在 `<AppLayout>` 或 `<Layout>` 中。React 在每次导航时在 outlet 位置看到不同的组件并卸载整个子树，导致 agent 侧边栏在每次点击时重新加载。在 `<Outlet />` 上方挂载壳一次（root.tsx 或 `_app.tsx` 无路径布局）。
- **没有 action 的 UI**——用户可以创建表单但 agent 不能。Agent 说"我无法访问那个"，而它应该能够做到。
- **没有 AGENTS.md 的 action**——action 存在但 agent 不知道，因为它们没有被文档化。Agent 重新发明解决方案而不是使用 action。
- **重复的 API 路由**——为 action 已处理的操作创建 `/api/` 路由，包括只是调用或重新打包 action 的透传路由。使用 `useActionQuery`/`useActionMutation` 代替。
- **原始客户端路由调用**——在组件中为正常应用工作教学或添加 `fetch("/_agent-native/...")`、`fetch(agentNativePath(...))` 或模板 `/api/*` 调用。添加命名的客户端辅助函数/hook 并调用它代替。
- **没有应用状态的功能**——Agent 无法看到用户正在查看特定的表单、电子邮件或图表。它问"哪一个？"而不是对当前选择进行操作。
- **没有 UI 的 action**——Agent 能做用户不能做的事。这不太常见但仍然破坏对等性。

## 验证

完成所有四个方面后，验证：

1. 用户能否从 UI 执行操作？
2. Agent 能否通过 action 执行相同操作？
3. 当用户使用功能时，`pnpm action view-screen` 是否显示相关状态？
4. Agent 能否通过 `navigate` action 导航到功能视图？
5. 功能是否在 AGENTS.md 中用 action 名称和参数进行了文档化？
6. 凭证和敏感数据是否仅通过批准的运行时通道提供，没有硬编码的真实密钥、
   令牌、webhook URL、Builder/内部数据或客户数据？

## 还有一个方面——共享

如果功能存储**用户创作的资源**（文档、仪表板、表单、幻灯片等），使其可拥有，这样它们就能获得默认私有的语义和免费的共享对话框。参见 `sharing` skill。

简要说明：将 `ownableColumns()` 展开到资源表中，配合 `createSharesTable(...)`，调用 `registerShareableResource(...)`，用 `accessFilter` 包装列表/读取查询，用 `assertAccess` 保护写入，并在资源头部放置 `<ShareButton>`。`share-resource`、`unshare-resource`、`list-resource-shares` 和 `set-resource-visibility` action 是框架范围自动挂载的。

## 相关 Skill

- **sharing**——如何使新资源可拥有（默认私有，与用户/组织/公众共享）
- **context-awareness**——如何向 agent 暴露 UI 状态（第 4 方面详情）
- **actions**——如何使用 `defineAction` 和 `http` 选项创建 action（第 2 方面详情）
- **external-agents**——添加 `link` 构建器，使外部 agent（MCP/A2A）获得"在……中打开 →"深度链接
- **create-skill**——如何为新模式创建 skill（第 3 方面详情）
- **storing-data**——功能的数据存储在哪里
- **real-time-sync**——当 agent 写入数据时 UI 如何保持同步