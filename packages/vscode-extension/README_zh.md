# Agent Native Plans for VS Code

在 VS Code 中打开 Agent-Native Plans 和交接链接。

## 安装

从 Visual Studio Marketplace 安装
[Agent Native Plans](https://marketplace.visualstudio.com/items?itemName=Builder.agent-native)，或运行：

```bash
code --install-extension Builder.agent-native
```

## 命令

- **Agent Native: Open Agent Native** 打开配置的默认应用。
- **Agent Native: Open Agent Native URL** 打开任意 `http(s)` Agent Native 应用
  URL 或 `vscode://builder.agent-native/open?url=...` 交接链接。
- **Agent Native: Connect Workspace to Agent Native MCP** 运行现有的
  `@agent-native/core` 连接流程，用于 VS Code / GitHub Copilot MCP。

## 交接 URL

外部代理可以通过以下方式打开聚焦的 Agent Native 应用视图：

```text
vscode://builder.agent-native/open?url=https%3A%2F%2Fplan.agent-native.com
```

嵌入的 URL 必须是 `http` 或 `https`。

## 开发

```bash
pnpm --filter agent-native build
pnpm --filter agent-native test
pnpm --filter agent-native test:e2e
```