---
name: self-modifying-code
description: >-
  代理如何修改应用自身的源代码。当代理需要编辑组件、路由、样式或脚本时，
  当设计 UI 以支持代理编辑时，或当决定代理应该和不应该修改什么时使用。
metadata:
  internal: true
---

# 自修改代码

## 规则

代理可以编辑应用自身的源代码 — 组件、路由、样式、脚本。这是一个功能，而不是 bug。在设计应用时请预期这一点。

## 原因

agent-native 应用不仅仅是代理可以_使用_的应用 — 它是代理可以_更改_的应用。代理可以修复 bug、添加功能、调整样式和重构代码。这使得代理成为真正的协作者，而不仅仅是操作者。

## 修改分类

并非所有修改都是相同的。使用此分类来决定需要什么级别的谨慎：

| 层级          | 内容                  | 示例                                         | 修改后                           |
| ------------- | --------------------- | -------------------------------------------- | --------------------------------- |
| 1: 数据       | `data/` 中的文件      | JSON 状态、生成的内容、markdown              | 无需操作 — 这些是常规操作       |
| 2: 源代码     | 应用代码              | 组件、路由、样式、脚本                       | 运行 `pnpm typecheck && pnpm lint` |
| 3: 配置       | 项目配置              | `package.json`、`tsconfig.json`、`vite.config.*` | 首先请求明确批准               |
| 4: 禁止修改   | 密钥和框架            | `.env`、`@agent-native/core` 内部实现        | 切勿修改这些                     |

## Git 检查点模式

在修改源代码（层级 2+）之前，创建回滚点：

1. 提交或暂存当前状态
2. 进行编辑
3. 运行 `pnpm typecheck && pnpm lint`
4. 如果验证失败 → 使用 `git checkout -- <file>` 恢复
5. 如果验证通过 → 继续

这确保代理可以在不破坏应用的情况下进行实验。

## 为代理可编辑性而设计

使你的应用易于让代理理解和修改：

**通过 `data-*` 属性暴露 UI 状态**，以便代理知道选择了什么：

```ts
const el = document.documentElement;
el.dataset.currentView = view;
el.dataset.selectedId = selectedItem?.id || "";
```

**通过 `window.__appState` 暴露更丰富的上下文** 用于复杂状态：

```ts
(window as any).__appState = {
  selectedId: id,
  currentLayout: layout,
  itemCount: items.length,
};
```

**使用配置驱动的渲染** — 将视觉决策（颜色、布局、尺寸）提取到 `data/` 中的 JSON 配置文件中。代理可以修改配置（层级 1）而不是组件源代码（层级 2）。

## 禁止事项

- 不要修改 `.env` 文件或包含密钥的文件
- 不要修改 `@agent-native/core` 包的内部实现
- 除非明确要求，否则不要修改 `.agents/skills/` 或 `AGENTS.md`
- 编辑源代码后不要跳过类型检查/lint 步骤
- 不要在没有 git 检查点可回滚的情况下进行源代码更改

## 相关技能

- **storing-data** — 层级 1 修改（数据文件）是最安全且最常见的
- **actions** — 代理可以创建或修改 actions 来添加新功能
- **delegate-to-agent** — 自修改请求通过代理聊天传入
- **real-time-sync** — 数据库写入触发变更事件以更新 UI