# i18n 检查报告 - analytics ✅ 已完成

## 概览
- 国际化范围：6 个源文件覆盖报告中的所有硬编码字符串
- 依赖：在 `package.json` 添加 `@agent-native/i18n: workspace:*`
- 语言文件：`en.ts` / `zh-CN.ts` 已在之前完成所有 analytics 键值对的添加

## 已修改文件

### 1. `package.json` — 添加依赖
- 新增 `"@agent-native/i18n": "workspace:*"` 到 dependencies

### 2. `app/root.tsx` — Provider 注入 + HTML lang 动态化
- 导入 `I18nProvider, useI18n` 和 `useEffect`
- 新增 `HtmlLangSync` 组件：用 `useI18n().lang` 同步 `<html>` 的 lang 属性
- 用 `I18nProvider defaultLang="en"` 包裹整个应用

### 3. `app/pages/About.tsx` — 全部国际化
- `capabilities` 数组中的 `title`/`description` 替换为 `titleKey`/`descKey`
- 页面标题、描述、章节标题、底部文字全部使用 `t('analytics.about.*')`

### 4. `app/pages/Ask.tsx` — 占位文本和空状态
- `emptyStateText`、`composerPlaceholder`、`introTitle`/`introDesc` 全部使用 `t('analytics.ask.*')`

### 5. `app/pages/NotFound.tsx` — 标题、描述、按钮
- 标题、描述文本、按钮文字全部使用 `t('analytics.notFound.*')`

### 6. `app/pages/Settings.tsx` — 卡片标题、标签、描述、按钮
- 三段 Card 的标题、描述文本、按钮文字全部使用 `t('analytics.settings.*')`

### 7. `app/components/layout/Header.tsx` — 页面标题
- `pageTitles` 映射改为 i18n key，`resolveTitle` 通过 `t()` 解析
- 回退标题 `"Analytics"` 改为 `t('analytics.title')`

## i18n Key 清单 (42 个 key)

| Key | en | zh-CN |
|-----|----|-------|
| analytics.meta.title | Analytics | Analytics |
| analytics.title | Analytics | Analytics |
| analytics.about.title | About This App | 关于此应用 |
| analytics.about.description | Analytics gives you... | Analytics 为你... |
| analytics.about.capability.connectSources | Connect Data Sources | 连接数据源 |
| analytics.about.capability.connectSourcesDesc | Connect any of 20+... | 连接 20+ 数据源... |
| analytics.about.capability.createDashboards | Create Custom Dashboards | 创建自定义仪表盘 |
| analytics.about.capability.createDashboardsDesc | Describe the dashboard... | 描述你想要的仪表盘... |
| analytics.about.capability.queryExplorer | Query Explorer | 查询浏览器 |
| analytics.about.capability.queryExplorerDesc | Use the Explorer tool... | 使用 Explorer 工具... |
| analytics.about.capability.askChat | Ask Questions in Chat | 在聊天中提问 |
| analytics.about.capability.askChatDesc | Ask natural-language... | 对任何已连接的数据源... |
| analytics.about.whatYouCanDo | What You Can Do | 你能做什么 |
| analytics.about.availableDataSources | Available Data Sources | 可用数据源 |
| analytics.about.footer | All data is queried live... | 所有数据均从已连接... |
| analytics.ask.emptyState | Ask Analytics about your data. | 向 Analytics 询问你的数据。 |
| analytics.ask.composerPlaceholder | Ask about data, dashboards... | 询问数据、仪表盘... |
| analytics.ask.introTitle | What would you like to explore? | 你想探索什么？ |
| analytics.ask.introDesc | Ask about data, dashboards... | 询问数据、仪表盘... |
| analytics.notFound.title | Page Not Found | 页面未找到 |
| analytics.notFound.description | The page you are looking for... | 你查找的页面不存在... |
| analytics.notFound.returnToDashboard | Return to Dashboard | 返回仪表盘 |
| analytics.settings.account | Account | 账户 |
| analytics.settings.signedInAs | Signed in as | 登录身份 |
| analytics.settings.dataSourceCredentials | Data Source Credentials | 数据源凭据 |
| analytics.settings.credentialsDesc | API keys and credentials... | API 密钥和凭据... |
| analytics.settings.manageDataSources | Manage Data Sources | 管理数据源 |
| analytics.settings.aboutTitle | About | 关于 |
| analytics.settings.aboutDesc1 | Analytics is a tool for connecting... | Analytics 是一个连接... |
| analytics.settings.aboutDesc2 | Use the Data Sources page... | 使用数据源页面... |
| analytics.header.overview | Overview | 总览 |
| analytics.header.dataSources | Data Sources | 数据源 |
| analytics.header.dataDictionary | Data Dictionary | 数据字典 |
| analytics.header.templateCatalog | Template Catalog | 模板目录 |
| analytics.header.analyses | Analyses | 分析 |
| analytics.header.explorer | Explorer | 浏览器 |
| analytics.header.team | Team | 团队 |
| analytics.header.settings | Settings | 设置 |
| analytics.header.about | About | 关于 |
