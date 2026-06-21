# Videos — Agent 指南

Videos 是一个 agent-native 动画/合成工作室。Agent 通过 actions 和 SQL 支持的应用状态来创建和编辑合成、时间线、动画轨道、设计系统样式、文件夹、导出和共享。

保持本文件简洁。详细的动画、合成和实现规则位于 `.agents/skills/` 中。

## 核心规则

- 绝不硬编码 API 密钥、令牌、Webhook URL、签名密钥、私有 Builder/内部数据、客户数据或凭据式字面量。使用 secrets/OAuth/运行时配置，示例中使用明显的占位符。
- 使用 actions 处理合成生命周期、文件、轨道、文件夹、设计系统、导出和共享。不要直接修改合成表。
- 开发环境中，使用 `pnpm action <name>` 调用 actions；生产环境中，调用原生工具。参数不明确时阅读 action schema。
- 如果活跃的合成/场景/时间线不明确，在编辑特定合成前使用 `view-screen`。
- 对于关联的设计系统，在生成视觉效果前获取并遵循令牌和自定义指令。
- 将时间线数据视为事实来源。在轨道元数据中记录动画属性，使用既定的轨道辅助函数而非硬编码的动画值。
- 保持生成的展示动画精良：有目的的运动、已注册的交互元素、自然的光标路径和响应式构图。
- 合成默认为私有。使用框架共享 actions 控制可见性和共享授权。
- 源代码变更仅使用 TypeScript。使用现有的 Remotion/React 模式。

## 应用状态

- `navigation` 描述当前视图、合成 ID、文件夹、选中元素和播放/编辑器状态。
- `navigate` 移动 UI 并被客户端消费。
- 使用 app actions 或 `view-screen` 获取刷新后的时间线/编辑器快照。

## 技能

深入工作前阅读相关技能：

- `composition-management` 用于创建、编辑、文件夹、导出和共享。
- `animation-tracks` 用于轨道 schema、表达式、时间线行为和动画属性元数据。
- `frontend-design` 和 `shadcn-ui` 用于 UI 变更。
- `actions`、`delegate-to-agent`、`security` 和 `self-modifying-code` 用于框架模式。