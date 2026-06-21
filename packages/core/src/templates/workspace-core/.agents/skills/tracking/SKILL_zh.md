---
name: tracking
description: >-
  带可插拔提供商的服务器端分析跟踪。在添加分析事件、注册自定义跟踪提供商或配置内置提供商（PostHog、Mixpanel、Amplitude、Webhook）时使用。
metadata:
  internal: true
---

# 跟踪

## 规则

跟踪系统提供单一的 `track()` 调用，扇出到所有已注册的提供商。内置提供商从环境变量自动注册 — 设置变量后跟踪即开始。可以为任何分析后端注册自定义提供商。跟踪仅限服务器端，尽力而为，永不阻塞请求处理。

## 工作原理

1. 在服务器启动时，`registerBuiltinProviders()` 检查环境变量并注册任何已配置的提供商。
2. 应用代码从 actions、插件或服务器路由调用 `track(eventName, properties, meta)`。
3. 注册表将事件扇出到每个已注册的提供商。错误被捕获并记录 — 失败的提供商永不使调用者崩溃。
4. 内置提供商批量 HTTP 调用（每 10 秒或 50 个事件刷新一次，以先到者为准）。

## API

### `track(name, properties?, meta?)`

触发分析事件。

```ts
import { track } from "@agent-native/core/tracking";

track("meal.logged", { mealName: "Salad", calories: 350 }, { userId: "user@example.com" });
```

### `identify(userId, traits?)`

用特征标识用户。转发到支持它的提供商。

```ts
import { identify } from "@agent-native/core/tracking";

identify("user@example.com", { plan: "pro", company: "ExampleCo" });
```

### `registerTrackingProvider(provider)`

注册自定义提供商。

```ts
import { registerTrackingProvider } from "@agent-native/core/tracking";

registerTrackingProvider({
  name: "my-analytics",
  track(event) {
    // Send event to your backend
  },
  identify(userId, traits) {
    // Optional
  },
  flush() {
    // Optional -- called on graceful shutdown
  },
});
```

### `flushTracking()`

刷新所有提供商（在进程退出前调用）。

## 内置提供商

设置环境变量后，提供商在启动时自动注册。无 SDK 依赖 — 所有提供商使用原始 HTTP。

| 提供商     | 环境变量                                                  |
| ---------- | --------------------------------------------------------- |
| PostHog    | `POSTHOG_API_KEY`（必需），`POSTHOG_HOST`（可选，默认 `https://us.i.posthog.com`） |
| Mixpanel   | `MIXPANEL_TOKEN`                                          |
| Amplitude  | `AMPLITUDE_API_KEY`                                       |
| Agent Native Analytics | `AGENT_NATIVE_ANALYTICS_PUBLIC_KEY`（服务器），`AGENT_NATIVE_ANALYTICS_ENDPOINT`（可选，默认 `https://analytics.agent-native.com/track`） |
| Webhook    | `TRACKING_WEBHOOK_URL`（必需），`TRACKING_WEBHOOK_AUTH`（可选，作为 `Authorization` 头发送） |

多个提供商可以同时激活。所有提供商接收每个事件。

浏览器端 `trackEvent()` 在 `VITE_AGENT_NATIVE_ANALYTICS_PUBLIC_KEY` 存在时也转发到 Agent Native Analytics。使用 `VITE_AGENT_NATIVE_ANALYTICS_ENDPOINT` 覆盖默认浏览器端点。内置 Agent Native Analytics 发送器在 localhost/本地开发中默认静默；仅在有意的本地摄取测试时设置 `AGENT_NATIVE_ANALYTICS_ALLOW_LOCALHOST=true`。

## 默认基线事件

模板根在应用启动期间调用一次 `configureTracking()`。这为托管应用安装默认浏览器页面浏览跟踪：

- 事件：`pageview`
- 在初始加载、`history.pushState`、`history.replaceState` 和 `popstate` 时触发
- 对同一 URL 的重复事件去重
- 包含 `url`、`path`、`hostname`、`referrer`、`title`、`navigation_type`、`app` 和推断的 `template`
- 在浏览器事件中包含已知的 LLM 连接上下文：`llm_connection`（`builder`、`anthropic`、`openai` 等）、`llm_engine`、`llm_model`、`llm_connection_source` 和 `llm_connection_configured`
- 不从 localhost/本地开发发送第一方事件

### 访问者身份（`anonymousId` + `sessionId`）

每个浏览器端 `trackEvent()` POST 到 Agent Native Analytics `/track` 端点包含：

- `anonymousId` — 持久的每浏览器访问者 ID，存储在 `localStorage` 的 `agent-native.anonymous_id` 中。生成一次并在会话间重用。用于唯一访问者和回访访问者指标。
- `sessionId` — 轮换的每次访问 ID，存储在 `localStorage` 的 `agent-native.session_id` 中，有 30 分钟空闲超时（匹配 GA4 / Mixpanel 默认值）。用于每次访问会话数、每次会话页面数和会话时长指标。
- `userId` — 仅在调用代码传递 `properties.userId` 时设置。匿名流量按设计将其留为 NULL；`anonymousId` 是回退。

这些字段落入分析模板中的 `analytics_events.anonymous_id`、`analytics_events.session_id` 和 `analytics_events.user_id` 列。存储访问包装在 try/catch 中 — 隐私浏览/阻止存储的客户端静默降级为 NULL 而非使页面崩溃。

其他框架级基线事件：

- 来自 `useSession()` 的 `session status`，带 `signed_in`
- 来自 Better Auth 用户创建的 `signup`，带 `auth_provider` 和 `auth_user_id`
- 来自浏览器连接 Builder CTA 的 `builder connect clicked` 和 `builder connect popup blocked`
- 来自 Builder 连接路由的 `builder connect started`、`builder connect succeeded`、`builder connect failed`、`builder disconnect succeeded` 和 `builder disconnect failed`，在可解析时带 LLM 连接上下文

对于新的生命周期事件，当服务器是真相来源时在服务器端调用 `track()`，仅对浏览器交互在客户端调用 `trackEvent()`。

## 提供商接口

```ts
interface TrackingProvider {
  name: string;
  track(event: TrackingEvent): void | Promise<void>;
  identify?(userId: string, traits?: Record<string, unknown>): void | Promise<void>;
  flush?(): void | Promise<void>;
}

interface TrackingEvent {
  name: string;
  properties?: Record<string, unknown>;
  timestamp?: string;
  userId?: string;
}
```

## 设计决策

- **globalThis 单例** — 注册表使用 `Symbol.for` 键在 globalThis 上，以便多个 ESM 图实例（开发模式 Vite + Nitro、符号链接）共享一个提供商集。
- **尽力扇出** — 提供商错误被捕获并记录，永不传播。损坏的分析集成绝不能破坏应用功能。
- **批量 HTTP** — 内置提供商排队事件并每 10 秒或 50 个事件刷新一次，最小化出站请求。
- **未桥接到事件总线** — 跟踪和事件总线是独立的关注点。事件总线用于触发自动化；跟踪用于分析。不要从事件总线订阅 `track()` 调用，反之亦然。

## 关键文件

| 文件                                           | 用途                                     |
| ---------------------------------------------- | ---------------------------------------- |
| `packages/core/src/tracking/registry.ts`       | `track()`、`identify()`、`registerTrackingProvider()`、`flushTracking()` |
| `packages/core/src/tracking/providers.ts`      | 内置提供商（PostHog、Mixpanel、Amplitude、Agent Native Analytics、Webhook）和 `registerBuiltinProviders()` |
| `packages/core/src/tracking/types.ts`          | `TrackingEvent` 和 `TrackingProvider` 接口 |

## 相关技能

- `secrets` — 跟踪提供商的 API 密钥可以注册为密钥
- `server-plugins` — `registerBuiltinProviders()` 在启动时由 core-routes 插件调用
- `actions` — 从 action 处理器调用 `track()` 记录用户/代理活动