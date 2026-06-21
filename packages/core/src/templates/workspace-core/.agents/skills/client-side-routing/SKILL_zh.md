---
name: client-side-routing
description: >-
  如何在不重新挂载应用外壳的情况下添加路由。在添加新路由、修复导航时 Agent 侧边栏重新加载或在 root.tsx 布局和无路径 _app.tsx 布局模式之间选择时使用。
metadata:
  internal: true
---

# 客户端路由

## 规则

所有模板都是使用 React Router 的单页应用。**导航不得重新挂载应用外壳。** Agent 侧边栏、文档树和任何其他持久化框架必须在路由变更后存活。

## 原因

如果外壳在每次导航时卸载，Agent 聊天会重新连接/重新加载，破坏正在进行的工作并冲击后端。

## 硬性规则

**应用外壳（AgentSidebar + 任何顶级导航）必须只挂载一次，在 `<Outlet />` 之上。** 永远不要将每个页面包裹在自己的 `<AppLayout>` / `<Layout>` 中。React 在每次导航时看到 outlet 位置的不同组件并卸载整个子树。

## 两种正确模式

### 1. 所有路由都需要外壳

在 `root.tsx` 中围绕 `<Outlet />` 挂载 `<AppLayout>`：

```tsx
// app/root.tsx
<AppLayout>
  <Outlet />
</AppLayout>
```

### 2. 受保护和公共路由混合

使用 React Router **无路径布局路由**：

```
app/routes/
  _app.tsx                  # 渲染 <AppLayout><Outlet /></AppLayout>
  _app._index.tsx           # / → 在 AppLayout 下
  _app.settings.tsx         # /settings → 在 AppLayout 下
  _app.team.tsx             # /team → 在 AppLayout 下
  book.$slug.tsx            # /book/:slug → 无布局（公共）
  f.$.tsx                   # /f/* → 无布局（公共表单填写）
```

`_app.tsx` 上的 `_` 前缀使其成为**无路径**父级 — 它贡献布局但不贡献 URL 段。以 `_app.` 为前缀的路由文件嵌套在它下面，并在导航间共享布局实例。

## 反模式

```tsx
// ❌ 错误 — 每个路由包裹自己的 Layout，导致每次导航时完全重新挂载
export default function Settings() {
  return (
    <AppLayout>
      <SettingsContent />
    </AppLayout>
  );
}
```

如果页面需要每路由数据（例如侧边栏高亮活动文档），在布局内从 `useParams()` / `useLocation()` 派生 — 不要通过每个路由文件作为 prop 传递。

## 聊天优先路由

如果 `/` 是全页聊天如 `AgentChatHome`，尽可能保持应用外壳挂载在它周围，这样 `AgentSidebar` URL 同步和路由预热保持活跃。如果聊天路由有意位于外壳之外，为 Agent 常从该聊天打开的路由添加一个微型应用自有预热。在本地开发中，React Router 可以在冷 Vite 路由块提交之前更新地址栏，这使得导航看起来有问题，即使 URL 是正确的。

## 添加新路由

- **模式 #1**（AppLayout 在 `root.tsx` 中）：只渲染页面内容 — 无其他。
- **模式 #2**（无路径 `_app.tsx`）：为认证路由命名文件为 `_app.<segment>.tsx`，或为公共路由命名为 `<segment>.tsx`。

## 相关技能

- `adding-a-feature` — 引用路由布局模式的四领域检查清单
- `context-awareness` — 每次路由变更时写入的导航状态