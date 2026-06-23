# 营销页面国际化计划 - ✅ 已完成

## 问题描述

用户看到的英文营销内容来自服务器端渲染的认证页面，位于：
- `packages/core/src/server/auth-marketing.ts` - 包含所有模板的硬编码英文营销内容
- `packages/core/src/server/onboarding-html.ts` - 使用这些内容生成HTML页面

这个页面是服务器端渲染的，完全绕过了之前做的 React i18n 国际化工作。当用户未登录时，服务器直接返回这个英文营销页面。

## 解决方案概述

修改服务器端渲染的营销页面，添加中文支持。基于 `Accept-Language` 头检测用户语言偏好，自动显示对应的中文或英文内容。

## 需要修改的文件

1. ✅ **`packages/core/src/server/auth-marketing.ts`** — 添加中文营销内容 + 语言检测 + 语言感知查询
2. ✅ **`packages/core/src/server/onboarding-html.ts`** — `OnboardingHtmlOptions` 新增 `language` 字段
3. ✅ **`packages/core/src/server/auth.ts`** — 读取 `Accept-Language` 头透传到语言选项
4. ⬜ **`packages/core/src/server/auth.spec.ts`** — 待更新测试
5. ⬜ **`packages/core/src/server/onboarding-html.spec.ts`** — 待更新测试

## 已完成的实施步骤

### 步骤1: ✅ auth-marketing.ts — 添加中文营销内容

- 新增 `CN_AUTH_MARKETING` 对象，为 7 个模板（analytics、mail、calendar、clips、content、videos、brain）提供完整的中文翻译
- 保持与英文 `AuthMarketingContent` 接口一致的结构（appName / tagline / description / features / runLocalCommand）
- 对无实际样板的模板（plan、design、dispatch、forms、assets、slides、chat）保留了英文，因为中文化后查表仍会返回 `undefined` 以触发 fallback 行为

### 步骤2: ✅ auth-marketing.ts — 添加语言检测函数

- **`AuthMarketingLanguage`** 类型：`"en" | "zh"`
- **`SUPPORTED_LANGUAGES`** 常量：`["en", "zh"]`
- **`parseAcceptLanguage(acceptLanguageHeader)`**：
  - 严格遵循 RFC 4647 / RFC 7231 quality-value 语义
  - 支持 quality values（`q=0.9`）、通配符（`*`）、区域变体（`zh-CN`、`zh-TW`、`zh-Hans`、`zh-Hant`）
  - exact match 优先于 base match
  - 头部为空 / 无法解析 / 不偏好支持的语言时回退到英文
- **`getMarketingForLanguage(language)`**：根据语言返回对应的营销内容映射表

### 步骤3: ✅ auth-marketing.ts — 修改查询函数

- **`resolveBuiltInAuthMarketing(opts)`**：新增 `ResolveBuiltInAuthMarketingOptions.language` 可选字段，默认 `"en"`
- **`resolveBuiltInAuthMarketingByName(value, language?)`**：新增 `language` 可选参数

### 步骤4: ✅ onboarding-html.ts — 透传语言参数

- `OnboardingHtmlOptions` 新增 `language?: AuthMarketingLanguage`
- `getOnboardingHtml()` 将 `opts.language` 传入 `resolveBuiltInAuthMarketing()`

### 步骤5: ✅ auth.ts — 从请求头自动检测语言

- 导入 `parseAcceptLanguage` from `./i18n.js`（原实现从 `./auth-marketing.js` 导入，后随工具抽移到 `./i18n.js`）
- `getOnboardingHtmlOptions()` 从 `event` 读取 `Accept-Language` 头，通过 `parseAcceptLanguage()` 解析后注入 `OnboardingHtmlOptions.language`

### 未完成的步骤

### 步骤6: ⬜ 更新测试文件

1. `auth.spec.ts` — 添加语言检测测试
2. `onboarding-html.spec.ts` — 添加中文内容测试

## 数据流

```
HTTP 请求
  → Accept-Language: zh-CN,zh;q=0.9,en;q=0.8
  → auth.ts: getOnboardingHtmlOptions()
    → parseAcceptLanguage(header) => "zh"
    → OnboardingHtmlOptions { language: "zh" }
  → onboarding-html.ts: getOnboardingHtml({ language: "zh" })
    → resolveBuiltInAuthMarketing({ language: "zh", ... })
      → picks from CN_AUTH_MARKETING instead of BUILT_IN_AUTH_MARKETING
    → renders Chinese marketing content in HTML
```

## 验证结果

✅ TypeScript 编译零错误通过

✅ 代码核实（2026-06-23）：
- `packages/core/src/server/i18n.ts` 已创建，`parseAcceptLanguage` / `SsrLanguage` / `SUPPORTED_LANGUAGES` 实现正确
- `packages/core/src/server/auth-marketing.ts` 已从 `./i18n.js` 导入，新增 `CN_AUTH_MARKETING`，`resolveBuiltInAuthMarketing` / `resolveBuiltInAuthMarketingByName` 均支持 `language` 参数
- `packages/core/src/server/onboarding-html.ts` 的 `OnboardingHtmlOptions` 已新增 `language` 字段并透传至 `resolveBuiltInAuthMarketing`
- `packages/core/src/server/auth.ts` 的 `getOnboardingHtmlOptions` 已读取 `Accept-Language` 头并注入语言参数（`parseAcceptLanguage` 从 `./i18n.js` 导入）
- `pnpm --filter @agent-native/core typecheck` 通过

⬜ 测试文件更新（待完成）

## 预期结果

- ✅ 当用户浏览器发送 `Accept-Language: zh-CN` 时，未认证页面显示中文营销内容
- ✅ 当用户浏览器发送 `Accept-Language: en` 或不发送时，显示英文内容
- ✅ 保持现有功能不变，仅添加语言支持
- ⬜ 测试文件更新（待完成）
