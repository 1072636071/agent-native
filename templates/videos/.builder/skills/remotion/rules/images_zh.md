---
name: images
description: 在 Remotion 中使用 Img 组件嵌入图片
metadata:
  tags: images, img, staticFile, png, jpg, svg, webp
---

# 在 Remotion 中使用图片

始终使用 `remotion` 中的 `<Img>` 组件。不要使用原生 `<img>`、Next.js 的 `<Image>` 或 CSS `background-image`。

```tsx
import { Img, staticFile } from "remotion";

export const MyComposition = () => {
  return <Img src={staticFile("photo.png")} />;
};
```

## 远程图片

```tsx
<Img src="https://example.com/image.png" />
```

## 尺寸设置

```tsx
<Img
  src={staticFile("photo.png")}
  style={{ width: 500, height: 300, objectFit: "cover" }}
/>
```

## 获取图片尺寸

```tsx
import { getImageDimensions, staticFile } from "remotion";

const { width, height } = await getImageDimensions(staticFile("photo.png"));
```