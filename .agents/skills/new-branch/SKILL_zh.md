---
name: new-branch
description: >-
  仅在明确要求 /new-branch 或新 git 分支时使用：暂存本地变更、更新
  main 并创建分支。不要为正常编码、PR、Builder.io 或 Fusion 分支
  工作流自动运行。
user-invocable: true
metadata:
  internal: true
---

# 新分支

## 激活守卫

仅当用户明确调用 `/new-branch`、提及此 skill 作为要运行的工作流，或直接要求你从 main 创建新 git 分支时使用此 skill。

如果此 skill 在没有用户明确请求创建新分支的情况下被加载，**在此停止**。报告分支移动需要明确确认，然后在当前分支上继续原始任务。

### 不要在以下任何情况下调用此 skill

这些是其他 agent 犯过的导致并发工作丢失的错误：

- 用户说"修复 bug"/"打开 PR"/"发布这个"/"处理审查反馈"——这些在**当前**分支上工作。此仓库中的 PR 和发布工作流推送当前分支；它们不是分支然后推送。
- 当前分支名看起来不寻常（`ai_*`、`claude/*`、`codex/*`、`changes-N`、`updates-N`、`pr-NNN`、`feat/...`）。这些是平台管理的或其他 agent 的分支；离开它们看起来像是工作丢失。
- 你在 Builder.io / Fusion / 项目容器内运行。平台通过它分配的分支跟踪用户的工作——静默离开会破坏它们的 UI。
- 工作树有不是你做的未提交变更。分支会暂存它们，孤立的暂存是我们过去丢失工作的方式。先将变更展示给用户，永远不要静默暂存。
- 你认为新分支会更"整洁"。整洁不是这里的目标；并发 agent 的持久性才是。

有疑问时：留在当前分支。移动前询问用户。

快速暂存任何本地变更，从 origin/main 拉取最新，并创建新的工作分支。设计为尽可能快，因为其他 agent 可能正在此仓库上并发工作。

## 预检：验证 main 有最新的合并

在创建分支之前，**始终**验证 `origin/main` 包含最近合并的 PR。如果你刚合并了一个 PR（或知道最近合并了一个），运行：

```bash
git fetch origin main
gh pr list --state merged --base main --limit 1 --json number,mergedAt,mergeCommit --jq '.[0]'
git log origin/main --oneline -1
```

比较合并提交 SHA。如果 `origin/main` 尚未包含它，等待并重新获取——GitHub 在 squash 合并后可能需要几秒钟更新。**永远不要从过时的 main 创建分支。** 创建缺少刚合并 PR 的分支会导致混乱：后续工作假设合并的代码在那里，导致冲突、回归和重复变更。

## 步骤

作为单个链式命令运行以最小化离分支时间。`git stash push` 有门控，这样我们**只弹出我们刚创建的暂存**——永远不是之前会话的旧暂存。暂存名称嵌入源分支，这样孤立暂存可以被识别（孤立暂存是我们过去丢失工作的方式——见下方"后检"）：

```bash
SOURCE=$(git branch --show-current); STASH_MSG="new-branch-from-${SOURCE:-detached}-$(date +%s)"; if git diff-index --quiet HEAD --; then CREATED=0; else git stash push -m "$STASH_MSG" && CREATED=1 || CREATED=0; fi; git checkout main && git pull origin main && git checkout -b <branch-name> && if [ "$CREATED" = "1" ]; then git stash pop; else echo "(no stash to pop)"; fi; echo "--- Done: $(git branch --show-current)"
```

为什么需要门控：`git stash push` 即使没有本地变更也退出 0（"No local changes to save"），所以链式 `&& CREATED=1` 会始终设置 CREATED=1，而无条件的 `git stash pop` 会弹出*之前存在的*暂存，将不相关的文件倾倒到工作树中。`git diff-index --quiet HEAD --` 预检查仅在**跟踪**文件与 HEAD 没有差异时退出 0——在这种情况下我们完全跳过暂存，所以没有东西要弹出。未跟踪的文件故意不是门控的一部分（也不被暂存）：对于快速新分支流程，未跟踪文件跟随用户跨 `git checkout` 是期望的行为，`git stash push` 不带 `-u` 已经忽略它们。我们让 `git stash pop` 错误（如合并冲突）自然浮现，而不是用 `2>/dev/null` 吞掉它们，因为下一节假设你会看到并解决它们。

## 分支命名

- 使用模式 `changes-N`，其中 N 至少为 50
- 在选择下一个分支编号时忽略 50 以下的旧 `changes-*` 分支
- 检查现有分支：`git branch | grep changes- | sort -t- -k2 -n | tail -1`
- 如果 50 或以上没有先前的分支，从 `changes-50` 开始

## 创建后

- 报告新分支名称和工作树状态。
- **如果 stash pop 有合并冲突**你有信心解决的（如 `pnpm-lock.yaml` 用 `--theirs`），解决它们并继续。**如果你不能自信地解决它们，中止新分支而不是让工作搁浅：**
  ```bash
  git checkout --merge .         # 退出冲突的 pop（暂存保留在列表中）
  git checkout -                  # 回到源分支
  git branch -D <new-branch>      # 删除刚创建的分支
  git stash list | head -3        # 显示暂存以便用户操作
  ```
  然后向用户展示："Stash pop 在 `<files>` 上冲突；新分支已回滚，`<stash-name>` 已保留。要我重试、丢弃暂存还是留在源分支？" **永远不要静默留下半构建的分支 + 孤立的暂存**——这就是并发 agent 工作消失的方式。
- 如果 stash pop 带回了 `.claude/worktrees` 文件，用 `git reset HEAD .claude/worktrees` 取消暂存。
- 如果意外弹出并带入了不相关的文件（因为门控被绕过），不要静默解决冲突。暂存的内容保留在暂存列表中，所以丢弃弹出的工作树变更（`git rm` 被我们删除的文件，`git checkout --ours` 用于双方修改的文件）并将此情况展示给用户。

## 后检

每次 `/new-branch` 调用后，列出任何先前存在的暂存并向用户展示。孤立的 `new-branch-from-*` / `WIP on *` / `babysit-tick*-concurrent-work-*` 暂存是我们过去丢失真实工作的方式——它们不知不觉地堆积。

```bash
git stash list
```

如果列表显示不是你本次运行创建的暂存，在响应中命名它们：

> 提醒——有 3 个先前存在的暂存（`stash@{1}: WIP on updates-238`、`stash@{2}: On changes-3: new-branch-1777654416`、`stash@{3}: babysit-tick4-concurrent-work...`）。这些可能包含未恢复的工作。要我检查它们吗？

这是捕获泄漏的唯一可靠方式——git 自己不会警告你。

## 重要

- **速度很重要**——其他 agent 并发运行，所以最小化在 main 上的时间。
- **永远不要强制推送或重置**——其他 agent 的工作可能正在进行中。
- **不要推送新分支**，直到有实际变更要发布。
- **将孤立的暂存视为 bug。** 如果你看到早于本次会话的 `new-branch-from-*` 暂存，展示它。不要在用户确认前丢弃它——它可能是某人工作的唯一副本。