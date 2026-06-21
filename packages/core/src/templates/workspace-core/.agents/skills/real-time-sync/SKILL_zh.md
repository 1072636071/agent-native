---
name: real-time-sync
description: >-
  如何通过 SSE 加轮询回退保持 UI 与 Agent 变更同步。在为新数据模型接入查询失效、调试 UI 不更新问题或理解抖动防止时使用。
metadata:
  internal: true
---

# 实时同步

## 规则

UI 通过 `useDbSync()` 与 Agent/脚本变更保持同步。进程内写入首先通过 `/_agent-native/events` 流式传输；`/_agent-native/poll` 仍然是跨进程/Serverless 的回退。当 Agent 写入数据库时，UI 检测到变更并自动更新——无需手动刷新。

## 原因

Agent 在 SQL 中修改数据，但 UI 在浏览器中运行。SSE 立即桥接同进程写入；轮询桥接 SSE 无法看到的任何内容，例如另一个 Serverless 调用、定时任务或外部脚本。每次可见写入递增版本计数器，`useDbSync()` 接收变更，React Query 使相关缓存失效。这就是让数据库写入感觉实时的方式，而不依赖激进的轮询。

## 工作原理

1. **服务端**在每次数据库写入时递增版本计数器。进程内事件通过认证的 `/_agent-native/events` 端点流式传输。

2. **客户端**监听同步事件并更新每个源的变更计数器：

   ```ts
   import { useDbSync } from "@agent-native/core/client";
   useDbSync({ queryClient });
   ```

   对于每个非自身事件，`useDbSync` 递增每个源的计数器（例如 `dashboards`、`analyses`、`settings`、`action`）并使一个小的固定框架内部前缀列表失效（`["action"]`、`["app-state"]`、`["__set_url__"]` 等）。它**不会**对模板自己的数据查询进行批量失效——这在生产中导致了请求风暴。例外是 `source: "action"`：成功的变更 action 是框架范围的"Agent 更改了应用数据"信号，因此 `useDbSync` 还会刷新活跃的 React Query 观察者，作为尚未将每个读取迁移到 `useActionQuery` 或源版本化查询键的自定义应用的兼容性安全网。

3. **模板将每个源的计数器折叠到查询键中。** 这就是让"Agent 写入无需手动刷新即可显示"可靠的模式：

   ```ts
   import { useChangeVersion } from "@agent-native/core/client";
   import { useQuery } from "@tanstack/react-query";

   const v = useChangeVersion("dashboards");
   const dashboard = useQuery({
     queryKey: ["dashboard", id, v],
     queryFn: () => fetchDashboard(id),
     placeholderData: (prev) => prev, // 重新获取时不闪烁
   });
   ```

   当 Agent 写入（`update-dashboard` action → 服务端发出 `source: "dashboards"`），计数器前进，queryKey 变更，React Query 重新获取该查询。旧数据在重新获取期间通过 `placeholderData` 保留在屏幕上。

   对于列表/侧边栏查询，使用相同模式——将计数器传入你想保持新鲜的每个列表查询的 queryKey。

4. **回退**轮询调用 `/_agent-native/poll?since=N`。它每 2 秒运行一次直到 SSE 连接，然后放宽到 15 秒（`SSE_FALLBACK_INTERVAL_MS`）。如果 SSE 被禁用或不可用（例如边缘/Serverless 部署），轮询以 2 秒节奏继续。轮询是通用的 Serverless 回退——即使写入发生在不同进程或调用中，它也能检测 DB 时间戳变更。

5. 当 Agent 写入数据库时，版本递增，SSE/轮询检测到它，React Query 重新获取受影响的查询。

## 禁止

- 不要创建手动轮询循环——`useDbSync()` 处理 SSE 加回退轮询
- 不要在 `useDbSync` 旁边创建自己的基于 fetch 的轮询——使用 `onEvent` 回调进行自定义处理

## 依赖哪些源

常见的源，你将折叠到查询键中：

| 源                 | 递增时机                                                                   |
| ------------------ | -------------------------------------------------------------------------- |
| `action`           | Agent 运行器在每次成功的变更 action 工具调用后                             |
| `app-state`        | 写入 `application_state`（导航、选择、临时 UI 状态）                       |
| `settings`         | 写入 `settings` 表                                                         |
| `dashboards`       | 通过 `upsertDashboard` / `archiveDashboard` 等进行的 Dashboard CRUD       |
| `analyses`         | 分析 CRUD                                                                  |
| `extensions`       | 扩展 CRUD                                                                 |
| `collab`           | Yjs 协作文档更新                                                           |
| `screen-refresh`   | 显式 `refresh-screen` Agent 工具调用                                       |

如果查询读取的数据 Agent 可以通过多个路径变更，使用 `useChangeVersions` 依赖多个源：

```ts
const v = useChangeVersions(["dashboards", "action"]);
useQuery({ queryKey: ["dashboard", id, v], ... });
```

`useChangeVersions` 返回一个整数，当列出的任何源前进时它就前进。

## 调整重新获取行为

为防止快速 Agent 写入期间的缓存抖动，在查询上设置 `staleTime`：

```ts
useQuery({
  queryKey: ["items"],
  queryFn: fetchItems,
  staleTime: 2000, // 2 秒内不重新获取
});
```

## 故障排除

| 症状                             | 检查                                                                                                    |
| -------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Agent 写入后 UI 不更新           | `useDbSync` 是否使用了正确的 `queryClient` 调用？受影响的查询是否有活跃的观察者？                        |
| 轮询端点不响应                   | `/_agent-native/poll` 是否可访问？服务器是否在运行？                                                    |
| SSE 不连接                       | `/_agent-native/events` 是否可访问且已认证？轮询仍应作为回退保持 UI 新鲜。                               |
| 高 CPU / 事件风暴                | Agent 正在快速写入。在查询上添加 `staleTime` 来防抖重新获取。                                           |

## 抖动防止

当 Agent 通过脚本辅助函数（`writeAppState`、`deleteAppState`）写入应用状态时，写入会自动标记 `requestSource: "agent"`。这防止 UI 在收到变更事件时覆盖活跃的用户编辑。

### 工作原理

1. **Agent 写入**被标记：`@agent-native/core/application-state` 中的脚本辅助函数传递 `{ requestSource: "agent" }` 给存储。
2. **UI 写入**被标记：模板在 PUT/DELETE 请求到应用状态端点时通过 `X-Request-Source` 头发送每个标签页的 ID。
3. **同步过滤**：`useDbSync()` 接受 `ignoreSource` 选项。UI 传入自己的标签页 ID，这样它忽略来自自身写入的事件——但仍然接收来自 Agent、其他标签页和脚本的事件。

### 模板设置

```ts
// app/lib/tab-id.ts
export const TAB_ID = `tab-${Math.random().toString(36).slice(2, 8)}`;

// app/root.tsx
import { TAB_ID } from "@/lib/tab-id";

useDbSync({
  queryClient,
  ignoreSource: TAB_ID,
});
```

`use-navigation-state.ts` 钩子在写入导航状态时在 `X-Request-Source` 头中发送相同的 `TAB_ID`，因此写入状态的标签页不会重新获取它。

### 为什么这很重要

没有抖动防止，会出现循环：UI 写入状态，同步检测到变更，UI 重新获取并重新渲染，可能覆盖用户正在编辑的内容。有了 `ignoreSource`，UI 只对来自其他源（Agent 脚本、其他浏览器标签页、其他用户）的变更做出反应。

## Action 路由和实时同步

Action 与相同的同步系统协同工作。当变更 action 写入数据库时，版本计数器递增，`useDbSync` 接收变更。通过 `useActionMutation` 的前端变更在成功时自动使 `["action"]` 查询键失效，触发 `useActionQuery` 钩子的重新获取。客户端组件应通过这些钩子调用 action，而不是使用原始 action 路由 fetch。

对于自定义应用，最佳开箱即用路径是：

1. 在 `actions/` 中使用 `defineAction({ http: { method: "GET" } })` 放置读取 action。
2. 在 `actions/` 中使用默认的 POST/PUT/DELETE 行为放置写入 action。
3. 在 React 中使用 `useActionQuery` 调用读取，使用 `useActionMutation` 调用写入。

这避免了重复的 `/api/*` JSON CRUD 路由，并使 Agent 创建的记录自动显示。原始 `useQuery` 仍然可以工作，但它应该在查询键中包含 `useChangeVersions(["action", "<domain-source>"])` 以实现定向刷新。

### 变更 action 自动发出事件

每当任何非只读 action 运行完成时，框架发出 `source: "action"` 的变更事件——无论是通过 HTTP（`/_agent-native/actions/:name`）还是 Agent 工具调用。只读 action（`http: { method: "GET" }` 或显式 `readOnly: true`）被跳过。

这意味着 UI 不需要 Agent 记住在每次变更后调用 `refresh-screen`。像这样的监听器（在 `macros` 模板中使用）将在任何变更 Agent 调用后刷新：

```ts
useDbSync({
  queryClient,
  ignoreSource: TAB_ID,
  onEvent: (data) => {
    if (data.requestSource === TAB_ID) return;
    // 使所有 useActionQuery 缓存失效，使 list-*、get-* 等重新获取
    queryClient.invalidateQueries({ queryKey: ["action"] });
  },
});
```

`refresh-screen` 仍然可用于异常情况——例如 Agent 通过框架无法看到的路径变更数据（应用镜像的外部系统），或 Agent 想要传递 `scope` 提示进行更窄的失效。

## 保持有状态组件同步

上面的 `useChangeVersion` / `useActionQuery` 模式保持**查询层**新鲜。但将服务器值复制到本地 React 状态的组件在 Agent 编辑时仍然会过时——重新获取查询更新了 prop，但本地副本永远不会重新采用它。这是一个反复出现的 Bug。

**永远不要对 Agent 可以变更的值这样做：**

```ts
// BUG：`title` 只捕获一次，永远不会重新读取 prop。
const [title, setTitle] = useState(props.title);
```

当 Agent 重命名记录时，查询重新获取，`props.title` 更新，但输入仍然显示过时的值，直到组件重新挂载。

**派生状态表面（表单字段、内联编辑器、弹出框）：使用 `useReconciledState`。** 它在外部权威值变更时重新采用它，除非用户正在主动编辑该字段——因此 Agent 变更会实时显示，而不会破坏正在进行的输入：

```ts
import { useReconciledState } from "@agent-native/core/client";

// `active` = true 当用户正在编辑此字段时（聚焦/脏状态）。
const [title, setTitle] = useReconciledState(props.title, { active: isEditing });
```

**协作富文本编辑器不同** — 它们不会将值复制到 `useState`。它们在 `updatedAt` 门控和主导客户端选举下将权威 SQL 内容协调到共享 Y.Doc 中。参见 `real-time-collab` → "Agent 编辑作为实时对等编辑器"。不要对 Yjs 支持的编辑器使用 `useReconciledState`。

| 表面                                         | 保持新鲜的方式                                                     |
| -------------------------------------------- | ------------------------------------------------------------------ |
| React Query 读取                             | `useChangeVersion` / `useActionQuery`（上述）                      |
| 从服务器值复制的本地编辑状态（输入框、弹出框、内联编辑器） | `useReconciledState(externalValue, { active })`                    |
| 协作富文本编辑器（Yjs）                       | `updatedAt` 门控协调 + `isReconcileLeadClient` — 参见 `real-time-collab` |

## 非主体字段的细粒度服务端合并

对于结构化文档（幻灯片、表单构建器、设计文件），其中 Yjs 主体协作会在容器级别导致 LWW 冲突，将变更同步的 `updatedAt` 递增与**细粒度服务端合并 action** 配对，该 action 接受定向的每项操作（添加/修补/删除/重排序）。对不同项的并发编辑在 action 级别都能存活；`collab` 源版本递增然后将合并状态传播到所有打开的客户端。参见 `real-time-collab` 了解模式和示例。

## 相关技能

- **storing-data** — 应用状态和设置是通过变更事件同步的数据存储
- **context-awareness** — 导航状态写入使用抖动防止来避免覆盖活跃编辑
- **actions** — 变更 action 触发变更事件
- **client-methods** — 路由细节属于辅助函数/钩子，而不是组件
- **self-modifying-code** — Agent 代码编辑触发变更事件；快速编辑可能导致事件风暴
- **real-time-collab** — 协作编辑器将 Agent 编辑协调到共享 Y.Doc 中，由相同的变更同步 `updatedAt` 递增驱动；也是结构化数据的细粒度服务端合并模式