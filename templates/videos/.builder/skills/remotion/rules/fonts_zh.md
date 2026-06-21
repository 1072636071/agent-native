---
name: fonts
description: 在 Remotion 中加载 Google 字体和本地字体
metadata:
  tags: fonts, google-fonts, typography, text
---

# 在 Remotion 中使用字体

## 使用 @remotion/google-fonts 的 Google 字体

安装：`pnpm exec remotion add @remotion/google-fonts`

```tsx
import { loadFont } from "@remotion/google-fonts/Lobster";

const { fontFamily } = loadFont();

export const MyComposition = () => {
  return <div style={{ fontFamily }}>Hello World</div>;
};
```

指定字重和子集：

```tsx
import { loadFont } from "@remotion/google-fonts/Roboto";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "700"],
  subsets: ["latin"],
});
```

## 使用 @remotion/fonts 的本地字体

安装：`pnpm exec remotion add @remotion/fonts`

```tsx
import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

await loadFont({
  family: "MyFont",
  url: staticFile("MyFont-Regular.woff2"),
});
```