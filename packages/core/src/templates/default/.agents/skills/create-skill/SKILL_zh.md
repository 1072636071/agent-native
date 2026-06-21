---
name: create-skill
description: >-
  如何为 Agent-Native 应用创建新技能。在添加新技能、记录 Agent 应遵循的模式或创建可复用的 Agent 指导时使用。
metadata:
  internal: true
---

# 创建技能

## 何时使用

在以下情况创建新技能：

- 有一个 Agent 应该反复遵循的模式。
- 多步骤工作流需要可靠的逐步指导。
- 你想从模板脚手架文件。

不要在以下情况创建技能：

- 指导已存在于另一个技能中 — 改为扩展它。
- 你在记录 Agent 已经知道的东西（例如如何写 TypeScript）。
- 是一次性的 — 放在 `AGENTS.md`（给所有人）或 `memory/MEMORY.md`（个人，每用户）。参见 **capture-learnings**。

## 访谈

在编写技能之前，回答这些问题：

1. **这个技能应该实现什么？** — 一句话核心目的。
2. **它服务于四个领域中的哪个？** — UI、action、技能/指令或应用状态（参见 **adding-a-feature** 技能）。大多数技能是关于如何正确触及其中一个或多个。
3. **何时应该触发？** — 用自然语言描述情况。稍微激进一点 — 过度触发比欠触发好。
4. **它涉及上下文感知吗？** — Agent 是否需要知道用户正在查看什么？如果是，引用 `navigation` 应用状态键和 `view-screen` action 模式。参见 **context-awareness** 技能。
5. **什么类型的技能？** — 模式、工作流或生成器（见下文）。
6. **它需要支持文件吗？** — 参考（只读上下文）或无。保持最小；将深度推入 `references/`。

## 技能类型和模板

### 模式（架构规则）

用于记录事情应该如何做：

```markdown
---
name: my-pattern
description: >-
  [40 字以内。涵盖什么以及何时应触发。]
---

# [模式名称]

## 规则

[一句话：什么必须为真]

## 原因

[为什么存在此规则]

## 如何操作

[如何遵循，附代码示例]

## 禁止

[常见违规]

## 相关技能

[哪些技能与此组合]
```

### 工作流（逐步）

用于多步骤实现任务：

```markdown
---
name: my-workflow
description: >-
  [40 字以内。涵盖什么以及何时应触发。]
---

# [工作流名称]

## 前提

[必须先具备什么]

## 步骤

[带代码示例的编号步骤]

## 验证

[如何确认它有效]

## 故障排除

[常见问题和修复]

## 相关技能
```

### 生成器（脚手架）

用于从模板创建文件：

```markdown
---
name: my-generator
description: >-
  [40 字以内。涵盖什么以及何时应触发。]
---

# [生成器名称]

## 用法

[如何调用 — 需要什么参数/输入]

## 创建什么

[文件列表及其用途]

## 模板

[带占位符的模板内容]

## 生成后

[接下来做什么 — 接入同步、添加路由、注册 action 等]

## 相关技能
```

## 命名约定

- 仅使用连字符小写：`[a-z0-9-]`，最多 64 字符。
- 模式技能：描述性名称（`storing-data`、`delegate-to-agent`）。
- 工作流/生成器技能：动词-名词（`create-skill`、`capture-learnings`）。
- 目录名必须与 frontmatter 中的 `name` 匹配。

## 技能作用域（运行时 vs 开发）

可选的 `scope` frontmatter 字段控制哪个 Agent 加载技能：

- `both`（省略时的默认值）— 由应用内运行时 Agent 加载。用于运行时 Agent 应遵循的任何技能。
- `runtime` — 仅由应用内运行时 Agent 加载。
- `dev` — 仅用于人类的编码 Agent（如 Claude Code）。**在所有地方从运行时 Agent 中排除**：不在系统提示技能块中，不在 `docs-search` 结果中。

```markdown
---
name: release-checklist
description: >-
  发布版本的步骤。在准备或发布新版本时使用。
scope: dev
---
```

对于正常技能，不要设置 `scope` — 默认值（`both`）使它们在运行时加载，这完全向后兼容。要使仅开发技能对你的编码 Agent 可见但对运行时 Agent 隐藏，标记为 `scope: dev` 并可选地在 `.claude/skills/<name>/SKILL.md` 下镜像它（Claude Code 独立于运行时的 `.agents/skills/` 读取 `.claude/skills/`）。

## 提示

- **保持描述在 40 字以内** — 它们在每次对话中加载到上下文中。说明技能做什么以及何时触发它。
- **保持 SKILL.md 精简（约 500 行以内）** — 将详细内容移到 `references/` 文件（渐进式披露）。
- **使用标准 Markdown 标题** — 不要 XML 标签或自定义格式。

## 反模式

- **内联 LLM 调用** — 技能不得直接调用 LLM。所有 AI 工作通过 Agent 聊天进行（参见 **delegate-to-agent**）。
- **引入数据库** — 数据通过 Drizzle 存在于 SQL 中（参见 **storing-data**）。
- **忽略同步** — 如果技能创建数据，提及接入 `useDbSync` / `useActionQuery` 以便 UI 更新（参见 **real-time-sync**）。
- **模糊描述** — "帮助开发"不会触发。对_何时_要具体。
- **纯文档** — 技能应该指导行动，而不仅仅是解释概念。

## 文件结构

```
.agents/skills/my-skill/
├── SKILL.md              # 主技能（必需）
└── references/           # 可选的支持上下文
    └── detailed-guide.md
```

## 相关技能

- **adding-a-feature** — 每个技能最终服务的四领域模型。
- **writing-agent-instructions** — 如何为发布给他人的应用和模板写好 AGENTS.md 和技能。
- **capture-learnings** — 当学习毕业为可复用指导时，创建技能；一次性的放入 `AGENTS.md` 或 `memory/MEMORY.md`。
- **self-modifying-code** — Agent 可以创建新技能（层级 2 修改）。