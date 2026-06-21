---
name: draft-queue
description: 在排队、审核、编辑、打开或发送组织队友请求的邮件草稿时使用，包括 Slack @agent-native 接收。
---

# 草稿队列

草稿队列用于队友请求的邮件，需要所有者在发送前审核。它是 `queued_email_drafts` 中的持久 SQL 数据，而非撰写 application state。

## 规则

- 当队友要求智能体为组织成员准备邮件时，使用 `queue-email-draft`。
- 请求者和审核者都必须是活跃组织的成员。
- Slack 请求应该排队草稿，而非发送原始邮件。
- `queue-email-draft` 返回 `reviewUrl`；在回复 Slack 时包含该 URL，以便所有者可以打开确切的草稿。
- 当应用有 `users:read.email` 时，Slack 接收通过 Slack `users.info` 验证发送者电子邮件，并将验证的发送者名称/电子邮件传入智能体上下文。
- 仅当排队草稿所有者明确要求发送时，使用 `send-queued-drafts`。
- 当用户想要在撰写面板中手动调整排队的草稿时，使用 `open-queued-draft`。

## Action

| Action                        | 用途                                                                 |
| ----------------------------- | -------------------------------------------------------------------- |
| `list-org-members`            | 解析 `ownerEmail` 的有效组织成员                                     |
| `queue-email-draft`           | 为成员审核创建排队草稿                                               |
| `list-queued-drafts`          | 列出活跃、已发送、已忽略、审核中或已请求的草稿                       |
| `update-queued-draft`         | 编辑排队草稿字段或设置状态                                           |
| `open-queued-draft`           | 将排队草稿打开为 `compose-{id}`                                      |
| `send-queued-drafts`          | 发送一个排队草稿或分配给当前用户的所有活跃草稿                       |
| `navigate --view=draft-queue` | 打开队列 UI                                                          |

## 典型流程

1. 如果用户给出了名称，使用 `list-org-members` 解析目标审核者。
2. 使用 `ownerEmail`、收件人、主题、正文和上下文调用 `queue-email-draft`。
3. 告诉请求者草稿已排队，并包含返回的 `reviewUrl`。

审核流程：

1. 调用 `list-queued-drafts --scope=review --status=active`。
2. 使用 `update-queued-draft` 进行语气/内容更改。
3. 使用 `open-queued-draft` 进行手动撰写编辑，或当所有者要求发送时使用 `send-queued-drafts`。