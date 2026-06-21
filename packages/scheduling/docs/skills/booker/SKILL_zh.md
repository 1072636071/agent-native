---
name: booker
description: 公共预约流程 — 状态机、动画和 URL/应用状态同步。
---

# Booker

## 阶段

1. **pick-date** — 月网格显示有可用性的日期
2. **pick-slot** — 所选日期的可用时段
3. **fill-form** — 参会者表单（姓名、邮箱、自定义字段）
4. **success** — 确认页，带添加到日历按钮

加上 **reschedule** 模式 — 从现有预约 uid 预填充。

## 动画

使用 motion（`motion/react`）的 `AnimatePresence` 和 `fadeInLeft` 变体。外部容器在各阶段间动画化其宽度：窄（仅日历）→ 较宽（日历 + 时段）→ 最宽（表单）。

## 时区 + 12/24 小时制

- 挂载时检测浏览器时区；让用户通过下拉菜单覆盖。
- 持久化选择到 localStorage 键 `scheduling.timezone`。
- 12/24 小时制切换靠近时段列；持久化到用户设置。

## URL + 应用状态同步

所选日期、时段、时区和时长会镜像到 URL 查询参数和 `application_state.booker-state`，因此：
- 页面刷新保留选择。
- 代理可以读取用户当前的选择。

## 复制链接功能

每个事件类型行都有一个"复制链接"按钮。点击时，写入剪贴板并使用 Sonner 显示 toast "已复制！"。在移动端 Safari 上也能工作。

## 无障碍

- 月网格是 ARIA `grid` + `gridcell`，支持方向键导航。
- 时段按钮可通过键盘聚焦，带 `aria-pressed`。
- 模态关闭时焦点返回到触发器。
- Toast 内容通过 `aria-live=polite` 朗读。

## 移动端

`< 768px`：垂直堆叠。日历全宽，时段列表在下方，表单以全屏抽屉滑入。