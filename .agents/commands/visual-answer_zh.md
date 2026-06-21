---
description: "将代码/产品答案发布为可视 Plan 产物"
argument-hint: "<question>"
---

使用 `visual-answer` 技能。

通过先检查真实代码来回答 `$ARGUMENTS`。收集相关文件、API、schema、UI 状态和源 URL。在编写 MDX 之前调用 `get-plan-blocks` 或运行 `agent-native plan blocks --out plan-blocks.md`。

编写 `visual-answer-source.json`，包含：

- `question`
- `title`
- `brief`
- 已知时的 `repoPath`
- 已知时的 `sourceUrl`
- `mdx["plan.mdx"]` 使用已注册的 Plan 块

然后运行：

```sh
agent-native plan visual-answer publish --question "$ARGUMENTS" --source visual-answer-source.json
```

返回 `visual-answer-url.txt` 中的 URL 以及你检查的证据的简短摘要。不要内联粘贴完整的可视答案。