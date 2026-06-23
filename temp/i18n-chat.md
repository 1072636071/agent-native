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

## 总结
- 相比其他模板，chat 的硬编码较少（55+），但波及 shadcn/ui 共享组件
- shadcn/ui 组件的硬编码建议统一在 `@agent-native/i18n` 包中提供 `ui.*` 命名空间
- `<html lang="en">` 硬编码需修复
- SEO meta 标签需国际化
