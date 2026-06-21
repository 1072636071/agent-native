# 设计系统

设计系统存储应用于演示文稿中所有幻灯片的品牌标识令牌（颜色、字体、间距、logo）。

## 数据模型

设计系统存储在 `design_systems` SQL 表中。每个都有一个带 JSON 令牌的 `data` 列：

- `colors`: primary, secondary, accent, background, surface, text, textMuted
- `typography`: headingFont, bodyFont, headingWeight, bodyWeight, headingSizes
- `spacing`: slidePadding, elementGap
- `borders`: radius, accentWidth
- `slideDefaults`: background, labelStyle
- `logos`: { url, name, variant } 数组
- `imageStyle`: referenceUrls, styleDescription
- `customCSS`: 可选的自定义 CSS

## 创建设计系统

1. 用户提供品牌上下文（公司名称、网站、资产、备注）
2. `analyze-brand-assets` 收集原始数据（从网站提取 CSS、字体、颜色）
3. 代理分析数据并使用提取的令牌调用 `create-design-system`
4. 设计系统发布并可用于演示文稿创建

### 来源：Figma `.fig` 文件

当用户上传原始 Figma 本地副本（`.fig`）时，使用 `import-file` 在进程内解析它，而不是像文档一样处理它：

```bash
pnpm action import-file --filePath "data/uploads/brand.fig" --format fig
```

action 返回 `designSystem`、`customInstructions` 和 `preview`。审查结果，然后使用以下内容调用 `create-design-system`：

- `title`: 返回的标题或用户批准的名称
- `data`: `JSON.stringify(designSystem)`
- `customInstructions`: 返回的 `customInstructions`

不要对 `.fig` 文件调用 `import-document`；它只处理元数据，会遗漏真正的设计令牌。

## 应用到幻灯片

在生成幻灯片时，用设计系统令牌替换默认值：

- `#00E5FF` -> `colors.accent`
- `Poppins` -> `typography.headingFont` / `typography.bodyFont`
- `#000000` 背景 -> `colors.background`
- `rgba(255,255,255,0.55)` -> `colors.textMuted`

## 微调

微调面板提供实时 CSS 变量覆盖：

- 强调色色板
- 标题大小写（lowercase/Title/UPPER）
- 背景暖度

更改持久化到设计系统并通过 CSS 自定义属性立即应用。