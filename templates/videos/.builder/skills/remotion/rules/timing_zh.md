---
name: timing
description: Remotion 中的插值曲线 - 线性、缓动、弹簧动画
metadata:
  tags: spring, bounce, easing, interpolation
---

简单线性插值使用 `interpolate` 函数完成。

```ts
import { interpolate } from "remotion";

const opacity = interpolate(frame, [0, 100], [0, 1]);
```

默认情况下，值不会被钳制。像这样钳制它们：

```ts
const opacity = interpolate(frame, [0, 100], [0, 1], {
  extrapolateRight: "clamp",
  extrapolateLeft: "clamp",
});
```

## 弹簧动画

弹簧动画具有更自然的运动。它们随时间从 0 到 1。

```ts
import { spring, useCurrentFrame, useVideoConfig } from "remotion";

const frame = useCurrentFrame();
const { fps } = useVideoConfig();

const scale = spring({
  frame,
  fps,
});
```

### 物理属性

默认：`mass: 1, damping: 10, stiffness: 100`。

常见配置：

```tsx
const smooth = { damping: 200 }; // 平滑，无弹跳
const snappy = { damping: 20, stiffness: 200 }; // 敏捷，最小弹跳
const bouncy = { damping: 8 }; // 弹跳入场
const heavy = { damping: 15, stiffness: 80, mass: 2 }; // 沉重，缓慢
```

### 延迟

```tsx
const entrance = spring({
  frame,
  fps,
  delay: 20,
});
```

### 时长

```tsx
const s = spring({
  frame,
  fps,
  durationInFrames: 40,
});
```

### 结合 spring() 与 interpolate()

```tsx
const springProgress = spring({ frame, fps });
const rotation = interpolate(springProgress, [0, 1], [0, 360]);
<div style={{ rotate: rotation + "deg" }} />;
```

## 缓动

```ts
import { interpolate, Easing } from "remotion";

const value = interpolate(frame, [0, 100], [0, 1], {
  easing: Easing.inOut(Easing.quad),
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
});
```

曲线：`Easing.quad`、`Easing.sin`、`Easing.exp`、`Easing.circle`
凹凸：`Easing.in`、`Easing.out`、`Easing.inOut`

三次贝塞尔：

```ts
const value = interpolate(frame, [0, 100], [0, 1], {
  easing: Easing.bezier(0.8, 0.22, 0.96, 0.65),
});
```