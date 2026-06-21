# UI 统一 — booking-link / 事件类型编辑器

从 0.1.x 开始，`@agent-native/scheduling` 包提供了一小组共享 React 组件，用于日历和调度界面，使应用可以在不重复逻辑的情况下保持视觉一致性。

从 `@agent-native/scheduling/react/components` 导出：

| 组件 | 用途 |
| --- | --- |
| `ConferencingSelector` | 2x2 网格"无会议 / Google Meet / Zoom / 自定义链接"；包含启动真实 OAuth 的"连接 Zoom"功能 |
| `SlugEditor` | 内联可编辑的 URL 预览（`host/prefix/username/slug`），点击可编辑各段 |
| `CustomFieldsEditor` | 添加/编辑/重排序/删除自定义预约表单字段，带预设（LinkedIn、Company、Phone、Website） |
| `DurationPicker` | 多选药丸按钮（15 / 30 / 45 / 60 + 自定义）用于按事件类型的时长 |
| `BookingLinkCreateDialog` | 创建新事件类型时提示输入标题/URL/时长/描述的模态框 |
| `AvailabilityEditor` | 每周日程网格，带开关 + 开始/结束时间选择器；`summarizeAvailability(ws)` 辅助函数用于列表副标题 |

现有的 `SlotPicker` 和 `TimezoneSelect` 继续与这些组件并存。

## 消费者中需要的 Shadcn 原语

此包中的每个组件都通过标准的 `@/components/ui/*` 别名导入 shadcn 原语（由消费者的打包器解析）。包在 `react/components/_shadcn-shims.d.ts` 中提供了类型垫片，使其可以独立编译。

在导入任何共享组件之前，将这些添加到模板的 `app/components/ui/` 中：

| 需要的组件 | 使用方 |
| --- | --- |
| `button` | ConferencingSelector, BookingLinkCreateDialog, DurationPicker |
| `input` | ConferencingSelector, CustomFieldsEditor, DurationPicker, BookingLinkCreateDialog, AvailabilityEditor |
| `label` | ConferencingSelector, CustomFieldsEditor, SlugEditor, BookingLinkCreateDialog, AvailabilityEditor |
| `textarea` | CustomFieldsEditor, BookingLinkCreateDialog |
| `switch` | CustomFieldsEditor, AvailabilityEditor |
| `badge` | ConferencingSelector |
| `dialog` | BookingLinkCreateDialog |

图标来自 `@tabler/icons-react`（未打包；每个模板已依赖它）。

## 什么移到了哪里

| 旧位置（calendar 模板） | 新位置 |
| --- | --- |
| BookingLinksPage 中的 `ConferencingEditor` | `@agent-native/scheduling/react/components` 中的 `ConferencingSelector` |
| BookingLinksPage 中的 `EditableBookingUrl` | 包中的 `SlugEditor` |
| BookingLinksPage 中的 `CustomFieldsEditor` | 包中的 `CustomFieldsEditor` |

| 旧位置（已移除的 scheduling 应用） | 新位置 |
| --- | --- |
| 事件类型编辑器中的 `DurationsEditor` | 包中的 `DurationPicker` |
| `LocationEditor` + `AppsGrid`（两处） | 包中的 `ConferencingSelector`（Apps 标签页已移除 — 它是冗余的） |
| `_index` 中的内联创建对话框 | 包中的 `BookingLinkCreateDialog` |

## Zoom 变为真实 OAuth

以前 calendar 模板的 Zoom 选项要求用户粘贴个人会议 URL。已移除的 scheduling 应用根本没有基于 OAuth 的 Zoom（只有 `zoom_video` "应用安装"占位符）。

两者现在都通过提供商在 `VideoProvider` 上新增的可选 `startOAuth` / `completeOAuth` 方法使用真实的 Zoom OAuth。消费者：

- **自定义调度界面** — 可以调用包的 `connect-video` action 处理 `zoom_video`，将回调路由到其应用，并通过 `completeVideoOAuth()` 存储 token。
- **Calendar 模板** — 提供轻量级的 `server/lib/zoom.ts`，使用包的 `createZoomProvider` 但直接在 core 的 `oauth_tokens` 中存储 token，以 Zoom 用户 ID + 所有者邮箱为键。预约创建处理器在预约链接的会议类型为 `zoom` 时调用 `createZoomMeeting()`。

两种流程都会在 Zoom 访问令牌距过期 60 秒内时自动刷新，并在 Zoom 返回 401/403 时将凭据标记为无效。