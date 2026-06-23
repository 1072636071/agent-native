# i18n 检查报告 - mail

## 概览
- 检查文件数: 30+ (.tsx 业务文件)
- 发现硬编码字符串数: 150+
- 严重程度: **高** — 完全未使用 `useI18n()` / `t()`

## 检查结果
- **package.json**: 未包含 `@agent-native/i18n` 依赖
- **app/root.tsx**: 未导入 `I18nProvider` 或 `useI18n`
- **整体**: 所有 .tsx 文件中未发现任何 i18n 相关导入或 `t()` 调用
- **结论**: 该模板**完全没有**国际化的支持

## 详细问题列表

### app/root.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 多处 | HTML meta | `<title>Mail</title>` | `app.title` |

### app/routes/_index.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 4 | 页面标题 | `{ title: "Inbox — Mail" }` | `inbox.pageTitle` |

### app/routes/$view.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 4 | 页面标题 | `{ title: "Mail" }` | `mail.pageTitle` |

### app/routes/$view.$threadId.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|

### app/routes/settings.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 3 | 页面标题 | `{ title: "Settings — Mail" }` | `settings.pageTitle` |

### app/routes/team.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|

### app/routes/draft-queue.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 4 | 页面标题 | `{ title: "Draft Queue — Mail" }` | `draftQueue.pageTitle` |

### app/routes/draft-queue.$id.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 4 | 页面标题 | `{ title: "Draft Queue — Mail" }` | `draftQueue.pageTitle` |

### app/pages/InboxPage.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| - | 布局 | 邮件列表布局 | - |

### app/pages/SettingsPage.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 多处 | 页面标题 | "Settings" | `settings.title` |
| 多处 | 标签页 | "General", "Signature", "Filters", "Team" | `settings.tabs.*` |

### app/pages/NotFound.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 多处 | 404 页面 | "Page not found" | `notFound.title` |
| 多处 | 返回链接 | "Go to inbox" | `notFound.goToInbox` |

### app/pages/Team.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|

### app/pages/DraftQueuePage.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|

### app/components/layout/AppLayout.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 多处 | 导航栏 | 各视图名称 | `nav.*` |
| 多处 | 视图名称 | "Inbox", "Starred", "Sent", "Drafts", "Archive", "Trash", "All Mail", "Snoozed", "Scheduled", "Spam", "Unread" | `nav.*` |
| 多处 | 操作按钮 | "Compose", "Settings" | `common.*` |

### app/components/layout/SearchBar.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 195 | 占位符 | `"Search..."` | `search.placeholder` |
| 215 | Tooltip | `"Clear search (Esc)"` | `search.clear` |

### app/components/layout/CommandPalette.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 93 | 占位符 | `"Type a command or ask AI..."` | `commandPalette.placeholder` |
| 95 | 分组标题 | `"Actions"` | `commandPalette.groupActions` |
| 101 | 命令 | `"Compose new email"` | `commandPalette.compose` |
| 107 | 命令 | `"Reply to thread"` | `commandPalette.reply` |
| 117 | 命令 | `"Snooze email"` | `commandPalette.snooze` |
| 125 | 命令 | `"Search emails"` | `commandPalette.search` |
| 134 | 命令 | `"Refresh inbox"` | `commandPalette.refresh` |
| 139 | 命令 | `"Report spam"` | `commandPalette.reportSpam` |
| 149 | 命令 | `"Report spam & block sender"` | `commandPalette.reportSpamBlock` |
| 157 | 命令 | `"Mute thread"` | `commandPalette.mute` |
| 164 | 分组标题 | `"Navigate"` | `commandPalette.groupNavigate` |
| 44-68 | 导航命令 | `"Go to Inbox"`, `"Go to Starred"`, `"Go to Sent"`, `"Go to Drafts"`, `"Go to Archive"`, `"Go to Trash"` | `commandPalette.goTo.*` |
| 182 | 分组标题 | `"Privacy"` | `commandPalette.groupPrivacy` |
| 188 | 选项 | `"Images: Show all"` | `commandPalette.imagesShowAll` |
| 202 | 选项 | `"Images: Block known trackers"` | `commandPalette.imagesBlockTrackers` |
| 214 | 选项 | `"Images: Block all remote images"` | `commandPalette.imagesBlockAll` |
| 225 | 分组标题 | `"Appearance"` | `commandPalette.groupAppearance` |
| 239 | 命令 | `"Toggle light mode"` / `"Toggle dark mode"` | `commandPalette.toggleTheme` |

### app/components/ThemeToggle.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 44 | Tooltip | `"Toggle theme"` | `themeToggle.tooltip` |
| 66 | 标签 | `"Appearance"` | `themeToggle.appearance` |
| 70 | 模式 | `"Dark"` / `"Light"` | `themeToggle.dark`, `themeToggle.light` |

### app/components/GoogleConnectBanner.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 36-70 | 步骤标题 | `"Enable the Gmail API"`, `"Enable the People API"`, `"Configure OAuth consent screen"`, `"Create OAuth credentials"`, `"Upload credentials JSON"` | `googleConnect.step.*` |
| 38-68 | 步骤描述 | 多行英文描述 | `googleConnect.step.*.description` |
| 40-68 | 链接文本 | `"Enable Gmail API"`, `"Enable People API"`, `"Configure consent screen"`, `"Create credentials"` | `googleConnect.links.*` |
| 236 | 错误消息 | `"Failed to connect. Try again."` | `googleConnect.error.connect` |
| 329 | 错误消息 | `"Could not find client_id and client_secret in JSON"` | `googleConnect.error.invalidJson` |
| 345 | 错误消息 | `"Failed to save credentials"` | `googleConnect.error.saveFailed` |
| 353 | 错误消息 | `"Failed to parse JSON"` | `googleConnect.error.parseFailed` |
| 374 | 标题 | `"Connect your Google account"` | `googleConnect.title` |
| 378 | 描述 | `"Send and receive real email. Connect your Gmail account to get started."` | `googleConnect.description` |
| 392 | 按钮状态 | `"Connecting..."` | `googleConnect.connecting` |
| 394 | 按钮 | `"Sign in with Google"` | `googleConnect.signIn` |
| 395 | 按钮 | `"Connect Google"` | `googleConnect.connect` |
| 413 | 提示 | `"Follow these steps to connect your Google account. Takes about 3 minutes."` | `googleConnect.stepsIntro` |
| 482 | 按钮 | `"Copied"` | `common.copied` |
| 485 | 按钮 | `"Copy"` | `common.copy` |
| 549 | 按钮 | `"Saving..."` | `common.saving` |
| 550 | 按钮 | `"Upload JSON"` | `googleConnect.uploadJson` |
| 557 | 提示 | `'Credentials configured. Click "Sign in with Google" above to connect.'` | `googleConnect.credentialsConfigured` |
| 600 | 按钮 | `"+ Add account"` | `googleConnect.addAccount` |
| 633 | 提示 | `"Ready to connect — sign in with your Google account"` | `googleConnect.readyToConnect` |
| 634 | 提示 | `"Connect Google to send and receive real email"` | `googleConnect.bannerText` |
| 646 | 按钮 | `"Hide setup"` | `googleConnect.hideSetup` |
| 839 | 提示 | `'Credentials configured. Click "Connect Google" above to sign in.'` | `googleConnect.credentialsConfiguredAlt` |
| 871 | 错误 | `'"that Google account"'` | - |
| 888 | 错误标题 | `"This account is connected to another login"` | `googleConnect.error.ownerMismatch` |
| 890 | 错误标题 | `"Google connection failed"` | `googleConnect.error.connectionFailed` |
| 903 | 按钮 | `"Sign out"` | `common.signOut` |
| 911 | 按钮 | `"Dismiss"` | `common.dismiss` |
| 919 | aria-label | `"Dismiss Google sign-in notice"` | `googleConnect.dismissLabel` |

### app/components/email/EmailThread.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 603 | Toast | `` `Archived ${targets.length} conversations.` `` | `emailThread.archived.multiple` |
| 604 | Toast | `"Archived."` | `emailThread.archived.single` |
| 606 | 按钮标签 | `"UNDO"` | `common.undo` |
| 659 | Toast | `` `Trashed ${targets.length} conversations.` `` | `emailThread.trashed.multiple` |
| 660 | Toast | `"Moved to Trash."` | `emailThread.trashed.single` |
| 1125 | Tooltip | `"Back (Esc)"` | `emailThread.back` |
| 1152 | Tooltip | `"Archive (E)"` | `emailThread.archiveTooltip` |
| 1164 | Tooltip | `"Move to Trash (D)"` | `emailThread.trashTooltip` |
| 1185 | aria-label | `"Minimize"` / `"Maximize"` | `emailThread.minimize`, `emailThread.maximize` |
| 1196 | Tooltip | `"Minimize"` / `"Maximize"` | `emailThread.minimize`, `emailThread.maximize` |
| 1214 | 链接 | `"View Pull Request"` | `emailThread.viewPullRequest` |
| 1241 | 按钮 | `"Unsubscribing..."` / `"Unsubscribe"` | `emailThread.unsubscribing`, `emailThread.unsubscribe` |
| 1245 | Tooltip | `"Unsubscribe from this mailing list"` | `emailThread.unsubscribeTooltip` |
| 1353 | Toast | `"Draft saved."` | `emailThread.draftSaved` |
| 1355 | 按钮标签 | `"REOPEN"` | `emailThread.reopen` |
| 1362 | 按钮标签 | `"DELETE DRAFT"` | `emailThread.deleteDraft` |
| 1414 | Toast | `"Draft saved."` | `emailThread.draftSaved` |
| 1454 | 提示 | `"Reply"` | `emailThread.replyPrompt` |
| 1504 | Tooltip | `"Back (Esc)"` | `emailThread.back` |
| 1656 | 日期格式 | `toLocaleDateString("en-US", ...)` | 需要 i18n 日期格式化 |
| 1725 | 标签 | `"From"` | `emailThread.from` |
| 1737 | 标签 | `"To"` | `emailThread.to` |
| 1745 | 标签 | `"Cc"` | `emailThread.cc` |
| 1800 | 前缀 | `"to"` (recipients) | `emailThread.toPrefix` |
| 1818 | Tooltip | `"Reply"` | `emailThread.reply` |
| 1832 | Tooltip | `"Reply All"` | `emailThread.replyAll` |
| 1846 | Tooltip | `"Forward"` | `emailThread.forward` |
| 1963 | 按钮 | `"Download all"` | `emailThread.downloadAll` |
| 1979 | 相对时间 | `"just now"`, `` `${m}m ago` ``, `` `${h}h ago` ``, `` `${d}d ago` ``, `` `${w}w ago` `` | `relativeTime.*` |
| 2000 | 打开次数 | `` `Opened ${opens} ${opens === 1 ? "time" : "times"}` `` | `emailTracking.opened` |
| 2001 | 上次时间 | `` `last ${formatRelativeTime(lastOpenedAt)}` `` | `emailTracking.last` |
| 2004 | 点击次数 | `` `${totalClicks} link ${totalClicks === 1 ? "click" : "clicks"}` `` | `emailTracking.clicks` |
| 3289-3307 | 图片策略 | `"Remote images hidden in this embed."`, `"Images blocked."`, `"Show images"`, ``"Always from ${senderDomain}"`` | `emailImages.*` |
| 3371 | 搜索占位符 | `"Search in conversation…"` | `threadSearch.placeholder` |
| 3379 | 无匹配 | `"No matches"` | `threadSearch.noMatches` |
| 3394 | Tooltip | `"Previous match (Shift+Enter)"` | `threadSearch.prevMatch` |
| 3406 | Tooltip | `"Next match (Enter)"` | `threadSearch.nextMatch` |
| 3417 | Tooltip | `"Close (Esc)"` | `threadSearch.close` |

### app/components/email/EmailList.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 122-146 | 空状态提示 | `"No snoozed emails right now."`, `"Drafts you save will appear here."`, `"Star an email to keep it close at hand."` 等 11 条各视图的空状态文案 | `emailList.emptyState.*` |
| 198-202 | Inbox Zero | `"You've hit Inbox Zero"`, `"You're all caught up"` | `emailList.inboxZero.*` |
| 308 | 按钮 | `"Retrying…"` | `emailList.retrying` |
| 310 | 按钮 | `` `Try again in ${cooldownSeconds}s` `` | `emailList.tryAgainCountdown` |
| 312 | 按钮 | `"Try again"` | `emailList.tryAgain` |
| 324 | 错误标题 | `"Gmail rate limit hit"` | `emailList.error.rateLimit` |
| 325 | 错误标题 | `"Unable to load emails"` | `emailList.error.unableToLoad` |
| 329 | 错误描述 | `"Too many recent requests to Google. Waiting a moment before retrying."` | `emailList.error.rateLimitDesc` |
| 603 | Toast | `` `Archived ${threadKeys.length} conversations.` `` | `emailList.archived.multiple` |
| 652 | Toast | `"Archived."` | `emailList.archived.single` |
| 741 | Toast | `` `Trashed ${threadKeys.length} conversations.` `` | `emailList.trashed.multiple` |
| 745 | Toast | `"Moved to Trash."` | `emailList.trashed.single` |
| 859 | Toast | `` `Moved ${targets.length} conversations to ${labelName}.` `` | `emailList.moved.multiple` |
| 861 | Toast | `` `Moved to ${labelName}.` `` | `emailList.moved.single` |
| 1134 | Toast | `"Scheduled email sent."` | `emailList.scheduledSent` |
| 1137-1140 | Toast | `"Failed to send scheduled email"` | `emailList.scheduledSendError` |
| 1140 | Toast 错误 | `"Failed to send scheduled email"` | `emailList.scheduledSendError` |
| 1152 | Toast | `"Scheduled email cancelled."` | `emailList.scheduledCancelled` |
| 1153 | Toast | `"Failed to cancel scheduled email"` | `emailList.scheduledCancelError` |
| 1205 | Toast | `"Archived."` | `emailList.archived.single` |
| 1206 | 按钮标签 | `"UNDO"` | `common.undo` |
| 1261 | Tooltip | `"Clear selection"` | `emailList.clearSelection` |
| 1264 | 计数 | `` `${selectedIds.size} selected` `` | `emailList.selectedCount` |
| 1279 | Tooltip | `"Selection actions"` | `emailList.selectionActions` |
| 1287 | 菜单 | `"Archive"` | `emailList.menuArchive` |
| 1294 | 菜单 | `"Mark read"` | `emailList.menuMarkRead` |
| 1301 | 菜单 | `"Mark unread"` | `emailList.menuMarkUnread` |
| 1307 | 菜单 | `"Move to"` | `emailList.menuMoveTo` |
| 1328 | 菜单 | `"Move to Trash"` | `emailList.menuMoveToTrash` |
| 1332 | 菜单标签 | `"Select"` | `emailList.menuSelect` |
| 1334 | 菜单 | `"All"` | `emailList.menuSelectAll` |
| 1337 | 菜单 | `"None"` | `emailList.menuSelectNone` |
| 1340 | 菜单 | `"Read"` | `emailList.menuSelectRead` |
| 1343 | 菜单 | `"Unread"` | `emailList.menuSelectUnread` |
| 1349 | 菜单 | `"Starred"` | `emailList.menuSelectStarred` |
| 1355 | 菜单 | `"Unstarred"` | `emailList.menuSelectUnstarred` |
| 1420 | 搜索结果 | `` `No results for "${searchQuery}"` `` | `emailList.noResults` |
| 1423 | 提示 | `"Try different keywords"` | `emailList.tryDifferentKeywords` |
| 1438 | 空状态 | `"Nothing here yet"` | `emailList.nothingHere` |
| 1518 | 加载 | `"Loading more..."` | `emailList.loadingMore` |

### app/components/email/EmailListItem.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|------|
| 442 | aria-label | `"Deselect email"` / `"Select email"` | `emailListItem.*` |
| 488 | title | `` `Account: ${email.accountEmail}` `` | `emailListItem.account` |
| 557 | Tooltip | `"Mark read"` / `"Mark unread"` | `emailListItem.markRead`, `emailListItem.markUnread` |
| 572 | Tooltip | `"Archive"` | `emailListItem.archive` |
| 586 | Tooltip | `"Snooze"` | `emailListItem.snooze` |
| 600 | Tooltip | `"Send now"` | `emailListItem.sendNow` |
| 615 | Tooltip | `"Cancel scheduled send"` | `emailListItem.cancelSchedule` |
| 629 | Tooltip | `"Move to Trash"` | `emailListItem.moveToTrash` |
| 646 | Tooltip | `"Unpin"` / `"Pin"` | `emailListItem.unpin`, `emailListItem.pin` |

### app/components/email/SnoozePopover.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 29 | 预设标签 | `"Later today"` | `snooze.laterToday` |
| 36 | 预设标签 | `"Tomorrow"` | `snooze.tomorrow` |
| 43 | 预设标签 | `"This weekend"` | `snooze.thisWeekend` |
| 50 | 预设标签 | `"Next week"` | `snooze.nextWeek` |
| 56 | 日期格式 | `toLocaleString("en-US", ...)` | 需要 i18n 日期格式化 |
| 129 | 错误 Toast | `"Couldn't snooze — check the server logs."` | `snooze.error` |
| 142 | 标题 | `"Snooze until"` | `snooze.title` |
| 174 | 占位符 | `"or try: friday 5pm, in 2 weeks..."` | `snooze.placeholder` |
| 179 | 提示 | `"Snooze until {displayDate}"` | `snooze.until` |
| 184 | 解析中 | `"Parsing..."` | `snooze.parsing` |
| 197 | 按钮 | `"Snoozing..."` / `"Snooze"` | `snooze.snoozing`, `snooze.snooze` |

### app/components/email/RecipientInput.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 267 | 对话框标题 | `"Save as alias"` | `recipientInput.saveAliasTitle` |
| 268 | 对话框描述 | `"Create a reusable group of {emails.length} recipients"` | `recipientInput.saveAliasDesc` |
| 280 | 占位符 | `"Alias name"` | `recipientInput.aliasName` |
| 288 | 按钮 | `"Cancel"` | `common.cancel` |
| 296 | 按钮 | `"Saving…"` / `"Save"` | `common.saving`, `common.save` |
| 613 | 计数 | `` `${alias.emails.length} people` `` | `recipientInput.people` |
| 768 | 按钮 | `"Save as alias"` | `recipientInput.saveAsAlias` |

### app/components/settings/GmailFiltersSection.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 236 | 标签 | `"Account"` | `gmailFilters.account` |
| 244 | 占位符 | `"Select account"` | `gmailFilters.selectAccount` |
| 257 | 标签 | `"From"` | `gmailFilters.from` |
| 263 | 占位符 | `"alerts@example.com"` | `gmailFilters.fromPlaceholder` |
| 269 | 标签 | `"To"` | `gmailFilters.to` |
| 275 | 占位符 | `"me@example.com"` | `gmailFilters.toPlaceholder` |
| 281 | 标签 | `"Subject"` | `gmailFilters.subject` |
| 286 | 占位符 | `"Invoice"` | `gmailFilters.subjectPlaceholder` |
| 293 | 标签 | `"Gmail search"` | `gmailFilters.gmailSearch` |
| 298 | 占位符 | `` `from:alerts@example.com subject:("build failed")` `` | `gmailFilters.searchPlaceholder` |
| 307-357 | Switch 标签 | `"Archive"`, `"Mark read"`, `"Never spam"`, `"Never important"`, `"Important"`, `"Star"`, `"Trash"` | `gmailFilters.actions.*` |
| 363 | 标签 | `"Apply label"` | `gmailFilters.applyLabel` |
| 369 | 占位符 | `"Receipts"` | `gmailFilters.labelPlaceholder` |
| 378 | 标签 | `"Create label"` | `gmailFilters.createLabel` |
| 384 | 标签 | `"Forward to"` | `gmailFilters.forwardTo` |
| 389 | 占位符 | `"verified-address@example.com"` | `gmailFilters.forwardPlaceholder` |
| 402 | 按钮 | `"Save"` | `common.save` |
| 404 | 按钮 | `"Cancel"` | `common.cancel` |
| 453 | 过滤摘要 | `filter.criteriaSummary` / `filter.actionSummary` | `gmailFilters.*` |
| 473 | Tooltip | `"Edit filter"` | `gmailFilters.editFilter` |
| 491 | Tooltip | `"Delete filter"` | `gmailFilters.deleteFilter` |
| 499 | 对话框标题 | `"Delete Gmail filter"` | `gmailFilters.deleteDialogTitle` |
| 501 | 对话框描述 | `"Delete this filter from {filter.accountEmail}? This changes Gmail directly."` | `gmailFilters.deleteDialogDesc` |
| 506 | 按钮 | `"Cancel"` | `common.cancel` |
| 520 | 按钮 | `"Delete"` | `common.delete` |
| 549 | 标题 | `"Gmail Filters"` | `gmailFilters.title` |
| 551 | 描述 | `"Server-side Gmail rules for simple sender, subject, and search patterns."` | `gmailFilters.description` |
| 565 | 按钮 | `"New filter"` | `gmailFilters.newFilter` |
| 608 | 空状态 | `"No Gmail filters yet."` | `gmailFilters.empty` |

### app/components/email/ComposeModal.tsx / ComposeEditor.tsx / InlineReplyComposer.tsx (推断内容)
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 多处 | 编写器 | "To", "Cc", "Bcc", "Subject", "Send", "Discard", "Save draft" 等 | `compose.*` |

## 总结

**mail 模板完全未实现国际化。** 没有任何 `@agent-native/i18n` 依赖或相关导入。
- 该模板是邮件客户端，包含极其大量的用户可见文本：导航标签、邮件操作按钮（Archive/Trash/Snooze/Star/Reply 等）、空状态提示、Inbox Zero 画面、Toast 通知、错误消息、设置页面、命令面板、Google 连接引导步骤、邮件过滤规则编辑器等，全部为硬编码英文。
- 部分日期格式化使用了 `toLocaleString("en-US", ...)`，需要替换为 i18n 感知的日期格式化方案。
- 要实现 i18n，需要：添加 `@agent-native/i18n` 依赖 → 在 `root.tsx` 中包裹 `I18nProvider` → 在所有组件中替换为 `t()` 调用 → 创建翻译文件。工作量大，涉及 30+ 个业务文件、150+ 个字符串。

---

## 完成情况

| 项 | 状态 |
|----|------|
| `@agent-native/i18n` 依赖 | ✅ 已添加 |
| `I18nProvider` + `useI18n` 导入 | ✅ 已完成 |
| `<html lang>` 动态化 | ✅ 已完成 |
| `t()` 替换 ErrorBoundary 硬编码 | ✅ 已完成（unableToLoad、common.back） |
| `routeErrorMessage` 支持 t() | ✅ 已完成 |
| 翻译键添加 (en.ts/zh-CN.ts) | ✅ 已完成（mail.* 命名空间，含 nav、common、compose、search、commandPalette、theme、notFound、settings、emailList、emailThread、emailTracking、emailImages、threadSearch、snooze、recipientInput、googleConnect、gmailFilters、relativeTime、error 等） |
| 深层组件替换 | ⏳ 部分完成（AppLayout、SearchBar、CommandPalette、ThemeToggle、GoogleConnectBanner、EmailThread、EmailList、SnoozePopover、ComposeModal 等 30+ 组件中的 150+ 字符串待替换） |