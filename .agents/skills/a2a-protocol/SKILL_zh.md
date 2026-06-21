---
name: a2a-protocol
description: >-
  agent 如何通过 A2A（agent-to-agent）JSON-RPC 协议调用其他 agent。
  在启用 agent 间通信、向其他 agent 暴露 agent skill 或从脚本调用
  外部 agent 时使用。
metadata:
  internal: true
---

# A2A 协议（Agent-to-Agent）

## 规则

Agent 可以使用 A2A 协议调用其他 agent。这是一个基于 JSON-RPC 的协议，用于 agent 发现和通信。当工作应该交给完全不同的 agent 时使用它——而不是本地 agent 聊天。

## 为什么

Agent-native 应用不是孤立存在的。邮件 agent 可能需要分析数据。日历 agent 可能需要搜索 issue。A2A 让 agent 相互发现、发送消息和接收结构化结果——全部通过带有 bearer 令牌认证的 HTTP。

## 如何启用 A2A（服务器端）

在服务器插件中添加 `mountA2A()`：

```ts
// server/plugins/a2a.ts
import { mountA2A } from "@agent-native/core/a2a";

export default defineNitroPlugin((nitro) => {
  const app = nitro.h3App;

  mountA2A(app, {
    name: "Analytics Agent",
    description: "Queries analytics data across providers",
    version: "1.0.0",
    skills: [
      {
        id: "query-data",
        name: "Query Data",
        description: "Run analytics queries across connected data sources",
        tags: ["analytics", "data"],
        examples: ["What were last week's signups?", "Show conversion rates"],
      },
    ],
    apiKeyEnv: "A2A_API_KEY", // env var holding the bearer token
    streaming: true,          // enable message/stream method
  });
});
```

这会挂载 agent-native A2A 端点：

- `GET /.well-known/agent-card.json`——公共 agent 发现（无需认证）
- `POST /_agent-native/a2a`——主要 JSON-RPC 端点（需要 bearer 令牌认证）

客户端可能回退到 `POST /a2a` 用于仅暴露该简单路径的外部或遗留对等方。
新的 agent-native 应用应文档化并调用 `/_agent-native/a2a` 端点。

## 配置对象

```ts
interface A2AConfig {
  name: string;           // agent 显示名称
  description: string;    // 此 agent 做什么
  version?: string;       // semver 版本（默认："1.0.0"）
  skills: AgentSkill[];   // 此 agent 暴露的能力
  handler?: A2AHandler;   // 自定义消息处理器
  apiKeyEnv?: string;     // bearer 令牌认证的环境变量名
  streaming?: boolean;    // 启用流式响应
}

interface AgentSkill {
  id: string;             // 唯一 skill 标识符
  name: string;           // 人类可读名称
  description: string;    // 此 skill 做什么
  tags?: string[];        // 分类标签
  examples?: string[];    // 示例 prompt
}
```

## Agent 卡片

Agent 卡片在 `GET /.well-known/agent-card.json` 自动生成。其他 agent 获取此卡片以发现可用的 skill：

```json
{
  "name": "Analytics Agent",
  "description": "Queries analytics data across providers",
  "url": "https://analytics.example.com",
  "version": "1.0.0",
  "protocolVersion": "0.3",
  "capabilities": { "streaming": true },
  "skills": [
    {
      "id": "query-data",
      "name": "Query Data",
      "description": "Run analytics queries across connected data sources"
    }
  ]
}
```

## 调用另一个 Agent

### 简单方式：`callAgent()`（文本输入，文本输出）

```ts
import { callAgent } from "@agent-native/core/a2a";

const answer = await callAgent(
  "https://analytics.example.com",
  "What were last week's signups?",
  { apiKey: process.env.ANALYTICS_A2A_KEY },
);
// answer is a plain string
```

### 高级方式：`A2AClient`（完全控制）

```ts
import { A2AClient } from "@agent-native/core/a2a";

const client = new A2AClient(
  "https://analytics.example.com",
  process.env.ANALYTICS_A2A_KEY,
);

// 发现 agent 能力
const card = await client.getAgentCard();

// 发送消息并获取任务
const task = await client.send({
  role: "user",
  parts: [{ type: "text", text: "What were last week's signups?" }],
});
// task.status.state === "completed"
// task.status.message.parts[0].text === "Last week: 1,247 signups..."

// 流式响应
for await (const update of client.stream({
  role: "user",
  parts: [{ type: "text", text: "Detailed breakdown by day" }],
})) {
  console.log(update.status.state, update.status.message);
}
```

## JSON-RPC 方法

| 方法              | 用途                           | 需要认证 |
| ----------------- | ------------------------------ | -------- |
| `message/send`   | 发送消息，获取任务             | 是       |
| `message/stream` | 发送消息，流式响应             | 是       |
| `tasks/get`      | 按 ID 获取任务状态             | 是       |
| `tasks/cancel`   | 取消运行中的任务               | 是       |

## 任务生命周期

任务经历以下状态：

```
submitted → working → completed
                    → failed
                    → canceled
                    → input-required
```

- **submitted**——消息已接收，尚未处理
- **working**——agent 正在处理请求
- **completed**——agent 完成，结果在 `status.message` 中
- **failed**——agent 遇到错误
- **canceled**——任务通过 `tasks/cancel` 被取消
- **input-required**——agent 需要调用者提供更多信息

## 安全

A2A 使用 bearer 令牌认证。服务器从 `apiKeyEnv` 指定的环境变量读取令牌：

- 在服务器的部署环境中设置 `A2A_API_KEY=<A2A_API_KEY_VALUE>`
- 调用者将其作为 `Authorization: Bearer <A2A_API_KEY_VALUE>` 传递
- Agent 卡片端点（`/.well-known/agent-card.json`）是公共的——发现无需认证

永远不要在源代码、文档、prompt、应用状态、action 描述、客户端包或示例中
硬编码 bearer 令牌。A2A 令牌是部署级秘密，除非特定应用设计了限定范围的
凭证流；从安全运行时配置读取它们，永远不要记录或返回它们。

## 消息部分

消息包含类型化部分：

| 部分类型 | 字段                                | 用途                       |
| -------- | ----------------------------------- | -------------------------- |
| `text`   | `{ type: "text", text: "..." }`     | 自然语言消息               |
| `file`   | `{ type: "file", file: { ... } }`   | 文件（字节或 URI）         |
| `data`   | `{ type: "data", data: { ... } }`   | 结构化 JSON 数据           |

## 示例：跨 Agent 工作流

邮件 agent 调用分析 agent 以在邮件草稿中包含数据：

```ts
// actions/draft-with-analytics.ts
import { callAgent } from "@agent-native/core/a2a";
import { writeAppState } from "@agent-native/core/application-state";

export default async function (args: string[]) {
  // 向分析 agent 请求数据
  const stats = await callAgent(
    process.env.ANALYTICS_AGENT_URL!,
    "Summarize last week's key metrics in 3 bullet points",
    { apiKey: process.env.ANALYTICS_A2A_KEY },
  );

  // 创建包含分析数据的草稿
  await writeAppState("compose-analytics-report", {
    id: "analytics-report",
    to: "team@example.com",
    subject: "Weekly Analytics Summary",
    body: `Hi team,\n\nHere are last week's numbers:\n\n${stats}\n\nBest`,
    mode: "compose",
  });
}
```

## 所有类型

所有类型从 `@agent-native/core/a2a` 导出：

```ts
import type {
  A2AConfig,
  A2AHandler,
  A2AHandlerContext,
  A2AHandlerResult,
  AgentCard,
  AgentSkill,
  AgentCapabilities,
  Task,
  TaskState,
  TaskStatus,
  Message,
  Part,
  TextPart,
  FilePart,
  DataPart,
  Artifact,
  JsonRpcRequest,
  JsonRpcResponse,
} from "@agent-native/core/a2a";
```

## 相关 Skill

- **delegate-to-agent**——用于本地 agent 处理的工作。当工作交给不同 agent 时使用 A2A。
- **actions**——A2A 调用通常发生在 action 内部
- **storing-data**——A2A 调用的结果像任何其他数据一样存储在 SQL 中