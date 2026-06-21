---
name: actions
description: >-
  如何创建和运行 agent action。Action 是应用操作的唯一真实来源——agent
  将其作为工具调用，前端代码通过客户端 hooks 调用。在创建新 action、添加
  API 集成或连接前端数据获取时使用。
metadata:
  internal: true
---

# Agent Action

## 规则

`actions/` 中的 action 是应用操作的**唯一真实来源**。Agent 将其作为工具调用，前端通过 `useActionQuery` / `useActionMutation` 调用。框架拥有这些 hooks 背后的 HTTP 传输。不需要重复的 `/api/` 路由。

在为应用数据创建任何自定义 REST/API 路由之前，检查 `actions/` 和 `AGENTS.md` 中的 action 表。如果 action 已存在，直接从 agent 调用或从 UI 使用 `useActionQuery` / `useActionMutation` 调用。如果缺少该能力，创建或更新一个 `defineAction`。不要添加 `/api/*`、`server/routes/*` 或其他主要工作是调用、重新打包或重新导出 action 的透传端点。

## 为什么

Action 为 agent 提供具有结构化输入/输出的可调用工具，同时通过 hooks 为前端提供类型化的客户端契约。一个实现同时服务于 agent 和 UI。它们保持 agent 的聊天上下文干净，可复用，并且可以独立测试。

## 保持 Action 面精简且正交

每个暴露给 agent 的 action 都是模型上下文窗口中的一个工具。每一个都有实际成本：更多工具意味着模型需要阅读、消歧和选择的更多，这会降低工具选择质量。像维护 API 一样对待 action 列表——添加最少的、最正交的 action 来覆盖能力，而不是每个 UI 功能一个。

- **优先使用一个 CRUD 风格的 `update` 而不是 N 个按字段的 action。** 一个接受可选字段补丁的 `update-<thing>` 优于 `update-<thing>-name`、`update-<thing>-order`、`update-<thing>-color`……Agent（和 UI）只传递变化的字段。`create`/`delete` 同理——每个资源一个正交 action，而不是每个代码路径一个。
- **在铸造新的读取 action 之前，先尝试通用查询/逃生舱口。** 如果 agent 需要更多或不同的数据，不要添加 `get-<thing>-by-x`、`list-<thing>-filtered-by-y` 等。对于提供商数据，暴露共享的 `provider-api-catalog` / `provider-api-docs` / `provider-api-request` 三件套（见 `templates/dispatch/actions/`），这样 agent 可以访问任何端点或过滤器而无需每次新建 action。对于开发中的应用数据，`db-query` 工具已经可以回答任意读取问题。
- **使用 `agentTool: false` 将仅 UI 或纯程序化 action 对模型隐藏。** 只有前端或 HTTP/cron 调用者需要的 action 不应占据模型工具列表的槽位。`agentTool: false` 保持它可从 `useActionMutation` / `callAction` / `/_agent-native/actions/<name>` 调用，同时将其从每个 agent 工具面（应用内助手、MCP、A2A）中移除。
- **`agentTool: false` 不是 `toolCallable: false`。** 它们是不同的开关：
  - `agentTool: false` → 对**模型完全隐藏**（它不再是 agent 可以看到或调用的工具）。仍可从前端/HTTP 调用。
  - `toolCallable: false` → 仅阻止**沙箱化扩展（"tools"）iframe 桥接**（`appAction(...)`）。该 action 对模型、UI、CLI、MCP 和 A2A 仍然完全可见。用于高影响半径操作（账户/组织/认证变更），而不是用于精简工具列表。
- **移除或隐藏过时的 action。** 当 UI 停止使用某个 action 时，删除它或设置 `agentTool: false`——不要让它作为死工具权重暴露给模型。下面的建议性审计可以帮助你发现这些。

### 审计脚本（建议性）

`pnpm actions:audit [template ...]`（或 `node scripts/audit-template-actions.mjs`）静态扫描模板的 `actions/` 并打印两类建议：

1. **可能 UI 已废弃**——HTTP 暴露的变更 action，其名称在 `app/` 下从未被引用（删除或标记为 `agentTool: false` 的候选）。
2. **可能冗余的集群**——如 `update-foo-name` / `update-foo-order` 这样的组，可以合并为一个正交的 `update-foo`。

它是**仅建议性的**：始终以退出码 0 退出，从不使 CI 失败，并使用保守的启发式方法，因此预期会有一些误报（例如 agent 调用但 UI 不调用的 action）。将其作为审查的提示，而非门槛。

## 如何创建 Action

使用 `defineAction` 配合 Zod schema（新 action 必需）：

```ts
// actions/list-meals.ts
import { z } from "zod";
import { defineAction } from "@agent-native/core/action";
import { getDb } from "../server/db/index.js";
import { meals } from "../server/db/schema.js";

export default defineAction({
  description: "List all meals",
  schema: z.object({
    date: z.string().describe("Filter by date (YYYY-MM-DD)"),
  }),
  http: { method: "GET" },
  run: async (args) => {
    // args is fully typed: { date: string }
    const db = getDb();
    const rows = await db.select().from(meals);
    return rows; // Return objects/arrays, NOT JSON.stringify()
  },
});
```

`schema` 字段接受 Zod schema（或任何 Standard Schema 兼容的库）。它提供带有清晰错误消息的运行时验证（HTTP 为 400，agent 为错误结果），`run()` args 的完整 TypeScript 类型推断，以及为 agent 工具定义自动生成的 JSON Schema。`zod` 是所有模板的依赖。

当 action 读取或写入应用数据时，使用 Drizzle 的查询构建器和 `drizzle-orm` 中的可移植操作符。不要在普通 action 中使用原始 SQL、`getDbExec()` 或特定方言的 schema 导入，除非有文档说明 Drizzle 无法表达该查询的原因。

当 action 调用外部服务时，永远不要硬编码 API 密钥、bearer
令牌、webhook URL、签名密钥、OAuth 刷新令牌、私有 Builder/内部数据或客户数据。从 `readAppSecret`、`resolveCredential`、OAuth 令牌辅助函数或提供商 API 凭证适配器读取用户/组织/工作区凭证。仅对显式的部署级配置使用 `process.env`，并在示例中使用明显虚假的占位符。

提示：
- 使用 `.describe()` 为参数添加描述
- 使用 `.optional()` 标记可选参数
- 使用 `z.coerce.number()` 处理从 HTTP 以字符串形式到达的数字参数。
  对于布尔值，使用显式的字符串解析器/辅助函数，而不是
  `z.coerce.boolean()`，因为 JavaScript 将任何非空字符串（
  包括 `"false"`）视为真值。
- 使用 `z.enum(["draft", "published"])` 处理约束值

遗留的 `parameters` 字段（普通 JSON Schema 对象）仍可作为后备，但不提供运行时验证或类型推断。

## 决策顺序

当你需要应用数据或变更时：

1. **使用现有 action**，如果已有执行该操作的 action。
2. **创建或扩展 `defineAction`**，当 agent 和 UI 都需要新操作时。
3. **仅为路由专属关注点创建自定义路由**，如上传、流式传输、webhook、OAuth 回调或非 JSON 协议。

不要构建伞式 REST API 来使 action 更"容易"调用。Action 已经可以被 agent、CLI、React hooks、HTTP、MCP/A2A 暴露和外部主机通过框架调用。

## 灵活的提供商 API

对于用于临时分析、查询、报告或跨源研究的提供商集成，不要将每个提供商端点硬编码为单独的刚性 action，也不要将一个回溯窗口、过滤器形状或分页策略编码为 agent 唯一的路径。暴露共享的提供商 API action 三件套：

- `provider-api-catalog`：列出提供商基础 URL、认证风格、凭证密钥、文档/spec URL、占位符和示例，而不暴露秘密。
- `provider-api-docs`：当确切的端点、过滤器操作符、负载形状或分页契约不确定时，获取公共提供商文档/spec/变更日志 URL。注册的文档 URL 是精选的起点。使用 `responseMode: "markdown"` 获取干净可读的文档，或使用 `responseMode: "matches"` 配合 `search: { query | terms | regex }` 获取紧凑片段，而不是用原始 HTML 淹没上下文。
- `provider-api-request`：向提供商主机发出受限的认证 HTTP 请求，注入配置的凭证，阻止私有/内部 URL，并编辑秘密。

使用 `@agent-native/core/provider-api` 作为共享基底。模板只应在具有应用特定凭证查找规则时添加薄凭证适配器。如果应用在更窄的本地提供商 ID 下存储内置提供商的 OAuth 授权，使用运行时的 `oauthProviderOverrides` 而不是复制提供商配置。如果凭证存储在可共享/资源行上而不是共享凭证或 OAuth 令牌存储中，构建一个在暴露原始提供商请求之前强制执行这些访问检查的解析器。除非你有单独的 UI 权限模型用于任意提供商写入，否则保持 `provider-api-request` `http: false`。特定 action 如 `search-records`、`search-emails` 或 `sync-source` 是便利快捷方式，不是能力限制；当问题需要快捷方式未建模的端点或过滤器时，agent 应回退到提供商 API 三件套。

这是一个框架原则。安全边界应是提供商主机白名单、凭证范围限定、认证注入、私有网络阻止、秘密编辑和用户/组织访问检查，而不是人为小型的一组手写读取 action。如果上游提供商 API 支持某项能力，agent 通常应该能够通过 `provider-api-request` 使用用户配置的凭证访问它。对于大型响应，暴露暂存（`stageAs`、`itemsPath`、分页和 `query-staged-dataset`）或沙箱化代码执行，这样 agent 可以减少数据而不淹没上下文。

对于广泛的提供商问题、跨源连接、语料库范围的提及/搜索工作、分类或任何缺失很重要的答案，设计 action 面以实现完全覆盖而不是仅便利的样本。Agent 应该能够获取每个相关页面或明确有界的队列，在聊天之外暂存或保存原始提供商响应，然后使用 `query-staged-dataset`、`run-code` 或提供商端搜索来计数、连接、grep、分类和聚合。工具描述和 AGENTS.md 指导应教导 agent 报告来源、过滤器、时间窗口、行/记录计数、分页状态、截断、失败页面和未覆盖的差距。它们绝不能将默认限制、采样行、截断摘录或中止调用变成自信的"未找到"、"所有记录"或详尽结论。

对于公共网页和文档，优先使用令牌高效的路径：`web-search` 查找可能的 URL，`web-request` 或 `provider-api-docs` 配合干净的 `responseMode` 输出阅读页面，`run-code` 配合 `webRead()` / `webFetch()` 当你需要 grep、聚合或比较许多页面后再返回小结果时。

### `http` 选项

控制 action 如何作为 HTTP 端点暴露：

| 值                                  | 行为                                                   | 用途                           |
| ----------------------------------- | ------------------------------------------------------ | ------------------------------ |
| _（省略）_                           | 自动暴露为 `POST /_agent-native/actions/:name`          | 写入操作（默认）               |
| `{ method: "GET" }`                 | 自动暴露为 `GET /_agent-native/actions/:name`           | 只读查询                       |
| `{ method: "PUT" }`                 | 自动暴露为 `PUT /_agent-native/actions/:name`           | 更新操作                       |
| `{ method: "DELETE" }`              | 自动暴露为 `DELETE /_agent-native/actions/:name`        | 删除操作                       |
| `{ method: "GET", path: "custom" }` | 自动暴露为 `GET /_agent-native/actions/custom`          | 自定义路由路径                 |
| `false`                             | 仅 agent 可用，从不暴露为 HTTP                           | `navigate`、`view-screen`、内部 action |

### 屏幕刷新（自动）

框架在任何成功的变更 action 后自动刷新 UI。在非 `GET` action 完成时，框架发出一个 `source: "action"` 的变更事件，客户端的 `useDbSync` 接收并用于使 `["action"]` React Query 键失效——因此 `list-*` / `get-*` hooks 无需整页重载即可重新获取。进程内调用直接发出；开发模式 `pnpm action ...` 调用也会写入持久标记，以便 Web 服务器看到子进程 action 变更。

规则：

- `http: { method: "GET" }` → 只读，不会触发刷新（自动推断）。
- 任何其他 action（默认 `POST`、`PUT`、`DELETE` 或 `http: false`）→ 视为变更，成功时触发刷新。
- 要在异常 action 上覆盖推断（例如只读的 `POST`），在 action 定义上传递 `readOnly: true`。
- 要让变更 action 与同一轮的其他工具调用并发运行，传递 `parallelSafe: true`。仅在 action 内部并发安全且顺序无关时才这样做（例如，它使用应用级锁或幂等 upsert 语义）。变更 action 默认保持串行化。

Agent 在普通 action 后不需要调用 `refresh-screen`——它已经处理了。`refresh-screen` 仅在 agent 通过框架无法看到的路径变更数据时（例如写入应用镜像的外部系统）或 agent 想要传递 `scope` 提示以进行更窄的失效时才需要。

### 返回值

Action 应返回**结构化数据**（对象、数组）——而不是 `JSON.stringify()`。框架自动序列化响应。如果返回字符串，框架会尝试将其解析为 JSON 以获得干净的响应。

```ts
// 好的做法——返回结构化数据
run: async (args) => {
  const events = await fetchEvents(args.from, args.to);
  return events;
}

// 坏的做法——不要 stringify
run: async (args) => {
  const events = await fetchEvents(args.from, args.to);
  return JSON.stringify(events, null, 2);
}
```

### 验证返回值（`outputSchema`）

`schema` 验证输入；`outputSchema` 验证 action **返回**的内容。传递任何 Standard Schema 兼容的 schema（Zod、Valibot、ArkType），框架在 `run()` 解析后验证结果——输入在 `run` 之前验证，输出在之后验证。

```ts
export default defineAction({
  description: "Summarize a thread.",
  schema: z.object({ threadId: z.string() }),
  outputSchema: z.object({ summary: z.string(), messageCount: z.number() }),
  outputErrorStrategy: "warn", // default; "strict" | "fallback"
  // outputFallback: { summary: "", messageCount: 0 }, // used only by "fallback"
  run: async ({ threadId }) => {
    /* ... */
  },
});
```

- `"warn"`（默认）——`console.warn` 问题并返回**原始**结果不变。非破坏性。
- `"strict"`——抛出清晰错误，使有 bug 的 action 显式暴露。
- `"fallback"`——返回 `outputFallback` 替代无效结果。

成功时返回已验证的值，因此 `outputSchema` 上的强制转换/默认值会生效。省略 `outputSchema` 则行为逐字节不变（无包装）。

### 人工审批（`needsApproval`）

对于高后果、对外、难以撤销的 action（发送电子邮件、扣款、删除账户），设置 `needsApproval`，这样 agent **不能**在未经人工批准特定调用的情况下运行 action：

```ts
export default defineAction({
  description: "Send an email via Gmail.",
  schema: z.object({ to: z.string(), subject: z.string(), body: z.string() }),
  needsApproval: true, // boolean, or (args, ctx) => boolean | Promise<boolean>
  run: async (args) => {
    /* ...actually send... */
  },
});
```

当门控为真且调用尚未批准时，循环发出 `approval_required` 事件并**停止轮次——`run()` 永不执行**。谓词有条件地门控（例如仅外部收件人）并**失败关闭**：抛出被视为"需要批准"。人工通过聊天 UI 的批准功能进行批准，该功能使用调用的 `approvalKey` 重新发出轮次，然后 action 才运行。

**保持审批稀有**——默认关闭，几乎所有 action 都应保持关闭。典型示例是 Mail 的 `send-email`（`needsApproval: true`）。参见 `security` skill 和人工审批文档。

## 前端 Hooks

前端使用 `@agent-native/core/client` 中的 React Query hooks 调用 action。组件不应手写 `fetch("/_agent-native/actions/...")`；而是添加或复用客户端 hook/辅助函数。对于不适合 hook 的命令式情况，使用同一包中的 `callAction`，如防抖搜索、预取或非 React 事件处理程序。

### `useActionQuery`——用于 GET action

```ts
import { useActionQuery } from "@agent-native/core/client";

function MealList() {
  // 类型从 action 的 schema + 返回类型自动推断——无需手动泛型
  const { data: meals } = useActionQuery("list-meals", {
    date: "2025-01-01",
  });
  return <ul>{meals?.map((m) => <li key={m.id}>{m.name}</li>)}</ul>;
}
```

### `useActionMutation`——用于 POST/PUT/DELETE action

```ts
import { useActionMutation } from "@agent-native/core/client";

function AddMealButton() {
  // 类型自动推断——无需手动泛型
  const { mutate } = useActionMutation("log-meal");
  return (
    <button onClick={() => mutate({ name: "Salad", calories: 350 })}>
      Log Meal
    </button>
  );
}
```

**不要使用手动类型泛型**，如 `useActionQuery<Meal[]>(...)`。类型从 `.generated/action-types.d.ts` 自动推断，该文件由 Vite 插件自动生成。

变更在成功时自动使所有 `["action"]` 查询键失效，因此 GET 查询重新获取。

### `callAction`——用于命令式客户端代码

```ts
import { callAction } from "@agent-native/core/client";

const people = await callAction("search-people", { query }, { method: "GET" });
```

在 React 数据流中优先使用 hooks。当 hook 不方便时使用 `callAction`；
不要在组件中手写 action 路由 fetch。

## 如何运行（Agent）

```bash
pnpm action my-action --input data/source.json --output data/result.json
```

## Action 调度器

默认模板在 `actions/run.ts` 中使用 core 的 `runScript()`：

```ts
import { runScript } from "@agent-native/core";
runScript();
```

这是新应用的规范方法。Action 名称必须仅使用小写字母和连字符（例如 `my-action`）。

## 何时仍需要自定义 `/api/` 路由

大多数操作应该是 action。你只需要在 `server/routes/api/` 中使用自定义路由：

- **文件上传**——action 接收 JSON 参数，而不是 multipart 表单数据
- **流式响应**——需要直接 H3 控制的 SSE 或分块响应
- **Webhook**——外部服务 POST 到特定 URL
- **OAuth 回调**——需要特定 URL 模式的基于重定向的流程

如果是标准 CRUD 操作、数据查询或 action 的包装器，请使用 action。

## 遗留模式（裸导出）

较旧的 action 使用带 `parseArgs` 的裸异步函数导出：

```ts
import { parseArgs, loadEnv, fail } from "@agent-native/core";

export default async function myAction(args: string[]) {
  loadEnv();
  const parsed = parseArgs(args);
  // ...
}
```

这仍然有效，但不会自动暴露为 HTTP。所有新 action 优先使用 `defineAction`。

## 指南

- **一个 action，一个任务。** 保持 action 专注于单一操作。Agent 组合多个 action 调用来完成复杂操作。
- **返回结构化数据。** 返回对象/数组，而不是 `JSON.stringify()`。
- **使用 `http: { method: "GET" }`** 用于只读 action。默认为 POST。
- **使用 `http: false`** 用于仅 agent 的 action（`navigate`、`view-screen`）。
- **使用 `agentTool: false`** 用于不应成为模型上下文窗口中工具的仅 UI/程序化 action。它保持前端/HTTP 可调用但对 agent 隐藏。与 `toolCallable: false` 不同，后者仅阻止沙箱化扩展 iframe 桥接。
- **文档化可复用的 action。** 如果新 action 应该被一个窄屏幕之外的 agent 调用，更新 `AGENTS.md`，说明何时使用它、重要参数和要保留的返回字段。
- **将工作流密集的 action 提升为 skill。** 如果 action 是提供商支持的、跨应用的、MCP/A2A 或多步工作流的一部分，在 `.agents/skills/` 中创建或更新 skill，并在应通过市场发布时添加应用 skill 可见性（`internal`、`exported` 或 `both`）。
- **使用 `loadEnv()`** 仅用于部署级配置。用户/组织/工作区
  凭证属于加密的 secrets/credential/OAuth 存储，永远不要作为
  硬编码字面量或共享 env 后备。
- **使用 `fail()`** 提供用户友好的错误消息（以消息退出，无堆栈跟踪）。
- **从 `@agent-native/core/action` 导入 action 原语**，CLI 辅助函数如 `parseArgs()` 从 `@agent-native/core` 导入——不要在本地重新定义框架工具。
- **不要将 action 重新导出为 REST。** 挂载的 `/_agent-native/actions/:name` 端点是 REST 面；在 `/api/*` 下复制它会造成漂移并向 agent 隐藏操作。

## 常见模式

**读取 action（GET）：**

```ts
import { z } from "zod";
import { defineAction } from "@agent-native/core/action";

export default defineAction({
  description: "List calendar events",
  schema: z.object({
    from: z.string().describe("Start date"),
    to: z.string().describe("End date"),
  }),
  http: { method: "GET" },
  run: async (args) => {
    return await fetchEvents(args.from, args.to);
  },
});
```

**写入 action（POST，默认）：**

```ts
import { z } from "zod";
import { defineAction } from "@agent-native/core/action";

export default defineAction({
  description: "Log a meal",
  schema: z.object({
    name: z.string().describe("Meal name"),
    calories: z.coerce.number().describe("Calorie count"),
  }),
  run: async (args) => {
    // args.calories is a number — z.coerce.number() handles string-to-number conversion from HTTP
    const meal = await insertMeal(args);
    return meal;
  },
});
```

**仅 Agent 的 action：**

```ts
import { z } from "zod";
import { defineAction } from "@agent-native/core/action";

export default defineAction({
  description: "Navigate the UI to a view",
  schema: z.object({
    view: z.string().describe("Target view"),
  }),
  http: false,
  run: async (args) => {
    await writeAppState("navigate", { command: "go", view: args.view });
    return "Navigated";
  },
});
```

## 故障排除

- **Action 未找到**——检查文件名是否与命令名完全匹配。`pnpm action foo-bar` 查找 `actions/foo-bar.ts`。
- **参数未解析**——确保参数使用 `--key value` 或 `--key=value` 格式。布尔标志使用 `--flag`（将值设为 `"true"`）。
- **前端收到 405**——action 的 `http.method` 与 hook 不匹配。GET action 使用 `useActionQuery`，POST/PUT/DELETE 使用 `useActionMutation`。
- **前端收到 undefined**——确保 action 返回结构化数据，而不是 `JSON.stringify()`。

## 相关 Skill

- **storing-data**——Action 在 SQL 中读取/写入数据
- **delegate-to-agent**——Agent 通过 `pnpm action <name>` 调用 action
- **real-time-sync**——Action 中的数据库写入触发变更事件以更新 UI
- **adding-a-feature**——Action 是四方面检查清单的第 2 方面
- **client-methods**——客户端代码使用命名的辅助函数/hooks 而不是原始 REST 调用