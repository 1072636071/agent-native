---
name: onboarding
description: >-
  如何为侧边栏设置检查清单注册面向用户的设置步骤（API 密钥、OAuth、连接第三方服务）。在添加需要初始用户配置的功能时使用。
metadata:
  internal: true
---

# 入职步骤

## 规则

如果功能需要面向用户的设置（API 密钥、OAuth、连接第三方服务），注册入职步骤以便它出现在 Agent 侧边栏的设置检查清单中。

入职必须将用户指向安全的凭据路径；它绝不能在源代码、文档、固件、提示或生成内容中编码凭据值。对于 API 密钥和服务令牌，优先使用 `secrets` 技能的 `registerRequiredSecret()`，这样设置 UI、加密存储、验证和入职检查清单保持在一个地方。对于 OAuth，检查限定作用域的 OAuth 令牌存储。仅对部署级配置使用部署环境变量，而不是每用户凭据。

## 注册步骤

```ts
import { registerOnboardingStep } from "@agent-native/core/onboarding";
import { hasOAuthTokens } from "@agent-native/core/oauth-tokens";

registerOnboardingStep({
  id: "gmail",
  order: 100,
  title: "Connect Gmail",
  description: "Grant read/send access.",
  methods: [
    {
      id: "oauth",
      kind: "link",
      primary: true,
      label: "Sign in with Google",
      payload: { url: "/_agent-native/google/auth-url" },
    },
  ],
  isComplete: async (ctx) =>
    ctx?.userEmail ? hasOAuthTokens("google", ctx.userEmail) : false,
});
```

方法类型和内置步骤参见 `packages/core/docs/content/onboarding.md`。

## 相关技能

- `adding-a-feature` — 四领域检查清单；入职通常是新集成的一部分
- `authentication` — 大多数入职步骤涉及 OAuth 或凭据