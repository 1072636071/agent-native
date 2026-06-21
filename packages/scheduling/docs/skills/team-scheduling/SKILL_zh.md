---
name: team-scheduling
description: 团队事件类型、轮询分配、集体预约、主持人权重和未出席校准。
---

# 团队调度

## 调度类型

- **集体** — 所有选定的团队成员必须有空；预约将所有人列为组织者。
- **轮询** — 每次预约按轮询策略选择一个团队成员。
- **托管** — 父事件类型推送到成员级子类型（高级；v1 中为存根）。

## 轮询策略

| 策略 | 方式 |
|---|---|
| `lowest-recent-bookings` | （默认）过去 30 天预约最少的主持人获胜；按优先级、然后权重、然后邮箱打破平局 |
| `weighted` | 加权随机选择；给定相同种子时是确定性的 |
| `calibrated` | 带未出席惩罚的加权（未出席率高的主持人获得更少分配） |

## 主持人

`event_type_hosts` 中的行：`{userEmail, isFixed, weight, priority, scheduleId?}`。固定主持人始终参加（类似轮询集合中的集体模式）。权重缩放相对份额。优先级（越低 = 越高）打破平局。

## 主持人日程覆盖

通常每个主持人的默认日程用于其时段。可以通过 `set-host-availability-override` 实现按事件类型按主持人的覆盖。

## 休假

休假主持人会在休假窗口期间自动从轮询中排除。预约可以重定向到休假者的 `redirectUserEmail`。

## 主持人组

`event_type_host_groups` 允许你将主持人分组 — 适用于"每组内集体，组间轮询"的场景。

## 常见任务

| 用户 | 操作 |
|---|---|
| "创建一个在 Alice / Bob / Carol 之间轮换的销售演示" | `create-event-type --schedulingType round-robin --teamId ...`，然后 `set-event-type-hosts` |
| "将 Dave 添加为固定主持人" | `set-event-type-hosts`，Dave 设为 `isFixed: true` |
| "Alice 休假时停止路由给她" | 为 Alice 的时间范围插入一条 `out_of_office_entries` 行 |