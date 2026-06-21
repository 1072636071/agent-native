# Agent-Native Plan

Agent-Native Plan 是面向编码代理的结构化可视化计划模式。它将普通的 Markdown/Codex/Claude Code 计划转化为可视化审查界面，包含可编辑的富文本块、图表、线框图、原型选项、带注释的代码演练和文件树、代码预览、批注、分享链接、反馈和 HTML 导出。

## 安装

使用 Agent-Native CLI。这是推荐的设置方式，因为它一步完成 Plan 技能指令安装、托管的 Plan MCP 连接器注册和客户端特定的认证/设置流程：

```sh
npx @agent-native/core@latest skills add visual-plan
```

你不需要单独配置 MCP 服务器。

支持的别名包括：

- `npx @agent-native/core@latest skills add visual-plan`
- `npx @agent-native/core@latest skills add visual-recap`

如果工具没有立即可见，请重启或重新加载宿主。

## 使用

归结为两个命令：`/visual-plan` 用于在代理构建前规划，`/visual-recap` 用于在变更落地后审查。

当你想要在代理构建前制定新计划时输入 `/visual-plan`，或者当你已有 Codex、Claude Code、Markdown 或粘贴的计划并希望代理保留它同时添加更丰富的可视化审查界面时。

当你想要从 PR、提交、分支或 git diff 获取高级可视化代码审查回顾时输入 `/visual-recap`。回顾是审查的辅助工具，不是阅读实际 diff 的替代品。

命令行为：

- `/visual-plan` 创建一个新的富可视化计划，包含文档级细节、图表、涉及 UI 时的详细线框图/模型、交互感重要时的功能原型、权衡、开放问题、代码工作的带注释代码演练和文件树、代码预览和反馈提示。当提供现有计划时，它基于该计划构建而不是从头开始。
- `/visual-recap` 从已更改的代码创建反向计划：文件树、diff、数据模型、API 和列块，让审查者可以在逐行阅读之前扫描 PR 的形状。

## 正常规划流程

`/visual-plan` 仍然是主要的规划命令。代理应首先使用其正常的规划流程：检查代码库、收集上下文、通过宿主的原生 ask-user-question 工具在需要时提出澄清问题，然后创建可视化计划。

文档应保持接近编码代理通常会产生的 Markdown 计划。图表、线框图、模型和批注是附加的审查辅助工具。

计划默认应该是可视化的：

- 架构、数据流、依赖和状态机的图表
- UI 工作的详细线框图和快速模型，包括布局区域、控件、状态、空/加载/错误路径和文案占位符
- 用于多个图表、线框图、模型和设计选项的标签页，这样丰富的计划不会变成长长的视觉堆栈
- 当交互或设计方向不确定时的原型选项
- 代码工作的带注释代码演练和文件树：文件、符号/组件/函数、计划变更、简洁代码片段和显式的编辑器打开功能
- plannotator 风格的评论、纠正和批注
- 选项、开放问题、风险假设和选择的审查提示
- 有帮助时的 README 式细节：命令、MCP/链接后备、工具行为、数据形状、范围和延迟内容

审查回顾使用相同的计划界面，但其重心是前后审查。使用 `columns` 作为结构化前后比较的通用并排布局原语，使用分割的 `diff` 块处理字面代码段。当重要变更是语义 API 或 schema 兼容性时，在 `data-model` 或 `api-endpoint` 块旁边使用散文。

## 审查循环

1. 代理创建计划并以行内方式或浏览器链接打开 MCP 应用。
2. 用户对视觉做出反应，而不是阅读一堵 Markdown 墙。
3. 用户批注、纠正、选择选项或要求更清晰的视觉。
4. 代理在编辑前读取结构化反馈并更新计划或实现。
5. 用户可以保持计划本地或登录以分享私有审查链接。

本地开发可以使用框架自动创建的开发账户。托管的持久化、私有分享、审查者链接和团队反馈使用账户登录，在配置 OAuth 环境变量时可以使用 Google 登录。

## 托管应用

托管的 MCP 应用预期在：

- 应用: `https://plan.agent-native.com`
- MCP: `https://plan.agent-native.com/_agent-native/mcp`

本地模板对开发和自托管仍然有用。

## PR 可视化回顾

当交互式安装 Plans 时，CLI 会询问你是否也想要 PR Visual Recap GitHub Action。你可以随时显式添加它：

```sh
npx @agent-native/core@latest skills add visual-plan --with-github-action
```

这会写入 `.github/workflows/pr-visual-recap.yml`。然后运行设置助手来配置 GitHub Actions secrets/variables（尽可能）并打印任何缺失的手动步骤：

```sh
npx @agent-native/core@latest recap setup
npx @agent-native/core@latest recap doctor
```

托管默认需要 `PLAN_RECAP_TOKEN` 加上默认 Claude 后端的 `ANTHROPIC_API_KEY`。`PLAN_RECAP_APP_URL` 仅在自托管 Plan 应用时需要，Codex 用户可以设置 `VISUAL_RECAP_AGENT=codex` 加 `OPENAI_API_KEY`。

工作流应将回顾生成视为仅信息性的：它可以在运行时显示非必需的 `Visual Recap` 检查并用回顾链接更新粘性 PR 评论，但审查者仍然拥有真正的 diff 审查。