---
name: integrations
description: 日历 + 视频提供商集成 — Google Calendar、Office 365、Zoom、内置视频、Google Meet — 以及如何编写新的集成。
---

# 集成

## 日历提供商

- **google_calendar** — OAuth；读取 freeBusy + 写入事件；可选通过 `includeConference=true` 创建 Google Meet 会议。
- **office365_calendar** — Microsoft Graph；读取 freeBusy + 写入事件。
- **caldav**（计划中） — 通用 CalDAV，用于 Apple iCloud、Fastmail 等。

## 视频提供商

- **builtin_video** — 基于 Daily.co；零 OAuth；服务器到服务器 API 密钥。
- **zoom_video** — OAuth；通过 Zoom REST API 创建会议。
- **google_meet** — 搭载 Google Calendar 凭据。
- **teams_video**（计划中） — Microsoft Teams。

## 凭据生命周期

1. 用户点击"连接" → `connect-calendar` 返回 `authUrl` + `state`
2. 重定向到提供商 → 授权 → 提供商重定向到我们的回调
3. 服务器交换 code → 写入 `scheduling_credentials` 行 + core 的 `oauth_tokens` 条目
4. 我们获取日历列表，让用户选择"已选"和"目标"
5. Token 过期 → 静默刷新；失败时设置 `invalid: true` 并显示重新连接横幅

## 忙碌时间聚合

`aggregateBusy({userEmail, rangeStart, rangeEnd})` 合并：
- 用户主持的已确认预约
- 通过提供商从每个 `selected_calendars` 条目获取的外部忙碌时间

缓存在 `calendar_cache` 中（短 TTL，默认 5 分钟）。在该主持人的任何预约写入时失效。

## 编写新提供商

完整接口见 `docs/providers.md`。

## 常见任务

| 用户 | 操作 |
|---|---|
| "连接 Google Calendar" | `connect-calendar --kind google_calendar --redirectUri ...` → 重定向到返回的 `authUrl` |
| "停止检查我的假期日历" | 对该 externalId 执行 `toggle-selected-calendar --include false` |
| "新预约默认使用 Zoom" | `set-default-conferencing-app --credentialId <zoom-cred>` |
| "刷新日历缓存" | `refresh-busy-times` |