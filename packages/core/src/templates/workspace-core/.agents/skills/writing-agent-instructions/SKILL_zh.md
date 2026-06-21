---
name: writing-agent-instructions
description: >-
  如何为 agent-native 应用或模板编写优秀的代理指令：AGENTS.md、技能和工具/action 描述。
  在编写或审查 AGENTS.md、编写 SKILL.md、措辞 action 描述，或决定什么属于指令 vs 技能 vs 记忆时使用。
metadata:
  internal: true
---

# 编写代理指令与技能

这是一个面向创建者的指南。当你构建 agent-native 应用或模板时，代理的行为仅取决于你给它的指令。三个界面承载这些指导：`AGENTS.md`（地图）、技能（深入探讨）和 action/工具描述（代理如何选择正确的工具）。为每个界面编写以便快速检索，而非散文。

## 保持 AGENTS.md 小巧且可浏览

`AGENTS.md` 作为定位加载。它应该是让代理正确行动的最小内容，所有深入内容推到技能中。目标是这些部分，别无其他：

- **目的行** — 一句话说明应用是什么和主要工作流。
- **核心规则** — 必须始终成立的少量不变量（数据在 SQL 中、操作通过 actions 进行、AI 通过代理聊天进行、模式变更是增量的）。简短的祈使句要点。
- **应用状态键** — 代理读取的 `navigation`/选择/聚焦键，用于了解用户正在查看什么，及其形状。
- **Action 表** — action 名称 -> 用途的紧凑表格（见下文）。
- **技能索引** — 存在的技能列表以及何时读取每个技能。

如果某个部分超过一屏，它属于技能。`AGENTS.md` 回答"这个应用是什么，我能做什么"，而不是"我到底怎么做那个难事"。

```markdown
# Projects App

One workspace for projects, tasks, and notes. Agent and UI share the same SQL
data and the same actions.

## Core Rules

- Data lives in SQL via Drizzle. Use actions for all writes.
- All AI work goes through the agent chat; never call an LLM inline.
- Schema changes are additive only.

## Application State

- `navigation.view`: `home` | `project`
- `navigation.projectId`: selected project on a project page

## Actions

| Action           | Purpose                     |
| ---------------- | --------------------------- |
| `list-projects`  | List accessible projects    |
| `create-project` | Create a project            |
| `update-project` | Rename or archive a project |

## Skills

- `project-imports` — read before importing legacy CSV exports.
- `sharing` — read before exposing a project to other users.
```

## 单一来源 AGENTS.md（CLAUDE.md 是符号链接）

保持一个规范的指令文件：`AGENTS.md`。如果客户端期望 `CLAUDE.md`，使其成为指向 `AGENTS.md` 的符号链接，而非第二个副本。两个手动维护的文件会漂移，代理最终会得到矛盾的规则。一个真相来源，按需链接。

## 保持生成的指导同步

框架指导在此仓库中编写一次并向外复制。将 `.agents/skills/` 视为共享技能的规范来源。`packages/core/src/templates/workspace-core/.agents/skills/` 中生成的工作区技能和共享技能的第一方模板副本必须保持逐字节同步；编辑共享技能后运行 `pnpm sync:workspace-skills`，在宣布指导完成之前运行 `pnpm guard:workspace-skills`。

生成的应用和工作区指令必须教授相同的 action 优先数据契约：

- 正常的应用数据通过 `actions/` 中的 `defineAction` 文件进行。
- React 使用 `useActionQuery`、`useActionMutation` 或 `callAction` 调用 actions；路由路径是隐藏在辅助函数后面的传输细节。
- 自定义 `/api/*` 路由仅用于路由形状的协议，如上传、流式传输、webhook、OAuth 回调、公共 SEO/OG 端点或二进制资产。
- 不要创建主要工作是调用、重新打包或重新导出 action 的传递路由。

在记录版本历史、恢复或审计跟踪时，使用 actions 进行完整的可恢复快照（`list-<resource>-versions`、`get-<resource>-version`、`restore-<resource>-version`）。不要将旧版原始路由版本面板（如 document-version `/api/*` 辅助函数）复制到新功能中。Plans 版本历史模式是首选模型。

## SKILL.md 前置元数据必须说明什么和何时

`description` 是代理在决定是否读取技能时唯一看到的内容。它必须回答两个问题：技能涵盖什么，以及何时触发它。仅描述主题的描述不会触发。

```markdown
---
name: project-imports
description: >-
  How to import projects from the legacy CSV export. Use when the user uploads
  a project CSV or asks to migrate projects from the old system.
---
```

- 以能力开头，然后添加明确的**"在……时使用"**子句。
- 稍微主动一点 — 过度触发胜过从不加载的技能。
- 保持在约 40 词以内；它在每次对话中都会加载到上下文中。

### 将技能范围限定为运行时 vs 开发

可选的 `scope` 字段决定哪个代理加载该技能：

- `both`（省略时的默认值）和 `runtime` — 由应用内运行时代理加载。
- `dev` — 仅用于人类的编码代理（如 Claude Code）。`scope: dev` 的技能对运行时代理在任何地方都不可见（系统提示技能块和 `docs-search`）。

```markdown
---
name: release-checklist
description: >-
  Steps for cutting a release. Use when preparing or publishing a new version.
scope: dev
---
```

省略 `scope` 用于正常技能（默认 `both` 保持它们在运行时加载 — 完全向后兼容）。对于仅开发的技能，标记为 `scope: dev`，并可选地在 `.claude/skills/<name>/SKILL.md` 下镜像它，以便 Claude Code 在运行时代理跳过它时获取它。

## 渐进式披露：精简的 SKILL.md，深度在 references/ 中

将 SKILL.md 编写为精简的、必须知道的层：规则、如何做、做/不做列表和指针。将长示例、详尽的字段参考、API 怪癖和边缘情况表推到 `references/` 文件中，代理仅在需要时才读取它们。

```
.agents/skills/project-imports/
├── SKILL.md            # rule + happy path + do/don't
└── references/
    └── csv-format.md   # full column spec, encodings, edge cases
```

这保持始终加载的界面小巧，并让深度在不膨胀上下文的情况下扩展。完整技能格式见 **create-skill** 技能。

## 编写面向 action 的表格

代理扫描表格比散文更快。优先使用名称 -> 用途的表格，而非描述每个操作的段落。这同样适用于状态键、字段类型和任何可枚举的集合。表格是可浏览的、可比较的，并且在添加 action 时易于保持同步。

## 编写清晰的工具/action 描述

Action 描述就是工具描述 — 它们驱动工具选择。使每个描述成为精确的、单一用途的句子：

- 说明它做什么和返回什么，而不是如何实现。
- 在其 `.describe()` 中描述每个参数，以便代理正确填充它。
- 每个 action 一个职责。如果描述需要"还有…"，就拆分它。
- 标记只读 actions（`readOnly: true` / `http: { method: "GET" }`），以便代理知道它们可以自由调用。
- 对于提供商支持的快捷方式，明确它们是便利路径，而非能力上限。如果任意提供商端点/过滤器可能重要，将指令指向 `provider-api-catalog`、`provider-api-docs` 和 `provider-api-request`，而非暗示快捷方式是代理能做的一切。

```ts
defineAction({
  description: "Create a project. Returns the new project id and title.",
  schema: z.object({
    title: z.string().min(1).describe("Project title shown in the sidebar"),
  }),
  // ...
});
```

## 内置反伪造和完成前验证

应用指令应使诚实和验证成为默认行为：

- **永不伪造。** 如果未找到数据或 action 失败，说明并恢复 — 不要编造结果或声称成功。在报告之前通过 action 或查询读取真实值。
- **在宣布完成之前验证。** 更改后，通过回读确认（重新查询行、通过 `view-screen` 重新读取屏幕），而不是假设写入成功。
- **恢复，而非放弃。** 在可恢复的错误上（失败的查询、瞬态获取），重试或修复输入，而不是放弃任务。将此与反伪造规则分开 — 不要将"不要编造东西"与"在第一个错误处停止"混淆。

将这些作为核心规则放在 `AGENTS.md` 中，以便它们适用于每个轮次。

## 内置密钥卫生

指令作者必须在应用、技能、action、webhook、集成或扩展接触外部服务的任何地方明确凭据处理。以值而非仅文件的方式编写规则：永远不要在源文件、文档、测试、固件、提示、截图或生成的内容中硬编码真实的 API 密钥、token、webhook URL、签名密钥、OAuth 刷新 token、私有 Builder/内部数据或客户数据。

示例可以命名凭据键如 `OPENAI_API_KEY` 或 `SLACK_WEBHOOK`，但值必须是占位符（`<OPENAI_API_KEY>`、`${keys.SLACK_WEBHOOK}`）或明显伪造的测试数据。告诉代理应使用哪个批准的渠道：部署环境变量用于部署级密钥，`app_secrets` / `saveCredential` / `resolveCredential` 用于限定范围的 API 密钥，`oauth_tokens` 用于 OAuth，`${keys.NAME}` 替换用于扩展/自动化出站 HTTP。

## 什么放在哪里

- **AGENTS.md** — 适用于整个应用，每个轮次：目的、核心规则、状态键、action 索引、技能索引。
- **技能** — 特定模式的可重用操作指南，按需加载。适用于在应用中工作的每个人。
- **记忆（`memory/MEMORY.md`）** — 每用户偏好和修正，非编写指导。见 **capture-learnings**。

## 做

- 保持 `AGENTS.md` 大约一屏的定位；链接到深度内容。
- 每当添加 action 或技能时，更新 action 表和技能索引。
- 编写每个 SKILL.md 描述时带有明确的"在……时使用"。
- 对任何可枚举集合（actions、状态键、字段类型）使用表格。

## 不做

- 不要在 `AGENTS.md` 内复制技能内容 — 指向技能。
- 不要维护两个指令文件；将 `CLAUDE.md` 符号链接到 `AGENTS.md`。
- 不要编写模糊的描述（"帮助处理项目"）— 它们不会触发。
- 不要在指令中记录小众/深埋的 UI 行为；让代码和 UI 承载这些。
- 不要在示例中粘贴真实凭据、凭据式虚拟字符串、私有 Builder/内部数据或客户数据。使用占位符。

## 相关技能

- **create-skill** — 本指南引用的技能格式和模板。
- **adding-a-feature** — 每个功能必须满足的四区域模型（UI、actions、技能/指令、应用状态）。
- **actions** — Action 描述如何成为代理工具。
- **context-awareness** — 应用状态键和 `view-screen` 模式。
- **capture-learnings** — 每用户学习内容存放的地方，而非 AGENTS.md。