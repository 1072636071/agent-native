# i18n 国际化计划 — assets + chat 模板

## 目标
将 `templates/assets/` 和 `templates/chat/` 两个模板的硬编码字符串替换为 `@agent-native/i18n` 的 `t()` 函数调用。

## 步骤

### Step 1: 在 `@agent-native/i18n/locales` 中添加所有所需 key
- 两个模板共需约 120+ 个新 key

### Step 2: 修改 assets 模板文件
- package.json: 添加 `@agent-native/i18n: "workspace:*"`
- root.tsx: 包裹 `I18nProvider`, html lang 动态化
- _index.tsx: SEO + UI 字符串
- asset.$id.tsx: 详情页所有字符串
- audit.tsx: 审计日志所有字符串

### Step 3: 修改 chat 模板文件
- package.json: 添加 `@agent-native/i18n: "workspace:*"`
- root.tsx: 包裹 `I18nProvider`, html lang 动态化
- _index.tsx: SEO + UI + suggestions
- Layout.tsx: aria/sr-only + sidebar agent text
- Header.tsx: pageTitle 映射
- Sidebar.tsx: nav label + 操作 button + tooltip/aria
- observability.tsx, team.tsx, database.tsx, extensions._index.tsx: meta + page title

### Step 4: 验证编译并回写进度文档
