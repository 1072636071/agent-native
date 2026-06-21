---
name: inline-embeds
description: >-
  如何通过沙箱 iframe 在 agent 聊天中内联渲染应用屏幕的交互式预览。
  涵盖 `embed` 围栏语法、`postNavigate` 弹出辅助函数，以及何时
  优先使用嵌入而非文字/静态图片。
---

# 内联嵌入

聊天渲染器允许你嵌入一个指向此应用任何同源路由的沙箱 iframe，与你的回复一起内联渲染。当实时、交互式的预览比文字或静态截图更能传达信息时使用——图表、邮件线程、幻灯片、表单、工单。

## `embed` 围栏

发出一个语言为 `embed` 的围栏代码块：

````
```embed
src: /email?id=msg_123
aspect: 4/3
title: Re: Q4 planning
```
````

键：

| 键      | 必需 | 备注                                                              |
| -------- | -------- | ------------------------------------------------------------------ |
| `src`    | 是      | 以 `/` 开头的同源路径。跨域 URL 被阻止 |
| `aspect` | 否       | `16/9`（默认）、`4/3`、`3/2`、`2/1`、`21/9`、`1/1`               |
| `title`  | 否       | 可访问性标签 + 悬停工具提示                                   |
| `height` | 否       | 当宽高比不合适时的固定像素高度                   |

渲染的 iframe 是沙箱化的（`allow-scripts allow-same-origin allow-forms allow-popups`）并且 `referrerpolicy="same-origin"`。浏览器强制 iframe 不能导航父窗口。

## 何时使用嵌入

- 受益于工具提示/悬停的图表或可视化。
- 用户可能想要浏览的详情视图（邮件、工单、事件、幻灯片）。
- "这里有一个链接"会强制额外点击的任何情况。

**不要**在纯文字、项目列表或小表格足够时使用嵌入。
**不要**嵌入外部网站——渲染器阻止跨域 URL。

## "在主窗口中打开"按钮 — `postNavigate`

每个嵌入路由应包含一个小的"打开"按钮，以便用户可以将视图从聊天中弹出并进入完整应用。从 `@agent-native/core/client` 导入辅助函数：

```tsx
import { postNavigate, isInAgentEmbed } from "@agent-native/core/client";

export function OpenButton({ path }: { path: string }) {
  if (!isInAgentEmbed()) return null;
  return (
    <button onClick={() => postNavigate(path)}>Open</button>
  );
}
```

`postNavigate` 向父聊天窗口发送 `postMessage`。聊天渲染器验证消息是同源、同 iframe 且路径是相对的，然后通过 `history.pushState` 更新父 URL，使 react-router 在不重新加载页面的情况下导航。

当页面直接加载（不在 iframe 中）时，`postNavigate` 回退到同窗口导航，因此按钮在两种情况下都能工作。

## 向模板添加嵌入路由

1. 创建一个无外壳路由（如 `app/routes/email.tsx`），渲染不带应用外壳的详情视图。
2. 在 `app/components/layout/Layout.tsx` 中将路由路径标记为裸路径，这样侧边栏/头部不会在 iframe 内渲染。
3. 用透明背景渲染现有的详情组件，使其融入聊天主题。
4. 包含一个调用 `postNavigate("/path/to/detail")` 的 `<OpenButton>`。
5. 在此模板的 `AGENTS.md` 中记录嵌入 URL，以便 agent 知道什么是可嵌入的。

框架级别的围栏渲染器和安全强制自动应用——除了路由和布局绕过之外，无需按模板配置。