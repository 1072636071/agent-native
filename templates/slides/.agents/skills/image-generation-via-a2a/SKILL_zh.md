---
name: image-generation-via-a2a
description: 当幻灯片演示文稿需要主图时，通过 A2A 委托给 agent-native Images 应用，使生成基于用户的品牌库 — 而不是使用 slides 应用的通用 Gemini 路径进行进程内生成。
---

# 通过 A2A 进行图片生成

slides 应用的 `generate-image` 脚本有两条路径：

1. **A2A 委托给 Images 应用** — 当配置了 `IMAGES_A2A_URL`（理想情况下还有 `IMAGES_A2A_KEY` 或共享的 `A2A_SECRET`）时首选。Images 应用维护带有参考图片、调色板和风格简报的品牌库；每次生成都基于用户选择的库。
2. **直接 Gemini 提供者** — 后备方案。使用 slides 应用的通用 `DEFAULT_STYLE_REFERENCE_URLS` 和用户的 GEMINI/OPENAI 密钥。在没有 Images 应用的情况下也能工作，但生成的图片默认不符合品牌风格。

`templates/slides/actions/generate-image.ts` 首先检查 `IMAGES_A2A_URL`；成功时原样返回 A2A 回复。在任何失败（网络、超时、阻止）时，它会回退到直接提供者 — slides 可以独立运行。

## 何时使用哪条路径

你不能在 action 层选择 — 脚本根据环境变量决定。但你应该知道：

- 同时挂载了 `slides` 和 `images` 应用的 Workspace 部署应始终配置 A2A。slides 代理端不需要其他操作。
- 独立的 slides 部署（没有 Images 应用）会自动回退。

## 从代理显式调用

当为幻灯片生成图片时，调用：

```
pnpm action generate-image --prompt "..." --deck-id <id> --slide-id <id>
```

如果配置了 A2A，脚本会委托并打印 Images 代理的回复（其中包含 `previewUrl`、`downloadUrl`、`embedPath`）。从回复中解析这些 URL，并将 `previewUrl` 放入幻灯片 HTML 的 `<img src="...">` 中。

Images 代理在调用 `generate-image-batch` 或 `refine-image` 时，必须用 `source: "a2a"` 和 `callerAppId: "slides"` 标记委托的生成。这使 Images 审计日志对设计审查有用。

## 多幻灯片图片生成

不要向同一个演示文稿并行发起 `add-slide` 调用。保持演示文稿写入顺序：添加一张幻灯片，等待结果，然后添加下一张幻灯片。如果单张幻灯片需要多个图片变体，图片生成 action 可以在内部请求多个变体，但演示文稿写入本身应保持为单个 `add-slide` 或 `update-slide` 调用。

## 迭代

当用户给出反馈（"让幻灯片 3 的主图更暗，更偏海军蓝"），使用之前的 `assetId`（从之前返回的 `previewUrl` 中提取）加上新反馈调用 Images A2A 的 `refine-image` 技能。仅替换幻灯片 3 的 `<img src="...">` 为新 URL。**不要**删除之前的资产 — 它保留在库中，以便用户可以选择保留哪个版本。

## 现有 slides 路径怎么办？

它被有意保留。如果工作区在没有 images 的情况下运行 slides，生成仍然有效 — 只是使用 slides 应用的通用风格参考而不是策划的库。不要删除直接路径；它是我们的后备方案。

## 跨应用回复解析

Images A2A 回复以纯文本形式返回在 `callAgent` 返回值中。Images 代理（根据其 `a2a-images` 技能）被指示在回复文本中包含 `assetId`、`runId`、`previewUrl`、`downloadUrl` 和 `embedPath`，与 action 返回的完全一致。在回复文本中查找这些键（它们通常格式化为结构化段落或 JSON 块）。

如果解析回复失败，向用户显示"我无法解析 Images 代理的响应"，而不是猜测 URL。