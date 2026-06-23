# i18n 检查报告 - slides

## 概览
- 检查文件数: 58 (.tsx, 排除 shadcn/ui 组件库文件和测试文件)
- 发现硬编码字符串数: 200+
- 严重程度: **高** — 完全未使用 `useI18n()` / `t()`

## i18n 支持状态
| 检查项 | 结果 |
|--------|------|
| `@agent-native/i18n` 在 package.json 中 | ❌ 未找到 |
| `I18nProvider` 在 app/root.tsx 中 | ❌ 未引入 |
| `useI18n` / `t()` 使用 | ❌ 未使用 |
| 任何 `t(` 函数调用 | ❌ 不存在 |

## 详细问题列表

### app/root.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 41 | 硬编码字符串 | BARE_ROUTES = new Set(["/slide"]) | - (路由常量, 无需翻译) |
| 166-167 | CommandMenu heading | "Presentations" | `command.presentations` |
| 167 | CommandMenu item | "Search decks" | `command.searchDecks` |
| 169 | CommandMenu heading | "Appearance" | `command.appearance` |
| 174-175 | 条件文本 | "Toggle light mode" / "Toggle dark mode" | `command.toggleTheme` |
| 115 | meta 标题 | "Slides" | `app.title` |

### app/pages/Index.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 85 | 默认值 | "new deck" | `index.newDeck` |
| 318 | 用户问题 | "How long should this deck be?" | `index.deckLengthQuestion` |
| 319 | 问题标题 | "Deck length" | `index.deckLength` |
| 321 | 选项 | "Short (3–5 slides)" | `index.deckLengthShort` |
| 324 | 选项 | "Medium (6–10 slides)" | `index.deckLengthMedium` |
| 327 | 选项 | "Long (11+ slides)" | `index.deckLengthLong` |
| 329 | 选项 | "Just one visual" | `index.deckLengthSingle` |
| 405 | Toast 标题 | "Couldn't start deck generation" | `index.deckGenFailed` |
| 406-408 | Toast 描述 | "The new deck did not finish saving..." | `index.deckGenFailedDesc` |
| 455 | 页面标题 | "Decks" | `pageTitle.decks` |
| 462-463 | 按钮文字 | "New Deck" | `deck.new` |
| 506 | aria-label | "Show all decks" | `index.showAll` |
| 510 | 切换按钮 | "All" | `index.all` |
| 514 | aria-label | "Show decks created by me" | `index.showMine` |
| 518 | 切换按钮 | "Mine" | `index.mine` |
| 544 | 卡片标题 | "New Deck" | `deck.new` |
| 548 | 卡片描述 | "Create a deck or visual" | `index.createDeckOrVisual` |
| 569-571 | 空状态 | "No decks created by you yet." | `index.noDecksCreated` |
| 584 | Dialog 标题 | "Delete Deck?" | `index.deleteDeck` |
| 585-588 | Dialog 描述 | "This will permanently delete this deck and all its slides. This action cannot be undone." | `index.deleteDeckConfirm` |
| 591 | 取消按钮 | "Cancel" | `common.cancel` |
| 596 | 删除按钮 | "Delete" | `common.delete` |
| 605 | Popover 标题 | "New deck" | `deck.new` |
| 606 | placeholder | "Describe your deck, visual, or diagram..." | `index.describeDeck` |
| 608 | 跳过按钮 | "Skip prompt" | `index.skipPrompt` |
| 624 | 标签 | "Design system" | `index.designSystem` |
| 631 | placeholder | "Choose a design system" | `index.chooseDesignSystem` |
| 634 | 选项 | "None" | `index.none` |
| 638 | 默认标记 | " (Default)" | `index.default` |
| 653 | Dialog 标题 | "Sign in to create a deck" | `index.signInToCreate` |
| 655-657 | Dialog 描述 | "You need to sign in before generating a deck..." | `index.signInRequired` |
| 661 | 取消 | "Cancel" | `common.cancel` |
| 670 | 按钮 | "Sign in" | `common.signIn` |
| 689-691 | 空状态标题 | "Create your first deck or visual" | `index.emptyStateTitle` |
| 693-695 | 空状态描述 | "Build beautiful presentations..." | `index.emptyStateDesc` |
| 701 | 按钮 | "New Deck" | `deck.new` |

### app/pages/DeckEditor.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 98 | 加载标题 | "Looking for this deck" | `editor.lookingForDeck` |
| 100 | 错误标题 | "Couldn't check team access" | `editor.cantCheckAccess` |
| 102 | 加入提示 | "Join your team to open this deck" | `editor.joinTeamToOpen` |
| 103 | 不可用 | "Deck unavailable" | `editor.deckUnavailable` |
| 104-107 | 描述文本 | 多个 loading/error 描述 | `editor.*` |
| 110 | 描述 | "This link points to a team presentation..." | `editor.joinTeamDesc` |
| 111 | 描述 | "This deck may have been removed..." | `editor.deckRemoved` |
| 123 | 标签 | "Deck ID:" | `editor.deckId` |
| 131-132 | 按钮 | "Back to Decks" | `editor.backToDecks` |
| 141-142 | 按钮 | "Try again" | `editor.tryAgain` |
| 253 | 提交消息 | "Here are my answers — go ahead and create the slides." | `editor.submitAnswers` |
| 255 | 跳过消息 | "Skip the questions..." | `editor.skipQuestions` |
| 391 | Toast 标题 | "Image added" | `editor.imageAdded` |
| 396 | Toast 标题 | "Image upload failed" | `editor.imageUploadFailed` |
| 400 | 错误消息 | "Something went wrong uploading this image." | `editor.imageUploadError` |
| 477-478 | Toast 标题 | "{slideTitle} deleted" / "Press Cmd+Z or click Undo to restore." | `editor.slideDeleted` |
| 488 | 按钮 | "Undo" | `editor.undo` |
| 823 | Toast 标题 | "Export failed" / "Deck has no slides." | `editor.exportFailed` |
| 925 | 生成提示 | "Building deck" | `editor.buildingDeck` |
| 927 | 计数 | "{n} slide(s) added" | `editor.slidesAdded` |

### app/pages/NotFound.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 19 | 提示文本 | "This page doesn't exist yet." | `notFound.message` |
| 26 | 链接文字 | "Back to Decks" | `notFound.backToDecks` |

### app/pages/DesignSystems.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 52 | 页面标题 | "Design Systems" | `pageTitle.designSystems` |
| 66 | 按钮 | "New Design System" | `designSystem.new` |
| 122 | 卡片标题 | "New Design System" | `designSystem.new` |
| 125 | 卡片描述 | "Set up your brand" | `designSystem.setupBrand` |
| 169-170 | 空状态标题 | "Set up your brand identity" | `designSystem.emptyTitle` |
| 172-175 | 空状态描述 | "Create a design system with your brand colors..." | `designSystem.emptyDesc` |
| 178 | 按钮 | "New Design System" | `designSystem.new` |

### app/pages/SharedPresentation.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 67-68 | 错误标题 | "Presentation Not Found" | `shared.notFound` |
| 70 | 错误描述 | "This shared presentation doesn't exist or has expired." | `shared.expired` |

### app/components/editor/ExportMenu.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 98 | Toast | "Something went wrong exporting as PPTX." | `export.pptxError` |
| 109-111 | Toast | "Downloaded for Google Slides" / "Open Google Slides..." | `export.googleSlides` |
| 121 | Toast | "Something went wrong exporting to Google Slides." | `export.googleSlidesError` |
| 151 | Toast | "Something went wrong exporting as HTML." | `export.htmlError` |
| 162 | 按钮 | "Export" | `export.export` |
| 167 | 菜单标签 | "Export & Duplicate" | `export.exportAndDuplicate` |
| 171 | 菜单项 | "Share with team..." | `export.shareWithTeam` |
| 177 | 菜单项 | "Public share link..." | `export.publicShareLink` |
| 184 | 菜单项 | "Download as HTML" | `export.downloadHtml` |
| 188 | 菜单项 | "Export as PDF" | `export.exportPdf` |
| 192 | 菜单项 | "Export as PPTX" | `export.exportPptx` |
| 198 | 菜单项 | "Download for Google Slides" | `export.downloadGoogleSlides` |
| 204 | 菜单项 | "Duplicate deck" | `export.duplicateDeck` |

### app/components/editor/ShareDialog.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 90 | 标题 | "Share Presentation" | `share.presentation` |
| 91 | 描述 | "To share presentations publicly, connect a cloud database..." | `share.cloudRequired` |
| 101 | 面板标题 | "Share Presentation" | `share.presentation` |
| 104-106 | 描述 | "Create a shareable link...Only this presentation will be accessible..." | `share.linkDescription` |
| 114 | 小节标题 | "What gets shared:" | `share.whatGetsShared` |
| 119 | 项目 | "- Slide content and layouts ({n} slides)" | `share.slideContent` |
| 122 | 项目 | "- Presentation view (fullscreen)" | `share.presentationView` |
| 124 | 小节标题 | "What stays private:" | `share.whatStaysPrivate` |
| 128 | 项目 | "- Speaker notes" | `share.speakerNotes` |
| 129 | 项目 | "- Other presentations" | `share.otherDecks` |
| 130 | 项目 | "- Editing access" | `share.editingAccess` |
| 148 | 加载中 | "Creating link..." | `share.creatingLink` |
| 153 | 按钮 | "Create Share Link" | `share.createLink` |
| 170 | aria-label | "Copy link" | `share.copyLink` |
| 180 | Tooltip | "Copy link" | `share.copyLink` |
| 191 | 链接文字 | "Open shared link" | `share.openLink` |
| 195 | 提示 | "Anyone with this link can view this presentation." | `share.anyoneCanView` |

### app/components/editor/GenerateSlidesDialog.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 88 | Dialog 标题 | "Generate Slides with AI" | `generate.title` |
| 90-92 | Dialog 描述 | "Describe your presentation topic and AI will generate slides for you." | `generate.description` |
| 100 | 标签 | "Topic" | `generate.topic` |
| 105 | placeholder | "e.g. Introduction to React Hooks..." | `generate.topicPlaceholder` |
| 114 | 标签 | "Slides" | `generate.slides` |
| 126 | 选项 | "{n} slides" | `generate.nSlides` |
| 134 | 标签 | "Style (optional)" | `generate.style` |
| 139 | placeholder | "e.g. minimal, corporate..." | `generate.stylePlaceholder` |
| 162 | 标签 | "Generate images" | `generate.generateImages` |
| 165 | 描述 | "AI will generate images for visual slides using Gemini" | `generate.imagesDescription` |
| 174 | 标签 | "Reference Images (optional, for brand consistency)" | `generate.referenceImages` |
| 212 | 提示 | "Upload images to match their visual style..." | `generate.uploadHint` |
| 232 | 加载中 | "Generating slides..." | `generate.generating` |
| 235 | 按钮 | "Generate Slides" | `generate.generate` |

### app/components/editor/PromptDialog.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 39 | placeholder 默认值 | "Describe what you want..." | `prompt.placeholder` |
| 41 | 跳过标签默认值 | "Skip prompt" | `prompt.skip` |
| 156 | Toast 标题 | "Upload failed" | `prompt.uploadFailed` |
| 158 | Toast 描述 | "Could not upload the attached file." | `prompt.uploadFailedDesc` |

### app/components/editor/EditorToolbar.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 139-147 | 布局选项 | "Title", "Section Divider", "Content", "Two Column", "Image", "Statement", "Full Image", "Blank" | `editor.layout.*` |
| 369 | aria-label | "Back to decks" | `editor.backToDecks` |
| 375 | Tooltip | "Back to decks" | `editor.backToDecks` |
| 388 | aria-label | "Toggle slide list" | `editor.toggleSlideList` |
| 392 | Tooltip | "Toggle slide list" | `editor.toggleSlideList` |
| 414 | Tooltip | 设计系统相关文案 | `editor.usingDesignSystem` |
| 431 | 只读徽章 | "View only" | `editor.viewOnly` |
| 454 | aria-label | "Slide settings" | `editor.slideSettings` |
| 457 | Tooltip | "Slide settings" | `editor.slideSettings` |
| 467 | 小节 | "Layout" | `editor.layout` |
| 488 | 小节 | "Background" | `editor.background` |
| 511 | 小节 | "Media" | `editor.media` |
| 521 | 按钮 | "Generate Image" | `editor.generateImage` |
| 532 | 按钮 | "Asset Library" | `editor.assetLibrary` |
| 539 | 小节 | "Diagrams" | `editor.diagrams` |
| 563 | 按钮 | "Insert Mermaid Diagram" | `editor.insertMermaid` |
| 580 | 按钮 | "Excalidraw Canvas" | `editor.excalidraw` |
| 605 | 按钮 | "Convert Mermaid → Excalidraw" | `editor.convertMermaid` |
| 618 | 按钮 | "Remove Excalidraw Canvas" | `editor.removeExcalidraw` |
| 626 | 小节 | "Transition" | `editor.transition` |
| 658 | 小节 | "Aspect Ratio" | `editor.aspectRatio` |
| 712 | aria-label | "Slide tools" | `editor.slideTools` |
| 718 | Tooltip | "Slide tools" | `editor.slideTools` |
| 740 | 按钮 | "Element animations" | `editor.elementAnimations` |
| 756 | 按钮 | "Tweaks" | `editor.tweaks` |
| 773 | 按钮 | "Draw on slide" | `editor.drawOnSlide` |
| 791 | 按钮 | "Pin comments" | `editor.pinComments` |
| 819 | aria-label | "Undo" | `editor.undo` |
| 823 | Tooltip | "Undo (Cmd+Z)" | `editor.undo` |
| 831 | aria-label | "Redo" | `editor.redo` |
| 855 | 按钮 | "Preview" | `editor.preview` |
| 865 | 按钮 | "Code" | `editor.code` |
| 893 | aria-label | "Comments" | `editor.comments` |
| 901 | Tooltip | "Comments" | `editor.comments` |
| 935 | 按钮 | "Present" | `editor.present` |
| 957 | aria-label | "More" | `editor.more` |
| 973 | 菜单项 | "Import file" / "Importing..." | `editor.importFile` |
| 978 | 菜单项 | "Saved versions" | `editor.savedVersions` |
| 986-987 | 菜单项 | "Light theme" / "Dark theme" | `editor.lightTheme` / `editor.darkTheme` |

### app/components/editor/HistoryPanel.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 130 | 按钮 | "Back to saved versions" | `history.backToVersions` |
| 135 | 面板标题 | "Saved versions" | `history.savedVersions` |
| 140 | sr-only 描述 | "Browse saved deck versions and restore a previous snapshot." | `history.description` |
| 157 | 默认标题 | "Untitled" | `common.untitled` |
| 161 | 时间戳标签 | "Snapshot unavailable" | `history.snapshotUnavailable` |
| 196 | 空状态 | "No slides in this snapshot." | `history.noSlides` |
| 215 | 按钮 | "Restore this version" | `history.restore` |
| 244 | 标题 | "Untitled" | `common.untitled` |
| 271 | 空状态标题 | "No saved versions yet" | `history.noVersions` |
| 273 | 空状态描述 | "Versions are saved automatically before future deck edits." | `history.noVersionsDesc` |

### app/components/editor/ImageSearchPanel.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 99 | 标题 | "Search Images" | `imageSearch.title` |
| 103 | aria-label | "Close" | `common.close` |
| 121 | placeholder | "Search for images..." | `imageSearch.placeholder` |
| 133 | 按钮 | "Search" | `common.search` |
| 147 | 空状态 | "Search for logos, images, icons..." | `imageSearch.emptyHint` |

### app/components/layout/Header.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 8 | 页面标题映射 | "Decks" | `pageTitle.decks` |
| 8 | | "Design Systems" | `pageTitle.designSystems` |
| 8 | | "Team" | `pageTitle.team` |
| 8 | | "Settings" | `pageTitle.settings` |
| 8 | | "Extensions" | `pageTitle.extensions` |
| 20 | 回退标题 | "Deck" | `common.deck` |
| 39 | 回退标题 | "Tool" | `common.tool` |
| 45 | 回退标题 | "Slides" | `app.title` |

### app/components/layout/Sidebar.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 24 | 导航项 | "Decks" | `nav.decks` |
| 25 | | "Design Systems" | `nav.designSystems` |
| 26 | | "Team" | `nav.team` |
| 53 | aria-label | "Expand sidebar" | `sidebar.expand` |
| 58 | Tooltip | "Expand sidebar" | `sidebar.expand` |
| 106 | 应用名 | "Slides" | `app.title` |
| 114 | aria-label | "Collapse sidebar" | `sidebar.collapse` |
| 119 | Tooltip | "Collapse sidebar" | `sidebar.collapse` |

### app/components/CloudUpgrade.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 28-84 | 提供商标识 | "Turso", "Neon", "Supabase", "Cloudflare D1" + 描述 | `cloud.providers.*` |
| 35-38 | Turso 步骤 | 安装 CLI/Sign up/Create DB/Copy URL/Create token | `cloud.turso.steps.*` |
| 49-53 | Neon 步骤 |  | `cloud.neon.steps.*` |
| 62-67 | Supabase 步骤 |  | `cloud.supabase.steps.*` |
| 76-82 | D1 步骤 |  | `cloud.d1.steps.*` |
| 88-89 | 默认标题/描述 | "Share Publicly" / "To share content publicly..." | `cloud.title` / `cloud.description` |
| 108 | 错误消息 | "Database URL is required" | `cloud.urlRequired` |
| 181 | 标题 | `{title}` (动态) | - |
| 195-196 | 描述 | `{description}` (动态) | - |
| 231 | 标签 | "Setup steps" | `cloud.setupSteps` |
| 251 | 标签 | "DATABASE_URL" | `cloud.databaseUrl` |
| 271 | 标签 | "DATABASE_AUTH_TOKEN" | `cloud.authToken` |
| 273 | 标签 | "(optional)" | `common.optional` |
| 278 | placeholder | "Auth token" | `cloud.authTokenPlaceholder` |
| 297 | 成功消息 | "Connected successfully. Reloading..." | `cloud.connected` |
| 314 | 保存中 | "Saving credentials..." | `cloud.saving` |
| 315 | 测试中 | "Testing connection..." | `cloud.testing` |
| 321 | 按钮 | "Test & Connect" | `cloud.testAndConnect` |
| 156 | 超时错误 | "Database connection failed after 30 attempts..." | `cloud.connectionFailed` |

### app/components/presentation/PresentationView.tsx (部分)
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| - | 各种 UI 文本 | (需进一步扫描) | - |

### app/components/deck/DeckCard.tsx (部分)
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| - | 各种 UI 文本 | (需进一步扫描) | - |

### app/components/editor/ImageGenPanel.tsx (部分)
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| - | 各种 UI 文本 | (需进一步扫描) | - |

### app/components/editor/SpeakerNotesPanel.tsx (部分)
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| - | 各种 UI 文本 | (需进一步扫描) | - |

### app/components/editor/QuestionFlow.tsx (部分)
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| - | 各种 UI 文本 | (需进一步扫描) | - |

### app/routes/team.tsx (部分)
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| - | 各种 UI 文本 | (需进一步扫描) | - |

## 总结
- **slides 模板完全没有 i18n 支持**。`package.json` 中没有 `@agent-native/i18n` 依赖，`root.tsx` 中没有 `I18nProvider`/`useI18n` 引入，所有 58 个 .tsx 文件中没有任何 `t()` 函数调用。
- 所有用户可见的文本全部为硬编码的英文字符串，包括页面标题、导航菜单、按钮文字、弹窗提示、工具提示、Toast 通知等。
- 初步估算至少有 **200+ 处**需要国际化的字符串。
- 实施 i18n 需要：添加 `@agent-native/i18n` 依赖 → 在 `root.tsx` 中用 `I18nProvider` 包裹 → 在所有组件中引入 `useI18n` 并用 `t()` 替换硬编码字符串。

## 完成情况

### 已完成工作

1. **package.json**: `@agent-native/i18n` 依赖已存在（`"workspace:*"`）
2. **app/root.tsx**: 已导入 `I18nProvider` + `useI18n`，用 `<I18nProvider>` 包裹，同步 `<html lang>`（`HtmlLangSync` 组件），更新了 `apple-mobile-web-app-title` 使用翻译键
3. **翻译键添加**: 在 `en.ts` 和 `zh-CN.ts` 中添加了完整的 `slides.*` 命名空间的翻译键（~200 个键，含中英文）
4. **源文件修改**（添加 `useI18n` / `t()` 并替换硬编码字符串）：
   - `app/root.tsx` - 已完成
   - `app/pages/Index.tsx` - 已完成
   - `app/pages/DeckEditor.tsx` - 已完成（含 `MissingDeckAccessPane`）
   - `app/pages/NotFound.tsx` - 已完成
   - `app/pages/DesignSystems.tsx` - 已完成
   - `app/pages/SharedPresentation.tsx` - 已完成
   - `app/components/layout/Header.tsx` - 已完成
   - `app/components/layout/Sidebar.tsx` - 已完成
   - `app/components/editor/ExportMenu.tsx` - 已完成
   - `app/components/editor/ShareDialog.tsx` - 已完成
   - `app/components/editor/GenerateSlidesDialog.tsx` - 已完成
   - `app/components/editor/PromptDialog.tsx` - 已完成
   - `app/components/editor/EditorToolbar.tsx` - 已完成
   - `app/components/editor/HistoryPanel.tsx` - 已完成
   - `app/components/editor/ImageSearchPanel.tsx` - 已完成
   - `app/components/CloudUpgrade.tsx` - 已完成
5. **文档更新**: 本文件已更新完成情况

### 翻译键覆盖范围
- 命令菜单、导航、页面标题
- 首页（deck 列表、创建、删除、筛选、空状态）
- 编辑器（缺失权限面板、图片上传/替换、幻灯片删除、导出）
- 编辑器工具栏（布局、背景、媒体、图表、过渡、宽高比、撤销/重做、工具面板）
- 导出菜单（PPTX、PDF、HTML、Google Slides、复制）
- 分享对话框
- AI 生成幻灯片对话框
- 历史面板（版本管理）
- 图片搜索面板
- CloudUpgrade（云数据库连接）
- 404 页面
- 共享演示文稿页面
- 设计系统页面