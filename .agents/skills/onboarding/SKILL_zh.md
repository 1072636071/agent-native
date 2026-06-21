---
name: onboarding
description: >-
  如何为侧边栏设置清单注册面向用户的设置步骤（API 密钥、OAuth、
  连接第三方服务）。在添加需要初始用户配置的功能时使用。
metadata:
  internal: true
---

# 引导步骤

## 规则

如果功能需要面向用户的设置（API 密钥、OAuth、连接第三方服务），注册一个引导步骤，使其出现在 agent 侧边栏的设置清单中。

引导必须指向用户到安全的凭证路径；它绝不能在源代码、文档、夹具、prompt 或生成内容中编码凭证值。
对于 API 密钥和服务令牌，优先使用 `secrets` skill 中的 `registerRequiredSecret()`，这样设置 UI、加密存储、验证和引导清单保持在一个地方。对于 OAuth，检查限定范围的 OAuth 令牌存储。仅对部署级配置使用部署环境变量，而不是每用户凭证。

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

方法类型和内置步骤见 `packages/core/docs/content/onboarding.md`。

## 相关 Skill

- `adding-a-feature`——四方面检查清单；引导通常是新集成的一部分
- `authentication`——大多数引导步骤涉及 OAuth 或凭证