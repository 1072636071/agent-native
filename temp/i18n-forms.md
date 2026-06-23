# i18n 检查报告 - forms

## 概览
- 检查文件数: 25+ (.tsx)
- 发现硬编码字符串数: 90+
- 严重程度: **高** — 完全未使用 `useI18n()` / `t()`

## 详细问题列表

### app/root.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 48 | 硬编码 lang | `<html lang="en">` | — |
| 186 | 硬编码字符串 | `Toggle theme`（CommandMenu Item） | `app.toggleTheme` |
| 203 | 硬编码字符串 | `Search forms`（CommandMenu Item） | `app.searchForms` |

### app/routes/_app.forms._index.tsx (meta)
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 9 | meta title | `Agent-Native Forms - Open Source AI form builder and response analytics` | `meta.formsTitle` |
| 13 | meta description | `Open Source AI form builder for creating, publishing, editing...` | `meta.formsDescription` |

### app/components/layout/Sidebar.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 111 | 按钮 | `New form` | `form.new` |
| 124 | 弹窗标题 | `New form` | `form.new` |
| 135 | placeholder | `Describe your form...` | `form.describePlaceholder` |
| 149 | 链接 | `Skip prompt` | `form.skipPrompt` |
| 200 | 品牌名 | `Forms` | `app.brand` |
| 238 | 导航 | `Ask Forms` | `nav.askForms` |
| 279 | 默认标题 | `Untitled Form` | `form.untitled` |
| 305 | 导航 | `Team` | `nav.team` |
| 270 | 默认标题 | `Untitled Form` | `form.untitled` |

### app/pages/FormsListPage.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 103 | 默认标题 | `Untitled Form` | `form.untitled` |
| 117 | 按钮 | `New Form` / `New` | `form.new` |
| 107 | 页面标题 | `Forms` | `nav.forms` |
| 140 | toast | `Form duplicated` | `form.toastDuplicated` |
| 146 | toast | `Failed to duplicate form` | `form.toastDuplicateFailed` |
| 154 | toast | `Form moved to Archive` | `form.toastMovedToArchive` |
| 164 | toast | `Form restored` | `form.toastRestored` |
| 177 | toast | `Form permanently deleted` | `form.toastPermanentlyDeleted` |
| 290 | 提示 | `Sign in to see your forms.` | `form.signInPrompt` |
| 302 | 按钮 | `Sign in` | `common.signIn` |
| 309 | 错误提示 | `Couldn't load forms` | `form.loadError` |
| 321 | 按钮 | `Retry` | `common.retry` |
| 341 | Tab | `Forms` | `nav.forms` |
| 345 | Tab | `Archive` | `nav.archive` |
| 363 | 按钮 | `Done` / `Select` | `common.done` / `common.select` |
| 371 | 提示 | `{n} selected` | `common.nSelected` |
| 380 | 按钮 | `Clear all` / `Select all` | `common.clearAll` / `common.selectAll` |
| 392 | 按钮 | `Delete forever` / `Move to Archive` | `form.deleteForever` / `form.moveToArchive` |
| 410 | 空状态标题 | `Archive is empty` | `form.archiveEmpty` |
| 412 | 空状态描述 | `Deleted forms appear here...` | `form.archiveEmptyDescription` |
| 418 | 空状态标题 | `No forms yet` | `form.listEmpty` |
| 419 | 空状态描述 | `Create your first form to get started` | `form.listEmptyDescription` |
| 424 | 按钮 | `Create Form` | `form.create` |
| 529 | 菜单 | `View Responses` | `form.viewResponses` |
| 538 | 菜单 | `Restore` | `form.restore` |
| 549 | 菜单 | `Delete forever` | `form.deleteForever` |
| 578 | 菜单 | `Open` | `common.open` |
| 592 | 菜单 | `View Responses` | `form.viewResponses` |
| 601 | 菜单 | `Unpublish` / `Publish` | `form.unpublish` / `form.publish` |
| 610 | 菜单 | `Duplicate` | `common.duplicate` |
| 621 | 菜单 | `Delete` | `common.delete` |
| 644 | 标签 | `{n} responses` | `form.nResponses` |
| 667 | 对话框标题 | `Permanently delete this form?` | `form.deleteConfirmTitle` |
| 669 | 对话框描述 | `The form and all its responses will be deleted forever...` | `form.deleteConfirmDescription` |
| 674 | 按钮 | `Cancel` | `common.cancel` |
| 679 | 按钮 | `Delete forever` | `form.deleteForever` |
| 712 | Cloud 升级 | `Publish Form` | `form.publishForm` |
| 715 | Cloud 升级 | `To publish forms publicly...` | `form.cloudUpgradeDescription` |

### app/pages/FormBuilderPage.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 89 | 默认标签 | `Text Field`、`Email`、`Number` ... | `fieldTypeDefaults.*` |
| 93 | 默认 placeholder | `Enter text...`、`you@example.com` ... | `fieldTypeDefaults.*` |
| 169 | 过期消息 | `Form edit is taking longer than expected...` | `form.staleAgentMessage` |
| 367 | 错误 | `You don't have access to this form...` | `form.accessError` |
| 369 | 错误 | `Failed to load form` | `form.loadError` |
| 377 | 按钮 | `Back to Forms` | `form.backToForms` |
| 381 | 按钮 | `Retry` | `common.retry` |
| 402 | 默认标签 | `New Field` | `fieldTypeDefaults.newField` |
| 481 | toast | `Form published!` / `Form unpublished` | `form.toastPublished` / `form.toastUnpublished` |
| 495 | toast | `Form moved to Archive` | `form.toastMovedToArchive` |
| 504 | toast | `Publish this form before copying its public link` | `form.publishBeforeShare` |
| 515 | toast | `Link copied to clipboard` | `form.linkCopied` |
| 569 | Tooltip | `Preview published form` | `form.previewPublished` |
| 597 | Tooltip | `Public link copied` / `Copy published public link` / `Publish before copying...` | `form.copyLinkTooltip` |
| 638 | Tooltip | `Manage builder access` | `form.manageBuilderAccess` |
| 655 | 按钮 | `Publish` / `Publishing…` / `Unpublishing…` | `form.publish` / `form.publishing` / `form.unpublishing` |
| 673 | Tooltip | `More actions` | `common.moreActions` |
| 685 | 菜单 | `Unpublish` | `form.unpublish` |
| 691 | 菜单 | `Move to Archive` | `form.moveToArchive` |
| 711 | Tab | `Edit` / `Preview` | `form.edit` / `form.preview` |
| 716 | Tab | `Results` | `form.results` |
| 727 | Tab | `Settings` | `form.settings` |
| 730 | Tab | `Integrations` | `form.integrations` |
| 897 | placeholder | `Form Title` | `form.titlePlaceholder` |
| 907 | placeholder | `Add a description...` | `form.descriptionPlaceholder` |
| 996 | 按钮 | `Add Field` | `field.add` |
| 1036 | 标题 | `Edit form` | `form.editForm` |
| 1047 | placeholder | `Add missing fields, change the layout...` | `form.agentPromptPlaceholder` |
| 1225 | 空状态 | `No responses yet` | `response.empty` |
| 1226 | 空状态描述 | `Share your form to start collecting responses` | `response.emptyDescription` |
| 1236 | 标签 | `{n} response{s}` | `response.nResponses` |
| 1249 | placeholder | `Search responses…` | `response.searchPlaceholder` |
| 1262 | 按钮 | `Export CSV` | `response.exportCSV` |
| 1282 | 表头 | `Submitted` | `response.submitted` |
| 1311 | 空搜索结果 | `No responses match your search.` | `response.noMatch` |
| 1312 | 空搜索 | `No responses match your search.` | `response.searchNoMatch` |

### app/pages/FormFillPage.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 213 | 标题 | `Form not found` | `formFill.notFound` |
| 215 | 提示 | `This form may have been removed...` | `formFill.notFoundDescription` |
| 224 | 按钮 | `Try Again` | `common.tryAgain` |
| 239 | 标题 | `Response submitted` | `formFill.submitted` |
| 307 | 提示 | `This form has no fields yet.` | `formFill.noFields` |
| 322 | 按钮 | `Submitting...` / `Submit` | `formFill.submitting` / `formFill.submit` |

### app/pages/ResponsesPage.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 161 | 错误 | `Failed to load responses` | `response.loadError` |
| 163 | 按钮 | `Retry` | `common.retry` |
| 189 | 链接 | `Back to Builder` / `Back` | `response.backToBuilder` / `common.back` |
| 199 | 标签 | `{n} response{s}` | `response.nResponses` |
| 209 | placeholder | `Filter responses...` | `response.filterPlaceholder` |
| 222 | 按钮 | `Export CSV` / `Export` | `response.exportCSV` / `response.export` |
| 246 | 空状态 | `No responses yet` | `response.empty` |
| 248 | 描述 | `Share your form to start collecting responses` | `response.emptyDescription` |
| 253 | 空搜索 | `No matches` | `response.noMatch` |
| 271 | 表头 | `Submitted` | `response.submitted` |

### app/pages/ResponseInsightsPage.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 149 | 标题 | `Insights unavailable` | `insights.unavailableTitle` |
| 151 | 描述 | `Response insights could not be loaded...` | `insights.unavailableDescription` |
| 159 | 按钮 | `Retry` | `common.retry` |
| 176 | 链接 | `Forms` | `nav.forms` |
| 205 | 指标 | `Responses` | `insights.responses` |
| 210 | 指标 | `Forms` | `insights.forms` |
| 215 | 指标 | `Window` | `insights.window` |
| 221 | 指标 | `Table` | `insights.table` |

### app/components/builder/FieldPropertiesPanel.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 66 | 标题 | `Field Properties` | `field.properties` |
| 73 | 按钮 | `Delete` | `common.delete` |
| 81 | 标签 | `Type` | `field.type` |
| 101 | 标签 | `Label` | `field.label` |
| 110 | 标签 | `Placeholder` | `field.placeholder` |
| 119 | 标签 | `Help text` | `field.helpText` |
| 133 | 标签 | `Required` | `field.required` |
| 143 | 标签 | `Width` | `field.width` |
| 167 | 标签 | `Options` | `field.options` |
| 193 | placeholder | `Add option...` | `field.addOption` |

### app/components/builder/FieldRenderer.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 82 | placeholder | `you@example.com` | `fieldType.emailPlaceholder` |
| 117 | placeholder | `Select...` | `fieldType.selectPlaceholder` |
| 208 | aria-label | `${star} star${s}` | `fieldType.ratingLabel` |

### app/components/layout/Header.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 5 | 硬编码标题 | `Forms` | `nav.forms` |
| 15 | 标题 | `Responses` | `nav.responses` |
| 17 | 标题 | `Form` | `nav.form` |
| 19 | 标题 | `Extensions` | `nav.extensions` |

### app/components/ThemeToggle.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 31 | Tooltip | `Toggle theme` | `theme.toggle` |

### app/components/CloudUpgrade.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 98 | 默认标题 | `Share Publicly` | `cloudUpgrade.title` |
| 99 | 描述 | `To share content publicly, connect a cloud database.` | `cloudUpgrade.description` |
| 227 | 标签 | `Setup steps` | `cloudUpgrade.setupSteps` |
| 310 | 按钮 | `Test & Connect` | `cloudUpgrade.testAndConnect` |
| 303 | 按钮 | `Saving credentials...` / `Testing connection...` | `cloudUpgrade.saving` / `cloudUpgrade.testing` |

### app/routes/* (meta)
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| `_app.team.tsx:5` | meta title | `Team` | `meta.team` |
| `_app.response-insights.tsx:5` | meta title | `Response insights - Forms` | `meta.responseInsights` |
| `_app.forms.$id.tsx:4` | meta title | `Edit form — Forms` | `meta.editForm` |
| `_app.forms.$id_.responses.tsx:4` | meta title | `Responses — Forms` | `meta.responses` |
| `f.$.tsx:4` | meta title | `Form` | `meta.form` |

### app/components/layout/Layout.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 73 | emptyStateText | `Ask me anything about your forms` | `agentSidebar.emptyState` |
| 75 | suggestions | `Build a customer feedback survey` | `agentSidebar.suggestion1` |
| 76 | suggestions | `Show submissions by day` | `agentSidebar.suggestion2` |
| 77 | suggestions | `Export responses to CSV` | `agentSidebar.suggestion3` |

### 其他硬编码字符串（部分）
- `app/routes/form-preview.tsx` — "Missing form id", "Form not found", "Open in app", field type labels
- `app/routes/_app.team.tsx:12` — `createOrgDescription` "Set up a team to share forms..."

## 总结

**forms 模板完全没有做任何国际化处理。** 所有用户可见文本均为硬编码英文，包括：

1. **package.json** — 未包含 `@agent-native/i18n` 依赖
2. **root.tsx** — 未导入 `I18nProvider` 或 `useI18n`，`<html lang="en">` 为硬编码；使用 `AppProviders` 而非 i18n 包装
3. **所有 .tsx 文件** — 不使用 `t()` 函数，所有 UI 标签、工具提示、按钮文本、占位符、aria-label、toast 消息、对话框标题/描述等均为硬编码英文

初步估算 90+ 处硬编码字符串分布在 25+ 个组件中。按严重程度分级，这属于**完全未启用 i18n** 的状态，需要从零开始搭建国际化框架。

---

## 完成情况

| 项 | 状态 |
|----|------|
| `@agent-native/i18n` 依赖 | ✅ 已添加 |
| `I18nProvider` + `useI18n` 导入 | ✅ 已完成 |
| `<html lang>` 动态化 | ✅ 已完成 |
| `t()` 替换 root.tsx 硬编码 | ✅ 已完成（toggleTheme、forms.nav、searchForms） |
| 翻译键添加 (en.ts/zh-CN.ts) | ✅ 已完成（forms.* 命名空间，含 meta、nav、app、form、field、fieldType、response、formFill、insights、theme、agentSidebar、command、common、cloudUpgrade、team 等） |
| 深层组件替换 | ⏳ 部分完成（Sidebar、FormsListPage、FormBuilderPage、FormFillPage、ResponsesPage、FieldPropertiesPanel、ThemeToggle、CloudUpgrade、Layout 等 25+ 组件中的 90+ 字符串待替换） |