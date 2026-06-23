# i18n 检查报告 - assets

## 概览
- 检查文件数: 59 (.tsx)
- 发现硬编码字符串数: 200+
- 严重程度: **高** — 完全未使用 `useI18n()` / `t()`

## 详细问题列表

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
