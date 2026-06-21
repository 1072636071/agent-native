---
name: slide-images
description: 图片生成工作流 -- generate-image、image-search、logo-lookup 脚本。风格参考模式。
---

# 幻灯片图片

幻灯片的图片通过三个脚本生成或获取。代理通过代理聊天委托图片生成，以进行对话式跟进。

## 脚本

| 脚本 | 用途 | 示例 |
|--------|---------|---------|
| `generate-image` | 生成图片（Gemini/OpenAI/auto） | `pnpm action generate-image --prompt "hero image" --model auto --count 3` |
| `image-search` | 通过 Custom Search API 搜索 Google 图片 | `pnpm action image-search --query "Acme logo transparent" --count 5` |
| `logo-lookup` | 通过 Logo.dev API 获取公司 logo URL | `pnpm action logo-lookup --domain acme.com` |
| `image-gen-status` | 检查已配置的图片提供者 | `pnpm action image-gen-status` |

## 图片生成流程

生成幻灯片图片的标准工作流：

1. 用户在编辑器中点击"Image"或向代理请求
2. 代理运行 `pnpm action generate-image --prompt "..." --count 3`
3. 代理在聊天中向用户展示变体
4. 用户选择最喜欢的一个
5. 代理将选定的图片写入幻灯片内容
6. 用户可以跟进："让它更暗"、"尝试不同角度"

### generate-image 选项

```
--prompt              图片描述（必需）
--model               提供者: gemini | openai | auto（默认: auto — 两者都尝试）
--slide-content       当前幻灯片的 HTML 内容
--deck-id             加载完整演示文稿文本作为上下文的 Deck ID
--slide-id            演示文稿中的 Slide ID
--reference-image-urls  逗号分隔的额外参考图片 URL
--count               变体数量（默认: 1）
--output              输出文件路径前缀
```

来自 `shared/api.ts` 的默认风格参考图片始终包含在内。

## Logo 查询

公司 logo 有两个选项：

**选项 1: Logo.dev API**（最佳质量，需要 `LOGO_DEV_TOKEN`）：
```bash
pnpm action logo-lookup --domain acme.com
```

**选项 2: Google 图片搜索**（后备）：
```bash
pnpm action image-search --query "Acme logo transparent" --count 5
```

## 重要规则

- 始终包含风格参考以保持视觉一致性
- 在生成真实图片之前，在幻灯片中使用 `.fmd-img-placeholder` div
- 切勿使用 web_search 或手动 URL 猜测来获取图片
- 插入图片后，通过 API 更新演示文稿