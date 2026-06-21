---
name: observability
description: >-
  Agent 可观测性、评估、反馈和实验。在添加可观测性仪表板、配置跟踪捕获、设置评估、创建 A/B 实验或收集用户对 Agent 响应的反馈时使用。
metadata:
  internal: true
---

# Agent 可观测性

## 规则

可观测性系统零配置自动检测每个 Agent 运行。跟踪、自动评估和反馈收集开箱即用。所有数据存在于应用自己的 SQL 数据库中 — 不需要外部服务。模板可以选择导出到 Langfuse、Datadog 或任何兼容 OTel 的平台。

## 五大支柱

### 1. 跟踪

每个 `runAgentLoop()` 调用通过 `packages/core/src/observability/traces.ts` 中的 `instrumentAgentLoop()` 自动检测。它捕获：

- **agent_run** span — 顶级父级，包含总持续时间和成本
- **llm_call** span — 模型名称、令牌计数（输入、输出、缓存读/写）、成本
- **tool_call** span — 每次 action 调用一个，包含持续时间和成功/错误

内容（提示、工具参数、工具结果）默认**被编辑**。通过 `observability-config` 设置键选择加入：

```ts
await putSetting("observability-config", {
  enabled: true,
  capturePrompts: false,
  captureToolArgs: true,    // 捕获 action 输入参数
  captureToolResults: false,
  evalSampleRate: 0.05,     // 5% 的运行获得 LLM-as-judge 评估
});
```

### 2. 反馈

**显式** — `ThumbsFeedback` 组件在聊天 UI 中每个 Agent 消息上渲染内联的拇指向上/向下。拇指向下打开类别弹出框（不准确、无帮助、错误工具、太慢）。已通过 `React.lazy` 接入 `AssistantChat.tsx`。

**隐式** — `computeSatisfactionScore(threadId)` 从对话信号计算挫败指数（0-100）：
- 重述检测（权重 30）：连续相似的用户消息
- 放弃（权重 20）：Agent 响应后会话很快结束
- 情绪（权重 15）：负面语言模式
- 长度趋势（权重 15）：消息长度递减
- 重试模式（权重 20）："再试一次"、"不，那是错的"

分数解释：0-20 健康、20-40 摩擦、40-60 不满意、60+ 损坏。

满意度评分在每个带 threadId 的反馈 POST 后自动触发。

### 3. 评估

三层，通过可观测性配置中的 `evalSampleRate` 配置：

**自动（每次运行）：** 在每次跟踪运行后运行的确定性评分器：
- `tool_success_rate` — 无错误的工具调用百分比
- `step_efficiency` — 无工具运行为 1.0；对使用工具的运行惩罚过多 LLM 迭代
- `latency_score` — 相对于 10s/工具基线标准化
- `cost_efficiency` — 相对于 50 centicents/工具基线标准化
- `error_recovery` — 如果运行从工具错误恢复或没有错误则为 1.0

**LLM-as-judge（采样）：** 在 `evalSampleRate` 比例的运行上运行。用评判提示调用配置的引擎，按自定义标准评分。

**数据集评估：** `runDatasetEval(datasetId)` 将黄金数据集通过 Agent 运行并对每个案例评分。

自定义标准使用自然语言评分规则：
```ts
const criteria: EvalCriteria = {
  name: "helpfulness",
  description: "Was the response helpful and complete?",
  rubric: "0.0 = completely unhelpful, 0.5 = partially helpful, 1.0 = fully resolved the user's need",
};
```

#### 评估（CI 门控）

上面三层在事后对*真实生产运行*评分。对于主动的确定性门控，使用 `@agent-native/core/eval` 的一等 `*.eval.ts` 原语（源：`packages/core/src/eval/*`）。它对固定输入运行实际 Agent 循环，低于阈值时非零退出，因此它门控 CI/部署。

```ts
// evals/faq.eval.ts
import { defineEval, contains, llmJudge } from "@agent-native/core/eval";

export default defineEval({
  name: "answers the FAQ",
  input: { prompt: "What is your return policy?" },
  threshold: 0.7,
  scorers: [contains("30 days"), llmJudge({ criteria: "accuracy" })],
});
```

- 内置评分器：`exactMatch` / `contains` / `usesTool`（纯 JS）和 `llmJudge`（提供商无关评判）。
- 自定义评分器：`createScorer` 带 4 步 `preprocess → analyze → generateScore → generateReason` 管道（仅 `generateScore` 是必需的）。
- 作为门控运行：`agent-native eval [pattern] [--json] [--threshold N]` — 发现 `**/*.eval.ts` 和 `evals/*.ts`，运行 Agent，如果任何评估低于其阈值则非零退出。没有评估文件的应用退出 `0`。补充（不替代）`evals.ts` 中的事后评分。参见评估文档。

### 4. 实验

带粘性用户级分配的 A/B 测试：

```ts
import { insertExperiment, updateExperiment } from "@agent-native/core/observability";

const exp = {
  id: crypto.randomUUID(),
  name: "sonnet-vs-haiku",
  status: "draft" as const,
  variants: [
    { id: "control", weight: 50, config: { model: "claude-sonnet-4-6" } },
    { id: "treatment", weight: 50, config: { model: "claude-haiku-4-5-20251001" } },
  ],
  metrics: ["cost", "latency", "satisfaction"],
  assignmentLevel: "user" as const,
  startedAt: null,
  endedAt: null,
  createdAt: Date.now(),
};
await insertExperiment(exp);
// 准备好开始收集分配时将其移至 "running"。
await updateExperiment(exp.id, { status: "running" });
```

Agent 循环通过 `resolveActiveExperimentConfig()` 读取活跃实验并自动应用变体的 `model` 覆盖。分配使用一致性哈希 — 相同用户始终获得相同变体。

通过 `POST /_agent-native/observability/experiments/:id/results` 计算结果。

### 5. 仪表板

`ObservabilityDashboard` 是一个有 5 个标签页的 React 组件：
- **概览** — 指标卡片（运行、成本、延迟、工具成功率、拇指向上率、评估分数）
- **对话** — 跟踪列表，可下钻到 span 详情
- **评估** — 评估统计和标准细分条
- **实验** — 实验列表带状态徽章，可下钻到结果
- **反馈** — 反馈流、拇指比例、类别徽章

向任何模板添加仪表板路由：
```tsx
// app/routes/observability.tsx
import { ObservabilityDashboard } from "@agent-native/core/client";

export default function ObservabilityPage() {
  return (
    <div className="min-h-screen bg-background p-6">
      <ObservabilityDashboard />
    </div>
  );
}
```

## API 端点

全部自动挂载在 `/_agent-native/observability/*`：

| 方法 | 路径 | 用途 |
|------|------|------|
| GET | `/` | 概览统计 |
| GET | `/traces` | 列出跟踪摘要 |
| GET | `/traces/:runId` | 跟踪详情（摘要 + span） |
| GET | `/traces/:runId/evals` | 运行的评估 |
| POST | `/feedback` | 提交反馈 |
| GET | `/feedback` | 列出反馈条目 |
| GET | `/feedback/stats` | 反馈聚合 |
| GET | `/satisfaction` | 满意度分数 |
| GET | `/evals/stats` | 评估统计 |
| POST | `/experiments` | 创建实验 |
| GET | `/experiments` | 列出实验 |
| GET | `/experiments/:id` | 实验详情 |
| PUT | `/experiments/:id` | 更新实验状态 |
| POST | `/experiments/:id/results` | 计算实验结果 |
| GET | `/experiments/:id/results` | 获取实验结果 |

所有端点支持 `?since=N`（毫秒时间戳）和 `?limit=N` 查询参数。

## SQL 表

9 个表通过 `ensureObservabilityTables()` 自动创建：
- `agent_trace_spans` — 单个跟踪 span
- `agent_trace_summaries` — 聚合运行摘要
- `agent_feedback` — 显式用户反馈
- `agent_satisfaction_scores` — 计算的挫败指数
- `agent_evals` — 评估结果
- `agent_eval_datasets` — 黄金测试数据集
- `agent_experiments` — 实验定义
- `agent_experiment_assignments` — 用户 → 变体分配
- `agent_experiment_results` — 计算的指标结果

所有表都是方言无关的（SQLite + Postgres）且严格附加。

## 关键文件

| 文件 | 用途 |
|------|------|
| `packages/core/src/observability/types.ts` | 共享类型定义 |
| `packages/core/src/observability/store.ts` | SQL 表 + CRUD |
| `packages/core/src/observability/traces.ts` | 自动检测 |
| `packages/core/src/observability/feedback.ts` | 反馈 + 挫败指数 |
| `packages/core/src/observability/evals.ts` | 评估引擎（3 层） |
| `packages/core/src/observability/experiments.ts` | A/B 测试系统 |
| `packages/core/src/observability/routes.ts` | HTTP API 处理器 |
| `packages/core/src/client/observability/ObservabilityDashboard.tsx` | 管理仪表板 |
| `packages/core/src/client/observability/ThumbsFeedback.tsx` | 内联反馈按钮 |
| `packages/core/src/client/observability/useObservability.ts` | React Query 钩子 |

## 导出到外部平台

在可观测性设置中配置 OTLP 导出：

```ts
await putSetting("observability-config", {
  enabled: true,
  exporters: [
    {
      type: "otlp",
      endpoint: "https://cloud.langfuse.com/api/public/otel",
      headers: { Authorization: "Bearer ..." },
    },
  ],
});
```

框架发出兼容 Langfuse、Datadog、Grafana、New Relic 和任何兼容 OTel 后端的 `gen_ai.*` 语义约定 span。

## 实时 OpenTelemetry Span（可选）

与上面将内部跟踪发送到 OTLP 端点的 `exporters` 配置不同，Agent 循环还可以为每次运行、模型调用和工具调用发出**实时 OpenTelemetry span**，这样已经运行 OTel 收集器的主机可以与其它分布式跟踪一起看到 Agent 活动。

此层是可选的且**默认无操作**：

- `@opentelemetry/api` 是**可选依赖**。如果未安装，span 辅助函数降级为静默无操作 — 它们永远不会抛入 Agent 循环。
- 即使安装了 api 包，它也提供默认的无操作 tracer。Span 仅在**宿主注册 `TracerProvider`**（通过 `@opentelemetry/sdk-node` 或类似）时才变为真实。框架故意不依赖重型 SDK/导出器包，并且从不自己注册提供者 — 检测由嵌入应用选择加入。

循环发出 `agent.run`（带 `agent.run_id`、`agent.thread_id`、`agent.user_id`、`agent.model`）、`tool.call`（`tool.name` + 状态）和 `llm.call` span，每个以 OK/ERROR 状态完成。这纯粹是对内部 `agent_trace_spans` / `agent_trace_summaries` 表的附加。源：`packages/core/src/observability/tracing.ts` + `traces.ts`。完整表格参见可观测性文档。