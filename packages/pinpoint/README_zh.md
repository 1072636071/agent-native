# @agent-native/pinpoint

Web 应用的可视化反馈和标注工具。用户选择 UI 元素、添加反馈，并将结构化上下文发送给任何 AI 代理。

可独立使用，也可与 [Builder.io](https://builder.io) 或任何使用 agent-native 协议的代理运行时（Builder.io、Claude Code、Codex、Gemini CLI、Cursor 等）配合使用。

## AI 代理设置指南

AI 代理（Builder.io、Claude Code、Codex、Cursor 等）将 Pinpoint 添加到 agent-native 仓库的说明。

### 第 1 步：安装

```sh
pnpm add @agent-native/pinpoint
```

### 第 2 步：初始化代理 actions 和技能

```sh
npx @agent-native/pinpoint@latest init
```

此命令将代理 actions 复制到 `actions/`，将 Pinpoint 技能复制到 `.agents/skills/pinpoint/`。无需手动复制文件。

### 第 3 步：挂载客户端覆盖层

找到根 React 组件（通常是 `app/App.tsx` 或 `src/App.tsx`）。添加 `<Pinpoint />` 组件：

```tsx
import { Pinpoint } from "@agent-native/pinpoint/react";

// 作为应用根的同级添加 — 不渲染任何内容，在 Shadow DOM 中挂载覆盖层
<Pinpoint author="User" endpoint="/api/pins" autoSubmit colorScheme="auto" />;
```

如果应用不是基于 React 的，请使用命令式 API：

```ts
import { mountPinpoint } from "@agent-native/pinpoint";
mountPinpoint({ author: "User", endpoint: "/api/pins", autoSubmit: true });
```

### 第 4 步：添加服务端中间件

找到 Express 服务器设置（通常是 `server/index.ts`）。添加 pin 路由：

```ts
import { pagePinRoutes } from "@agent-native/pinpoint/server";

// 在页面路由之前添加
app.use("/api/pins", pagePinRoutes());
```

这将在 `/api/pins` 创建 REST 端点用于 pin 的 CRUD。Pin 以 JSON 文件形式存储在 `data/pins/` 中。

### 第 5 步：验证

1. 启动开发服务器
2. 在浏览器中打开应用
3. 按 `Cmd+Shift+.` 切换 Pinpoint 工具栏
4. 点击任意元素，添加评论，点击 "Add Pin"
5. 点击发送按钮 — 标注应出现在代理聊天中

### 使用 Pins

Pin 以单独的 JSON 文件存储在 `data/pins/{uuid}.json` 中：

```json
{
  "id": "uuid",
  "pageUrl": "/dashboard",
  "comment": "This button color is wrong",
  "element": {
    "tagName": "button",
    "selector": ".sidebar button.primary",
    "classNames": ["primary", "btn"]
  },
  "framework": {
    "framework": "react",
    "componentPath": "<Sidebar> <ActionButton>",
    "sourceFile": "src/components/Sidebar.tsx:42"
  },
  "status": { "state": "open" }
}
```

**代理关键字段：**

- `sourceFile` — 需要编辑的确切文件和行号
- `componentPath` — React/Vue 组件层级
- `selector` — 在 DOM 中查找元素的 CSS 选择器
- `comment` — 用户想要更改的内容

**代理命令**（运行 `npx @agent-native/pinpoint@latest init` 后可用）：

- `pnpm action get-pins --status open` — 列出未解决的 pin
- `pnpm action resolve-pin --id <uuid>` — 修复后标记为已解决
- `pnpm action create-pin --pageUrl / --selector ".btn" --comment "Fix this"`
- `pnpm action update-pin --id <uuid> --comment "Updated feedback"`
- `pnpm action delete-pin --id <uuid>` — 删除一个 pin

**工作流：**

1. 用户在浏览器中创建标注
2. 使用 `pnpm action get-pins --status open` 读取
3. 使用 `sourceFile` 定位并编辑相关代码
4. 修复后，标记为已解决：`pnpm action resolve-pin --id <uuid>`

### 故障排除

| 问题                   | 解决方法                                                                      |
| ---------------------- | ----------------------------------------------------------------------------- |
| 工具栏未显示           | 检查 `<Pinpoint />` 是否已挂载。按 `Cmd+Shift+.`                              |
| Pin 未持久化           | 确保设置了 `endpoint="/api/pins"` 且已添加服务端中间件                        |
| `sourceFile` 为空      | 源码检测需要开发模式。生产构建会移除 `_debugSource`                          |
| "Cannot find module"   | 运行 `pnpm install`。检查包是否在 `dependencies` 中                          |

---

## 安装

```sh
pnpm add @agent-native/pinpoint
# 或
npm install @agent-native/pinpoint
```

## 快速开始

### React

```tsx
import { Pinpoint } from "@agent-native/pinpoint/react";

function App() {
  return (
    <>
      <Pinpoint author="Designer" endpoint="/api/pins" autoSubmit />
      <YourApp />
    </>
  );
}
```

### 原生 JS / Script 标签

```html
<script src="https://unpkg.com/@agent-native/pinpoint/dist/index.browser.js"></script>
<script>
  Pinpoint.mountPinpoint({ author: "Designer" });
</script>
```

### 命令式 API（非 React）

```ts
import { mountPinpoint } from "@agent-native/pinpoint";

const { dispose } = mountPinpoint({
  author: "Designer",
  endpoint: "/api/pins",
});
// 调用 dispose() 卸载
```

## 在 Agent-Native 应用中设置

### 1. 安装

```sh
pnpm add @agent-native/pinpoint
```

### 2. 初始化

```sh
npx @agent-native/pinpoint@latest init
```

将代理 actions 复制到 `actions/`，将 Pinpoint 技能复制到 `.agents/skills/pinpoint/`。

### 3. 客户端 — 挂载覆盖层

```tsx
// app/App.tsx
import { Pinpoint } from "@agent-native/pinpoint/react";

function App() {
  return (
    <>
      <Pinpoint
        author="Designer"
        endpoint="/api/pins"
        autoSubmit
        colorScheme="auto"
      />
      <YourApp />
    </>
  );
}
```

### 4. 服务端 — 添加 REST 中间件

```ts
// server/index.ts
import { createServer } from "@agent-native/core/server";
import { pagePinRoutes } from "@agent-native/pinpoint/server";

const app = createServer({
  /* ... */
});
app.use("/api/pins", pagePinRoutes());
```

## 工作原理

1. **切换**工具栏：`Cmd+Shift+.`（或 `Ctrl+Shift+.`）
2. **点击**任意元素进行标注
3. **输入**弹窗中的反馈
4. **发送**给代理：`Cmd+Shift+Enter`

代理接收结构化上下文：CSS 选择器、组件层级、源文件位置和用户评论。

## 配置

所有选项都可以作为 `<Pinpoint />` 的 props 或 `mountPinpoint()` 的配置对象传入：

| 选项                 | 类型                                    | 默认值       | 描述                                               |
| -------------------- | --------------------------------------- | ------------ | -------------------------------------------------- |
| `author`             | `string`                                | —            | 标注者                                             |
| `endpoint`           | `string`                                | —            | 用于持久化的 REST 端点（如 `/api/pins`）           |
| `colorScheme`        | `'auto' \| 'light' \| 'dark'`           | `'auto'`     | 主题                                               |
| `outputFormat`       | `'compact' \| 'standard' \| 'detailed'` | `'standard'` | 代理输出中的详细程度                               |
| `autoSubmit`         | `boolean`                               | `true`       | 自动提交标注到代理聊天                             |
| `clearOnSend`        | `boolean`                               | `false`      | 发送后清除 pin                                     |
| `sendToAgent`        | `(output) => void \| Promise<void>`     | —            | 标注传递的自定义桥接                               |
| `blockInteractions`  | `boolean`                               | `false`      | 选择期间阻止页面点击                               |
| `compactPopup`       | `boolean`                               | `true`       | 在切换按钮后隐藏技术细节                           |
| `freezeJSTimers`     | `boolean`                               | `false`      | 选择期间冻结 JS 计时器                             |
| `allowedOrigins`     | `string[]`                              | —            | postMessage 的允许源                               |
| `webhookUrl`         | `string`                                | —            | pin 事件的 Webhook URL                             |
| `includeSourcePaths` | `boolean`                               | —            | 在输出中包含源文件路径                             |
| `markerColor`        | `string`                                | `'#3b82f6'`  | 已标注元素上的徽章颜色                             |
| `plugins`            | `Plugin[]`                              | —            | 插件扩展                                           |
| `storage`            | `PinStorage`                            | —            | 自定义存储适配器                                   |
| `position`           | `{ x, y }`                              | —            | 工具栏初始位置                                     |

## CLI

```sh
npx @agent-native/pinpoint@latest init   # 将 actions 和技能复制到你的项目
npx @agent-native/pinpoint@latest        # 显示帮助
```

## 键盘快捷键

| 快捷键                  | 操作                           |
| ----------------------- | ------------------------------ |
| `Cmd/Ctrl+Shift+.`     | 切换工具栏                     |
| `Cmd/Ctrl+Shift+C`     | 复制标注到剪贴板               |
| `Cmd/Ctrl+Shift+Enter` | 发送标注给代理                 |
| `Esc`                   | 关闭弹窗 / 折叠工具栏          |
| `Shift+Drag`            | 多选元素                       |

## 包导出

| 导入路径                              | 提供的内容                                                    |
| ------------------------------------- | ------------------------------------------------------------- |
| `@agent-native/pinpoint`              | `mountPinpoint()`、`unmountPinpoint()`、类型                  |
| `@agent-native/pinpoint/react`        | `<Pinpoint />` React 组件                                     |
| `@agent-native/pinpoint/server`       | `pagePinRoutes()` Express 中间件                              |
| `@agent-native/pinpoint/primitives`   | `getElementContext()`、`freeze()`、`unfreeze()`、`openFile()` |
| `@agent-native/pinpoint/types`        | TypeScript 类型（`Pin`、`PinpointConfig` 等）                 |

## 服务端中间件

用于 pin CRUD 的 Express 中间件：

```ts
import { pagePinRoutes } from "@agent-native/pinpoint/server";

app.use("/api/pins", pagePinRoutes({ dataDir: "data/pins" }));
```

| 方法   | 端点            | 描述                                     |
| ------ | --------------- | ---------------------------------------- |
| GET    | `/api/pins`     | 列出 pin（查询参数：`pageUrl`、`status`）|
| GET    | `/api/pins/:id` | 获取一个 pin                             |
| POST   | `/api/pins`     | 创建一个 pin                             |
| PATCH  | `/api/pins/:id` | 更新一个 pin                             |
| DELETE | `/api/pins/:id` | 删除一个 pin                             |
| DELETE | `/api/pins`     | 清除 pin（查询参数：`pageUrl`）          |

## 代理 Actions

运行 `npx @agent-native/pinpoint@latest init` 后可用：

| Action          | 用途           | 参数                                   |
| --------------- | -------------- | -------------------------------------- |
| `get-pins`      | 列出 pin       | `--pageUrl`、`--status`                |
| `create-pin`    | 创建一个 pin   | `--pageUrl`、`--selector`、`--comment` |
| `resolve-pin`   | 标记为已解决   | `--id`、`--message`                    |
| `update-pin`    | 更新一个 pin   | `--id`、`--comment`、`--status`        |
| `delete-pin`    | 删除一个 pin   | `--id`                                 |
| `list-sessions` | 列出有 pin 的页面 | —                                   |

## 原语 API

用于编程式元素检查的独立函数（无 UI）：

```ts
import {
  getElementContext,
  freeze,
  unfreeze,
  openFile,
  detectFramework,
} from "@agent-native/pinpoint/primitives";

const context = getElementContext(document.querySelector(".sidebar"));

freeze(); // 暂停所有动画
unfreeze(); // 恢复

openFile("src/components/Sidebar.tsx", 42); // 在编辑器中打开
```

## 插件系统

```ts
import type { Plugin } from "@agent-native/pinpoint/types";

const myPlugin: Plugin = {
  name: "analytics",
  hooks: {
    onPinCreate(pin) {
      analytics.track("pin_created", { page: pin.pageUrl });
    },
    onPinResolve(pin) {
      analytics.track("pin_resolved", { id: pin.id });
    },
    transformOutput(output) {
      return output + "\n\n_Sent via Pinpoint_";
    },
  },
  actions: [
    {
      label: "Export to Jira",
      handler(element, context) {
        createJiraTicket(context);
      },
    },
  ],
};
```

## A2A & MCP

通过 A2A 或 MCP 将 pin 暴露给外部代理：

```ts
import {
  registerPinpointA2A,
  createPinpointMCPTools,
} from "@agent-native/pinpoint/server";

registerPinpointA2A(app); // /.well-known/agent-card.json

const { tools, handleTool } = createPinpointMCPTools(); // MCP 工具处理器
```

## 框架支持

| 框架       | 检测方式            | 组件信息           | 源码位置                        |
| ---------- | ------------------- | ------------------ | ------------------------------- |
| React 18/19| 自动（通过 bippy）  | 组件层级           | `_debugSource` / element-source |
| Vue 3      | 自动（`__VUE__`）   | 组件树             | `$options.__file`               |
| 其他       | 回退                | 仅 DOM             | 不可用                          |

## 存储适配器

| 适配器        | 使用场景             | 持久化                          |
| ------------- | -------------------- | ------------------------------- |
| `MemoryStore` | 独立使用，无服务器   | 仅会话（刷新后丢失）            |
| `RestClient`  | 带服务器的浏览器     | 通过 REST API 在服务端          |
| `FileStore`   | 服务端               | `data/pins/{uuid}.json`         |

## Builder.io 集成

在 [Builder.io 的 Fusion](https://builder.io) 中，标注通过 `@agent-native/core` 的 `sendToAgentChat()` 发送：

```tsx
<Pinpoint author="Builder User" autoSubmit outputFormat="standard" />
```

在 Builder.io 项目中运行时无需额外配置。

拥有自己聊天实现的主机可以传入 `sendToAgent`，以复用 Pinpoint 的 pin、绘制、队列和提示 UI，同时自行传递 `{ message, context, submit }`。

## 架构

- **Shadow DOM** 中的 **SolidJS 覆盖层** — 零干扰宿主应用样式或 React 协调
- **基于 Canvas** 的悬停高亮，使用 LERP 插值 — 流畅 60fps
- **每个 pin 一个文件** — 消除并发写入冲突
- **可插拔存储** — MemoryStore、RestClient、FileStore
- MIT 库：[bippy](https://github.com/aidenybai/bippy)、[@medv/finder](https://github.com/antonmedv/finder)、[element-source](https://www.npmjs.com/package/element-source)

## 许可证

MIT