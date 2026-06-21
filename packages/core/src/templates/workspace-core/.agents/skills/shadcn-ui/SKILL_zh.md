---
name: shadcn-ui
description: >-
  在添加、更新、调试、样式化或组合 shadcn/ui 组件、表单、对话框、菜单、图表、侧边栏、主题、注册表或任何有 components.json 文件的项目时使用。
source: https://ui.shadcn.com/docs/skills
metadata:
  internal: true
---

# shadcn/ui

此技能使 shadcn/ui 工作保持项目感知。组件是应用中的源文件，因此在添加、导入或重写它们之前，始终检查本地项目。

## 第一步

1. 从拥有 `components.json` 的应用根目录工作。
2. 需要当前项目上下文时运行 `pnpm dlx shadcn@latest info --json`：框架、Tailwind 版本、别名、图标库、已安装组件和解析路径。
3. 使用 `components.json` 或 `shadcn info` 中的实际别名；如果项目另有指定，不要假设 `@/components/ui`。
4. 在导入组件之前检查 `app/components/ui/` 或解析的 `ui` 路径。
5. 对于不熟悉的组件，运行 `pnpm dlx shadcn@latest docs <component>` 并在编码前阅读返回的文档或示例。

## 添加或更新组件

- 从应用根目录使用 `pnpm dlx shadcn@latest add <component>` 添加缺失的原语。
- 在覆盖现有组件之前，使用 `pnpm dlx shadcn@latest add <component> --dry-run` 和 `--diff` 检查变更。
- 添加注册表代码后，阅读生成的文件。在使用组件之前修复导入别名、图标导入、缺失的子组件和组合问题。
- 当 shadcn CLI 可以解析注册表项时，不要手动从 GitHub 获取原始组件文件。
- 如果用户要求添加第三方块但未命名注册表，询问使用哪个注册表而不是猜测。

## 组件组合

- 优先使用现有原语而不是自定义标记：`Alert` 用于标注、`Badge` 用于小状态标签、`Separator` 用于分隔符、`Skeleton` 用于占位符、`Table` 用于表格数据、`Card` 用于框架内容。
- 适当时使用完整的卡片结构：`CardHeader`、`CardTitle`、`CardDescription`、`CardContent` 和 `CardFooter`。
- Dialog、Sheet、Drawer 和 AlertDialog 内容必须包含可访问的标题。仅当可见 UI 已经传达标题时才使用视觉隐藏标题。
- 将项目放入其组组件中：`SelectItem` 在 `SelectGroup` 中、`DropdownMenuItem` 在 `DropdownMenuGroup` 中、`CommandItem` 在 `CommandGroup` 中，以及等效的菜单组。
- `TabsTrigger` 属于 `TabsList` 内部。
- `Avatar` 始终需要 `AvatarFallback`。
- 按钮没有魔法加载 props。使用 `disabled`、`Spinner` 和清晰文本组合加载状态。

## 表单和输入

- 使用应用的 shadcn 表单原语而不是原始 div 堆栈。
- 如果 `Field`、`FieldGroup`、`FieldSet` 或 `InputGroup` 已安装或值得添加，使用它们进行表单布局、分组字段和输入附加组件。
- 不要使用绝对定位将按钮放在输入内部。可用时使用 `InputGroup` 和 `InputGroupAddon`。
- 使用 `ToggleGroup` 用于小选项集、`RadioGroup` 用于多选一、`Checkbox` 用于多选、`Switch` 用于设置切换、`Select` 或 `Combobox` 用于预定义选项、`Slider` 或数字输入用于数值。
- 验证必须可访问：将视觉无效状态与 `aria-invalid` 配对，并将描述/错误连接到控件。

## 样式和主题

- 使用语义令牌（`bg-background`、`text-foreground`、`text-muted-foreground`、`bg-primary`、`border-border`、`text-destructive`）而不是原始颜色用于可复用的应用 UI。
- 在自定义类之前优先使用内置变体和尺寸。
- `className` 主要用于布局和间距；避免覆盖组件颜色和排版，除非有意扩展组件。
- 使用 `gap-*` 而不是 `space-x-*` / `space-y-*`。
- 当宽度和高度相等时使用 `size-*`。
- 使用 `truncate` 进行单行截断。
- 使用 `cn()` 处理条件类。
- 除非你正在修复已验证的堆叠 Bug，否则不要为覆盖原语添加手动 `z-index`。
- 在 shadcn info 报告的现有 Tailwind CSS 文件中添加自定义颜色作为 CSS 变量。对于 Tailwind v4，使用 `@theme inline` 注册变量。

## 过渡和动效

shadcn 的内置组件动画是正确的抛光级别 — 保留它们。目标是快速、干净的 UI，不是无动效的 UI。匹配 shadcn 的动效词汇；不要剥离它，也不要堆砌装饰性自定义动画。

- **永远不要移除或覆盖 shadcn 组件的默认动画。** `data-[state=open]:animate-in`、`data-[state=closed]:animate-out`、`fade-in/out`、`zoom-in/out`、`slide-in-from-*`、手风琴高度、`tailwindcss-animate` 工具 — 这些是有原因的。保持原样。
- **自定义过渡在传达状态变更并匹配 shadcn 感觉时是可以的。** 重用相同的词汇：短持续时间（~120–200ms）、`ease-out`、仅 opacity/transform、以 `data-[state=...]` 为门控。好的和欢迎的示例：
  - 一个 portal 化的自定义弹出框/工具提示/面板，在 `data-[state=delayed-open]` / `data-[state=closed]` 上淡入 + 缩放/滑入，镜像 Radix 自己的内容动画。
  - 一个列表行或 toast，在挂载时淡入/滑入，在关闭时淡出。
  - 展开时的 V 形/插入符 `rotate`，图标按钮上微妙的 `opacity`/`color` 悬停，骨架闪烁，可折叠的进度/高度过渡。
  - 连续的、定义产品的动效，当它_就是_体验时（例如多阶段预订流的阶段过渡）— 可以，framer-motion 在那里是可接受的。
- **避免装饰性、引人注目或缓慢的动效：** 手工制作的 `duration-700` 英雄淡入、视差、普通内容上的弹跳/弹簧入场、动画渐变、长列表上的交错级联、任何延迟用户看到或操作内容的动效。如果动画让 UI 感觉更慢，删掉它。
- 经验法则：如果动效澄清了刚发生了什么并在远不到四分之一秒内结束，它是抛光；如果它是为了看起来令人印象深刻，它是臃肿。

## 图标

- Agent-Native 应用使用 `@tabler/icons-react`。不要因为注册表示例使用了 `lucide-react` 就添加它。
- 如果注册表代码导入了不同的图标包，在完成之前用 Tabler 等效项替换这些导入。
- 让 shadcn 组件通过其 CSS 调整图标大小。除非本地组件 API 要求，否则避免在按钮、菜单、警报和侧边栏内手动调整图标大小。

## Base 特定 API

在使用触发器组合 API 之前检查项目上下文：

- 基于 Radix 的组件使用 `asChild` 进行自定义触发器。
- Base UI 组件可能使用 `render`，有时使用 `nativeButton={false}`。

不要仅仅为了在触发器内放置 Button 或 Link 而将触发器包裹在额外的 div 中。

## 相关技能

- **frontend-design** — 产品 UX、视觉方向、响应式抛光和验证
- **actions** — Agent-Native 应用的数据获取和变更模式
- **security** — 用户数据、表单、外部输入和 action 安全