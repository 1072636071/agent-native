---
name: animation-tracks
description: 基于轨道的动画系统。AnimationTrack、AnimatedProp 类型，findTrack/trackProgress/getPropValue 辅助函数。编辑动画前阅读。
---

# 动画轨道

工作室中的每个视觉动画都由轨道控制。轨道是时间线 UI 和合成代码之间的接口。

## 核心类型（`app/types.ts`）

### AnimationTrack

```typescript
interface AnimationTrack {
  id: string;           // 唯一、稳定（如 "lr-ring"）。由 findTrack() 使用。
  label: string;        // 时间线中的显示名称
  startFrame: number;
  endFrame: number;
  easing: EasingKey;    // "linear" | "ease-in" | "ease-out" | "ease-in-out" | "spring"
  animatedProps?: AnimatedProp[];
}
```

### AnimatedProp

```typescript
interface AnimatedProp {
  property: string;       // 如 "opacity"、"translateY"
  from: string;           // 起始值（字符串）
  to: string;             // 结束值（字符串）
  unit: string;           // CSS 单位："px"、"deg"、""（无）
  description?: string;   // 纯英文解释
  codeSnippet?: string;   // 属性面板中显示的只读源代码
  programmatic?: boolean; // true -> 无可编辑的 from/to
  parameters?: Array<{    // 程序化动画的可调参数
    name: string;
    label: string;
    default: number;
    min?: number;
    max?: number;
    step?: number;
  }>;
  parameterValues?: Record<string, number>;
}
```

## 辅助函数（`app/remotion/trackAnimation.ts`）

```typescript
// 返回给定帧处轨道的 0->1 进度
trackProgress(frame, fps, track): number

// 根据进度为命名属性插值 from->to
getPropValue(progress, track, property, defaultFrom, defaultTo): number

// 按 id 查找轨道；未找到时返回 fallback
findTrack(tracks, id, fallback): AnimationTrack
```

## 轨道类型

### 持续时间轨道（startFrame != endFrame）

用于有明确开始/结束的动画：弹簧动画、淡入淡出、移动。

### 关键帧轨道（startFrame === endFrame）

用于即时状态变化：标签页切换、模态框打开。在时间线中渲染为菱形标记。

```typescript
{
  id: "switch-tab",
  label: "Switch Tab",
  startFrame: 60,
  endFrame: 60,  // 相同 = 关键帧菱形
  easing: "linear",
}
```

用法：`const activeTab = frame >= switchTrack.startFrame ? "B" : "A";`

## 程序化动画

对于不能简单 from->to 的复杂效果：

1. 添加带 `programmatic: true` 或 `codeSnippet` 的 `AnimatedProp`
2. 提供清晰的 `description`（纯英文）
3. 考虑将关键值暴露为 `parameters` 供用户调整

即使使用程序化动画，也始终通过 `getPropValue()` 支持常见的动画属性（`scale`、`opacity`、`translateX`、`translateY`、`rotation`），这样用户可以在上面叠加标准动画。

## 关键规则

- **绝不硬编码帧检查** — 所有计时使用轨道
- **所有动画必须注册**为注册表中的轨道
- 更改程序化动画逻辑时更新 `codeSnippet` 和 `description`
- 关键帧轨道（startFrame === endFrame）自动渲染为菱形
- 表达式属性（`codeSnippet` 或 `programmatic: true`）显示紫色 `fx` 徽章