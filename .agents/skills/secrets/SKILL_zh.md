---
name: secrets
description: >-
  声明式注册模板所需的 API 密钥和服务凭据，使其出现在 agent 侧边栏设置 UI 和入门检查清单中。用于任何第三方 API 密钥（OpenAI、Stripe、Twilio 等）以及在统一设置 UI 中展示 OAuth 连接。
metadata:
  internal: true
---

# 密钥注册表

## 不可协商的规则

切勿硬编码凭据值。源代码、文档、测试、固件、提示、种子数据和生成的扩展/应用内容可以提及凭据**名称**如 `OPENAI_API_KEY`，但不得包含真实的 API 密钥、令牌、webhook URL、签名密钥、OAuth 刷新令牌或私有 Builder/客户数据。

密钥值在运行时通过部署配置、加密的 `app_secrets` 保险库、`saveCredential` / `resolveCredential`、OAuth 或 `${keys.NAME}` 替换提供。示例必须使用明显的占位符如 `<OPENAI_API_KEY>` 或 `${keys.SLACK_WEBHOOK}`，而非看起来真实的复制值。

## 何时使用

用于模板需要的任何外部凭据：API 密钥、服务令牌、webhook 密钥。它提供：

- 每个凭据的侧边栏 UI 条目（掩码输入、轮换、测试、删除）。
- `required: true` 密钥的自动入门检查清单项。
- 稳定的服务端读取 API（`readAppSecret`），按需解密值。
- 验证器 hook，用于在保存前和从测试按钮进行密钥健康检查。

## 何时不使用

- 需要运行完整授权码交换的 OAuth 流程 — 直接使用 `@agent-native/core/oauth-tokens` 来保存/刷新令牌。注册表仍可通过注册 `kind: "oauth"` 的密钥在侧边栏中展示 OAuth 连接 — 这只是将状态查找委托给 oauth-tokens 并渲染一个连接按钮，不会写入 `app_secrets` 行。
- 纯粹的进程级环境变量，从不面向用户（例如 `NODE_ENV`、部署标志）。这些属于入门 `form` 方法或 `core-routes-plugin` 中的 `envKeys` 列表。

## 注册密钥

```ts
// server/plugins/register-secrets.ts
import { defineNitroPlugin } from "@agent-native/core/server";
import { registerRequiredSecret } from "@agent-native/core/secrets";

export default defineNitroPlugin(() => {
  registerRequiredSecret({
    key: "OPENAI_API_KEY",
    label: "OpenAI API Key",
    description: "Used for Whisper transcription of your recordings.",
    docsUrl: "https://platform.openai.com/api-keys",
    scope: "user",
    kind: "api-key",
    required: true,
    validator: async (value) => {
      const res = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${value}` },
      });
      return res.ok
        ? { ok: true }
        : { ok: false, error: `OpenAI rejected the key (HTTP ${res.status})` };
    },
  });
});
```

### 统一 UI 中的 OAuth

```ts
registerRequiredSecret({
  key: "GOOGLE_CONNECTED",
  label: "Google account",
  description: "Grants access to Gmail / Calendar APIs.",
  scope: "user",
  kind: "oauth",
  required: true,
  oauthProvider: "google", // 必须匹配 oauth-tokens 中的 provider id
  oauthConnectUrl: "/_agent-native/google/auth-url",
});
```

侧边栏显示连接按钮而非文本输入；不会写入 `app_secrets` 行 — 状态从 `hasOAuthTokens("google")` 派生。

## 注册选项

| 字段              | 类型                                    | 用途                                                                  |
| ----------------- | --------------------------------------- | --------------------------------------------------------------------- |
| `key`             | `string`                                | 环境变量风格名称（`OPENAI_API_KEY`）。也是存储键。                   |
| `label`           | `string`                                | 侧边栏中的人类可读标题。                                             |
| `description`     | `string?`                               | 标签下方的副标题。                                                   |
| `docsUrl`         | `string?`                               | 在卡片上渲染的"获取密钥"链接。                                       |
| `scope`           | `"user" \| "workspace"`                 | 按用户或跨活跃组织共享。                                             |
| `kind`            | `"api-key" \| "oauth"`                  | 驱动 UI 和存储行为。                                                 |
| `required`        | `boolean?`                              | 为 true 时，自动注入入门步骤。                                       |
| `validator`       | `(v) => Promise<boolean \| {ok,error}>` | 在保存和从测试按钮运行。切勿记录 `v`。                               |
| `oauthProvider`   | `string?`（仅 oauth 类型）              | 支持此条目的 `oauth-tokens` 中的 provider id。                       |
| `oauthConnectUrl` | `string?`（仅 oauth 类型）              | 连接按钮指向的 URL。                                                 |

## 从 action 中读取密钥

```ts
import { z } from "zod";
import { defineAction } from "@agent-native/core/action";
import { readAppSecret } from "@agent-native/core/secrets";
import { getRequestUserEmail } from "@agent-native/core/server";

export default defineAction({
  description: "Transcribe an audio file with Whisper",
  schema: z.object({ fileUrl: z.string() }),
  run: async ({ fileUrl }) => {
    const email = await getRequestUserEmail();
    if (!email) throw new Error("Not signed in");

    const stored = await readAppSecret({
      key: "OPENAI_API_KEY",
      scope: "user",
      scopeId: email,
    });
    const apiKey = stored?.value;
    if (!apiKey) {
      throw new Error(
        "OPENAI_API_KEY is not set. Configure it in the sidebar settings.",
      );
    }

    // …调用 OpenAI。切勿记录密钥或将其包含在错误消息中。
  },
});
```

规则：

- **切勿记录值。** 读取层在服务端强制执行此规则；你的代码也必须如此。
- **仅对部署级密钥使用环境变量。** 如果凭据是用户范围、组织范围或工作区范围的，读取范围化的保险库/凭据存储。不要添加 `process.env` 回退，使每个用户继承一个部署的密钥。
- **范围与注册匹配。** `scope: "user"` → 传递用户 email。`scope: "workspace"` → 传递来自 `getOrgContext(event).orgId` 的活跃 `orgId`。

## HTTP 路由

Core 路由插件自动在 `/_agent-native/secrets/` 下挂载这些路由：

- `GET /_agent-native/secrets` — 列出已注册的密钥及其状态（`set` / `unset` / `invalid`）、元数据，以及 — 对于已设置的 api-keys — 最后 4 个字符。值永远不会返回。
- `POST /_agent-native/secrets/:key` — 请求体 `{ value, scope?, scopeId? }`。运行已注册的验证器；失败时返回 400 及错误信息。
- `DELETE /_agent-native/secrets/:key` — 删除存储的值。
- `POST /_agent-native/secrets/:key/test` — 对当前存储的值重新运行验证器。

## 存储和加密

- 值存储在 `app_secrets` 中（按需创建；无需迁移）。
- 使用 AES-256-GCM 静态加密。密钥材料从 `SECRETS_ENCRYPTION_KEY`（首选）或 `BETTER_AUTH_SECRET`（回退）派生。如果两者都未设置，框架使用机器本地的回退并记录一次性警告 — 在生产环境中设置 `SECRETS_ENCRYPTION_KEY`。

## 临时密钥

临时密钥是用户创建的、未由模板声明的密钥。用户通过设置 UI 或 agent 聊天创建它们，用于自动化和 `web-request` 工具。它们支持出站 HTTP 请求中的 `${keys.NAME}` 替换。

### 临时密钥 API

Core 路由插件在 `/_agent-native/secrets/adhoc` 下挂载这些路由：

- `GET /_agent-native/secrets/adhoc` — 列出所有临时密钥（名称、最后 4 个字符、URL 允许列表）。值永远不会返回。
- `POST /_agent-native/secrets/adhoc` — 请求体 `{ name, value, urlAllowlist? }`。创建或更新临时密钥。
- `DELETE /_agent-native/secrets/adhoc/:name` — 删除临时密钥。

### URL 允许列表

每个临时密钥可以有一个 URL 允许列表 — 限制密钥值可以发送到的源 URL 数组。检查是源级别的（协议 + 主机 + 端口）。如果未配置允许列表，密钥可用于任何 URL。

```ts
// 创建带允许列表的密钥
POST /_agent-native/secrets/adhoc
{
  "name": "SLACK_WEBHOOK",
  "value": "<SLACK_WEBHOOK_URL_FROM_SETTINGS>",
  "urlAllowlist": ["https://hooks.slack.com"]
}
```

### `${keys.NAME}` 替换

`web-request` 工具支持 URL、headers 和 body 中的 `${keys.NAME}` 占位符。替换在 agent 发出工具调用后在服务端进行 — 原始密钥值永远不会进入 agent 的上下文。

```ts
import {
  resolveKeyReferences,
  validateUrlAllowlist,
} from "@agent-native/core/secrets/substitution";

// 解析字符串中所有 ${keys.NAME} 引用
const { resolved, usedKeys } = await resolveKeyReferences(
  "Bearer ${keys.API_TOKEN}",
  "user",
  "user@example.com",
);

// 根据密钥的允许列表验证 URL
const allowed = validateUrlAllowlist(
  "https://hooks.slack.com/services/<WORKSPACE>/<CHANNEL>/<SECRET>",
  ["https://hooks.slack.com"],
);
```

密钥解析从用户范围回退到工作区范围，因此用户可以覆盖共享密钥，而不会破坏引用工作区默认值的自动化。

## Dispatch 保险库访问

Dispatch 工作区对工作区应用凭据有保险库访问策略：

- `all-apps` 是默认值。每个保存的 Dispatch 保险库密钥对所有工作区应用可用；`sync-vault-to-app` 将所有保险库密钥推送到目标应用。
- `manual` 需要显式的按应用授权。使用 `create-vault-grant` / `grant-vault-secrets-to-app`，然后 `sync-vault-to-app`。

在决定是否创建授权之前使用 `get-vault-access-settings`，仅在用户要求更改策略时使用 `set-vault-access-settings`。

### 关键文件（临时密钥）

| 文件                                           | 用途                                     |
| ---------------------------------------------- | ---------------------------------------- |
| `packages/core/src/secrets/substitution.ts`    | `resolveKeyReferences()`、`validateUrlAllowlist()` |
| `packages/core/src/tools/fetch-tool.ts`        | 消费密钥引用的 `web-request` 工具       |

## 相关技能

- `onboarding` — 必需密钥出现在其中的设置检查清单。
- `actions` — 调用第三方 API 时读取密钥的地方。
- `authentication` — 会话范围；`scope: "user"` 使用会话 email。
- `security` — 输入验证和切勿记录密钥。
- `automations` — 临时密钥为自动化 web 请求中的 `${keys.NAME}` 提供支持。