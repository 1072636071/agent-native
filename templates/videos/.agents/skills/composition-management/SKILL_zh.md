---
name: composition-management
description: 如何创建和注册视频合成。涵盖 SQL 支持的合成记录、Remotion 组件生成、注册表默认值和轨道系统。
---

# 合成管理

合成是动画工作室的核心单元。有两个相关的存储面：

- **SQL 合成记录**在 `compositions` 表中，由 `save-composition`、`update-composition`、`get-composition` 和 `list-compositions` 等 actions 管理。
- **代码支持的 Remotion 默认值**在 `app/remotion/registry.ts` 加上 `app/remotion/compositions/` 中的组件文件。这些是附带的示例和默认轨道定义。

使用 action 面处理应用数据。仅在创建或更改代码支持的 Remotion 默认值时编辑组件和注册表文件。

## SQL 支持的合成

使用 `save-composition` 创建或更新合成记录：

```bash
pnpm action save-composition --id "my-comp" --title "My Composition" --type custom --data '{"tracks":[]}'
```

当用户想要保存的合成条目、元数据更改或 JSON 合成数据时使用此操作。该 action 处理 upsert 行为和共享感知的访问检查。

## 注册表默认值

`app/remotion/registry.ts` 包含模板附带的默认 `CompositionEntry[]`。每个条目：

```typescript
type CompositionEntry = {
  id: string; // URL slug: "logo-reveal" -> /c/logo-reveal
  title: string;
  description: string;
  component: React.FC<any>;
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
  defaultProps: Record<string, any>;
  tracks: AnimationTrack[];
};
```

`defaultProps` 在 `PropsEditor` 中显示为可编辑字段。不要在 `defaultProps` 中包含 `tracks`；轨道单独传递。

## 添加代码支持的合成

对于新的 Remotion 组件：

1. 创建 `app/remotion/compositions/MyComp.tsx`。
2. 从 `app/remotion/compositions/index.ts` 导出。
3. 在 `app/remotion/registry.ts` 中添加 `CompositionEntry`。
4. 用有意义的 ID、标签、帧范围和 `animatedProps` 定义 `tracks`。
5. 运行 `pnpm typecheck` 和 `pnpm action validate-compositions`。

对于样板组件生成，使用：

```bash
pnpm action generate-animated-component --name MyComp --elements Button,Card
```

这生成组件文件。它不替代审查轨道、注册表元数据和导出符号的需要。

## 组件模板

```tsx
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { AnimationTrack } from "@/types";
import { trackProgress, getPropValue, findTrack } from "../trackAnimation";

const FALLBACK_TRACKS: AnimationTrack[] = [
  {
    id: "mc-intro",
    label: "Intro",
    startFrame: 0,
    endFrame: 30,
    easing: "spring",
    animatedProps: [{ property: "opacity", from: "0", to: "1", unit: "" }],
  },
];

export const MyComp: React.FC<{ tracks?: AnimationTrack[] }> = ({
  tracks = FALLBACK_TRACKS,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const introTrack = findTrack(tracks, "mc-intro", FALLBACK_TRACKS[0]);
  const p = trackProgress(frame, fps, introTrack);
  const opacity = getPropValue(p, introTrack, "opacity", 0, 1);

  return (
    <AbsoluteFill>
      <div style={{ opacity }}>Content</div>
    </AbsoluteFill>
  );
};
```

## 关键规则

- 每个动画必须注册为轨道；避免硬编码帧检查。
- 始终在组件文件中声明 `FALLBACK_TRACKS`。
- 使用 `findTrack()`、`trackProgress()` 和 `getPropValue()`。
- 注册表默认值不是运行时存储。用户编辑和覆盖根据工作流由 SQL/localStorage 支持。
- 使用 `save-composition` 处理 SQL 记录；创建和更新共享该 action。