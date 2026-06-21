---
name: qa
description: >-
  使用 Playwright 对模板应用进行自主 QA 测试。在端到端测试应用、
  查找和修复 bug 或运行 QA 扫描时使用。以 /qa 调用，
  可选 --apps 和 --focus 参数。
user-invocable: true
metadata:
  internal: true
---

# QA 测试

自主 QA 测试，启动模板应用，使用 Playwright 并行测试，修复问题，重新测试，并报告发现。仅在受阻时提醒用户。

## 用法

```
/qa                                            # 测试 mail, calendar, content, forms
/qa --apps mail,forms                          # 测试指定应用
/qa --focus "test form submission and compose"  # 优先测试特定流程
```

## 浏览器 MCP 就绪

QA 可以使用框架内置的浏览器 MCP 功能，而非手写的 `mcp.config.json`。内置功能默认关闭，通过 `/_agent-native/mcp/builtin` 切换。

- 优先使用 `browser-playwright` 进行自动化 QA 扫描：它运行 `npx -y @playwright/mcp@0.0.75`。
- 仅当测试特别需要连接到实时 Chrome 会话时才使用 `browser-chrome-devtools`。它运行 `npx -y chrome-devtools-mcp@0.26.0 --autoConnect --no-usage-statistics`，需要启用远程调试的 Chrome 144+。不要假设它登录了用户的 Chrome 配置文件。
- 浏览器内置功能按范围互斥：启用 Chrome 会禁用 Playwright，启用 Playwright 会禁用 Chrome。
- `computer-use` 运行 `npx -y computer-use-mcp@1.8.0`，仅限 macOS。

**参数：**

- `--apps` — 逗号分隔的应用名称（默认：`mail,calendar,content,forms`）
- `--focus` — 优先测试什么的自然语言指导

## 编排器步骤

你（运行此技能的 agent）是编排器。按顺序执行以下步骤。

### 步骤 1：解析参数

解析用户的调用以确定：

- **apps**：要测试哪些应用（默认：mail, calendar, content, forms）
- **focus**：可选的测试优先级指导

### 步骤 2：检查凭证就绪状态

对每个应用，检查所需凭证是否存在：

| 应用      | 检查                                                    | 没有凭证能测试吗？ |
| -------- | -------------------------------------------------------- | ----------------- |
| forms    | 不需要凭证                                    | 是               |
| content  | 不需要凭证（Notion 是可选的）                 | 是               |
| calendar | `templates/calendar/.env` 中存在 `GOOGLE_CLIENT_ID` | 部分 — 本地事件可用，Google 同步不可用 |
| mail     | `templates/mail/.env` 中存在 `GOOGLE_CLIENT_ID`     | 部分 — UI 渲染，Gmail 功能不可用 |

读取每个应用的 `.env` 文件（如果存在）仅用于检查所需的变量名是否存在。永远不要打印、复制、摘要、粘贴或将 `.env` 值传递到测试器提示、报告、截图、日志或聊天中。如果凭证缺失：

- 仍然测试应用——许多功能在没有外部 API 的情况下也能工作
- 在测试器的说明中包含："未找到 Google 凭证。测试本地功能。将缺少凭证时崩溃的功能标记为'需要凭证'而非 bug。"
- 仅当应用**完全无法启动**时才提醒用户（通过 SendMessage 给团队负责人或 AskUserQuestion）

### 步骤 3：启动开发服务器

使用 `run_in_background` 在专用端口上启动每个应用的开发服务器：

| 应用      | 端口 | 命令 |
|----------|------|---------|
| mail     | 9201 | `cd templates/mail && PORT=9201 pnpm dev` |
| calendar | 9202 | `cd templates/calendar && PORT=9202 pnpm dev` |
| content  | 9203 | `cd templates/content && PORT=9203 pnpm dev` |
| forms    | 9204 | `cd templates/forms && PORT=9204 pnpm dev` |

并行启动所有服务器（多个 Bash 调用，`run_in_background: true`）。

然后通过 curl 轮询验证每个服务器是否就绪：

```bash
for i in {1..30}; do curl -s -o /dev/null -w "%{http_code}" http://localhost:9201 && break; sleep 1; done
```

如果服务器在 30 秒内未能启动，跳过该应用并在报告中注明。

### 步骤 4：生成测试计划

对每个应用，读取以下文件以了解要测试什么：

1. `templates/<app>/app/routes/` 或 `templates/<app>/app/routes.ts` — 发现所有页面
2. `templates/<app>/CLAUDE.md` — 功能、API 路由、数据模型
3. `templates/<app>/actions/` — UI 和 agent 共享的领域操作
4. `templates/<app>/server/routes/api/` — 仅路由端点，如上传、流式传输、Webhook 和 OAuth 回调

结合任何 `--focus` 指导生成测试计划。测试计划是要验证的用户面向流程的编号列表。示例：

```
1. 主页加载无错误
2. 通过 UI 创建新项目
3. 编辑现有项目
4. 删除项目
5. 检查所有导航链接是否正常
6. 验证任何页面上没有控制台错误
7. 验证没有失败的网络请求
```

### 步骤 5：创建团队并生成测试器

创建团队并并行生成每个应用一个测试器 agent：

```
TeamCreate: name="qa", description="QA testing sweep"
```

为每个应用创建一个任务：

```
TaskCreate: subject="QA test <app> on port <port>", description="<test plan>"
```

然后使用 Agent 工具并行生成测试器 agent。每个 agent 获得：

- `name`：`qa-<app>`（如 `qa-mail`）
- `team_name`：`qa`
- `mode`：`auto`
- 完整的测试器提示（见下方测试器 Agent 提示）

### 步骤 6：监控和提醒

生成测试器后，等待它们的通知和任务更新。

- 当测试器完成其任务时，记录其发现
- 当测试器报告被阻塞（缺少凭证、应用无法启动、需要用户输入）时，通过 AskUserQuestion 转达给用户
- 当所有测试器完成时，进入步骤 7

### 步骤 7：汇总报告并关闭

从测试器的任务更新中收集所有报告。打印汇总摘要：

```markdown
# QA 摘要 — <date>

## 测试应用数：N
## 发现问题总数：N
## 已修复：N
## 需要审查：N

### Mail 应用
[测试器报告]

### Forms 应用
[测试器报告]

...
```

然后关闭所有队友：

```
SendMessage to each tester: { type: "shutdown_request" }
```

---

## 测试器 Agent 提示

通过 Agent 工具生成每个测试器 agent 时使用此提示。填写 `{{占位符}}`：

---

**测试器提示开始**

你是在 `http://localhost:{{port}}` 运行的 **{{app_name}}** 应用的 QA 测试器。

## 你的使命

使用 Playwright MCP 工具彻底测试应用。发现 bug，修复它们，重新测试。报告你的发现。

## 团队上下文

你在团队 "qa" 中。你的名字是 "qa-{{app_name}}"。

- 开始时使用 TaskUpdate 将你的任务标记为 `in_progress`
- 完成时使用 TaskUpdate 将你的任务标记为 `completed`，描述中包含你的报告
- 如果你被阻塞并需要用户输入，向团队负责人发送消息说明你需要什么

## 凭证状态

{{credential_status}}

## 测试计划

{{test_plan}}

## 如何测试

使用这些 Playwright MCP 工具：

1. **导航**：`browser_navigate` 到 `http://localhost:{{port}}<path>`
2. **查看页面**：`browser_snapshot` — 返回显示所有可见元素及其 `ref` 属性的可访问性树
3. **点击**：`browser_click`，使用快照中的 `ref`
4. **输入**：`browser_type`，使用 `ref` 和 `text`
5. **填写表单**：`browser_fill_form`，使用 `ref` 和 `values`
6. **检查控制台**：`browser_console_messages` — 查找错误
7. **检查网络**：`browser_network_requests` — 查找失败的请求（4xx, 5xx）
8. **等待**：`browser_wait_for` 当你需要等待内容出现时
9. **截图**：`browser_take_screenshot` 当你想捕获视觉状态时

### 测试循环

对计划中的每个测试：

1. 导航到相关页面
2. 拍摄快照查看屏幕上的内容
3. 检查控制台消息中的错误
4. 检查网络请求中的失败
5. 与页面交互——点击按钮、填写表单、导航流程
6. 如果有问题：
   a. 记录：什么页面，什么问题
   b. 阅读相关源文件以理解问题
   c. 修复代码
   d. 等待 2-3 秒让 Vite HMR 热重载
   e. 通过拍摄新快照重新测试
   f. 如果 3 次尝试后仍有问题，标记为"需要人工审查"并继续
7. 进入下一个测试

完成所有测试后，对发现问题的页面**再做一次检查**，以验证修复没有破坏其他东西。

**最多 2 轮完整检查。** 不要无限循环。

### 从导航到主页开始

始终从导航到 `http://localhost:{{port}}/` 并拍摄快照开始，以验证应用正在运行。

如果应用显示错误页面或无法加载，检查开发服务器输出并尝试诊断。如果是缺少依赖或配置问题，报告并停止——不要花时间调试基础设施。

## 隔离规则

**关键：** 你只能修改 `templates/{{app_name}}/` 中的文件。如果 bug 需要更改 `packages/core/` 或任何其他模板，将其报告为发现但不要修复。

修改任何源文件后，运行：
```bash
npx prettier --write <file>
```

## 什么算作 Bug

- 页面崩溃或显示错误覆盖层
- 控制台错误（不是警告——仅错误）
- 网络请求返回 4xx 或 5xx
- 按钮/链接不起作用
- 表单无法提交
- 数据无法保存或显示
- 布局严重破损（文本重叠、元素不可见）
- CLAUDE.md 中描述的功能不起作用

什么不算 Bug：

- 轻微样式偏好
- CLAUDE.md 中未描述的缺失功能
- 控制台中的警告
- 加载缓慢（除非超过 10 秒）

## 报告格式

完成后，更新你的任务（通过 TaskUpdate），状态为 `completed`，描述设置为你的报告：

```markdown
## QA 报告：{{app_name}}

### 摘要：发现 N 个，修复 N 个，需要审查 N 个

#### 已修复
1. **简短描述** — 你更改了什么文件以及为什么

#### 需要审查
1. **简短描述** — 为什么你无法修复

#### 跳过（需要凭证）
1. **功能名称** — 需要什么凭证

#### 测试的页面
- /path（页面名称）— 状态（OK，修复 N 个问题，N 个需要审查）
```

**测试器提示结束**

---

## 故障排除

### 端口已被占用

在启动前终止端口上的进程：

```bash
lsof -ti :9201 | xargs kill -9 2>/dev/null; true
```

### 开发服务器无法启动

常见原因：

- 缺少 `node_modules` — 先从根目录运行 `pnpm install`
- 缺少 `.env` 文件 — 有些应用即使为空也需要一个。检查 `.env.example`
- 端口冲突 — 终止过期进程（见上文）
- core 中的构建错误 — 先运行 `pnpm --filter @agent-native/core build`

### Playwright MCP 无响应

Playwright MCP 服务器必须在 Claude Code 的 MCP 设置中配置。如果浏览器工具不可用，测试器 agent 应报告"Playwright MCP 工具不可用"并停止。

### HMR 未拾取更改

编辑文件后，等待 2-3 秒。如果页面未更新，尝试通过导航离开再回来进行硬刷新。Vite HMR 有时会遗漏服务端文件的更改——如需可重启开发服务器。

### 应用显示"凭证未配置"但实际已配置

这是已知问题。测试器应：

1. 检查 `.env` 文件是否存在且变量名正确
2. 检查应用是从 `.env` 还是 `data/.env` 读取
3. 检查加载凭证的服务器插件
4. 尝试修复凭证检测逻辑
5. 如果无法修复，报告为"需要审查"，详细说明应用期望什么与已配置什么

仅报告变量名和存在/缺失。不要包含密钥值。