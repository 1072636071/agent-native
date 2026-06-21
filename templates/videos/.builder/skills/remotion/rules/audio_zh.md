---
name: audio
description: 在 Remotion 中使用音频和声音 - 导入、裁剪、音量、速度、音调
metadata:
  tags: audio, media, trim, volume, speed, loop, pitch, mute, sound, sfx
---

# 在 Remotion 中使用音频

## 前提条件

需要安装 @remotion/media 包：

```bash
pnpm exec remotion add @remotion/media
```

## 导入音频

```tsx
import { Audio } from "@remotion/media";
import { staticFile } from "remotion";

export const MyComposition = () => {
  return <Audio src={staticFile("audio.mp3")} />;
};
```

## 裁剪

```tsx
const { fps } = useVideoConfig();
<Audio
  src={staticFile("audio.mp3")}
  trimBefore={2 * fps}
  trimAfter={10 * fps}
/>;
```

## 音量

静态：`<Audio volume={0.5} />`

动态：

```tsx
<Audio
  volume={(f) =>
    interpolate(f, [0, 1 * fps], [0, 1], { extrapolateRight: "clamp" })
  }
/>
```

## 速度、循环、音调

- `playbackRate={2}` 用于 2 倍速
- `loop` 用于循环
- `toneFrequency={1.5}` 用于更高音调（仅服务端渲染）