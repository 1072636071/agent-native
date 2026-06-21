---
name: client-methods
description: >-
  客户端方法面规则。在将浏览器/客户端代码连接到 action、应用状态、
  框架路由、应用 API、上传、认证或设置时使用。
metadata:
  internal: true
---

# 客户端方法

## 规则

浏览器/客户端代码导入命名的方法、hooks 或客户端模块，而不是手写对框架或应用路由的 REST 调用。

## 为什么

路由形状是传输细节。如果组件和文档直接调用 `fetch("/_agent-native/...")` 或模板 `/api/*` 路由，每个调用者都必须重新发现认证、基础路径、请求源头、JSON 解析、错误处理、乐观更新、同步失效和路由怪癖。命名的客户端方法为 UI、文档和未来的 agent 提供一个稳定的契约。

## 如何

1. 首先查找现有的客户端 API。

   | 需求 | 使用 |
   | --- | --- |
   | 应用 action 读取/写入 | `@agent-native/core/client` 中的 `useActionQuery` / `useActionMutation` |
   | 命令式 action 调用 | `@agent-native/core/client` 中的 `callAction` |
   | 浏览器应用状态 | `readClientAppState`、`writeClientAppState`、`setClientAppState`、`deleteClientAppState` |
   | 导航/应用状态同步 | `@agent-native/core/client` 中的 `useAgentRouteState` / `useSemanticNavigationState` |
   | Agent 聊天上下文 | `@agent-native/core/client` 中的 Agent 聊天客户端辅助函数 |
   | 从应用代码向用户提问多选题 | `@agent-native/core/client` 中的 `askUserQuestion`（在 agent 面板中内联渲染；答案发送给 agent——不要构建自定义模态框） |
   | 实时同步 | `useDbSync`、`useChangeVersion`、`useChangeVersions` |
   | 扩展 iframe 调用 | 扩展运行时中的 `appAction`、`appFetch`、`extensionFetch` |

2. 如果没有客户端 API，在边界添加最窄的辅助函数。

   - 将共享框架辅助函数放在 `packages/core/src/client/*`。
   - 将模板本地辅助函数放在 `templates/<app>/app/hooks/*`、
     `templates/<app>/app/lib/*` 或现有的本地客户端模块。
   - 从 `@agent-native/core/client` 导出可复用的核心辅助函数；当调用者
     可能需要避免宽泛的桶导出时添加叶子导出。
   - 将原始 `fetch`、`agentNativePath` 和路由路径保留在该辅助函数内部，
     不要分散在组件或文档中。
   - 为 URL 构造、头部、响应解析、错误形状和任何同步失效添加针对性测试。

3. 教授辅助函数，而不是路由。

   文档、skill、示例和生成的代码应展示：

   ```ts
   await setClientAppState("selection", selection, { keepalive: true });
   ```

   而不是：

   ```ts
   await fetch("/_agent-native/application-state/selection", {
     method: "PUT",
     body: JSON.stringify(selection),
   });
   ```

## 例外

原始路由调用仅在低级客户端辅助函数内部或对于无法干净隐藏的路由形状协议是可接受的：

- multipart 上传
- 流式/SSE/WebSocket 传输
- OAuth 重定向和回调 URL 构造
- webhook 和外部提供商回调
- 扩展沙箱 `appFetch` / `extensionFetch`，它们本身就是暴露的客户端方法
- 断言路由构造的测试

即使对于例外，当超过一个调用者需要该行为时，优先使用命名的辅助函数。

## 不要

- 不要在 React 组件中为正常应用数据、action、设置或应用状态直接使用
  `fetch("/_agent-native/...")`、`fetch(agentNativePath(...))` 或模板 `/api/*` 调用。
- 不要将路由调用文档化为客户端代码应该做工作的方式。
- 不要仅为让客户端 fetch 看起来更简单而添加透传 `/api/*` 路由；暴露一个
  action 并用 action hooks 调用它。
- 不要在每个组件中重复认证/会话/基础路径/请求源/错误解析逻辑。

## 相关 Skill

- `actions`——UI 和 agent 共享的应用操作。
- `context-awareness`——应用状态导航和选择辅助函数。
- `real-time-sync`——保持辅助函数支持的 UI 读取新鲜。
- `server-plugins`——当新路由确实需要时。

## 参考

- `references/legacy-client-fetch-audit-2026-06-03.md`——添加此规则时发现的已知遗留清理目标。