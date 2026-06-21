---
name: videos
description: 在 Remotion 中嵌入视频 - 裁剪、音量、速度、循环、音调
metadata:
  tags: video, media, trim, volume, speed, loop, pitch
---

# 在 Remotion 中使用视频

## 前提条件

需要安装 @remotion/media 包：

```bash
pnpm exec remotion add @remotion/media
```

## 基本用法

```tsx
import { Video } from "@remotion/media";
import { staticFile } from "remotion";

export const MyComposition = () => {
  return <Video src={staticFile("video.mp4")} />;
};
```

## 裁剪

```tsx
const { fps } = useVideoConfig();
<Video
  src={staticFile("video.mp4")}
  trimBefore={2 * fps}
  trimAfter={10 * fps}
/>;
```

## 延迟

```tsx
<Sequence from={1 * fps}>
  <Video src={staticFile("video.mp4")} />
</Sequence>
```

## 音量、速度、循环、音调

- `volume={0.5}` 或 `volume={(f) => interpolate(f, [0, fps], [0, 1])}`
- `playbackRate={2}` 用于 2 倍速
- `loop` 用于循环
- `toneFrequency={1.5}` 用于更高音调（仅服务端）
- `muted` 静音