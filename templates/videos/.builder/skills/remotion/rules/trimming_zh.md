---
name: trimming
description: Remotion 裁剪模式 - 剪裁动画的开头或结尾
metadata:
  tags: sequence, trim, clip, cut, offset
---

使用带负 `from` 值的 `<Sequence>` 来裁剪动画的开头。

## 裁剪开头

```tsx
const { fps } = useVideoConfig();

<Sequence from={-0.5 * fps}>
  <MyAnimation />
</Sequence>;
```

## 裁剪结尾

```tsx
<Sequence durationInFrames={1.5 * fps}>
  <MyAnimation />
</Sequence>
```

## 裁剪并延迟

嵌套序列以同时裁剪开头和延迟：

```tsx
<Sequence from={30}>
  <Sequence from={-15}>
    <MyAnimation />
  </Sequence>
</Sequence>
```