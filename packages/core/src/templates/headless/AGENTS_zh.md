# {{APP_NAME}} - 代理指南

这是一个无头 Agent Native 应用。它以 actions 而非浏览器 UI 开始，因此第一个有用的原语可以从代理、CLI 和 action 运行时调用。

此应用不是无状态的。Agent Native 运行时在使用这些界面时使用 SQL 支持的存储来管理应用状态、设置、认证/会话数据、资源和其他框架能力。本地开发可以使用 `data/app.db` 中的 SQLite；托管或长期部署应将 `DATABASE_URL` 设置为持久数据库。

## 在此应用中工作

- 优先使用 `actions/` 中的 actions 处理每个应用操作。不要围绕 actions 创建 REST 包装器。
- 使用 Zod 验证 action 输入并返回结构化数据，而非 JSON 字符串。
- 不要硬编码 API 密钥、token、webhook URL、私有数据或凭据式字面量。
- `actions/run.ts` 是 `pnpm action ...` 的 CLI 调度器，不是应用 action。保留它，将可调用的原语作为单独的 `actions/<name>.ts` 文件添加。
- 此脚手架中有意没有 `app/` UI 外壳。当你需要浏览器 UI 时，使用 Chat 模板作为 UI 入口，并保留 `agent-native add` 用于集成蓝图。

## 框架文档查找

版本匹配的 Agent Native 文档随 `@agent-native/core` 一起安装在 `node_modules/@agent-native/core/docs` 中。

- 使用 `pnpm action docs-search --query "<topic>"` 搜索框架文档、捆绑的 `AGENTS.md` 和代码库技能。
- 使用 `pnpm action docs-search --slug <slug>` 读取完整页面。从 `actions`、`pure-agent-apps`、`automations`、`recurring-jobs`、`a2a-protocol`、`external-agents`、`mcp-protocol`、`database`、`sharing` 和 `security` 开始了解高级无头工作流。
- 使用 `pnpm action docs-search --list` 查看所有可用内容。
- 如果 action 运行器不可用，读取 `node_modules/@agent-native/core/docs/AGENTS.md` 并使用 `rg` 直接搜索 `node_modules/@agent-native/core/docs/content/`。

在实现高级 Agent Native 功能之前，阅读这些本地包文档。优先使用此应用自己的 `AGENTS.md` 了解应用特定的规则。

## Actions

| Action      | 参数              | 用途                 |
| ----------- | ----------------- | -------------------- |
| `hello`     | `[--name <name>]` | 返回问候             |
| `db-schema` |                   | 显示 SQL 模式        |
| `db-query`  | `--sql "SELECT"`  | 运行限定范围的 SELECT |
| `db-exec`   | `--sql "UPDATE"`  | 最后手段的维护       |

从此应用根目录运行 actions：

```bash
pnpm action hello --name Builder
```

对这些 actions 运行应用-代理循环：

```bash
pnpm agent "Call the hello action for Builder and explain the result"
```

## 技能

`.agents/skills/` 中的技能提供详细指导。在使用高级 Agent Native 框架 API、生成的应用功能、自动化、A2A、共享或 MCP 之前，阅读 `.agents/skills/agent-native-docs/SKILL.md`。