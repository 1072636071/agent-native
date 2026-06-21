---
name: agent-native-docs
description: >-
  如何查找随 node_modules 捆绑的版本匹配的 Agent Native 框架文档。
  在实现或回答关于 @agent-native/core API、生成的应用、工作区或高级功能的问题之前使用。
metadata:
  internal: true
---

# Agent Native 文档查找

## 规则

在实现或解释非平凡的 Agent Native 行为之前，阅读随 `@agent-native/core` 安装的版本匹配文档。

## 原因

生成的应用和工作区可能使用与公共文档或模型记忆不同的框架版本。安装的包是与面前应用匹配的来源。

## 方法

从生成的应用目录：

```bash
pnpm action docs-search --query "<feature>"
pnpm action docs-search --slug <slug>
pnpm action docs-search --list
```

无头的 `pnpm agent` 循环和内置应用代理也暴露了一个只读的 `docs-search` 工具，具有相同的 `query`、`slug` 和 `list` 选项。

如果 action 运行器不可用，直接搜索包文档：

```bash
rg -n "actions|automations|a2a|sharing" node_modules/@agent-native/core/docs
```

然后读取 `node_modules/@agent-native/core/docs/AGENTS.md` 或 `node_modules/@agent-native/core/docs/content/` 下的匹配文件。

## 有用的 Slug

| 需求 | Slug |
| --- | --- |
| Actions 和类型化客户端调用 | `actions`、`client` |
| SQL、认证、访问、共享 | `database`、`authentication`、`security`、`sharing` |
| 代理可见的 UI 状态 | `context-awareness` |
| 无头和聊天优先的应用 | `pure-agent-apps`、`agent-surfaces`、`using-your-agent` |
| 自动化和调度 | `automations`、`recurring-jobs` |
| 跨应用和外部代理 | `a2a-protocol`、`external-agents`、`mcp-protocol`、`mcp-apps` |
| 技能和指令 | `skills-guide`、`writing-agent-instructions` |

## 不要

- 当包文档存在时，不要依赖记忆来了解框架 API。
- 在阅读 `actions` 之前，不要为应用数据添加自定义 REST 包装器。
- 在阅读 `using-your-agent` 和 `agent-surfaces` 之前，不要添加内联 LLM 调用。