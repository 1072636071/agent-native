---
name: harness-agents
description: >-
  在 Agent Native 中添加或使用完整的 agent harness 运行时，如 Claude Code、
  Codex、Pi、Cursor、Mastra 或 ACP agent。
scope: dev
---

# Harness Agent

## 规则

完整的 agent harness 不是 `AgentEngine` 提供者。使用 `@agent-native/core/agent/harness` 中的 `AgentHarness` 基底。

## 为什么

`AgentEngine` 用于 `runAgentLoop` 下的一次模型往返。像 Claude Code、Codex、Pi、Cursor 和 Mastra 这样的 harness 拥有自己的循环、工作区、原生工具、会话状态、压缩、审批模型和沙箱行为。将 harness 放在 `AgentEngine.stream()` 下会双重运行循环并丢失会话生命周期语义。

## 如何

1. 注册或解析 harness 适配器。

```ts
import {
  registerBuiltinAgentHarnesses,
  resolveAgentHarness,
} from "@agent-native/core/agent/harness";

registerBuiltinAgentHarnesses();
const harness = resolveAgentHarness("ai-sdk-harness:codex");
```

2. 通过运行管理器桥接启动轮次。

```ts
import { startAgentHarnessRun } from "@agent-native/core/agent/harness";

startAgentHarnessRun({
  runId,
  threadId,
  adapter: harness,
  input: { prompt },
  createSession: {
    sessionId,
    resumeState,
    instructions,
    sandbox,
    permissionMode: "allow-reads",
  },
  ownerEmail,
  orgId,
});
```

3. 在 SQL 中持久化原生会话状态。

使用 `saveAgentHarnessSession`、`updateAgentHarnessSession` 和 `getLatestAgentHarnessSessionForThread`。`resumeState` 是不透明的；Agent Native 存储它但不检查它。

4. 通过后台 agent 展示运行。

Harness 运行通过 `createAgentHarnessBackgroundAgentController()` 投影到共享的 `BackgroundAgentRun` 形状，并可通过现有运行路由以 `goalId=agent-harness` 访问。

## ACP Agent

Agent Native 可以作为 [ACP](https://agentclientprotocol.com)（Agent Client Protocol）客户端并通过相同的基底驱动本地编码 agent——Gemini CLI、Claude Code 或任何符合 ACP 的 agent。这限定范围为**本地编码**：agent 作为通过 stdio 通信换行分隔 JSON-RPC 的子进程生成，并继承父环境以复用用户的本地 CLI 登录。它不是托管/沙箱传输，也不是聊天/A2A 传输。

```ts
import {
  registerBuiltinAgentHarnesses,
  resolveAgentHarness,
} from "@agent-native/core/agent/harness";

registerBuiltinAgentHarnesses();

// 内置预设（命令可通过 resolve 配置覆盖）：
const gemini = resolveAgentHarness("acp:gemini");
const claude = resolveAgentHarness("acp:claude-code");

// 或任何 ACP agent 按命令：
const custom = resolveAgentHarness("acp", {
  command: "gemini",
  args: ["--experimental-acp"],
});
```

- 协议传输（`@zed-industries/agent-client-protocol`）是延迟加载的可选依赖；`installPackage` 显示清晰的安装提示。
- Agent 二进制文件（如 `@google/gemini-cli`、`@zed-industries/claude-code-acp`）是用户安装的单独外部 CLI；预设默认通过 `npx` 启动它，命令/参数可覆盖，因为 agent ACP 入口标志仍在演进。
- `permissionMode` 映射到 ACP `session/request_permission`，使用报告的工具调用类型：读取始终运行，编辑在 `allow-edits` 下运行，所有有风险的操作在 `allow-all` 之外都会提示。审批作为 `approval-request` 事件出现；通过 harness 会话的 `approve()` 回答它们。
- `resumeState` 携带 ACP `sessionId`；当 agent 广告 `loadSession` 能力时恢复工作，否则降级为新会话。
- `fs/read_text_file` 和 `fs/write_text_file` 对会话工作区提供服务，拒绝逃逸它的路径；终端方法不被广告（agent 使用自己的 shell）。

## 适配器指导

- 保持 harness 包可选。在适配器中使用动态导入并通过 `installPackage` 暴露安装提示。
- 使用 AI SDK harness 适配器作为一个实现，而不是 Agent Native 的公共抽象。
- 对于桥接支持的编码 harness，需要真实的沙箱/工作区提供者。不要默认在宿主进程中运行任意编码 agent。
- 仅传递一个窄的、有意的 Agent Native action 集作为宿主工具。保留 `defineAction` 认证、请求上下文、超时、截断和只读元数据。

## 代码执行沙箱

- `run-code` 工具通过可插拔的 `SandboxAdapter`（`packages/core/src/coding-tools/sandbox/`）执行。默认的 `LocalChildProcessAdapter` 生成一个锁定的本地 Node 子进程；通过 `AGENT_NATIVE_SANDBOX` 或 `registerSandboxAdapter()` 交换为 Docker/远程/持久后端（超过托管约 40 秒代码执行上限的杠杆）。适配器只运行已准备好的、非秘密的模块源代码——它永远看不到应用秘密。见沙箱适配器文档；`agent-native add sandbox docker` 发出完整的 Docker 适配器配方。

## 子 Agent 委托深度

- 子 agent 生成在服务器端有上限（默认深度 `2`），这样委托链不会无限扇出。在部署时使用 `AGENT_NATIVE_MAX_SUBAGENT_DEPTH` 覆盖（`0` 禁用子 agent；限制为 `16`）。强制通过 `packages/core/src/server/agent-teams.ts` 中的 `evaluateSubagentDepth` 环境执行——独立于任何工具级守卫。见 Agent Teams 文档了解深度模型。

## 不要

- 不要将 Claude Code、Codex、Cursor、Mastra 或 Pi 添加为 `AgentEngine`。
- 不要每轮次将完整的 Agent Native 聊天历史重放到原生 harness 中。改为恢复 harness 会话。
- 不要将恢复状态存储在 `application_state` 中；它属于 harness 会话 SQL 表。
- 不要默认将每个应用 action 暴露给每个 harness 会话。

## 相关 Skill

- `adding-a-feature`——跨 UI/action/指令/状态的功能对等。
- `delegate-to-agent`——后台 agent 使用运行管理器基础设施。
- `external-agents`——暴露可打开的资源和外部 agent 界面。
- `storing-data`——持久 SQL 状态和增量 schema 变更。