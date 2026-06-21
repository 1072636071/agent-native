---
name: integration-webhooks
description: >-
  在 Serverless 主机上处理消息集成 Webhook（Slack、Telegram、WhatsApp、邮件等）的跨平台模式。在添加新集成适配器、调试丢失消息或将长时间运行的 Agent 工作接入 Webhook 处理器时使用。
metadata:
  internal: true
---

# 集成 Webhook

## 规则

集成 Webhook（Slack、Telegram、WhatsApp、邮件、Google Docs 等）必须**将工作排入 SQL 并立即返回 200**，然后在由自触发的 HTTP POST 启动的**独立新函数执行**中处理工作。循环重试作业清理任何卡住的内容。此模式在每个 Serverless 主机（Netlify、Vercel、Cloudflare Workers、Fly、Render、Node）上工作，无需依赖平台特定的后台执行功能。

不要在 Webhook 处理器本身内运行 Agent 循环。不要依赖从 Serverless 处理器 `return` 后即发即弃的 `Promise` — 它们在函数冻结时被杀死。

## 原因

消息平台期望在紧凑窗口内返回 200 响应 — Slack 会在 3 秒后重试，重试的事件触发重复的 Agent 运行。同时，回复消息的 Agent 循环可能需要 30-60+ 秒，因为它可能进行多次 LLM 调用和工具调用。

过去跨主机不起作用的尝试：

- **返回后即发即弃的 `Promise.then(...)`** — Lambda/Vercel/CF 在响应发出时冻结执行上下文。Promise 被静默杀死，用户得不到回复，日志中没有错误。
- **Netlify Background Functions** — 仅限 Netlify，需要 `-background` 文件名后缀，在其他每个主机上都会失败。
- **Cloudflare `event.waitUntil()`** — 仅限 CF Workers，不可移植。
- **Vercel Fluid / `after()`** — 仅限 Vercel，在特定运行时之后。
- **长寿命进程内队列** — 在单个 Node 机器上可以，但在 Serverless 上每次冷启动获得新队列，任何待处理工作都会丢失。

唯一通用答案：**持久化工作，然后触发全新的函数执行来处理它。** SQL 是队列，自 Webhook 是触发器，循环作业是安全网。

## 流程

```
┌──────────┐    1. POST /integrations/:platform/webhook
│ 平台     │────────────────────────────────────────────►┌──────────────────┐
└──────────┘                                             │ Webhook 处理器   │
                                                          │ (函数执行 1)     │
                                                          └──────────────────┘
                                                                   │
                             2. INSERT INTO integration_pending_tasks
                                  (status='pending', payload=...)
                                                                   │
                             3. fetch(POST /integrations/_process-task)
                                  — 即发即弃，NO await on body
                                                                   │
                             4. return 200 to platform ◄───────────┘

                                                          ┌──────────────────┐
                           5. POST 到达处理器             │ 处理器           │
                              (独立的新函数)              │ (函数执行 2)     │
                                                          └──────────────────┘
                                                                   │
                             6. claimPendingTask(id) → status='processing'
                             7. runAgentLoop(...) — 完整超时预算在这里
                             8. adapter.sendResponse(...) 返回平台
                             9. markTaskCompleted(id)


                           ┌──────────────────────────────────────────────┐
                           │  循环作业 (每 60s) — 安全网                   │
                           │  重新触发处理器处理卡在                        │
                           │  'pending' 或超过超时的 'processing' 任务。    │
                           │  重试上限 3 次然后标记 'failed'。              │
                           └──────────────────────────────────────────────┘
```

Webhook 处理器做尽可能少的事。处理 `_process-task` 的新函数执行获得自己的完整超时预算用于 Agent 循环。

## 关键文件

| 文件                                                                    | 用途                                                                |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `packages/core/src/integrations/plugin.ts`                              | 挂载 `/_agent-native/integrations/*` 路由                           |
| `packages/core/src/integrations/webhook-handler.ts`                     | 验证签名、解析、排入任务、触发处理器                                  |
| `packages/core/src/integrations/pending-tasks-store.ts`                 | SQL 队列：`insertPendingTask`、`claimPendingTask`、`markTaskCompleted`、`markTaskFailed` |
| `packages/core/src/integrations/pending-tasks-retry-job.ts`             | 循环重试扫描（`startPendingTasksRetryJob`、`retryStuckPendingTasks`） |
| `packages/core/src/integrations/types.ts`                               | `PlatformAdapter`、`IncomingMessage`、`OutgoingMessage`             |
| `packages/core/src/integrations/adapters/{slack,telegram,whatsapp,email,google-docs}.ts` | 每平台一个适配器                                      |

## 路由

全部在 `/_agent-native/integrations/` 下：

| 方法 | 路径                       | 用途                                                       |
| ---- | -------------------------- | ---------------------------------------------------------- |
| POST | `/:platform/webhook`       | 平台 ping 此处。验证、排入、快速返回 200。                  |
| POST | `/_process-task`           | 自 Webhook 目标。声明任务并运行 Agent 循环。                |
| GET  | `/status`                  | 所有集成状态（设置 UI）。                                    |
| GET  | `/:platform/status`        | 一个平台的状态。                                            |
| POST | `/:platform/enable`        | 启用集成。                                                  |
| POST | `/:platform/disable`       | 禁用集成。                                                  |
| POST | `/:platform/setup`         | 平台特定设置（如 Telegram Webhook 注册）。                   |

## SQL Schema

待处理任务队列存在于 `integration_pending_tasks`：

```sql
CREATE TABLE IF NOT EXISTS integration_pending_tasks (
  id                 TEXT    PRIMARY KEY,
  platform           TEXT    NOT NULL,
  external_thread_id TEXT    NOT NULL,
  payload            TEXT    NOT NULL,   -- JSON 序列化的 IncomingMessage
  owner_email        TEXT    NOT NULL,
  org_id             TEXT,
  status             TEXT    NOT NULL,   -- pending | processing | completed | failed
  attempts           INTEGER NOT NULL DEFAULT 0,
  error_message      TEXT,
  created_at         INTEGER NOT NULL,
  updated_at         INTEGER NOT NULL,
  completed_at       INTEGER
);
CREATE INDEX IF NOT EXISTS idx_pending_tasks_status_created
  ON integration_pending_tasks(status, created_at);
```

存储层在首次使用时通过 `ensureTable()` 惰性创建此表，并使用 `db/client.ts` 的 `intType()` 以便在 SQLite 和 Postgres 上都能工作。

`claimPendingTask` 是关键并发原语：它原子性地将 `pending` → `processing` 翻转并递增 `attempts`，如果另一个工作者抢先则返回 `null`。初始即发即弃调用和重试作业都通过相同的处理器端点，`claimPendingTask` 是防止同一任务被处理两次的关键。

## 添加新平台适配器

1. **在 `packages/core/src/integrations/adapters/<platform>.ts` 中实现 `PlatformAdapter`**：

   ```ts
   export function myPlatformAdapter(): PlatformAdapter {
     return {
       platform: "myplatform",
       label: "MyPlatform",
       getRequiredEnvKeys: () => [
         { name: "MYPLATFORM_TOKEN", label: "MyPlatform Bot Token", scope: "global" },
         { name: "MYPLATFORM_SIGNING_SECRET", label: "MyPlatform Signing Secret", scope: "global" },
       ],
       async handleVerification(event) {
         // 平台特定的质询响应，如果有的话
         return { handled: false };
       },
       async verifyWebhook(event) {
         // 用服务端密钥和常量时间比较验证 HMAC/签名。
         // 永远不要在生产中将其保留为宽松的存根。
         return verifyMyPlatformSignature(event);
       },
       async parseIncomingMessage(event) {
         // 映射原始负载 → IncomingMessage，或 null 以忽略
         return null;
       },
       async sendResponse(message, context) {
         // POST 回平台的 API
       },
       formatAgentResponse(text) {
         return { text, platformContext: {} };
       },
       async getStatus(baseUrl) {
         return { platform: "myplatform", label: "MyPlatform", enabled: false, configured: false };
       },
     };
   }
   ```

2. **在 `plugin.ts` 的 `getDefaultAdapters()` 中注册它**。Webhook、队列、处理器和重试作业是共享基础设施 — 你不需要为每个适配器编写任何这些。

3. **声明必需的环境键**，这样密钥/入职 UI 会显示它们。参见 `secrets` 和 `onboarding` 技能。

4. **更新平台的 Webhook URL** 指向 `${baseUrl}/_agent-native/integrations/<platform>/webhook`。对于有注册 API 的平台（Telegram），实现 `POST /:platform/setup`。

永远不要在适配器、测试、文档、提示或固件中硬编码 Bot 令牌、签名密钥、验证令牌、Webhook URL、渠道/客户标识符或带真实私有数据的复制平台负载。`getRequiredEnvKeys()` 仅声明凭据名称。值来自部署配置、注册密钥、OAuth 或限定作用域的凭据存储，测试应使用明显的假占位符。

适配器**仅**负责：

- 平台特定的验证（签名、质询）
- 负载 → `IncomingMessage` 映射
- Agent 文本 → 平台格式
- 将响应传递回平台

它**不**知道队列、处理器、重试或 Agent 循环。这些由共享 Webhook 处理器处理。

## 长时间运行的 Agent 工作

处理器端点在独立的新函数执行中运行，有自己的完整超时（通常在 Netlify/Vercel 上 30-60 秒，在对后台友好的主机上更长）。该预算完全专用于 Agent 循环 — 没有平台侧计时器与它竞争。

如果单个 Agent 运行可能超过函数超时（大型多步骤计划、深度委托链），Agent 应该：

1. 向平台发送临时确认，让用户知道请求已到达（`adapter.sendResponse({ text: "Working on it..." })`）。
2. 在聊天线程数据、应用状态或循环作业中持久化中间状态，以便下一次调用可以从此处继续。

重试作业只会重新触发卡在 `processing` 超过 5 分钟的任务，因此正常的长时间运行回复是安全的。

## 跨平台考虑

- **没有平台特定的后台 API。** 没有 `waitUntil`、没有 `-background.ts` 文件名、没有 Vercel `after()`。该模式在每个主机上相同地工作，因为它只使用 `fetch()` 和 SQL。
- **没有假设的运行时。** 处理器端点是 `/_agent-native/` 下的普通 H3 处理器。它在框架其余部分运行的任何地方运行。
- **没有持久化的内存状态。** Webhook 处理器中的去重映射仅是尽力而为；SQL 队列是事实来源。任何冷启动都会丢失去重映射，但队列保持一致。
- **Postgres + SQLite 都支持。** `claimPendingTask` 在 Postgres 上使用 `RETURNING`，在 SQLite 上使用重新读取。没有平台特定的 SQL。
- **自 Webhook URL 解析。** 处理器 URL 从 `WEBHOOK_BASE_URL`、`APP_URL` 或 `URL` 环境变量构建（开发回退为 `localhost:3000`）。更改其公共 URL 的模板必须保持其中一个设置。

## 为什么 Serverless 上的即发即弃不可靠

即使 Webhook 处理器在没有等待响应体的情况下执行 `fetch(processorUrl, ...)`，初始分派也**不**保证在函数冻结前完成。实际上它通常可以 — TCP 连接 + 写入很快发生 — 但循环重试作业是以下情况的安全网：

- Serverless 平台在出站 `fetch` 刷新其字节之前冻结了处理器。
- 处理器函数 502 或冷启动慢到超时。
- 处理器本身在 Agent 循环中途被杀死（函数超时、容器关闭、运行中部署）。

卡在 `pending` 超过 90 秒或 `processing` 超过 5 分钟的任务会被重新触发最多 3 次。3 次尝试后它们被永久标记为 `failed`，这样我们停止向处理器发送垃圾请求。

**永远不要假设初始即发即弃成功。** 始终依赖队列 + 重试作业实现至少一次交付。

## 调试检查清单

1. **平台发送了 Webhook？** 检查平台的交付日志（Slack 管理、Telegram `getWebhookInfo`）。
2. **Webhook 处理器返回了 200？** 如果没有，平台会重试 — 查找重复的任务行。签名失败返回 401。
3. **任务在队列中？** `SELECT * FROM integration_pending_tasks WHERE external_thread_id = '...' ORDER BY created_at DESC LIMIT 5`。
4. **状态？** `pending` 意味着处理器从未拾取它 — 检查 `_process-task` 是否可从机器本身到达（自 fetch 必须通过公共 URL 工作）。`processing` 超过 5 分钟意味着处理器在运行中途死亡 — 重试作业会拾取它。
5. **失败？** 检查 `error_message` 和 `attempts`。3 次尝试后行被停在 `failed`，不会被重试。
6. **回复未送达？** 处理器可能成功了但 `adapter.sendResponse` 失败 — 检查适配器的出站日志。

## 相关技能

- `server-plugins` — `/_agent-native/` 路由如何挂载
- `recurring-jobs` — 重试作业遵循的模式
- `actions` — 何时使用 action vs Webhook
- `secrets` — 注册平台令牌
- `onboarding` — 为每个平台显示设置步骤
- `delegate-to-agent` — 处理器如何调用 Agent 循环