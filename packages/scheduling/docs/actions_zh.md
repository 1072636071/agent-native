# Actions

每个 action 都是一个 `defineAction` 模块，你可以重新导出到模板的 `actions/` 文件夹：

```ts
// actions/create-booking.ts
export { default } from "@agent-native/scheduling/actions/create-booking";
```

action 脚手架可以帮你完成这些。完整列表：

## 事件类型

- list-event-types, get-event-type, create-event-type, update-event-type,
  delete-event-type, duplicate-event-type, toggle-event-type-hidden,
  reorder-event-types, set-event-type-location, add-private-link,
  revoke-private-link

## 可用性

- list-schedules, create-schedule, update-schedule, delete-schedule,
  set-default-schedule, add-date-override, remove-date-override,
  get-availability, check-availability, find-available-slot

## 预约

- list-bookings, get-booking, create-booking, reschedule-booking,
  cancel-booking, confirm-booking, mark-no-show, add-booking-attendee,
  remove-booking-attendee, send-reschedule-link, add-booking-note,
  export-bookings-csv

## 集成

- list-calendar-integrations, connect-calendar, disconnect-calendar,
  list-selected-calendars, toggle-selected-calendar, set-destination-calendar,
  refresh-busy-times, install-conferencing-app

## 团队

- create-team, invite-team-member, accept-team-invite, remove-team-member,
  update-member-role, set-team-branding

## 轮询 & 主持人

- assign-round-robin-host, set-event-type-hosts,
  set-host-availability-override, create-host-group

## 设置

- update-profile, set-appearance, set-default-conferencing-app

## 工作流

- list-workflows, create-workflow, update-workflow, delete-workflow,
  toggle-workflow

## 路由表单

- list-routing-forms, create-routing-form, update-routing-form,
  delete-routing-form, list-routing-form-responses

所有 actions 遵循框架共享系统 — 如果资源不属于当前用户或未与当前用户共享，读/写 actions 会抛出异常。