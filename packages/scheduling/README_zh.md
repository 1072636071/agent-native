# @agent-native/scheduling

Agent-Native 应用的调度原语。

为 `calendar` 模板和自定义调度界面提供支持。提供：

- **Drizzle 模式** — 事件类型、日程、可用性规则、预约、团队、工作流、路由表单
- **纯函数工具** — 时段计算（DST 安全）、可用性规则评估、轮询分配、循环事件展开
- **服务端层** — DB 仓库、可用性引擎、预约服务、可插拔日历/视频提供商
- **Actions** — `defineAction` 模块，作为代理工具 + HTTP 端点使用
- **React 原语** — 无头钩子（`useSlots`、`useBookingFlow`、`useTimezone`）+ 可选样式组件
- **AI 可读文档** — `llms.txt` 包和代理技能文件

## 安装

```bash
pnpm add @agent-native/scheduling
```

对等依赖：`@agent-native/core`、`drizzle-orm`，以及（可选）`react`。

## 组合

模板的 `server/db/schema.ts`：

```ts
export * from "@agent-native/scheduling/schema";
```

模板的 `actions/create-booking.ts`：

```ts
export { default } from "@agent-native/scheduling/actions/create-booking";
```

通过将存根体替换为完整的 `defineAction(...)` 来覆盖。

## 为你的 AI 提供文档

通过 `llms.txt` 将包文档暴露给你的 AI 编码工具：

```
node_modules/@agent-native/scheduling/docs/llms.txt
node_modules/@agent-native/scheduling/docs/llms-full.txt
```

或在部署后通过 HTTP 获取：

```
/docs/scheduling.md
/docs/scheduling-full.md
```

## 弹出

如需完全自定义，将包源码弹出到你的仓库中（v0.2）。目前，
将你想拥有的文件复制到 `packages/scheduling-local/` 并手动交换依赖。参见 `docs/eject.md`。