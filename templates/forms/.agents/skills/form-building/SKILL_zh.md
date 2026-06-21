---
name: form-building
description: >-
  如何创建和结构化表单。在创建新表单、添加字段、修改表单结构
  或了解字段类型及其 JSON schema 时使用。
---

# 表单构建

## 创建表单

使用 `create-form` 脚本从自然语言创建表单：

```bash
pnpm action create-form --title "Contact Form" --fields '[...]'
```

脚本生成唯一 ID，创建 URL slug，并将表单以 `draft` 状态存储在 SQL 中。

## 字段类型

| 类型          | 描述                    | 需要选项 | 使用示例               |
| ------------- | ----------------------- | -------- | ---------------------- |
| `text`        | 单行文本输入            | 否       | 姓名、公司             |
| `email`       | 带验证的电子邮件输入    | 否       | 联系邮箱               |
| `number`      | 数字输入                | 否       | 年龄、数量             |
| `textarea`    | 多行文本                | 否       | 消息、评论             |
| `select`      | 单选下拉                | 是       | 国家、部门             |
| `multiselect` | 多选下拉                | 是       | 技能、兴趣             |
| `checkbox`    | 布尔切换                | 否       | 同意、选择加入         |
| `radio`       | 单选按钮组              | 是       | 性别、偏好             |
| `date`        | 日期选择器              | 否       | 生日、截止日期         |
| `rating`      | 星级评分（1-5）         | 否       | 满意度、质量           |
| `scale`       | 数字刻度（如 1-10）     | 否       | NPS、可能性            |

## 字段 JSON Schema

每个字段是一个 JSON 对象：

```json
{
  "id": "field_name",
  "type": "text",
  "label": "Your Name",
  "placeholder": "Enter your name",
  "description": "Help text shown below the field",
  "required": true,
  "options": ["Option A", "Option B"],
  "validation": {
    "min": 1,
    "max": 100,
    "pattern": "^[a-zA-Z]+$",
    "message": "Custom error message"
  },
  "conditional": {
    "fieldId": "other_field_id",
    "operator": "equals",
    "value": "show_this_field"
  },
  "width": "full"
}
```

### 必需属性
- `id` — 唯一标识符（推荐 snake_case）
- `type` — 上述类型之一
- `label` — 显示标签
- `required` — 布尔值

### 可选属性
- `placeholder` — 输入占位符文本
- `description` — 字段下方的帮助文本
- `options` — 字符串数组（select、multiselect、radio 必需）
- `validation` — min/max/pattern/message 用于自定义验证
- `conditional` — 仅当另一个字段匹配条件时显示字段
- `width` — `"full"`（默认）或 `"half"` 用于并排布局

## 更新表单

使用 `update-form` 修改任何表单属性：

```bash
# 更改标题
pnpm action update-form --id <id> --title "New Title"

# 更新字段
pnpm action update-form --id <id> --fields '[...]'

# 更改状态
pnpm action update-form --id <id> --status published
```

## 常见表单模板

当用户要求常见表单类型时，使用这些字段模式：

**联系表单：**
```json
[
  {"id":"name","type":"text","label":"Name","required":true},
  {"id":"email","type":"email","label":"Email","required":true},
  {"id":"message","type":"textarea","label":"Message","required":true}
]
```

**调查/反馈：**
```json
[
  {"id":"rating","type":"rating","label":"Overall satisfaction","required":true},
  {"id":"recommend","type":"scale","label":"How likely to recommend? (1-10)","required":true},
  {"id":"feedback","type":"textarea","label":"Additional feedback","required":false}
]
```

**注册/报名：**
```json
[
  {"id":"first_name","type":"text","label":"First Name","required":true,"width":"half"},
  {"id":"last_name","type":"text","label":"Last Name","required":true,"width":"half"},
  {"id":"email","type":"email","label":"Email","required":true},
  {"id":"role","type":"select","label":"Role","options":["Student","Professional","Other"],"required":true}
]
```

## 工作流

1. 使用标题和字段 `create-form`
2. 在 GUI 中预览（智能体 + 用户迭代）
3. `update-form --status published` 上线
4. 分享公共 URL：`/f/<slug>`

## 相关技能

- **form-responses** — 查看和分析提交的数据
- **form-publishing** — 表单生命周期（草稿 -> 已发布 -> 已关闭）
- **scripts** — 所有表单操作通过脚本进行