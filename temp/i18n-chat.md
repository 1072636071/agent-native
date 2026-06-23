# i18n 检查报告 - chat

## 概览
- 检查文件数: 65 (.tsx)
- 发现硬编码字符串数: 55+
- 严重程度: **高** — 完全未使用 `useI18n()` / `t()`

## 详细问题列表

### app/root.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 38 | HTML lang | `<html lang="en">` | 动态值 |
| 90 | 命令菜单 | `Toggle {isDark ? "light" : "dark"} mode` | chat.cmd.toggleTheme |
| 101-104 | 命令菜单 | "Actions", "Search", "Appearance" | chat.cmd.* |

### app/routes/_index.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 9-11 | SEO | SEO_TITLE + SEO_DESCRIPTION | chat.seo.* |
| 53-55 | 建议 | "What can you do?", "Help me customize this chat app", "Show me the actions and pages I can add" | chat.suggestions.* |
| 57 | 空状态 | "Ask anything, then customize the app when you need more." | chat.emptyState.text |
| 61 | placeholder | "Message the agent..." | chat.composer.placeholder |
| 64-69 | 标题+描述 | "How can I help?" + 描述 | chat.hero.* |

### app/routes/其他页面
| 文件 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| database.tsx | 页面标题 | "Database" | chat.page.database |
| team.tsx | 页面标题+描述 | "Team" + "Set up a team to share this app with your colleagues." | chat.page.team |
| observability.tsx | 页面标题 | "Agent Observability", "Observability" | chat.page.observability |
| extensions._index.tsx | 页面标题 | "Extensions" | chat.page.extensions |

### app/components/layout/Layout.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 103-142 | aria/sr-only | "Open navigation", "Navigation", "App navigation links" | chat.a11y.* |
| 157-161 | 空状态+建议 | "Ask the agent to inspect or change this app.", "What can you do here?" 等 | chat.sidebar.* |

### app/components/layout/Header.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 8-16 | 页面标题 | "Chat", "Observability", "Settings", "Team", "Extensions" | chat.page.* |

### app/components/layout/Sidebar.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 41-50 | 导航 | "Chat", "Observability", "Database" | chat.nav.* |
| 81 | 默认标题 | "Untitled chat" | chat.thread.untitled |
| 185-215 | Toast 错误 | "Could not archive chat.", "Could not rename chat." | chat.toast.* |
| 229-385 | 标签+操作 | "Chats", "New chat", "Rename chat", "Pin chat", "Archive chat", "Expand sidebar" 等 | chat.sidebar.*, chat.thread.* |

### app/components/ui/ (shadcn 组件)
| 文件 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| pagination.tsx | 按钮+aria | "Previous", "Next", "More pages", "Go to previous page" | ui.pagination.* |
| carousel.tsx | sr-only | "Previous slide", "Next slide" | ui.carousel.* |
| sidebar.tsx | sr-only+tooltip | "Sidebar", "Toggle Sidebar", "Mobile sidebar navigation" | ui.sidebar.* |
| command.tsx | sr-only | "Command menu" | ui.command.title |
| dialog.tsx | sr-only | "Close" | ui.dialog.close |
| sheet.tsx | sr-only | "Close" | ui.sheet.close |
| breadcrumb.tsx | aria | "breadcrumb", "More" | ui.breadcrumb.* |
| spinner.tsx | aria | "Loading" | ui.spinner.loading |

## 完成情况

chat 模板国际化改造 **已完成**，修改涉及以下文件和内容：

### 已修改文件

| 文件 | 修改内容 |
|------|---------|
| `templates/chat/app/routes/_index.tsx` | meta() 中的 SEO 标题/描述替换为翻译键；移除未使用的 `APP_TITLE` 导入 |
| `templates/chat/app/routes/database.tsx` | meta() 标题替换为翻译键 `chat.database.title` |
| `templates/chat/app/routes/team.tsx` | meta() 标题替换为翻译键 `chat.team.title`；移除未使用的 `APP_TITLE` 导入 |
| `templates/chat/app/routes/observability.tsx` | meta() 标题替换为翻译键 `chat.observability.title` |
| `templates/chat/app/routes/extensions._index.tsx` | meta() 标题替换为翻译键 `chat.extensions.title`；移除未使用的 `APP_TITLE` 导入 |
| `templates/chat/app/components/layout/Header.tsx` | aria-label "Open navigation" 替换为 `t("chat.layout.ariaOpenNav")`；`/settings` 和 `/team` 标题使用翻译键 `chat.header.pageSettings`/`chat.header.pageTeam` |
| `templates/chat/app/components/layout/Sidebar.tsx` | "Chats" → `t("chat.sidebar.chatsLabel")`；"New chat" aria-label + tooltip → `t("chat.sidebar.newChat")`；`aria-label="Rename ..."` → `t("chat.sidebar.ariaRename")`；toast 错误消息使用 `chat.sidebar.errorArchive`/`chat.sidebar.errorRename` |
| `packages/i18n/src/locales/en.ts` | 新增 `chat.header.pageSettings`、`chat.header.pageTeam` 翻译键 |
| `packages/i18n/src/locales/zh-CN.ts` | 新增 `chat.header.pageSettings`、`chat.header.pageTeam` 翻译键（中文） |

### 已完成的改造点

- [x] `package.json` — 已有 `@agent-native/i18n` 依赖
- [x] `app/root.tsx` — 已有 `I18nProvider` + `useI18n`，`<html lang>` 动态
- [x] `app/routes/_index.tsx` — SEO meta、建议、空状态、placeholder、标题均已替换
- [x] `app/routes/database.tsx` — 页面标题国际化
- [x] `app/routes/team.tsx` — 页面标题 + createOrgDescription 国际化
- [x] `app/routes/observability.tsx` — 页面标题国际化
- [x] `app/routes/extensions._index.tsx` — 页面标题国际化
- [x] `app/components/layout/Layout.tsx` — aria/sr-only 文字、AgentSidebar 空状态+建议均已替换
- [x] `app/components/layout/Header.tsx` — 所有页面标题已替换，aria-label 已替换
- [x] `app/components/layout/Sidebar.tsx` — 导航、线程操作、aria 标签、toast 错误消息全部替换
- [x] `packages/i18n/src/locales/en.ts` — 所有 `chat.*` 翻译键已添加
- [x] `packages/i18n/src/locales/zh-CN.ts` — 所有 `chat.*` 翻译键已添加（含中文翻译）

### 未修改（已有翻译键但代码无需改动的已确认已使用 `t()`）

- `app/root.tsx` — 主题切换、命令菜单均使用 `useI18n` + `t()`
- `app/components/layout/Layout.tsx` — 所有文本已使用 `t()`
- 其余各路由文件均已使用 `useI18n` + `t()`

### 不在本次改造范围内的说明

shadcn/ui 组件（`components/ui/*`）中的硬编码字符串（如 "Previous", "Next", "Loading", "Close" 等）属于共享 UI 库，建议统一在 `@agent-native/i18n` 包中提供 `ui.*` 命名空间的翻译键，各模板共享。
