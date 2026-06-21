# 编写自定义提供商

调度需要两种提供商：

- **CalendarProvider** — 读取忙碌时段 + 写入事件。
- **VideoProvider** — 在预约确认时创建会议室。

内置：Google Calendar、Office 365、Zoom、内置视频（Daily.co）、Google Meet（搭载 Google Calendar）。

## CalendarProvider

```ts
import { registerCalendarProvider } from "@agent-native/scheduling/server/providers";

registerCalendarProvider({
  kind: "my_calendar",
  label: "My Calendar",
  async startOAuth({ redirectUri, state }) {
    /* return { authUrl } */
  },
  async completeOAuth({ code, credentialId, userEmail, redirectUri }) {
    /* exchange code, persist tokens, return externalEmail + calendars */
  },
  async listCalendars({ credentialId }) {
    /* ... */
  },
  async getBusy({ credentialId, calendarExternalIds, start, end }) {
    /* ... */
  },
  async createEvent({
    credentialId,
    calendarExternalId,
    booking,
    includeConference,
  }) {
    /* ... */
  },
  async updateEvent({ credentialId, externalId, booking }) {
    /* ... */
  },
  async deleteEvent({ credentialId, externalId }) {
    /* ... */
  },
});
```

所有方法接收一个 `credentialId` — 使用它通过你的 token 存储查找 OAuth token。包的 `setSchedulingContext()` 不触及 token；消费者通常使用 core 的 `oauth_tokens` 并传入 `getAccessToken(credentialId)` 回调。

## VideoProvider

```ts
registerVideoProvider({
  kind: "my_video",
  label: "My Video",
  async createMeeting({ credentialId, booking }) {
    return { meetingUrl, meetingId, meetingPassword? };
  },
  async deleteMeeting?({ credentialId, meetingId }) { /* ... */ },
});
```

视频提供商在预约的地点为 `builtin-video`、`zoom`、`google-meet` 或 `teams` 时由预约服务调用。会议 URL 写入 `booking_references`。