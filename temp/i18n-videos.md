# i18n 检查报告 - videos

## 完成情况
- **状态: 已完成** — 已对 videos 模板实施完整的 i18n 改造
- 修改时间: 2026-06-23

## 修改的文件

### 1. `templates/videos/app/root.tsx`
- 导入 `useLocale` 用于同步 `<html lang>`
- `Layout` 组件中使用 `useLocale()` 获取当前语言并设置 `html lang`
- `AppContent` 中添加 `useI18n()` 调用
- CommandMenu 中替换所有硬编码字符串为 `t()` 调用
- 用 `<I18nProvider>` 包裹 `<AppContent>`

### 2. `templates/videos/app/components/layout/Header.tsx`
- 添加 `useI18n` 导入
- 用 `t()` 替换所有页面标题映射和 aria-label
- `resolveTitle` 函数改为接收 `t` 参数

### 3. `templates/videos/app/components/layout/NavSidebar.tsx`
- 添加 `useI18n` 导入和调用
- 用 `t()` 替换导航项标签和品牌文字

### 4. `templates/videos/app/components/Sidebar.tsx`
- 添加 `useI18n` 导入和调用
- 替换所有导航项标签、Tab 标题、section 标题、tooltip、aria-label、空状态文字

### 5. `templates/videos/app/components/StudioHeader.tsx`
- 添加 `useI18n` 导入和调用
- 替换标题、aria-label、Share 按钮文字、CloudUpgrade 参数

### 6. `templates/videos/app/pages/Index.tsx`
- 添加 `useI18n` 导入和调用
- 替换 AgentSidebar 的 emptyStateText 和 suggestions

### 7. `templates/videos/app/pages/CompositionView.tsx`
- 添加 `useI18n` 导入和调用
- 替换所有 tooltip 文字、Save 按钮、Tweaks 按钮、所有 AlertDialog 标题/描述/按钮

### 8. `templates/videos/app/pages/NewComposition.tsx`
- 添加 `useI18n` 导入和调用
- 替换 Generating 文字、标题、描述

### 9. `templates/videos/app/pages/DesignSystems.tsx`
- 添加 `useI18n` 导入和调用
- 替换页面标题、按钮文字、卡片文字、空状态文字

### 10. `templates/videos/app/pages/NotFound.tsx`
- 添加 `useI18n` 导入和调用
- 替换所有硬编码文字

### 11. `templates/videos/app/components/NewCompositionPopover.tsx`
- 添加 `useI18n` 导入和调用
- 替换按钮文字、标题、描述、placeholder

### 12. `templates/videos/app/components/QuestionFlow.tsx`
- 添加 `useI18n` 导入和调用
- 替换默认标题、描述、skip/submit 标签

### 13. `templates/videos/app/components/CollabPresenceBar.tsx`
- 添加 `useI18n` 导入和调用
- 替换 title 属性

### 14. `templates/videos/app/components/CloudUpgrade.tsx`
- 添加 `useI18n` 导入和调用
- 替换默认标题、描述、标签、placeholder、按钮文字、错误消息

### 15. `packages/i18n/src/locales/en.ts`
- 添加 videos 命名空间的所有英文翻译键

### 16. `packages/i18n/src/locales/zh-CN.ts`
- 添加 videos 命名空间的所有中文翻译键

## 翻译键汇总
| 命名空间 | 键数 | 说明 |
|---------|------|------|
| `app.*` | 1 | 应用标题 |
| `command.*` | 4 | CommandMenu |
| `nav.*` | 9 | 导航 |
| `pageTitle.*` | 7 | 页面标题 |
| `header.*` | 1 | Header |
| `sidebar.*` | 15 | Sidebar |
| `common.*` | 2 | 通用（已使用通用区域的 general.*） |
| `index.*` | 3 | 首页 |
| `composition.*` | 16 | 合成编辑 |
| `newComposition.*` | 6 | 新建合成 |
| `notFound.*` | 2 | 404 |
| `studio.*` | 16 | 工作室 |
| `questionFlow.*` | 4 | 问题流 |
| `collab.*` | 2 | 协作 |
| `designSystem.*` | 4 | 设计系统 |
| `cloud.*` | 11 | 云升级 |
| **总计** | **~103** | |

## 未覆盖的文件
以下文件包含需要进一步扫描的潜在硬编码字符串（未在当前改造范围内）：
- `app/components/studio/*` — 子组件可能含有更多字符串
- `app/routes/team.tsx` — 团队页面