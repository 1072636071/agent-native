# Pinpoint — 可视化反馈工具

你是一个拥有 Pinpoint 访问权限的代理，Pinpoint 是一个可视化反馈和标注工具。用户在网页上标注 UI 元素并将结构化反馈发送给你。

## 读取标注

Pin 以 JSON 文件形式存储在 `data/pins/{uuid}.json` 中：

```json
{
  "id": "uuid",
  "pageUrl": "/dashboard",
  "comment": "This button color is wrong",
  "element": {
    "tagName": "button",
    "selector": ".sidebar button.primary",
    "classNames": ["primary", "btn"]
  },
  "framework": {
    "framework": "react",
    "componentPath": "<Sidebar> <ActionButton>",
    "sourceFile": "src/components/Sidebar.tsx:42"
  },
  "status": { "state": "open", "changedBy": "user" }
}
```

**关键字段：**
- `sourceFile` — 需要编辑的确切文件和行号
- `componentPath` — React/Vue 组件层级
- `selector` — DOM 元素的 CSS 选择器
- `comment` — 用户想要更改的内容

## Actions

使用 `pnpm action <name>` 运行：

| Action | 用途 | 关键参数 |
|--------|------|----------|
| `get-pins` | 列出 pin | `--pageUrl`、`--status` |
| `create-pin` | 创建一个 pin | `--pageUrl`、`--selector`、`--comment` |
| `resolve-pin` | 标记为已解决 | `--id`、`--message` |
| `update-pin` | 更新一个 pin | `--id`、`--comment`、`--status` |
| `delete-pin` | 删除一个 pin | `--id` |
| `list-sessions` | 列出有 pin 的页面 | (无) |

## 工作流

1. 用户在浏览器中标注元素
2. 读取 pin：`pnpm action get-pins --status open`
3. 使用 `sourceFile` 定位代码并进行请求的更改
4. 标记为已解决：`pnpm action resolve-pin --id <uuid>`

## 提示

- 始终先检查 `sourceFile` — 它直接指向需要编辑的代码
- 使用 `get-pins --status open` 仅查看未解决的 pin
- 修复后解决 pin，以便用户获得视觉确认
- `componentPath` 帮助你在 `sourceFile` 不可用时理解组件层级
- 同一页面上的多个 pin 通常相互关联 — 在开始修复前全部读取

## 将 Pinpoint 添加到新应用

如果仓库尚未设置 Pinpoint：

1. `pnpm add @agent-native/pinpoint`
2. `npx @agent-native/pinpoint init` — 将脚本和技能复制到你的项目
3. 在根 React 组件中添加 `<Pinpoint />` 组件：
   ```tsx
   import { Pinpoint } from "@agent-native/pinpoint/react";
   <Pinpoint author="User" endpoint="/api/pins" autoSubmit />
   ```
4. 在 Express 设置中添加服务端中间件：
   ```ts
   import { pagePinRoutes } from "@agent-native/pinpoint/server";
   app.use("/api/pins", pagePinRoutes());
   ```