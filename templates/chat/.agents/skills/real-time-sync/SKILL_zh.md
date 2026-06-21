---
name: real-time-sync
description: >-
  如何通过 SSE 加轮询回退保持 UI 与智能体变更同步。
  在为新数据模型连接查询失效、调试 UI 不更新问题或了解抖动防护时使用。
metadata:
  internal: true
---

# 实时同步

## 规则

UI 通过 `useDbSync()` 与智能体/脚本变更保持同步。进程内写入首先通过 `/_agent-native/events` 流式传输；`/_agent-native/poll` 仍然是跨进程/无服务器的回退。当智能体写入数据库时，UI 检测到变更并自动更新 — 无需手动刷新。

## 原因

智能体在 SQL 中修改数据，但 UI 在浏览器中运行。SSE 立即桥接同进程写入；轮询桥接 SSE 无法看到的任何内容，例如另一个无服务器调用、cron 作业或外部脚本。每次可见写入递增版本计数器，`useDbSync()` 接收变更，React Query 使相关缓存失效。这就是使数据库写入感觉实时而无需依赖激进轮询的原因。

## 工作原理

1. **服务器**在每次数据库写入时递增版本计数器。进程内事件通过认证的 `/_agent-native/events` 端点流式传输。

2. **客户端**监听同步事件并更新每个源的变更计数器：

   ```ts
   import { useDbSync } from "@agent-native/core/client";
   useDbSync({ queryClient });
   ```

   对于每个非自身事件，`useDbSync` 递增每个源的计数器（如 `dashboards`、`analyses`、`settings`、`action`），并使一个小的固定框架内部前缀列表失效（`["action"]`、`["app-state"]`、`["__set_url__"]` 等）。它**不会**对模板自己的数据查询进行普通领域事件的全面失效 — 那在生产中引起了请求风暴。例外是 `source: "action"`：成功的变更 action 是框架范围的"智能体更改了应用数据"信号，因此 `useDbSync` 还刷新活跃的 React Query 观察者，作为尚未将每个读取迁移到 `useActionQuery` 或源版本化查询键的自定义应用的兼容性安全网。

3. **模板将每个源的计数器折叠到其查询键中。** 这是使"智能体写入无需手动刷新即可显示"可靠的模式：

   ```ts
   import { useChangeVersion } from "@agent-native/core/client";
   import { useQuery } from "@tanstack/react-query";

   const v = useChangeVersion("dashboards");
   const dashboard = useQuery({
     queryKey: ["dashboard", id, v],
     queryFn: () => fetchDashboard(id),
     placeholderData: (prev) => prev, // 重新获取时无闪烁
   });
   ```

   当智能体写入时（`update-dashboard` action → 服务器发出 `source: "dashboards"`），计数器前进，queryKey 变更，React Query 重新获取该查询。由于 `placeholderData`，旧数据在重新获取期间仍显示在屏幕上。

   对于列表/侧边栏查询，使用相同模式 — 将计数器传入你想要保持新鲜的每个列表查询的 queryKey 中。

4. **回退**轮询调用 `/_agent-native/poll?since=N`。它在 SSE 连接前每 2 秒运行一次，然后放宽到 15 秒（`SSE_FALLBACK_INTERVAL_MS`）。如果 SSE 被禁用或不可用（例如边缘/无服务器部署），轮询以 2 秒节奏继续。轮询是通用的无服务器回退 — 即使写入发生在不同进程或调用中，它也能检测 DB 时间戳变更。

5. 当智能体写入数据库时，版本递增，SSE/轮询检测到它，React Query 重新获取受影响的查询。

## 不应该做的

- 不要创建手动轮询循环 — `useDbSync()` 处理 SSE 加回退轮询
- 不要在 `useDbSync` 旁边创建自己的基于 fetch 的轮询 — 使用 `onEvent` 回调进行自定义处理

## 依赖哪些源

你将折叠到查询键中的常见源：

| 源                 | 递增时机                                                                   |
| ------------------ | -------------------------------------------------------------------------- |
| `action`           | 智能体运行器在每次成功的变更 action 工具调用后                             |
| `app-state`        | 写入 `application_state`（导航、选择、临时 UI 状态）                       |
| `settings`         | 写入 `settings` 表                                                         |
| `dashboards`       | 通过 `upsertDashboard` / `archiveDashboard` 等进行的 Dashboard CRUD        |
| `analyses`         | Analysis CRUD                                                              |
| `extensions`       | Extension CRUD                                                             |
| `collab`           | Yjs 协作文档更新                                                           |
| `screen-refresh`   | 显式 `refresh-screen` 智能体工具调用                                       |

如果查询读取的数据智能体可以通过多个路径变更，使用 `useChangeVersions` 依赖多个源：

```ts
const v = useChangeVersions(["dashboards", "action"]);
useQuery({ queryKey: ["dashboard", id, v], ... });
```

`useChangeVersions` 返回一个整数，当列出的任何源前进时该整数前进。

## 调整重新获取行为

为了防止智能体快速写入期间的缓存抖动，在查询上设置 `staleTime`：

```ts
useQuery({
  queryKey: ["items"],
  queryFn: fetchItems,
  staleTime: 2000, // 2 秒内不重新获取
});
```

## 故障排除

| 症状                             | 检查                                                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 智能体写入后 UI 不更新           | `useDbSync` 是否使用正确的 `queryClient` 调用？受影响的查询是否有活跃的观察者？                               |
| 轮询端点不响应                   | `/_agent-native/poll` 是否可访问？服务器是否运行？                                                            |
| SSE 不连接                       | `/_agent-native/events` 是否可访问且已认证？轮询仍应作为回退保持 UI 新鲜。                                    |
| 高 CPU / 事件风暴               | 智能体正在快速写入。为查询添加 `staleTime` 以防抖重新获取。                                                   |

## 抖动防护

当智能体通过脚本辅助函数（`writeAppState`、`deleteAppState`）写入 application-state 时，写入自动标记为 `requestSource: "agent"`。这防止 UI 在接收到变更事件时覆盖活跃的用户编辑。

### 工作原理

1. **智能体写入**被标记：`@agent-native/core/application-state` 中的脚本辅助函数将 `{ requestSource: "agent" }` 传递给存储。
2. **UI 写入**被标记：模板通过 `X-Request-Source` 头在 application-state 端点的 PUT/DELETE 请求上发送每个标签页的 ID。
3. **同步过滤**：`useDbSync()` 接受 `ignoreSource` 选项。UI 传递自己的标签页 ID，以便忽略来自自身写入的事件 — 但仍接收来自智能体、其他标签页和脚本的事件。

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

`use-navigation-state.ts` hook 在写入导航状态时在同一 `TAB_ID` 的 `X-Request-Source` 头中发送，因此写入状态的标签页不会重新获取它。

### 为什么这很重要

没有抖动防护，会发生循环：UI 写入状态，同步检测到变更，UI 重新获取并重新渲染，可能覆盖用户正在活跃编辑的内容。有了 `ignoreSource`，UI 仅对来自其他源（智能体脚本、其他浏览器标签页、其他用户）的变更做出反应。

## Action 路由和实时同步

Action 与同一同步系统配合工作。当变更 action 写入数据库时，版本计数器递增，`useDbSync` 接收变更。通过 `useActionMutation` 的前端变更在成功时自动使 `["action"]` 查询键失效，触发 `useActionQuery` hooks 的重新获取。客户端组件应通过这些 hooks 调用 action，而非使用原始 action 路由 fetch。

对于自定义应用，最佳开箱即用路径是：

1. 将读取 action 放在 `actions/` 中，使用 `defineAction({ http: { method: "GET" } })`。
2. 将写入 action 放在 `actions/` 中，使用默认的 POST/PUT/DELETE 行为。
3. 从 React 使用 `useActionQuery` 调用读取，使用 `useActionMutation` 调用写入。

这避免了重复的 `/api/*` JSON CRUD 路由，并使智能体创建的记录自动显示。原始 `useQuery` 仍可工作，但它应在查询键中包含 `useChangeVersions(["action", "<domain-source>"])` 以实现定向刷新。

### 变更 action 时自动发出事件

框架在任何非只读 action 运行完成时发出 `source: "action"` 的变更事件 — 无论通过 HTTP（`/_agent-native/actions/:name`）还是作为智能体工具调用。只读 action（`http: { method: "GET" }` 或显式 `readOnly: true`）被跳过。

这意味着 UI 不需要智能体记住在每次变更后调用 `refresh-screen`。像这样的监听器（在 `macros` 模板中使用）将在任何变更智能体调用后刷新：

```ts
useDbSync({
  queryClient,
  ignoreSource: TAB_ID,
  onEvent: (data) => {
    if (data.requestSource === TAB_ID) return;
    // 使所有 useActionQuery 缓存失效，以便 list-*、get-* 等重新获取
    queryClient.invalidateQueries({ queryKey: ["action"] });
  },
});
```

`refresh-screen` 在异常情况下仍然可用 — 例如智能体通过框架无法看到的路径变更数据（应用镜像的外部系统），或智能体想要传递 `scope` 提示以进行更窄的失效。

## 保持有状态组件同步

上述 `useChangeVersion` / `useActionQuery` 模式保持**查询层**新鲜。但将服务器值复制到本地 React 状态的组件在智能体编辑时仍会过时 — 重新获取查询更新了 prop，但本地副本永远不会重新采用它。这是一个反复出现的 bug。

**对于智能体可以变更的值，绝不要这样做：**

```ts
// BUG：`title` 被捕获一次且永远不会重新读取 prop。
const [title, setTitle] = useState(props.title);
```

当智能体重命名记录时，查询重新获取，`props.title` 更新，但输入仍显示过时的值，直到组件重新挂载。

**派生状态表面（表单字段、内联编辑器、弹出框）：使用 `useReconciledState`。** 它在外部权威值变更时重新采用它，除非用户正在活跃编辑该字段 — 因此智能体变更实时显示而不会破坏进行中的输入：

```ts
import { useReconciledState } from "@agent-native/core/client";

// `active` = true 当用户正在编辑此字段时（聚焦 / 脏数据）。
const [title, setTitle] = useReconciledState(props.title, { active: isEditing });
```

**协作富文本编辑器不同** — 它们不会将值复制到 `useState` 中。它们在 `updatedAt` 门控和主导客户端选举下将权威 SQL 内容协调到共享 Y.Doc 中。请参阅 `real-time-collab` → "智能体编辑作为实时对等编辑器"。不要为 Yjs 支持的编辑器使用 `useReconciledState`。

| 表面 | 保持新鲜的方式 |
| ---- | -------------- |
| React Query 读取 | `useChangeVersion` / `useActionQuery`（上文） |
| 从服务器值复制的本地编辑状态（输入、弹出框、内联编辑器） | `useReconciledState(externalValue, { active })` |
| 协作富文本编辑器（Yjs） | `updatedAt` 门控协调 + `isReconcileLeadClient` — 请参阅 `real-time-collab` |

## 非主体字段的粒度服务器端合并

对于结构化文档（幻灯片组、表单构建器、设计文件），其中 Yjs 主体协作者会在容器级别导致 LWW 冲突，将变更同步的 `updatedAt` 提升与**粒度服务器端合并 action** 配对，该 action 接受定向的每项操作（添加/补丁/删除/重排序）。对不同项的并发编辑在 action 级别都能存活；`collab` 源版本提升然后将合并状态传播到所有打开的客户端。请参阅 `real-time-collab` 了解模式和示例。

## 相关技能

- **storing-data** — Application-state 和 settings 是通过变更事件同步的数据存储
- **context-awareness** — 导航状态写入使用抖动防护以避免覆盖活跃编辑
- **actions** — 变更 action 触发变更事件
- **client-methods** — 路由细节属于辅助函数/hooks，而非组件
- **self-modifying-code** — 智能体代码编辑触发变更事件；快速编辑可能导致事件风暴
- **real-time-collab** — 协作编辑器将智能体编辑协调到共享 Y.Doc 中，由同一变更同步 `updatedAt` 提升驱动；也是结构化数据的粒度服务器端合并模式