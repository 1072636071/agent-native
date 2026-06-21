---
name: bookings
description: 预约生命周期 — 待确认、已确认、已重新安排、已取消 — 以及参会者、引用、未出席和提醒。
---

# 预约

## 生命周期

- **pending** — 需确认的事件类型从这里开始
- **confirmed** — 正常状态
- **rescheduled** — 重新安排后的旧预约（新预约为 confirmed；`from_reschedule` 链接它们）
- **cancelled** — 任一方取消
- **rejected** — 待确认被拒绝

## 重新安排 vs 取消+重新预约

`reschedule-booking` action 创建一个新预约，通过 `fromReschedule` 链接回旧预约。iCalUID 在重新安排链中保持不变（RFC 5545），`iCalSequence` 递增。

## 未出席

`mark-no-show` 在参会者上设置 `noShow: true`。轮询校准使用此信息来惩罚参会者经常未出席的主持人。

## 取消 / 重新安排令牌

每个预约都有 `cancelToken` 和 `rescheduleToken`，用于发送给参会者的公共魔法链接。这些让他们无需登录即可管理预约。

## 引用

外部系统 ID：Google Calendar 事件 ID、Zoom 会议 ID、Daily.co 房间名。存储在 `booking_references` 中，在取消/重新安排时用于将更改传播回源系统。

## ICS

`/booking/:uid.ics` 返回 RFC 5545 日历文件。用于确认邮件附件和"添加到日历"按钮。