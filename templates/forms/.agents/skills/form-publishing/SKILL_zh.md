---
name: form-publishing
description: >-
  表单生命周期管理：草稿、已发布、已关闭。在发布表单、了解公共 URL、
  配置验证码或管理表单品牌时使用。
---

# 表单发布

## 表单生命周期

表单经历三种状态：

| 状态         | 含义                                 | 公共访问       |
| ------------ | ------------------------------------ | -------------- |
| `draft`      | 进行中，不可公开访问                 | 否             |
| `published`  | 已上线并接受响应                     | 是             |
| `closed`     | 不再接受响应                         | 显示关闭消息   |

## 发布表单

```bash
# 创建为草稿（默认）
pnpm action create-form --title "Survey" --fields '[...]'

# 准备好后发布
pnpm action update-form --id <form-id> --status published

# 收集完响应后关闭
pnpm action update-form --id <form-id> --status closed
```

## 公共 URL

已发布的表单可通过以下地址访问：

```
/f/<slug>
```

Slug 从标题 + 短唯一后缀自动生成：
- 标题："Contact Form" -> Slug: `contact-form/a1b2c3`
- 完整 URL: `https://yourapp.com/f/contact-form/a1b2c3`

当标题更改时，Slug 自动更新。

## 验证码保护

公共表单提交可以使用 Cloudflare Turnstile 保护（可选）。这可以在不降低用户体验的情况下防止机器人提交。

## 品牌

公共表单默认显示"Built with Agent Native"徽章。这可以在表单设置中配置。

## 表单设置

每个表单有一个 `settings` JSON 对象：

```json
{
  "submitText": "Submit",
  "successMessage": "Thank you! Your response has been recorded.",
  "redirectUrl": null,
  "showProgressBar": false,
  "integrations": []
}
```

| 设置               | 类型    | 描述                                 |
| ------------------ | ------- | ------------------------------------ |
| `submitText`       | string  | 自定义提交按钮文本                   |
| `successMessage`   | string  | 成功提交后显示的消息                 |
| `redirectUrl`      | string  | 提交后重定向到的 URL                 |
| `showProgressBar`  | boolean | 为多节表单显示进度条                 |
| `integrations`     | array   | Webhook/Slack/Discord 通知配置       |

## 集成类型

表单可以在提交时通知外部服务：

| 类型            | 描述                     |
| --------------- | ------------------------ |
| `webhook`       | POST JSON 到任何 URL     |
| `slack`         | 发送到 Slack 频道        |
| `discord`       | 发送到 Discord webhook   |
| `google-sheets` | 追加行到 Google Sheet    |

## 相关技能

- **form-building** — 创建和结构化表单
- **form-responses** — 在表单发布后查看数据