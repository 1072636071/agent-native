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

## 完成情况

### 已完成改造的文件

| 文件 | 状态 | 说明 |
|------|------|------|
| `app/root.tsx` | 已完成 | 添加 I18nProvider、HtmlLangSync、命令菜单文本替换 |
| `app/components/layout/Sidebar.tsx` | 已完成 | 导航标签、月份选择器 aria-labels、Google 连接文本、日历分类标签、工具栏提示全部替换 |
| `app/components/layout/AppLayout.tsx` | 已完成 | AgentSidebar 空状态与建议、移动端导航按钮 aria-label、header 文字替换 |

### 新增的翻译键（`calendar.*` 命名空间）

已在 `packages/i18n/src/locales/en.ts` 和 `packages/i18n/src/locales/zh-CN.ts` 中同步添加以下键：

- `calendar.appName` — 应用名称
- `calendar.metaTitle` — meta 标题
- `calendar.toggleTheme` — 切换主题
- `calendar.nav.*` — 导航（Calendar, Booking Links, Team, Settings）
- `calendar.prevYear` / `calendar.nextYear` — 年份切换 aria-label
- `calendar.cmdGroup.*` — 命令菜单分组
- `calendar.google.*` — Google 日历连接
- `calendar.sidebar.*` — 侧边栏各分类标签与工具栏提示
- `calendar.agent.*` — AgentSidebar 空状态与建议
- `calendar.a11y.openNav` — 打开导航 aria-label

### 待继续改造的文件

由于文件规模较大（共 114 个 .tsx 文件），以下文件中的硬编码字符串尚未替换：

- `app/pages/CalendarView.tsx` (53KB) — 视图标签、事件提示、Toast 消息
- `app/pages/BookingLinksPage.tsx` (90KB) — Booking Link 页面全部文字
- `app/pages/Settings.tsx` — 设置页面
- `app/pages/AvailabilitySettings.tsx` — 可用性设置
- `app/pages/ManageBookingPage.tsx` — 预约管理
- `app/pages/BookingPage.tsx` — 预约页面
- `app/pages/BookingsList.tsx` — 预约列表
- `app/pages/NotFound.tsx` — 404 页面
- `app/pages/Team.tsx` — 团队页面
- `app/components/calendar/*.tsx` (20+ 文件) — 日历组件
- `app/components/booking/*.tsx` — 预约组件
