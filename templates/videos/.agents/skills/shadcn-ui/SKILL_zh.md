---
name: shadcn-ui
description: >-
  在添加、更新、调试、样式化或组合 shadcn/ui 组件、表单、对话框、菜单、图表、侧边栏、主题、注册表或任何带有 components.json 文件的项目时使用。
source: https://ui.shadcn.com/docs/skills
metadata:
  internal: true
---

# shadcn/ui

此技能使 shadcn/ui 工作具有项目感知能力。组件是应用中的源文件，因此在添加、导入或重写它们之前，始终先检查本地项目。

## 首要步骤

1. 从拥有 `components.json` 的应用根目录工作。
2. 需要当前项目上下文时运行 `pnpm dlx shadcn@latest info --json`：框架、Tailwind 版本、别名、图标库、已安装组件和解析路径。
3. 使用 `components.json` 或 `shadcn info` 中的实际别名；如果项目指定了其他路径，不要假设 `@/components/ui`。
4. 在导入组件前检查 `app/components/ui/` 或解析的 `ui` 路径。
5. 对于不熟悉的组件，运行 `pnpm dlx shadcn@latest docs <component>` 并在编码前阅读返回的文档或示例。

## 添加或更新组件

- 从应用根目录使用 `pnpm dlx shadcn@latest add <component>` 添加缺失的原语。
- 在覆盖现有组件前，使用 `pnpm dlx shadcn@latest add <component> --dry-run` 和 `--diff` 检查变更。
- 添加注册表代码后，阅读生成的文件。在使用组件前修复导入别名、图标导入、缺失的子组件和组合问题。
- 当 shadcn CLI 可以解析注册表项时，不要从 GitHub 手动获取原始组件文件。
- 如果用户要求添加第三方 block 但未指定注册表，询问使用哪个注册表而不是猜测。

## 组件组合

- 优先使用现有原语而非自定义标记：`Alert` 用于标注、`Badge` 用于小状态标签、`Separator` 用于分隔线、`Skeleton` 用于占位符、`Table` 用于表格数据、`Card` 用于框架内容。
- 适当时使用完整的卡片结构：`CardHeader`、`CardTitle`、`CardDescription`、`CardContent` 和 `CardFooter`。
- Dialog、Sheet、Drawer 和 AlertDialog 内容必须包含可访问的标题。仅当可见 UI 已传达标题时才使用视觉隐藏标题。
- 将项目放入其组组件中：`SelectItem` 放入 `SelectGroup`、`DropdownMenuItem` 放入 `DropdownMenuGroup`、`CommandItem` 放入 `CommandGroup` 及等效菜单组。
- `TabsTrigger` 属于 `TabsList` 内部。
- `Avatar` 始终需要 `AvatarFallback`。
- 按钮没有魔法加载属性。使用 `disabled`、`Spinner` 和清晰文本来组合加载状态。

## 表单和输入

- 使用应用的 shadcn 表单原语而非原始 div 堆叠。
- 如果 `Field`、`FieldGroup`、`FieldSet` 或 `InputGroup` 已安装或值得添加，将它们用于表单布局、分组字段和输入附加组件。
- 不要使用绝对定位将按钮放在输入框内。可用时使用 `InputGroup` 和 `InputGroupAddon`。
- 小选项集使用 `ToggleGroup`，单选多选一使用 `RadioGroup`，多选使用 `Checkbox`，设置开关使用 `Switch`，预定义选项使用 `Select` 或 `Combobox`，数值使用 `Slider` 或数字输入。
- 验证必须可访问：将视觉无效状态与 `aria-invalid` 配对，并将描述/错误连接到控件。

## 样式和主题

- 使用语义令牌（`bg-background`、`text-foreground`、`text-muted-foreground`、`bg-primary`、`border-border`、`text-destructive`）而非原始颜色用于可复用的应用 UI。
- 优先使用内置变体和尺寸而非自定义类。
- `className` 主要用于布局和间距；避免覆盖组件颜色和排版，除非有意扩展组件。
- 使用 `gap-*` 而非 `space-x-*` / `space-y-*`。
- 当宽度和高度相等时使用 `size-*`。
- 使用 `truncate` 进行单行截断。
- 使用 `cn()` 处理条件类。
- 除非修复已验证的堆叠 bug，否则不要为覆盖原语添加手动 `z-index`。
- 在 shadcn info 报告的现有 Tailwind CSS 文件中添加自定义颜色作为 CSS 变量。对于 Tailwind v4，使用 `@theme inline` 注册变量。

## 过渡和动效

shadcn 的内置组件动画是恰当的精致程度 — 保留它们。目标是快速、干净的 UI，而非无动效的界面。匹配 shadcn 的动效词汇；不要剥离它，也不要堆砌装饰性自定义动画。

- **绝不要移除或覆盖 shadcn 组件的默认动画。** `data-[state=open]:animate-in`、`data-[state=closed]:animate-out`、`fade-in/out`、`zoom-in/out`、`slide-in-from-*`、手风琴高度、`tailwindcss-animate` 工具 — 这些是有原因的。保持原样。
- **当自定义过渡传达状态变化并匹配 shadcn 的感觉时是可以的。** 复用相同的词汇：短持续时间（~120–200ms）、`ease-out`、仅 opacity/transform、基于 `data-[state=...]` 门控。好的且受欢迎的示例：
  - 一个 portaled 自定义 popover/tooltip/sheet，在 `data-[state=delayed-open]` / `data-[state=closed]` 上淡入+缩放/滑入，镜像 Radix 自己的内容动画。
  - 列表行或 toast 在挂载时淡入/滑入，在关闭时淡出。
  - 展开时的 chevron/caret `rotate`，图标按钮上的微妙 `opacity`/`color` 悬停，骨架微光，可折叠的进度/高度过渡。
  - 连续的、定义产品的动效，当它本身就是体验时（例如多阶段预订流程的阶段过渡）— 可以，framer-motion 在那里是可接受的。
- **避免装饰性、引人注目或缓慢的动效：** 手写的 `duration-700` hero 淡入、视差、普通内容上的弹跳/弹簧入场、动画渐变、长列表上的交错级联、任何延迟用户查看或操作内容的动效。如果动画让 UI 感觉更慢，就删掉它。
- 经验法则：如果动效阐明了刚发生的变化且在远不到四分之一秒内完成，它是润色；如果它只是为了让界面看起来令人印象深刻，那就是臃肿。

## 图标

- Agent-native 应用使用 `@tabler/icons-react`。不要因为注册表示例使用了 `lucide-react` 就添加它。
- 如果注册表代码导入了不同的图标包，在完成前用 Tabler 等效替换这些导入。
- 让 shadcn 组件通过其 CSS 调整图标大小。除非本地组件 API 要求，否则避免在按钮、菜单、警报和侧边栏中手动调整图标大小。

## Base 特定 API

在使用触发器组合 API 前检查项目上下文：

- 基于 Radix 的组件使用 `asChild` 作为自定义触发器。
- Base UI 组件可能使用 `render`，有时使用 `nativeButton={false}`。

不要仅仅为了在触发器内放置 Button 或 Link 而将触发器包裹在额外的 div 中。

## 相关技能

- **frontend-design** — 产品 UX、视觉方向、响应式润色和验证
- **actions** — agent-native 应用的数据获取和变更模式
- **security** — 用户数据、表单、外部输入和 action 安全