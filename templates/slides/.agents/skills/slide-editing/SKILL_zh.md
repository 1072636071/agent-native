---
name: slide-editing
description: 如何编辑单个幻灯片 -- 内容格式化、HTML 样式规则、更新数据库中的幻灯片内容。
---

# 幻灯片编辑

幻灯片是存储在演示文稿 JSON 中的 HTML 内容。每张幻灯片的 `content` 字段是一个自包含的 HTML 字符串，以 1920x1080 分辨率渲染。

## 幻灯片 HTML 结构

每张幻灯片使用此包装器：

```html
<div class="fmd-slide" style="padding: 80px 110px; display: flex; flex-direction: column; justify-content: flex-start;">
  <!-- 幻灯片内容在这里 -->
</div>
```

## 样式规则

所有生成的幻灯片遵循以下约定：

| 元素 | 样式 |
|---------|-------|
| 背景 | `bg-[#000000]`（纯黑） |
| 字体 | 所有文本使用 `font-family: 'Poppins', sans-serif` |
| 章节标签 | `font-size: 16px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #00E5FF` |
| 标题 | `font-size: 40px; font-weight: 900; color: #fff; line-height: 1.15; letter-spacing: -1px` |
| 标题幻灯片 | `font-size: 54px; font-weight: 900` 加 `justify-content: center` |
| 项目符号 | `&#x25CF;` 字符（8px，白色），间距: 20px，font-size: 22px，color: rgba(255,255,255,0.85) |
| 子项目符号 | `&#x25CB;`（空心圆），padding-left: 36px |
| 粗体术语 | `<strong style="font-weight: 800; color: #fff;">Term</strong>` + 描述使用 rgba(255,255,255,0.55) |
| 强调色 | `#00E5FF`（青色）用于章节标签、强调、高亮 |

## 更新幻灯片

要编辑幻灯片的内容：

1. **获取演示文稿**：`pnpm action get-deck --id=<deckId>`
2. **解析 JSON**，按 ID 找到幻灯片
3. **修改内容** HTML 字符串
4. **更新演示文稿** 通过 `PUT /api/decks/:id` 传入完整更新的演示文稿 JSON

## 图片占位符

对于视觉元素（图表、图表、照片），使用占位符 div：

```html
<div class="fmd-img-placeholder" style="width: 100%; height: 300px; border-radius: 12px;">
  图片描述
</div>
```

切勿尝试用原始 HTML/CSS 重新创建复杂的视觉效果。使用占位符并通过图片生成流程生成适当的图片。

## 幻灯片布局

常见布局模式：

- **标题幻灯片**：单个居中标题，`justify-content: center`
- **章节分隔页**：大号单个词，居中
- **内容页**：章节标签 + 标题 + 项目列表
- **两栏布局**：Flex 行加 `gap: 40px`，左侧文本，右侧图片
- **表格**：CSS 网格加交替行背景