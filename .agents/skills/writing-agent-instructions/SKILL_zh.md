---
name: writing-agent-instructions
description: >-
  如何为 agent-native 应用或模板编写优秀的 agent 指令：AGENTS.md、技能和工具/action 描述。在编写或审查 AGENTS.md、编写 SKILL.md、措辞 action 描述、或决定什么属于指令 vs 技能 vs 记忆时使用。
metadata:
  internal: true
---

# 编写 Agent 指令和技能

这是一个面向创建者的指南。当你构建 agent-native 应用或模板时，agent 的行为仅与你给出的指令一样好。三个表面承载该指导：`AGENTS.md`（地图）、技能（深入探讨）和 action/工具描述（agent 如何选择正确的工具）。为每个表面编写以实现快速检索，而非散文。

## 保持 AGENTS.md 小巧且可扫读

`AGENTS.md` 作为方向加载。它应该是最小的东西，让 agent 正确行动，所有深入内容推入技能。目标是这些部分，别无其他：

- **目的行** — 一句话说明应用是什么和主要工作流。
- **核心规则** — 必须始终成立的少数不变量（数据在 SQL 中、操作通过 action、AI 通过 agent 聊天、schema 更改是附加的）。简短的祈使句要点。
- **Application-state 键** — agent 读取以了解用户正在查看什么的 `navigation`/选择/聚焦键，及其形状。
- **Action 表** — action 名称 -> 用途的紧凑表格（见下方）。
- **技能索引** — 存在的技能列表以及何时读取每个技能。

如果一个部分增长超过一屏，它属于技能。`AGENTS.md` 回答"这是什么应用，我能做什么"，而非"我到底怎么做那件难事"。

```markdown
# Projects 应用

项目、任务和笔记的一个工作区。Agent 和 UI 共享相同的 SQL 数据和相同的 action。

## 核心规则

- 数据通过 Drizzle 存储在 SQL 中。使用 action 进行所有写入。
- 所有 AI 工作通过 agent 聊天；切勿内联调用 LLM。
- Schema 更改仅限附加。

## Application State

- `navigation.view`：`home` | `project`
- `navigation.projectId`：项目页面上的选定项目

## Actions

| Action           | 用途                     |
| ---------------- | ------------------------ |
| `list-projects`  | 列出可访问的项目         |
| `create-project` | 创建项目                 |
| `update-project` | 重命名或归档项目         |

## 技能

- `project-imports` — 导入遗留 CSV 导出前阅读。
- `sharing` — 向其他用户暴露项目前阅读。
```

## 单一来源 AGENTS.md（CLAUDE.md 是符号链接）

保持一个规范的指令文件：`AGENTS.md`。如果客户端期望 `CLAUDE.md`，将其作为指向 `AGENTS.md` 的符号链接而非第二个副本。两个手工维护的文件会漂移，agent 最终会得到矛盾的规则。一个真相来源，按需链接。

## 保持生成的指导同步

框架指导在此仓库中编写一次并向外复制。将 `.agents/skills/` 视为共享技能的规范来源。`packages/core/src/templates/workspace-core/.agents/skills/` 中生成的工作区技能和共享技能的第一方模板副本必须保持逐字节同步；编辑共享技能后运行 `pnpm sync:workspace-skills`，在声称指导完成前运行 `pnpm guard:workspace-skills`。

生成的应用和工作区指令必须教授相同的 action 优先数据契约：

- 正常应用数据通过 `actions/` 中的 `defineAction` 文件。
- React 使用 `useActionQuery`、`useActionMutation` 或 `callAction` 调用 action；路由路径是隐藏在辅助函数之后的传输细节。
- 自定义 `/api/*` 路由仅用于路由形状的协议，如上传、流式传输、webhook、OAuth 回调、公共 SEO/OG 端点或二进制资产。
- 不要创建主要工作是调用、重新打包或重导出 action 的传递路由。

在记录版本历史、恢复或审计跟踪时，使用 action 进行完整的可恢复快照（`list-<resource>-versions`、`get-<resource>-version`、`restore-<resource>-version`）。不要将遗留的原始路由版本面板（如 document-version `/api/*` 辅助函数）复制到新功能中。Plans 版本历史模式是首选模型。

## SKILL.md frontmatter 必须说明什么和何时

`description` 是 agent 在决定是否读取技能时唯一看到的东西。它必须回答两个问题：技能涵盖什么，以及何时触发它。仅描述主题的描述不会触发。

```markdown
---
name: project-imports
description: >-
  How to import projects from the legacy CSV export. Use when the user uploads
  a project CSV or asks to migrate projects from the old system.
---
```

- 以能力开头，然后添加显式的**"Use when…"**子句。
- 稍微激进 — 过度触发胜过从不加载的技能。
- 保持在约 40 词以内；它在每次对话中加载到上下文中。

### 将技能范围化为运行时 vs 开发

可选的 `scope` 字段决定哪个 agent 加载技能：

- `both`（省略时默认）和 `runtime` — 由应用内运行时 agent 加载。
- `dev` — 仅用于人类的编码 agent（如 Claude Code）。`scope: dev` 的技能对运行时 agent 在任何地方都不可见（system-prompt 技能块和 `docs-search`）。

```markdown
---
name: release-checklist
description: >-
  Steps for cutting a release. Use when preparing or publishing a new version.
scope: dev
---
```

省略 `scope` 用于正常技能（默认 `both` 保持它们在运行时加载 — 完全向后兼容）。对于仅开发技能，标记 `scope: dev` 并可选择在 `.claude/skills/<name>/SKILL.md` 下镜像，以便 Claude Code 选取而运行时 agent 跳过它。

## 渐进式披露：精简的 SKILL.md，深度在 references/ 中

将 SKILL.md 编写为精简的、必须知道的层：规则、如何做、做/不做列表和指针。将长示例、详尽的字段参考、API 怪癖和边缘情况表推入 `references/` 文件，agent 仅在需要时读取。

```
.agents/skills/project-imports/
├── SKILL.md            # 规则 + 正常路径 + 做/不做
└── references/
    └── csv-format.md   # 完整列规范、编码、边缘情况
```

这保持始终加载的表面小巧，让深度在不膨胀上下文的情况下扩展。参见 **create-skill** 技能了解完整的技能格式。

## 编写面向 action 的表格

Agent 扫描表格比散文更快。优先使用名称 -> 用途的表格而非描述每个操作的段落。这同样适用于状态键、字段类型和任何可枚举的集合。表格可扫读、可差异比较，在你添加 action 时易于保持同步。

## 编写清晰的工具/action 描述

Action 描述就是工具描述 — 它们驱动工具选择。使每个描述成为精确的、单一用途的句子：

- 说明它做什么和返回什么，而非如何实现。
- 在其 `.describe()` 中描述每个参数，以便 agent 正确填充。
- 每个 action 一个职责。如果描述需要"还有…"，拆分它。
- 标记只读 action（`readOnly: true` / `http: { method: "GET" }`），以便 agent 知道它们可以安全地自由调用。
- 对于 provider 支持的快捷方式，明确它们是便利路径，而非能力上限。如果任意 provider 端点/过滤器可能重要，将指令指向 `provider-api-catalog`、`provider-api-docs` 和 `provider-api-request`，而非暗示快捷方式是 agent 能做的一切。

```ts
defineAction({
  description: "Create a project. Returns the new project id and title.",
  schema: z.object({
    title: z.string().min(1).describe("Project title shown in the sidebar"),
  }),
  // ...
});
```

## 内置反编造和完成前验证

应用指令应使诚实和验证成为默认行为：

- **切勿编造。** 如果未找到数据或 action 失败，说明并恢复 — 不要编造结果或声称成功。在报告前通过 action 或查询读取真实值。
- **完成前验证。** 更改后，通过回读（重新查询行、通过 `view-screen` 重新读取屏幕）确认，而非假设写入成功。
- **恢复，不要放弃。** 在可恢复的错误上（失败的查询、瞬态 fetch），重试或修复输入而非放弃任务。将此与反编造规则分开 — 不要将"不要编造东西"与"在第一个错误处停止"混为一谈。

将这些作为核心规则放在 `AGENTS.md` 中，以便它们适用于每个回合。

## 内置密钥卫生

指令作者必须在应用、技能、action、webhook、集成或扩展接触外部服务的任何地方使凭据处理显式化。用值的术语编写规则，而不仅仅是文件：切勿在源代码、文档、测试、固件、提示、截图或生成内容中硬编码真实的 API 密钥、令牌、webhook URL、签名密钥、OAuth 刷新令牌、私有 Builder/内部数据或客户数据。

示例可以命名凭据键如 `OPENAI_API_KEY` 或 `SLACK_WEBHOOK`，但值必须是占位符（`<OPENAI_API_KEY>`、`${keys.SLACK_WEBHOOK}`）或明显假的测试数据。告诉 agent 改用哪个批准的通道：部署环境变量用于部署级密钥、`app_secrets` / `saveCredential` / `resolveCredential` 用于范围化 API 密钥、`oauth_tokens` 用于 OAuth，以及 `${keys.NAME}` 替换用于扩展/自动化出站 HTTP。

## 什么放在哪里

- **AGENTS.md** — 适用于整个应用、每个回合：目的、核心规则、状态键、action 索引、技能索引。
- **技能** — 针对特定模式的可复用操作指南，按需加载。适用于在应用中工作的每个人。
- **记忆（`memory/MEMORY.md`）** — 每用户偏好和纠正，非编写的指导。参见 **capture-learnings**。

## 要做的

- 将 `AGENTS.md` 保持在约一屏的方向；链接出去获取深度。
- 每次添加 action 或技能时更新 action 表和技能索引。
- 每个SKILL.md 描述都写上显式的"Use when…"。
- 对任何可枚举集合（action、状态键、字段类型）使用表格。

## 不要做的

- 不要在 `AGENTS.md` 内重复技能内容 — 指向技能。
- 不要维护两个指令文件；将 `CLAUDE.md` 符号链接到 `AGENTS.md`。
- 不要写模糊的描述（"helps with projects"）— 它们不会触发。
- 不要在指令中记录小众/隐藏的 UI 行为；让代码和 UI 承载这些。
- 不要在示例中粘贴真实的凭据、看起来像凭据的虚拟字符串、私有 Builder/内部数据或客户数据。使用占位符。

## 相关技能

- **create-skill** — 本指南引用的技能格式和模板。
- **adding-a-feature** — 每个功能必须满足的四领域模型（UI、action、技能/指令、application state）。
- **actions** — Action 描述如何成为 agent 工具。
- **context-awareness** — Application-state 键和 `view-screen` 模式。
- **capture-learnings** — 每用户学习存放在哪里而非 AGENTS.md。