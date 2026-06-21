---
name: recurring-jobs
description: >-
  Agent 按 cron 计划运行的定时任务。当用户请求重复性操作（"每天早上"、"每日"、"每周"）、创建或更新任务、或调试任务调度器时使用。
metadata:
  internal: true
---

# 定时任务

## 规则

定时任务是 agent 按 cron 计划自动执行的任务。任务作为资源文件存储在 `jobs/` 下，带有用于调度元数据的 YAML frontmatter。

## 工作原理

1. 用户通过 agent 聊天请求重复性操作
2. Agent 使用 `manage-jobs` 工具（action: "create"）在 `jobs/<name>.md` 写入任务文件
3. 调度器每 60 秒轮询一次，找到到期任务，并通过 `runAgentLoop` 执行
4. 任务结果保存为聊天线程

## 任务工具（内置）

| 工具           | Action    | 用途                                                   |
| -------------- | --------- | ------------------------------------------------------ |
| `manage-jobs`  | `create`  | 创建定时任务（名称、cron 计划、指令）                  |
| `manage-jobs`  | `list`    | 列出所有任务及其状态                                    |
| `manage-jobs`  | `update`  | 更新计划、指令或切换启用状态                            |

## 关键文件

| 文件                                 | 用途                                                   |
| ------------------------------------ | ------------------------------------------------------ |
| `packages/core/src/jobs/cron.ts`     | Cron 解析（`nextOccurrence`、`isValidCron`、`describeCron`） |
| `packages/core/src/jobs/scheduler.ts`| 任务执行引擎（`processRecurringJobs`）                 |
| `packages/core/src/jobs/tools.ts`    | Agent 工具（`manage-jobs`，含 create/list/update 操作） |

## 相关技能

- `actions` — 工具和 action 的工作方式
- `delegate-to-agent` — 任务如何调用 agent 循环