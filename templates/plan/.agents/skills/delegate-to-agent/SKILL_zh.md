---
name: delegate-to-agent
description: >-
  如何将所有 AI 工作委托给代理聊天。当从 UI 或脚本向代理委托 AI 工作时，
  当用户要求代理行为或 LLM 驱动的功能时，当想要添加内联 LLM 调用时，
  或当从应用代码向代理发送消息时使用。
metadata:
  internal: true
---

# 将所有 AI 委托给代理

## 规则

UI 从不直接调用 LLM。产品工作流通过聊天桥接委托给代理，以便用户可以看到、引导和审计工作。服务器端一次性模型调用是仅用于狭窄文本转换的明确逃生舱；当工作有意不需要工具、聊天历史或运行状态时，使用 `@agent-native/core/server` 中的 `completeText()`。

## 原因

代理是唯一的 AI 接口。它拥有关于完整项目的上下文，可以读写任何文件，并可以运行脚本。内联 LLM 调用绕过了这一点 — 它们创建了一个不知道代理所知内容且无法与之协调的影子 AI。

## 如何操作

**从 UI（客户端）：**

```ts
import { sendToAgentChat } from "@agent-native/core/client";

sendToAgentChat({
  message: "生成此文档的摘要",
  context: documentContent, // 可选的隐藏上下文（不在聊天 UI 中显示）
  submit: true, // 自动提交给代理
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

这仍然是一个完整的代理运行：工具、actions、线程状态和运行跟踪都保持活跃。它只是不聚焦或打开侧边栏。

**从脚本（Node）：**

```ts
import { agentChat } from "@agent-native/core";

agentChat.submit("处理上传的图片并创建缩略图");
```

**对于狭窄的服务器端文本转换：**

```ts
import { completeText } from "@agent-native/core/server";

const result = await completeText({
  systemPrompt: "精确返回一个情感标签。",
  input: messageBody,
  maxOutputTokens: 12,
  temperature: 0,
});
```

将面向用户的使用包装在 actions 中，这样 UI 和代理共享相同的操作。不要直接调用提供者 SDK。

**从 UI，检测代理何时完成：**

```ts
import { useAgentChatGenerating } from "@agent-native/core/client";

function MyComponent() {
  const isGenerating = useAgentChatGenerating();
  // 在代理工作时显示加载状态
}
```

## `submit` vs 预填充

`submit` 选项控制消息是自动发送还是放置在聊天输入中供用户审查：

| `submit` 值  | 行为                                | 使用时机                                                                            |
| ------------ | ----------------------------------- | ----------------------------------------------------------------------------------- |
| `true`       | 立即自动提交给代理                  | 用户已经批准的常规操作                                    |
| `false`      | 预填充聊天输入供用户审查 | 高风险操作（删除数据、修改代码、有副作用的 API 调用） |
| 省略         | 使用项目的默认设置      | 通用委托                                                          |

```ts
// 自动提交：常规操作
sendToAgentChat({ message: "更新项目摘要", submit: true });

// 预填充：让用户在发送前审查
sendToAgentChat({
  message: "删除所有超过 30 天的项目",
  submit: false,
});
```

## 从提示生成时首先捕获用户输入

产生新内容的按钮（"新建设计"、"创建仪表板"、"制作演示文稿"、"生成表单"）需要用户的提示作为输入。**切勿硬编码通用消息** — 结果将是用户并未真正要求的通用生成。

**错误** — 自动提交占位符消息；用户从未说过他们想要什么：

```tsx
<Button
  onClick={() =>
    sendToAgentChat({ message: "make a design", submit: true })
  }
>
  新建设计
</Button>
```

**正确** — 锚定到按钮的 Popover 捕获提示，然后提交它：

```tsx
<Popover open={open} onOpenChange={setOpen}>
  <PopoverTrigger asChild>
    <Button>新建设计</Button>
  </PopoverTrigger>
  <PopoverContent className="w-96">
    <Textarea
      autoFocus
      value={prompt}
      onChange={(e) => setPrompt(e.target.value)}
      placeholder="你想设计什么？"
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

**当输出取决于用户必须提供的提示时，始终先请求输入** — "设计什么？"、"关于什么的演示文稿？"、"哪个指标的仪表板？"、"哪个用例的表单？"。

**当意图明确时，无需输入即可自动提交：**

- 工具错误上的"尝试修复" — 提交错误详情和清晰的修复指令
- 瞬态失败后的"重试上次操作"
- 没有什么有意义的东西让用户添加的单用途按钮

如果你发现自己在用硬编码的创意动词（`"design a..."`、`"write a..."`、`"build a..."`）写 `submit: true`，停下来并添加一个 Popover。

## 委托给子代理（Agent Teams）

`sendToAgentChat()` 从应用代码委托_给_代理。委托的另一个轴是代理通过 Agent Teams 运行管理器将工作交给_子代理_。主聊天保持编排者：它生成子代理，然后读取和整合它们的结果。

### 何时生成子代理 vs 自己做

- **自己做**当工作很小、在关键路径上或与你已经在做的事情紧密耦合时。子代理的开销和协调风险超过了收益。
- **生成子代理**用于可以独立运行的自包含工作单元 — 一个独立的调查、一个隔离的实现片段、一个长时间运行的搜索 — 特别是当它释放主线程继续编排时。

### 简报契约

每个子代理简报必须指定四件事，否则子代理会猜测：

- **目标** — 它拥有的一个具体成果，用一句话描述。
- **上下文** — 它需要的事实（路径、先前的发现、约束），这样它不会重新推导它们。
- **输出** — 你想要回来的确切形状（摘要、编辑的文件、路径列表、带理由的是/否）。
- **边界** — 它不能触碰什么（文件、分支、副作用）以及何时停止并报告而不是继续推进。

### 扇出纪律

- **默认使用单个子代理。** 大多数委托是一个聚焦的任务。
- **仅为真正独立的单元生成多个**，这些单元不共享状态或文件。切勿并行化耦合的工作 — 如果 B 需要 A 的输出，按顺序运行它们。
- **将并行扇出限制在约 3 个。** 更多子代理意味着更多综合成本和更多对同一区域冲突编辑的机会。

### 综合纪律

- 在得出结论之前**阅读每个结果** — 不要根据第一个返回的结果行动。
- **明确协调**子代理发现之间的冲突；决定哪个是正确的，而不是平均或忽略。
- **整合为一个答案。** 主线程产生单一连贯的结果；它从不只是将原始子代理转录转发给用户。

后台子代理必须使用核心运行管理器 / Agent Teams 基础设施，而不是临时 LLM 调用。

## 禁止事项

- 不要在客户端或服务器代码中 `import Anthropic from "@anthropic-ai/sdk"`
- 不要在客户端或服务器代码中 `import OpenAI from "openai"`
- 不要直接调用任何 LLM 提供者的 API
- 不要使用 AI SDK 函数如 `generateText()`、`streamText()` 等
- 不要构建绕过代理聊天的"AI 功能"
- 不要为生成操作自动提交硬编码提示 — 首先捕获用户输入（见上文）
- 不要对需要工具、数据库写入、可审计性、用户引导或多步推理的工作流使用 `completeText()`。改用代理聊天，可选择 `background: true`。

## 例外

脚本可以调用外部 API（图片生成、搜索等）— 但 AI 推理和编排仍然通过代理进行。脚本是代理使用的工具，不是代理的替代品。

`completeText()` 允许用于小型服务器端转换，如分类、提取、重写短字符串或规范化混乱的提供者文本。它有意以 `tools: []` 运行，不创建聊天线程状态。

## 何时使用 A2A

`sendToAgentChat()` 将工作委托给**本地**代理 — 与你的应用一起运行的那个。当工作应该交给一个完全**不同**的代理时（例如，向分析代理请求数据，或向日历代理请求可用性），改用 A2A（agent-to-agent）协议。

```ts
import { callAgent } from "@agent-native/core/a2a";

// 调用不同的代理 — 不是本地代理聊天
const stats = await callAgent(
  "https://analytics.example.com",
  "上周的注册量是多少？",
  { apiKey: process.env.ANALYTICS_A2A_KEY },
);
```

完整模式请参阅 **a2a-protocol** 技能。

## 相关技能

- **a2a-protocol** — 当工作交给不同的代理，不是本地代理时
- **actions** — 代理通过 `pnpm action <name>` 调用 actions 来执行复杂操作
- **self-modifying-code** — 代理通过聊天桥接进行代码更改
- **storing-data** — 代理在处理请求后将结果写入数据库
- **real-time-sync** — 当代理写入数据时 UI 自动更新