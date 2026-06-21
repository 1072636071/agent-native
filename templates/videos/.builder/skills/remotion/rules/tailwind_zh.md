---
name: tailwind
description: 在 Remotion 中使用 TailwindCSS。
metadata:
---

如果项目中安装了 TailwindCSS，你可以在 Remotion 中使用它。

不要使用 `transition-*` 或 `animate-*` 类 — 始终使用 `useCurrentFrame()` 钩子进行动画。

Tailwind 必须先在 Remotion 项目中安装和启用 — 使用 WebFetch 获取 https://www.remotion.dev/docs/tailwind 的说明。