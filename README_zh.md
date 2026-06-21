# Agent-Native

## 面向 agent-native 应用的框架

Agent-Native 是一个开源框架，用于构建在真实应用内部行动的健壮 agent，而不仅仅是在应用旁边聊天。它为你提供产品级 agentic 软件的原语：共享 action、SQL 支持的状态、身份、工具、skill、作业、可观测性和 UI 界面，所有这些协同工作。自带数据库、托管提供商、模型栈和应用代码。

```ts
// 一个 action 驱动 UI、agent、HTTP、MCP、A2A 和 CLI。
export default defineAction({
  schema: z.object({
    emailId: z.string(),
    body: z.string(),
  }),
  run: async ({ emailId, body }) => {
    await db.insert(replies).values({ emailId, body });
  },
});
```

- **Action**：定义一次工作。从 UI、agent、API、MCP、A2A 和 CLI 中使用。
- **Agent 运行时**：聊天、工具、skill、记忆、作业、可观测性和交接一起发布。
- **后端无关**：插入任何 Drizzle 支持的 SQL 数据库和 Nitro 兼容的主机。

## Agent 和 UI，完全连接

Agent 和 UI 是一个系统的平等公民。每个 action 双向工作：点击它或要求它。

![Agent 和 UI 完全连接](https://cdn.builder.io/api/v1/file/assets%2FYJIGb4i01jvw0SRdL5Bt%2Fadc1e9e9368e4a8cb1b4dbb5aae5aaa2)

- **一切同步**：一个数据库，一个状态。任何一侧的变更立即在另一侧显示。
- **实时多人协作**：人类和 agent 一起编辑同一文档，agent 是一等公民。
- **上下文感知**：Agent 知道你在看什么。选择文本，按 Cmd+I，告诉它做什么。
- **Agent 调用 agent**：从任何应用标记另一个 agent，它们通过 A2A 协调。
- **自我改进**：Agent 可以随时间添加功能、修复 bug 和优化 UI。

## 模板

从一个功能完整的模板开始。每个模板都是一个完整的、100% 免费开源的 SaaS 应用：可克隆，而非脚手架生成，而且你拥有代码并可以自定义一切。

<table>
<tr>
<td width="33%" align="center" valign="top">

**Calendar**

<a href="https://agent-native.com/templates/calendar"><img src="https://cdn.builder.io/api/v1/image/assets%2FYJIGb4i01jvw0SRdL5Bt%2Ffb6c3b483ca24ab3b6c3a758aeceef4c?format=webp&width=800" alt="Calendar 模板" width="100%" /></a>

**Agent-Native 版 Google Calendar、Calendly**

管理事件，与 Google Calendar 同步，并通过 AI 调度分享公共预约页面。

</td>
<td width="33%" align="center" valign="top">

**Content**

<a href="https://agent-native.com/templates/content"><img src="https://cdn.builder.io/api/v1/image/assets%2FYJIGb4i01jvw0SRdL5Bt%2F89bcfc6106304bfbaf8ec8a7ccd721eb?format=webp&width=800" alt="Content 模板" width="100%" /></a>

**开源的 MDX 版 Obsidian**

编辑本地 Markdown/MDX 文件，生成丰富的交互式自定义块，并通过 agent 起草、改写或发布。

</td>
<td width="33%" align="center" valign="top">

**Plans**

<a href="https://agent-native.com/templates/plan"><img src="https://cdn.builder.io/api/v1/image/assets%2FYJIGb4i01jvw0SRdL5Bt%2Fb6f4213ac7cc42eeb10c12e8ccda8936?format=webp&width=800" alt="Plans 模板" width="100%" /></a>

**编码 agent 的可视化计划模式**

安装 `/visual-plan` 和 `/visual-recap`，让你的编码 agent 在构建前规划，在变更落地后回顾。带有图表、线框图、注释和审查链接的高级代码审查。

</td>
</tr>
<tr>
<td width="33%" align="center" valign="top">

**Slides**

<a href="https://agent-native.com/templates/slides"><img src="https://cdn.builder.io/api/v1/image/assets%2FYJIGb4i01jvw0SRdL5Bt%2F2c09b451d40c4a74a89a38d69170c2d8?format=webp&width=800" alt="Slides 模板" width="100%" /></a>

**Agent-Native 版 Google Slides、Pitch**

通过 prompt 或点击生成和编辑基于 React 的演示文稿。

</td>
<td width="33%" align="center" valign="top">

**Analytics**

<a href="https://agent-native.com/templates/analytics"><img src="https://cdn.builder.io/api/v1/image/assets%2FYJIGb4i01jvw0SRdL5Bt%2F4933a80cc3134d7e874631f688be828a?format=webp&width=800" alt="Analytics 模板" width="100%" /></a>

**Agent-Native 版 Amplitude、Mixpanel**

连接分析数据源，通过 prompt 获取真实图表，构建可复用的仪表板。

</td>
<td width="33%" align="center" valign="top">

**Clips**

<a href="https://agent-native.com/templates/clips"><img src="https://cdn.builder.io/api/v1/image/assets%2FYJIGb4i01jvw0SRdL5Bt%2F678be5a501a14ab8a508e5f7bc92c468?format=webp&width=800" alt="Clips 模板" width="100%" /></a>

**Agent-Native 版 Loom**

录制屏幕并自动生成转录、可分享链接，以及按需总结、添加字幕和编辑片段的 agent。

</td>
</tr>
</table>

在 **[agent-native.com/templates](https://agent-native.com/templates)** 查看完整模板库。

## 通过 skill 试用

还不想搭建整个应用？一条命令即可为 Claude Code、Codex、Cursor、Pi、OpenCode、GitHub Copilot / VS Code 及类似 agent 添加可视化规划和 PR 回顾：

```bash
npx @agent-native/core@latest skills add visual-plan
```

![可视化计划和回顾实际效果](https://raw.githubusercontent.com/builderio/skills/main/media/visual-recap.gif)

你将获得两个斜杠命令：

- **`/visual-plan`**：在 agent 编写代码之前，它会打开一个结构化的、可审查的计划，包含内联图表、UI 线框图、逐文件实现映射和你可以评论和批准的注释。
- **`/visual-recap`**：在变更落地后，它将 PR 或 git diff 转换为高级可视化回顾，带有可分享的审查链接，而不是原始 diff。

查看 **[Skills 指南](https://agent-native.com/docs/skills-guide#app-backed-skills)** 了解更多。

## 快速开始

一条命令即可在本地启动新项目。

```bash
npx @agent-native/core@latest create my-app
cd my-app
pnpm install
pnpm dev
```

`create` 首先会询问你想如何开始：

- **完整模板**：将一个或多个完整应用克隆到工作区。选择 Mail + Calendar + Forms，你将获得三个已连接并共享认证的应用。
- **Chat**：一个带有最小聊天 UI 和已连接浏览器壳的单应用，这是获取 UI 最简单的方式。
- **Headless**：一个没有 UI 壳的 action 优先单应用。CLI 会引导你调用第一个 action 和 agent，之后可以添加 UI。

偏好使用标志？`create my-app --template mail`、`--headless` 或 `--standalone` 可跳过提示。

## 两全其美

|                   | SaaS 工具          | 原始 AI Agent           | 内部工具                   | Agent-Native            |
| ----------------- | ------------------ | ----------------------- | -------------------------- | ----------------------- |
| **UI**            | 精美但僵化         | 无                      | 质量参差不齐               | 完整 UI，fork 即用      |
| **AI**            | 后期附加           | 强大                    | 浅层连接                   | Agent 优先，深度集成    |
| **可定制性**      | 无法定制           | 指令和 skill            | 完全可定制，但维护成本高   | Agent 修改应用          |
| **所有权**        | 租赁               | 部分属于你              | 你拥有代码                 | 你拥有代码              |

## 社区

加入 **[Discord](https://discord.gg/qm82StQ2NC)** 提问、分享你正在构建的内容并获取帮助。

## 文档

完整文档请访问 **[agent-native.com](https://agent-native.com)**。

## 许可证

MIT