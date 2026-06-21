---
name: automations
description: >-
  带自然语言条件的事件触发和计划触发自动化。在创建自动化、连接事件或
  了解触发器如何触发时使用。
metadata:
  internal: true
---

# 自动化

## 规则

自动化是响应事件或按 cron 计划触发的 agent 执行任务。每个自动化是 `jobs/` 下的 markdown 资源，YAML frontmatter 描述何时以及如何触发，正文包含 agent 遵循的自然语言指令。自动化通过事件触发器、自然语言条件评估和通过 `web-request` 工具的出站 HTTP 扩展了 recurring-jobs 系统。

## 两种触发器类型

| 类型        | 触发时机                                         | 关键字段             |
| ----------- | ------------------------------------------------ | -------------------- |
| `schedule`  | Cron 表达式匹配（与 recurring job 相同）          | `schedule`（cron）   |
| `event`     | 事件总线上发出匹配的事件                          | `event`（事件名称）  |

事件触发器可以选择包含 `condition`——一个由 Haiku 在分派前针对事件负载评估的自然语言字符串。如果条件不匹配，自动化被跳过。

## 工作原理

1. 用户要求 agent 创建自动化（或使用设置 UI）。
2. Agent 调用 `manage-automations` 并带 `action=list-events` 以发现可用事件。
3. Agent 调用 `manage-automations` 并带 `action=define` 以写入 `jobs/<name>.md` 资源。
4. 触发器调度器订阅总线上的事件。
5. 当事件触发时，调度器加载所有匹配的触发器，通过 Haiku 评估条件，并分派匹配的。
6. 在 `agentic` 模式下，调度器运行完整的 `runAgentLoop`，自动化正文作为 prompt，事件负载作为上下文。
7. 状态（`lastRun`、`lastStatus`、`lastError`）写回资源 frontmatter。

## Markdown 格式

```yaml
---
schedule: "0 9 * * 1-5"
enabled: true
triggerType: event
event: calendar.booking.created
condition: "attendee email ends with @example.com"
mode: agentic
domain: calendar
createdBy: user@example.com
runAs: creator
---

Send a Slack message to #sales with the booking details.
Use the web-request tool with ${keys.SLACK_WEBHOOK}.
```

### Frontmatter 字段

| 字段           | 类型                           | 用途                                                 |
| -------------- | ------------------------------ | ---------------------------------------------------- |
| `schedule`     | `string`                       | Cron 表达式（计划触发器必需）                         |
| `enabled`      | `boolean`                      | 自动化是否激活                                       |
| `triggerType`  | `"schedule" \| "event"`        | 自动化如何触发                                       |
| `event`        | `string?`                      | 要订阅的事件名称（事件触发器）                        |
| `condition`    | `string?`                      | 分派前评估的自然语言条件                              |
| `mode`         | `"agentic" \| "deterministic"` | 完整 agent 循环 vs 固定 action 集                    |
| `model`        | `string?`                      | 覆盖此触发器 agent 循环的模型                         |
| `domain`       | `string?`                      | 分组标签（mail、calendar、clips 等）                  |
| `createdBy`    | `string?`                      | 所有者邮箱                                           |
| `orgId`        | `string?`                      | 组织范围                                             |
| `runAs`        | `"creator" \| "shared"`        | 使用谁的 API 密钥和权限                               |
| `lastRun`      | `string?`                      | 最后执行的 ISO 时间戳                                 |
| `lastStatus`   | `string?`                      | `success`、`error`、`running` 或 `skipped`           |
| `lastError`    | `string?`                      | 最后失败运行的错误消息                                |

## Agent 工具

所有自动化操作通过带有 `action` 参数的单一 `manage-automations` 工具访问：

| Action         | 用途                                                                   |
| -------------- | ---------------------------------------------------------------------- |
| `list-events`  | 发现所有已注册的事件及其描述和负载 schema                             |
| `list`         | 列出所有自动化及其状态，按域或启用状态过滤                             |
| `define`       | 创建新自动化（名称、触发器类型、事件、条件、正文）                     |
| `update`       | 更新现有自动化（启用、条件、正文）                                     |
| `delete`       | 删除自动化（始终先与用户确认）                                         |
| `fire-test`    | 发出 `test.event.fired` 事件以验证自动化                               |

附加工具：`web-request`——支持 `${keys.NAME}` 替换的出站 HTTP。

## 事件总线

集成在模块加载时注册事件。总线根据 Standard Schema 定义验证负载并分派给订阅者。

```ts
import { registerEvent, emit } from "@agent-native/core/event-bus";
import { z } from "zod";

// 注册事件类型（通常在服务器插件中）
registerEvent({
  name: "calendar.booking.created",
  description: "A new calendar booking was created",
  payloadSchema: z.object({
    bookingId: z.string(),
    attendeeEmail: z.string(),
    startTime: z.string(),
  }),
  example: { bookingId: "abc", attendeeEmail: "jane@co.com", startTime: "2025-01-15T10:00:00Z" },
});

// 发出事件（从 action、webhook 处理器等）
emit("calendar.booking.created", {
  bookingId: "abc",
  attendeeEmail: "jane@co.com",
  startTime: "2025-01-15T10:00:00Z",
}, { owner: "user@example.com" });
```

### 内置事件

| 事件                          | 来源              |
| ----------------------------- | ----------------- |
| `test.event.fired`           | 手动 / manage-automations action=fire-test |
| `agent.turn.completed`       | Agent 聊天        |
| `calendar.*`                 | Calendar 集成     |
| `clip.*`                     | Clips 集成        |
| `mail.*`                     | Mail 集成         |

### 事件总线 API

| 函数             | 用途                                     |
| ---------------- | ---------------------------------------- |
| `registerEvent`  | 声明带 schema 的事件类型                  |
| `emit`           | 触发事件（验证负载）                      |
| `subscribe`      | 监听事件（返回订阅 ID）                   |
| `unsubscribe`    | 按 ID 移除订阅                            |
| `listEvents`     | 列出所有已注册的事件定义                   |

## 条件评估器

当自动化有 `condition` 时，调度器调用配置的快速/分类模型来分类事件负载是否满足条件。这是一个是/否分类，不是生成任务。确切的模型 ID 在 `condition-evaluator.ts` 中。

- 空或缺少条件 = 无条件（始终触发）。
- 结果被记忆化（条件 + 负载的 SHA-256），5 分钟 TTL 和 500 条目 LRU 缓存。
- 负载在发送给 Haiku 前截断为 4000 个字符。
- API 失败时，条件评估为 `false`（安全默认——跳过自动化）。

## `web-request` 工具和密钥

自动化使用 `web-request` 工具进行出站 HTTP。它支持 URL、头和正文中的 `${keys.NAME}` 占位符。这些在 agent 发出工具调用后在服务器端解析——原始秘密值永远不会进入 agent 的上下文。

- 密钥是用户通过设置 UI 或 `/_agent-native/secrets/adhoc` API 创建的临时秘密。
- 每个密钥可以有一个 URL 白名单，限制密钥可以发送到哪些来源。
- `resolveKeyReferences()` 解析占位符，从用户范围回退到工作区范围。
- `validateUrlAllowlist()` 根据每密钥白名单检查解析的 URL（来源级别匹配）。
- 自动化定义、示例、事件负载和 prompt 不得硬编码真实 API 密钥、webhook URL、
  令牌、私有 Builder/内部数据或客户数据。使用 `${keys.NAME}` 和合成的
  `example.com` 身份。

## UI

自动化出现在设置面板的"Automations"部分。用户可以从那里查看、启用/禁用和删除自动化。创建通常通过 agent 聊天进行。

## 示例

用户："当有人用 @example.com 邮箱预约会议时，在 Slack 通知我。"

Agent 流程：

1. 调用 `manage-automations` 并带 `action=list-events` 找到 `calendar.booking.created`。
2. 与用户确认计划。
3. 调用 `manage-automations` 并带 `action=define`：
   - `name`：`slack-on-example-booking`
   - `trigger_type`：`event`
   - `event`：`calendar.booking.created`
   - `condition`：`attendee email ends with @example.com`
   - `mode`：`agentic`
   - `domain`：`calendar`
   - `body`：`Send a Slack message to #sales with the booking details. Use the web-request tool to POST to ${keys.SLACK_WEBHOOK}.`

## 关键文件

| 文件                                            | 用途                                          |
| ----------------------------------------------- | --------------------------------------------- |
| `packages/core/src/triggers/types.ts`           | `TriggerFrontmatter` 接口                     |
| `packages/core/src/triggers/actions.ts`         | Agent 工具（define、list、update、delete、test） |
| `packages/core/src/triggers/dispatcher.ts`      | 事件订阅和 agentic 分派                       |
| `packages/core/src/triggers/condition-evaluator.ts` | Haiku 条件分类与缓存                     |
| `packages/core/src/event-bus/`                  | 事件总线（register、emit、subscribe）          |
| `packages/core/src/tools/fetch-tool.ts`         | 带密钥替换的 `web-request` 工具               |
| `packages/core/src/secrets/substitution.ts`     | `resolveKeyReferences()` 和 `validateUrlAllowlist()` |

## 相关 Skill

- `recurring-jobs`——计划触发的自动化复用相同的调度器
- `secrets`——临时密钥和 `${keys.NAME}` 替换
- `actions`——自动化可以通过 agent 循环调用任何已注册的 action
- `delegate-to-agent`——agentic 模式运行完整的 `runAgentLoop`