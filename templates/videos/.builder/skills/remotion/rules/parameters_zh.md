---
name: parameters
description: 通过添加 Zod schema 使视频参数化
metadata:
  tags: parameters, zod, schema
---

要使视频参数化，可以为合成添加 Zod schema。

首先，必须安装 `zod` — 必须是 `3.22.3` 版本。

```bash
pnpm i zod@3.22.3
```

然后在组件旁边定义 Zod schema：

```tsx
import { z } from "zod";

export const MyCompositionSchema = z.object({
  title: z.string(),
});

const MyComponent: React.FC<z.infer<typeof MyCompositionSchema>> = (props) => {
  return <h1>{props.title}</h1>;
};
```

在根文件中，将 schema 传递给合成：

```tsx
<Composition
  id="MyComposition"
  component={MyComponent}
  durationInFrames={100}
  fps={30}
  width={1080}
  height={1080}
  defaultProps={{ title: "Hello World" }}
  schema={MyCompositionSchema}
/>
```

## 颜色选择器

对于颜色选择器，使用 `@remotion/zod-types` 中的 `zColor()`：

```bash
pnpm exec remotion add @remotion/zod-types
```

```tsx
import { zColor } from "@remotion/zod-types";

export const MyCompositionSchema = z.object({
  color: zColor(),
});
```