# Video Studio

一个基于 Remotion 的强大视频合成工作室，支持 AI 驱动生成、交互式光标动画和高级时间线控制。

## 🚀 快速开始

```bash
pnpm install
pnpm run dev
```

打开 http://localhost:8080 访问工作室。

## ✨ 功能特性

### 🎬 AI 驱动生成

- 用自然语言描述视频
- 附带参考图片、Logo 和素材
- 自动生成 React 组件和动画轨道

### 🎥 摄像机系统

- 6 个可动画属性：平移 X/Y、缩放、旋转 X/Y、透视
- 支持框选和 Shift+点击的多关键帧选择
- 带实时预览的可视化摄像机控制

### 🖱️ 交互式光标

- 带平滑动画的位置追踪
- 悬停和点击检测
- 基于组件类型的交互
- 带多种状态的可视光标

### 🎭 光标交互

- 为任何组件类型添加悬停动画
- 带时间控制的点击效果
- 交互时的缩放、平移和旋转
- 持续时间和缓动自定义

### ⚡ 高级时间线

- 多关键帧选择和编辑
- 可视化缓动选择器（20+ 曲线）
- 视图范围控制，专注编辑
- 带实时预览的轨道属性面板
- 表达式控制动画（程序化）

### 🎨 内置组件

- 动态文字（打字揭示、漂移、爆炸）
- Logo 揭示（粒子爆发）
- Logo 爆炸（SVG 散射）
- 交互演示（悬停按钮）
- 交互卡片网格（光标响应卡片）
- 幻灯片（多页过渡）

## 🛠️ 辅助函数

```typescript
import { createBlankComposition, addComposition } from "@/remotion/registry";

import {
  createCameraTrack,
  createCursorTrack,
  createAnimationTrack,
  createFadeInTrack,
  createSlideInTrack,
  createCursorPath,
  createClickEvents,
  validateComposition,
} from "@/utils/compositionHelpers";

// 创建新合成
const comp = createBlankComposition("My Video");
addComposition(comp);

// 或手动构建，完全控制
const tracks = [
  createCameraTrack(240),
  createCursorTrack(240),
  createFadeInTrack("title", "Title Entrance", 0, 30),
];

validateComposition(tracks); // 确保包含必需轨道
```

## 📖 核心概念

### 合成（Compositions）

- **ID**：URL 友好的 slug（从标题自动生成）
- **轨道（Tracks）**：动画时间线（摄像机、光标、自定义）
- **属性（Props）**：组件配置（颜色、文本等）
- **尺寸**：默认 1920×1080 @ 30fps

### 轨道（Tracks）

- **摄像机**：控制视口（必需）
- **光标**：追踪指针位置（交互时必需）
- **自定义**：元素特定动画（可选）

### 关键帧（Keyframes）

- **简单**：带缓动的 from/to 值
- **复杂**：带独立缓动的多个关键帧
- **程序化**：带参数的代码驱动动画

### 光标交互

- **悬停**：光标进入组件边界时触发
- **点击**：光标点击事件时触发
- **基于组件类型**：全局应用于所有实例

## 🎯 常用工作流

### AI 创建

1. 点击 "+ New Composition"
2. 描述你的视频
3. 附带参考资料（可选）
4. 按 Enter
5. 编辑和自定义

### 手动创建

1. 复制 `BlankComposition.tsx` 作为模板
2. 修改组件代码
3. 在 `registry.ts` 中注册
4. 在 `compositions/index.ts` 中导出
5. 导航到 `/c/your-comp-id`

### 添加光标交互

1. 确保存在光标轨道
2. 在组件中添加 `<Cursor>`
3. 使用 `useHoverAnimation()` 钩子
4. 在属性 → 光标交互中配置

### 多关键帧编辑

1. 框选：在时间线中点击+拖动
2. Shift+点击：添加单个关键帧
3. 拖动选区：一起移动
4. 保持相对时间

## 📁 项目结构

```
app/
├── remotion/
│   ├── compositions/        # 视频组件
│   ├── ui-components/       # 可复用元素（Cursor 等）
│   ├── hooks/              # 动画钩子
│   ├── CameraHost.tsx      # 摄像机包装器
│   ├── registry.ts         # 合成注册表
│   └── trackAnimation.ts   # 轨道工具
├── components/             # 工作室 UI 组件
├── pages/                  # 路由（Index, CompositionView）
├── utils/                  # 辅助工具和实用函数
└── contexts/              # React 上下文提供者

server/
├── routes/                # API 端点
└── index.ts              # Express 服务器

docs/examples/
└── create-composition.example.ts  # 示例创建脚本
```

## 🔧 开发

### 命令

```bash
# 开发
pnpm run dev           # 启动开发服务器 (http://localhost:8080)

# 构建
pnpm run build         # 构建客户端和服务器

# 生产
pnpm start             # 运行生产服务器

# 测试
pnpm test              # 运行测试
pnpm typecheck         # 类型检查
pnpm format.fix        # 格式化代码
```

### 环境

所有合成运行于：

- **30fps**（标准化）
- **1920×1080**（宽屏格式默认）
- **240 帧**（8 秒默认时长）

## 🎓 了解更多

- **Remotion 文档**：https://remotion.dev/docs
- **Builder.io 文档**：https://www.builder.io/c/docs/projects
- **示例合成**：查看 `app/remotion/compositions/` 文件夹

## 📝 许可证

私有项目。

---

**准备好开始创作了吗？** 点击 "+ New Composition" 描述你的第一个视频！🎬