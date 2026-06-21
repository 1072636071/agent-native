---
name: extension-points
description: >-
  扩展如何通过命名的 UI 槽位在其他应用中渲染为小部件——框架的 VS Code
  风格扩展系统。当用户要求向应用界面添加自定义小部件（如"给我的邮件
  联系人侧边栏添加便签小部件"）、在模板中连接 ExtensionSlot 或将
  扩展标记为可安装到槽位时使用。
metadata:
  internal: true
---

# 扩展点

> **术语说明。** 本文档中的"扩展"是框架的沙箱化 Alpine.js 迷你应用原语
> （见 `extensions` skill）。它们不是 LLM "工具"（函数调用）。槽位系统表
> 仍然物理命名为 `tool_slots` 和 `tool_slot_installs` 以保持向后兼容——
> 见本文档底部的表格和 `extensions` skill 中的"Database & API names"部分。

## 心智模型

**槽位**是应用中命名的 React 形状的洞。**扩展**是选择填充这些洞的小部件。
框架通过字符串 ID 匹配它们。

三个原语：

| 原语                  | 是什么                                                                                          |
| --------------------- | ----------------------------------------------------------------------------------------------- |
| **Slot**              | 放入应用 JSX 中的 `<ExtensionSlot id="..." context={...} />`                                     |
| **Slot target**       | 一行表示"扩展 X 可以在槽位 Y 中渲染"——`tool_slots` 表（Drizzle：`extensionSlots`）              |
| **Slot install**      | 一行表示"用户 U 想在槽位 Y 中安装扩展 X"——`tool_slot_installs`（Drizzle：`extensionSlotInstalls`） |

当 `<ExtensionSlot>` 渲染时，它查询用户的安装并为每个安装挂载一个
`<EmbeddedTool>`（一个小的自动调整大小的 iframe），通过 postMessage 将
槽位的上下文推送到每个扩展中。（组件仍然以 `EmbeddedTool` 导出以保持向后兼容。）

## 槽位 ID 约定

`<app>.<area>.<position>`——三个点分隔的小写 kebab 段。

- `mail.contact-sidebar.bottom`
- `mail.thread-toolbar.actions`
- `clips.right-panel.tabs`
- `calendar.event-detail.bottom`

稳定的字符串。重命名槽位是数据迁移——与重命名路由相同。

## 如何编写填充槽位的扩展

1. **创建扩展**，使用 `create-extension`。HTML 可以读取 `window.slotContext`
   获取宿主的上下文（联系人邮箱、录制 ID 等）并通过 `window.onSlotContext(fn)` 订阅变更。

   ```html
   <div
     x-data="{ contact: null }"
     x-init="contact = window.slotContext; window.onSlotContext(c => contact = c)"
   >
     <template x-if="contact">
       <div class="rounded-lg border p-4 m-4">
         <p class="text-sm">
           Notes for <span x-text="contact.contactEmail"></span>
         </p>
       </div>
     </template>
   </div>
   ```

2. **声明槽位目标**，使用 `add-extension-slot-target`：

   ```
   add-extension-slot-target { extensionId: "<id>", slotId: "mail.contact-sidebar.bottom" }
   ```

3. **为当前用户安装**，使用 `install-extension`：

   ```
   install-extension { extensionId: "<id>", slotId: "mail.contact-sidebar.bottom" }
   ```

槽位将在下次渲染时获取安装（通过轮询同步 ≤2s，action 的 UI 失效后立即）。

## 如何在应用中声明槽位

在你想要允许扩展的地方放置 `<ExtensionSlot>`：

```tsx
import { ExtensionSlot } from "@agent-native/core/client/extensions";

// 在你的组件中
<ExtensionSlot
  id="mail.contact-sidebar.bottom"
  context={{ contactEmail: contact.email, contactName: contact.name }}
  showEmptyAffordance
/>
```

> 遗留导入路径 `@agent-native/core/client/tools` 继续重新导出相同组件以保持与现有模板的向后兼容。

Props：

- `id`——槽位标识符。必须与扩展目标匹配。
- `context`——作为 `slotContext` 推送到每个嵌入扩展的对象。每当此 prop 变更时重新推送。
- `showEmptyAffordance`——为 true 时，在空状态下显示"+ 添加小部件"按钮。默认：false（槽位在为空时不渲染任何内容）。
- `className` / `toolClassName`——可选的样式钩子。（`toolClassName` prop 名称保留以保持向后兼容；它样式化嵌入扩展的 iframe 包装器。）

宿主不需要预先注册槽位——`<ExtensionSlot>` 就是声明。如果扩展目标了一个没有应用放置的槽位 ID，它只是不会在任何地方渲染（安装记录是无害的）。

## 上下文契约

每个槽位通过 `context` prop 发布它想要的任何形状。v1 中没有 schema 强制——扩展应对字段进行空值检查，并在期望的字段缺失时优雅地失败。

在 `<ExtensionSlot>` 旁边文档化上下文形状，以便扩展作者知道要读取什么。约定：在槽位 ID 的前缀部分包含文档，这样 agent 可以找到它（`mail.contact-sidebar.*` 槽位都发布 `{ contactEmail, contactName }`）。

## Agent action

| Action                       | 作用                                                            |
| ---------------------------- | --------------------------------------------------------------- |
| `add-extension-slot-target`  | 标记扩展可安装到槽位（扩展作者选择加入）                         |
| `install-extension`          | 为当前用户将扩展安装到槽位                                       |
| `uninstall-extension`        | 为当前用户从槽位移除扩展                                         |
| `list-extensions-for-slot`   | 列出给定槽位 ID 的可安装扩展                                     |
| `list-extension-slots`       | 列出扩展声明的槽位目标                                           |

当用户要求"在我的联系人下方添加 CRM 小部件"时的典型流程：

1. `list-extensions-for-slot { slotId: "mail.contact-sidebar.bottom" }`——
   查看已有的可安装项
2. 如果有合适的扩展：`install-extension`
3. 否则：`create-extension` → `add-extension-slot-target` →
   `install-extension`

## 生命周期

**挂载**——宿主调用槽位安装 API，为每个安装渲染一个 `<iframe>`。iframe URL 包含 `?slot=<slotId>`，这样运行时知道它是嵌入的（启用自动调整大小，抑制只在全页有意义的内容）。

**上下文推送**——宿主在 iframe 加载时立即发布 `agent-native-slot-context`，并在每次 prop 变更时再次发布。扩展通过 `window.slotContext` 同步读取当前值，并通过 `window.onSlotContext(fn)` 订阅实时更新。

**自动调整大小**——在槽位模式下，iframe 运行时测量其内容高度并向宿主发布 `agent-native-tool-resize`（postMessage 类型保留以保持向后兼容）。`<EmbeddedTool>` 相应设置 iframe 高度。使用 `ResizeObserver` 跟随内容变更。

**扩展 API**——嵌入的扩展拥有完整的辅助函数集：
`appAction`、`appFetch`、`dbQuery`、`dbExec`、`extensionFetch`、
`extensionData`（带有 `toolFetch` / `toolData` 遗留别名）。与全页扩展相同的认证上下文。

**卸载**——卸载删除安装行。轮询同步使 `slot-installs` 查询失效，宿主重新渲染时不包含该 iframe。

## 权限

- 安装需要对扩展的查看者访问权限。用户只能安装他们有权限访问的扩展。
- 声明槽位目标需要对扩展的编辑者访问权限。
- 槽位安装是每用户的——安装小部件只影响安装用户的视图。v1 中没有组织范围的"默认安装"。
- 槽位本身是未门控的。任何应用代码都可以在任何用户的视图中放置 `<ExtensionSlot>`；槽位的内容来自该用户的安装。

## 这不是什么

- **不是在槽位中渲染任意 React 的方式。** 槽位只渲染 Alpine.js iframe 扩展。与 `/extensions/:id` 相同的安全/认证/沙箱。
- **不是跨扩展消息传递。** 同一槽位中的两个扩展不能读取彼此的 `extensionData`。如果小部件需要协调，使用 action 或应用 SQL。
- **不是槽位清单。** 槽位目标存在于 `tool_slots` 表（Drizzle 导出 `extensionSlots`），不在扩展的 HTML 内容中。Agent 可以在不重写扩展的情况下重新定位它。
- **不是用于任意代码修改。** 如果用户想改变应用本身的行为（不是添加沙箱化小部件），改用 `self-modifying-code` skill。

## 交叉引用

- `extensions` skill——编写 Alpine.js 迷你应用（小部件的基底）
- `sharing` skill——访问权限如何从扩展共享流向槽位安装
- `context-awareness` skill——扩展如何读取用户正在查看的内容
- `actions` skill——`install-extension` 等如何自动挂载