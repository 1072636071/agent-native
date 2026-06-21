# 动画属性系统

## 概述

Video Studio 交互组件系统支持**任何 CSS 属性**的悬停和点击动画。这意味着你可以动画化任何东西 — 颜色、大小、变换、滤镜、边框等等！

## 快速开始

### 1. 使你的组件可交互

```tsx
import { useInteractiveComponent } from "@/remotion/hooks/useInteractiveComponent";
import { AnimatedElement } from "@/remotion/components/AnimatedElement";

const MyComp = ({ cursorHistory }) => {
  const button = useInteractiveComponent({
    id: "my-button",
    elementType: "Button",
    label: "My Button",
    compositionId: "my-comp",
    zone: { x: 100, y: 100, width: 200, height: 60 },
    cursorHistory,
    interactiveElementType: "button",
  });

  registerForCursor(button);

  return (
    <AnimatedElement interactive={button} as="button">
      Click me!
    </AnimatedElement>
  );
};
```

### 2. 通过 UI 添加动画

1. 在视频播放器中悬停元素
2. 打开"光标交互"面板（自动出现）
3. 点击"+ Add Hover Animation"或"+ Add Click Animation"
4. 添加属性：**backgroundColor**、**scale**、**borderRadius** 等
5. 实时查看你的更改！

## 支持的属性

### ✅ 所有 CSS 属性都有效！

`AnimatedElement` 组件自动将动画属性转换为适当的 CSS 样式。以下是一些示例：

#### 变换属性

- `scale` → `transform: scale()`
- `translateX`、`translateY`、`translateZ` → `transform: translate()`
- `rotate`、`rotateX`、`rotateY`、`rotateZ` → `transform: rotate()`
- `skewX`、`skewY` → `transform: skew()`

#### 滤镜属性

- `blur` → `filter: blur()`
- `brightness` → `filter: brightness()`
- `contrast` → `filter: contrast()`
- `saturate` → `filter: saturate()`
- `hueRotate` → `filter: hue-rotate()`

#### 颜色属性

- `backgroundColor` 或 `background`
- `color` 或 `textColor`
- `borderColor`

#### 尺寸属性

- `width`、`height`
- `padding`、`margin`
- `borderWidth`
- `borderRadius`

#### 阴影和效果

- `boxShadow` 或 `shadow`
- `opacity`

#### 自定义属性

- **任何** kebab-case CSS 属性名（如 `font-size`、`line-height`）
- **任何** camelCase CSS 属性名（如 `fontSize`、`lineHeight`）

## AnimatedElement 如何工作

`AnimatedElement` 组件：

1. **读取**交互组件状态中的所有动画属性
2. **转换**为内联 CSS 样式（自动）
3. **处理**变换、滤镜和所有 CSS 属性（智能）
4. **合并**你提供的任何额外样式
5. **应用**所有内容到渲染元素

### 底层原理

```tsx
// 用户通过 UI 添加 "backgroundColor" 动画，从 #000000 到 #FFFFFF

// AnimatedElement 自动：
// 1. 检测 backgroundColor 属性
// 2. 根据悬停进度（0 → 1）插值
// 3. 应用为内联样式：backgroundColor: "#888888"（50% 悬停时）
```

## 高级用法

### 自定义组件

```tsx
// 适用于任何接受 style 属性的组件
<AnimatedElement interactive={myButton} as={CustomButton} customProp="value">
  Content
</AnimatedElement>
```

### 与静态样式合并

```tsx
// 用户提供的样式覆盖动画样式
<AnimatedElement
  interactive={myButton}
  as="div"
  style={{
    backgroundColor: "red", // 这会覆盖动画 backgroundColor
    position: "absolute", // 静态样式正常工作
  }}
>
  Content
</AnimatedElement>
```

### 手动属性提取

如果需要自定义逻辑，手动提取属性：

```tsx
const button = useInteractiveComponent({ ... });

const scale = (button.animatedProperties?.scale as number) ?? 1;
const bgColor = button.animatedProperties?.backgroundColor ?? "transparent";
const customProp = button.animatedProperties?.myCustomProperty;

<div style={{
  transform: `scale(${scale})`,
  backgroundColor: bgColor,
  // 自定义逻辑在这里
}}>
  Content
</div>
```

## 示例

### 背景色悬停

通过 UI：

1. 选择元素
2. 添加悬停动画
3. 添加属性：`backgroundColor`
4. 从：`rgba(0,0,0,0.1)`，到：`rgba(0,0,0,0.3)`

### 多属性动画

通过 UI：

1. 选择元素
2. 添加悬停动画
3. 添加属性：
   - `scale`：从 `1`，到 `1.05`
   - `backgroundColor`：从 `#f0f0f0`，到 `#ffffff`
   - `borderRadius`：从 `8px`，到 `16px`
   - `boxShadow`：从 `0 2px 4px rgba(0,0,0,0.1)`，到 `0 8px 16px rgba(0,0,0,0.2)`

所有属性平滑动画一起！

### 点击反馈

通过 UI：

1. 选择元素
2. 添加点击动画（时长：6 帧）
3. 添加属性：
   - `scale`：从 `1`，到 `0.95`
   - `brightness`：从 `100%`，到 `90%`

元素在点击时"按下"！

## 属性类型

### 数值属性

- 自动为尺寸属性添加 `px`（width、padding 等）
- 自动为旋转属性添加 `deg`
- 自动为滤镜属性添加 `%`（brightness、contrast）

### 字符串属性

- 用于颜色、阴影等，原样使用
- 示例：`#ff0000`、`rgba(0,0,0,0.5)`、`0 4px 8px rgba(0,0,0,0.2)`

### 单位

通过 UI 添加属性时，在值中包含单位：

- `10px` ✅
- `50%` ✅
- `1.5em` ✅
- `10` ⚠️（尺寸属性解释为像素）

## 最佳实践

### 1. 默认使用 AnimatedElement

```tsx
// ✅ 推荐 - 适用于任何属性
<AnimatedElement interactive={button} as="button">
  Click me
</AnimatedElement>

// ❌ 手动 - 每个属性都需要更新代码
<button style={{
  transform: `scale(${scale})`,
  // 忘记添加 backgroundColor？需要更新代码！
}}>
  Click me
</button>
```

### 2. 保持动画微妙

- 悬停缩放：1.05 - 1.15（不是 2.0！）
- 提升：4px - 12px（不是 50px！）
- 颜色偏移：轻微变化（不是黑色 → 白色！）

### 3. 使用适当的时长

- 悬停：6-12 帧（快速、响应）
- 点击：3-6 帧（即时反馈）
- 复杂：12-24 帧（平滑、优雅）

### 4. 在实际硬件上测试

- 60fps 看起来好的可能在 30fps 时感觉迟缓
- 用真实鼠标移动测试悬停响应性
- 检查点击反馈是否感觉即时

## 故障排除

### 属性未生效？

**检查：**

1. ✅ 使用了 `AnimatedElement` 组件？
2. ✅ 正确传递了 `interactive` 属性？
3. ✅ 使用 `registerForCursor()` 注册了组件？
4. ✅ 属性名完全匹配（区分大小写）？

### 常见错误

**错误**：在 Remotion 中使用 className 而非内联样式

```tsx
<AnimatedElement interactive={button} className="hover:bg-red-500">
  不会工作 - Remotion 不支持 className 动画
</AnimatedElement>
```

**正确**：AnimatedElement 处理一切

```tsx
<AnimatedElement interactive={button}>
  有效 - animatedProperties 作为内联样式应用！
</AnimatedElement>
```

### 调试

记录动画属性以查看可用内容：

```tsx
console.log(button.animatedProperties);
// 输出：{ scale: 1.05, backgroundColor: "#ffffff", ... }
```

## 架构

### 数据流

```
用户悬停元素
  ↓
useInteractiveComponent 检测悬停
  ↓
从 CurrentElementContext 获取动画
  ↓
计算当前悬停进度下的属性值
  ↓
存储在 animatedProperties 对象中
  ↓
AnimatedElement 读取 animatedProperties
  ↓
转换为内联样式
  ↓
应用到渲染元素
```

### 存储

动画存储在：

- `CurrentElementContext` — 内存状态
- `localStorage` — 跨重新加载持久化（按合成）

### 插值

属性值使用以下方式插值：

- 缓动函数（expo.out、power2.inOut 等）
- 进度值（0 → 1 用于悬停/点击）
- 关键帧（from → to 值）

## 总结

✅ **任何 CSS 属性都可以动画化**
✅ **使用 AnimatedElement 自动应用**
✅ **通过 UI 添加属性 — 无需代码更改**
✅ **适用于变换、滤镜、颜色、尺寸等**
✅ **完全可自定义和可扩展**

动画属性系统设计为**完全灵活**。如果你能用 CSS 设置样式，你就能在 Video Studio 中动画化它！