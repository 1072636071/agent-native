# Agent Native — Electron Shell

一个最小的 Electron 容器，将 agent-native 应用作为标签页模块加载。每个应用作为独立的开发服务器运行，嵌入在 Electron `<webview>` 中，在切换标签时保留其完整状态（登录会话、滚动位置、进行中的请求）。

```
┌────────────────────────────────────────────────────┐
│  ●  ●  ●   Agent Native                            │  ← macOS 标题栏
├──────┬─────────────────────────────────────────────┤
│      │                                             │
│  ✉   │                                             │
│ Mail │         活跃应用 webview                     │
│      │         （填充整个内容区域）                  │
│  📅  │                                             │
│ Cal  │                                             │
│      │                                             │
│  📝  │                                             │
│ Cont │                                             │
│      │                                             │
│ ···  │                                             │
│      │                                             │
│  ⚙   │                                             │
└──────┴─────────────────────────────────────────────┘
```

---

## 快速开始

### 1. 安装依赖

从 monorepo 根目录：

```bash
pnpm install
```

### 2. 启动所有内容

```bash
# 从仓库根目录 — 启动 calendar + content + Electron
pnpm dev:electron
```

或启动特定应用：

```bash
node scripts/dev-electron.ts --apps calendar,slides
```

或仅运行 Electron shell（如果应用已在运行）：

```bash
pnpm --filter @agent-native/desktop-app dev
```

---

## 架构

```
packages/desktop-app/
├── electron.vite.config.ts       # 构建配置（main + preload + renderer）
├── shared/
│   ├── app-registry.ts           # 应用定义（id、name、port、color…）
│   └── ipc-channels.ts           # IPC 通道名称常量
└── src/
    ├── main/index.ts             # Electron 主进程
    ├── preload/index.ts          # 上下文桥接（暴露 window.electronAPI）
    └── renderer/
        ├── App.tsx               # 根组件 — 标签页状态管理
        ├── shell.css             # Shell 外壳样式（无框架）
        ├── global.d.ts           # window.electronAPI + <webview> 类型定义
        └── components/
            ├── Sidebar.tsx       # 带应用标签的左侧导航
            └── AppWebview.tsx    # 带加载/错误/占位状态的 Webview 插槽
```

### 标签页状态如何保留

每个应用的 `<webview>` **只挂载一次，永不卸载**。切换标签仅在不活跃的插槽上切换 `visibility: hidden` + `pointer-events: none`。Webview 进程在后台持续运行，因此：

- 登录会话在标签切换后保留
- 滚动位置被保留
- 进行中的网络请求正常完成
- 标签切换时无重新渲染或重新加载

### IPC 接口（`window.electronAPI`）

通过预加载上下文桥接在所有渲染器代码中可用：

```ts
// 窗口控制
window.electronAPI.windowControls.minimize()
window.electronAPI.windowControls.maximize()
window.electronAPI.windowControls.close()
window.electronAPI.windowControls.isMaximized() // Promise<boolean>
window.electronAPI.windowControls.onMaximizedChange(cb) // 返回取消订阅函数

// 应用间消息传递
window.electronAPI.interApp.send(targetAppId, event, data)
window.electronAPI.interApp.on((from, event, data) => { … }) // 返回取消订阅函数

// 平台
window.electronAPI.platform // "darwin" | "win32" | "linux"
```

---

## 添加新应用

### 第 1 步 — 注册应用

编辑 `shared/app-registry.ts`，在 `APP_REGISTRY` 中添加新条目：

```ts
{
  id: "notes",
  name: "Notes",
  icon: "StickyNote",       // ICON_MAP 键在 Sidebar.tsx 中连接（Tabler 图标）
  description: "Quick notes",
  devPort: 8086,            // 选择一个未使用的端口
  color: "#06B6D4",
  colorRgb: "6 182 212",
},
```

### 第 2 步 — 添加图标导入

打开 `src/renderer/components/Sidebar.tsx`，将图标添加到导入和 `ICON_MAP`：

```ts
import { …, IconNote } from "@tabler/icons-react";

const ICON_MAP = {
  …
  StickyNote: IconNote,
};
```

### 第 3 步 — 连接开发运行器

将端口添加到 `scripts/dev-electron.ts`：

```ts
const PORT_MAP: Record<string, number> = {
  …
  notes: 8086,
};
```

然后使用以下命令启动：

```bash
node scripts/dev-electron.ts --apps calendar,content,notes
```

---

## 应用间通信

应用可以通过 Electron IPC 中继相互发送消息。

**发送（从任何 webview 或 shell 渲染器）：**

```ts
// 从 shell 渲染器
window.electronAPI.interApp.send("calendar", "open-event", { eventId: "abc" });
```

**接收（在目标应用的 webview 中）：**

由于 webview 是沙箱化的，它们无法直接访问 `window.electronAPI`。要在 webview 内接收应用间消息，可以通过 webview 的预加载脚本注入监听器，或从 shell 使用 `webContents.executeJavaScript`。

更简单的模式是使用基于 URL 的路由：将目标 webview 导航到应用通过 React Router 处理的深层链接 URL。

```ts
// 在 AppWebview.tsx 中 — 监听应用间事件并执行操作
window.electronAPI.interApp.on((from, event, data) => {
  if (event === "open-event" && app.id === "calendar") {
    webviewRef.current?.src = `http://localhost:${app.devPort}/events/${data.eventId}`;
  }
});
```

## 应用启动快捷键

桌面端可以注册本地全局快捷键，显示 Agent Native、切换到目标应用，并可选地通过现有的 `/_agent-native/open` 桥接传递视图。

快捷键位于高级设置面板的 **按应用自定义 → 键盘启动快捷键** 下。一个绑定存储：

```ts
{
  accelerator: "Control+Alt+V",
  app: "mail",
  view: "inbox",
  behavior: "toggle"
}
```

`toggle` 在同一应用已处于最前面时隐藏 Agent Native；`show` 始终聚焦并切换。外部代理可以通过确认的桌面深层链接提议快捷键：

```text
agentnative://shortcuts/upsert?accelerator=Control%2BAlt%2BV&app=mail&view=inbox
```

---

## 端口分配

| 应用       | 开发端口           |
| ---------- | ------------------ |
| mail       | 8081（占位）       |
| calendar   | 8082               |
| content    | 8083               |
| analytics  | 8084               |
| slides     | 8085               |

---

## 平台差异

| 功能               | macOS                                       | Windows / Linux                |
| ------------------ | ------------------------------------------- | ------------------------------ |
| 窗口控制           | 原生交通灯（红/黄/绿）                      | 侧边栏中的自定义彩色圆点      |
| 标题栏拖动         | 侧边栏顶部可拖动                            | 侧边栏顶部可拖动              |
| 侧边栏顶部内边距   | 48 px（避开交通灯）                          | 8 px                           |

---

## 构建分发版

```bash
pnpm --filter @agent-native/desktop-app build
```

输出：

- `dist/main/` — 编译后的主进程（CJS）
- `dist/preload/` — 编译后的预加载脚本（CJS）
- `dist/renderer/` — 构建后的 React SPA

要打包为可分发的应用，添加 `electron-builder` 并运行：

```bash
npx electron-builder@latest --config electron-builder.yml
```

参见 [electron-builder 文档](https://www.electron.build)了解平台特定的打包方式。