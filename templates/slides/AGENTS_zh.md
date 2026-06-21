# Slides — 代理指南

Slides 是一个 agent-native 演示文稿编辑器。代理通过 actions 和共享 SQL 状态来创建、编辑、导入、导出、样式化、分享和导航演示文稿。

详细的演示文稿、幻灯片编辑、图片、设计系统和导出工作流位于 `.agents/skills/` 中。

## 核心规则

- 切勿硬编码 API 密钥、令牌、webhook URL、签名密钥、私有 Builder/内部数据、客户数据或看起来像凭据的字面量。使用 secrets/OAuth/运行时配置，在示例中使用明显的占位符。
- 使用 actions 来处理演示文稿生命周期、幻灯片编辑、导入、导出、图片、设计系统和分享。不要直接写入 deck/slide 行。
- 在开发中，使用 `pnpm action <name>` 调用 actions；在生产中，使用原生工具。如果参数不清楚，请阅读 action schema。
- 当活跃的演示文稿、选定的幻灯片或当前布局不清楚时，在编辑前使用 `view-screen`。
- 保留演示文稿结构和视觉一致性。除非被要求，否则优先进行聚焦的幻灯片编辑，而不是重新生成整个演示文稿。
- 遵循链接的设计系统令牌和自定义指令。
- 对于原始 Figma `.fig` 上传，调用 `import-file --format fig`，然后从返回的 `designSystem` 和 `customInstructions` 创建设计系统。
- 将导入/导出 actions 视为快捷方式，而非能力限制。当确切的 Google Drive 端点、文件元数据字段、导出格式、分页模式或 API 版本很重要时，使用 `provider-api-catalog`、`provider-api-docs` 和 `provider-api-request` 访问真实的提供者 API。Slides 从用户连接的 Google Docs OAuth 账户解析 Google Drive 认证。对于大型扫描，使用 `stageAs` 暂存结果，并使用 `query-staged-dataset` 分析它们。
- 仅当演示文稿确实需要图片时才使用图片生成和图片选择 actions；在可用时保留引用/资产来源。
- 使用框架分享 actions 来处理演示文稿可见性和授权。

## 持久化模型

演示文稿存储为 `decks.data` 列中的单个 JSON blob。所有写入都通过持有每个演示文稿锁的服务器端读-修改-写 actions 进行，因此并发写入者（人类 + 代理，两个人类）操作不同的幻灯片时永远不会覆盖彼此的工作。

**代理 actions**（`update-slide`、`add-slide`）：继续使用它们专用的细粒度 actions — 它们共享相同的进程内演示文稿锁。

**浏览器编辑器**现在调用 `patch-deck` 而不是完整的 PUT。如果你正在扩展编辑器的保存路径，请通过 `DeckContext.tsx` 中的 `enqueueDeckOp` 排队一个细粒度操作（`patch-slide`、`delete-slide`、`reorder-slides`、`add-slide` 或 `patch-deck-fields`）— 不要添加新的完整演示文稿 PUT。

## 应用状态

- `navigation` 暴露当前的演示文稿、幻灯片、选择和编辑器视图。
- `navigate` 将 UI 移动到演示文稿、幻灯片、导入、导出和设置。
- 使用应用 actions 获取完整的演示文稿/幻灯片数据，而不是依赖环境上下文。

## 技能

在进行更深入的工作之前阅读相关技能：

- `create-deck` 用于新演示文稿和大纲到幻灯片的流程。
- `slide-editing` 用于有针对性的幻灯片更改。
- `deck-management` 用于组织、分享、导入/导出和元数据。
- `slide-images` 和 `image-generation-via-a2a` 用于图片工作。
- `design-systems`、`frontend-design`、`shadcn-ui` 和 `actions` 按需使用。