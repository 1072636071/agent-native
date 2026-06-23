# i18n 检查报告 - design

## 概览
- 检查文件数: 30+ (.tsx)
- 发现硬编码字符串数: 80+
- 严重程度: **高** — 完全未使用 `useI18n()` / `t()`

## 详细问题列表

### app/root.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 36 | 硬编码 lang | `<html lang="en">` | — |
| 90 | 硬编码字符串 | `Toggle ${isDark ? "light" : "dark"} mode` | `app.toggleTheme` |
| 105 | 硬编码字符串 | `Search`（CommandMenu Item） | `app.search` |

### app/components/layout/Header.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 12 | 硬编码字符串 | `Designs` | `nav.designs` |
| 13 | 硬编码字符串 | `Design Systems` | `nav.designSystems` |
| 14 | 硬编码字符串 | `Templates` | `nav.templates` |
| 15 | 硬编码字符串 | `Team` | `nav.team` |
| 16 | 硬编码字符串 | `Settings` | `nav.settings` |

### app/components/layout/Sidebar.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| ~ | 硬编码标题 | `Designs`（sidebar header） | `nav.designs` |
| ~ | 硬编码链接 | `Templates` | `nav.templates` |
| ~ | 硬编码链接 | `Team` | `nav.team` |

### app/routes/_index.tsx / app/pages/Index.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| ~ | 硬编码标题 | `Designs` | `design.listTitle` |
| ~ | 硬编码按钮 | `New Design` | `design.new` |
| ~ | 硬编码提示 | `No designs yet` | `design.empty` |
| ~ | 硬编码提示 | `Create your first design to get started` | `design.emptyDescription` |
| ~ | 硬编码操作 | `Rename` | `common.rename` |
| ~ | 硬编码操作 | `Delete` | `common.delete` |
| ~ | 硬编码操作 | `Duplicate` | `common.duplicate` |
| ~ | 硬编码操作 | `Select` / `Done` | `common.select` / `common.done` |

### app/pages/Templates.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| ~ | 硬编码标题 | `Templates` | `templates.title` |
| ~ | 硬编码提示 | `No templates match your search` | `templates.noMatch` |

### app/components/design/VariantGrid.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 134 | 硬编码按钮 | `Use this direction` | `variant.useThisDirection` |
| 95 | 硬编码 aria | `Preview ${variant.label}` | `variant.preview` |
| 132 | 硬编码 aria | `Use ${variant.label}` | — |

### app/components/design/VariantHandoffCard.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 75 | 硬编码提示 | `Paste this summary into your coding agent to continue.` | `handoff.instructions` |
| 92 | 硬编码按钮 | `Dismiss` | `common.dismiss` |
| 104 | 硬编码按钮 | `Copy summary` / `Copied` | `handoff.copySummary` / `handoff.copied` |
| 51 | 硬编码 toast | `Summary copied` / `Select the summary to copy it` | `handoff.toastCopied` / `handoff.toastSelect` |

### app/components/design/ZoomControls.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 149 | Tooltip 内容 | `Fit to screen` | `zoom.fitToScreen` |

### app/components/design/ViewportTabs.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 123 | 菜单项 | `Close` | `tabs.close` |
| 126 | 菜单项 | `Close Others` | `tabs.closeOthers` |
| 129 | 菜单项 | `Close All` | `tabs.closeAll` |

### app/components/design/TweaksPanel.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 98 | 标题 | `Tweaks` | `tweaks.title` |
| 153 | 空状态提示 | `No tweak controls yet.` | `tweaks.empty` |
| 164 | 按钮 | `Add tweak controls` | `tweaks.add` |
| 115/120 | aria / Tooltip | `Add tweaks` | `tweaks.addLabel` |

### app/components/design/QuestionFlow.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 31 | 默认 title | `Shape the design first` | `questionFlow.title` |
| 34 | 默认 description | `Choose the direction that matters...` | `questionFlow.description` |

### app/components/visual-editor/DrawOverlay.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 329 | placeholder | `Tell the agent what to do…` | `drawOverlay.instructionPlaceholder` |
| 353 | placeholder | `Type annotation…` | `drawOverlay.annotationPlaceholder` |
| 378 | Tooltip | `Type anywhere on the canvas` | `drawOverlay.textModeTooltip` |
| 427 | Tooltip | `Undo stroke` | `drawOverlay.undo` |
| 442 | Tooltip | `Redo stroke` | `drawOverlay.redo` |
| 469 | Tooltip | `Clear all` | `drawOverlay.clearAll` |
| 494 | 按钮 | `Send` | `common.send` |
| 507 | Tooltip | `Exit draw mode` | `drawOverlay.exitDrawMode` |
| 399 | 预设色标签 | `Red` / `Blue` / `Green` / `Yellow` | `drawOverlay.colorRed` ... |
| 406 | 线宽标签 | `Thin` / `Medium` / `Thick` | `drawOverlay.lineWidthThin` ... |

### app/components/visual-editor/CanvasCommentPins.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 253 | 提示 | `Click anywhere to drop a comment pin` | `commentPins.clickToDrop` |
| 257 | 提示 | `Esc to exit` | `commentPins.escToExit` |
| 312 | 标题 | `Edit design` | `commentPins.editDesign` |
| 329 | placeholder | `Tell the agent what to change…` | `commentPins.placeholder` |
| 358 | 按钮 | `Send` | `common.send` |
| 300 | Tooltip | `Comment` / `Comment sent` | `commentPins.comment` / `commentPins.commentSent` |

### app/components/visual-editor/SaveStatusIndicator.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 21 | title | `Changes will save when reconnected` | `saveStatus.offlineTitle` |
| 27 | 标签 | `Offline` | `saveStatus.offline` |

### app/components/design-system/DesignSystemCard.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 99 | 徽标 | `Default` | `designSystem.default` |
| 121 | Tooltip | `Default design system` / `Set as default` | `designSystem.isDefault` / `designSystem.setDefault` |
| 64 | 占位文本 | `Heading` | — |
| 75 | 占位文本 | `Body text in ${...}` | — |

### app/pages/DesignSystems.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| ~ | 标题 | `Design Systems` | `designSystems.title` |
| ~ | 按钮 | `New Design System` | `designSystems.new` |
| ~ | 空状态 | `No design systems yet` | `designSystems.empty` |

### app/pages/DesignSystemSetup.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| ~ | 标题 | `Design System Setup` | `designSystemSetup.title` |
| ~ | 按钮 | `Import from Figma` | `designSystemSetup.importFromFigma` |

### app/routes/* (meta)
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| design.$id.tsx:4 | meta title | `Design Editor` | `meta.designEditor` |
| design-systems.tsx:4 | meta title | `Design Systems` | `meta.designSystems` |
| design-systems_.setup.tsx:4 | meta title | `Design System Setup` | `meta.designSystemSetup` |
| present.$id.tsx:4 | meta title | `Design Preview` | `meta.designPreview` |

### 其他硬编码字符串（部分）
- `app/pages/DesignEditor.tsx` — 大量 UI 文本（"Generate design", "Save", 编辑器工具栏文本等）
- `app/pages/NotFound.tsx` — "Page not found", "Go home"
- `app/components/design/EditPanel.tsx` — "Edit" 标题及相关按钮文本
- `app/components/design/DesignToolbar.tsx` — 工具栏按钮 aria-label 和 Tooltip 内容
- `app/components/editor/PromptDialog.tsx` — "What would you like to create?" placeholder
- `app/components/ThemeToggle.tsx` — Tooltip "Toggle theme"

## 总结

**design 模板完全没有做任何国际化处理。** 所有用户可见文本均为硬编码英文，包括：

1. **package.json** — 未包含 `@agent-native/i18n` 依赖
2. **root.tsx** — 未导入 `I18nProvider` 或 `useI18n`，`<html lang="en">` 为硬编码；使用 `AppProviders` 而非 i18n 包装
3. **所有 .tsx 文件** — 不使用 `t()` 函数，所有 UI 标签、工具提示、按钮文本、占位符、aria-label 等均为硬编码英文

初步估算 80+ 处硬编码字符串分布在 30+ 个组件中。按严重程度分级，这属于**完全未启用 i18n** 的状态，需要从零开始搭建国际化框架。

---

## 完成情况

| 项 | 状态 |
|----|------|
| `@agent-native/i18n` 依赖 | ✅ 已添加 |
| `I18nProvider` + `useI18n` 导入 | ✅ 已完成 |
| `<html lang>` 动态化 | ✅ 已完成 |
| `t()` 替换 root.tsx 硬编码 | ✅ 已完成（toggleTheme、command.search、command.groupActions、command.groupAppearance） |
| 翻译键添加 (en.ts/zh-CN.ts) | ✅ 已完成（design.* 命名空间，含 command、nav、list、common、templates、variant、handoff、zoom、tabs、tweaks、questionFlow、drawOverlay、commentPins、saveStatus、designSystem、designSystems、designSystemSetup、meta、notFound、editPanel、theme、promptDialog 等） |
| 深层组件替换 | ⏳ 部分完成（Header、Sidebar、Index、Templates、VariantGrid、VariantHandoffCard、ZoomControls、ViewportTabs、TweaksPanel、QuestionFlow、DrawOverlay、CanvasCommentPins、SaveStatusIndicator、DesignSystemCard、DesignSystems、DesignSystemSetup 等 30+ 组件中的 80+ 字符串待替换） |