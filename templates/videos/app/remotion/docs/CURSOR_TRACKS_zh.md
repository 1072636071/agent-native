# 光标轨道模式与最佳实践

本文档规范了在 Video Studio 合成中创建光标轨道的正确模式。

## 🎯 快速开始

### 使用辅助函数（推荐）

始终使用 `registry.ts` 中的辅助函数来创建具有正确配置的轨道：

```typescript
import {
  createCameraTrack,
  createCursorTrack,
  createStandardTracks,
} from "@/remotion/registry";

// 同时创建摄像机和光标轨道
const tracks = createStandardTracks(300);

// 或分别创建
const cameraTrack = createCameraTrack(300);
const cursorTrack = createCursorTrack(300);

// 自定义光标起始位置
const cursorTrack = createCursorTrack(300, {
  startX: 100,
  startY: 100,
  startOpacity: 0,
  easing: "expo.inOut",
});
```

## ⚠️ 关键模式：光标类型

### ✅ 正确模式

```typescript
// 光标类型必须是常量 "default" 值
{ property: "type", from: "default", to: "default", unit: "" }
```

**不需要关键帧！** `autoCursorType` 系统会在悬停交互组件时自动将其覆盖为 `"pointer"`。

### ❌ 错误模式

```typescript
// ❌ 不要使用数值
{ property: "type", from: "0", to: "0", unit: "" }
{ property: "type", from: "1", to: "1", unit: "" }

// ❌ 不要添加关键帧来切换光标类型
{
  property: "type",
  from: "default",
  to: "default",
  unit: "",
  keyframes: [
    { frame: 0, value: "default" },
    { frame: 30, value: "pointer" },  // 不要这样做！
  ]
}
```

### 为什么这个模式有效

1. **标准箭头光标**：当光标未悬停在任何交互组件上时，显示为标准箭头（`"default"`）。

2. **自动覆盖**：当光标进入交互组件区域时，`autoCursorType` 系统（来自 `useInteractiveComponentsCursor`）会自动覆盖轨道类型以显示 `"pointer"`。

3. **不会出现不可见光标**：光标在组件之间始终保持可见（只要 opacity > 0）。

## 📋 完整光标轨道结构

正确配置的光标轨道包含以下属性：

```typescript
{
  id: "cursor",
  label: "Cursor",
  startFrame: 0,
  endFrame: 300,
  easing: "expo.inOut",
  animatedProps: [
    // 位置
    { property: "x", from: "960", to: "960", unit: "px", keyframes: [] },
    { property: "y", from: "540", to: "540", unit: "px", keyframes: [] },

    // 外观
    { property: "opacity", from: "1", to: "1", unit: "", keyframes: [] },
    { property: "scale", from: "1", to: "1", unit: "", keyframes: [] },

    // 类型（常量 "default" - autoCursorType 处理悬停状态）
    { property: "type", from: "default", to: "default", unit: "" },

    // 交互
    { property: "isClicking", from: "0", to: "0", unit: "", keyframes: [] },
  ],
}
```

## 🎬 添加光标移动

向 `x` 和 `y` 属性添加关键帧以动画化光标移动：

```typescript
const cursorTrack = createCursorTrack(300);

// 添加移动关键帧
const xProp = cursorTrack.animatedProps.find((p) => p.property === "x")!;
xProp.keyframes = [
  { frame: 0, value: "100" }, // 从屏幕外开始
  { frame: 30, value: "760" }, // 移动到按钮
  { frame: 90, value: "760" }, // 悬停在按钮上
  { frame: 120, value: "960" }, // 移动到中心
];

const yProp = cursorTrack.animatedProps.find((p) => p.property === "y")!;
yProp.keyframes = [
  { frame: 0, value: "100" },
  { frame: 30, value: "400" },
  { frame: 90, value: "400" },
  { frame: 120, value: "540" },
];
```

## 🖱️ 添加点击事件

添加关键帧以触发点击动画：

```typescript
const clickProp = cursorTrack.animatedProps.find(
  (p) => p.property === "isClicking",
)!;
clickProp.keyframes = [
  { frame: 0, value: "0" },
  { frame: 59, value: "0" },
  { frame: 60, value: "1" }, // 点击开始
  { frame: 70, value: "0" }, // 点击结束（10 帧后）
];
```

## 💡 淡入/淡出模式

光标外观的常见模式：

```typescript
const opacityProp = cursorTrack.animatedProps.find(
  (p) => p.property === "opacity",
)!;
opacityProp.keyframes = [
  { frame: 0, value: "0" }, // 开始时隐藏
  { frame: 20, value: "0" },
  { frame: 30, value: "1" }, // 淡入
  { frame: 280, value: "1" }, // 保持可见
  { frame: 290, value: "0" }, // 淡出
  { frame: 300, value: "0" }, // 结束时隐藏
];
```

## 🔧 辅助函数参考

### `createStandardTracks(durationInFrames)`

创建摄像机和光标轨道，使用默认值。

```typescript
const tracks = createStandardTracks(300);
// 返回：[cameraTrack, cursorTrack]
```

### `createCameraTrack(durationInFrames)`

创建无移动的摄像机轨道（静态视口）。

```typescript
const cameraTrack = createCameraTrack(300);
```

### `createCursorTrack(durationInFrames, options?)`

创建正确配置的光标轨道。

**选项：**

- `startX`（默认：960）- 初始 X 位置
- `startY`（默认：540）- 初始 Y 位置
- `startOpacity`（默认：1）- 初始透明度
- `easing`（默认："expo.inOut"）- 缓动函数

```typescript
const cursorTrack = createCursorTrack(300, {
  startX: 100,
  startY: 100,
  startOpacity: 0,
  easing: "expo.inOut",
});
```

## 📚 示例

### 带静态光标的基础合成

```typescript
import { createStandardTracks } from "@/remotion/registry";

const FALLBACK_TRACKS = createStandardTracks(240);
```

### 带动画光标的合成

```typescript
import { createStandardTracks } from "@/remotion/registry";

const FALLBACK_TRACKS = (() => {
  const tracks = createStandardTracks(300);
  const cursorTrack = tracks[1];

  // 添加移动
  const xProp = cursorTrack.animatedProps.find((p) => p.property === "x")!;
  xProp.keyframes = [
    { frame: 0, value: "100" },
    { frame: 30, value: "960" },
  ];

  return tracks;
})();
```

### 交互组件演示模式

参见 `app/remotion/compositions/ComponentsDemo.tsx` 的完整示例，包含：

- 多个交互组件
- 组件间的光标移动
- 点击动画
- 淡入/淡出
- 悬停时自动切换光标类型

## 🐛 故障排除

### 问题：光标在组件之间消失

**原因**：光标类型使用了数值（`"0"` 或 `"1"`）而非 `"default"`

**解决方案**：使用辅助函数或确保 type 属性为：

```typescript
{ property: "type", from: "default", to: "default", unit: "" }
```

### 问题：光标悬停时不变为 pointer

**原因**：

1. 交互组件未通过 `registerForCursor()` 注册
2. 区域配置不正确
3. `autoCursorType` 未传递给 `CameraHost`

**解决方案**：

```typescript
// 注册组件
React.useEffect(() => {
  registerForCursor(button);
}, [button.hover.isHovering, button.click.isClicking, registerForCursor]);

// 将 autoCursorType 传递给 CameraHost
<CameraHost tracks={tracks} autoCursorType={autoCursorType}>
  {/* 内容 */}
</CameraHost>
```

### 问题：光标出现但不移动

**原因**：未向 x/y 属性添加关键帧

**解决方案**：按上方"添加光标移动"部分所示添加关键帧

## 📖 另见

- `app/remotion/registry.ts` - 辅助函数实现
- `app/remotion/compositions/ComponentsDemo.tsx` - 完整示例
- `app/remotion/compositions/UIShowcase.tsx` - 另一个工作示例
- `app/remotion/hooks/createInteractiveComposition.tsx` - autoCursorType 工作原理