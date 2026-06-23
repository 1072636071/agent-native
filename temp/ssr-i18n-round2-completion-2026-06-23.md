# SSR 国际化 — 剩余页面完成报告

## 时间

2026-06-23，会话 2 — 完成从计划文件 `server-pages-i18n-plan.md` 中标记的所有待办页面。

## 已完成页面（3 个并行子任务）

### 1. Onboarding 登录/注册主体页 (`onboarding-html.ts`)

- 在 `getOnboardingHtml()` 中添加 `isZh` / `t(zh, en)` 辅助
- 翻译约 40 处用户可见文本：
  - 页面标题、副标题（登录/注册/忘记密码/验证中多种变体）
  - 选项卡标签（"创建账户"/"登录"）
  - 表单标签和占位符（邮箱、密码、确认密码）
  - 按钮文字（"创建账户"/"登录"/"发送重置链接"/"继续"等）
  - Google OAuth 按钮文字
  - 忘记密码/返回登录链接
  - 验证步骤的全部 UI 文本
  - JS 内联消息（按钮加载状态、错误消息、状态提示）约 30 处
- `OnboardingHtmlOptions` 已有 `language` 字段，无需改动接口
- 编译零错误

### 2. Google OAuth 成功/桌面页 (`google-oauth.ts`)

- `oauthSuccessCloseTabHtml()` 添加 `language?: "en" | "zh"` 参数，翻译 title/lang
- `desktopSuccessPage()` 添加 `language` 参数，翻译按钮/提示语/title/lang
- `oauthCallbackResponse()` 使用 `parseAcceptLanguage` 检测语言并透传到所有成功路径
- 成功路径：桌面 add-account 关闭标签页、Electron 桌面交换流程、无 token 回退页
- 编译零错误

### 3. 邮件模板 (`email-templates.ts`)

- `RenderInviteEmailArgs` / `RenderVerifySignupEmailArgs` / `RenderResetPasswordEmailArgs` 添加 `language?: "en" | "zh"`
- 三封事务邮件全部中文化：preheader、heading、paragraphs、CTA label、footer、subject
- `language` 参数可选，默认英文 — 调用点无需修改；将来可从 DB 传入用户偏好
- 编译零错误

## 最终编译验证

`tsc --noEmit --project packages/core/tsconfig.json` · 零错误通过

## 剩余可忽略项

- `social-og-image.ts` — SVG 图片渲染，动态内容为主，英文 "Agent-Native preview" 作为默认 fallback 文字影响极小
