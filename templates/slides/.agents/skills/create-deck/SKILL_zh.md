---
name: create-deck
description: 如何从头创建带有幻灯片的新演示文稿。在创建任何演示文稿之前阅读此文档。包含每种幻灯片布局的精确 HTML 模板 — 无需探索代码库。
---

# 创建演示文稿

**不要探索代码库。** 你需要的一切都在这里。

## 工作流

1. 规划幻灯片（标题、章节分隔页、内容幻灯片）
2. 调用 `create-deck --title "..." --slides '[]'` 创建空演示文稿
3. 导航到新演示文稿
4. 按幻灯片顺序逐个调用 `add-slide`，等待每个结果后再添加下一张幻灯片

不要为同一个演示文稿并行创建多张幻灯片。不要生成子代理同时写入同一个演示文稿。子代理可以研究或起草幻灯片文案，但一个写入者应按顺序调用 `add-slide`，这样编辑器保持稳定，用户可以观看进度。

如果用户提供 Google Docs URL 作为源材料，首先调用 `import-google-doc --url <url>` 并从返回的文本构建。如果 action 无法读取私有文档，用户可以连接 Google Docs 并通过选择器选择文件，或与配置的服务账户共享文档。转达 action 的确切访问说明，而不是仅从 URL 生成。

```bash
pnpm action create-deck --title "My Deck" --slides '[]'
```

然后导航：
```bash
pnpm action navigate --deckId=<create-deck 输出中的 id>
```

然后逐个添加幻灯片：

```bash
pnpm action add-slide --deckId=<id> --layout title --content "..."
pnpm action add-slide --deckId=<id> --layout content --content "..."
```

## 幻灯片包装器

每张幻灯片的 `content` 必须使用这个精确的外层 div：

```html
<div class="fmd-slide" style="padding: 80px 110px; display: flex; flex-direction: column; justify-content: flex-start; font-family: 'Poppins', sans-serif;">
  <!-- slide content here -->
</div>
```

背景为纯黑（`bg-[#000000]`）— 由渲染器设置，不是幻灯片 HTML。

## 即用模板

复制并填入括号中的值。在 JSON 字符串内使用 `\` 转义引号。

---

### 标题幻灯片

```html
<div class="fmd-slide" style="padding: 80px 110px; display: flex; flex-direction: column; justify-content: center; align-items: flex-start; font-family: 'Poppins', sans-serif;">
  <div style="font-size: 16px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #00E5FF; margin-bottom: 24px;">[LABEL OR DATE]</div>
  <h1 style="font-size: 64px; font-weight: 900; color: #fff; line-height: 1.1; letter-spacing: -2px; margin: 0 0 24px 0;">[TITLE]</h1>
  <p style="font-size: 22px; color: rgba(255,255,255,0.55); margin: 0;">[SUBTITLE OR PRESENTER]</p>
</div>
```

---

### 章节分隔页

```html
<div class="fmd-slide" style="padding: 80px 110px; display: flex; flex-direction: column; justify-content: center; align-items: flex-start; font-family: 'Poppins', sans-serif;">
  <div style="font-size: 16px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #00E5FF; margin-bottom: 20px;">[SECTION NUMBER, e.g. 01]</div>
  <h2 style="font-size: 72px; font-weight: 900; color: #fff; line-height: 1.05; letter-spacing: -2px; margin: 0;">[SECTION TITLE]</h2>
</div>
```

---

### 内容幻灯片（项目符号）

```html
<div class="fmd-slide" style="padding: 80px 110px; display: flex; flex-direction: column; justify-content: flex-start; font-family: 'Poppins', sans-serif;">
  <div style="font-size: 14px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #00E5FF; margin-bottom: 16px;">[SECTION LABEL]</div>
  <h2 style="font-size: 40px; font-weight: 900; color: #fff; line-height: 1.15; letter-spacing: -1px; margin: 0 0 48px 0;">[SLIDE HEADING]</h2>
  <div style="display: flex; flex-direction: column; gap: 20px;">
    <div style="display: flex; align-items: flex-start; gap: 16px;">
      <span style="font-size: 8px; color: #fff; margin-top: 8px; flex-shrink: 0;">&#x25CF;</span>
      <span style="font-size: 22px; color: rgba(255,255,255,0.85); line-height: 1.5;">[BULLET TEXT]</span>
    </div>
    <div style="display: flex; align-items: flex-start; gap: 16px;">
      <span style="font-size: 8px; color: #fff; margin-top: 8px; flex-shrink: 0;">&#x25CF;</span>
      <span style="font-size: 22px; color: rgba(255,255,255,0.85); line-height: 1.5;">[BULLET TEXT]</span>
    </div>
    <div style="display: flex; align-items: flex-start; gap: 16px;">
      <span style="font-size: 8px; color: #fff; margin-top: 8px; flex-shrink: 0;">&#x25CF;</span>
      <span style="font-size: 22px; color: rgba(255,255,255,0.85); line-height: 1.5;">[BULLET TEXT]</span>
    </div>
  </div>
</div>
```

---

### 两栏幻灯片（左侧文本，右侧图片/视觉元素）

```html
<div class="fmd-slide" style="padding: 80px 110px; display: flex; flex-direction: column; justify-content: flex-start; font-family: 'Poppins', sans-serif;">
  <div style="font-size: 14px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #00E5FF; margin-bottom: 16px;">[SECTION LABEL]</div>
  <h2 style="font-size: 40px; font-weight: 900; color: #fff; line-height: 1.15; letter-spacing: -1px; margin: 0 0 40px 0;">[HEADING]</h2>
  <div style="display: flex; gap: 60px; flex: 1;">
    <div style="flex: 1; display: flex; flex-direction: column; gap: 20px;">
      <div style="display: flex; align-items: flex-start; gap: 16px;">
        <span style="font-size: 8px; color: #fff; margin-top: 8px; flex-shrink: 0;">&#x25CF;</span>
        <span style="font-size: 20px; color: rgba(255,255,255,0.85); line-height: 1.5;">[BULLET]</span>
      </div>
      <div style="display: flex; align-items: flex-start; gap: 16px;">
        <span style="font-size: 8px; color: #fff; margin-top: 8px; flex-shrink: 0;">&#x25CF;</span>
        <span style="font-size: 20px; color: rgba(255,255,255,0.85); line-height: 1.5;">[BULLET]</span>
      </div>
    </div>
    <div class="fmd-img-placeholder" style="flex: 1; border-radius: 12px; min-height: 300px;">[IMAGE DESCRIPTION]</div>
  </div>
</div>
```

---

### 引言 / 引用幻灯片

```html
<div class="fmd-slide" style="padding: 80px 110px; display: flex; flex-direction: column; justify-content: center; align-items: flex-start; font-family: 'Poppins', sans-serif;">
  <div style="width: 60px; height: 4px; background: #00E5FF; margin-bottom: 40px;"></div>
  <p style="font-size: 48px; font-weight: 800; color: #fff; line-height: 1.2; letter-spacing: -1px; margin: 0 0 32px 0;">&ldquo;[STATEMENT OR QUOTE]&rdquo;</p>
  <p style="font-size: 18px; color: rgba(255,255,255,0.45); margin: 0;">[SOURCE OR ATTRIBUTION]</p>
</div>
```

---

### 指标 / 统计幻灯片

```html
<div class="fmd-slide" style="padding: 80px 110px; display: flex; flex-direction: column; justify-content: flex-start; font-family: 'Poppins', sans-serif;">
  <div style="font-size: 14px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #00E5FF; margin-bottom: 16px;">[SECTION LABEL]</div>
  <h2 style="font-size: 40px; font-weight: 900; color: #fff; line-height: 1.15; letter-spacing: -1px; margin: 0 0 60px 0;">[HEADING]</h2>
  <div style="display: flex; gap: 60px;">
    <div style="flex: 1;">
      <div style="font-size: 72px; font-weight: 900; color: #00E5FF; letter-spacing: -2px; line-height: 1;">[METRIC]</div>
      <div style="font-size: 18px; color: rgba(255,255,255,0.55); margin-top: 12px;">[LABEL]</div>
    </div>
    <div style="flex: 1;">
      <div style="font-size: 72px; font-weight: 900; color: #00E5FF; letter-spacing: -2px; line-height: 1;">[METRIC]</div>
      <div style="font-size: 18px; color: rgba(255,255,255,0.55); margin-top: 12px;">[LABEL]</div>
    </div>
    <div style="flex: 1;">
      <div style="font-size: 72px; font-weight: 900; color: #00E5FF; letter-spacing: -2px; line-height: 1;">[METRIC]</div>
      <div style="font-size: 18px; color: rgba(255,255,255,0.55); margin-top: 12px;">[LABEL]</div>
    </div>
  </div>
</div>
```

---

### 结尾 / CTA 幻灯片

```html
<div class="fmd-slide" style="padding: 80px 110px; display: flex; flex-direction: column; justify-content: center; align-items: flex-start; font-family: 'Poppins', sans-serif;">
  <div style="font-size: 16px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #00E5FF; margin-bottom: 24px;">[LABEL, e.g. GET STARTED]</div>
  <h2 style="font-size: 64px; font-weight: 900; color: #fff; line-height: 1.1; letter-spacing: -2px; margin: 0 0 32px 0;">[CLOSING STATEMENT]</h2>
  <p style="font-size: 22px; color: rgba(255,255,255,0.55); margin: 0;">[CONTACT OR NEXT STEP]</p>
</div>
```

## 图片占位符

当幻灯片需要视觉元素时，使用此 div — 它渲染为样式化的占位符，之后可以被生成的图片替换：

```html
<div class="fmd-img-placeholder" style="width: 100%; height: 300px; border-radius: 12px;">[Description of what image should show]</div>
```

## 带描述的粗体术语

用于定义样式的项目符号：

```html
<div style="display: flex; align-items: flex-start; gap: 16px;">
  <span style="font-size: 8px; color: #fff; margin-top: 8px; flex-shrink: 0;">&#x25CF;</span>
  <span style="font-size: 22px; line-height: 1.5;">
    <strong style="font-weight: 800; color: #fff;">[Term]</strong>
    <span style="color: rgba(255,255,255,0.55);"> — [description]</span>
  </span>
</div>
```

## 仅用于批量替换

仅对导入或有意的原子批量替换使用非空的 `create-deck --slides '[...]'` 载荷。对于正常的 AI 生成演示文稿，使用上面的空演示文稿加顺序 `add-slide` 工作流。

批量载荷如下所示：

```bash
pnpm action create-deck --title "Product Vision 2025" --slides '[
  {
    "id": "slide-1",
    "layout": "title",
    "content": "<div class=\"fmd-slide\" style=\"padding: 80px 110px; display: flex; flex-direction: column; justify-content: center; align-items: flex-start; font-family: '\''Poppins'\'', sans-serif;\"><div style=\"font-size: 16px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #00E5FF; margin-bottom: 24px;\">ANNUAL STRATEGY</div><h1 style=\"font-size: 64px; font-weight: 900; color: #fff; line-height: 1.1; letter-spacing: -2px; margin: 0 0 24px 0;\">Product Vision 2025</h1><p style=\"font-size: 22px; color: rgba(255,255,255,0.55); margin: 0;\">Engineering Leadership — Q1 2025</p></div>"
  },
  {
    "id": "slide-2",
    "layout": "content",
    "content": "<div class=\"fmd-slide\" style=\"padding: 80px 110px; display: flex; flex-direction: column; justify-content: flex-start; font-family: '\''Poppins'\'', sans-serif;\"><div style=\"font-size: 14px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #00E5FF; margin-bottom: 16px;\">OVERVIEW</div><h2 style=\"font-size: 40px; font-weight: 900; color: #fff; line-height: 1.15; letter-spacing: -1px; margin: 0 0 48px 0;\">Three Core Priorities</h2><div style=\"display: flex; flex-direction: column; gap: 20px;\"><div style=\"display: flex; align-items: flex-start; gap: 16px;\"><span style=\"font-size: 8px; color: #fff; margin-top: 8px; flex-shrink: 0;\">&#x25CF;</span><span style=\"font-size: 22px; color: rgba(255,255,255,0.85); line-height: 1.5;\">Ship the agent platform by March</span></div><div style=\"display: flex; align-items: flex-start; gap: 16px;\"><span style=\"font-size: 8px; color: #fff; margin-top: 8px; flex-shrink: 0;\">&#x25CF;</span><span style=\"font-size: 22px; color: rgba(255,255,255,0.85); line-height: 1.5;\">Grow to 10k active teams</span></div><div style=\"display: flex; align-items: flex-start; gap: 16px;\"><span style=\"font-size: 8px; color: #fff; margin-top: 8px; flex-shrink: 0;\">&#x25CF;</span><span style=\"font-size: 22px; color: rgba(255,255,255,0.85); line-height: 1.5;\">Reduce time-to-value to under 5 minutes</span></div></div></div>"
  }
]'
```

创建后，导航到演示文稿：
```bash
pnpm action navigate --deckId=<id>
```
