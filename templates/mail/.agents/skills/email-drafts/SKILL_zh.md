# 邮件草稿

创建、编辑和管理邮件草稿。每个草稿存储为一个以 `compose-{id}` 为键的 application state 条目。UI 通过框架轮询/查询失效路径刷新，并自动更新撰写面板。

## 存储

草稿通过 `@agent-native/core/application-state` 中的 `writeAppState("compose-{id}", draft)` 存储在 `application_state` SQL 表中。每个条目是一个草稿。多个草稿可以同时存在 — 它们在撰写面板中显示为标签页。

## Schema

```json
{
  "id": "abc123",
  "to": "recipient@example.com",
  "cc": "",
  "bcc": "",
  "subject": "会议跟进",
  "body": "大家好，\n\n感谢今天精彩的讨论...",
  "mode": "compose",
  "replyToId": "",
  "replyToThreadId": ""
}
```

### 字段

| 字段               | 类型   | 必需 | 描述                                         |
| ------------------ | ------ | ---- | -------------------------------------------- |
| `id`               | string | 是   | 唯一草稿 ID（必须与键后缀匹配）             |
| `to`               | string | 是   | 逗号分隔的收件人电子邮件地址                 |
| `cc`               | string | 否   | 逗号分隔的 CC 地址                           |
| `bcc`              | string | 否   | 逗号分隔的 BCC 地址                          |
| `subject`          | string | 是   | 邮件主题行                                   |
| `body`             | string | 是   | **markdown** 格式的邮件正文（见下方格式说明） |
| `mode`             | string | 是   | 以下之一：`"compose"`、`"reply"`、`"forward"` |
| `replyToId`        | string | 否   | 被回复的消息 ID（用于回复/转发）             |
| `replyToThreadId`  | string | 否   | 用于分组的线程 ID（用于回复/转发）           |

## 正文格式

`body` 字段使用 **markdown**。撰写编辑器（TipTap）将其渲染为富文本，发送流程在通过 Gmail 发送前将 markdown 转换为 HTML。使用标准 markdown 语法：

- **链接：** `[点击这里](https://example.com)` — 在发送的邮件中渲染为可点击的超链接
- **粗体：** `**粗体文本**`
- **斜体：** `*斜体文本*`
- **列表：** `- 项目`（无序）或 `1. 项目`（有序）
- **标题：** `# 标题`（h1–h3）
- **代码：** `` `行内代码` `` 或围栏代码块
- **引用：** `> 引用文本`
- **裸 URL：** `https://example.com` 自动链接

不要使用原始 HTML 标签 — 仅使用 markdown。

## 签名和风格设置

在创建或重写草稿之前，使用 `pnpm action get-mail-settings` 读取用户的撰写设置。

- 当配置了 `signature` 时，完全使用它；不要重写或重复它。
- 如果没有配置签名，省略签名。绝不要从用户名、电子邮件地址或连接的个人资料中派生签名。
- 当存在 `writingStyle` 时遵循它。
- 保持生成的文案自然且具体。避免通用的 AI 邮件套路、标题和过度正式的填充词，除非用户要求那种风格。

## 工作原理

1. **写入** `writeAppState("compose-{id}", draft)` — 共享的 application state 行变更
2. **UI 轮询检测到变更** — 使 `compose-drafts` React Query 缓存失效
3. **撰写面板重新渲染** — 将更新的草稿显示为标签页，如果是新的则切换到它

当存在任何撰写草稿时，撰写面板自动打开。当最后一个草稿被删除时，面板关闭。

## 创建新草稿

使用 manage-draft 脚本或直接写入：

```bash
pnpm action manage-draft --action=create --to=jane@example.com --subject="Quick question" --body="Hi Jane,\n\nJust wanted to follow up on..."
```

或从代码：
```ts
import { writeAppState } from "@agent-native/core/application-state";
await writeAppState("compose-draft1", {
  id: "draft1",
  to: "jane@example.com",
  subject: "Quick question",
  body: "Hi Jane,\n\nJust wanted to follow up on...",
  mode: "compose",
});
```

## 编辑现有草稿

读取当前草稿，修改它，写回：

```ts
import { readAppState, writeAppState } from "@agent-native/core/application-state";
const draft = await readAppState("compose-draft1");
draft.body = "Hi Jane,\n\nI refined the draft as requested...";
await writeAppState("compose-draft1", draft);
```

## 列出所有草稿

```bash
pnpm action view-composer
```

或从代码：
```ts
import { listAppState } from "@agent-native/core/application-state";
const drafts = await listAppState("compose-");
```

## 关闭草稿

```ts
import { deleteAppState } from "@agent-native/core/application-state";
await deleteAppState("compose-draft1");
```

## 附件

`send-email` action 接受可选的 `attachments` 数组。每个条目必须引用先前通过 media-upload 端点（`/api/media/upload`）上传的文件。传递服务器端的 `filename`（上传端点返回的键，如 `abc123.pdf`），以及可选的 `originalName`（收件人的显示名称）和 `mimeType`。附件管道从上传存储解析文件（回退到 `data/uploads/`）并将其作为 MIME 多部分附件包含在发出的 Gmail 消息中。文件永远不会被推测性发送 — 仅附加用户已明确提供和确认的内容。

示例：
```json
{
  "to": "recipient@example.com",
  "subject": "Q2 报告",
  "body": "请查收附件中的报告。",
  "attachments": [
    { "filename": "abc123.pdf", "originalName": "Q2-Report.pdf", "mimeType": "application/pdf" }
  ]
}
```

## 重要说明

- JSON 中的 `id` 字段必须与键名中的 `{id}` 匹配（`compose-{id}`）
- UI 对写入有 300ms 的防抖 — 如果用户正在活跃输入，你的写入将在短暂延迟后可见
- 始终使用带有正确转义的有效 JSON（特别是正文中的换行：使用 `\n`）
- 多个草稿可以同时存在 — 每个在撰写面板中显示为标签页
- 当用户要求你"撰写"或"起草"邮件时，写入一个撰写条目 — 不要直接使用发送 API
- 当用户要求你"编辑"或"改进"草稿时，首先列出草稿，然后读取并更新相关草稿
- **当从撰写生成按钮调用时：** 上下文告诉你更新哪个草稿（如 `compose-abc123`）。始终更新该条目 — 不要用不同的 ID 创建新条目。读取、修改并写回到相同的键。
- **当从零开始撰写（没有撰写窗口打开）时：** 使用任何唯一 ID 创建新条目