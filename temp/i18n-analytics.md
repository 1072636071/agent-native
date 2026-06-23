# i18n 检查报告 - analytics

## 概览
- 检查文件数: 137 (.tsx)
- 发现硬编码字符串数: 140+
- 严重程度: **高** — 完全未使用 `useI18n()` / `t()`

## 详细问题列表

### app/root.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 36 | HTML lang | `lang="en"` | 动态值 |
| 54 | meta | `content="Analytics"` | meta.title |

### app/pages/About.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 12 | 标题 | "Connect Data Sources" | about.capability.connectSources |
| 13-14 | 描述 | "Connect any of 20+ data sources..." | about.capability.connectSourcesDesc |
| 18 | 标题 | "Create Custom Dashboards" | about.capability.createDashboards |
| 24 | 标题 | "Query Explorer" | about.capability.queryExplorer |
| 30 | 标题 | "Ask Questions in Chat" | about.capability.askChat |
| 40 | 页面标题 | "About This App" | about.title |
| 49 | 章节标题 | "What You Can Do" | about.whatYouCanDo |
| 72 | 章节标题 | "Available Data Sources" | about.availableDataSources |

### app/pages/Ask.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 33 | 空状态 | "Ask Analytics about your data." | ask.emptyState |
| 37 | placeholder | "Ask about data, dashboards, metrics, or sources..." | ask.composerPlaceholder |
| 40 | 标题 | "What would you like to explore?" | ask.introTitle |

### app/pages/NotFound.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 11 | 标题 | "Page Not Found" | notFound.title |
| 13 | 描述 | "The page you are looking for doesn't exist or has been moved." | notFound.description |
| 16 | 按钮 | "Return to Dashboard" | notFound.returnToDashboard |

### app/pages/Settings.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 13 | 标题 | "Account" | settings.account |
| 19 | 标签 | "Signed in as" | settings.signedInAs |
| 29 | 标题 | "Data Source Credentials" | settings.dataSourceCredentials |
| 33 | 描述 | "API keys and credentials are managed on the Data Sources page." | settings.credentialsDesc |
| 36 | 按钮 | "Manage Data Sources" | settings.manageDataSources |
| 43 | 标题 | "About" | settings.about |

### app/components/layout/Header.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 13-16 | 页面标题 | "Overview", "Data Sources", "Data Dictionary", "Template Catalog" | header.* |

## 总结
- 所有页面文字均为硬编码英文
- 需引入 `useI18n()` 并替换为 `t('key')` 调用
- root.tsx `<html lang="en">` 需动态化
