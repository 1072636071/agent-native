# 开发指南

## 前提条件

- **Node.js** >= 22（推荐 v24+）
- **pnpm** >= 10（使用 `corepack enable` 以使用模板中固定的版本）

## 入门

```bash
git clone https://github.com/BuilderIO/agent-native.git
cd agent-native
pnpm install
```

`postinstall` 脚本会自动构建其他包所依赖的工作区包（`shared-app-config`、`core`、`code-agents-ui`、`migrate`、`pinpoint`、`scheduling`、`embedding`、`dispatch`）。

## 开发

### 运行所有模板应用

```bash
pnpm run dev:all
```

这会先构建 core，然后在连续的端口上并行启动每个模板应用。

### 运行单个包或模板

```bash
pnpm --filter mail dev        # 运行 mail 模板
pnpm --filter calendar dev    # 运行 calendar 模板
pnpm --filter @agent-native/core dev   # 监听构建 core
pnpm --filter @agent-native/docs dev   # 运行文档站点
```

### Electron 桌面应用

```bash
pnpm run dev:electron          # 运行桌面应用
pnpm run dev:electron:apps     # 运行带模板应用的桌面应用
```

## 工作区结构

这是一个 pnpm monorepo。工作区在 `pnpm-workspace.yaml` 中定义。

### 包（`packages/`）

| 包                   | 描述                                                                                                     |
| -------------------- | -------------------------------------------------------------------------------------------------------- |
| `core`               | 核心框架库（`@agent-native/core`）—— CLI、服务器插件、agent 工具、Vite 插件                             |
| `code-agents-ui`     | Agent-Native Code 界面的可复用 React UI                                                                   |
| `desktop-app`        | Electron 桌面应用                                                                                        |
| `dispatch`           | 工作区控制平面—— vault、集成、目标、定时作业和跨应用委托，即插即用                                       |
| `docs`               | 文档站点                                                                                                 |
| `embedding`          | 在其他应用中嵌入 Agent-Native 应用、选择器和 agent                                                        |
| `frame`              | 本地开发框架—— agent 聊天 + CLI 侧边栏，包裹应用 iframe                                                  |
| `migrate`            | 迁移工作台引擎，用于将现有应用迁移到 agent-native，支持可验证、可恢复的迁移运行                           |
| `mobile-app`         | 移动应用                                                                                                 |
| `pinpoint`           | agent-native Web 应用的可视反馈和标注工具                                                                 |
| `scheduling`         | 调度原语——事件类型、可用性、预约、团队调度、工作流、路由表单                                               |
| `shared-app-config`  | 共享的 Agent-Native 应用目录和配置辅助工具                                                                |

### 模板（`templates/`）

展示框架的生产就绪模板应用。每个模板是一个独立应用，拥有自己的 `package.json`、Drizzle schema、action 和 UI。

模板：`analytics`、`assets`、`brain`、`calendar`、`chat`、`clips`、`content`、`design`、`dispatch`、`forms`、`macros`、`mail`、`plan`、`slides`、`videos`

每个模板使用相同的脚本：

```bash
pnpm dev          # 启动开发服务器（通过 agent-native dev）
pnpm build        # 生产构建
pnpm action <name>  # 运行一个 agent action
pnpm typecheck    # 类型检查
```

## 环境变量

模板从其自身目录的 `.env` 读取。关键变量：

| 变量                   | 用途                                                           |
| ---------------------- | -------------------------------------------------------------- |
| `DATABASE_URL`         | 数据库连接字符串（见下文）                                     |
| `ANTHROPIC_API_KEY`    | Claude 的 API 密钥（agent 聊天所需）                           |
| `ACCESS_TOKEN`         | MCP/连接客户端的静态 bearer 回退；非浏览器认证                  |
| `GOOGLE_CLIENT_ID`     | Google OAuth 客户端 ID（用于 Gmail、Calendar 集成）            |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 客户端密钥                                        |

### 数据库选项

设置 `DATABASE_URL` 以连接到你的数据库。未设置时，默认使用位于 `data/app.db` 的本地 SQLite 文件。

| 提供商             | 示例 `DATABASE_URL`                                          |
| ------------------ | ------------------------------------------------------------- |
| SQLite（默认）     | _（未设置，或 `file:./data/app.db`）_                         |
| Neon Postgres      | `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/db`    |
| Supabase           | `postgresql://user:pass@db.xxx.supabase.co:5432/postgres`     |
| Turso (libSQL)     | `libsql://your-db.turso.io?authToken=...`                     |
| 普通 Postgres      | `postgresql://user:pass@localhost:5432/mydb`                  |

所有 SQL 必须是方言无关的——永远不要假设 SQLite。

## 关键命令

从仓库根目录运行：

| 命令                  | 描述                                                                   |
| --------------------- | ---------------------------------------------------------------------- |
| `pnpm run prep`       | 并行运行格式化 + 类型检查 + 测试 + 守卫（推送前运行）                  |
| `pnpm run fmt`        | 使用 Prettier 格式化所有文件                                           |
| `pnpm run fmt:check`  | 检查格式化但不写入                                                     |
| `pnpm run typecheck`  | 类型检查所有包和模板                                                   |
| `pnpm test`           | 运行测试（core + migrate + docs + dispatch + brain 评估）              |
| `pnpm run guards`     | 运行所有安全/一致性守卫脚本（见下方守卫部分）                          |
| `pnpm run lint`       | 格式化检查 + 类型检查                                                  |

## 守卫

`guards` 脚本链接了 `scripts/guard-*.mjs` 下的一套守卫脚本，每个脚本编码了一个真实的过往事件或不变量（跨租户数据泄露、凭证泄露、对生产环境执行 `drizzle-kit push`、未限定范围的可拥有查询、基于环境变量的凭证、公共模板白名单等）。阅读每个 `scripts/guard-*.mjs` 的头部注释了解它执行的内容。

执行：

- 所有守卫作为 `pnpm run prep` 的一部分在本地运行。
- 在 CI 中，`Security guards` 作业（`.github/workflows/ci.yml`）在每个 PR 上运行完整的 `pnpm guards` 套件。要使其阻止合并，必须将其添加到 `main` 的 required-status-checks 规则集中。
- 故意**没有 pre-commit hook**（见项目约定）；在推送前运行 `pnpm run prep`。

## 构建

```bash
pnpm run build    # 构建所有包和模板
```

单独构建包：

```bash
pnpm --filter @agent-native/core build
pnpm --filter mail build
```