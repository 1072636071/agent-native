---
description: 可视化本地 Codex/Claude 上下文使用情况并获取优化建议。
argument-hint: [current|threads|trends|--since 7d]
---

运行本地 Context X-Ray 分析器并向用户展示生成的报告链接和最重要的警告。

默认使用此命令：

```sh
~/.agent-native/context-xray/context-xray --open $ARGUMENTS
```

如果 `$ARGUMENTS` 为空，分析当前或最近的本地线程。如果用户要求选择器或所有会话，使用 `threads --open`。如果他们要求趋势，使用 `trends --since 7d --open`。

`--open` 直接打开本地 HTML 报告文件；不应该有需要监控的长时间运行的服务器进程。

命令完成后，总结：

- 报告链接
- 分析的会话
- 最大的上下文桶
- 最重要的警告
- 两三个改进此线程的具体方法