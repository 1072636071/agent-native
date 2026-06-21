---
name: availability
description: 日程、每周规则、日期覆盖、差旅日程和休假条目如何组合来确定某人的可预约时间。
---

# 可用性

## 日程

一组命名的规则（如"工作时间"）。每个用户有 ≥1 个日程，并标记一个为 `isDefault`。事件类型使用用户的默认日程或引用特定日程。

时区设置在日程上，而不是用户上 — 这让你可以为同一个人设置"欧洲时间"日程和"美国时间"日程。

## 每周可用性

`schedule_availability` 中的行：(day 0-6, startTime "HH:MM", endTime "HH:MM")。每天可以有多个时段 — 例如周一 9-12 和 1-5。

## 日期覆盖

`date_overrides` 中的行：(date "YYYY-MM-DD", intervals JSON)。
- `intervals: []` → 当天完全阻止。
- `intervals: [{start, end}]` → 该日期仅这些时间可用。

## 差旅日程

`travel_schedules` 在日期范围内覆盖用户的默认时区。

## 休假

`out_of_office_entries` 在一个范围内阻止预约，可选重定向到另一个团队成员。

## 常见任务

| 用户请求 | 操作 |
|---|---|
| "我下周五没空" | `add-date-override --scheduleId <id> --date 2026-04-10 --intervals []` |
| "我工作日 12-1 点午休" | `update-schedule --weeklyAvailability [...9-12, 13-17...]` |
| "创建晚间日程" | `create-schedule --name Evenings --weeklyAvailability [...]` |
| "下周要去东京" | 插入一条 `travel_schedules` 行（尚无专用 action） |