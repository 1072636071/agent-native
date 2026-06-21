---
name: context-awareness
description: >-
  agent 如何知道用户正在查看什么。在向 agent 暴露 UI 状态、实现
  view-screen 或 navigate action、连接导航状态或调试 agent 上下文
  问题时使用。
metadata:
  internal: true
---

# 上下文感知

## 规则

Agent 必须始终知道用户当前正在查看什么。UI 在每次路由变更时写入导航状态。Agent 在行动前读取它。

## 为什么

没有上下文感知，agent 是盲目的。当用户正盯着某封邮件时它问"哪封邮件？"。它无法对当前选择进行操作，无法提供相关建议，无法修改用户看到的内容。上下文感知是让 agent 感觉像协作者而不是断开连接的聊天机器人的关键。

## 核心模式

### 1. 导航状态（`navigation` 键）

UI 在每次路由变更时向应用状态写入 `navigation` 键。这告诉 agent 语义屏幕状态：视图、打开的 ID、活动标签和聚焦对象。

**UI 端**——`useNavigationState`，一个应用拥有的 hook（不是框架导入），每个模板在 `app/hooks/use-navigation-state.ts` 中提供。它是框架原语 `useAgentRouteState` 的薄包装，处理双向：在路由变更时写入 `navigation` 并消费 agent 的 `navigate` 命令。

```tsx
// app/hooks/use-navigation-state.ts
import { useAgentRouteState } from "@agent-native/core/client";
import { TAB_ID } from "@/lib/tab-id";

export function useNavigationState() {
  useAgentRouteState({
    browserTabId: TAB_ID,
    requestSource: TAB_ID,
    getNavigationState: ({ pathname, searchParams }) => ({
      view: pathname === "/" ? "home" : pathname.slice(1),
      // 可选的语义别名。原始查询参数已暴露在
      // <current-url> 中，可通过 set-search-params 控制。
      label: searchParams.get("label"),
    }),
    getCommandPath: (command: any) => command.path ?? "/",
  });
}
```

**Agent 端**——行动前读取：

```ts
import { readAppState } from "@agent-native/core/application-state";

const navigation = await readAppState("navigation");
// e.g. { view: "thread", threadId: "abc123", subject: "Re: Q3 Planning" }
```

**导航状态中应包含什么：**

- `view`——当前页面/部分（如 "inbox"、"form-builder"、"dashboard"）
- 项目 ID——选中/打开的项目（如 `threadId`、`formId`、`issueKey`）
- 语义别名——标签名称、活动标签、聚焦行或 agent 应推理的稳定过滤器名称
- 任何持久选择——聚焦项、选中文本范围、活动标签

原始 URL 查询参数已由框架同步到 `__url__` 并作为 `<current-url>` 显示给内置 agent。将可共享的过滤器保留在 URL 状态中，然后在有帮助时使用 `view-screen` 将重要查询参数总结为 `activeFilters`。

### 2. 当前 URL（`__url__` 键）

`AgentPanel` 自动写入 `__url__`，包含 `{ pathname, search, hash, searchParams }`。内置 agent 在每个轮次中将其视为 `<current-url>` 块。

将其用于 URL 可达的过滤器和搜索状态。Agent 可以使用内置的 `set-search-params` 和 `set-url-path` 工具更新它；不要将整个查询字符串重复到 `navigation` 中。

### 3. `view-screen` 脚本

每个模板都应有一个 `view-screen` 脚本。它读取导航状态、当前 URL（如果过滤器重要）和选择状态。它从现有域 action、共享数据辅助函数或 Drizzle 查询获取相关数据，并返回用户所见的快照。不要仅为 `view-screen` 能读取应用数据而添加 REST 包装器。这是 agent 的眼睛。

```ts
// actions/view-screen.ts
import { readAppState } from "@agent-native/core/application-state";

export default async function main() {
  const navigation = await readAppState("navigation");
  const url = (await readAppState("__url__")) as {
    searchParams?: Record<string, string>;
  } | null;
  const screen: Record<string, unknown> = { navigation };

  if (url?.searchParams) {
    screen.activeFilters = url.searchParams;
  }

  // 根据用户正在查看的内容获取数据
  if (navigation?.view === "inbox") {
    const emails = await fetchEmailList(navigation.label);
    screen.emailList = emails;
  }
  if (navigation?.threadId) {
    const thread = await fetchThread(navigation.threadId);
    screen.thread = thread;
  }

  console.log(JSON.stringify(screen, null, 2));
}
```

**导航状态自动注入到每条用户消息中作为 `<current-screen>` 块**，因此 agent 始终拥有基本上下文而无需调用任何工具。当需要更丰富的快照时（例如获取当前视图的完整邮件线程或表单数据），`view-screen` action 仍然有用。

### 4. `navigate` 脚本

Agent 向应用状态写入一次性 `navigate` 命令。UI 读取它，执行导航，并删除该条目。

**Agent 端：**

```ts
import { writeAppState } from "@agent-native/core/application-state";

// 导航用户到特定线程
await writeAppState("navigate", { view: "inbox", threadId: "abc123" });
```

**UI 端**——使用 `useAgentRouteState`，如上所示。它轮询命令键，
去重 `_writeId`，删除已消费的命令，并应用应用本地路由。

当目标有真实 URL 时，让 `navigate` 命令携带该本地 `path`（加上有用时的语义字段），并让 UI 优先使用 `path` 再回退到语义路由。保持应用导航单通道：不要为同一导航也写入 `__set_url__`。`__set_url__` 属于框架 URL 工具（`set-url-path`、`set-search-params`）和仅 URL 的过滤器变更。如果命令可能在聊天流渲染期间到达，优先使用 `navigate(path, { replace: true, flushSync: true })` 而不是视图过渡包装器，这样 URL 和可见路由一起提交。

## 抖动防止

当 agent 通过脚本辅助函数（`writeAppState`）写入应用状态时，写入标记为 `requestSource: "agent"`。UI 使用 `useDbSync()` 上的 `ignoreSource` 选项配合每标签页 ID，这样它忽略自己的写入，同时仍然接收来自 agent、其他标签页和脚本的变更。

客户端代码可以使用 `@agent-native/core/client` 中的 `useAgentRouteState`、`useSemanticNavigationState`、`setClientAppState`、`writeClientAppState`、`readClientAppState` 和 `deleteClientAppState`，而不是手写的 `fetch` 调用。在 UI 写入时传递 `{ requestSource: TAB_ID }` 配合 `useDbSync({ ignoreSource: TAB_ID })`；为卸载期间选择清理等短命写入传递 `{ keepalive: true }`。

```ts
// app/root.tsx
import { TAB_ID } from "@/lib/tab-id";

useDbSync({
  queryClient,
  ignoreSource: TAB_ID,  // 忽略此标签页自己写入的事件
});
```

UI 通过 `X-Request-Source` 头在 PUT/DELETE 请求上发送其标签页 ID。服务器将其存储为事件的 `requestSource`。处理同步事件时，UI 过滤掉匹配其自身 `ignoreSource` 值的事件。这防止 UI 重新获取它刚刚写入的数据。

## 黄金标准示例：Mail 模板

Mail 模板展示了这些模式如何协同工作：

**导航状态形状：**
```json
{ "view": "inbox", "threadId": "thread-123", "focusedEmailId": "msg-456", "label": "important" }
```

**view-screen 输出：**
- 读取导航状态
- 如果 URL 查询过滤器重要则读取 `__url__`
- 获取匹配当前视图/过滤器状态的邮件列表
- 如果有线程打开则获取线程消息
- 将所有内容作为单个 JSON 快照返回

**navigate 命令：**
- `{ "view": "starred" }`——切换到星标视图
- `{ "view": "inbox", "threadId": "thread-123" }`——打开特定线程
- 对于纯查询过滤器变更，使用 `set-search-params`

## 应该做

- 使用自动注入的 `<current-screen>` 块获取基本上下文——仅在需要更丰富数据时调用 `view-screen`
- 在 `navigation` 键中包含语义路由状态（视图、项目 ID、活动标签、聚焦行）
- 将可共享的过滤器保留在 URL 查询参数中，这样 `<current-url>` 和 `set-search-params` 能工作
- 添加新功能时更新 `view-screen`——它应返回每个视图的数据
- 使用 `useAgentRouteState` 或 `useSemanticNavigationState` 进行 UI 端导航同步和命令消费
- 使用一次性 `navigate` 命令模式进行应用导航；当目标 URL 已知时包含同源 `path`
- 用 `requestSource: "agent"` 标记 agent 写入（脚本辅助函数自动执行此操作）

## 不应该做

- 不要假设用户在特定页面——始终检查导航状态
- 不要在脚本中硬编码导航路径——读取当前状态并分支
- 不要从 agent 写入 `navigation` 键——它属于 UI。使用 `navigate` 代替。
- 不要为一次应用导航同时写入 `navigate` 和 `__set_url__`；竞争的消费者可能使浏览器 URL 在 React Router 提交页面之前变更。
- 不要忽略 `<current-screen>` 块——它告诉你用户在哪里
- 不要将整个 URL 查询字符串重复到 `navigation` 中，当 `<current-url>` 已经暴露它们时
- 不要在导航状态中存储获取的数据——它只保存 ID 和语义 UI 状态。`view-screen` 脚本获取实际数据。

## 相关 Skill

- **adding-a-feature**——上下文感知是四方面检查清单的第 4 方面
- **real-time-sync**——`useDbSync` 如何将应用状态变更传递到 UI
- **actions**——如何创建 `view-screen` 和 `navigate` action
- **storing-data**——应用状态是核心 SQL 存储之一