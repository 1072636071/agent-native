---
name: context-xray
description: >-
  使用 Context X-Ray 检查和管理实时 agent 上下文窗口。当上下文变大、
  用户询问上下文中有什么或陈旧的工具结果/文件应被固定、驱逐、恢复
  或由外部主机报告时使用。
metadata:
  internal: true
---

# Context X-Ray

Context X-Ray 是框架的上下文垃圾回收面。它将当前线程的模型绑定上下文显示为带有令牌计数的内容派生段，然后让用户或 agent 固定、驱逐或恢复各个段。

## Action

| Action | 何时使用 |
| --- | --- |
| `context-manifest-get` | 读取线程的当前清单。返回令牌总数、段状态、来源以及变更是否可强制执行。 |
| `context-pin` | 在未来的压缩/模型调用中保留一个段。用于任务规范、验收标准、用户约束和其他持久上下文。 |
| `context-evict` | 从未来的模型调用中排除陈旧或无关的段。驱逐是可逆的，永远不会删除聊天历史。 |
| `context-restore` | 撤销一个段的固定、驱逐或总结指令。 |
| `context-report` | 外部主机可以报告其可见的上下文清单。这些清单是建议性的，除非 Agent-Native 拥有发出的内容。 |

## 规则

- 永远不要驱逐或总结受保护的段。清单将活动轮次的用户/工具/思考上下文标记为 `protected`。
- 优先固定用户的任务、需求和决策，然后再驱逐大型陈旧工具结果。
- 驱逐将内容从未来的模型调用中排除；它不删除规范转录或文件。
- 在外部/建议模式下，要诚实：记录的指令是对主机的意图，除了 Agent-Native 产生的内容我们实际可以保留的。
- 如果令牌计数是估计的，将回收描述为近似值。

## 典型流程

1. 使用活动的 `threadId` 调用 `context-manifest-get`。
2. 按 `tokenCount` 排序段并检查大型陈旧的 `Tool results` 或 `Files read` 条目。
3. 为必要的规范或用户指令调用 `context-pin`。
4. 为大型无关段调用 `context-evict`。
5. 如果用户想撤销，提供 `context-restore`。