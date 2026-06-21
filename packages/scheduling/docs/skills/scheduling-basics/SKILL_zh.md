---
name: scheduling-basics
description: 调度包的核心概念 — 事件类型、日程、预约、主持人、团队及其组合方式。
---

# 调度基础

心智模型：

- **事件类型** — "可预约事物"的定义（30 分钟介绍通话、45 分钟演示）。位于 `/:user/:slug` 或 `/team/:teamSlug/:slug`。
- **日程** — 一组命名的可用性规则（"工作时间"、"晚间"）。每周时段加上特定日期覆盖。每个用户有一个默认日程；事件类型可以选择任意一个。
- **预约** — 物化的约会。有参会者、对外部系统的引用（Google Calendar 事件、Zoom 会议），以及在重新安排时保持稳定的 iCalUID。
- **主持人** — 被分配到事件类型的用户。主持人有权重和优先级用于轮询。
- **团队** — 可以共同主持事件类型的用户组。
- **地点** — 会议举行的地点。视频（内置、Zoom、Meet、Teams）、电话、线下或自定义链接。

## 工作流和路由表单

- **工作流** — 触发器 + 有序步骤。"活动前 1 小时给参会者发邮件。"
- **路由表单** — 预约前表单，根据回答路由到正确的事件类型。类似 ChiliPiper。

## 公共 URL

- `/:user` — 带事件类型列表的用户资料页
- `/:user/:slug` — 个人事件类型的 Booker
- `/:user/:slug/embed` — 无边框，用于 iframe 嵌入
- `/team/:teamSlug` — 团队资料页
- `/team/:teamSlug/:slug` — 团队事件类型的 Booker（轮询或集体）
- `/d/:hash/:slug` — 私有哈希链接 Booker
- `/booking/:uid` — 预约详情 / 管理
- `/reschedule/:uid` — 重新安排 Booker
- `/forms/:formId` — 公共路由表单

## 常见任务

| 用户请求 | 操作 |
|---|---|
| "创建一个 30 分钟的介绍会议" | `create-event-type --title "Intro" --slug intro --length 30` |
| "我明天有什么空闲时间？" | `check-availability --slug <slug> --from ... --to ...` |
| "取消我和 Alex 下午 3 点的预约" | `list-bookings --status upcoming`，然后 `cancel-booking --uid ...` |
| "阻止下周五的预约" | `add-date-override --scheduleId <id> --date 2026-04-10 --intervals []` |
| "连接 Google Calendar" | `connect-calendar --kind google_calendar --redirectUri ...` |
| "创建一个在 Alice 和 Bob 之间轮换的团队事件" | `create-event-type --schedulingType round-robin --teamId ...`，然后 `set-event-type-hosts` |