---
name: notifications
description: >-
  带有可插拔服务端渠道的应用内通知原语。在 agent 需要向用户
  展示进度、警报或完成情况时使用——包括应用内（铃铛 + toast）
  和带外（Webhook、Slack、自定义）。
---

# 通知

`notify()` 是框架的"告诉用户某事"原语。每次调用都会向收件箱持久化一行（驱动铃铛 UI）并扇出到任何已注册的服务端渠道。渠道遵循与 `tracking` 相同的可插拔提供商模式——启动时注册，`notify()` 扇出，错误被隔离。

用于：*agent 进度里程碑、自动化触发器触发、后台作业完成、关键错误*。不要用于聊天回复——那些通过对话进行。

## 工具

| 工具 | 用途 |
|---|---|
| `notify` | 发送通知（严重性 + 标题 + 可选正文/元数据/渠道） |
| `list-notifications` | 显示当前用户的最近通知 |

## 发送

```
notify --severity info --title "Booking confirmed" --body "Jane at 3pm"
```

| 严重性 | 何时使用 |
|---|---|
| `info` | 仅供参考 / 进度 / 确认 |
| `warning` | 需要尽快查看的事项 |
| `critical` | 需要立即关注 |

可选：`--metadataJson '{"threadId":"abc"}'`、`--channels inbox,webhook`（省略则运行所有已注册渠道）。

## 投递

`notify()` 始终插入 `notifications` 表（除非 `channels` 显式排除 `inbox`），然后并行扇出到每个已注册渠道（尽力而为；失败的渠道不会阻止其他渠道）。最后在事件总线上发出 `notification.sent`，以便自动化可以链式触发——例如*"当关键通知触发时，同时呼叫值班人员。"*

## 内置渠道

| 渠道 | 方式 | 需要 |
|---|---|---|
| `inbox` | INSERT → 驱动铃铛 UI | （始终开启） |
| `webhook` | POST JSON 到 `NOTIFICATIONS_WEBHOOK_URL`（+ 可选 `NOTIFICATIONS_WEBHOOK_AUTH`）；两者都支持临时密钥系统的 `${keys.NAME}` + URL 允许列表 | 环境变量已设置 |

Webhook 渠道在服务端解析 `${keys.NAME}`——原始值永远不会进入 agent 上下文。

## 注册自定义渠道

```ts
// server/plugins/notifications-slack.ts
import { registerNotificationChannel } from "@agent-native/core/notifications";

export default () => {
  registerNotificationChannel({
    name: "slack-ops",
    async deliver(input, meta) {
      await fetch(process.env.OPS_SLACK_WEBHOOK!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: `*${input.severity}* — ${input.title}`, owner: meta.owner }),
      });
    },
  });
};
```

名称唯一——重新注册会替换。`deliver()` 必须是尽力而为；抛出的错误会被记录并忽略。不要在渠道内部调用 `notify()`（递归）。

## HTTP API

由 `core-routes-plugin` 挂载在 `/_agent-native/notifications/*`，全部会话范围限定：

- `GET    /notifications?unread=true&limit=50&before=<iso>`
- `GET    /notifications/count`
- `POST   /notifications/:id/read`
- `POST   /notifications/read-all`
- `DELETE /notifications/:id`

## UI

```tsx
import { NotificationsBell } from "@agent-native/core/client/notifications";

<NotificationsBell browserNotifications />
```

铃铛图标 + 未读徽章 + 懒加载下拉菜单。传递 `browserNotifications` 以在挂载后为到达的项目触发系统 `new Notification(...)` 弹窗（按 id 去重，在授予权限前渲染"启用"提示，在拒绝/不支持时静默空操作）。使用 shadcn token 样式——适配宿主主题。

## 相关

- `automations` — 事件触发的主体可以调用 `notify`。
- `secrets` — 驱动 Webhook 渠道的 `${keys.NAME}` 替换 + URL 允许列表。
- `tracking` — 分析；独立关注点，不要通过通知路由。