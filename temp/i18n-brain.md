# i18n 检查报告 - brain

## 概览
- 检查文件数: 35 (.tsx)
- 发现硬编码字符串数: 250+
- 严重程度: **高** — 完全未使用 `useI18n()` / `t()`

## 详细问题列表

### app/root.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 57 | HTML lang | `lang="en"` | 动态值 |
| 76 | meta | `content="Brain"` | meta.title |
| 129 | 命令菜单 | `Toggle {isDark ? "light" : "dark"} mode` | cmd.toggleTheme |
| 141-167 | 命令菜单 | "Navigate", "Ask Brain", "Search", "Knowledge", "Review queue", "Sources", "Ops", "Extensions", "Settings", "Appearance" | cmd.* |

### app/routes/_index.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 9-11 | SEO | "Agent-Native Brain - Open Source company knowledge base for AI agents" | seo.homeTitle |
| 50 | 空状态 | "Ask Brain about company knowledge." | chat.emptyState |
| 54 | placeholder | "Ask about company knowledge..." | chat.placeholder |
| 57-58 | 标题+描述 | "What do you want to know?" / "Brain answers from cited company knowledge." | chat.heading |

### app/routes/knowledge.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 151-153 | 页面标题 | "Knowledge", "Cited company knowledge" + 描述 | knowledge.title |
| 170 | placeholder | "Search memories, topics, source names..." | knowledge.searchPlaceholder |
| 180 | Select | "Status" | knowledge.filterStatus |
| 195 | Select | "Source type" | knowledge.filterSourceType |
| 216-221 | 表头 | "Knowledge", "Source", "Status", "Company context", "Confidence", "Cites" | knowledge.col.* |
| 236 | 空值 | "No summary yet." | knowledge.noSummary |
| 282-288 | 空状态 | "No knowledge matches these filters", "No company knowledge yet" | knowledge.empty* |
| 295-307 | 错误 | "Company context update failed", "Waiting on search-knowledge" | knowledge.error* |

### app/routes/sources.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 多处 | 页面文字 | Source 管理页面全部硬编码 | sources.* |

### app/routes/ops.tsx, review.tsx, extensions.tsx, settings.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 多处 | 页面文字 | 各页面标题、描述、按钮、表格、状态等全部硬编码 | 对应命名空间 |

## 总结
- brain 模板最严重，250+ 硬编码字符串覆盖 11 个核心文件
- knowledge 页表格/筛选器/状态消息全硬编码
- `<html lang="en">` 硬编码
- 建议按页面组织 Key: `knowledge.*`, `sources.*`, `ops.*`, `review.*`
