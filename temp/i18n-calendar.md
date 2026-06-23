# i18n 检查报告 - calendar

## 概览
- 检查文件数: 35+ (.tsx)
- 发现硬编码字符串数: 180+
- 严重程度: **高** — 完全未使用 `useI18n()` / `t()`

## 详细问题列表

### app/root.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 42 | HTML lang | `<html lang="en">` | 动态值 |
| 61 | meta | `content="Calendar"` | calendar.metaTitle |
| 114 | 命令菜单 | "Toggle theme" | calendar.toggleTheme |
| 141-144 | 命令菜单 | "Actions", "Search", "Appearance" | calendar.cmdGroup.* |

### app/components/layout/Sidebar.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 87-90 | 导航 | "Calendar", "Booking Links", "Team", "Settings" | nav.* |
| 98-111 | 月份 | ["Jan",...,"Dec"] | 使用 date-fns locale |
| 136-145 | aria | "Previous year", "Next year" | calendar.prevYear |
| 212 | 星期 | ["Su","Mo","Tu","We","Th","Fr","Sa"] | 使用 date-fns locale |
| 319-331 | Google | "Connect Google Calendar" + "Connecting..." + "Connect" | google.* |
| 421 | 标签 | "My Calendars" | sidebar.myCalendars |
| 435-500 | Tooltip | "Google Calendar settings", "Add Google account", "Color by meeting type..." | sidebar.* |
| 685-826 | 标签 | "Other Calendars", "People", "Feeds" | sidebar.* |

### app/components/layout/AppLayout.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 262 | 空状态 | "Ask me anything about your calendar" | agent.emptyState |
| 264-266 | 建议 | "What's on my calendar today?" 等 | agent.suggestions.* |
| 278-284 | aria | "Open navigation" | a11y.openNav |

### app/pages/CalendarView.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 89-93 | 视图标签 | "Month", "Week", "Day" | views.* |
| 176 | 空值 | "(No title)" | event.noTitle |
| 562-810 | Toast | "Add a title before creating the event", "End time must be after start time", "Failed to create event", "Event removed/deleted", "Undo" 等 | toast.* |

### app/pages/BookingLinksPage.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 多处 | 页面文字 | Booking Link 管理页全部硬编码 | bookingLinks.* |

### app/pages/Settings.tsx, AvailabilitySettings.tsx, ManageBookingPage.tsx, BookingPage.tsx, BookingsList.tsx, NotFound.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 多处 | 页面文字 | 各页面标题、表单标签、按钮、错误等全部硬编码 | 对应命名空间 |

## 总结
- 180+ 硬编码，分布广：侧边栏、日历视图、Booking Links、设置、可用性等 10+ 页面
- 月份/星期缩写硬编码，应使用 date-fns locale
- `<html lang="en">` 硬编码
- 建议优先处理导航和日历视图（最高频使用）
