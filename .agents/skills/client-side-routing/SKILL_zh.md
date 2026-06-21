---
name: client-side-routing
description: >-
  如何添加路由而不重新挂载应用壳。在添加新路由、修复导航时 agent
  侧边栏重新加载或在 root.tsx 布局和无路径 _app.tsx 布局模式之间
  选择时使用。
metadata:
  internal: true
---

# 客户端路由

## 规则

所有模板都是使用 React Router 的单页应用。**导航不得重新挂载应用壳。** Agent 侧边栏、文档树和任何其他持久 chrome 必须在路由变更后存活。

## 为什么

如果壳在每次导航时卸载，agent 聊天会重新连接/重新加载，破坏进行中的工作并冲击后端。

## 硬规则

**应用壳（AgentSidebar + 任何顶级导航）必须挂载一次，在 `<Outlet />` 上方。** 永远不要在每个页面中包裹自己的 `<AppLayout>` / `<Layout>`。React 在每次导航时在 outlet 位置看到不同的组件并卸载整个子树。

## 两种正确模式

### 1. 所有路由都需要壳

在 `root.tsx` 中围绕 `<Outlet />` 挂载 `<AppLayout>`：

```tsx
// app/root.tsx
<AppLayout>
  <Outlet />
</AppLayout>
```

### 2. 混合受保护和公共路由

使用 React Router **无路径布局路由**：

```
app/routes/
  _app.tsx                  # renders <AppLayout><Outlet /></AppLayout>
  _app._index.tsx           # / → under AppLayout
  _app.settings.tsx         # /settings → under AppLayout
  _app.team.tsx             # /team → under AppLayout
  book.$slug.tsx            # /book/:slug → no layout (public)
  f.$.tsx                   # /f/* → no layout (public form filler)
```

`_app.tsx` 上的 `_` 前缀使其成为**无路径**父级——它贡献布局但不贡献 URL 段。以 `_app.` 为前缀的路由文件嵌套在其下，并在导航间共享布局实例。

## 反模式

```tsx
// ❌ 坏的做法——每个路由包裹自己的 Layout，导致每次导航时完全重新挂载
export default function Settings() {
  return (
    <AppLayout>
      <SettingsContent />
    </AppLayout>
  );
}
```

如果页面需要每路由数据（例如侧边栏高亮活动文档），从布局内的 `useParams()` / `useLocation()` 派生——不要通过每个路由文件作为 prop 传递。

## 聊天优先路由

如果 `/` 是全页聊天如 `AgentChatHome`，尽可能保持应用壳挂载在其周围，
这样 `AgentSidebar` URL 同步和路由预热保持活跃。如果聊天路由有意在壳之外，
为 agent 常从该聊天打开的路由添加一个小的应用拥有的预热。在本地开发中，
React Router 可以在冷 Vite 路由块提交之前更新地址栏，这使导航看起来
损坏，即使 URL 是正确的。

## 添加新路由

- **模式 #1**（`root.tsx` 中的 AppLayout）：只需渲染页面内容——不需要其他。
- **模式 #2**（无路径 `_app.tsx`）：将文件命名为 `_app.<segment>.tsx` 用于认证路由，或裸 `<segment>.tsx` 用于公共路由。

## 相关 Skill

- `adding-a-feature`——引用路由布局模式的四方面检查清单
- `context-awareness`——每次路由变更时写入的导航状态