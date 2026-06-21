---
name: embeds
description: 内联、弹窗和浮动按钮嵌入 — 代码片段生成和主题化。
---

# 嵌入

## 模式

- **inline** — 嵌入页面中的 iframe
- **popup** — 触发器打开带 iframe 的模态覆盖层
- **element-click / floating-button** — 页面任意位置的固定定位触发器

## URL

嵌入页面：`/:user/:slug/embed` — 相同的 Booker，无边框，通过查询参数支持主题。

## 代码片段

```html
<script src="https://<host>/embed.js" async></script>
<div id="cal-inline-embed"></div>
<script>
  Cal("init", { origin: "https://<host>" });
  Cal("inline", {
    elementOrSelector: "#cal-inline-embed",
    calLink: "my-user/intro",
    config: { theme: "light" }
  });
</script>
```

## 主题化

嵌入 URL 上的查询参数：
- `theme=light|dark`
- `primaryColor=<hex>`
- `locale=en|es|...`
- `timeZone=America/Los_Angeles`

这些仅对嵌入会话覆盖事件类型的默认值。

## 消息传递

iframe 在生命周期事件时向父级发送消息：
`__cal.init`、`__cal.booking-successful`、`__cal.booking-cancelled`、`__cal.booking-rescheduled`。