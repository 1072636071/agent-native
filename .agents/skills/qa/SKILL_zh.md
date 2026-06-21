---
name: qa
description: >-
  使用 Playwright 对模板应用进行自主 QA 测试。在端到端测试应用、查找和修复 bug、或运行 QA 扫描时使用。以
  /qa 调用，可选 --apps 和 --focus 参数。
user-invocable: true
metadata:
  internal: true
---

# QA 测试

自主 QA 测试：启动模板应用，使用 Playwright 并行测试，修复问题，重新测试，并报告结果。仅在受阻时通知用户。

## 用法

```
/qa                                            # 测试 mail, calendar, content, forms
/qa --apps mail,forms                          # 测试指定应用
/qa --focus "test form submission and compose"  # 优先测试指定流程
```

## Browser MCP 就绪

QA 可以使用框架内置的 browser MCP 能力，而非手写的 `mcp.config.json`。内置功能默认关闭，通过 `/_agent-native/mcp/builtin` 切换。

- 优先使用 `browser-playwright` 进行自动化 QA 扫描：它运行 `npx -y @playwright/mcp@0.0.75`。
- 仅当测试明确需要附加到实时 Chrome 会话时才使用 `browser-chrome-devtools`。它运行 `npx -y chrome-devtools-mcp@0.26.0 --autoConnect --no-usage-statistics`，需要 Chrome 144+ 并启用远程调试。不要假设它会登录用户的 Chrome 配置。
- Browser 内置功能按作用域互斥：启用 Chrome 会禁用 Playwright，启用 Playwright 会禁用 Chrome。
- `computer-use` 运行 `npx -y computer-use-mcp@1.8.0`，仅限 macOS。

**参数：**

- `--apps` — 逗号分隔的应用名称（默认：`mail,calendar,content,forms`）
- `--focus` — 优先测试内容的自然语言指引

## 编排器步骤

你（运行此技能的 agent）是编排器。按顺序执行以下步骤。

### 步骤 1：解析参数

解析用户的调用以确定：

- **apps**：要测试的应用（默认：mail, calendar, content, forms）
- **focus**：可选的测试优先指引

### 步骤 2：检查凭据就绪状态

对于每个应用，检查所需凭据是否存在：

| 应用     | 检查                                                    | 无凭据可测试？ |
| -------- | ------------------------------------------------------- | -------------- |
| forms    | 无需凭据                                                | 是             |
| content  | 无需凭据（Notion 是可选的）                             | 是             |
| calendar | `templates/calendar/.env` 中存在 `GOOGLE_CLIENT_ID`     | 部分 — 本地事件可用，Google 同步不可用 |
| mail     | `templates/mail/.env` 中存在 `GOOGLE_CLIENT_ID`         | 部分 — UI 可渲染，Gmail 功能不可用 |

读取每个应用的 `.env` 文件（如果存在）仅用于检查所需变量名是否存在。切勿打印、复制、摘要、粘贴或将 `.env` 值传入测试器提示、报告、截图、日志或聊天。如果凭据缺失：

- 仍然测试该应用 — 许多功能无需外部 API 即可工作
- 在测试器的指令中包含："未找到 Google 凭据。测试本地功能。将任何因缺少凭据而崩溃的功能标记为'需要凭据'而非 bug。"
- 仅当应用**完全无法启动**时才通知用户（通过 SendMessage 发给团队负责人或 AskUserQuestion）

### 步骤 3：启动开发服务器

使用 `run_in_background` 在专用端口上启动每个应用的开发服务器：

| 应用     | 端口 | 命令 |
|----------|------|------|
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

对于每个应用，读取以下文件以了解测试内容：

1. `templates/<app>/app/routes/` 或 `templates/<app>/app/routes.ts` — 发现所有页面
2. `templates/<app>/CLAUDE.md` — 功能、API 路由、数据模型
3. `templates/<app>/actions/` — UI 和 agent 共享的领域操作
4. `templates/<app>/server/routes/api/` — 仅路由端点，如上传、流式传输、webhook 和 OAuth 回调

结合任何 `--focus` 指引生成测试计划。测试计划是要验证的用户面向流程的编号列表。示例：

```
1. 首页加载无错误
2. 通过 UI 创建新项目
3. 编辑现有项目
4. 删除项目
5. 检查所有导航链接正常
6. 验证任何页面无控制台错误
7. 验证无失败的网络请求
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

- `name`：`qa-<app>`（例如 `qa-mail`）
- `team_name`：`qa`
- `mode`：`auto`
- 完整的测试器提示（见下方测试器 Agent 提示）

### 步骤 6：监控和告警

生成测试器后，等待它们的空闲通知和任务更新。

- 当测试器完成任务时，记录其发现
- 当测试器报告受阻（缺少凭据、应用无法启动、需要用户输入）时，通过 AskUserQuestion 转达给用户
- 当所有测试器完成后，进入步骤 7

### 步骤 7：编译报告并关闭

从任务更新中收集所有测试器报告。打印编译摘要：

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

通过 Agent 工具生成每个测试器 agent 时使用此提示。填入 `{{占位符}}`：

---

**测试器提示开始**

你是运行在 `http://localhost:{{port}}` 的 **{{app_name}}** 应用的 QA 测试器。

## 你的任务

使用 Playwright MCP 工具彻底测试该应用。发现 bug，修复它们，重新测试。报告你的发现。

## 团队上下文

你在 "qa" 团队中。你的名字是 "qa-{{app_name}}"。

- 开始时使用 TaskUpdate 将任务标记为 `in_progress`
- 完成时使用 TaskUpdate 将任务标记为 `completed`，描述中包含你的报告
- 如果你受阻并需要用户输入，向团队负责人发送消息说明你需要什么

## 凭据状态

{{credential_status}}

## 测试计划

{{test_plan}}

## 如何测试

使用这些 Playwright MCP 工具：

1. **导航**：`browser_navigate` 到 `http://localhost:{{port}}<path>`
2. **查看页面**：`browser_snapshot` — 返回显示所有可见元素及其 `ref` 属性的无障碍树
3. **点击**：`browser_click` 配合快照中的 `ref`
4. **输入**：`browser_type` 配合 `ref` 和 `text`
5. **填写表单**：`browser_fill_form` 配合 `ref` 和 `values`
6. **检查控制台**：`browser_console_messages` — 查找错误
7. **检查网络**：`browser_network_requests` — 查找失败请求（4xx, 5xx）
8. **等待**：`browser_wait_for` 当你需要等待内容出现时
9. **截图**：`browser_take_screenshot` 当你想捕获视觉状态时

### 测试循环

对于计划中的每个测试：

1. 导航到相关页面
2. 拍摄快照查看屏幕内容
3. 检查控制台消息中的错误
4. 检查网络请求中的失败
5. 与页面交互 — 点击按钮、填写表单、导航流程
6. 如果发现问题：
   a. 记录：哪个页面，什么问题
   b. 阅读相关源文件以理解问题
   c. 修复代码
   d. 等待 2-3 秒让 Vite HMR 热重载
   e. 通过拍摄新快照重新测试
   f. 如果 3 次尝试后仍失败，标记为"需要人工审查"并继续
7. 进入下一个测试

完成所有测试后，对你发现问题的页面**再做一轮检查**，以验证修复没有破坏其他功能。

**最多 2 轮完整检查。** 不要无限循环。

### 从导航到首页开始

始终从导航到 `http://localhost:{{port}}/` 开始，并拍摄快照以验证应用正在运行。

如果应用显示错误页面或无法加载，检查开发服务器输出并尝试诊断。如果是缺少依赖或配置问题，报告并停止 — 不要花时间调试基础设施。

## 隔离规则

**关键：** 你只能修改 `templates/{{app_name}}/` 内的文件。如果 bug 需要修改 `packages/core/` 或其他模板，将其作为发现报告但不要修复。

修改任何源文件后，运行：
```bash
npx prettier --write <file>
```

## 什么算作 Bug

- 页面崩溃或显示错误覆盖层
- 控制台错误（不是警告 — 仅错误）
- 网络请求返回 4xx 或 5xx
- 按钮/链接不起作用
- 表单无法提交
- 数据无法保存或显示
- 布局严重损坏（文字重叠、元素不可见）
- CLAUDE.md 中描述的功能不工作

什么不算 Bug：
- 轻微样式偏好
- CLAUDE.md 中未描述的缺失功能
- 控制台中的警告
- 加载缓慢（除非超过 10 秒）

## 报告格式

完成后，更新你的任务（通过 TaskUpdate），状态为 `completed`，描述设为你的报告：

```markdown
## QA 报告：{{app_name}}

### 摘要：N 发现，N 已修复，N 需要审查

#### 已修复
1. **简短描述** — 修改了什么文件以及原因

#### 需要审查
1. **简短描述** — 为什么无法修复

#### 已跳过（需要凭据）
1. **功能名称** — 需要什么凭据

#### 已测试页面
- /path（页面名称）— 状态（OK，N 问题已修复，N 需要审查）
```

**测试器提示结束**

---

## 故障排除

### 端口已被占用

在启动前杀死占用端口的进程：

```bash
lsof -ti :9201 | xargs kill -9 2>/dev/null; true
```

### 开发服务器无法启动

常见原因：

- 缺少 `node_modules` — 先从根目录运行 `pnpm install`
- 缺少 `.env` 文件 — 某些应用需要一个即使为空的 `.env`。检查 `.env.example`
- 端口冲突 — 杀死残留进程（见上方）
- core 构建错误 — 先运行 `pnpm --filter @agent-native/core build`

### Playwright MCP 无响应

Playwright MCP 服务器必须在 Claude Code 的 MCP 设置中配置。如果浏览器工具不可用，测试器 agent 应报告"Playwright MCP 工具不可用"并停止。

### HMR 未检测到更改

编辑文件后，等待 2-3 秒。如果页面未更新，尝试通过导航离开再回来进行硬刷新。Vite HMR 有时会遗漏服务端文件的更改 — 如需可重启开发服务器。

### 应用显示"凭据未配置"但实际已配置

这是已知问题。测试器应：

1. 检查 `.env` 文件是否存在且变量名正确
2. 检查应用是从 `.env` 还是 `data/.env` 读取
3. 检查加载凭据的服务器插件
4. 尝试修复凭据检测逻辑
5. 如果无法修复，报告为"需要审查"，详细说明应用期望的与已配置的内容

仅报告变量名和存在/缺失状态。不要包含秘密值。