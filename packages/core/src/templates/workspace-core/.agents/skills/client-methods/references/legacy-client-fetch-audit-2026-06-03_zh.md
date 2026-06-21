# 旧版客户端 Fetch 审计 (2026-06-03)

这些是在添加 `client-methods` 规则时发现的已知旧版客户端路由调用。将它们视为编辑相关区域时的清理目标。不要在没有阅读本地 action/数据契约的情况下机械地迁移它们；有些需要先创建新的 action 或辅助模块。

## 最高优先级

- 2026-06-07 后续：相同的高优先级路由优先集群仍然存在。最大的迁移仍然是 Analytics、Calendar、Mail、Slides 和 Content。不要将这些模式复制到新工作中；在编辑相关区域时，先添加或复用 action，然后用 `useActionQuery`、`useActionMutation` 或 `callAction` 调用它们。
- `templates/analytics/app/pages/analyses/AnalysesList.tsx`、`templates/analytics/app/pages/analyses/AnalysisDetail.tsx`、`templates/analytics/app/components/layout/Sidebar.tsx` 和 `templates/analytics/app/components/layout/CommandPalette.tsx` 使用 `/api/*` 处理普通应用数据。`list-analyses` 和 `get-analysis` 已存在；为 dashboard、explorer、theme 和 user-pref 路由添加 action 支持的钩子/辅助函数。
- `templates/slides/app/context/DeckContext.tsx` 和 `templates/slides/app/pages/Presentation.tsx` 使用 `/api/decks` 处理幻灯片组 CRUD。`list-decks` 和 `get-deck` 已存在；在迁移之前为 upsert/delete 流程添加或暴露 UI 安全的 action。
- `templates/mail/app/hooks/use-emails.ts`、`templates/mail/app/hooks/use-scheduled-jobs.ts`、`templates/mail/app/hooks/use-automations.ts` 和 `templates/mail/app/pages/SettingsPage.tsx` 仍使用 `/api/*` 处理普通邮件/设置/自动化工作。尽可能复用现有 action，并为别名、定时任务和自动化设置添加缺失的结构化 action。
- `templates/calendar/app/hooks/use-events.ts` 绕过现有的私有事件 action 进行事件 CRUD。优先通过 action 钩子或 `callAction` 使用 `get-event`、`update-event`、`delete-event` 和 `rsvp-event`。

## 中等优先级

- 多个客户端流程中仍有原始 action 端点调用，包括 Gmail 过滤器、日历人员搜索、幻灯片导入、视频组合生成和设计变体流程。优先使用钩子或 `callAction`。
- 模板导航钩子重复了 application-state 获取逻辑。优先使用 `setClientAppState`、`readClientAppState`、`deleteClientAppState` 或共享的导航状态辅助函数。
- Mail 集成凭证通过 `templates/mail/app/hooks/use-integrations.ts` 和 `use-apollo.ts` 中的 application state 写入；将凭证值移至 secrets/actions，而非浏览器可读的 app-state。
- Content 评论和版本已部分迁移。添加缺失的 action，如 `resolve-comment`、`delete-comment`、`list-document-versions` 和 `restore-document-version`。
- Plans 版本历史是新历史/回滚工作的模型：`list-plan-versions`、`get-plan-version` 和 `restore-plan-version` 是 action-native 的，UI 通过 action 钩子调用它们。不要将 Content 的旧版 document-version `/api/*` 辅助函数复制到新的版本面板中。

## 可接受的例外

上传/文件传输、导出、公开/匿名页面、OAuth/auth 重定向、Webhook/tracking 端点、媒体/blob 路由、协同文本端点、框架设置/状态路由、低级核心辅助实现，以及扩展桥接 `appFetch` / `extensionFetch` 可以是路由形式的协议。当多个调用者需要相同行为时，优先使用命名辅助函数。