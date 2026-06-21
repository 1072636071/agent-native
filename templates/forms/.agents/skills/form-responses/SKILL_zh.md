---
name: form-responses
description: >-
  如何查看、导出和分析表单响应。在用户询问提交数据、想要导出响应
  或需要响应分析时使用。
---

# 表单响应

## 查看响应

使用 `list-responses` 查看特定表单的提交：

```bash
pnpm action list-responses --form <form-id> [--limit 50]
```

这显示每个响应的字段标签和值，按提交日期排序（最新优先）。

对于图表/表格分析，优先使用 `response-insights`：

```bash
# 所有最近可访问的表单
pnpm action response-insights

# 一个表单
pnpm action response-insights --formId <form-id> --days 30 --limit 300
```

`response-insights` 返回显式的第一方小部件载荷：

- `widget: "data-insights"`
- `chartSeries` 用于按天的提交
- `table` 用于最近的响应行
- `summary` 包含总数、采样和截断详情

原生聊天渲染器应使用该契约处理第一方表格/图表。
MCP App/iframe 渲染仅是外部主机的回退。

对于表单设置/配置预览，使用 `preview-form`：

```bash
pnpm action preview-form --formId <form-id>
```

它返回原生内联摘要/表格，包含表单字段、响应计数、
状态、可见性和"打开编辑器"操作。

## 导出响应

使用 `export-responses` 导出为 CSV 或 JSON：

```bash
# CSV 导出（默认）
pnpm action export-responses --form <form-id> --output data/export.csv

# JSON 导出
pnpm action export-responses --form <form-id> --output data/export.json --format json
```

CSV 包含从字段标签派生的标题。数组值（多选）用分号连接。

## 响应数据结构

每个响应存储在 `responses` SQL 表中：

| 列            | 类型 | 描述                              |
| ------------- | ---- | --------------------------------- |
| `id`          | text | 唯一响应 ID                       |
| `formId`      | text | 表单的外键                        |
| `data`        | text | 字段 ID -> 值映射的 JSON 字符串   |
| `submittedAt` | text | ISO 时间戳                        |

`data` JSON 将字段 ID 映射到值：

```json
{
  "name": "Alice Smith",
  "email": "alice@example.com",
  "rating": 5,
  "interests": ["design", "development"]
}
```

## 分析响应

要分析响应，工作流程是：

1. `list-forms` 查找表单 ID
2. 当问题是关于设置或字段时，使用 `preview-form --formId <id>`
3. `response-insights --formId <id>` 获取计数、每日提交和表格数据
4. 仅当需要精确的行级检查时使用 `list-responses --formId <id>`
5. 报告答案是精确的还是采样的，包括行计数和截断

## 常见任务

| 用户请求               | 操作                                                                   |
| ---------------------- | ---------------------------------------------------------------------- |
| "@表单设置？"          | `preview-form --formId <id>` 并从返回的字段/设置回答                   |
| "有多少响应？"         | `response-insights --formId <id>` 并报告 `summary.responses`           |
| "导出为 CSV"           | `export-responses --form <id> --output data/export.csv`                |
| "按天的提交"           | `response-insights --formId <id> --days 30`                            |
| "总结反馈"             | `response-insights`，然后如果需要更多细节则 `list-responses`           |
| "平均评分"             | `list-responses`，从评分字段计算并说明采样的行计数                     |
| "今天谁提交了？"       | `list-responses`，按 submittedAt 过滤                                  |

## 相关技能

- **form-building** — 理解表单结构和字段类型
- **actions** — 所有响应操作通过 action 进行