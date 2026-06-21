# 关键帧同步防护指南

## 问题

当合成首次加载时，它会将轨道数据（包括 `keyframes: []`）保存到 `localStorage`。如果你后来向注册表添加了关键帧，localStorage 版本（带空关键帧）会覆盖注册表版本。

## 现有防护措施

### 1. **智能合并逻辑** ✅

`app/contexts/TimelineContext.tsx` 现在智能合并关键帧：

```typescript
// 如果 localStorage 有空关键帧但注册表有关键帧，使用注册表
const useRegistryKeyframes =
  (!storedProp.keyframes || storedProp.keyframes.length === 0) &&
  defProp.keyframes &&
  defProp.keyframes.length > 0;
```

**结果**：向注册表添加关键帧将在下次重新加载时自动生效。

### 2. **控制台验证警告** ✅

当注册表中定义了关键帧但时间线中未显示时，你会看到：

```
⚠️ Registry has keyframes but they're not showing in the timeline!
Composition: ui-showcase
Fix: Run in console: localStorage.removeItem('videos-tracks:ui-showcase'); location.reload();
```

### 3. **开发者重置工具** ✅

在浏览器控制台中可用：

```javascript
// 重置当前合成
resetCurrent();

// 仅重置特定合成的关键帧/轨道
resetTracks("ui-showcase");

// 重置所有内容（轨道、属性、设置）
resetCompositionSettings("ui-showcase");
```

**专业提示**：这些工具会自动加载并在 `window` 中可用。

### 4. **详细日志** ✅

当关键帧从注册表加载时，你会看到：

```
🔄 Using registry keyframes for "x" (9 keyframes from code)
```

这确认合并工作正常。

### 5. **全面文档** ✅

- 注册表文件（`app/remotion/registry.ts`）有详细的头部文档
- 重置工具（`app/utils/resetComposition.ts`）解释了用法
- 本指南！📖

## 最佳实践

### ✅ 应该做的：

- **创建新合成就定义关键帧**，从一开始就在注册表中定义关键帧
- **开发时使用 resetTracks()** 测试新关键帧
- **检查浏览器控制台** 查看验证警告
- **保存按钮保留关键帧** — 使用保存按钮将当前关键帧写入注册表

### ❌ 不应该做的：

- 不要手动编辑 localStorage（改用重置工具）
- 不要假设关键帧会无需重置就自动更新（下次全新加载时会，但现有 localStorage 需要清除）

## 快速修复

### "我添加了关键帧但看不到"

**选项 1**：控制台重置（即时）

```javascript
resetTracks("your-composition-id");
// 然后刷新页面
```

**选项 2**：手动清除 localStorage

```javascript
localStorage.removeItem("videos-tracks:your-composition-id");
location.reload();
```

**选项 3**：硬刷新

- 关闭所有打开应用的标签页
- 在新标签页/窗口中打开
- 首次加载时应自动同步

### "我想测试关键帧但不影响用户"

1. 开发时使用不同的合成 ID：

   ```typescript
   id: "ui-showcase-dev"; // 测试版本
   ```

2. 确定后，重命名回生产 ID：

   ```typescript
   id: "ui-showcase"; // 生产版本
   ```

3. 用户首次加载新 ID 时将获得新的关键帧

## 技术细节

### 合并优先级（从高到低）：

1. **用户创建的关键帧**（在时间线中手动添加）→ 始终保留
2. **注册表关键帧** → 当 localStorage 有空数组时使用
3. **空数组** → 仅当存储和注册表都为空时

### 关键帧同步时机：

- ✅ 新合成首次加载
- ✅ 通过重置工具清除 localStorage
- ✅ 当 localStorage 有空数组时添加注册表关键帧
- ❌ localStorage 已有空数组时的自动同步（使用重置）

### 跨标签页同步：

更改通过 `storage` 事件监听器在标签页之间自动同步。如果在一个标签页中重置，其他标签页将获取更改。

## 测试清单

向合成添加新关键帧时：

- [ ] 向注册表轨道定义添加关键帧
- [ ] 在浏览器控制台测试：`resetTracks('composition-id')`
- [ ] 验证关键帧出现在时间线中
- [ ] 播放合成测试动画
- [ ] 检查控制台是否有任何警告
- [ ] 如果更改了现有行为，在合成描述中记录

## 未来改进

可考虑的潜在增强：

1. **版本跟踪**：为注册表中的轨道添加版本号，版本变更时自动重置
2. **UI 指示器**：当注册表有比 localStorage 更新的关键帧时显示徽章
3. **自动迁移**：检测到关键帧不匹配时提示用户重置
4. **开发模式**：开发期间始终优先使用注册表而非 localStorage 的标志

---

**最后更新**：2026 年 3 月 2 日
**相关文件**：

- `app/contexts/TimelineContext.tsx`（合并逻辑）
- `app/utils/resetComposition.ts`（重置工具）
- `app/remotion/registry.ts`（合成定义）