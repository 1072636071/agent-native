---
name: event-types
description: 事件类型的工作方式 — 字段、调度类型、编辑器标签页和完整的可配置选项集。
---

# 事件类型

## 编辑器标签页
- **设置** — 标题、slug、时长、描述、默认地点
- **可用性** — 选择日程或按事件类型覆盖
- **限制** — 缓冲、最短提前通知、预约窗口（滚动/范围）、上限（每天/每周/每月/每年）、时段间隔
- **高级** — 事件名称模板、锁定时区、需要确认、禁用来宾、重定向 URL、私有哈希链接、座位
- **应用** — 连接按事件的地点类型（Zoom、Meet 等）
- **工作流** — 附加在预约生命周期事件上运行的工作流

## 调度类型

| 类型 | 含义 |
|---|---|
| `personal` | 由用户拥有，仅他们主持 |
| `collective` | 团队事件；所有选定的主持人必须有空 |
| `round-robin` | 团队事件；按轮换分配给一位主持人 |
| `managed` | 父事件推送到成员的子事件类型 |

## 地点类型

`builtin-video`、`zoom`、`google-meet`、`teams`、`phone`、`in-person`、`custom-link`、`attendee-phone`、`organizer-phone`、`attendee-choice`。

## 自定义字段

文本、文本域、数字、邮箱、电话、下拉选择、多选、布尔、单选。
存储在事件类型上；响应存储在预约上。

## 哈希链接

私有预约 URL，位于 `/d/:hash/:slug`。通过 `add-private-link` 创建，可选 `expiresAt` 和 `isSingleUse`。