---
name: workflows
description: 基于触发器的自动化 — 提醒、跟进、webhook — 贯穿预约生命周期。
---

# 工作流

## 触发器

- `new-booking` — 预约创建时触发
- `before-event` — `startTime` 之前偏移分钟数
- `after-event` — `endTime` 之后偏移分钟数
- `reschedule` — 预约被重新安排
- `cancellation` — 预约被取消
- `no-show` — 主持人将参会者标记为未出席

## 步骤

| 操作 | 发送 |
|---|---|
| `email-host` | 发送邮件给组织者 |
| `email-attendee` | 发送邮件给参会者 |
| `email-address` | 发送邮件到固定地址（如 ops@example.com） |
| `sms-attendee` | 发送短信到参会者手机（需要参会者 `phone` 自定义字段） |
| `sms-host` | 发送短信给主持人 |
| `sms-number` | 发送短信到固定号码 |
| `webhook` | HTTP POST 到某个 URL |

步骤的 `offsetMinutes` 相对于触发时间。对于 `before-event`，使用正值（内部会应用减号）。

## 模板变量

在邮件主题/正文和短信正文中：
- `{eventName}` — 事件类型标题
- `{attendeeName}`、`{attendeeEmail}` — 第一位参会者
- `{hostName}`、`{hostEmail}` — 组织者
- `{startTime}`、`{endTime}` — 以主持人时区格式化
- `{location}` — 会议 URL 或地址
- `{cancelUrl}`、`{rescheduleUrl}` — 公共魔法链接

## 触发

当预约触发一个触发器时，hook 调度器会在 `scheduled_reminders` 中物化行。循环作业处理到期的行并触发实际的邮件/短信/webhook。框架端的循环作业处理轮询。

## 常见任务

| 用户 | 操作 |
|---|---|
| "会议前 24 小时给参会者发邮件" | `create-workflow --trigger before-event --steps '[{action: email-attendee, offsetMinutes: 1440}]'` |
| "有人预约时给我发短信" | `create-workflow --trigger new-booking --steps '[{action: sms-host, ...}]'` |
| "停止某个事件类型的所有提醒" | `toggle-workflow` 禁用 |