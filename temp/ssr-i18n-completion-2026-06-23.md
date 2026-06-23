# SSR 页面国际化完成报告

## 目标
将 agent-native 项目中剩余的 7 个服务端渲染（SSR）HTML 页面从只有英文改为支持中英文（通过 `Accept-Language` 头自动检测）。

## 修改概述

### 方案：可选 `language` 参数模式
所有 HTML 页面函数添加可选 `language?: "en" | "zh"` 参数，默认可省略（向后兼容），使用 `t(zh, en)` 辅助函数进行内联翻译。

### 修改的文件

| 文件 | 修改的函数 | 翻译内容 |
|------|-----------|---------|
| `onboarding-html.ts` | `getResetPasswordHtml()` | 重置密码页面完整翻译（标题、标签、按钮、JS 提示文字） |
| `google-oauth.ts` | `oauthErrorPage()`, `oauthDesktopExchangePage()` | "连接失败"/"Connection failed"、"返回登录"/"Back to login"、"正在返回"/"Returning" |
| `identity-sso.ts` | `errorPage()` | "登录失败"/"Sign-in failed"、"无法登录"/"Could not sign you in" |
| `builder-browser.ts` | `createBuilderBrowserCallbackPage()`, `createBuilderBrowserCallbackErrorPage()` | "构建器已连接"/"Builder connected"、"无法保存构建器连接"/"Couldn't save Builder connection" 等 |
| `embed-route.ts` | `expiredEmbedSessionResponse()` | "嵌入应用会话已过期"/"Embedded app session expired" |
| `agent-chat-plugin.ts` | `renderSharedThreadHtml()`, `renderSharedThreadErrorHtml()` | "共享的代理会话"/"Shared agent session"、"最近的运行"/"Recent runs" 等 |

### 调用点更新

| 文件 | 改动 |
|------|------|
| `auth.ts` | `oauthErrorPage()` 和 `getResetPasswordHtml()` 的 4 个调用点传递 `parseAcceptLanguage(getHeader(event, "accept-language"))` |
| `identity-sso.ts` | `handleIdentitySso()` 中 8 个 `errorPage()` 调用传递 `lang` 变量 |
| `embed-route.ts` | `expiredEmbedSessionResponse()` 调用传递语言 |
| `agent-chat-plugin.ts` | `sharedThreadError()` 和 `handleSharedThreadRequest()` 中 2 个调用传递语言 |
| `core-routes-plugin.ts` | 新增 `resolveSsrLanguage()` 辅助函数，7 个 `createBuilderBrowserCallbackErrorPage()` + 1 个 `createBuilderBrowserCallbackPage()` 调用点更新 |

### 编译验证
TypeScript 编译零错误通过（`tsc --noEmit --project packages/core/tsconfig.json`）。

### 仍待处理
- 邮件模板 (`email-templates.ts`) — 需要用户语言偏好存储，较复杂
- 社交 OG 图片 (`social-og-image.ts`) — 动态内容为主，可后续处理
