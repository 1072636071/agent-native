---
name: visual-answer
description: >-
  使用仓库、桥接或 GitHub 上下文将代码/产品问题回答为可视 Plan 产物；用于 API 规范、UI 外观、schema 模型和架构。
metadata:
  visibility: exported
---

# Visual Answer

`/visual-answer` 将特定的代码或产品问题转化为已发布的 Agent-Native Plan 产物。它用于需要可视化、可检查答案而非聊天段落的问题：API 契约、schema/数据模型、UI 状态、组件行为、架构流程和代码证据。

## 何时使用

当用户问以下问题时使用此技能：

- "这个的 API 规范是什么？"
- "这个 UI 长什么样？"
- "x 的 schema 模型是什么？"
- "画出这个代码路径的流程"
- "展示这个组件/API/数据模型的当前形态"

对于关于更改或发布了什么的历史问题，先用 `search-pr-recaps` 搜索已合并的 PR 回顾，然后用 `show-visual-plan` 将相关结果拉入对话（它内联渲染该 plan 或回顾的块）。仅当你需要完整的 bundle/MDX 来编辑时才使用 `get-visual-plan`，而非用于显示。当需要检查当前代码库、本地桥接或 GitHub 源以产生新答案时，使用 `visual-answer`。

## 工作流

1. 首先检查真实源代码。使用宿主 agent 的仓库工具、Plan 本地桥接或 GitHub/源链接。不要编造端点、schema 字段、UI 状态、文件名或行为。
2. 在编写前调用 `get-plan-blocks`。使用实时注册表，而非记忆。如果问题问有哪些组件可用，调用 `list-plan-components`。
3. 选择证据块：
   - API 形状：`openapi-spec` 加 `api-endpoint`；仅在比较回顾的历史更改时使用 before/after。
   - UI 外观：`wireframe` 或在比较回顾时的 `columns` before/after 对。
   - Schema/数据模型：`data-model`，可选加 `diagram`。
   - 代码证据：`file-tree`、`tabs`、`annotated-code`，以及当答案取决于实现细节时的 `diff`。
4. 使用 Plan `visual-answer` action 发布。包含用户的问题、已知时的 `repoPath`/`sourceUrl`、简洁的标题/简介，以及 `mdx` 下的 MDX 源。
5. 在 Agent-Native 聊天中，已发布的答案自动内联渲染 — 其块出现在对话中。添加一行证据摘要加深链接；不要将原始 MDX 或块源作为文本粘贴。（在无法渲染块的终端或外部 MCP 主机中，返回 URL。）

## 终端交接

从终端或编码 agent shell 运行时，写入 `visual-answer-source.json`：

```json
{
  "question": "What is the billing API shape?",
  "title": "Billing API visual answer",
  "brief": "Shows the request and response contract.",
  "repoPath": "owner/repo",
  "sourceUrl": "https://github.com/owner/repo",
  "mdx": {
    "plan.mdx": "---\ntitle: Billing API visual answer\n---\n\n..."
  }
}
```

然后发布：

```sh
agent-native plan visual-answer publish --question "What is the billing API shape?" --source visual-answer-source.json --repo owner/repo
```

使用 `--source-url` 传递 GitHub 文件/PR/提交/issue URL，`--prev-plan-id` 刷新现有答案，`--visibility private` 用于仅所有者输出。命令写入 `visual-answer-url.txt`。

## 不要

- 不要将 `visual-answer` 用于纯实现计划；使用 `visual-plan`。
- 不要将其用于 PR diff 回顾；使用 `visual-recap`。
- 不要跳过代码检查仅从名称推断。
- 不要发布截图、密钥、看起来像凭据的值或超出用户要求可视化的私有源摘录。

## 相关技能

- `visual-plan`
- `visual-recap`
- `delegate-to-agent`
- `context-awareness`