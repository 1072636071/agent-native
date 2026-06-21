# @agent-native/skills

将 BuilderIO 技能文件夹安装到 Codex 和 Claude 技能目录中。

```bash
npx @agent-native/skills@latest add
npx @agent-native/skills@latest add --skill quick-recap --client codex --scope project --update-instructions
npx @agent-native/skills@latest add --skill visual-recap --client all --with-github-action
npx @agent-native/skills@latest add --skill visual-plan --mode local-files
```

使用 `--skill <name>` 一次或多次来选择特定技能，或在交互式终端中省略以从提示中选择。提示会优先显示 `visual-plan`
和 `visual-recap`，并默认仅预选这两项。使用
`--client codex`、`--client claude-code` 或 `--client all` 来选择安装目标；省略 `--client` 则默认为所有支持的客户端。对于
`visual-plan` 和 `visual-recap`，使用 `--mode hosted`、`--mode local-files` 或
`--mode self-hosted --mcp-url <url>` 来选择托管共享、全本地文本文件或你自己的 Plan 应用。添加 `--update-instructions` 以将幂等管理块追加到 `AGENTS.md` 和/或 `CLAUDE.md`，用于指令式技能。

技能内容在安装/列表时来自 `BuilderIO/skills@main`。显式的 `visual-plan` / `visual-recap` 安装委托给
`@agent-native/core`，因此 Plan 模式选择、MCP 注册和本地文件指令保留在一个框架拥有的流程中。