# 弹出 `@agent-native/scheduling`

如需完全自定义，你可以将包源码移到你自己的仓库中。

**v0.2 计划：** `agent-native eject @agent-native/scheduling`。

**当前（v0.1）** — 手动操作：

1. `cp -r node_modules/@agent-native/scheduling/src packages/scheduling-local/src`
2. 将 `packages/scheduling-local/` 添加到你的 workspaces。
3. 在依赖中将 `"@agent-native/scheduling": "^0.1"` 替换为 `"@local/scheduling": "workspace:*"`（或类似）。
4. 在你的仓库中进行查找替换，将 `@agent-native/scheduling` 改为 `@local/scheduling`。
5. 安装：`pnpm install`。

现在你拥有代码并可以自由修改。上游更新可通过 `npm view @agent-native/scheduling versions` 获取 — 你可以选择性地移植更改。