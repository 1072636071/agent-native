---
name: create-skill
description: >-
  如何为 agent-native 应用创建新 skill。在添加新 skill、文档化 agent
  应遵循的模式或创建可复用的 agent 指导时使用。
metadata:
  internal: true
---

# 创建 Skill

## 何时使用

在以下情况创建新 skill：

- 有一个 agent 应反复遵循的模式。
- 多步工作流需要可靠的逐步指导。
- 你想从模板脚手架文件。

不要在以下情况创建 skill：

- 指导已存在于另一个 skill 中——扩展它代替。
- 你在文档化 agent 已经知道的东西（例如如何写 TypeScript）。
- 是一次性的——放在 `AGENTS.md`（给所有人）或 `memory/MEMORY.md`（个人，每用户）。参见 **capture-learnings**。

## 访谈

在编写 skill 之前，回答这些问题：

1. **此 skill 应该启用什么？**——一句话的核心目的。
2. **它服务于四个方面中的哪个？**——UI、action、skill/指令或应用状态（见 **adding-a-feature** skill）。大多数 skill 是关于如何正确触及其中一个或多个。
3. **何时应触发？**——用自然语言描述情况。稍微激进——过度触发比触发不足好。
4. **它是否涉及上下文感知？**——Agent 是否需要知道用户正在查看什么？如果是，引用 `navigation` 应用状态键和 `view-screen` action 模式。参见 **context-awareness** skill。
5. **什么类型的 skill？**——模式、工作流或生成器（见下文）。
6. **它需要支持文件吗？**——参考（只读上下文）或无。保持最小；将深度推入 `references/`。

## Skill 类型和模板

### 模式（架构规则）

用于文档化事情应该如何做：

```markdown
---
name: my-pattern
description: >-
  [Under 40 words. What it covers AND when it should trigger.]
---

# [Pattern Name]

## Rule

[One sentence: what must be true]

## Why

[Why this rule exists]

## How

[How to follow it, with code examples]

## Don't

[Common violations]

## Related Skills

[Which skills compose with this one]
```

### 工作流（逐步）

用于多步实现任务：

```markdown
---
name: my-workflow
description: >-
  [Under 40 words. What it covers AND when it should trigger.]
---

# [Workflow Name]

## Prerequisites

[What must be in place first]

## Steps

[Numbered steps with code examples]

## Verification

[How to confirm it worked]

## Troubleshooting

[Common issues and fixes]

## Related Skills
```

### 生成器（脚手架）

用于从模板创建文件：

```markdown
---
name: my-generator
description: >-
  [Under 40 words. What it covers AND when it should trigger.]
---

# [Generator Name]

## Usage

[How to invoke — what args/inputs are needed]

## What Gets Created

[List of files and their purpose]

## Template

[The template content with placeholders]

## After Generation

[What to do next — wire up sync, add routes, register the action, etc.]

## Related Skills
```

## 命名约定

- 仅使用连字符格式：`[a-z0-9-]`，最多 64 个字符。
- 模式 skill：描述性名称（`storing-data`、`delegate-to-agent`）。
- 工作流/生成器 skill：动词-名词（`create-skill`、`capture-learnings`）。
- 目录名必须与 frontmatter 中的 `name` 匹配。

## Skill 范围（运行时 vs 开发）

可选的 `scope` frontmatter 字段控制哪个 agent 加载 skill：

- `both`（省略时默认）——由应用内运行时 agent 加载。用于运行时 agent 应遵循的任何 skill。
- `runtime`——仅由应用内运行时 agent 加载。
- `dev`——仅用于人类的编码 agent（如 Claude Code）。**从运行时 agent 的所有地方排除**：不在系统 prompt skill 块中，不在 `docs-search` 结果中。

```markdown
---
name: release-checklist
description: >-
  Steps for cutting a release. Use when preparing or publishing a new version.
scope: dev
---
```

对于普通 skill 省略 `scope`——默认（`both`）保持它们在运行时加载，因此完全向后兼容。要使仅开发 skill 对你的编码 agent 可见但对运行时 agent 隐藏，标记为 `scope: dev` 并可选地镜像到 `.claude/skills/<name>/SKILL.md`（Claude Code 独立于运行时的 `.agents/skills/` 读取 `.claude/skills/`）。

## 提示

- **保持描述在 40 词以内**——它们在每次对话中加载到上下文中。说明 skill 做什么以及何时触发。
- **保持 SKILL.md 精简（约 500 行以内）**——将详细内容移到 `references/` 文件（渐进式展示）。
- **使用标准 markdown 标题**——不要 XML 标签或自定义格式。

## 反模式

- **内联 LLM 调用**——skill 不得直接调用 LLM。所有 AI 工作通过 agent 聊天（见 **delegate-to-agent**）。
- **引入数据库**——数据通过 Drizzle 存储在 SQL 中（见 **storing-data**）。
- **忽略同步**——如果 skill 创建数据，提及连接 `useDbSync` / `useActionQuery` 以便 UI 更新（见 **real-time-sync**）。
- **模糊描述**——"帮助开发"不会触发。要具体说明_何时_。
- **纯文档**——skill 应指导行动，而不仅是解释概念。

## 文件结构

```
.agents/skills/my-skill/
├── SKILL.md              # 主 skill（必需）
└── references/           # 可选的支持上下文
    └── detailed-guide.md
```

## 相关 Skill

- **adding-a-feature**——每个 skill 最终服务的四方面模型。
- **writing-agent-instructions**——如何为发布给他人的应用和模板写好 AGENTS.md 和 skill。
- **capture-learnings**——当学习毕业为可复用指导时，创建 skill；一次性的放到 `AGENTS.md` 或 `memory/MEMORY.md`。
- **self-modifying-code**——Agent 可以创建新 skill（第 2 层修改）。