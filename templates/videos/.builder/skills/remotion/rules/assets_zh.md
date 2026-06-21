---
name: assets
description: 在 Remotion 中导入图片、视频、音频和字体
metadata:
  tags: assets, staticFile, images, fonts, public
---

# 在 Remotion 中导入资源

## public 文件夹

将资源放在项目根目录的 `public/` 文件夹中。

## 使用 staticFile()

你必须使用 `staticFile()` 来引用 `public/` 文件夹中的文件：

```tsx
import { Img, staticFile } from "remotion";

export const MyComposition = () => {
  return <Img src={staticFile("logo.png")} />;
};
```

## 与组件一起使用

**图片：** `<Img src={staticFile('photo.png')} />`
**视频：** `<Video src={staticFile('clip.mp4')} />`（来自 `@remotion/media`）
**音频：** `<Audio src={staticFile('music.mp3')} />`（来自 `@remotion/media`）

## 远程 URL

远程 URL 可以直接使用，无需 `staticFile()`：

```tsx
<Img src="https://example.com/image.png" />
```

## 重要说明

- Remotion 组件（`<Img>`、`<Video>`、`<Audio>`）确保资源在渲染前完全加载
- 文件名中的特殊字符会自动编码