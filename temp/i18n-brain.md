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

## 完成情况

### 已完成的改造 ✅

1. **app/root.tsx** — 已完成
   - 已导入 `I18nProvider`, `useI18n`
   - `<I18nProvider>` 已包裹应用内容
   - `Document` 组件使用 `useI18n().lang` 动态设置 `<html lang>`
   - 命令菜单项已使用 `t()` 替换
   - 主题切换按钮已使用 `t()` 替换

2. **package.json** — 已完成
   - 已包含 `"@agent-native/i18n": "workspace:*"` 依赖

3. **app/components/layout/Layout.tsx** — 已完成
   - 侧边栏标题、描述、AgentSidebar 空状态和 suggestions 已使用 `t()`

4. **app/components/layout/Sidebar.tsx** — 已完成
   - 导航标题、聊天相关操作已使用 `t()`，导航项通过 `item.i18nKey` 使用 `t()`

5. **app/components/brain/CanonicalPreviewSheet.tsx** — 已完成
   - 所有预览相关的标签、按钮已使用 `t()`

6. **app/routes/knowledge.tsx** — 已完成
   - 页面标题、描述、表格表头、筛选器、空状态、错误信息已使用 `t()`

7. **app/routes/_index.tsx** — 已完成
   - SEO meta 标签使用 locale key 引用
   - AgentChatSurface 的空状态文本、placeholder、intro 标题/描述使用 `t()`

8. **app/routes/team.tsx** — 已完成
   - Meta title 使用 locale key
   - TeamPage 的 createOrgDescription 使用 `t()`

9. **app/routes/extensions.tsx**, **extensions._index.tsx**, **extensions.$id.tsx** — 已完成
   - Meta title 使用 locale key

10. **app/routes/search.tsx** — 部分完成
    - Reset 按钮、空状态、错误信息、Confidence/Score 徽章、Citation/Updated 文本、View in Brain/Open source 按钮
    - Details 面板中的 Why matched、Summary、Citation quote、Details 章节标题
    - DetailItem 组件的 Source/Provider/Status/Confidence/Score/Updated 标签
    - Facet 组的 Type/Source/Status 标签
    - "In these results" 标签
    - 待办：SearchResultRow 中 "No excerpt is available" fallback 等部分内部字符串
    - 待办：DetailItem 中 "Not available" fallback
    - 待办：Open source URL/Open Brain record/Open related source 链接文本

11. **app/routes/review.tsx** — 部分完成
    - 摘要标签（Pending/Approved/Rejected proposals）
    - Aria 标签、Unsaved edits、No proposed knowledge
    - 编辑表单字段标签（Title/Proposed knowledge/Rationale/Reviewer notes）
    - 提示文本（Approval saves wording edits first / Approve durable...）
    - 菜单项（Edit wording / Hide editor / Preview company context / Open source）
    - 详情面板章节标题（Review signals / Target and payload / Queued proposal / Evidence）
    - 信号标签（Target / Privacy / Evidence / Why queued / Privacy flags）
    - DraftDiff 标签（Title / Knowledge body / Rationale / Queued / Current draft / Current）
    - MetadataRow 标签（Source / Capture / Knowledge target / Supersedes / Visibility / Updated / Kind / Topic / Publish tier / Result status / Tags / Summary）
    - 待办：ProposalDetailsSheet 中部分字符串（Queued proposal 标题等）
    - 待办：EvidenceSnippet 和 DetailItem 中 "Not recorded" fallback
    - 待办：reviewedSummary 函数中的状态描述字符串

12. **app/routes/ops.tsx** — 部分完成
    - MetricCard 标签（Queued/Processing/Failed/Done/Visible）
    - Retry controls 标题和描述
    - 表格列头（Capture/Updated/Action）
    - 错误状态（Queue unavailable / Retry failed）
    - Clear 按钮、Retry 按钮、Select aria label
    - stale 徽章、"No issue recorded" fallback
    - queueIssues 标签使用函数方式获取 i18n 值
    - 待办：toast 消息中的字符串

13. **app/routes/settings.tsx** — 部分完成
    - 页面 eyebrow、Save changes 按钮
    - Company name / Assistant name 字段标签和 placeholder
    - 发布层级选项（Private/Team/Company）和描述
    - 所有开关的描述文本
    - Policy 侧边栏标签和值
    - Auto-publish Gate 卡片标题、描述、Confidence threshold 标签
    - 数字字段 suffix 和提示
    - 待办：Sanitization model/instructions 字段标签
    - 待办：剩余一些内部硬编码字符串

14. **app/routes/sources.tsx** — 部分完成
    - 页面 eyebrow
    - Provider 标签和详细描述使用函数方式获取 i18n 值
    - defaultTitle 使用 t()
    - captureStatusLabel / queueStatusLabel / queueActionLabel 使用 t()
    - Connection providers / Brain health 章节标题
    - 加载/提供方计数/无提供方/工作区错误 等文本
    - 健康徽章（healthy / attention / last sync / eval）
    - Source aria 标签、Next sync 文本
    - Capture 相关标签（Distillation 状态、attempt、next check、waiting 文本）
    - Details/Hide details/Grant in Dispatch/Add source 按钮
    - 待办：ProviderCatalog 中大量内部字符串
    - 待办：SourceListItem 中 sync detail 字符串
    - 待办：grantStateLabel/workspaceStatusLabel 等辅助函数

15. **翻译键（locales）** — 已完成
    - `en.ts` 中所有 `brain.*` 键已添加英文翻译
    - `zh-CN.ts` 中所有 `brain.*` 键已添加中文翻译
    - 两套翻译文件的键完全一致

### 待完成项 🔴

1. **search.tsx** — 剩余内部硬编码字符串：
   - SearchResultRow: "No excerpt is available." 等 fallback
   - SearchResultDetails: 部分内部标签和 fallback
   - DetailItem: "Not available" fallback
   - 结果行中的 View in Brain / Open source 按钮文本

2. **review.tsx** — 剩余内部硬编码字符串：
   - reviewedSummary 函数中的状态描述
   - buildQueueReason 函数中的提示文本
   - buildApproveLabel 函数中的按钮标签
   - buildTargetContext 函数中的标签文本
   - ProposalDetailsSheet 中 Evidence 部分
   - EvidenceSnippet 中的部分字符串

3. **ops.tsx** — 剩余内部硬编码字符串：
   - toast 消息中的字符串
   - QueueStatusBadge 中的状态文本
   - "Now"/"Unknown" 等日期 fallback

4. **sources.tsx** — 大量剩余内部硬编码字符串：
   - ProviderCatalog 展开区域的大量字符串
   - SourceListItem 中的同步详情
   - grantStateLabel / workspaceStatusLabel / appAccessLabel 等辅助函数
   - 连接健康、凭据路径等相关字符串
   - ProviderReadinessCell 中的字符串

5. **settings.tsx** — 少量剩余内部硬编码字符串：
   - Sanitization model/instructions 字段描述
   - 部分剩余内部描述文本

6. **lib/brain.ts** — 大量辅助函数中的字符串：
   - sourceDescription 函数中的提供商描述
   - statusLabel / formatPercent 等函数的 fallback 值
   - navItems 中的 label 字段（已通过 i18nKey 覆盖）

### 已添加的翻译键

所有新增的翻译键前缀为 `brain.*`，按页面组织：
- `brain.search.*` — 搜索页面
- `brain.review.*` — 审查页面
- `brain.ops.*` — 运维页面
- `brain.sources.*` — 来源页面
- `brain.settings.*` — 设置页面
