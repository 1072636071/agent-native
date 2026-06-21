---
name: real-time-collab
description: >-
  基于 Yjs CRDT 的多用户协作编辑，SSE 快速通道传输，以及细粒度服务端合并。在为模板添加实时协作编辑、调试同步问题、或理解 agent 和人类如何同时编辑文档时使用。
metadata:
  internal: true
---

# 实时协作

## 规则

协作编辑使用 Yjs CRDT 通过 TipTap 实现。Agent 和人类用户是平等的参与者 — 两者编辑同一个 Y.Doc，更改干净地合并，不会产生冲突。始终在 `createCollabPlugin` 上设置 `resourceType`。

## 工作原理

- **`Y.Doc`** 将文档存储为 `Y.XmlFragment`（ProseMirror 节点树）
- **TipTap 的 Collaboration 扩展** 通过 `ySyncPlugin` 将编辑器绑定到 Y.XmlFragment
- **CollaborationCaret 扩展** 渲染远程用户的光标，带名称和颜色
- **SSE 快速通道** — `/_agent-native/poll-events` `EventSource` 以推送方式传递协作事件；当 SSE 正常时，协作轮询间隔放宽至约 12 秒
- **轮询回退** — 当 SSE 不可用时，每 2 秒轮询一次 `/_agent-native/poll`；这是通用的无服务器回退方案
- **更新批处理** — 本地 Yjs 更新被防抖约 80 毫秒，并在发送前通过 `Y.mergeUpdates` 合并；在 `visibilitychange` / `pagehide` 时立即刷新
- **SQL `_collab_docs` 表** 以 base64 持久化 Yjs 状态（兼容 SQLite/Postgres）。当存储的 blob 超过新鲜编码大小的 4 倍时，自动触发墓碑压缩。

## Agent + 人类编辑

1. **人类编辑** → TipTap → ySyncPlugin → Y.XmlFragment → `POST /_agent-native/collab/:docId/update`
2. **Agent 编辑** → action 编辑规范的 SQL 内容并更新 `updatedAt` → change-sync 重新获取 → 打开的编辑器将新内容协调到实时 Y.Doc 中（见下方） → 轮询更新 → 所有客户端

两者都产生干净合并的 Yjs 操作。Agent 编辑出现时不会破坏光标位置、选择或撤销历史。

Agent **不会**将编辑推入进程内的 Yjs，也**不会**调用任何 localhost 探测 — 这些方法在无服务器环境下会静默空操作（action 运行在不同进程中）。下面的对等编辑器模型替代了它们。

## Agent 作为实时对等编辑器

**SQL 是文档正文内容的持久真相来源。** Agent action 编辑规范的内容列并更新 `updatedAt`。没有 localhost 调用，没有进程内 Yjs 变更。

**打开的编辑器将权威的外部内容协调到实时 Y.Doc 中。** `updatedAt` 的更新通过 change-sync 流转，后者重新获取记录。主客户端通过 `setContent` 应用新内容，产生与并发人类编辑合并的 Yjs 操作。每个连接的客户端通过正常的 Yjs 同步接收结果。

### `updatedAt` 门控

```ts
// 在编辑器的协调 effect 中
if (loaded.updatedAt > lastAppliedUpdatedAt.current) {
  applyAuthoritativeContent(loaded.content); // 采纳
  lastAppliedUpdatedAt.current = loaded.updatedAt;
}
// 否则：滞后的轮询 / 过时的快照 → 忽略
```

没有这个门控，稍微滞后的轮询响应会重新应用旧内容，编辑会"在下一次轮询时回退"。全新的挂载总是采纳它加载的任何内容。

### 主客户端选举

恰好一个连接的客户端应用权威快照；其余的通过 Yjs 同步接收：

```ts
import { isReconcileLeadClient } from "@agent-native/core/client";

if (
  loaded.updatedAt > lastAppliedUpdatedAt.current &&
  isReconcileLeadClient(awareness, ydoc.clientID)
) {
  applyAuthoritativeContent(loaded.content);
}
```

Agent 的 awareness 条目（`AGENT_CLIENT_ID`，最大整数）永远不会是主客户端。唯一客户端总是主客户端。选举是确定性的，无需协调往返。

### v1 限制

全内容协调对于人类在 agent 同时重写的同一区域有未保存编辑的罕见情况是**最后写入者胜出**。**不同**区域的编辑通过 CRDT 正常合并。

## 安全

### 始终设置 `resourceType`

```ts
// server/plugins/collab.ts
import { createCollabPlugin } from "@agent-native/core/server";

export default createCollabPlugin({
  table: "documents",
  contentColumn: "content",
  idColumn: "id",
  resourceType: "document", // 必需
});
```

没有 `resourceType`，服务器会记录一次性警告，协作推送事件会传递给**所有已认证用户**，没有文档级别的范围限制。将其设置为通过 `registerShareableResource` 注册的资源类型名称。

具有明确访问权限的非所有者共享对象回退到状态向量追赶（安全，延迟稍高）。Awareness 路由需要与读取路由相同的查看者访问权限。

### 载荷限制

写入路由拒绝超过 `maxPayloadBytes`（默认 2 MB）的载荷，返回 HTTP 413。覆盖：

```ts
createCollabPlugin({ resourceType: "document", maxPayloadBytes: 512 * 1024 });
```

## 启用协作

### 1. 安装包

```bash
pnpm add @tiptap/extension-collaboration @tiptap/extension-collaboration-caret @tiptap/y-tiptap @tiptap/core
```

### 2. 添加协作服务器插件（带 `resourceType`）

```ts
// server/plugins/collab.ts
import { createCollabPlugin } from "@agent-native/core/server";

export default createCollabPlugin({
  table: "documents",
  contentColumn: "content",
  idColumn: "id",
  resourceType: "document",
});
```

### 3. 使用客户端 hook

```ts
import { useCollaborativeDoc, emailToColor, emailToName } from "@agent-native/core/client";

const { ydoc, awareness, activeUsers, agentActive, agentPresent } =
  useCollaborativeDoc({
    docId: documentId,
    requestSource: TAB_ID,
    user: {
      name: emailToName(session.email),
      email: session.email,
      color: emailToColor(session.email),
    },
  });
```

### 4. 添加 TipTap 扩展

```ts
import { Collaboration } from "@tiptap/extension-collaboration";
import { CollaborationCaret } from "@tiptap/extension-collaboration-caret";

const editor = useEditor({
  extensions: [
    StarterKit.configure({ history: false }), // Yjs 处理撤销
    Collaboration.configure({ document: ydoc }),
    CollaborationCaret.configure({
      provider: { awareness },
      user: { name: session.email, color: "#6366f1" },
    }),
  ],
  // 不要传 content — Yjs 拥有它
});
```

### 5. 添加到 vite.config.ts optimizeDeps

```ts
optimizeDeps: {
  include: [
    "yjs",
    "y-protocols/awareness",
    "@tiptap/core",
    "@tiptap/extension-collaboration",
    "@tiptap/extension-collaboration-caret",
    "@tiptap/y-tiptap",
  ],
}
```

## 协作路由（自动挂载）

| 路由 | 用途 |
| ---- | ---- |
| `GET /_agent-native/collab/:docId/state` | 获取完整 Y.Doc 状态（接受 `?stateVector=` 用于差异） |
| `POST /_agent-native/collab/:docId/update` | 应用客户端 Yjs 更新 |
| `POST /_agent-native/collab/:docId/text` | 应用全文（基于差异） |
| `POST /_agent-native/collab/:docId/search-replace` | Y.XmlFragment 中的精确查找/替换 |
| `POST /_agent-native/collab/:docId/json` | 应用完整 JSON 差异到 Y.Map/Y.Array |
| `GET /_agent-native/collab/:docId/json` | 读取当前 JSON 状态 |
| `POST /_agent-native/collab/:docId/patch` | 精确 JSON 补丁操作 |
| `POST /_agent-native/collab/:docId/awareness` | 同步光标/在线状态 |
| `GET /_agent-native/collab/:docId/users` | 列出活跃用户 |

## 细粒度服务端合并模式

对于结构化文档（幻灯片、表单、设计文件），其中正文协作会在容器级别导致 LWW 冲突，使用**细粒度服务端合并**：定义一个带有针对性逐项操作的 action。

**何时使用细粒度合并 vs 正文协作：**

| 场景 | 推荐方案 |
| ---- | -------- |
| 自由格式富文本，光标级 CRDT 重要 | 正文协作（Y.XmlFragment + TipTap） |
| 结构化项目（幻灯片、字段），不同用户编辑不同项目 | 细粒度服务端合并（带补丁操作的 action） |

幻灯片的操作形状示例：

```ts
type PatchDeckOp =
  | { type: "patch"; slideId: string; fields: Partial<SlideFields> }
  | { type: "add"; position: number; slide: SlideData }
  | { type: "delete"; slideId: string }
  | { type: "reorder"; slideId: string; newIndex: number };
```

对不同幻灯片的并发编辑在 action 层面都能成功；没有整副牌的 LWW。表单使用相同的形状，带有字段级操作。

## 协作撤销作用域（Y.UndoManager）

将撤销/重做范围限定为本地用户自己的编辑，这样对等方和 agent 的更改永远不会被意外回退：

```ts
import * as Y from "yjs";

const LOCAL_EDIT_ORIGIN = "local";

const undoManager = new Y.UndoManager(ydoc.getText("content"), {
  trackedOrigins: new Set([LOCAL_EDIT_ORIGIN]),
  captureTimeout: 800, // 将快速滑块拖动合并为一个撤销步骤
});

// 用跟踪的来源标记本地编辑
ydoc.transact(() => {
  // 应用本地更改
}, LOCAL_EDIT_ORIGIN);

undoManager.undo(); // 仅回退 LOCAL_EDIT_ORIGIN 事务
undoManager.redo();
```

规则：
- 向 `trackedOrigins` 传递 `Set` — 不是数组。
- 远程（`"remote"`）和 agent（`"agent"`）来源永远不会被捕获。
- 在活动文档更改时重新创建和销毁管理器。

## 常见陷阱

- **缺少 `resourceType`** — 服务器在启动时记录警告，并将协作事件传递给所有已认证用户，没有访问范围限制。始终设置 `resourceType`。
- **启用 Collaboration 时不要将 `content` 作为 TipTap prop 传递** — Yjs 拥有内容。仅在 Y.XmlFragment 为空时通过 `editor.commands.setContent()` 初始化。
- **不要为 agent 编辑临时调用 `editor.setContent()`** — 唯一被允许的 `setContent` 由 `updatedAt` 门控并由 `isReconcileLeadClient` 保护。从其他地方调用它会在 CRDT 中重复内容或重新应用过时的快照。
- **将包添加到 `optimizeDeps`** — 否则 Vite 不会正确预打包 Yjs，导致开发中的运行时错误。
- **每个文档一个 `Y.Doc`** — 不要为同一文档 ID 创建多个 Y.Doc 实例。`useCollaborativeDoc` 按 ID 缓存。
- **文档更改时销毁 Y.UndoManager** — 过时的管理器持有 Y.Doc 引用并会无限增长。在 `docId` 更改时重新创建。

## 相关技能

- `real-time-sync` — 传递驱动编辑器协调的 `updatedAt` 更新的 change-sync 系统；也包含非 Yjs 表面的 `useReconciledState`
- `storing-data` — `_collab_docs` 表和 SQL 规范内容
- `security` — `registerShareableResource`、`resolveAccess`、`assertAccess`
- `self-modifying-code` — Agent 对协作文档的编辑修改规范 SQL 内容，而非原始 Yjs