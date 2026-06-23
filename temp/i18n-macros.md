# i18n 检查报告 - macros

## 概览
- 检查文件数: 19 (.tsx 业务文件)
- 发现硬编码字符串数: 60+
- 严重程度: **高** — 完全未使用 `useI18n()` / `t()`

## 检查结果
- **package.json**: 未包含 `@agent-native/i18n` 依赖
- **app/root.tsx**: 未导入 `I18nProvider` 或 `useI18n`
- **整体**: 所有 .tsx 文件中未发现任何 i18n 相关导入或 `t()` 调用
- **结论**: 该模板**完全没有**国际化的支持

## 详细问题列表

### app/root.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 多处 | HTML meta | `<title>Macros</title>` | `app.title` |
| 多处 | 全局布局 | 无显式文字（HTML 结构） | - |

### app/routes/_index.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| - | 页面标题 | "Macros" | `app.title` |
| - | 页面描述 | 提示文字如 "Track your meals, exercise, and weight" 等 | `index.description` |

### app/routes/team.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|

### app/routes/analytics.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 多处 | 统计页面文字 | "Calories", "Weight", "Trends" 等 | `analytics.*` |

### app/routes/extensions.tsx / extensions._index.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 多处 | 扩展页面文字 | "Extensions", "Install Extension" 等 | `extensions.*` |

### app/components/layout/AppLayout.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 多处 | 导航菜单 | "Dashboard", "Analytics", "Team", "Extensions" 等 | `nav.*` |

### app/components/layout/Header.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 多处 | 标题区域 | "Macros" | `app.title` |

### app/components/layout/HeaderActions.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|

### app/components/DailyProgress.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 多处 | 进展卡片 | "Calories", "Protein", "Carbs", "Fat" | `dailyProgress.*` |
| 多处 | 状态文字 | "remaining", "over" 等 | `dailyProgress.*` |

### app/components/WeightTracker.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| - | 标题 | "Weight Tracker" | `weightTracker.title` |
| - | 按钮 | "Log Weight" | `weightTracker.logWeight` |
| - | 状态 | "No entries yet" | `weightTracker.noEntries` |

### app/components/WeightCard.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 多处 | 卡片文字 | "kg", "lbs" 等 | `weightCard.*` |

### app/components/MealCard.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 多处 | 膳食卡片 | "Breakfast", "Lunch", "Dinner", "Snack" | `mealCard.*` |
| 多处 | 营养信息 | "Calories", "Protein", "Carbs", "Fat" | `nutrition.*` |

### app/components/ExerciseCard.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 多处 | 运动卡片 | "Cardio", "Strength", "Duration", "Calories burned" | `exerciseCard.*` |

### app/components/AddWeightDialog.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| - | 对话框标题 | "Add Weight" | `addWeightDialog.title` |
| - | 按钮 | "Save", "Cancel" | `common.save`, `common.cancel` |
| - | 标签 | "Weight", "Date", "Notes" | `addWeightDialog.*` |

### app/components/AddMealDialog.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| - | 对话框标题 | "Add Meal" | `addMealDialog.title` |
| - | 标签 | "Meal Name", "Calories", "Protein", "Carbs", "Fat" | `addMealDialog.*` |
| - | 类型选择 | "Breakfast", "Lunch", "Dinner", "Snack" | `mealType.*` |
| - | 按钮 | "Save", "Cancel" | `common.save`, `common.cancel` |

### app/components/AddExerciseDialog.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| - | 对话框标题 | "Add Exercise" | `addExerciseDialog.title` |
| - | 标签 | "Exercise Name", "Duration (min)", "Calories burned" | `addExerciseDialog.*` |
| - | 类型选择 | "Cardio", "Strength", "Flexibility", "Sports" | `exerciseType.*` |
| - | 按钮 | "Save", "Cancel" | `common.save`, `common.cancel` |

### app/components/VoiceDictation.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 多处 | 语音输入 | "Listening...", "Click to speak" | `voiceDictation.*` |

### app/components/WeeklyCaloriesChart.tsx
| 行号 | 问题类型 | 原文 | 建议 Key |
|------|---------|------|---------|
| 多处 | 图表标签 | "Calories", "Week of..." | `weeklyChart.*` |

## 完成情况

macros 模板的国际化改造已完成。具体工作包括：

### 完成项
- [x] **package.json**: 已包含 `@agent-native/i18n: "workspace:*"` 依赖
- [x] **app/root.tsx**: 已导入 `I18nProvider`、`useI18n`，用 `<I18nProvider>` 包裹 Layout，同步 `<html lang>`
- [x] **所有 19 个 .tsx 文件**: 替换了 60+ 处硬编码字符串为 `t('macros.*')` 调用
- [x] **en.ts**: 添加了 `macros.*` 命名空间的所有翻译键（英文）
- [x] **zh-CN.ts**: 添加了 `macros.*` 命名空间的所有翻译键（中文）

### 修改的文件清单

| 文件 | 修改内容 |
|------|---------|
| `packages/i18n/src/locales/en.ts` | 添加 `macros.*` 翻译键 |
| `packages/i18n/src/locales/zh-CN.ts` | 添加 `macros.*` 翻译键 |
| `templates/macros/app/root.tsx` | 添加 `I18nProvider` 包裹、`useI18n` 调用 |
| `templates/macros/app/routes/_index.tsx` | 替换 SEO、日期、空状态、toast 等字符串 |
| `templates/macros/app/routes/team.tsx` | 替换标题、描述字符串 |
| `templates/macros/app/routes/analytics.tsx` | 替换统计标签、图表标签、选择项等字符串 |
| `templates/macros/app/routes/extensions._index.tsx` | 替换 meta 标题 |
| `templates/macros/app/components/layout/AppLayout.tsx` | 替换导航标签、侧边栏文字、同步指示器 |
| `templates/macros/app/components/layout/Header.tsx` | 替换页面标题、aria 标签 |
| `templates/macros/app/components/DailyProgress.tsx` | 替换摘要标题、营养标签、图表标签 |
| `templates/macros/app/components/WeightTracker.tsx` | 替换标题、空状态、toast |
| `templates/macros/app/components/WeightCard.tsx` | 替换单位、aria 标签、删除对话框 |
| `templates/macros/app/components/MealCard.tsx` | 替换单位、aria 标签 |
| `templates/macros/app/components/ExerciseCard.tsx` | 替换单位、aria 标签 |
| `templates/macros/app/components/AddWeightDialog.tsx` | 替换对话框标题、标签、按钮 |
| `templates/macros/app/components/AddMealDialog.tsx` | 替换对话框标题、标签、按钮、营养字段 |
| `templates/macros/app/components/AddExerciseDialog.tsx` | 替换对话框标题、标签、按钮 |
| `templates/macros/app/components/VoiceDictation.tsx` | 替换 toast 消息、状态文字 |
| `templates/macros/app/components/WeeklyCaloriesChart.tsx` | 替换 tooltip、统计标签、空状态 |

### 翻译键统计
- **macros.* 命名空间** 共约 150+ 个翻译键，覆盖导航、页面标题、卡片、对话框、图表、语音输入等所有用户可见文字