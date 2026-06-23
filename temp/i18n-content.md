# i18n 检查报告 - content

## 概览
- 检查文件数: 60 (.tsx)
- 发现硬编码字符串数: 150+
- 严重程度: **高** — 完全未使用 `useI18n()` / `t()`

## i18n 基础设施检查
| 检查项 | 结果 |
|--------|------|
| package.json 中包含 `@agent-native/i18n` | ❌ 未找到 |
| app/root.tsx 中导入 `I18nProvider` | ❌ 未导入 |
| app/root.tsx 中导入 `useI18n` | ❌ 未导入 |
| 任何文件中使用 `t()` 函数 | ❌ 未使用 |
| `<html lang="en">` 硬编码 | ❌ 固定为 `en` |

## 详细问题列表

### app/root.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 47 | 标签 | `System` | `theme.system` |
| 48 | 标签 | `Light` | `theme.light` |
| 49 | 标签 | `Dark` | `theme.dark` |
| 93 | html lang | `<html lang="en">` | — |
| 158 | 菜单项 | `Toggle theme` | `command.toggle_theme` |
| 160 | 标签 | `System` / `Light` / `Dark` | `theme.label.*` |
| 197 | 占位符 | `Ask me anything about this document` | `agent.placeholder` |
| 199-201 | 建议 | `Summarize this document` / `What are the key takeaways?` / `Turn this into an action plan` | `agent.suggestion.*` |
| 251 | 分组标题 | `Content` | `command.group.content` |
| 253 | 菜单项 | `Search documents` | `command.search_documents` |
| 256 | 分组标题 | `Appearance` | `command.group.appearance` |
| 267 | 错误标题 | `Something went wrong` | `error.something_wrong` |
| 268 | 错误描述 | `An unexpected error occurred.` | `error.unexpected` |
| 272 | 错误标题 | `Page not found` | `error.not_found` |
| 273 | 错误描述 | `We couldn't find this page.` | `error.not_found_desc` |
| 275 | 错误标题 | `${status} Error` | `error.status_title` |
| 296 | 链接 | `Go to page list` | `nav.go_to_page_list` |
| 303 | 按钮 | `Reload` | `common.reload` |

### app/routes/_app.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 5-6 | meta 描述 | `Open Source MDX editor for local docs...` | `seo.app.description` |
| 10-11 | meta title | `Agent-Native Content - Open Source, agent-friendly Obsidian alternative` | `seo.app.title` |

### app/routes/_app._index.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 7-10 | SEO 标题/描述 | `Agent-Native Content - Open Source...` / `Open Source MDX editor...` | `seo.index.title` / `seo.index.description` |

### app/routes/_app.page._index.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 1 | (引用 EmptyState) | `No page selected` 等 | (见 EmptyState 组件) |

### app/routes/_app.page.$id.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 4-15 | meta 标题/描述 | `Agent-Native Content - Open Source...` | `seo.page.title` |
| 26 | 提示文字 | `Document not found` | `error.document_not_found` |

### app/routes/p.$id.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 18 | 404 错误 | `Not found` | `error.not_found` |
| 64 | meta fallback title | `Public document` | `meta.public_document.title` |

### app/routes/_app.team.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 5 | meta title | `Workspace access — Content` | `meta.team.title` |
| 11 | 页面标题 | `Workspace access` | `nav.workspace_access` |
| 19 | 标题 | `Shared document workspace` | `team.shared_workspace` |
| 21-23 | 描述 | `Workspaces are the shared spaces...` | `team.workspace_desc` |
| 27 | 卡片标题 | `People and access` | `team.people_access` |
| 28 | 创建描述 | `Create a shared workspace for Content...` | `team.create_org_desc` |

### app/routes/_app.local-files.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| (全文) | 多个字符串 | 本地文件管理相关文字（拉取、推送、同步等） | `local_files.*` |

### app/components/EmptyState.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 71-72 | 标题 | `No page selected` | `empty.no_page_selected` |
| 74-76 | 描述 | `Select a page from the sidebar or create a new one to get started.` | `empty.select_page_desc` |
| 79 | 按钮 | `New page` | `empty.new_page` |
| 58 | toast | `Failed to create page` | `toast.create_page_failed` |
| 59-60 | toast 描述 | `Something went wrong` | `toast.something_wrong` |

### app/components/ThemeToggle.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 13 | 选项标签 | `System theme` | `theme.system_theme` |
| 14 | 选项标签 | `Light theme` | `theme.light_theme` |
| 15 | 选项标签 | `Dark theme` | `theme.dark_theme` |
| 87 | aria-label | `System theme` / `Light theme` / `Dark theme` | `aria.theme.*` |
| 97 | 工具提示 | `System theme` / `Light theme` / `Dark theme` | `tooltip.theme.*` |

### app/components/layout/Header.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 9 | 路由标题映射 | `Content` | `nav.content` |
| 10 | 路由标题映射 | `Team` | `nav.team` |
| 17 | 路由标题映射 | `Document` | `nav.document` |
| 18 | 路由标题映射 | `Extensions` | `nav.extensions` |
| 20 | 默认标题 | `Content` | `nav.content` |

### app/components/editor/DocumentEditor.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| (全文) | 多个字符串 | 编辑器相关文字（保存、加载、错误等） | `editor.*` |

### app/components/editor/DocumentToolbar.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| (全文) | 多个字符串 | 工具栏按钮文字（导出格式、分享、版本历史等） | `editor.toolbar.*` |

### app/components/editor/DocumentDatabase.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| (全文) | 多个字符串 | 数据库视图相关文字 | `database.*` |

### app/components/editor/DocumentProperties.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| (全文) | 多个字符串 | 属性编辑相关文字（属性类型标签、按钮等） | `properties.*` |

### app/components/editor/CommentsSidebar.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| (全文) | 多个字符串 | 评论侧栏文字（解决、回复、删除等） | `comments.*` |

### app/components/editor/CommentComposer.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| (全文) | 多个字符串 | 评论输入框占位符等相关文字 | `comments.composer.*` |

### app/components/editor/VersionHistoryPanel.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 40 | 相对时间 | `Just now` | `time.just_now` |
| 41 | 相对时间 | `${diffMin}m ago` | `time.minutes_ago` |
| 42 | 相对时间 | `${diffHr}h ago` | `time.hours_ago` |
| 43 | 相对时间 | `${diffDay}d ago` | `time.days_ago` |
| (全文) | 多个字符串 | 版本历史面板文字（恢复、确认等） | `version_history.*` |

### app/components/editor/NotionSyncBar.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 66-67 | toast 错误 | `Set up Notion first — click the Notion icon in the sidebar.` | `notion.setup_first` |
| 75 | toast 错误 | `Paste a Notion page URL or page ID.` | `notion.paste_url` |
| (全文) | 多个字符串 | Notion 同步栏文字（连接、断开、推送、拉取等） | `notion.sync_bar.*` |

### app/components/editor/NotionConflictBanner.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| (全文) | 多个字符串 | Notion 冲突提示文字 | `notion.conflict.*` |

### app/components/editor/SlashCommandMenu.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| (全文) | 多个字符串 | 斜杠命令菜单文字 | `editor.slash_command.*` |

### app/components/editor/BubbleToolbar.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| (全文) | 多个字符串 | 气泡工具栏按钮（加粗、斜体、链接、评论等） | `editor.bubble.*` |

### app/components/editor/LinkHoverPreview.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| (全文) | 多个字符串 | 链接悬停预览文字 | `editor.link_preview.*` |

### app/components/editor/EmojiPicker.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| (全文) | 多个字符串 | emoji 选择器文字 | `editor.emoji.*` |

### app/components/editor/VisualEditor.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| (全文) | 多个字符串 | 可视化编辑器文字 | `editor.visual.*` |

### app/components/editor/TableHoverControls.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| (全文) | 多个字符串 | 表格悬停控制文字 | `editor.table.*` |

### app/components/sidebar/DocumentSidebar.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| (全文) | 多个字符串 | 侧边栏文字（搜索、收藏、新建等） | `sidebar.*` |

### app/components/sidebar/DocumentTreeItem.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| (全文) | 多个字符串 | 文档树项目文字（删除确认等） | `sidebar.tree_item.*` |

### app/components/sidebar/NotionButton.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 48-55 | OAuth 步骤标题/描述 | `Create a Notion integration` / `Configure as public integration` / `Connect your Notion workspace` / `Authorize` | `notion.oauth.step.*` |
| 53 | 链接文字 | `Open Notion Integrations` | `notion.open_integrations` |
| (全文) | 多个字符串 | Notion 连接相关文字 | `notion.button.*` |

### app/components/layout/AppLayout.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| (全文) | 少量字符串 | 布局相关文字 | `layout.*` |

### app/components/layout/Layout.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| (全文) | 少量字符串 | 布局相关文字 | `layout.*` |

### app/hooks/use-local-storage.test.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| (全文) | 测试文字 | 测试文件中的字符串 | (测试文件可忽略) |

## 补充说明

### meta() 函数中的 SEO 字符串
content 模板多个 route 文件中的 `meta()` 函数包含 SEO 标题和描述，全部为硬编码英文：
- `_app.tsx` - SEO 标题
- `_app._index.tsx` - SEO 标题/描述
- `_app.page.$id.tsx` - SEO 标题/描述
- `_app.team.tsx` - meta title
- `p.$id.tsx` - meta title/描述

### ErrorBoundary 中的字符串
`app/root.tsx` 中的 `ContentErrorBoundaryBody` 组件包含 6 处硬编码错误提示文字。

### CommandMenu 中的字符串
`app/root.tsx` 中的 CommandMenu 包含分组标题和菜单项文字（"Content"、"Search documents"、"Appearance"）。

### 主题相关字符串
`app/root.tsx` 和 `app/components/ThemeToggle.tsx` 中的主题选项标签（System/Light/Dark）及 ARIA 标签。

## 总结
- **content 模板完全没有国际化的任何基础设施**，package.json 中没有 `@agent-native/i18n` 依赖，root.tsx 中没有导入 `I18nProvider` 或 `useI18n`，所有 `.tsx` 文件中均未使用 `t()` 函数。
- 全局有 **150+ 处硬编码英文文本**，分布在 60 个 `.tsx` 文件中，涵盖所有用户可见 UI 文本。
- `app/root.tsx` 中的 `<html lang="en">` 也是硬编码的。
- 编辑器和数据库相关组件中包含大量用户可见的工具栏按钮文字、属性类型标签、菜单文字等，均需要提取为翻译键。
- Notion 集成相关的 OAuth 设置步骤包含 4 步详细的英文说明文字。
- 国际化改造成本较高，涉及所有 route 文件和 component 文件中的字符串提取、i18n 配置创建，以及在 root.tsx 中集成 `I18nProvider`。

---

## 完成情况

| 项 | 状态 |
|----|------|
| `@agent-native/i18n` 依赖 | ✅ 已添加 |
| `I18nProvider` + `useI18n` 导入 | ✅ 已完成 |
| `<html lang>` 动态化 | ✅ 已完成 |
| `t()` 替换 root.tsx 硬编码 | ✅ 已完成（toggleTheme、theme.labels、agent.suggestions、errorBoundary、CommandMenu） |
| 翻译键添加 (en.ts/zh-CN.ts) | ✅ 已完成（content.* 命名空间，含 SEO、nav、theme、error、agent 等） |
| 深层组件替换 | ⏳ 部分完成（EmptyState、SidebarHeader、Editor 等 50+ 组件中的 120+ 字符串待替换） |