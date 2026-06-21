---
name: routing-forms
description: ChiliPiper 风格的预约前表单，根据回答将潜在客户路由到正确的事件类型。
---

# 路由表单

## 结构

- **字段** — 文本、邮箱、电话、数字、下拉选择、多选
- **规则** — `{conditions, action}` 的有序列表
- **回退** — 没有规则匹配时采取的操作

## 规则条件

`conditions: [{fieldId, op, value}, …]` — 所有条件以 AND 连接。操作符：
- `equals`、`not-equals`、`contains`、`starts-with`、`in`（值为数组）

## 规则操作

- `{kind: "event-type", eventTypeId, teamId?}` → 重定向到 Booker
- `{kind: "external-url", url}` → 重定向到外部站点
- `{kind: "custom-message", message}` → 渲染消息，无预约

## 公共 URL

`/forms/:formId` 渲染表单。提交时：
1. 按顺序遍历规则；第一个匹配的生效。
2. 如果没有匹配，使用 `fallback`。
3. 在 `routing_form_responses` 中记录响应，附带 `matchedRuleId`。
4. 如果操作是 `event-type`，重定向到 Booker，并从表单答案预填充 `name` / `email` / 自定义字段值。

## 常见任务

| 用户 | 操作 |
|---|---|
| "将企业潜在客户路由到 Bob" | `create-routing-form`，添加匹配公司规模的规则 → Bob 的事件类型 |
| "查看提交记录" | `list-routing-form-responses --formId <id>` |