---
name: babysit-pr
description: 监控 PR，修复反馈和 CI 失败，直到完全绿色 30 分钟。使用 /babysit-pr <number> 运行
user-invocable: true
metadata:
  internal: true
---

监控当前仓库中的 PR #$ARGUMENTS。修复 CI 失败和人类或机器人审查反馈，直到一切绿色且 30 分钟内没有新反馈。

## 不可协商的分支所有权规则

在 `/babysit-pr` 期间，PR 分支是所有权单位。每个 tick 必须提交并推送当前分支上**所有**非 gitignore 的本地变更，包括用户或其他并发 agent 的变更。不要将提交限制在你个人编辑的文件。不要暂存、跳过或留下本地工作，除非是 `learnings.md` 或被忽略/个人文件。

**如果未给出 PR 编号**，自动检测：获取当前分支（`git branch --show-current`），找到其对应的开放 PR（`gh pr list --head <branch> --state open --json number --limit 1`）。如果没有开放 PR，检查最近合并/关闭的 PR。只有在找不到 PR 时才询问用户。

## 设置

1. 运行自重新武装的 tick 循环。执行一个 tick（见"每个 tick"），然后在让出之前立即用 `ScheduleWakeup` 安排下一个——将相同的 `/babysit-pr <number> …` 调用作为唤醒 prompt 传回，这样下次触发重复 tick。循环仅在停止条件（如下）时结束；在此之前**始终**有安排的下一个 tick。
2. 跟踪最后一个可操作项目（新的人类/机器人反馈、CI 修复、合并冲突解决或本地变更提交/推送）发生的时间。
3. 在 GitHub Actions CI 绿色且 30 分钟无新可操作项目后，取消循环（停止安排唤醒）并报告"全部清除"。

### 循环纪律——阅读此部分，这是人们经常出错的地方

- **节奏：PR 活跃时每 60-120 秒 tick 一次**（CI 运行中、最近有推送、几分钟内有反馈，或有并发 agent 不断添加文件的快速移动分支）。仅在 PR 真正安静时（所有检查绿色、一段时间没有新提交或评论）才放宽到约 3 分钟。一个频繁变动的分支需要该范围的紧密端——新的本地文件和新的 CI 结果不断出现，必须及时获取。
- **永远不要停滞等待。** 不要在没有安排唤醒的情况下结束轮次"等待" CI、审查或后台命令。如果你启动了后台命令（如 `pnpm run prep`），你可以依赖其完成通知**但始终也要安排一个后备 `ScheduleWakeup`**——通知可能会静默失败，无保护的等待会变成无限期停滞。循环必须无论如何保持 ticking。
- **不要让缓慢或不可靠的本地验证阻塞循环。** `pnpm run prep` / `vitest` 可能会挂起或花费数分钟，在有并发编辑的分支上，完整的本地运行会被其他 agent 进行中的文件污染。如果本地验证缓慢、挂起或不可靠，**推送并让你已经在监控的 CI 成为验证门**——一个红色的 CI 作业会在下一个 tick 被捕获和修复。优先推送你的工作，而不是为了干净的本地运行而保留它。
- **每个 tick，预期有新的本地文件。** 在活跃的共享分支上，并发 agent 持续提交到同一个检出。每个 tick 重新运行步骤 0 并推送那里的任何内容——永远不要假设"我已经推送了，树是干净的"。

## 每个 tick

**步骤 0——始终先做这个，在一切之前：**

1. 运行 `git status --short` 检查并发 agent 的本地未提交变更。
2. 如果有：查看 `git diff --stat` 了解变更了什么，然后根据实际变更写一个描述性的提交消息（如 "feat(tools): add error toast + dark mode sync" 或 "fix(analytics): update sidebar layout"）。永远不要使用通用消息如 "chore: sweep concurrent agent changes"。
3. `git add <files> && git commit -m "<descriptive message>" && git push`。
4. 运行 `git log --oneline origin/<branch>..HEAD` 检查尚未在远程的本地提交。
5. 如果有未推送的提交：`git push`。

这确保每个 tick 以干净、完全推送的工作树开始。永远不要跳过此步骤。

**永远不要 `git stash` 并发变更。** 暂存会被孤立，一个名为 `babysit-tickN-concurrent-work-*` 的暂存留在源分支上，而 babysit-pr 的 PR 在没有它的情况下发布了，这正是真实工作丢失的方式（2026-05-05：stash@{0} 包含了 clips 的 Sentry-instrumentation 功能，包括新的 `analytics.ts` 模块，本应与 PR #511 的后续合并，但因为在暂存列表中卡住了而丢失，因为 babysit 暂存而不是提交）。如果你看到你不认识的本地变更，那仍然是其他 agent 的工作——根据 diff 用描述性消息提交，不要隐藏在暂存中。

**步骤 1——检查合并冲突：**

1. 运行 `gh pr view $ARGUMENTS --json mergeable --jq '.mergeable'`。
2. 如果 `CONFLICTING`：引入 `main` 并解决。**先提交/推送任何本地变更（步骤 0）使树干净**，然后优先使用**合并**而不是变基——`git fetch origin main && git merge --no-edit origin/main`——因为此分支与并发 agent 共享，变基会重写历史并需要可能覆盖他们未推送提交的强制推送。解决冲突（对于 `pnpm-lock.yaml`，用 `git checkout --theirs -- pnpm-lock.yaml` 取一侧，然后针对合并的 `package.json` 用 `pnpm install --lockfile-only` 重新生成），`git add` 解决的文件，完成合并提交并推送（正常推送，永远不要 `--force`）。这重置浸泡计时器。仅在用户明确要求线性历史时才变基。
3. 如果 `MERGEABLE` 或 `UNKNOWN`：继续。（`mergeStateStatus: BLOCKED` 且 `mergeable: MERGEABLE` 仅意味着必需检查仍在待定/红色——那不是冲突；继续。）

**然后继续 PR 检查：**

1. 检查来自人类和机器人的审查评论和审查摘要——**每个 tick，无例外。**

   > ⚠️ **审查机器人（Builder、Copilot 等）在每次推送时重新审查，并每次发布全新一轮评论。** 一个 PR 通常会积累几轮。你必须在每个 tick 重新检查——包括你只是在等待 CI 的"安静" tick——并且你必须持续检查直到你合并的那一刻。
   >
   > **永远不要按"since <timestamp>"窗口过滤评论。** 前向时间戳会静默跳过在你上次回复之前发布的轮次（例如在你回复第一次审查和回复之间到达的轮次），而"0 new since X"读起来像是"全部已处理"而实际不是。这个确切错误导致 PR #1097 上有两整轮审查评论未被回复（2026-06-08）。

   相反，通过**回复状态**确定覆盖：列出每个**还没有**回复的顶级审查评论，跨所有页面和所有轮次。用 `--jq '.[]'` 流式传输每个评论（跨页面干净连接），然后收集：
   ```bash
   gh api --paginate repos/{owner}/{repo}/pulls/$ARGUMENTS/comments --jq '.[]' \
     | jq -s '
       ([ .[] | .in_reply_to_id // empty ]) as $replied
       | .[]
       | select((.in_reply_to_id // null) == null)              # top-level comments only
       | select(.id as $id | ($replied | index($id)) | not)     # …with no reply yet
       | {id, user: .user.login, path, line: (.line // .original_line), snippet: (.body[0:200])}'
   ```
   （先用 `.id as $id` 绑定 id——`index(.id)` 会针对 `$replied` 数组评估 `.id`，而不是评论，会报错。）如果该命令打印了任何内容，就有未处理的反馈——在认为 PR 干净之前修复或回复每个（见"回复反馈"）。还要每个 tick 重新阅读最新的审查**摘要**正文（机器人在此重述其发现）：
   ```bash
   gh api repos/{owner}/{repo}/pulls/$ARGUMENTS/reviews --jq '.[] | select(.body != null and .body != "") | {user: .user.login, state, submitted_at, body: .body[0:1000]}'
   ```
   将未处理评论的数量（而不是时间戳）视为"是否有反馈需要处理"的真实来源。

2. 检查 CI 状态：
   ```bash
   gh pr checks $ARGUMENTS
   ```

3. **如果新的人类或机器人反馈包含真实 bug 或请求的变更**：
   - 阅读相关文件
   - 修复问题
   - 运行 `pnpm run prep` 本地验证
   - 提交并推送
   - 对每个已处理的内联评论进行内联回复，或在反馈在审查正文中时发布 PR 评论总结已处理项目
   - 重置 30 分钟计时器

4. **如果 GitHub Actions CI 失败**（lint、test、typecheck、build）：
   - 调查失败日志
   - 修复根本原因
   - 本地运行 `pnpm run prep`
   - 提交并推送
   - 重置 30 分钟计时器

   **特殊情况：缺少 changeset。** 如果失败的作业是 `Require changeset for publishable package changes`（来自 `.github/workflows/changeset-check.yml`），不要将其视为代码 bug。作业日志包含结构化行 `MISSING_CHANGESET_PACKAGES: pkg1,pkg2`。解析它，然后直接写入 `.changeset/<short-slug>.md`——不要运行交互式 `pnpm changeset add`。使用 PR 标题和 diff 决定 bump 类型（bugfix/文档/重构默认 `patch`；增量功能 `minor`；仅当 PR 描述明确信号破坏性变更时 `major`）。格式：
   ```md
   ---
   "@agent-native/<pkg-1>": patch
   "@agent-native/<pkg-2>": patch
   ---

   <one-line summary derived from the PR title>
   ```
   Slug 示例：`dispatch-route-shells.md`（kebab-case，描述性，约 3 个词）。用 `chore: add changeset for <packages>` 提交，推送，重置计时器。检查将在下一次 CI 运行中通过。

5. **如果仅外部 CI 失败**（Cloudflare Workers、Netlify 等）且 GitHub Actions 通过：
   - 记录失败但不要阻塞——这些可能需要仪表板配置变更
   - 不要为仅外部失败重置 30 分钟计时器

6. **如果一切绿色 + 30 分钟无新反馈**：取消循环，报告完成

## 回复反馈

**每条人类或机器人评论都必须得到回复**——要么是修复，要么是解释为什么跳过。

- 如果你修复了：提交、推送，并内联回复确认修复。修复代码会在 GitHub UI 中将评论标记为"过时"，但用户需要看到回复才能知道你处理了它——不要仅依赖过时状态。
- 如果你跳过了：通过 `gh api repos/{owner}/{repo}/pulls/$ARGUMENTS/comments/{id}/replies -f body="..."` 回复评论解释原因（预先存在的、误报、不实际等）
- 如果问题是真实的但你没有引入：仍然修复并回复。真实的 bug 无论谁写的代码都应该修复。
- 如果反馈出现在审查摘要/正文中而不是内联线程：修复你同意的项目，然后发布顶级 PR 评论引用审查并列出修复了什么；明确提及你跳过或不同意的项目及原因。
- **永远不要静默忽略人类或机器人评论**——每一条都必须有回复，以便用户可以验证一切都已处理。

## 评估反馈——保持怀疑

跳过（附回复解释原因）：
- 预先存在的（不是此 PR 引入的）
- 误报 / 经不起推敲
- 资深工程师不会标记的挑剔
- Linter/typechecker 会捕获的（CI 处理那些）
- 风格/格式问题
- 已在先前提交中处理

修复：
- 此 PR 引入的真实运行时 bug
- 安全问题
- CLAUDE.md 违规
- 数据丢失风险

## 合并

**默认永远不要自动合并。** 仅当用户明确要求时才合并。

当用户确实要求合并时，以下所有条件必须**同时满足连续 10 分钟**才能合并：

1. **无本地未提交变更**——`git status --short` 必须为空
2. **无未推送提交**——`git log --oneline origin/<branch>..HEAD` 必须为空
3. **所有 GitHub Actions CI 绿色**——Build、Lint、Test、Typecheck、Scaffold E2E、Guard
4. **所有审查评论已处理**——每条人类/机器人内联评论和审查正文项目都有修复或回复
5. **无合并冲突**——`gh pr view --json mergeable --jq '.mergeable'` 必须为 `MERGEABLE`

10 分钟浸泡计时器在你推送任何内容、CI 失败、新审查评论到达、合并冲突出现或发现并提交本地变更时**重置为零**。

仅在连续 10 分钟干净后，使用 `gh pr merge <number> --squash --admin` 强制合并。

## 停止条件

- 无新可操作反馈且 GitHub Actions 绿色持续 30 分钟
- PR 已合并或关闭

在停止或合并之前，上面的未处理评论命令必须打印**无内容**——重新运行它作为最终门槛。"我之前回复了"不够；机器人可能此后发布了新轮次。