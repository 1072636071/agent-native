---
name: transparent-videos
description: 在 Remotion 中渲染透明视频
metadata:
  tags: transparent, alpha, codec, vp9, prores, webm
---

# 渲染透明视频

## 透明 ProRes（用于视频编辑软件）

```bash
npx remotion render --image-format=png --pixel-format=yuva444p10le --codec=prores --prores-profile=4444 MyComp out.mov
```

## 透明 WebM（用于浏览器）

```bash
npx remotion render --image-format=png --pixel-format=yuva420p --codec=vp9 MyComp out.webm
```

## 通过 calculateMetadata 设置默认值

```tsx
const calculateMetadata: CalculateMetadataFunction<Props> = async ({
  props,
}) => {
  return {
    defaultCodec: "prores",
    defaultVideoImageFormat: "png",
    defaultPixelFormat: "yuva444p10le",
    defaultProResProfile: "4444",
  };
};
```