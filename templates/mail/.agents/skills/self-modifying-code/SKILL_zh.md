---
name: self-modifying-code
description: >-
  智能体如何修改应用自身的源代码。在智能体需要编辑组件、路由、样式或脚本时，
  在为智能体可编辑性设计 UI 时，或在决定智能体应该和不应该修改什么时使用。
metadata:
  internal: true
---

# 自修改代码

## 规则

智能体可以编辑应用自身的源代码 — 组件、路由、样式、脚本。这是一个功能，不是一个 bug。在设计你的应用时就应预期这一点。

## 原因

Agent-native 应用不仅仅是智能体可以_使用_的应用 — 它是智能体可以_改变_的应用。智能体可以修复 bug、添加功能、调整样式和重构代码。这使智能体成为真正的协作者，而不仅仅是操作者。

## 修改分类

并非所有修改都是等同的。使用此分类来决定需要何种程度的谨慎：

| 层级          | 内容                   | 示例                                         | 修改后                           |
| ------------- | ---------------------- | -------------------------------------------- | --------------------------------- |
| 1: 数据       | `data/` 中的文件       | JSON 状态、生成内容、markdown                | 无需操作 — 这些是常规操作        |
| 2: 源代码     | 应用代码               | 组件、路由、样式、脚本                       | 运行 `pnpm typecheck && pnpm lint` |
| 3: 配置       | 项目配置               | `package.json`、`tsconfig.json`、`vite.config.*` | 首先请求明确批准           |
| 4: 禁区       | 密钥和框架             | `.env`、`@agent-native/core` 内部            | 绝不修改这些                      |

## Git 检查点模式

在修改源代码（层级 2+）之前，创建回滚点：

1. 提交或暂存当前状态
2. 进行编辑
3. 运行 `pnpm typecheck && pnpm lint`
4. 如果验证失败 → 使用 `git checkout -- <file>` 回滚
5. 如果验证通过 → 继续

这确保智能体可以在不破坏应用的情况下进行实验。

## 为智能体可编辑性设计

使你的应用易于让智能体理解和修改：

**通过 `data-*` 属性暴露 UI 状态**，以便智能体知道选择了什么：

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

**使用配置驱动的渲染** — 将视觉决策（颜色、布局、尺寸）提取到 `data/` 中的 JSON 配置文件。智能体可以修改配置（层级 1）而非组件源代码（层级 2）。

## 不应该做的

- 不要修改 `.env` 文件或包含密钥的文件
- 不要修改 `@agent-native/core` 包内部
- 不要修改 `.agents/skills/` 或 `AGENTS.md`，除非明确要求
- 编辑源代码后不要跳过类型检查/lint 步骤
- 不要在没有 git 检查点可回滚的情况下进行源代码更改

## 相关技能

- **storing-data** — 层级 1 修改（数据文件）是最安全且最常见的
- **actions** — 智能体可以创建或修改 action 以添加新功能
- **delegate-to-agent** — 自修改请求通过智能体聊天传入
- **real-time-sync** — 数据库写入触发变更事件以更新 UI