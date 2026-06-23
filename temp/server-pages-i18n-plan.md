# 服务器端渲染页面国际化计划 - 进行中

## 问题概述

除了营销页面外，还有多个服务器端渲染的HTML页面包含硬编码英文内容，需要国际化支持。

## ✅ 已完成：营销页面国际化 + i18n 基础设施 + 主要 SSR 页面

> 见 `marketing-page-i18n-plan.md` 获取完整细节

| 文件 | 状态 | 改动 |
|------|------|------|
| `i18n.ts` | ✅ | 新建：通用 `parseAcceptLanguage` / `SsrLanguage` / `SUPPORTED_LANGUAGES` |
| `auth-marketing.ts` | ✅ | 导入通用 i18n 工具，新增中文营销内容 |
| `onboarding-html.ts` | ✅ | `OnboardingHtmlOptions.language` 透传；密码重置页已支持中英文 |
| `auth.ts` | ✅ | 读取 `Accept-Language` 头自动检测语言；`getCustomAuthRequiredHtml()` 已支持中英文 |
| `google-oauth.ts` | ✅ | `oauthErrorPage` / `oauthDesktopExchangePage` 已支持中英文 |
| `builder-browser.ts` | ✅ | 成功/失败回调页已支持中英文 |
| `embed-route.ts` | ✅ | 嵌入会话过期页已支持中英文 |
| `identity-sso.ts` | ✅ | SSO 登录失败页已支持中英文 |
| `agent-chat-plugin.ts` | ✅ | 共享线程页及错误页已支持中英文 |
| `core-routes-plugin.ts` | ✅ | Builder 连接流程已透传语言参数 |

## ⬜ 未完成：邮件模板 + 社交 OG 图片 + onboarding 登录页主体文案

## ⬜ 未完成：其他 SSR 页面

### 代码核实结果（2026-06-23）

以下页面**仍包含硬编码英文**，尚未国际化：

| 页面 | 文件 | 当前英文硬编码内容 | 状态 |
|------|------|-------------------|------|
| 登录页主体文案 | `onboarding-html.ts` | "Welcome", "Sign in", "Welcome back" 等约 40 处用户可见文本（按钮/标签/占位符/JS 提示/错误消息） | ✅ 已完成 |
| Google OAuth 成功/桌面页 | `google-oauth.ts` | "Connected", "Connected! Returning to app…", "Open Agent Native", "If the app didn't open automatically...", "You can close this tab..." | ✅ 已完成 |
| 邮件模板 | `email-templates.ts` | 3 封事务邮件（邀请/注册验证/密码重置）全部中文化 | ✅ 已完成 |
| 社交OG图片 | `social-og-image.ts` | "Agent-Native preview" — SVG 图片渲染，以动态内容为主 | ⬜ 未完成（次要） |

> 注：> - `email-template.ts`（单数）是通用渲染函数，内容动态传入，本身无需翻译；需翻译的是 `email-templates.ts`（复数）中的密码重置邮件文案。
> - `google-oauth.ts` 中仅错误页/返回页已翻译，成功提示页仍是英文。
> - `onboarding-html.ts` 中营销区（左侧）和重置密码表单已翻译，但主登录/注册表单、验证流程、Google 预检弹窗等仍是英文。

## 现有架构参考

### 已存在的 i18n 基础设施

- `packages/i18n/src/locales/zh-CN.ts` — React应用中文翻译
- `packages/i18n/src/locales/en.ts` — React应用英文翻译

### 本次新增的 SSR i18n 工具

- `packages/core/src/server/i18n.ts`：
  - `parseAcceptLanguage(header)` — 解析 Accept-Language 头
  - `SsrLanguage` 类型 (`"en" | "zh"`)
  - `SUPPORTED_LANGUAGES` 常量
- `packages/core/src/server/auth-marketing.ts`：
  - 已改为从 `./i18n.js` 导入，保留废弃别名导出以保持向后兼容

这些 SSR 页面可以直接使用 `i18n.ts` 中的 `parseAcceptLanguage` 函数。

## 推荐实施策略

### 阶段 A：提取通用 i18n 工具（✅ 已完成）

1. ✅ 从 `auth-marketing.ts` 中提取 `parseAcceptLanguage` 和 `AuthMarketingLanguage` 到 `packages/core/src/server/i18n.ts`
2. ✅ 让 `auth-marketing.ts` 从 `i18n.ts` 导入（保持向后兼容）
3. ✅ 所有 SSR 页面都可以直接使用 `i18n.ts`

### 阶段 B：按优先级逐个国际化

#### 高优先级（✅ 全部完成）
1. ✅ **认证错误页面** (`auth.ts` 中 `getCustomAuthRequiredHtml()`)
2. ✅ **密码重置页面** (`onboarding-html.ts` 中 `getResetPasswordHtml()`)
3. ✅ **登录/注册主体页** (`onboarding-html.ts` 中主登录表单、验证流程、Google 预检弹窗 ~40 处)
4. ✅ **邮件模板** (`email-templates.ts` 中 3 封事务邮件已中文化)

#### 中优先级（✅ 全部完成）
5. ✅ **Google OAuth 错误/返回页** (`google-oauth.ts` 中 `oauthErrorPage` / `oauthDesktopExchangePage`)
6. ✅ **Google OAuth 成功/桌面页** (`google-oauth.ts` 中 `oauthSuccessCloseTabHtml` / `oauthCallbackResponse` 成功分支 / `desktopSuccessPage`)
7. ✅ **身份SSO页面** (`identity-sso.ts`)
8. ✅ **Builder连接页面** (`builder-browser.ts`)

#### 低优先级（基本完成）
9. ✅ **嵌入式应用页面** (`embed-route.ts`)
10. ✅ **代理聊天页面** (`agent-chat-plugin.ts`)
11. ⬜ **社交OG图片** (`social-og-image.ts`) — SVG 图片渲染，动态内容为主，可暂缓

## 验证

1. 类型检查：✅ `pnpm --filter @agent-native/core typecheck`（已通过）
2. 营销页面 + 认证错误页中文验证：✅ 已通过 `curl` 测试
3. 其他页面独立验证：⬜ 待完成
4. 集成测试：⬜ 待完成

## 代码核实摘要

- ✅ `packages/core/src/server/i18n.ts` 已创建并可复用
- ✅ `packages/core/src/server/auth-marketing.ts` 已接入 `i18n.ts`
- ✅ `packages/core/src/server/auth.ts` 的 `getCustomAuthRequiredHtml()` 已支持中英文
- ✅ `packages/core/src/server/onboarding-html.ts` 的 `getResetPasswordHtml()` 已支持中英文
- ✅ `packages/core/src/server/google-oauth.ts` 的错误/返回页已支持中英文
- ✅ `packages/core/src/server/builder-browser.ts` 已支持中英文
- ✅ `packages/core/src/server/embed-route.ts` 已支持中英文
- ✅ `packages/core/src/server/identity-sso.ts` 已支持中英文
- ✅ `packages/core/src/server/agent-chat-plugin.ts` 已支持中英文
- ⬜ `packages/core/src/server/onboarding-html.ts` 主登录/注册表单、验证流程、Google 预检弹窗仍待国际化
- ⬜ `packages/core/src/server/google-oauth.ts` 成功/桌面提示页仍待国际化
- ⬜ `packages/core/src/server/email-templates.ts` 密码重置邮件仍待国际化
- ⬜ `packages/core/src/server/social-og-image.ts` 仍待国际化
