# 无缝注册表-本地存储同步系统

## ✅ 已实现功能

### 1. **可视化保存按钮状态**

**🟢 绿色保存按钮** = 你有未保存的更改

- localStorage 中有与注册表不同的覆盖值
- 点击以将更改同步到注册表
- 显示提示："Save current settings as default"

**⚪ 灰色保存按钮** = 一切已同步

- 没有 localStorage 覆盖值
- 注册表和工作状态完全一致
- 显示提示："All changes saved to registry"

**实现**：`useUnsavedChanges()` 钩子检测 localStorage 的存在

### 2. **AI 生成后自动保存**

当 AI 创建或修改合成时：

1. AI 完成（触发 `builder.agentChat.chatRunning` 事件，`isRunning: false`）
2. 系统等待 1 秒让 localStorage 稳定
3. **自动保存到注册表**（静默模式，无提示）
4. 清除 localStorage
5. 使用干净的注册表默认值重新加载页面
6. 🟢 **保存按钮变灰**（一切已同步！）

**流程**：

```
用户要求 AI 更改合成
  ↓
AI 进行更改（自动保存到 localStorage）
  ↓
AI 完成（事件触发）
  ↓
系统自动保存到注册表（静默）
  ↓
localStorage 已清除
  ↓
页面重新加载
  ↓
✅ 注册表和 localStorage 完美同步！
```

### 3. **橙色指示器 + 重置按钮**

当有 localStorage 覆盖值时仍会显示，但：

- 保存后正确消失
- 与保存按钮颜色完美同步
- 提供一键重置

## 🎯 完整用户体验

### 场景 1：手动编辑

```
1. 用户编辑合成
   🟡 出现橙色指示器
   🟢 保存按钮变绿

2. 用户点击保存
   ✅ 确认对话框
   ✅ 保存到注册表
   ✅ 清除 localStorage
   ✅ 重新加载页面

3. 重新加载后：
   ⚪ 无橙色指示器
   ⚪ 灰色保存按钮
   ✅ 完美同步！
```

### 场景 2：AI 生成

```
1. 用户要求 AI 创建合成
   🤖 AI 生成代码
   🟡 更改自动保存到 localStorage
   🟢 保存按钮绿色

2. AI 完成
   🤖 自动保存触发（静默）
   ✅ 保存到注册表
   ✅ 清除 localStorage
   ✅ 重新加载页面

3. 重新加载后：
   ⚪ 无橙色指示器
   ⚪ 灰色保存按钮
   ✅ 自动完美同步！
```

### 场景 3：版本升级

```
开发者向注册表添加关键帧：

1. 递增版本号：2
2. 用户加载合成
   🔄 自动检测版本不匹配
   🔄 清除过期的 localStorage
   ✅ 加载新的注册表默认值
   ⚪ 灰色保存按钮（已同步）
```

## 🛠️ 技术细节

### 修改的文件：

**`app/hooks/useUnsavedChanges.ts`**（新增）

- 检测 localStorage 存在的钩子
- 存在未保存更改时返回 `true`
- 存储变更时响应式更新

**`app/pages/CompositionView.tsx`**

- 使用 `useUnsavedChanges()` 钩子
- 保存按钮样式：`hasUnsavedChanges ? green : grey`
- 将保存重构为 `performSave(silent)` 函数
- 监听 `videos.auto-save` 事件
- AI 生成后静默自动保存

**`app/components/NewCompositionPopover.tsx`**

- 监听 `builder.agentChat.chatRunning` 事件
- AI 完成时派发 `videos.auto-save`
- 等待 1 秒让 localStorage 稳定

**`app/contexts/TimelineContext.tsx`**

- 版本跟踪系统
- 智能关键帧合并（localStorage 为空时使用注册表）
- 版本不匹配时自动清除过期数据
- 全面的日志记录

**`app/remotion/registry.ts`**

- 为 `CompositionEntry` 添加 `version?` 字段
- 记录关键帧同步模式
- UI Showcase 使用 `version: 3`

### 可用的控制台命令：

```javascript
// 重置当前合成
resetCurrent();

// 仅重置轨道/关键帧
resetTracks("composition-id");

// 重置所有内容
resetCompositionSettings("composition-id");
```

## 📊 状态机

```
注册表（事实来源）
    ↓
localStorage（工作副本）
    ↓（用户编辑）
localStorage（已修改）
    🟢 绿色保存 + 🟡 橙色指示器
    ↓（点击保存 或 AI 完成）
注册表（已更新）
    ↓（localStorage 已清除）
    ⚪ 灰色保存 + 无指示器
```

## 🎨 视觉指示器一览

| 状态       | 保存按钮  | 橙色指示器   | 含义                      |
| ---------- | --------- | ------------ | ------------------------- |
| 已同步     | 灰色 ⚪   | 隐藏         | 注册表 = localStorage     |
| 未保存     | 绿色 🟢   | 可见 🟡      | localStorage 有更改        |
| 保存后     | 灰色 ⚪   | 隐藏         | 已自动同步！               |
| AI 操作后  | 灰色 ⚪   | 隐藏         | 已自动同步！               |

## 🚀 优势

1. **无困惑** — 视觉状态让你一目了然是否已同步
2. **无需手动操作** — AI 更改自动保存到注册表
3. **无过期数据** — 版本升级自动清除 localStorage
4. **不丢失工作** — localStorage 在会话期间仍保留编辑
5. **一键修复** — 出问题时使用重置按钮

## 🎯 最佳实践

**开发者**：

- 向现有合成添加关键帧时递增 `version`
- 在描述中记录破坏性更改
- 生成新合成后测试自动保存流程

**用户**：

- 🟢 绿色按钮 = 点击保存你的工作
- ⚪ 灰色按钮 = 一切已同步，无需操作
- 🟡 橙色徽章 = 提醒你有未保存的更改
- AI 更改会自动保存 — 无需手动保存！

---

**结果**：注册表和 localStorage 保持完美同步，无需任何手动干预！🎉