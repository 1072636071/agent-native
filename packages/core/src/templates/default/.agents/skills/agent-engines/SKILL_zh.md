---
name: agent-engines
description: >-
  如何检查和配置驱动 agent 的 AI 引擎（模型提供商）。在用户要求切换
  模型、检查哪个引擎处于活动状态、测试新提供商或注册自定义引擎时
  使用。
---

# Agent 引擎

## 概述

框架支持在 agent 循环下可插拔的 AI 引擎。**Anthropic 引擎**是默认和最佳路径（Claude 模型）。可以通过 Vercel AI SDK 添加其他引擎（OpenAI、Google Gemini、Groq、Mistral、Cohere、Ollama）。

## 可用工具

| 工具 | 用途 |
|---|---|
| `list-agent-engines` | 列出所有已注册的引擎、其能力和当前选择 |
| `set-agent-engine` | 设置活动引擎和模型（持久化在设置中） |
| `test-agent-engine` | 发送简单提示以验证引擎是否工作（连接性 + API 密钥） |

## 检查当前引擎

```
list-agent-engines
```

返回所有引擎的注册表（名称、标签、能力、支持的模型）加上当前活动的引擎和模型。

## 切换引擎

```
set-agent-engine --engine "ai-sdk:openai" --model "gpt-4o"
```

更改在下次对话时生效。设置通过设置存储（`agent-engine` 键）持久化。

解析顺序（最高优先级优先）：
1. 传递给服务器插件中 `createAgentChatPlugin()` 的显式 `engine` 选项
2. 设置存储（`agent-engine` 键）
3. `AGENT_ENGINE` 环境变量
4. 默认：`"anthropic"`（需要 `ANTHROPIC_API_KEY`）

## 测试新引擎

在切换之前，验证引擎是否工作：

```
test-agent-engine --engine "ai-sdk:openai" --model "gpt-4o"
```

返回 `{ ok, latencyMs, response, capabilities }`。如果 `ok: false`，错误消息会解释问题所在（缺少 API 密钥、包未安装等）。

## 内置引擎

| 引擎名称 | 提供商 | 需要 |
|---|---|---|
| `anthropic` | Anthropic Claude SDK | `ANTHROPIC_API_KEY` |
| `ai-sdk:anthropic` | 通过 Vercel AI SDK 的 Claude | `ANTHROPIC_API_KEY` |
| `ai-sdk:openai` | 通过 Vercel AI SDK 的 OpenAI | `OPENAI_API_KEY` |
| `ai-sdk:openrouter` | 通过 OpenRouter 路由的 300+ 模型（Anthropic、OpenAI、Google、Meta 等） | `OPENROUTER_API_KEY` |
| `ai-sdk:google` | 通过 Vercel AI SDK 的 Google Gemini | `GOOGLE_GENERATIVE_AI_API_KEY` |
| `ai-sdk:groq` | 通过 Vercel AI SDK 的 Groq LPU | `GROQ_API_KEY` |
| `ai-sdk:mistral` | 通过 Vercel AI SDK 的 Mistral | `MISTRAL_API_KEY` |
| `ai-sdk:cohere` | 通过 Vercel AI SDK 的 Cohere | `COHERE_API_KEY` |
| `ai-sdk:ollama` | 通过 Vercel AI SDK 的本地 Ollama | 无（本地） |

## 引擎能力

每个引擎广告其能力：

| 能力 | Anthropic | AI SDK: Anthropic | AI SDK: OpenAI | AI SDK: Google |
|---|---|---|---|---|
| `thinking` | ✓ | ✓ | ✗ | ✓ |
| `promptCaching` | ✓ | ✓ | ✗ | ✗ |
| `vision` | ✓ | ✓ | ✓ | ✓ |
| `computerUse` | ✓ | ✗ | ✗ | ✗ |
| `parallelToolCalls` | ✓ | ✓ | ✓ | ✓ |

## Anthropic 专属功能

使用 `anthropic` 引擎（或 `ai-sdk:anthropic`）时：

- **提示缓存**自动应用于系统提示——在重复轮次上减少延迟和成本。
- **扩展思考**可以通过 `providerOptions.anthropic.thinking` 启用——agent 在响应前推理更长时间。

当非 Anthropic 引擎处于活动状态时，这些功能会被静默忽略（能力门控，不会破坏）。

## 使用 OpenRouter

`ai-sdk:openrouter` 通过单个 API 访问来自多个提供商的 300+ 模型。模型 ID 使用 `vendor/model` 格式：

```
set-agent-engine --engine "ai-sdk:openrouter" --model "anthropic/claude-sonnet-4.5"
set-agent-engine --engine "ai-sdk:openrouter" --model "openai/gpt-4o"
set-agent-engine --engine "ai-sdk:openrouter" --model "google/gemini-2.5-pro"
```

[openrouter.ai/models](https://openrouter.ai/models) 上的任何 `vendor/model` 字符串都可以——注册表中的 `supportedModels` 列表是 UI 提示，而非允许列表。

**应用归属**（可选）：在引擎配置中传递 `appName` / `appUrl` 以设置 `X-OpenRouter-Title` / `HTTP-Referer` 请求头——有助于在 OpenRouter 仪表板和排行榜上看到你的应用：

```ts
createAISDKEngine("openrouter", {
  apiKey: process.env.OPENROUTER_API_KEY,
  appName: "My App",
  appUrl: "https://myapp.example",
});
```

## 注册自定义引擎

在启动时在服务器插件中注册自定义引擎。从 `@agent-native/core/agent/engine` 子路径导入：

```ts
// server/plugins/my-engine.ts
import {
  registerAgentEngine,
  type AgentEngine,
  type EngineEvent,
  type EngineStreamOptions,
} from "@agent-native/core/agent/engine";

registerAgentEngine({
  name: "my-engine",
  label: "My Custom Engine",
  description: "...",
  capabilities: {
    thinking: false,
    promptCaching: false,
    vision: false,
    computerUse: false,
    parallelToolCalls: true,
  },
  defaultModel: "my-model-v1",
  supportedModels: ["my-model-v1", "my-model-v2"],
  requiredEnvVars: ["MY_ENGINE_API_KEY"],
  create: (config): AgentEngine => ({
    name: "my-engine",
    label: "My Custom Engine",
    defaultModel: "my-model-v1",
    supportedModels: ["my-model-v1", "my-model-v2"],
    capabilities: {
      /* 与上面相同的形状 */
    } as any,
    async *stream(opts: EngineStreamOptions): AsyncIterable<EngineEvent> {
      // 随着模型返回而 yield text-delta / thinking-delta / tool-call / usage 事件
      // 然后：
      yield { type: "assistant-content", parts: /* 最终内容部分 */ [] };
      yield { type: "stop", reason: "end_turn" };
    },
  }),
});
```

### 引擎流契约

每个引擎的 `stream(opts)` 必须按顺序发出：

1. 零个或多个 `text-delta`、`thinking-delta`、`tool-call` 和 `usage` 事件，随模型返回而到达。
2. 恰好一个 `{ type: "assistant-content", parts }` 事件，包含轮次的结构化内容。`runAgentLoop` 读取此事件以为下一轮次重建助手消息。
3. 恰好一个终止 `{ type: "stop", reason }` 事件。

注册后，引擎出现在 `list-agent-engines` 输出中，可以通过 `set-agent-engine` 选择。

## 环境变量参考

| 变量 | 用途 |
|---|---|
| `ANTHROPIC_API_KEY` | `anthropic` 和 `ai-sdk:anthropic` 引擎必需 |
| `OPENAI_API_KEY` | `ai-sdk:openai` 必需 |
| `OPENROUTER_API_KEY` | `ai-sdk:openrouter` 必需 |
| `GOOGLE_GENERATIVE_AI_API_KEY` | `ai-sdk:google` 必需 |
| `GROQ_API_KEY` | `ai-sdk:groq` 必需 |
| `MISTRAL_API_KEY` | `ai-sdk:mistral` 必需 |
| `COHERE_API_KEY` | `ai-sdk:cohere` 必需 |
| `AGENT_ENGINE` | 默认引擎名称（被设置存储覆盖） |