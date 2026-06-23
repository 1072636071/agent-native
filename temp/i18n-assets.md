# i18n 检查报告 - assets

## 完成情况

**状态: 已完成** — 所有文件的 i18n 改造已全部实施。

### 改造文件清单

| 文件 | 状态 | 说明 |
|------|------|------|
| `packages/i18n/src/locales/en.ts` | 已完成 | 添加了 `assets.*` 命名空间，共 100+ 个翻译键 |
| `packages/i18n/src/locales/zh-CN.ts` | 已完成 | 添加了对应的中文翻译 |
| `templates/assets/package.json` | 已完成 | 已包含 `@agent-native/i18n` 依赖 |
| `templates/assets/app/root.tsx` | 已完成 | 已集成 `I18nProvider`，`<html lang>` 动态同步，命令菜单文本均已本地化 |
| `templates/assets/app/routes/_index.tsx` | 已完成 | 8 个 `t()` 调用覆盖空状态、placeholder、标题、标签 |
| `templates/assets/app/routes/asset.$id.tsx` | 已完成 | 33 个 `t()` 调用覆盖加载、错误、按钮、字段标签、操作、对话框 |
| `templates/assets/app/routes/audit.tsx` | 已完成 | 42 个 `t()` 调用覆盖标题、筛选、表格、详情、错误、空状态、时间格式化 |

### 翻译键分布

- `assets.seo.*` — SEO 标题/描述 (2)
- `assets.root.*` — 根布局 (7)
- `assets.index.*` — 创建页面 (8)
- `assets.detail.*` — 详情页面 (30+)
- `assets.audit.*` — 审计页面 (40+)

### 遗留问题

1. **`_index.tsx` 中 SEO meta**: `meta()` 函数无法使用 React hooks，SEO 标题/描述暂为硬编码。此问题与其他模板一致（如 brain 的 `extensions._index.tsx`），不属于本次改造范围。对应的 `assets.seo.title` 和 `assets.seo.description` 翻译键已预留在翻译文件中。

## 详细问题列表（改造前参考）

### app/root.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 37 | HTML lang | `lang="en"` | 动态值 |
| 55 | meta | `content="Assets"` | assets.appTitle |
| 96 | 命令菜单 | `Toggle {isDark ? "light" : "dark"} mode` | assets.toggleTheme |
| 110-113 | 命令菜单 | "Actions", "Search", "Appearance" | cmd.* |

### app/routes/_index.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 54 | 空状态 | "Ask Assets what to create." | assets.create.emptyState |
| 58 | placeholder | "Describe the asset - attach images or text context with +" | assets.create.placeholder |
| 61 | 标题 | "What asset should we make?" | assets.create.heading |
| 69-77 | 标签 | "image", "video", "refine" | assets.mediaType.*, assets.action.refine |

### app/routes/asset.$id.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 57 | 加载 | "Loading asset..." | assets.detail.loading |
| 64-69 | 错误 | "Asset unavailable" + 描述 | assets.detail.unavailable* |
| 72 | 按钮 | "Back to library" | assets.detail.backToLibrary |
| 90 | 导航 | "Library", "Brand Kit" | assets.nav.* |
| 108 | toast | "Could not copy to clipboard." | assets.toast.clipboardError |
| 159-180 | 字段标签 | "Video", "Dimensions", "MIME", "Description", "Prompt" | assets.field.* |
| 187-188 | 按钮 | "Make video variation", "Make variations" | assets.action.* |
| 203-255 | 操作 | "Download", "Copy URL", "Delete" | assets.action.* |
| 259-279 | 对话框 | "Delete asset?" + 描述, "Cancel", "Delete" | assets.dialog.* |

### app/routes/audit.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 179-180 | 标题 | "Audit log" | assets.audit.title |
| 184-193 | 徽章 | "Owner-only fallback", "Org-wide" | assets.audit.* |

## 总结
- 200+ 硬编码字符串，涵盖详情页、操作按钮、对话框、toast、字段标签等
- `<html lang="en">` 硬编码
- 建议按 `assets.field.*`, `assets.action.*`, `assets.dialog.*`, `assets.toast.*` 命名空间组织
