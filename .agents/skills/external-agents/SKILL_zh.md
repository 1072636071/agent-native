---
name: external-agents
description: >-
  通过 MCP 将外部 agent 和 MCP 主机（Claude、Claude Desktop、Claude Code、
  ChatGPT 自定义 MCP 应用、Codex、Cursor、Claude Cowork、VS Code GitHub
  Copilot、Goose、Postman、MCPJam）连接到 agent-native 应用，并通过
  MCP Apps 和深度链接将产物往返回 UI。在添加 action 的 `link` 构建器或
  `mcpApp`、连接 `/_agent-native/open` 路由、向 MCP/A2A 暴露"ingest"
  action 或从外部 agent 脚手架应用时使用。
metadata:
  internal: true
---

# 外部 Agent（MCP 桥接 + 深度链接）

## 规则

Agent-native 应用可被任何 MCP 兼容的主机（Claude、Claude Desktop、Claude Code、ChatGPT 自定义 MCP 应用、Codex、Cursor、Cowork、VS Code GitHub Copilot、Goose、Postman、MCPJam 以及未来的标准客户端）访问。保持设置简单：对于工作区或跨应用访问，添加一个远程 MCP 连接器：`https://dispatch.agent-native.com/_agent-native/mcp`。Dispatch 的 Agents 页面控制该单个连接器是访问所有应用还是仅选定的应用，Dispatch 将 `list_apps`、`ask_app` 和 `open_app` 过滤到授权的集合。对于故意隔离的应用，直接在该应用添加：`https://<app>.agent-native.com/_agent-native/mcp` 或 `https://<your-host>/_agent-native/mcp`。

支持 OAuth 的主机应使用标准的远程 MCP OAuth 流程。Claude 连接器和 Claude Code `/mcp` 认证发现受保护资源，打开 Agent-Native 授权页面，并存储自己的令牌。ChatGPT 自定义 MCP 连接器使用相同的 URL：选择 OAuth，扫描/发现工具，登录并批准范围。本地 stdio 代理和较旧的客户端仍可使用 `npx @agent-native/core connect <url>`，它从已登录的浏览器会话铸造一个每用户、限定范围、可撤销的令牌；不复制共享秘密。

Claude 和 ChatGPT 可以缓存自定义连接器工具/资源元数据。在更改 MCP App 元数据或共享的 `embedApp()` 壳后，用新的工具调用验证；如果主机仍然表现得像旧描述符，重新连接 Claude 连接器或重新扫描/审查 ChatGPT 连接器。

一旦连接，每个产生或列出可导航资源的 action 应从 `link` 构建器返回深度链接，这样外部 agent 可以显示一个**"在 <app> 中打开 →"**链接，将用户带回运行中的 UI 的正确视图和记录。Action 还可以声明 `mcpApp`，这样支持 MCP Apps 的主机渲染内联交互预览。链接是纯指针——记录聚焦的写入始终限定范围为**浏览器会话**，而不是 agent 的令牌。

## 为什么

外部 agent 擅长产生产物（草稿、事件、仪表板），但它们生活在终端、聊天主机或另一个应用中。没有桥接，用户得到一堵 JSON 墙，必须自己去找到东西。MCP Apps 给兼容主机一个内联审查/编辑界面；深度链接桥接在其他地方通过给用户一个打开真实应用聚焦于确切产生内容的单一链接来闭环。它复用了 UI 已经每 2 秒排水的现有 `navigate` / `application_state` 契约（见 **context-awareness**）——我们永远不发明第二个导航机制。

## 如何

### 1. 连接到托管应用

使用一个连接器进行正常工作区访问：

```text
https://dispatch.agent-native.com/_agent-native/mcp
```

然后打开 Dispatch → Agents 选择网关是暴露每个应用还是仅选定的应用 ID。外部 agent 调用 `list_apps` 查看授权集合，`ask_app` 通过 A2A 将自然语言任务路由到授权应用，`open_app` 返回深度链接或内联应用预览。

仅当你故意想要一个隔离的应用时才使用直接应用 URL：

```text
https://mail.agent-native.com/_agent-native/mcp
https://<your-app>.agent-native.com/_agent-native/mcp
```

Claude / Claude Desktop：用 URL 添加自定义连接器，点击 Connect，然后登录并批准 `mcp:read`、`mcp:write` 和 `mcp:apps`。Claude Code：添加相同的远程 HTTP URL，需要时重启，运行 `/mcp`，选择 Authenticate。ChatGPT：创建自定义 MCP 连接器/应用，粘贴相同的 URL，选择 OAuth，扫描/发现工具，然后登录并批准范围。每个主机存储自己的 OAuth 令牌；MCP App iframe 永远不会接收原始令牌，因为主机通过认证的 MCP 连接中介工具和资源调用。

对于本地 stdio 代理、Codex/Cowork 兼容性或没有远程 MCP OAuth 的客户端，使用托管连接后备：

```bash
npx @agent-native/core@latest connect https://dispatch.agent-native.com
# 或，对于隔离的应用：
npx @agent-native/core@latest connect https://mail.agent-native.com
```

该命令在浏览器中打开应用，用户点击 **Authorize**，一个每用户、限定范围、可撤销的令牌被写入选定的客户端配置。无 CLI 的等效方式是 `https://<app>/_agent-native/mcp/connect`，它显示可复制的 MCP URL、Claude / ChatGPT / Cursor / Claude Code / Codex / Other 步骤，以及需要它的客户端的静态令牌后备。

在旧的 Claude bearer-token 条目上重新运行 `npx @agent-native/core@latest connect <url> --client claude-code` 是迁移路径：CLI 用仅 URL 的 OAuth 配置替换 `Authorization` 头，并告诉用户从 `/mcp` 进行认证。

要在不重新安装 skill 或连接器的情况下重新认证已安装的本地/后备客户端，使用：

```bash
npx -y @agent-native/core@latest reconnect https://dispatch.agent-native.com --client codex
# 或：
npx -y @agent-native/core@latest connect reconnect https://dispatch.agent-native.com --client codex
```

没有 URL 时，`reconnect` 在本地客户端配置中搜索现有的 Agent Native MCP 条目。有 URL 时，它只重新连接已经有该 MCP URL 的客户端；传递 `--client` 限制搜索哪些配置。仅当需要强制自定义服务器名称时传递 `--name <serverName>`。

底层：已登录的浏览器会话铸造一个携带调用者 `sub` + `org_domain` 和唯一 `jti` 的 `A2A_SECRET` 签名 JWT，这样工具运行通过 `runWithRequestContext` 保持租户范围。现有的 `/_agent-native/mcp` 端点像任何 bearer 一样接受它——没有新端点。相同的 Connect 页面按 `jti` 列出和撤销铸造的令牌；将它们视为个人访问令牌。不暴露部署的共享秘密。

### 1a. 通用跨应用动词 + 脚手架

一旦连接，在每 action 工具之上，MCP 服务器还暴露一个稳定的动词集（见 `packages/core/src/mcp/builtin-tools.ts`），这样外部 agent 有一个可预测的面，而无需猜测每应用的 action 名称：

- `list_apps`——工作区应用 + 它们的 URL / 运行状态。
- `open_app({ app, view?, path?, params?, embed? })`——返回深度链接或直接同源应用路由（无用户数据副作用）；显示为"打开……"链接，并在 `embed: true` 时，在兼容主机中显示内联全应用 MCP App。
- `ask_app({ app, message })`——将自然语言任务路由到该应用的应用内 agent（委托给现有的 `ask-agent` 元工具）。
- `create_workspace_app({ name, template })`——通过工作区路径脚手架 + 启动新应用（拒绝非白名单模板），返回其运行 URL + 深度链接。
- `list_templates`——仅白名单模板。

同名模板 action 覆盖内置（模板优先于核心）。使用 `MCPConfig.builtinCrossAppTools: false` 禁用该集合。

广告的 `tools/list` 和 `resources/list` 目录对于 ChatGPT/Claude 风格的应用主机默认故意很小，包括 OAuth MCP Apps 调用者和通用认证远程 HTTP/静态令牌调用者。模型看到通用面向应用的动词（`list_apps`、`open_app`、`ask_app` 和仅应用的 `create_embed_session`）并通过 `open_app({ embed: true })` 路由 UI。明确标识为开发者客户端的 Stdio/代码客户端保持完整的连接 action 面，`publicAgent.expose` 仍然是紧凑 MCP Apps 目录之外安全读取/摄取工具的选择加入。不要依赖特定 action 的 `mcpApp` 资源默认出现在 ChatGPT/Claude 发现中；使用 `open_app` 作为一等应用嵌入路径。如果特定 action 确实必须在该紧凑应用主机目录中保持可见，设置 `mcpApp.compactCatalog: true` 作为罕见的逃生舱口。

### 1b. MCP Apps 主机的快速路径期望

保持 ChatGPT/Claude 路径短。对于已知的面向应用的意图，外部 agent 应调用创建或打开东西的特定 action，然后让 MCP App 启动路由。**不要**通过 `ask_app`、广泛的 `list_resources` 或通用应用 agent 委托路由简单的 UI 交接，仅仅为了找到一个屏幕。

预期形状：

- 邮件草稿：`manage_draft` → 内联 Mail 撰写路由。小部件自己调用 `create_embed_session`。
- 仪表板/过滤器/搜索：`open_app({ path, embed: true })` 或带 `mcpApp` 的仪表板 action → 内联全应用/仪表板路由。
- 日历邀请：`manage-event-draft` → 内联 Calendar 事件草稿路由。
- 表单/内容/幻灯片/设计/片段：带 `mcpApp` 的创建/搜索 action → 内联编辑器/播放器路由。

当模型真正需要在授权应用之间选择时，`list_apps` 是可以的。`resources/list`/`resources/read` 是 MCP Apps UI 资源的主机管道；它们不是规划策略。如果主机/模型在明显的面向应用的 action 之前反复调用大型发现工具，收紧 action 名称、描述、`mcpApp` 元数据或紧凑目录过滤，直到直接路径变得明显。

### 2. 向 action 添加 `link` 构建器

`defineAction` 接受一个可选的 `link` 构建器。设置后，该工具的每个 MCP/A2A 结果自动追加一个 markdown `[label →](absoluteUrl)` 块和一个结构化的 `_meta["agent-native/openLink"] = { label, view, webUrl, desktopUrl, vscodeUrl }`；`tools/list` 添加 `annotations["agent-native/producesOpenLink"]` 加上描述后缀，这样外部 agent 知道该工具产生可打开的链接。

真实示例——mail 的 `manage-draft`（`templates/mail/actions/manage-draft.ts`）：

```ts
import { buildDeepLink } from "@agent-native/core/server";

function composeDeepLink(draft: Record<string, string>): string {
  return buildDeepLink({
    app: "mail",
    view: "inbox",
    compose: encodeComposeDraft(draft), // base64url JSON → compose-<id> draft
  });
}

export default defineAction({
  // ...schema, run...
  link: ({ result }) => {
    if (!result || typeof result !== "object") return null;
    const draft = (result as { draft?: Record<string, string> }).draft;
    const id = (result as { id?: string }).id;
    if (!draft || !id) return null;
    return { url: composeDeepLink(draft), label: "Open draft in Mail", view: "inbox" };
  },
});
```

列表/搜索 action 以相同方式指向记录聚焦的视图——mail 的 `list-emails` 返回 `{ url: buildDeepLink({ app: "mail", view: "inbox", params: { label, search } }), label: "Open list in Mail" }`。

**`link` 契约：** 纯函数、同步、**无 I/O、无 await**。它以尽力而为的方式运行——抛出、`null` 或 `undefined` 被吞掉，**永远不会**导致工具调用失败。它只读取调用的 `args` 和 `result`；它不得查询数据库、读取应用状态或调用其他 action。

### 2a. 可选 MCP Apps UI

对于支持 MCP Apps 扩展的主机，action 还可以用 `mcpApp` 广告内联 UI 资源。这是对外部 agent 应给用户交互界面而不是仅文本的流程的渐进增强——例如审查邮件草稿、编辑日历邀请或在生成的仪表板变体之间选择。

当用户需要 UI 时，使用真实 React 应用配合 `embedApp()`。心智模型很简单：action 的 `link` 目标也是 MCP App 嵌入目标。将操作暴露为普通 action/工具，用 `link` 返回聚焦的深度链接，并添加 `mcpApp.resource = embedApp(...)`，这样兼容主机内联加载相同路由而不是打开新标签。即使添加了 `mcpApp`，也保留 `link` 后备——非 UI 客户端仍然需要"在……中打开 →"链接。

```ts
import { embedApp } from "@agent-native/core";

export default defineAction({
  // ...schema, run, link...
  mcpApp: {
    resource: embedApp({
      title: "Review draft",
      description: "Open the generated draft in the real Mail compose UI.",
      iframeTitle: "Agent-Native Mail",
      openLabel: "Open in Mail",
    }),
  },
});
```

不要为产品 UI 手写一次性纯 HTML MCP Apps；如果 action 需要自定义界面，先添加或复用真实的应用路由/组件并嵌入该路由。对于已知的一等交接，优先使用带 `mcpApp` 的直接 action（如 Mail `manage-draft`、Calendar `manage-event-draft`）而不是让模型在屏幕间搜索；`open_app({ path, embed: true })` 是全仪表板、过滤收件箱、分析或扩展页面的通用逃生舱口。

主机桥接（Claude 移植 vs ChatGPT `window.openai`）、嵌入启动票据、聊天嵌入内的扩展页面 `srcDoc` 渲染、主机尺寸调整（`embedApp({ height })`）、`sendToAgentChat`、`_meta.ui.domain` 规则和 ngrok/生产测试注意事项文档在 **`references/mcp-apps-embedding.md`** 中。在更改 `embedApp()` 壳、`ui://` 资源或任何主机桥接行为之前阅读它。

### 3. `/_agent-native/open` 路由

`buildDeepLink(...)` 返回应用相对路径 `/_agent-native/open?app=…&view=…&<recordId>=…`。MCP 层将其转换为绝对 Web URL（`toAbsoluteOpenUrl`，使用请求来源）、桌面 `agentnative://open?…` URL（`toDesktopOpenUrl`）和 VS Code 扩展 URL（`toVsCodeOpenUrl`）用于 `vscode://builderio.agent-native/open?url=…`。当用户在任何浏览器或内联 webview 中点击 Web 链接时，`GET /_agent-native/open`（`createOpenRouteHandler`，由核心路由插件挂载，由 `disableOpenRoute` 门控，可通过 `resolveOpenPath` 自定义）：

1. 通过 `getSession` 解析**浏览器**会话（认证守卫绕过确切路径 `/_agent-native/open`）。
2. 如果未认证，在**相同 URL** 提供配置的登录 HTML（`getConfiguredLoginHtml`）；表单的成功处理器重新加载 `window.location`，以认证状态重新进入路由——无需 `?next=` 管道。
3. 写入现有的一次性 `navigate` 应用状态命令（负载 = 每个非保留查询参数 + `view`），限定范围为浏览器会话的邮箱，使用 `requestSource: "deep-link"`，并将 `compose` base64url 草稿解码为 `compose-<id>` 键。
4. 302 重定向到安全的同源相对路径（`to=`，否则 `/<view>`，否则 `resolveOpenPath`），转发 `f_*` 过滤参数，这样列表/仪表板在 `navigate` 命令被排空之前就打开预过滤状态。

跨源、方案相对 `//host` 和控制字符重定向被拒绝（开放重定向守卫）。**身份规则：** 链接不携带特权状态——它只是 `view` + 记录 ID + 过滤器。记录聚焦的 `navigate` 写入限定范围为浏览器中登录的人，而不是外部 agent 的 MCP 令牌。见 **context-awareness** 了解此桥接到的 `navigate`/`application_state` 契约。

### 4. 外部 agent 的"Ingest" action

外部 agent 读取以将实时应用状态拉入其自己上下文的 action 必须是：`http: { method: "GET" }` + `readOnly: true` + `publicAgent: { expose: true, readOnly: true, requiresAuth: true }`。GET + `readOnly` 保持它无副作用且不在屏幕刷新变更事件中；`publicAgent` 是显式选择加入（公共 Web 路由永远不意味着公共 MCP/A2A 暴露）。设计/内容摄取 action 必须读取**实时**状态（如 Yjs 文档）——而不是陈旧的 DB 快照列——这样外部 agent 看到用户实际在屏幕上拥有的内容。

### 5. 高级：本地开发与手动设置

上面托管的 `connect` 流程是推荐路径。对于本地开发，运行应用（`pnpm dev` / `pnpm exec agent-native dev`）然后将本地 agent 指向它：

```bash
pnpm exec agent-native mcp install --client claude-code|claude-code-cli|codex|cowork|cursor|opencode|github-copilot \
  [--app <id>] [--scope user|project]
```

它配置一个令牌（本地开发的随机 `ACCESS_TOKEN` 到工作区 `.env`，或检测到的托管来源的 `signA2AToken` JWT）并写入一个幂等的 stdio 服务器条目——Claude Code 的 `.mcp.json` / `~/.claude.json`，Codex 的 `~/.codex/config.toml` 中的 `[mcp_servers.*]` 块，Cursor 的 `.cursor/mcp.json` / `~/.cursor/mcp.json`，OpenCode 的 `opencode.json` / `~/.config/opencode/opencode.json`，GitHub Copilot / VS Code 的 `.vscode/mcp.json` / VS Code 用户 `mcp.json`，以及 Cowork 的 Claude-Code JSON 形状。该条目运行 `pnpm exec agent-native mcp serve --app <id>`，默认是运行中本地应用的 `/_agent-native/mcp` 的**薄 stdio 代理**（实时注册表 + HMR + 正确的深度链接保持单一真实来源；`--standalone` 在进程中构建注册表）。配套子命令：`mcp uninstall`、`mcp status`、`mcp token [--rotate]`。你也可以手写一个 `http` `.mcp.json` 条目，使用你自己提供的令牌——这是 `connect` 写入内容的非托管等效。

**开发 vs 生产工具面：** 在普通本地开发中（`NODE_ENV=development` 且 `AGENT_MODE !== "production"`），MCP `tools/list` 故意只暴露通用内置加上 `publicAgent.requiresAuth === false` 的 action——每应用摄取（`requiresAuth: true`）和变更 action 被过滤掉（`filterPublicAgentActions`）。完整面在作为真实调用者认证时出现：部署的 / `AGENT_MODE=production` 应用，或通过 `connect` / `pnpm exec agent-native mcp install` 访问的本地应用（它配置一个身份承载令牌）。稀疏或空的 `tools/list` 是诊断性的，不是认证失败的证明：在告诉用户他们未认证之前检查 OAuth 范围、紧凑目录过滤和客户端/服务器认证状态。

## 应该做

- 使用 `npx @agent-native/core@latest connect https://dispatch.agent-native.com` 将本地/后备客户端连接到 Dispatch；使用 `npx -y @agent-native/core@latest reconnect ...` 进行重新认证而无需重新安装；仅当主机应隔离到一个应用时使用直接应用 URL。
- 为任何产生或列出可导航资源（草稿、事件、仪表板、文档）的 action 添加 `link` 构建器。
- 当支持 UI 的 MCP 主机应渲染内联审查或编辑界面时添加 `mcpApp`，同时保留 `link` 后备。
- 当正确的 UI 是特定路由上的现有 React 应用时，使用 `embedApp()` / `open_app({ embed: true })`，包括全应用路由和聚焦的组件路由如 Analytics 图表嵌入。
- 在任何资源壳或主机桥接变更后用新的内联渲染测试真实的 ChatGPT/Claude Web 行为；旧帧不是新壳仍然损坏的证明。
- 使用 `buildDeepLink(...)` 构建 URL——它是开放路由格式的单一真实来源。
- 保持 `link` 纯函数和同步；当没有可打开的内容时返回 `null`。
- 保持 `link` 和 `mcpApp` 元数据纯函数和同步；使用 `embedApp()` 以便用户看到共享的 React UI。
- 使外部 agent 读取/摄取 action 为 GET + `readOnly` + `publicAgent`，并读取实时（Yjs）状态，而不是陈旧的 DB 列。
- 让开放路由解析浏览器会话；将记录 ID 作为深度链接参数传递，让 UI 通过轮询的 `navigate` 命令聚焦它们。

## 不应该做

- 当 `connect` 可以铸造每用户、可撤销的令牌时，不要将部署的共享 `ACCESS_TOKEN` / `A2A_SECRET` 复制到客户端配置中。
- 不要手格式化 `/_agent-native/open` URL——始终通过 `buildDeepLink`。
- 不要在 `link` 构建器内部做 I/O、await、DB 读取或应用状态读取。
- 不要用 MCP Apps 替换深度链接；非 UI 客户端仍然需要链接。
- 不要在 `mcpApp.resource.html` 中手写产品 UI；使用真实的 React 路由/组件并用 `embedApp()` 嵌入它。
- 不要对原始 Vite 开发模块测试 Claude 全应用嵌入并得出生产已损坏的结论；使用 `pnpm exec agent-native start`、预览部署或生产环境。
- 不要将 `navigate` 写入限定范围为 agent 令牌，或通过深度链接传递特权状态——它是纯指针。
- 不要发明新的导航机制；桥接到现有的 `navigate`/`application_state` 契约。
- 从外部 agent 脚手架应用时不要扩大公共模板白名单——`packages/shared-app-config/templates.ts` 中的白名单是权威的且受守卫的。

## 相关 Skill

- **actions**——定义 action、`publicAgent`、GET/`readOnly`
- **context-awareness**——开放路由桥接到的 `navigate` / `application_state` 契约
- **a2a-protocol**——`ask-agent` 元工具和 JSON-RPC 对等调用
- **adding-a-feature**——四方面检查清单（当功能产生可导航资源时添加 `link` 构建器）

## 蓝图安装器

要以 agent-native 的方式添加全新的集成，`agent-native add <kind> <name|url>` 向标准输出打印一个精选的 Markdown 蓝图——将其管道到你连接的外部编码 agent（`agent-native add provider stripe | claude`），它将对实时仓库应用变更。URL 发出一个通用的研究并集成蓝图代替。预设种类：`provider` / `channel` / `sandbox` / `action`。通过在 `packages/core/blueprints/<kind>/` 中放置 `.md` 文件添加你自己的。见蓝图安装器文档。