---
name: delegate-to-agent
description: >-
  如何将所有 AI 工作委托给智能体聊天。在从 UI 或脚本将 AI 工作委托给智能体时、
  当用户要求智能体行为或 LLM 驱动的功能时、当想要添加内联 LLM 调用时、
  或当从应用代码向智能体发送消息时使用。
metadata:
  internal: true
---

# 将所有 AI 委托给智能体

## 规则

UI 绝不直接调用 LLM。产品工作流通过聊天桥接委托给智能体，以便用户可以查看、引导和审核工作。服务器端一次性模型调用是仅用于窄文本转换的显式逃生通道；当工作有意不需要工具、聊天历史或运行状态时，使用 `@agent-native/core/server` 中的 `completeText()`。

## 原因

智能体是唯一的 AI 接口。它拥有关于整个项目的上下文，可以读取/写入任何文件，并可以运行脚本。内联 LLM 调用绕过了这一点 — 它们创建了一个不知道智能体所知内容且无法与之协调的影子 AI。

## 如何操作

**从 UI（客户端）：**

```ts
import { sendToAgentChat } from "@agent-native/core/client";

sendToAgentChat({
  message: "生成此文档的摘要",
  context: documentContent, // 可选的隐藏上下文（不在聊天 UI 中显示）
  submit: true, // 自动提交给智能体
});
```

**从 UI，在后台：**

```ts
import { sendToAgentChat } from "@agent-native/core/client";

sendToAgentChat({
  message: "分析此导入并创建任何缺失的记录",
  context: `Import batch id: ${batchId}`,
  submit: true,
  newTab: true,
  background: true,
  openSidebar: false,
});
```

这仍然是一个完整的智能体运行：工具、action、线程状态和运行跟踪都保持活跃。它只是不聚焦或打开侧边栏。

**从脚本（Node）：**

```ts
import { agentChat } from "@agent-native/core";

agentChat.submit("处理上传的图像并创建缩略图");
```

**对于窄服务器端文本转换：**

```ts
import { completeText } from "@agent-native/core/server";

const result = await completeText({
  systemPrompt: "仅返回一个情感标签。",
  input: messageBody,
  maxOutputTokens: 12,
  temperature: 0,
});
```

将面向用户的使用包装在 action 中，以便 UI 和智能体共享同一操作。
不要直接调用提供商 SDK。

**从 UI，检测智能体何时完成：**

```ts
import { useAgentChatGenerating } from "@agent-native/core/client";

function MyComponent() {
  const isGenerating = useAgentChatGenerating();
  // 在智能体工作时显示加载状态
}
```

## `submit` vs 预填充

`submit` 选项控制消息是自动发送还是放置在聊天输入中供用户审核：

| `submit` 值   | 行为                           | 使用场景                                                                           |
| -------------- | ------------------------------ | ---------------------------------------------------------------------------------- |
| `true`         | 立即自动提交给智能体           | 用户已批准的常规操作                                                               |
| `false`        | 预填充聊天输入供用户审核       | 高风险操作（删除数据、修改代码、有副作用的 API 调用）                              |
| 省略           | 使用项目的默认设置             | 通用委托                                                                           |

```ts
// 自动提交：常规操作
sendToAgentChat({ message: "更新项目摘要", submit: true });

// 预填充：让用户在发送前审核
sendToAgentChat({
  message: "删除所有超过 30 天的项目",
  submit: false,
});
```

## 从提示生成时首先捕获用户输入

产生新内容的按钮（"新设计"、"创建仪表板"、"制作幻灯片"、"生成表单"）需要用户的提示作为输入。**绝不硬编码通用消息** — 结果将是用户并未真正要求的通用生成。

**错误** — 自动提交占位消息；用户从未说过他们想要什么：

```tsx
<Button
  onClick={() =>
    sendToAgentChat({ message: "make a design", submit: true })
  }
>
  新设计
</Button>
```

**正确** — 锚定到按钮的 Popover 捕获提示，然后提交它：

```tsx
<Popover open={open} onOpenChange={setOpen}>
  <PopoverTrigger asChild>
    <Button>新设计</Button>
  </PopoverTrigger>
  <PopoverContent className="w-96">
    <Textarea
      autoFocus
      value={prompt}
      onChange={(e) => setPrompt(e.target.value)}
      placeholder="你想要设计什么？"
    />
    <Button
      onClick={() => {
        sendToAgentChat({ message: prompt, submit: true });
        setOpen(false);
        setPrompt("");
      }}
    >
      创建
    </Button>
  </PopoverContent>
</Popover>
```

**当输出取决于用户必须提供的提示时，始终先请求输入** — "设计什么？"、"关于什么的幻灯片？"、"哪个指标的仪表板？"、"哪个用例的表单？"。

**当意图明确时，无需输入即可自动提交：**

- 工具错误上的"尝试修复" — 提交错误详情和明确的修复指令
- 瞬态故障后的"重试上次操作"
- 没有有意义内容供用户添加的单用途按钮

如果你发现自己在用硬编码的创意动词（`"design a..."`、`"write a..."`、`"build a..."`）编写 `submit: true`，停下来并添加一个 Popover。

## 委托给子智能体（Agent Teams）

`sendToAgentChat()` 从应用代码委托_给_智能体。委托的另一个轴是智能体通过 Agent Teams 运行管理器将工作_交给子智能体_。主聊天保持协调者：它生成子智能体，然后读取并整合它们的结果。

### 何时生成子智能体 vs 自己做

- **自己做**当工作很小、在关键路径上或与你正在做的事情紧密耦合时。子智能体的开销和协调风险超过了收益。
- **生成子智能体**用于可以独立运行的自包含工作单元 — 一个独立的调查、一个隔离的实现切片、一个长时间运行的搜索 — 特别是当它释放主线程继续协调时。

### 简报契约

每个子智能体简报必须指定四件事，否则子智能体会猜测：

- **目标** — 它拥有的一个具体结果，用一句话描述。
- **上下文** — 它需要的事实（路径、先前发现、约束），以免重新推导。
- **输出** — 你想要回来的确切形状（摘要、编辑的文件、路径列表、带理由的是/否）。
- **边界** — 它绝不能触碰什么（文件、分支、副作用）以及何时停止并报告而非继续推进。

### 扇出纪律

- **默认使用单个子智能体。** 大多数委托是一个聚焦任务。
- **仅为真正独立的单元生成多个**，这些单元不共享状态或文件。绝不并行化耦合工作 — 如果 B 需要 A 的输出，顺序运行它们。
- **将并行扇出限制在约 3 个。** 更多子智能体意味着更多综合成本和更多对同一区域冲突编辑的机会。

### 综合纪律

- 在下结论前**阅读每个结果** — 不要对第一个返回的结果采取行动。
- **明确协调**子智能体发现之间的冲突；决定哪个是正确的，而非平均或忽略。
- **整合为一个答案。** 主线程产生单一连贯结果；它绝不只是将原始子智能体记录转发给用户。

后台子智能体必须使用核心运行管理器 / Agent Teams 基础设施，而非临时 LLM 调用。

## 不应该做的

- 不要在客户端或服务器代码中 `import Anthropic from "@anthropic-ai/sdk"`
- 不要在客户端或服务器代码中 `import OpenAI from "openai"`
- 不要直接调用任何 LLM 提供商的 API
- 不要使用 AI SDK 函数如 `generateText()`、`streamText()` 等
- 不要构建绕过智能体聊天的"AI 功能"
- 不要为生成操作自动提交硬编码提示 — 首先捕获用户输入（见上文）
- 不要将 `completeText()` 用于需要工具、数据库写入、可审计性、用户引导或多步推理的工作流。使用智能体聊天代替，可选使用 `background: true`。

## 例外

脚本可以调用外部 API（图像生成、搜索等） — 但 AI 推理和编排仍通过智能体进行。脚本是智能体使用的工具，不是智能体的替代品。

`completeText()` 允许用于小型服务器端转换，如分类、提取、重写短字符串或规范化混乱的提供商文本。它有意以 `tools: []` 运行，不创建聊天线程状态。

## 何时使用 A2A

`sendToAgentChat()` 将工作委托给**本地**智能体 — 与你的应用一起运行的那个。当工作应该交给一个完全**不同**的智能体时（例如，向分析智能体请求数据，或向日历智能体请求可用性），改用 A2A（智能体到智能体）协议。

```ts
import { callAgent } from "@agent-native/core/a2a";

// 调用不同的智能体 — 不是本地智能体聊天
const stats = await callAgent(
  "https://analytics.example.com",
  "上周有多少注册？",
  { apiKey: process.env.ANALYTICS_A2A_KEY },
);
```

完整模式请参阅 **a2a-protocol** 技能。

## 相关技能

- **a2a-protocol** — 当工作交给不同的智能体而非本地智能体时
- **actions** — 智能体通过 `pnpm action <name>` 调用 action 执行复杂操作
- **self-modifying-code** — 智能体通过聊天桥接操作进行代码更改
- **storing-data** — 智能体在处理请求后将结果写入数据库
- **real-time-sync** — 当智能体写入数据时 UI 自动更新