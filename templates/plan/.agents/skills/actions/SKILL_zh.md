---
name: actions
description: >-
  如何创建和运行代理 actions。Actions 是应用操作的单一真实来源 — 代理将它们作为工具调用，
  前端代码通过客户端 hooks 调用它们。在创建新 action、添加 API 集成或连接前端数据获取时使用。
metadata:
  internal: true
---

# 代理 Actions

## 规则

`actions/` 中的 actions 是应用操作的**单一真实来源**。代理将它们作为工具调用，前端通过 `useActionQuery` / `useActionMutation` 调用它们。框架拥有这些 hooks 背后的 HTTP 传输。不需要重复的 `/api/` 路由。

在为应用数据创建任何自定义 REST/API 路由之前，检查 `actions/` 和 `AGENTS.md` 中的 action 表。如果 action 已存在，直接从代理调用它或从 UI 使用 `useActionQuery` / `useActionMutation`。如果缺少该功能，创建或更新 `defineAction`。不要添加 `/api/*`、`server/routes/*` 或其他主要工作是调用、重新打包或重新导出 action 的透传端点。

## 原因

Actions 为代理提供带有结构化输入/输出的可调用工具，同时它们通过 hooks 为前端提供类型化的客户端契约。一个实现同时服务于代理和 UI。它们保持代理的聊天上下文清洁，可复用，并且可以独立测试。

## 保持 Action 表面小而正交

每个代理暴露的 action 都是模型上下文窗口中的一个工具。每个都有实际成本：更多工具意味着模型需要读取、消歧和选择的更多内容，这会降低工具选择质量。像维护 API 一样对待 action 列表 — 添加最少的、最正交的覆盖能力的 actions，而不是每个 UI 功能一个。

- **优先使用一个 CRUD 风格的 `update` 而不是 N 个每字段 action。** 一个接受可选字段补丁的 `update-<thing>` 优于 `update-<thing>-name`、`update-<thing>-order`、`update-<thing>-color`……代理（和 UI）只传递更改的字段。`create`/`delete` 也是一样 — 每个资源一个正交 action，而不是每个代码路径一个。
- **在铸造新的读取 action 之前先考虑通用查询/逃生舱。** 如果代理需要更多或不同的数据，不要添加 `get-<thing>-by-x`、`list-<thing>-filtered-by-y` 等。对于提供者数据，暴露共享的 `provider-api-catalog` / `provider-api-docs` / `provider-api-request` 三件套（参见 `templates/dispatch/actions/`），这样代理可以访问任何端点或过滤器而无需每次新建 action。对于开发中的应用数据，`db-query` 工具已经可以回答任意读取问题。
- **使用 `agentTool: false` 将仅 UI 或纯编程 action 从模型中隐藏。** 仅前端或 HTTP/cron 调用者需要的 action 不应占用模型工具列表中的位置。`agentTool: false` 保持它可从 `useActionMutation` / `callAction` / `/_agent-native/actions/<name>` 调用，同时从每个代理工具表面（应用内助手、MCP、A2A）中移除。
- **`agentTool: false` 不是 `toolCallable: false`。** 它们是不同的开关：
  - `agentTool: false` → 从**模型完全隐藏**（它不再是代理可以查看或调用的工具）。仍然可从前端/HTTP 调用。
  - `toolCallable: false` → 仅阻止**沙箱化扩展（"tools"）iframe 桥接**（`appAction(...)`）。action 对模型、UI、CLI、MCP 和 A2A 仍然完全可见。将其用于高爆炸半径操作（账户/组织/认证更改），而不是用于修剪工具列表。
- **移除或隐藏过时的 actions。** 当 UI 停止使用 action 时，删除它或设置 `agentTool: false` — 不要将其作为死工具重量暴露给模型。下面的建议审计帮助你发现这些。

### 审计脚本（建议性）

`pnpm actions:audit [template ...]`（或 `node scripts/audit-template-actions.mjs`）静态扫描模板的 `actions/` 并打印两种建议：

1. **可能 UI 已废弃** — HTTP 暴露的变更 action，其名称从未在 `app/` 下被引用（删除或标记 `agentTool: false` 的候选）。
2. **可能冗余的集群** — 像 `update-foo-name` / `update-foo-order` 这样的组，可以合并为一个正交的 `update-foo`。

它**仅是建议性的**：始终以退出码 0 退出，从不导致 CI 失败，并使用保守的启发式方法，因此预期会有一些误报（例如，代理调用但 UI 不调用的 action）。将其作为审查的提示，而不是门槛。

## 如何创建 Action

使用带有 Zod schema 的 `defineAction`（新 action 必需）：

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

`schema` 字段接受 Zod schema（或任何 Standard Schema 兼容的库）。它提供带有清晰错误消息的运行时验证（HTTP 返回 400，代理返回错误结果），`run()` args 的完整 TypeScript 类型推断，以及为代理工具定义自动生成的 JSON Schema。`zod` 是所有模板的依赖项。

当 action 读写应用数据时，使用 Drizzle 的查询构建器和 `drizzle-orm` 中的可移植操作符。除非有文档记录的原因 Drizzle 无法表达查询，否则不要在普通 actions 中使用原始 SQL、`getDbExec()` 或特定方言的 schema 导入。

当 action 调用外部服务时，切勿硬编码 API 密钥、bearer 令牌、webhook URL、签名密钥、OAuth 刷新令牌、私有 Builder/内部数据或客户数据。从 `readAppSecret`、`resolveCredential`、OAuth 令牌辅助函数或提供者 API 凭据适配器读取用户/组织/工作区凭据。仅对明确的部署级配置使用 `process.env`，并在示例中使用明显的占位符。

提示：
- 使用 `.describe()` 为参数添加描述
- 使用 `.optional()` 处理可选参数
- 使用 `z.coerce.number()` 处理从 HTTP 以字符串形式到达的数字参数。
  对于布尔值，使用显式的字符串解析器/辅助函数，而不是
  `z.coerce.boolean()`，因为 JavaScript 将任何非空字符串
  （包括 `"false"`）视为真值。
- 使用 `z.enum(["draft", "published"])` 处理约束值

旧的 `parameters` 字段（纯 JSON Schema 对象）仍可作为后备使用，但不提供运行时验证或类型推断。

## 决策顺序

当你需要应用数据或变更时：

1. **使用现有 action** 如果已有执行该操作的。
2. **创建或扩展 `defineAction`** 当代理和 UI 都需要新操作时。
3. **仅为路由专用关注点创建自定义路由**，如上传、流式传输、webhook、OAuth 回调或非 JSON 协议。

不要构建伞式 REST API 来使 actions "更容易"调用。Actions 已可通过代理、CLI、React hooks、HTTP、MCP/A2A 暴露和外部主机通过框架调用。

## 灵活的提供者 API

对于用于临时分析、查询、报告或跨源研究的提供者集成，不要将每个提供者端点硬编码为单独的刚性 action，也不要将一个回溯窗口、过滤器形状或分页策略编码为代理可以采用的唯一路径。而是暴露共享的提供者 API action 三件套：

- `provider-api-catalog`：列出提供者基础 URL、认证风格、凭据键、文档/spec URL、占位符和示例，不暴露密钥。
- `provider-api-docs`：当确切的端点、过滤操作符、载荷形状或分页契约不确定时，获取公共提供者文档/spec/变更日志 URL。注册的文档 URL 是策划的起点。使用 `responseMode: "markdown"` 获取清晰可读的文档，或使用 `responseMode: "matches"` 加 `search: { query | terms | regex }` 获取紧凑片段，而不是用原始 HTML 淹没上下文。
- `provider-api-request`：向提供者主机发出受限的认证 HTTP 请求，注入配置的凭据，阻止私有/内部 URL，并编辑密钥。

使用 `@agent-native/core/provider-api` 作为共享基底。模板仅应在具有应用特定凭据查找规则时添加薄凭据适配器。如果应用将内置提供者的 OAuth 授权存储在更窄的本地提供者 ID 下，使用运行时的 `oauthProviderOverrides` 而不是重复提供者配置。如果凭据存储在可共享/资源行上而不是共享凭据或 OAuth 令牌存储中，构建一个在暴露原始提供者请求之前强制执行这些访问检查的解析器。保持 `provider-api-request` `http: false`，除非你有单独的 UI 权限模型用于任意提供者写入。特定 actions 如 `search-records`、`search-emails` 或 `sync-source` 是便捷快捷方式，不是能力限制；当问题需要快捷方式未建模的端点或过滤器时，代理应回退到提供者 API 三件套。

这是框架的一项原则。安全边界应该是提供者主机白名单、凭据范围限定、认证注入、私有网络阻止、密钥编辑和用户/组织访问检查，而不是人工编写的小型读取 actions 集合。如果上游提供者 API 支持某项功能，代理通常应该能够通过 `provider-api-request` 使用用户配置的凭据访问它。对于大型响应，暴露暂存（`stageAs`、`itemsPath`、分页和 `query-staged-dataset`）或沙箱化代码执行，这样代理可以减少数据而不淹没上下文。

对于广泛的提供者问题、跨源连接、语料库范围的提及/搜索工作、分类或任何缺失很重要的答案，设计 action 表面以实现完整覆盖而不是仅便利的样本。代理应该能够获取每个相关页面或明确限定的队列，在聊天外暂存或保存原始提供者响应，然后使用 `query-staged-dataset`、`run-code` 或提供者端搜索来计数、连接、grep、分类和聚合。工具描述和 AGENTS.md 指导应教导代理报告来源、过滤器、时间窗口、行/记录计数、分页状态、截断、失败页面和未覆盖的空白。它们绝不能将默认限制、采样行、截断摘录或中止调用变成自信的"未找到"、"所有记录"或穷尽性结论。

对于公共网页和文档，优先使用令牌高效的路径：`web-search` 查找可能的 URL，`web-request` 或 `provider-api-docs` 加干净的 `responseMode` 输出读取页面，以及 `run-code` 加 `webRead()` / `webFetch()` 当需要在返回小结果之前 grep、聚合或比较许多页面时。

### `http` 选项

控制 action 如何作为 HTTP 端点暴露：

| 值                     | 行为                                                    | 用于                          |
| ------------------------- | ----------------------------------------------------------- | -------------------------------- |
| _(省略)_               | 自动暴露为 `POST /_agent-native/actions/:name`         | 写入操作（默认）       |
| `{ method: "GET" }`       | 自动暴露为 `GET /_agent-native/actions/:name`          | 只读查询                |
| `{ method: "PUT" }`       | 自动暴露为 `PUT /_agent-native/actions/:name`          | 更新操作                |
| `{ method: "DELETE" }`    | 自动暴露为 `DELETE /_agent-native/actions/:name`       | 删除操作                |
| `{ method: "GET", path: "custom" }` | 自动暴露为 `GET /_agent-native/actions/custom` | 自定义路由路径                |
| `false`                   | 仅代理可用，从不作为 HTTP 暴露                           | `navigate`、`view-screen`、内部 actions |

### 屏幕刷新（自动）

框架在任何成功的变更 action 后自动刷新 UI。在非 `GET` action 完成时，框架发出带有 `source: "action"` 的变更事件，客户端的 `useDbSync` 捕获并用于使 `["action"]` React Query 键失效 — 因此 `list-*` / `get-*` hooks 重新获取而无需完整页面重载。进程内调用直接发出；开发模式的 `pnpm action ...` 调用也会写入持久标记，以便 Web 服务器看到子进程 action 变更。

规则：

- `http: { method: "GET" }` → 只读，不会触发刷新（自动推断）。
- 任何其他 action（默认 `POST`、`PUT`、`DELETE` 或 `http: false`）→ 视为变更操作，成功时触发刷新。
- 要在异常 action 上覆盖推断（例如仅读取的 `POST`），在 action 定义上传递 `readOnly: true`。
- 要让变更 action 与同一轮次的其他工具调用并发运行，传递 `parallelSafe: true`。仅在 action 内部并发安全且顺序无关时执行此操作（例如，它使用应用级锁或幂等 upsert 语义）。变更 actions 默认保持串行化。

代理在正常 action 后不需要调用 `refresh-screen` — 它已经被处理了。`refresh-screen` 仅在代理通过框架无法看到的路径变更数据时（例如写入应用镜像的外部系统）或代理想要传递 `scope` 提示以进行更窄的失效时才需要。

### 返回值

Actions 应返回**结构化数据**（对象、数组）— 而不是 `JSON.stringify()`。框架自动序列化响应。如果你返回字符串，框架会尝试将其解析为 JSON 以获得干净的响应。

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

`schema` 验证输入；`outputSchema` 验证 action **返回**的内容。传递任何 Standard Schema 兼容的 schema（Zod、Valibot、ArkType），框架在 `run()` 解析_之后_验证结果 — 输入在 `run` 之前验证，输出在之后验证。

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

- `"warn"`（默认）— `console.warn` 问题并**原样**返回原始结果。非破坏性的。
- `"strict"` — 抛出清晰的错误，使有 bug 的 action 大声暴露。
- `"fallback"` — 用 `outputFallback` 替代无效结果返回。

成功时返回验证后的值，因此 `outputSchema` 上的强制转换/默认值会应用。省略 `outputSchema`，行为逐字节不变（无包装）。

### 人工审批（`needsApproval`）

对于高后果的、面向外部的、难以撤销的 actions（发送电子邮件、扣款、删除账户），设置 `needsApproval`，这样代理**不能**在没有人工批准特定调用的情况下运行 action：

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

当门控为真值且调用尚未被批准时，循环发出 `approval_required` 事件并**停止轮次 — `run()` 永远不会执行**。谓词有条件地进行门控（例如仅外部收件人）并**失败时关闭**：抛出被视为"需要批准"。人工通过聊天 UI 的"批准"功能进行批准，该功能使用调用的 `approvalKey` 重新发出轮次，只有在那之后 action 才会运行。

**保持批准罕见** — 默认是关闭的，几乎每个 action 都应保持关闭。规范示例是 Mail 的 `send-email`（`needsApproval: true`）。参见 `security` 技能和人工审批文档。

## 前端 Hooks

前端使用 `@agent-native/core/client` 中的 React Query hooks 调用 actions。组件不应手写 `fetch("/_agent-native/actions/...")`；而是添加或复用客户端 hook/辅助函数。对于不适合 hook 的命令式情况，使用同一包中的 `callAction`，如防抖搜索、预取或非 React 事件处理器。

### `useActionQuery` — 用于 GET actions

```ts
import { useActionQuery } from "@agent-native/core/client";

function MealList() {
  // 类型从 action 的 schema + 返回类型自动推断 — 不需要手动泛型
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
  // 类型自动推断 — 不需要手动泛型
  const { mutate } = useActionMutation("log-meal");
  return (
    <button onClick={() => mutate({ name: "Salad", calories: 350 })}>
      Log Meal
    </button>
  );
}
```

**不要使用手动类型泛型**如 `useActionQuery<Meal[]>(...)`。类型从 `.generated/action-types.d.ts` 自动推断，该文件由 Vite 插件自动生成。

变更操作成功后自动使所有 `["action"]` 查询键失效，因此 GET 查询重新获取。

### `callAction` — 用于命令式客户端代码

```ts
import { callAction } from "@agent-native/core/client";

const people = await callAction("search-people", { query }, { method: "GET" });
```

在 React 数据流中优先使用 hooks。当 hook 不方便时使用 `callAction`；
不要在组件中手写 action 路由 fetch。

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

这是新应用的规范方法。Action 名称必须仅使用小写字母和连字符（例如 `my-action`）。

## 当你仍然需要自定义 `/api/` 路由时

大多数操作应该是 actions。你只需要在 `server/routes/api/` 中使用自定义路由来处理：

- **文件上传** — actions 接收 JSON 参数，而不是多部分表单数据
- **流式响应** — 需要直接 H3 控制的 SSE 或分块响应
- **Webhook** — 外部服务 POST 到特定 URL
- **OAuth 回调** — 需要特定 URL 模式的基于重定向的流程

如果是标准 CRUD 操作、数据查询或 action 的包装器，请改用 action。

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

## 指导原则

- **一个 action 一个职责。** 保持 actions 聚焦于单个操作。代理组合多个 action 调用来完成复杂操作。
- **返回结构化数据。** 返回对象/数组，而不是 `JSON.stringify()`。
- **使用 `http: { method: "GET" }`** 处理只读 actions。默认为 POST。
- **使用 `http: false`** 处理仅代理 actions（`navigate`、`view-screen`）。
- **使用 `agentTool: false`** 处理不应成为模型上下文窗口中工具的仅 UI/编程 actions。它保持可从前端/HTTP 调用但对代理隐藏。与 `toolCallable: false` 不同，后者仅阻止沙箱化扩展 iframe 桥接。
- **记录可复用的 actions。** 如果新 action 应该被一个狭窄屏幕之外的代理调用，在 `AGENTS.md` 中更新何时使用它、重要参数和应保留的返回字段。
- **将工作流繁重的 actions 提升为技能。** 如果 action 是提供者支持的、跨应用的、MCP/A2A 或多步工作流的一部分，在 `.agents/skills/` 中创建或更新技能，并在应通过市场发布时添加应用技能可见性（`internal`、`exported` 或 `both`）。
- **仅对部署级配置使用 `loadEnv()`。** 用户/组织/工作区凭据属于加密的 secrets/credential/OAuth 存储，从不作为硬编码字面量或共享环境变量后备。
- **使用 `fail()`** 处理用户友好的错误消息（以消息退出，无堆栈跟踪）。
- **从 `@agent-native/core/action` 导入 action 基础组件**，CLI 辅助函数如 `parseArgs()` 从 `@agent-native/core` 导入 — 不要在本地重新定义框架工具。
- **不要将 actions 重新导出为 REST。** 挂载的 `/_agent-native/actions/:name` 端点就是 REST 表面；在 `/api/*` 下复制它会造成漂移并对代理隐藏操作。

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

- **找不到 Action** — 检查文件名是否与命令名完全匹配。`pnpm action foo-bar` 查找 `actions/foo-bar.ts`。
- **参数无法解析** — 确保参数使用 `--key value` 或 `--key=value` 格式。布尔标志使用 `--flag`（将值设为 `"true"`）。
- **前端收到 405** — action 的 `http.method` 与 hook 不匹配。GET actions 使用 `useActionQuery`，POST/PUT/DELETE 使用 `useActionMutation`。
- **前端收到 undefined** — 确保 action 返回结构化数据，而不是 `JSON.stringify()`。

## 相关技能

- **storing-data** — Actions 在 SQL 中读写数据
- **delegate-to-agent** — 代理通过 `pnpm action <name>` 调用 actions
- **real-time-sync** — 来自 actions 的数据库写入触发变更事件以更新 UI
- **adding-a-feature** — Actions 是四领域检查清单的第 2 个领域
- **client-methods** — 客户端代码使用命名的辅助函数/hooks 而不是原始 REST 调用
