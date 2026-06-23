# i18n 工具层抽取 & 认证错误页翻译

## 目标
将营销页面国际化过程中引入的共用工具（`parseAcceptLanguage`、类型、常量）抽取到独立文件，并开始翻译其余 SSR 页面。

## 成果

### 1. 新建 `packages/core/src/server/i18n.ts`
- 定义 `SsrLanguage = "en" | "zh"` 类型、`SUPPORTED_LANGUAGES` 常量
- 实现 `parseAcceptLanguage()` RFC 4647/7231 质量值解析器，处理通配符、区域变体
- 所有逻辑从 `auth-marketing.ts` 迁移至此，保持功能完全一致

### 2. 更新 `auth-marketing.ts`
- 导入 `parseAcceptLanguage`、`SsrLanguage`、`SUPPORTED_LANGUAGES` 从 `./i18n.js`
- 保留 `AuthMarketingLanguage` 和 `SUPPORTED_LANGUAGES` 作为废弃别名的导出，保持向后兼容
- 移除重复的 `parseAcceptLanguage` 函数体

### 3. 更新 `auth.ts`
- `parseAcceptLanguage` 导入从 `./auth-marketing.js` 改为 `./i18n.js`
- `getCustomAuthRequiredHtml()` 新增 `language` 参数，支持中英文内容（标题、提示、说明）
- 自定义 auth 路径的 `getLoginHtml` 通过事件获取 `Accept-Language` 头部，传递语言参数

### 4. 翻译完成：认证错误页面（`getCustomAuthRequiredHtml`）
- "Authentication required" → "需要认证"
- "Sign in is not configured" → "未配置登录"
- 完整中文说明文本

## 验证
TypeScript 编译零错误。
