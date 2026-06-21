---
name: delegate-to-agent
description: >-
  如何将所有 AI 工作委托给 agent 聊天。在从 UI 或脚本向 agent 委托 AI 工作、
  用户要求 agent 行为或 LLM 驱动的功能、想要添加内联 LLM 调用时或从
  应用代码向 agent 发送消息时使用。
metadata:
  internal: true
---

# 将所有 AI 委托给 Agent

## 规则

UI 永远不直接调用 LLM。产品工作流通过聊天桥接委托给 agent，这样用户可以查看、引导和审计工作。服务器端一次性模型调用是仅用于窄文本转换的显式逃生舱口；当工作明确不需要工具、聊天历史或运行状态时，使用 `@agent-native/core/server` 中的 `completeText()`。

## 为什么

Agent 是唯一的 AI 接口。它拥有完整项目的上下文，可以读写任何文件，可以运行脚本。内联 LLM 调用绕过了这些——它们创建了一个不知道 agent 所知内容且无法与之协调的影子 AI。

## 如何

**从 UI（客户端）：**

```ts
import { sendToAgentChat } from "@agent-native/core/client";

sendToAgentChat({
  message: "Generate a summary of this document",
  context: documentContent, // optional hidden context (not shown in chat UI)
  submit: true, // auto-submit to the agent
});
```

**从 UI，在后台：**

```ts
import { sendToAgentChat } from "@agent-native/core/client";

sendToAgentChat({
  message: "Analyze this import and create any missing records",
  context: `Import batch id: ${batchId}`,
  submit: true,
  newTab: true,
  background: true,
  openSidebar: false,
});
```

这仍然是完整的 agent 运行：工具、action、线程状态和运行跟踪
都保持活跃。它只是不聚焦或打开侧边栏。

**从脚本（Node）：**

```ts
import { agentChat } from "@agent-native/core";

agentChat.submit("Process the uploaded images and create thumbnails");
```

**用于窄范围的服务器端文本转换：**

```ts
import { completeText } from "@agent-native/core/server";

const result = await completeText({
  systemPrompt: "Return exactly one sentiment label.",
  input: messageBody,
  maxOutputTokens: 12,
  temperature: 0,
});
```

将面向用户的用途包装在 action 中，这样 UI 和 agent 共享相同的操作。
不要直接调用提供商 SDK。

**从 UI，检测 agent 何时完成：**

```ts
import { useAgentChatGenerating } from "@agent-native/core/client";

function MyComponent() {
  const isGenerating = useAgentChatGenerating();
  // 在 agent 工作时显示加载状态
}
```

## `submit` vs 预填充

`submit` 选项控制消息是自动发送还是放置在聊天输入中供用户审查：

| `submit` 值   | 行为                               | 何时使用                                                                             |
| -------------- | ---------------------------------- | ------------------------------------------------------------------------------------ |
| `true`         | 立即自动提交给 agent               | 用户已批准的常规操作                                                                 |
| `false`        | 预填充聊天输入供用户审查           | 高风险操作（删除数据、修改代码、有副作用的 API 调用）                                 |
| 省略           | 使用项目的默认设置                 | 通用委托                                                                             |

```ts
// 自动提交：常规操作
sendToAgentChat({ message: "Update the project summary", submit: true });

// 预填充：让用户在发送前审查
sendToAgentChat({
  message: "Delete all projects older than 30 days",
  submit: false,
});
```

## 从 prompt 生成时先捕获用户输入

产生新内容的按钮（"New Design"、"Create Dashboard"、"Make Deck"、"Generate Form"）需要用户的 prompt 作为输入。**永远不要硬编码通用消息**——结果将是用户并未实际要求的通用生成。

**坏的做法**——自动提交占位符消息；用户从未说过他们想要什么：

```tsx
<Button
  onClick={() =>
    sendToAgentChat({ message: "make a design", submit: true })
  }
>
  New Design
</Button>
```

**好的做法**——锚定到按钮的 Popover 捕获 prompt，然后提交它：

```tsx
<Popover open={open} onOpenChange={setOpen}>
  <PopoverTrigger asChild>
    <Button>New Design</Button>
  </PopoverTrigger>
  <PopoverContent className="w-96">
    <Textarea
      autoFocus
      value={prompt}
      onChange={(e) => setPrompt(e.target.value)}
      placeholder="What do you want to design?"
    />
    <Button
      onClick={() => {
        sendToAgentChat({ message: prompt, submit: true });
        setOpen(false);
        setPrompt("");
      }}
    >
      Create
    </Button>
  </PopoverContent>
</Popover>
```

**当输出取决于用户必须提供的 prompt 时，始终先询问输入**——"设计什么？"、"关于什么的幻灯片？"、"哪个指标的仪表板？"、"哪个用例的表单？"。

**当意图明确时，无需输入即可自动提交：**

- 工具错误上的"尝试修复"——提交错误详情和明确的修复指令
- 瞬态失败后的"重试上次操作"
- 没有有意义内容让用户添加的单一用途按钮

如果你发现自己在写 `submit: true` 并带有硬编码的创造性动词（`"design a..."`、`"write a..."`、`"build a..."`），停下来添加一个 Popover。

## 委托给子 Agent（Agent Teams）

`sendToAgentChat()` 从应用代码委托_给_ agent。另一个委托轴是 agent 通过 Agent Teams 运行管理器将工作交给_子 agent_。主聊天保持编排者：它生成子 agent，然后读取和整合它们的结果。

### 何时生成子 agent vs 自己做

- **自己做**当工作很小、在关键路径上或与你已经在做的事情紧密耦合时。子 agent 的开销和协调风险超过了收益。
- **生成子 agent**用于可以独立运行的自包含工作单元——一个不相关的调查、一个隔离的实现切片、一个长时间运行的搜索——特别是当它释放主线程继续编排时。

### 简报契约

每个子 agent 简报必须指定四件事，否则子 agent 会猜测：

- **目标**——它拥有的一句具体结果。
- **上下文**——它需要的事实（路径、先前发现、约束），这样它不需要重新推导。
- **输出**——你想要回来的确切形状（摘要、编辑的文件、路径列表、带理由的是/否）。
- **边界**——它绝不能触碰什么（文件、分支、副作用）以及何时停止并报告而不是继续推进。

### 扇出纪律

- **默认使用单个子 agent。** 大多数委托是一个聚焦任务。
- **仅为真正独立的单元生成多个**，这些单元不共享状态或文件。永远不要并行化耦合的工作——如果 B 需要 A 的输出，按顺序运行它们。
- **将并行扇出限制在约 3 个。** 更多子 agent 意味着更多合成成本和更多对同一区域冲突编辑的机会。

### 合成纪律

- **在得出结论前阅读每个结果**——不要对第一个返回的结果采取行动。
- **显式协调子 agent 发现之间的冲突**；决定哪个是正确的，而不是平均或忽略。
- **整合为一个答案。** 主线程产生单一连贯结果；它永远不会只是将原始子 agent 转录转发给用户。

后台子 agent 必须使用核心 run-manager / Agent Teams 基础设施
而不是临时 LLM 调用。

## 不要

- 不要在客户端或服务器代码中 `import Anthropic from "@anthropic-ai/sdk"`
- 不要在客户端或服务器代码中 `import OpenAI from "openai"`
- 不要直接调用任何 LLM 提供商的 API
- 不要使用 AI SDK 函数如 `generateText()`、`streamText()` 等
- 不要构建绕过 agent 聊天的"AI 功能"
- 不要为生成操作自动提交硬编码的 prompt——先捕获用户输入（见上文）
- 不要将 `completeText()` 用于需要工具、数据库写入、可审计性、用户引导
  或多步推理的工作流。使用 agent 聊天，可选地使用 `background: true`。

## 例外

脚本可以调用外部 API（图像生成、搜索等）——但 AI 推理和编排仍然通过 agent。脚本是 agent 使用的工具，不是 agent 的替代品。

`completeText()` 允许用于小型服务器端转换，如分类、提取、重写短字符串或规范化混乱的
提供商文本。它故意以 `tools: []` 运行，不创建聊天线程状态。

## 何时使用 A2A 代替

`sendToAgentChat()` 将工作委托给**本地** agent——与你的应用一起运行的那个。当工作应该交给完全不同的 agent（例如向分析 agent 请求数据，或向日历 agent 请求可用性）时，改用 A2A（agent-to-agent）协议。

```ts
import { callAgent } from "@agent-native/core/a2a";

// 调用不同的 agent——不是本地 agent 聊天
const stats = await callAgent(
  "https://analytics.example.com",
  "What were last week's signups?",
  { apiKey: process.env.ANALYTICS_A2A_KEY },
);
```

完整模式见 **a2a-protocol** skill。

## 相关 Skill

- **a2a-protocol**——当工作交给不同的 agent，不是本地 agent 时
- **actions**——Agent 通过 `pnpm action <name>` 调用 action 执行复杂操作
- **self-modifying-code**——Agent 通过聊天桥接进行代码变更
- **storing-data**——Agent 在处理请求后将结果写入数据库
- **real-time-sync**——当 agent 写入数据时 UI 自动更新