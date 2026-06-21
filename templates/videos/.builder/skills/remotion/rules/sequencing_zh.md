---
name: sequencing
description: Remotion 序列模式 - 延迟、裁剪、限制项目时长
metadata:
  tags: sequence, series, timing, delay, trim
---

使用 `<Sequence>` 来延迟元素在时间线中的出现时间。

```tsx
import { Sequence } from "remotion";

const { fps } = useVideoConfig();

<Sequence from={1 * fps} durationInFrames={2 * fps} premountFor={1 * fps}>
  <Title />
</Sequence>;
```

始终为任何 `<Sequence>` 设置 premount！

## Series

当元素应按顺序播放且无重叠时，使用 `<Series>`。

```tsx
import { Series } from "remotion";

<Series>
  <Series.Sequence durationInFrames={45}>
    <Intro />
  </Series.Sequence>
  <Series.Sequence durationInFrames={60}>
    <MainContent />
  </Series.Sequence>
</Series>;
```

## Sequence 内部的帧引用

在 Sequence 内部，`useCurrentFrame()` 返回本地帧（从 0 开始）。

## 嵌套序列

序列可以嵌套以实现复杂的时间控制：

```tsx
<Sequence from={0} durationInFrames={120}>
  <Background />
  <Sequence from={15} durationInFrames={90} layout="none">
    <Title />
  </Sequence>
</Sequence>
```