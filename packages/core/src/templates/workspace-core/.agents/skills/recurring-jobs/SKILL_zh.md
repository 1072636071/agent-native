---
name: recurring-jobs
description: >-
  Agent 按 cron 计划运行的计划任务。当用户要求重复的事情（"每天早上"、"每日"、"每周"）、创建或更新作业或调试作业调度器时使用。
metadata:
  internal: true
---

# 循环作业

## 规则

循环作业是 Agent 按 cron 计划自动执行的定时任务。作业作为资源文件存在于 `jobs/` 下，带有用于调度元数据的 YAML frontmatter。

## 工作原理

1. 用户通过 Agent 聊天要求重复的事情
2. Agent 使用 `manage-jobs` 工具（action: "create"）在 `jobs/<name>.md` 写入作业文件
3. 调度器每 60 秒轮询一次，找到到期的作业，并通过 `runAgentLoop` 执行它们
4. 作业结果保存为聊天线程

## 作业工具（内置）

| 工具           | Action   | 用途                                                   |
| -------------- | -------- | ------------------------------------------------------ |
| `manage-jobs`  | `create` | 创建循环作业（名称、cron 计划、指令）                  |
| `manage-jobs`  | `list`   | 列出所有作业及其状态                                   |
| `manage-jobs`  | `update` | 更新计划、指令或切换启用                               |

## 关键文件

| 文件                                  | 用途                                                   |
| ------------------------------------- | ------------------------------------------------------ |
| `packages/core/src/jobs/cron.ts`      | Cron 解析（`nextOccurrence`、`isValidCron`、`describeCron`） |
| `packages/core/src/jobs/scheduler.ts` | 作业执行引擎（`processRecurringJobs`）                 |
| `packages/core/src/jobs/tools.ts`     | Agent 工具（带 create/list/update action 的 `manage-jobs`） |

## 相关技能

- `actions` — 工具和 action 如何工作
- `delegate-to-agent` — 作业如何调用 Agent 循环