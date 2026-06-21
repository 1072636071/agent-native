# Schema 参考

所有表使用 `@agent-native/core/db/schema` 中的方言无关辅助函数，并与 `ownableColumns()` + `createSharesTable()` 组合以实现框架级共享。

## event_types

主要可预约资源。时长、地点选项、自定义字段、缓冲、限制、周期（滚动/范围/无限制）、调度类型（个人/集体/轮询/托管）、可选团队分配、哈希链接支持。

## event_type_hosts

事件类型和用户之间的关联表，用于集体/轮询。每个主持人有 `isFixed`、`weight`、`priority`、可选的按主持人 `scheduleId` 覆盖。

## hashed_links

私有预约链接：`/d/:hash/:slug`。可选 `expiresAt` 和 `isSingleUse`。

## event_type_slug_redirects

重命名历史，使旧 URL 继续工作。

## schedules / schedule_availability / date_overrides

命名的可用性预设。`schedules` 是头部（名称、时区、isDefault）。`schedule_availability` 行是每天一个每周时段。`date_overrides` 替换特定日期的每周规则（空 = 完全阻止）。

## travel_schedules / out_of_office_entries

按用户的差旅时区覆盖；阻止预约并可选重定向的休假窗口。

## bookings / booking_attendees / booking_references / booking_seats /

## booking_notes

预约是物化的约会。参会者每个预约 N 个。引用是外部 ID（Google 事件 ID、Zoom 会议 ID）。座位是有座位事件的预约令牌。备注仅主持人可见。

## teams / team_members

团队对用户分组。`team_members.role` ∈ owner|admin|member。

## scheduling_credentials / selected_calendars / destination_calendars

`scheduling_credentials` 是 OAuth token 上的视图（带显示元数据和 `invalid` 标志）。已选日历用于读取忙碌时间。目标日历是写入新事件的地方。

## calendar_cache

忙碌时段的短 TTL 缓存。在预约写入时失效。

## workflows / workflow_steps / scheduled_reminders

基于触发器的自动化。`workflows` 是规则；`workflow_steps` 是有序操作；`scheduled_reminders` 是等待触发的物化发送（由循环作业排空）。

## webhooks / webhook_deliveries / api_keys

面向开发者的界面：带 HMAC 签名负载的传出 webhook，以及用于编程访问的 API 密钥。

## routing_forms / routing_form_responses

ChiliPiper 风格的路由表单。字段 + 规则 → 事件类型、外部 URL 或自定义消息。

## verified_emails / verified_numbers

工作流使用的已验证发件人地址/号码。

## 共享表

对于每个可拥有资源：`event_type_shares`、`schedule_shares`、`team_shares`、`workflow_shares`、`routing_form_shares`、`booking_shares`。使用 `share-resource` / `set-resource-visibility` 框架 actions。