---
name: progress
description: >-
  从长时间运行的 agent 任务报告实时进度。在任务超过几秒时使用，
  这样用户可以在运行托盘中观察状态，而不是盯着旋转器。
---

# 进度

## 概述

`progress_runs` 是框架的"agent 现在在做什么"原语。Agent 在长任务开始时启动一个运行，随着工作进展更新它，并以终止状态完成它。UI 在头部栏小部件中渲染活动运行，带有百分比条、当前步骤和旋转器/勾号/X——对原本不透明的工作提供实时可见性。

与 `notifications` 是独立的关注点：

| | 通知 | 进度 |
|---|---|---|
| 形状 | 一次性事件——"X 发生了" | 持续状态——"X 完成 45%" |
| UI 界面 | 铃铛 + toast | 带百分比条的运行托盘 |
| 生命周期 | 可关闭（已读/未读） | 运行中 → 终止（成功/失败/取消） |

常见模式：完成时发出 `notify()`，这样用户在不主动查看托盘时也能看到结果。

## 工具

所有进度操作通过带有 `action` 参数的单一 `manage-progress` 工具进行：

| 操作 | 用途 |
|---|---|
| `start` | 标记长任务开始。返回 runId。 |
| `update` | 更新百分比和/或当前步骤。频繁调用。 |
| `complete` | 标记终止状态：`succeeded`、`failed`、`cancelled`。 |
| `list` | 列出最近的运行（全部或 `--active=true`）。 |

## 规范流程

```
manage-progress --action=start --title "Triage 128 unread emails" --step "Fetching inbox"
  → runId=abc

manage-progress --action=update --runId=abc --percent=25 --step="Classifying 32/128"
manage-progress --action=update --runId=abc --percent=75 --step="Drafting replies 97/128"

manage-progress --action=complete --runId=abc --status=succeeded
notify --severity=info --title="Triage done" --body="12 archived, 6 drafts ready to review"
```

## 最佳实践

- **为任何超过约 5 秒的任务启动运行。** 用户需要反馈；没有上下文的旋转器感觉像是卡住了。
- **在自然检查点更新**，而非每次迭代。大多数 UI 每 5-10% 就够了。
- **始终在结束时调用 `manage-progress --action=complete`**——包括错误路径。一个孤立的 `running` 行比没有行更糟糕。
- **完成时配对 `notify`。** 托盘告诉用户什么*正在运行*；通知告诉他们什么*已完成*。
- **在 `manage-progress --action=start` 上使用 `metadataJson`** 传递指向生成产物的链接（线程 id、文档路径），这样 UI 可以从运行托盘深度链接。

## 运行 API

由 `core-routes-plugin` 挂载在 `/_agent-native/runs/*`。HTTP 上**只读**——写入通过 agent 工具进行：

| 方法 | 路由 |
|---|---|
| `GET`    | `/_agent-native/runs?active=true&limit=50` |
| `GET`    | `/_agent-native/runs/:id` |
| `DELETE` | `/_agent-native/runs/:id` |

## UI 界面

以 `<RunsTray />` 形式发布在 `@agent-native/core/client/progress`：

```tsx
import { RunsTray } from "@agent-native/core/client/progress";

export function HeaderBar() {
  return (
    <header className="flex items-center gap-2">
      {/* … */}
      <RunsTray />
    </header>
  );
}
```

内联头部小部件——在通知铃铛旁边挂载。当有活动运行时显示旋转器图标 + 计数徽章；点击打开一个下拉菜单，每个运行有实时百分比条。当没有活动运行时完全隐藏触发器。每 `pollMs`（默认 3 秒）轮询 `active=true`。

## 事件总线集成

总线上发出两个事件，以便自动化可以响应：

- `run.progress.started` — `{ runId, title, step? }`
- `run.progress.updated` — `{ runId, percent, step, status }`

示例自动化：*"当运行超过 5 分钟时，通知我。"*

## 相关技能

- `notifications` — 运行完成时触发一个通知，让用户看到结果。
- `automations` — 订阅 `run.progress.updated` 构建慢运行的看门狗。
- `delegate-to-agent` — 如果你正在委派长任务，在委派方启动一个运行，这样调用方有可见性。