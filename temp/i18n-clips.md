# i18n 检查报告 - clips

## 概览
- 检查文件数: 80 (.tsx)
- 发现硬编码字符串数: 200+
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
| 44 | html lang 硬编码 | `<html lang="en">` | — |
| 108 | 硬编码字符串 | `Toggle theme` | `command.toggle_theme` |
| 145 | 硬编码字符串 | `Search` | `command.search` |
| 144 | 硬编码字符串 | `Actions` | `command.group.actions` |
| 147 | 硬编码字符串 | `Appearance` | `command.group.appearance` |

### app/routes/record.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 97 | meta title | `New recording — Clips` | `meta.record.title` |
| 269 | 硬编码字符串 | `Choose a source before recording starts.` | `record.choose_source` |
| 274 | 硬编码字符串 | `Allow ${...} access before recording starts.` | `record.allow_access_template` |
| 285-327 | 权限引导 | 多行 Mac/Windows 权限提示文字 | `record.permission.*` |
| 377 | 错误标题 | `Video is too large` | `error.video_too_large` |
| 378 | 错误标题 | `Upload failed` | `error.upload_failed` |
| 379 | 错误标题 | `Screen recording needs access` | `error.screen_needs_access` |
| 380 | 错误标题 | `Camera needs access` | `error.camera_needs_access` |
| 381 | 错误标题 | `Microphone needs access` | `error.mic_needs_access` |
| 382 | 错误标题 | `Couldn't start recording` | `error.could_not_start` |
| 392-397 | 错误详情 | `Video is too large to upload (...)` | `error.too_large_detail` |
| 408-410 | 错误消息 | `This video is too large for Clips...` | `error.too_large_message` |
| 413 | 错误消息 | `The video could not finish uploading...` | `error.upload_failed_message` |
| 416 | 错误消息 | `This recorder is embedded somewhere...` | `error.embedded_blocked` |
| 419 | 错误消息 | `Clips could not start screen capture...` | `error.screen_capture_failed_mac` |
| 422 | 错误消息 | `Clips could not start screen capture...` | `error.screen_capture_failed` |
| 425 | 错误消息 | `Clips could not start the camera...` | `error.camera_failed` |
| 428 | 错误消息 | `Clips could not start the microphone...` | `error.mic_failed` |
| 431 | 错误消息 | `Something blocked the recorder...` | `error.something_blocked` |
| 500 | 硬编码字符串 | `Better in the desktop app` | `record.desktop_app_title` |
| 503-505 | 描述 | `Menu-bar launch, global shortcuts...` | `record.desktop_app_desc` |
| 513 | 按钮文字 | `Download desktop app` | `record.download_desktop` |
| 565 | 摘要文字 | `Technical details` | `record.technical_details` |
| 577 | 标签 | `What to check` | `record.what_to_check` |
| 594 | 按钮 | `Download recording` | `record.download_recording` |
| 597-599 | 提示 | `Your recording is safe on this device...` | `record.download_safe_message` |
| 604 | 按钮 | `Retry upload` | `record.retry_upload` |
| 604 | 按钮 | `Try again` | `record.try_again` |
| 613 | 按钮 | `Open recorder in tab` | `record.open_in_tab` |
| 640 | 按钮 | `Screen` | `record.source.screen` |
| 653 | 按钮 | `Camera` | `record.source.camera` |
| 666 | 按钮 | `Mic` | `record.source.mic` |
| 807 | toast | `Upload failed` | `toast.upload_failed` |
| 807 | toast | `Couldn't start recording` | `toast.could_not_start` |
| 812 | 按钮 | `Open settings` | `toast.open_settings` |
| 839 | toast | `Opened recorder in a new tab` | `toast.opened_new_tab` |
| 840 | toast描述 | `Chrome is blocking ${...}` | `toast.chrome_blocked` |
| 966-967 | 错误消息 | `No video storage configured...` | `error.no_storage` |
| 1155 | 错误消息 | `That file type isn't supported...` | `error.unsupported_file_type` |
| 1342-1346 | toast | `Video is ready to upload` / `Connect Builder.io...` | `toast.video_ready` |
| 1348 | toast | `Video uploaded` | `toast.video_uploaded` |
| 1469-1473 | toast | `Recording is ready to upload` / `Connect Builder.io...` | `toast.recording_ready` |
| 1475 | toast | `Recording saved` | `toast.recording_saved` |
| 1614 | toast | `No local recording data is available...` | `toast.no_local_data` |
| 1626 | toast | `Recording download started` | `toast.download_started` |
| 1852 | aria-label | `Back to library` | `aria.back_to_library` |
| 1875-1876 | 组织提示 | `Create your organization` / `Clips organizes...` | `org.create.title` / `org.create.desc` |
| 1881 | 品牌文字 | `Clips recorder` | `brand.clips_recorder` |
| 1924 | 状态文字 | `Preparing sources…` | `record.preparing_sources` |
| 1966 | 提示文字 | `Recording your screen — switch to...` | `record.recording_screen` |
| 1968-1970 | 键盘提示 | `Press Esc to stop` | `record.press_esc` |
| 2012-2014 | 压缩中 | `Compressing your recording — ${...}%` | `record.compressing` |
| 2018-2020 | 压缩说明 | `Large clips need a quick re-encode...` | `record.compression_desc` |
| 2023 | 保存中 | `Saving your recording…` | `record.saving` |
| 2028 | 取消按钮 | `Cancel` | `common.cancel` |
| 2063 | 过期提示 | `Session expired` | `error.session_expired` |
| 2066 | 过期说明 | `Your login session has expired...` | `error.session_expired_desc` |
| 2069 | 按钮 | `Log in` | `auth.log_in` |
| 2103 | 弹窗标题 | `Stop recording?` | `record.stop_confirm_title` |
| 2105-2106 | 弹窗描述 | `Save this recording to your library...` | `record.stop_confirm_desc` |
| 2109 | 按钮 | `Keep recording` | `record.keep_recording` |
| 2118 | 按钮 | `Discard` | `record.discard` |
| 2128 | 按钮 | `Restart` | `record.restart` |
| 2138 | 按钮 | `Stop and save` | `record.stop_and_save` |

### app/routes/_index.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 4-7 | SEO 标题/描述 | `Agent-Native Clips - Open Source, agent-friendly Loom alternative` / `Open Source screen recorder...` | `seo.index.title` / `seo.index.description` |

### app/routes/_app.library._index.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 4-7 | SEO 标题/描述 | `Agent-Native Clips - Open Source...` | `seo.library.title` |
| 21 | 标题 | `Library` | `nav.library` |

### app/routes/_app.settings._index.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 26 | meta title | `Settings · Clips` | `meta.settings.title` |
| 217 | 标题 | `Settings` | `nav.settings` |
| 223 | 说明 | `Your personal preferences...` | `settings.personal_prefs` |
| 229 | 卡片标题 | `Video storage` | `settings.video_storage` |
| 238 | 状态 | `Checking storage` | `settings.checking_storage` |
| 240 | 状态 | `Not connected` | `settings.not_connected` |
| 243-246 | 描述 | `New clips will upload...` / `Save S3-compatible...` | `settings.storage_desc.*` |
| 249 | 标签 | `Connected` | `status.connected` |
| 250 | 标签 | `Pending` | `status.pending` |
| 283 | 按钮 | `Save storage` | `settings.save_storage` |
| 297 | 卡片标题 | `Profile` | `settings.profile` |
| 301 | 标签 | `Email` | `settings.email` |
| 305 | 标签 | `Display name` | `settings.display_name` |
| 310 | 占位符 | `Your name` | `settings.your_name` |
| 319 | 卡片标题 | `Playback` | `settings.playback` |
| 323 | 标签 | `Default playback speed` | `settings.default_speed` |
| 341 | 说明 | `Applied automatically when you open...` | `settings.playback_desc` |
| 349 | 卡片标题 | `Transcript` | `settings.transcript` |
| 355 | 标签 | `Background cleanup` | `settings.background_cleanup` |
| 358-360 | 说明 | `Show the native transcript immediately...` | `settings.cleanup_desc` |
| 375 | 卡片标题 | `Notifications` | `settings.notifications` |
| 380 | 标签 | `Email notifications` | `settings.email_notif` |
| 383-385 | 说明 | `Get an email when someone comments...` | `settings.notif_desc` |
| 403 | 按钮 | `Save changes` | `settings.save_changes` |
| 171 | toast | `Settings saved` | `toast.settings_saved` |

### app/routes/share.$shareId.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 78 | 默认标题 | `Untitled recording` | `recording.untitled` |
| 88 | 页面标题 | `Clip recording · Clips` | `meta.share.title` |
| 92 | 显示标题 | `Untitled Clip` | `recording.untitled_clip` |
| 130-133 | meta 描述 | `Watch "${title}" on Clips.` / `Watch this screen recording on Clips.` | `seo.share.description.*` |
| 255-256 | 代理说明 | `Fetch agentContextUrl...` | `share.agent_instructions` |
| 267 | 链接文字 | `Agent-readable clip context` | `share.agent_context` |
| 405 | 密码错误 | `Incorrect password` | `share.incorrect_password` |
| 461 | 密码提示 | `This clip is password-protected` | `share.password_protected` |
| 473 | 过期标题 | `Link expired` | `share.link_expired` |
| 474 | 过期消息 | `The creator set an expiry...` | `share.link_expired_msg` |
| 484 | 不可用标题 | `Clip unavailable` | `share.clip_unavailable` |
| 485-486 | 不可用消息 | `This recording isn't public...` | `share.clip_unavailable_msg` |
| 491 | 按钮 | `Sign in` | `auth.sign_in` |
| 506 | 错误标题 | `Something went wrong` | `error.something_wrong` |
| 507 | 错误消息 | `Please try again.` | `error.try_again` |
| 525-543 | 状态消息 | 多个上传/处理/失败状态文字 | `share.status.*` |
| 562 | 标签 | `Details` | `common.details` |
| 581-583 | 存储设置 | `Connect storage to finish saving` / 描述 | `share.storage_setup.*` |
| 595 | 按钮 | `Sign in to finish` | `auth.sign_in_finish` |
| 602 | 按钮 | `Sign in if this is yours` | `auth.sign_in_if_yours` |
| 607 | 按钮 | `Open dashboard` | `share.open_dashboard` |
| 619 | 按钮 | `Check again` | `share.check_again` |
| 636 | aria-label | `Generating title` | `aria.generating_title` |
| 651 | 按钮 | `Open dashboard` | `share.open_dashboard` |
| 657 | 按钮 | `Try Clips` | `share.try_clips` |
| 679 | 按钮 | `Share` | `share.share` |
| 776 | 按钮 | `Download MP4` | `share.download_mp4` |
| 789 | 标签 | `Agent` | `tab.agent` |
| 792 | 标签 | `Comments` | `tab.comments` |
| 799 | 标签 | `Transcript` | `tab.transcript` |
| 803 | 标签 | `Insights` | `tab.insights` |
| 885-888 | 下载标签 | `Download for Mac` / `Download for Windows` / `Download desktop app` | `share.download_label.*` |
| 914-941 | 描述文字 | `Agent-Native Clips is a free, open-source...` | `share.description` |
| 947 | 按钮 | `Download desktop app` | `share.download_desktop` |
| 950 | 按钮 | `Sign up` | `auth.sign_up` |
| 961 | 提示 | `Owner insights` | `insights.owner` |
| 963-965 | 描述 | `Views, completion, and viewer details...` | `insights.owner_desc` |
| 988 | 按钮 | `Go home` | `nav.go_home` |

### app/routes/download.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 13 | meta title | `Download Clips Desktop` | `meta.download.title` |
| 16-17 | meta 描述 | `Record your screen from the menu bar...` | `meta.download.description` |
| 45 | 标签 | `macOS` | `download.macos` |
| 46 | 子标签 | `Universal (Apple Silicon + Intel)` | `download.macos_sublabel` |
| 52 | 标签 | `Windows` | `download.windows` |
| 53 | 子标签 | `64-bit MSI installer` | `download.windows_sublabel` |

### app/routes/r.$recordingId.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 53 | meta title | `Clip recording · Clips` | `meta.recording.title` |
| 72-76 | 错误消息 | `Clips tried to compress...` / `The desktop recorder finished...` | `error.native_save.*` |
| 81 | 提示 | `Owner insights` | `insights.owner` |
| 83-85 | 描述 | `Views, completion, and viewer details...` | `insights.owner_desc` |

### app/routes/_app.trash.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 23 | meta title | `Trash · Clips` | `meta.trash.title` |
| 68 | toast | `Restored` | `toast.restored` |
| 69 | toast | `Restore failed` | `toast.restore_failed` |

### app/routes/_app.archive.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 4 | meta title | `Archive · Clips` | `meta.archive.title` |

### app/routes/_app.dictate.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 39 | meta title | `Dictate · Clips` | `meta.dictate.title` |

### app/routes/_app.spaces._index.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 11 | meta title | `Spaces · Clips` | `meta.spaces.title` |
| 49 | 标题 | `Spaces` | `nav.spaces` |
| 57 | 按钮 | `New space` | `spaces.new_space` |

### app/routes/_app.settings.organization.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 24 | meta title | `Organization settings · Clips` | `meta.org_settings.title` |
| 81 | 标题 | `Organization · Settings` | `nav.org_settings` |

### app/routes/_app.meetings._index.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 50 | meta title | `Meetings · Clips` | `meta.meetings.title` |

### app/routes/invite.$token.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 20 | meta title | `Join team · Clips` | `meta.invite.title` |
| 50 | 错误 | `Missing invite token.` | `invite.missing_token` |
| 61 | 错误 | `Invite not found or expired.` | `invite.not_found` |

### app/routes/share.meeting.$meetingId.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| (全文) | 多个字符串 | 会议信息展示相关文字 | `meeting.*` |

### app/routes/embed.$shareId.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 16 | meta title | `Clip` | `meta.embed.title` |

### app/routes/_app.notifications.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| (全文) | 多个字符串 | 通知相关文字 | `notifications.*` |

### app/routes/_app.insights._index.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| (全文) | 多个字符串 | 洞察相关文字 | `insights.*` |

### app/components/recorder/pre-record-panel.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| (全文) | 多个字符串 | 录制前选项面板相关文字 | `prerecord.*` |

### app/components/library/empty-state.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| (全文) | 多个字符串 | 空状态提示文字 | `empty.*` |

### app/components/player/share-dialog.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| (全文) | 多个字符串 | 分享弹窗相关文字 | `share_dialog.*` |

### app/components/player/transcript-panel.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| (全文) | 多个字符串 | 转录面板相关文字 | `transcript.*` |

### app/components/player/comments-panel.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| (全文) | 多个字符串 | 评论面板相关文字 | `comments.*` |

### app/components/player/insights-panel.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| (全文) | 多个字符串 | 洞察面板相关文字 | `insights.*` |

### app/components/player/settings-panel.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| (全文) | 多个字符串 | 设置面板相关文字 | `player.settings.*` |

### app/components/player/delete-recording-menu.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| (全文) | 多个字符串 | 删除菜单相关文字 | `recording.delete.*` |

### app/components/player/cta-button.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| (全文) | 多个字符串 | CTA按钮文字 | `recording.cta.*` |

### app/components/player/reactions-tray.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| (全文) | 多个字符串 | 反应面板文字 | `reactions.*` |

### app/components/layout/Header.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| (全文) | 多个字符串 | 导航相关文字 | `nav.*` |

### app/components/editor/editor-toolbar.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| (全文) | 多个字符串 | 编辑工具栏文字 | `editor.toolbar.*` |

### app/components/editor/transcript-editor.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| (全文) | 多个字符串 | 转录编辑文字 | `editor.transcript.*` |

### app/components/meetings/meeting-card.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| (全文) | 多个字符串 | 会议卡片文字 | `meeting.card.*` |

### app/components/meetings/auto-record-prompt.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| (全文) | 多个字符串 | 自动录制提示文字 | `meeting.auto_record.*` |

### app/components/workspace/invite-dialog.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| (全文) | 多个字符串 | 邀请对话框文字 | `workspace.invite.*` |

### app/components/workspace/members-list.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| (全文) | 多个字符串 | 成员列表文字 | `workspace.members.*` |

### app/components/workspace/notifications-list.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| (全文) | 多个字符串 | 通知列表文字 | `workspace.notifications.*` |

### app/components/workspace/insights-hub.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| (全文) | 多个字符串 | 洞察中心文字 | `workspace.insights.*` |

### app/components/workspace/branding-editor.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| (全文) | 多个字符串 | 品牌编辑文字 | `workspace.branding.*` |

### app/components/sharing/share-ui.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| (全文) | 多个字符串 | 分享UI文字 | `sharing.*` |

### app/components/recorder/storage-setup-card.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| (全文) | 多个字符串 | 存储设置文字 | `storage.setup.*` |

### app/components/library/search-bar.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| (全文) | 多个字符串 | 搜索栏文字 | `library.search.*` |

### app/components/library/sort-menu.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| (全文) | 多个字符串 | 排序菜单文字 | `library.sort.*` |

### app/components/library/filter-chips.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| (全文) | 多个字符串 | 筛选标签文字 | `library.filter.*` |

### app/components/library/create-space-dialog.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| (全文) | 多个字符串 | 创建空间对话框文字 | `library.create_space.*` |

### app/components/library/bulk-action-toolbar.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| (全文) | 多个字符串 | 批量操作栏文字 | `library.bulk.*` |

### app/components/library/recording-card.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| (全文) | 多个字符串 | 录制卡片文字 | `library.card.*` |

### app/components/library/page-header.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| (全文) | 多个字符串 | 页面标题文字 | `library.page_header.*` |

### app/components/library/organization-switcher.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| (全文) | 多个字符串 | 组织切换器文字 | `library.org_switcher.*` |

### app/components/library/folder-tree.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| (全文) | 多个字符串 | 文件夹树文字 | `library.folder_tree.*` |

### app/hooks/use-auto-title.tsx (如有)
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| (全文) | 多个字符串 | 自动标题相关文字 | `recording.auto_title.*` |

## 完成情况

### 已完成的工作
1. **基础设施检查 - 全部通过** ✅
   - `package.json` 已有 `"@agent-native/i18n": "workspace:*"` 依赖
   - `app/root.tsx` 已导入 `I18nProvider` 和 `useI18n`
   - 已有 `<I18nProvider>` 包裹应用根组件
   - 已有 `HtmlLangSync` 组件同步 `<html lang>`
   - 已有 `t('clips.*')` 调用示例

2. **翻译键添加** ✅
   - `packages/i18n/src/locales/zh-CN.ts` — 已添加完整 `clips.*` 命名空间翻译键（约 150+ 键，含中文翻译）
   - `packages/i18n/src/locales/en.ts` — 已添加完整 `clips.*` 命名空间翻译键（英文原文）

3. **翻译键覆盖范围**
   - meta/SEO 标题：`meta.record.title`, `meta.settings.title`, `meta.download.title`, `meta.trash.title`, `meta.archive.title`, `meta.dictate.title`, `meta.spaces.title`, `meta.org_settings.title`, `meta.meetings.title`, `meta.invite.title`, `meta.embed.title`, `meta.recording.title`, `meta.share.title`, `meta.notifications.title`, `meta.insights.title`, `meta.meeting.title`
   - SEO 描述：`seo.index.title`, `seo.index.description`, `seo.library.title`
   - 导航：`nav.library`, `nav.settings`, `nav.spaces`, `nav.meetings`, `nav.go_home`
   - 录制相关：`record.*`（20+ 键）
   - 错误消息：`error.*`（15+ 键）
   - Toast 通知：`toast.*`（20+ 键）
   - 设置页面：`settings.*`（15+ 键）
   - 分享页面：`share.*`（15+ 键）
   - 下载页面：`download.*`（10+ 键）
   - 邀请页面：`invite.*`（10+ 键）
   - 会议页面：`meetings.*` / `meeting.*`（25+ 键）
   - 通知页面：`notifications.*`（10+ 键）
   - 通用：`common.*`, `auth.*`, `brand.*`, `aria.*`, `status.*`, `tab.*`, `spaces.*`, `extensions.*`, `insights.*`

### 仍需要完成的工作
4. **路由文件字符串替换** ⏳ — 需要将以下文件的硬编码字符串替换为 `t('clips.*')` 调用：
   - `app/routes/record.tsx` — 已导入 `useI18n`，字符串未全部替换
   - `app/routes/_index.tsx` — SEO 标题硬编码
   - `app/routes/_app.library._index.tsx` — meta/Library 标题
   - `app/routes/_app.settings._index.tsx` — 设置页面所有文字
   - `app/routes/share.$shareId.tsx` — 分享页面所有文字
   - `app/routes/download.tsx` — 下载页面所有文字
   - `app/routes/r.$recordingId.tsx` — 录制详情页面
   - `app/routes/_app.trash.tsx`, `_app.archive.tsx`, `_app.dictate.tsx`, `_app.spaces._index.tsx`
   - `app/routes/_app.settings.organization.tsx`, `_app.meetings._index.tsx`
   - `app/routes/invite.$token.tsx`, `embed.$shareId.tsx`, `share.meeting.$meetingId.tsx`
   - `app/routes/_app.notifications.tsx`, `_app.insights._index.tsx`, `_app.extensions._index.tsx`
   - `app/routes/_app.tsx`, `_app.meetings.$meetingId.tsx`, `_app.library.folder.$folderId.tsx`
   - `app/routes/_app.spaces.$spaceId.tsx`, `_app.spaces.$spaceId.folder.$folderId.tsx`

5. **组件文件字符串替换** ⏳ — 以下组件文件仍有硬编码字符串：
   - `app/components/recorder/pre-record-panel.tsx`
   - `app/components/library/empty-state.tsx`
   - `app/components/player/share-dialog.tsx`
   - `app/components/player/transcript-panel.tsx`
   - `app/components/player/comments-panel.tsx`
   - `app/components/player/insights-panel.tsx`
   - `app/components/player/settings-panel.tsx`
   - `app/components/player/delete-recording-menu.tsx`
   - `app/components/player/cta-button.tsx`
   - `app/components/player/reactions-tray.tsx`
   - `app/components/layout/Header.tsx`
   - `app/components/editor/editor-toolbar.tsx`
   - `app/components/editor/transcript-editor.tsx`
   - `app/components/meetings/*.tsx`（多个文件）
   - `app/components/workspace/*.tsx`（多个文件）
   - `app/components/sharing/share-ui.tsx`
   - `app/components/recorder/storage-setup-card.tsx`
   - `app/components/library/*.tsx`（多个文件）