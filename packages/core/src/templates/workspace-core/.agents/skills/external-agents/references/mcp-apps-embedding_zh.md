# MCP Apps 嵌入内部机制

可选 MCP Apps UI 界面的深入参考——`mcpApp` action 字段、`embedApp()`、宿主桥接（Claude / ChatGPT）、嵌入启动票据、聊天嵌入内的扩展页面渲染，以及宿主尺寸调整。有关常见情况（添加 `link` 构建器、连接宿主、ingest action、`/_agent-native/open` 路由），请参阅 `../SKILL_zh.md`。本文件是该技能"可选 MCP Apps UI"部分的扩展。

## 可选 MCP Apps UI

对于支持 MCP Apps 扩展的宿主，action 还可以通过 `mcpApp` 广告内联 UI 资源。这是对外部 agent 应该为用户提供交互界面而非仅文本的流程的渐进增强——例如审查邮件草稿、编辑日历邀请或在生成的仪表板变体之间选择。

当用户需要 UI 时，使用真实的 React 应用和 `embedApp()`。心智模型很简单：action 的 `link` 目标也是 MCP App 嵌入目标。将操作暴露为普通 action/tool，用 `link` 返回聚焦的深度链接，并添加 `mcpApp.resource = embedApp(...)` 以便有能力的宿主内联加载同一路由而非打开新标签页。

`embedApp()` 支持两种宿主桥接。标准 MCP Apps 宿主使用 `ui/*` 桥接；ChatGPT 使用 `window.openai` 兼容性桥接，读取 `toolInput` / `toolOutput` / `toolResponseMetadata` 并通过 `window.openai.callTool(...)` 调用 `create_embed_session`。不要构建仅 ChatGPT 的 HTML 界面。保持 action 结果和 `link` 目标聚焦，以便两种桥接都落在相同的真实应用路由上。

这意味着全应用嵌入一旦打开就可以做路由能做的任何事情：审查或编辑邮件草稿、显示过滤的收件箱/搜索、打开日历事件或事件草稿、加载扩展页面、检查完整的分析仪表板或保存的分析、在幻灯片编辑器中继续幻灯片组，或打开设计项目/编辑器。优先使用 URL/深度链接参数和现有的 `/_agent-native/open` 导航/app-state 桥接，而非为 MCP Apps 发明第二个状态协议。

在极少数情况下，正确的目标是渲染一个共享 React 组件而非整个应用外壳的聚焦应用路由。Analytics 的 `/chart` 路由是模型：它在 URL 中接收紧凑的 `SqlPanel` 载荷并渲染仪表板使用的相同图表组件。这仍然是应用嵌入，而非纯 HTML MCP App。通过普通 action / `open_app({ path, embed: true })` 暴露或调用它，保持 URL 确定性，让 `embedApp()` 内联渲染该路由。

不要为产品 UI 手写一次性纯 HTML MCP App；如果 action 需要自定义界面，先添加或复用真实的应用路由/组件，然后嵌入该路由。

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

MCP 服务器广播扩展 `io.modelcontextprotocol/ui`，将 `_meta.ui.resourceUri` 加上兼容旧版的 `_meta["ui/resourceUri"]` 添加到 `tools/list`，并还发出 ChatGPT Apps SDK 兼容性元数据（`openai/outputTemplate`、widget CSP/描述/可访问性）。它通过 `resources/list`、`resources/templates/list` 和 `resources/read` 使用 MIME `text/html;profile=mcp-app` 暴露 HTML。stdio 代理从实时应用转发这些资源处理器，因此本地桌面/CLI 客户端看到与 HTTP 客户端相同的资源。

即使添加 `mcpApp`，也保留现有的 `link` 构建器。仅 CLI 的客户端、旧版宿主以及任何不渲染 MCP Apps 的宿主将忽略 UI 元数据，仍然需要"Open in … →"链接。`embedApp()` 使用该链接作为其启动目标。同应用 `open_app({ embed: true })` 在原始工具调用期间生成 `/_agent-native/embed/start` 票据，因此生产宿主不需要 iframe 进行第二次仅应用辅助调用；自定义 action 可以为相同的快速路径返回 `embedStartUrl`。MCP 层将带有票据的 URL 保留在隐藏元数据中，并从模型可见的结构化内容和普通打开链接元数据中剥离它。否则，资源回退到仅应用的 `create_embed_session` 辅助函数。嵌入启动路由交换一次性 SQL 票据，然后使用短期浏览器会话启动真实应用路由。标准宿主直接导航 MCP App 帧。Claude 网页使用单帧移植路径，获取签名的应用 HTML 并在 Claude 的 MCP App iframe 内水合，因为 Claude 不可靠地允许应用拥有的子 iframe 或外部帧导航。ChatGPT 网页使用受控路由 iframe 以实现稳定的 `window.openai` 宿主 API 和有界高度控制。你可以在其他宿主中使用 `embedMode: "transplant"` 或 `frame: "transplant"` 强制单帧移植路径来调试宿主模块加载，或使用 `embedMode: "iframe"` / `renderMode: "iframe"` / `nested: true` 强制嵌套诊断 iframe 来调试宿主行为。仅当自定义 MCP App 真正嵌入第三方帧时才传递额外的 `frameDomains`。`open_app({ app, path, embed: true })` 是全仪表板、过滤收件箱、日历草稿、分析或扩展页面等路由的通用逃生舱，当完整应用是最清晰的审查/编辑界面时应大量使用。

不要将标准 `_meta.ui.domain` 设置为应用 URL。该字段是宿主特定的：Claude 验证哈希子域如 `{hash}.claudemcpcontent.com`，而 ChatGPT 有自己的 widget-domain 元数据。让宿主选择其默认沙箱源，除非你故意发出宿主特定的值。`embedApp()` 可能仍会为 ChatGPT 兼容性发出 `openai/widgetDomain`。

扩展页面是 MCP 聊天嵌入内的特殊情况。普通应用使用 `/_agent-native/extensions/:id/render` 作为沙箱子 iframe，但 MCP 聊天宿主添加了另一个祖先帧，可能通过 `frame-ancestors` / `X-Frame-Options` 阻止该路由。在 MCP 聊天桥接模式下，框架将扩展文档作为沙箱 `srcDoc` 渲染在现有应用路由 iframe 内；保持 `sandbox="allow-scripts allow-forms"` 且不要添加 `allow-same-origin`。

对于 Dispatch，保持单一连接器路径为一等公民：`open_app` 资源 CSP 应包含通过 Dispatch 授权的应用的确切源，而非 `https:` 等宽泛源。这允许 Claude 的移植路径获取签名的目标应用 HTML，同时保持连接器的资源界面狭窄。

宿主尺寸规则：MCP 资源外壳拥有有界内联高度，嵌入路由应在内部滚动。`embedApp({ height })` 默认为 `560px` 外壳，限制在 `320-900px`，并在调整路由视口大小前减去 `44px` 的包装栏。不要为全应用路由嵌入重新启用宿主 SDK 自动调整大小；否则 Claude 和 ChatGPT 可能测量整个文档并创建巨大的聊天 iframe。更改外壳或 `ui://` 资源版本后，用新的工具调用验证，因为旧对话帧保持其渲染时的行为。

在嵌入路由内，`sendToAgentChat({ submit: true })` 发布 `agentNative.submitChat`；MCP App 宿主将其作为模型上下文加上可见的 `ui/message` 轮接收，因此内联预览可以有意地继续 Claude/ChatGPT 对话。隐藏上下文保留在模型上下文中；不要将内部 app-state 文件指令放入可见提示中。`submit: false` 保持为本地预填充/审查路径。

通过 ngrok 测试 Claude 时，使用生产构建（`pnpm exec agent-native build` 然后 `pnpm exec agent-native start`）或部署的预览/生产 URL。Claude 的移植路径适用于生产资产块；原始 Vite 开发模块如 `/app/root.tsx` 可能受应用认证保护，从 Claude 资源源动态导入会失败。

对于已知的第一方交接，优先使用带 `mcpApp` 的直接 action，而非让模型在屏幕间搜索。示例：Mail `manage-draft` 用于邮件草稿，Analytics `open-traffic-dashboard` 用于第一方流量仪表板，Calendar `manage-event-draft` 用于邀请草稿，以及 Forms、Content、Clips、Slides 和 Design 的创建/搜索 action。Action 应返回简洁的结构化内容加链接；不应转储大型目录或 HTML。

兼容性目标：一次构建到标准，而非每个客户端的 shim。支持 MCP Apps 的宿主应包括 Claude/Claude Desktop/Claude Code、ChatGPT 自定义 MCP 应用、VS Code GitHub Copilot、Goose、Postman、MCPJam、Cursor，以及任何遵循扩展协商的未来宿主。宿主支持因计划、发布渠道和客户端版本而异，因此保持深度链接回退。