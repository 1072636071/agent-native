---
name: actions
description: >-
  如何创建和运行代理 actions。Actions 是应用操作的唯一真相来源 — 代理将它们作为工具调用，前端代码通过客户端钩子调用它们。在创建新 action、添加 API 集成或连接前端数据获取时使用。
metadata:
  internal: true
---

# 代理 Actions

## 规则

`actions/` 中的 actions 是应用操作的**唯一真相来源**。代理将它们作为工具调用，前端通过 `useActionQuery` / `useActionMutation` 调用它们。框架拥有这些钩子背后的 HTTP 传输。无需重复的 `/api/` 路由。

在为应用数据创建任何自定义 REST/API 路由之前，检查 `actions/` 和 `AGENTS.md` 中的 action 表。如果 action 已存在，直接从代理调用或从 UI 使用 `useActionQuery` / `useActionMutation` 调用。如果能力缺失，创建或更新 `defineAction`。不要添加主要工作是调用、重新打包或重新导出 action 的 `/api/*`、`server/routes/*` 或其他传递端点。

## 原因

Actions 为代理提供带结构化输入/输出的可调用工具，同时通过钩子为前端提供类型化的客户端契约。一个实现同时服务于代理和 UI。它们保持代理的聊天上下文干净，可重用，并且可以独立测试。

## 保持 Action 界面小巧且正交

每个代理暴露的 action 都是模型上下文窗口中的一个工具。每个都有实际成本：更多工具意味着模型需要阅读、消歧和选择的更多内容，这会降低工具选择质量。像维护 API 一样对待 action 列表 — 添加最少的、最正交的 actions 来覆盖能力，而非每个 UI 功能一个 action。

- **优先使用一个 CRUD 风格的 `update` 而非 N 个按字段的 actions。** 一个接受可选字段补丁的 `update-<thing>` 优于 `update-<thing>-name`、`update-<thing>-order`、`update-<thing>-color`… 代理（和 UI）只传递更改的字段。`create`/`delete` 同理 — 每个资源一个正交 action，而非每个代码路径一个。
- **在创建新的读取 action 之前，先使用通用查询/逃生口。** 如果代理需要更多或不同的数据，不要添加 `get-<thing>-by-x`、`list-<thing>-filtered-by-y` 等。对于提供商数据，暴露共享的 `provider-api-catalog` / `provider-api-docs` / `provider-api-request` 三件套（见 `templates/dispatch/actions/`），以便代理可以访问任何端点或过滤器而无需每次新增 action。对于开发中的应用数据，`db-query` 工具已经可以回答任意读取问题。
- **使用 `agentTool: false` 对仅 UI 或纯编程式 actions 隐藏。** 仅前端或 HTTP/cron 调用者需要的 action 不应在模型的工具列表中占据位置。`agentTool: false` 保持它可从 `useActionMutation` / `callAction` / `/_agent-native/actions/<name>` 调用，同时从每个代理工具界面（应用内助手、MCP、A2A）中移除。
- **`agentTool: false` 不是 `toolCallable: false`。** 它们是不同的开关：
  - `agentTool: false` → 对**模型完全隐藏**（它不再是代理可以查看或调用的工具）。仍然前端/HTTP 可调用。
  - `toolCallable: false` → 仅阻止**沙箱化扩展（"tools"）iframe 桥接**（`appAction(...)`）。action 对模型、UI、CLI、MCP 和 A2A 仍然完全可见。用于高影响范围的操作（账户/组织/认证更改），而非用于精简工具列表。
- **移除或隐藏过时的 actions。** 当 UI 停止使用 action 时，删除它或设置 `agentTool: false` — 不要让它作为死工具权重暴露给模型。下面的建议审计帮助你发现这些。

### 审计脚本（建议性）

`pnpm actions:audit [template ...]`（或 `node scripts/audit-template-actions.mjs`）静态扫描模板的 `actions/` 并打印两种建议：

1. **可能是 UI 死代码** — HTTP 暴露的变异 actions，其名称在 `app/` 下从未被引用（删除或标记 `agentTool: false` 的候选）。
2. **可能是冗余集群** — 如 `update-foo-name` / `update-foo-order` 的组，可以合并为一个正交的 `update-foo`。

它**仅是建议性的**：始终以退出码 0 退出，永不使 CI 失败，并使用保守的启发式方法，因此预期会有一些误报（例如，代理调用但 UI 不调用的 action）。将其用作审查的提示，而非门控。

## 如何创建 Action

使用 `defineAction` 和 Zod 模式（新 actions 必需）：

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

`schema` 字段接受 Zod 模式（或任何 Standard Schema 兼容库）。它提供运行时验证并带有清晰的错误消息（HTTP 为 400，代理工具调用为错误结果），`run()` args 的完整 TypeScript 类型推断，以及代理工具定义的自动生成 JSON Schema。`zod` 是所有模板的依赖。

当 action 读取或写入应用数据时，使用 Drizzle 的查询构建器和 `drizzle-orm` 的可移植操作符。不要在正常 actions 中使用原始 SQL、`getDbExec()` 或方言特定的模式导入，除非有文档说明 Drizzle 无法表达该查询的原因。

当 action 调用外部服务时，永远不要硬编码 API 密钥、bearer token、webhook URL、签名密钥、OAuth 刷新 token、私有 Builder/内部数据或客户数据。从 `readAppSecret`、`resolveCredential`、OAuth token 辅助函数或提供商 API 凭据适配器读取用户/组织/工作区凭据。仅对显式的部署级配置使用 `process.env`，并在示例中使用明显的占位符。

提示：
- 使用 `.describe()` 进行参数描述
- 使用 `.optional()` 处理可选参数
- 使用 `z.coerce.number()` 处理从 HTTP 以字符串形式到达的数字参数。对于布尔值，使用显式的字符串解析器/辅助函数而非 `z.coerce.boolean()`，因为 JavaScript 将任何非空字符串（包括 `"false"`）视为真值。
- 使用 `z.enum(["draft", "published"])` 处理约束值

旧版 `parameters` 字段（纯 JSON Schema 对象）仍可作为回退使用，但不提供运行时验证或类型推断。

## 决策顺序

当你需要应用数据或变更时：

1. **使用现有 action** 如果已有执行该操作的。
2. **创建或扩展 `defineAction`** 当代理和 UI 都需要新操作时。
3. **仅为仅路由关注点创建自定义路由**，如上传、流式传输、webhook、OAuth 回调或非 JSON 协议。

不要构建伞式 REST API 使 actions "更容易"调用。Actions 已可通过框架被代理、CLI、React 钩子、HTTP、MCP/A2A 暴露和外部宿主调用。

## 灵活的提供商 API

对于用于临时分析、查询、报告或跨源研究的提供商集成，不要将每个提供商端点硬编码为单独的刚性 action，也不要将一个回溯窗口、过滤器形状或分页策略编码为代理可以采取的唯一路径。而是暴露共享的提供商 API action 三件套：

- `provider-api-catalog`：列出提供商基础 URL、认证风格、凭据键、文档/规范 URL、占位符和示例，而不暴露密钥。
- `provider-api-docs`：当确切的端点、过滤器操作符、负载形状或分页契约不确定时，获取公共提供商文档/规范/变更日志 URL。注册的文档 URL 是精选的起点。使用 `responseMode: "markdown"` 获取干净可读的文档，或使用 `responseMode: "matches"` 加 `search: { query | terms | regex }` 获取紧凑片段，而非用原始 HTML 淹没上下文。
- `provider-api-request`：向提供商主机发出受约束的认证 HTTP 请求，注入配置的凭据，阻止私有/内部 URL，并编辑密钥。

使用 `@agent-native/core/provider-api` 作为共享基础。模板仅在有应用特定的凭据查找规则时才应添加薄凭据适配器。如果应用在更窄的本地提供商 ID 下存储内置提供商的 OAuth 授权，使用运行时的 `oauthProviderOverrides` 而非复制提供商配置。如果凭据存储在可共享/资源行上而非共享凭据或 OAuth-token 存储中，构建一个在暴露原始提供商请求之前强制执行这些访问检查的解析器。除非你有单独的 UI 权限模型用于任意提供商写入，否则保持 `provider-api-request` `http: false`。特定 actions 如 `search-records`、`search-emails` 或 `sync-source` 是便利快捷方式，而非能力限制；当问题需要快捷方式未建模的端点或过滤器时，代理应回退到提供商 API 三件套。

这是一个框架原则。安全边界应该是提供商主机允许列表、凭据范围限定、认证注入、私有网络阻止、密钥编辑和用户/组织访问检查，而非人工编写的少量读取 actions。如果上游提供商 API 支持某种能力，代理通常应该能够通过 `provider-api-request` 使用用户配置的凭据访问它。对于大响应，暴露暂存（`stageAs`、`itemsPath`、分页和 `query-staged-dataset`）或沙箱化代码执行，以便代理可以在不淹没上下文的情况下减少数据。

对于广泛的提供商问题、跨源连接、语料库范围的提及/搜索工作、分类或任何缺失重要的答案，设计 action 界面以实现完全覆盖而非仅便利样本。代理应该能够获取每个相关页面或显式有界的队列，在聊天之外暂存或保存原始提供商响应，然后使用 `query-staged-dataset`、`run-code` 或提供商端搜索来计数、连接、grep、分类和聚合。工具描述和 AGENTS.md 指导应教导代理报告来源、过滤器、时间窗口、行/记录计数、分页状态、截断、失败页面和未覆盖的差距。它们绝不能将默认限制、采样行、截断摘录或中止调用变成自信的"未找到"、"所有记录"或详尽结论。

对于公共网页和文档，优先使用 token 高效的路径：`web-search` 查找可能的 URL，`web-request` 或 `provider-api-docs` 加干净的 `responseMode` 输出读取页面，以及 `run-code` 加 `webRead()` / `webFetch()` 当你需要 grep、聚合或比较多个页面后再返回小结果时。

### `http` 选项

控制 action 如何作为 HTTP 端点暴露：

| 值                        | 行为                                                    | 用于                              |
| ------------------------- | ------------------------------------------------------- | --------------------------------- |
| _(省略)_                  | 自动暴露为 `POST /_agent-native/actions/:name`          | 写操作（默认）                    |
| `{ method: "GET" }`      | 自动暴露为 `GET /_agent-native/actions/:name`           | 只读查询                          |
| `{ method: "PUT" }`      | 自动暴露为 `PUT /_agent-native/actions/:name`           | 更新操作                          |
| `{ method: "DELETE" }`   | 自动暴露为 `DELETE /_agent-native/actions/:name`        | 删除操作                          |
| `{ method: "GET", path: "custom" }` | 自动暴露为 `GET /_agent-native/actions/custom` | 自定义路由路径                    |
| `false`                   | 仅代理，永不作为 HTTP 暴露                              | `navigate`、`view-screen`、内部 actions |

### 屏幕刷新（自动）

框架在任何成功的变异 action 后自动刷新 UI。在非 `GET` action 完成时，框架发出带有 `source: "action"` 的变更事件，客户端的 `useDbSync` 接收并用于使 `["action"]` React Query 键失效 — 因此 `list-*` / `get-*` 钩子重新获取而无需完整页面重载。进程内调用直接发出；开发模式 `pnpm action ...` 调用也写入持久标记，以便 Web 服务器看到子进程 action 变更。

规则：

- `http: { method: "GET" }` → 只读，不触发刷新（自动推断）。
- 任何其他 action（默认 `POST`、`PUT`、`DELETE` 或 `http: false`）→ 视为变异，成功时触发刷新。
- 要在异常 action 上覆盖推断（例如仅读取的 `POST`），在 action 定义上传递 `readOnly: true`。
- 要让变异 action 与其他同轮工具调用并发运行，传递 `parallelSafe: true`。仅在 action 内部并发安全且顺序无关时才这样做（例如，它使用应用级锁或幂等 upsert 语义）。变异 actions 默认保持序列化。

代理在正常 action 后不需要调用 `refresh-screen` — 它已经处理了。`refresh-screen` 仅在代理通过框架无法看到的路径变更数据时（例如，写入应用镜像的外部系统）或代理想要传递 `scope` 提示进行更窄的失效时才需要。

### 返回值

Actions 应返回**结构化数据**（对象、数组）— 而非 `JSON.stringify()`。框架自动序列化响应。如果你返回字符串，框架尝试将其解析为 JSON 以获得干净的响应。

```ts
// Good — return structured data
run: async (args) => {
  const events = await fetchEvents(args.from, args.to);
  return events;
}

// Bad — don't stringify
run: async (args) => {
  const events = await fetchEvents(args.from, args.to);
  return JSON.stringify(events, null, 2);
}
```

### 验证返回值（`outputSchema`）

`schema` 验证输入；`outputSchema` 验证 action **返回**的内容。传递任何 Standard Schema 兼容的模式（Zod、Valibot、ArkType），框架在 `run()` 解析后验证结果 — 输入在 `run` 之前验证，输出之后验证。

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

- `"warn"`（默认）— `console.warn` 问题并**原样**返回原始结果。非破坏性。
- `"strict"` — 抛出清晰错误，以便有缺陷的 action 大声暴露。
- `"fallback"` — 返回 `outputFallback` 替代无效结果。

成功时返回验证后的值，因此 `outputSchema` 上的强制转换/默认值适用。省略 `outputSchema` 则行为逐字节不变（无包装）。

### 人在回路审批（`needsApproval`）

对于高后果、面向外部、难以撤销的 actions（发送邮件、扣款、删除账户），设置 `needsApproval` 以便代理**不能**在没有人类批准特定调用的情况下运行 action：

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

当门控为真且调用尚未批准时，循环发出 `approval_required` 事件并**停止轮次 — `run()` 永不执行**。谓词有条件地门控（例如仅外部收件人）并**安全失败**：抛出被视为"需要审批"。人类通过聊天 UI 的批准功能批准，该功能用调用的 `approvalKey` 重新发出轮次，然后 action 才运行。

**保持审批罕见** — 默认关闭，几乎每个 action 都应保持关闭。规范示例是 Mail 的 `send-email`（`needsApproval: true`）。见 `security` 技能和人在回路文档。

## 前端钩子

前端使用 `@agent-native/core/client` 中的 React Query 钩子调用 actions。组件不应手写 `fetch("/_agent-native/actions/...")`；而是添加或重用客户端钩子/辅助函数。对于不适合钩子的命令式情况（如防抖搜索、预取或非 React 事件处理器），使用同一包中的 `callAction`。

### `useActionQuery` — 用于 GET actions

```ts
import { useActionQuery } from "@agent-native/core/client";

function MealList() {
  // Types are auto-inferred from the action's schema + return type — no manual generic needed
  const { data: meals } = useActionQuery("list-meals", {
    date: "2025-01-01",
  });
  return <ul>{meals?.map((m) => <li key={m.id}>{m.name}</li>)}</ul>;
}
```

### `useActionMutation` — 用于 POST/PUT/DELETE actions

```ts
import { useActionMutation } from "@agent-native/core/client";

function AddMealButton() {
  // Types are auto-inferred — no manual generic needed
  const { mutate } = useActionMutation("log-meal");
  return (
    <button onClick={() => mutate({ name: "Salad", calories: 350 })}>
      Log Meal
    </button>
  );
}
```

**不要使用手动类型泛型** 如 `useActionQuery<Meal[]>(...)`。类型从 `.generated/action-types.d.ts` 自动推断，该文件由 Vite 插件自动生成。

变更在成功时自动使所有 `["action"]` 查询键失效，因此 GET 查询重新获取。

### `callAction` — 用于命令式客户端代码

```ts
import { callAction } from "@agent-native/core/client";

const people = await callAction("search-people", { query }, { method: "GET" });
```

在 React 数据流中优先使用钩子。当钩子不方便时使用 `callAction`；不要在组件中手写 action 路由获取。

## 如何运行（代理）

```bash
pnpm action my-action --input data/source.json --output data/result.json
```

## Action 调度器

默认模板在 `actions/run.ts` 中使用 core 的 `runScript()`：

```ts
import { runScript } from "@agent-native/core";
runScript();
```

这是新应用的规范方法。Action 名称必须仅使用小写字母和连字符（如 `my-action`）。

## 何时仍需要自定义 `/api/` 路由

大多数操作应该是 actions。你仅在以下情况下需要 `server/routes/api/` 中的自定义路由：

- **文件上传** — actions 接收 JSON 参数，而非多部分表单数据
- **流式响应** — 需要直接 H3 控制的 SSE 或分块响应
- **Webhook** — 外部服务 POST 到特定 URL
- **OAuth 回调** — 需要特定 URL 模式的基于重定向的流程

如果是标准 CRUD 操作、数据查询或 action 的包装器，请使用 action。

## 旧版模式（裸导出）

旧版 actions 使用带 `parseArgs` 的裸异步函数导出：

```ts
import { parseArgs, loadEnv, fail } from "@agent-native/core";

export default async function myAction(args: string[]) {
  loadEnv();
  const parsed = parseArgs(args);
  // ...
}
```

这仍然有效，但不会自动暴露为 HTTP。所有新 actions 优先使用 `defineAction`。

## 指南

- **一个 action，一个任务。** 保持 actions 专注于单一操作。代理为复杂操作组合多个 action 调用。
- **返回结构化数据。** 返回对象/数组，而非 `JSON.stringify()`。
- **使用 `http: { method: "GET" }`** 用于只读 actions。默认为 POST。
- **使用 `http: false`** 用于仅代理 actions（`navigate`、`view-screen`）。
- **使用 `agentTool: false`** 用于不应成为模型上下文窗口中工具的仅 UI/编程式 actions。它保持前端/HTTP 可调用但对代理隐藏。与 `toolCallable: false` 不同，后者仅阻止沙箱化扩展 iframe 桥接。
- **记录可重用 actions。** 如果新 action 应该被一个窄屏之外的代理调用，用何时使用它、重要参数和要保留的返回字段更新 `AGENTS.md`。
- **将工作流密集型 actions 提升为技能。** 如果 action 是提供商支持的、跨应用的、MCP/A2A 或多步工作流的一部分，在 `.agents/skills/` 中创建或更新技能，并在应通过市场发布时添加应用技能可见性（`internal`、`exported` 或 `both`）。
- **仅对部署级配置使用 `loadEnv()`。** 用户/组织/工作区凭据属于加密的密钥/凭据/OAuth 存储，永不作为硬编码字面量或共享环境变量回退。
- **使用 `fail()`** 提供用户友好的错误消息（以消息退出，无堆栈跟踪）。
- **从 `@agent-native/core/action` 导入 action 原语** 和 `parseArgs()` 等 CLI 辅助函数从 `@agent-native/core` — 不要在本地重新定义框架工具。
- **不要将 actions 重新导出为 REST。** 挂载的 `/_agent-native/actions/:name` 端点是 REST 界面；在 `/api/*` 下复制它会产生漂移并对代理隐藏操作。

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

**仅代理 action：**

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

- **Action 未找到** — 检查文件名是否与命令名完全匹配。`pnpm action foo-bar` 查找 `actions/foo-bar.ts`。
- **参数未解析** — 确保参数使用 `--key value` 或 `--key=value` 格式。布尔标志使用 `--flag`（将值设为 `"true"`）。
- **前端获取 405** — action 的 `http.method` 与钩子不匹配。GET actions 使用 `useActionQuery`，POST/PUT/DELETE 使用 `useActionMutation`。
- **前端获取 undefined** — 确保 action 返回结构化数据，而非 `JSON.stringify()`。

## 相关技能

- **storing-data** — Actions 在 SQL 中读/写数据
- **delegate-to-agent** — 代理通过 `pnpm action <name>` 调用 actions
- **real-time-sync** — 来自 actions 的数据库写入触发变更事件以更新 UI
- **adding-a-feature** — Actions 是四区域清单的第 2 区域
- **client-methods** — 客户端代码使用命名的辅助函数/钩子而非原始 REST 调用