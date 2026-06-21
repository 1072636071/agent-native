# Forms — 开发指南

本指南适用于开发模式下编辑此应用源代码的智能体。有关应用操作和工具，请参阅 AGENTS.md。

## 技术栈

- **框架**: @agent-native/core
- **包管理器**: pnpm
- **前端**: React 18, React Router 7, TypeScript, Vite, TailwindCSS
- **后端**: Nitro (via @agent-native/core)
- **数据库**: Drizzle ORM，基于可移植 SQL (`DATABASE_URL`；本地开发默认为 SQLite)
- **UI**: Radix UI + Lucide 图标 + shadcn/ui
- **验证码**: Cloudflare Turnstile（可选）
- **路径别名**: `@/*` → app/, `@shared/*` → shared/

## 项目结构

```
app/
  components/
    layout/      # AppLayout, Sidebar
    builder/     # FieldRenderer, FieldPropertiesPanel
    fill/        # (公共表单填写组件)
    ui/          # shadcn/ui 组件
  hooks/         # use-forms, use-responses
  pages/         # FormsListPage, FormBuilderPage, FormFillPage, ResponsesPage
  routes/        # 基于文件的路由
server/
  routes/api/    # 纯路由处理器（上传、公共提交、SEO/OG）
  handlers/      # forms.ts, submissions.ts
  plugins/       # auth, SSE
  db/            # Drizzle schema + 初始化
shared/
  types.ts       # Form, FormField, FormResponse 类型
actions/               # 共享应用操作 (defineAction; UI 使用 action hooks)
data/            # 仅本地开发 SQLite 文件
```

## 数据库 Schema (Drizzle ORM)

表单数据通过 Drizzle ORM 存储在 SQL 中。使用 `@agent-native/core/db/schema` 辅助函数定义 schema，使用 Drizzle 的查询构建器进行读写，以便同一代码可以在 SQLite、Postgres、libSQL/Turso、D1 和其他支持的后端上运行：

| 表           | 内容                                                           |
| ------------ | -------------------------------------------------------------- |
| `forms`      | 表单定义（标题、字段 JSON、设置 JSON、状态、slug）             |
| `responses`  | 表单提交（数据 JSON、submittedAt、formId）                     |

### 表单字段类型

表单支持以下字段类型：

- `text` — 短文本输入
- `email` — 电子邮件输入
- `number` — 数字输入
- `textarea` — 长文本/段落
- `select` — 下拉选择
- `multiselect` — 多复选框选择
- `checkbox` — 单个复选框
- `radio` — 单选按钮组
- `date` — 日期选择器
- `file` — 文件上传
- `rating` — 5 星评分
- `scale` — 数字刻度滑块

每个字段有：`id`、`type`、`label`、`placeholder`、`description`、`required`、`options`（用于 select/radio/multiselect）、`validation`（min/max/pattern）、`conditional`（基于另一个字段显示/隐藏）、`width`（full/half）。

## 纯路由 API 端点

优先使用 action 处理已认证的应用 CRUD。以下路由是当前的公共/路由形端点或在编辑此区域时要迁移的旧版实现细节。新的普通应用数据应使用 `defineAction` 加 `useActionQuery` / `useActionMutation`。

| 方法   | 路径                        | 认证   | 用途                                     |
| ------ | --------------------------- | ------ | ---------------------------------------- |
| GET    | `/api/forms`                | 是     | 列出所有表单（管理员）                   |
| POST   | `/api/forms`                | 是     | 创建表单（管理员）                       |
| GET    | `/api/forms/:id`            | 是     | 获取表单及响应计数（管理员）             |
| PATCH  | `/api/forms/:id`            | 是     | 更新表单（管理员）                       |
| DELETE | `/api/forms/:id`            | 是     | 删除表单（管理员）                       |
| GET    | `/api/forms/:id/responses`  | 是     | 列出响应（管理员）                       |
| GET    | `/api/forms/public/:slug`   | **否** | 获取已发布表单（公共）                   |
| POST   | `/api/submit/:id`           | **否** | 提交响应（公共，验证码验证）             |

## 公共 vs 管理路由

认证插件声明公共路径：

- `/f` — 公共表单填写页面
- `/api/forms/public` — 公共表单定义端点
- `/api/submit` — 公共表单提交端点

其他所有内容在生产环境中需要认证。

## 验证码配置

Cloudflare Turnstile 是可选的。设置以下环境变量以启用：

- `TURNSTILE_SECRET_KEY` — 服务器端验证密钥
- `VITE_TURNSTILE_SITE_KEY` — 客户端小部件密钥

如果未设置，验证码将被静默跳过（在没有它的情况下开发正常工作）。

## 部署

### 本地（默认）

通过 `@libsql/client` 使用本地 SQLite 开箱即用。此本地文件仅用于开发；容器、预览和无服务器部署可能会重置其文件系统。只需设置 `ACCESS_TOKEN` 用于认证。

### 持久化 SQL 数据库

本地开发默认使用 `data/app.db` 处的 SQLite 文件。该本地文件仅用于开发；容器、预览和无服务器部署可能会重置其文件系统。对于生产/云部署，将 `DATABASE_URL` 设置为指向持久化 SQL 数据库。Turso 是可选的，不是必需的；常见选择包括 Neon、Supabase、Turso/libSQL、普通 Postgres、持久化 SQLite、D1 绑定和可用时的 Builder.io 管理环境。仅当提供商需要单独令牌时（如 Turso/libSQL）才设置 `DATABASE_AUTH_TOKEN`。

真实凭据值仅属于本地 `.env` 文件、部署配置或注册的密钥/设置 UI。绝不提交、文档化、记录日志、返回、粘贴或在示例中包含真实密钥、令牌、Webhook URL、签名密钥或私有数据；使用空值或明显的占位符。

### Cloudflare Pages + D1

1. 在环境变量中设置 `NITRO_PRESET=cloudflare_pages`
2. 将 `server/db/index.ts` 切换为使用 `drizzle-orm/d1` 驱动而非 `@libsql/client`
3. 使用 D1 绑定配置 `wrangler.toml`
4. 在 Cloudflare 仪表板中设置 `TURNSTILE_SECRET_KEY` 和 `VITE_TURNSTILE_SITE_KEY`

## 构建和开发命令

```bash
pnpm dev          # 启动开发服务器（客户端 + 服务器）
pnpm build        # 生产构建
pnpm typecheck    # TypeScript 验证
pnpm test         # 运行 Vitest 测试
pnpm action <name> [--args]  # 运行一个 action
```

## 全面使用 TypeScript

此项目中的所有代码必须是 TypeScript（`.ts`）。绝不创建 `.js`、`.cjs` 或 `.mjs` 文件。Node 22+ 原生运行 `.ts` 文件，因此脚本不需要编译步骤。使用 ESM 导入（`import`），而非 CommonJS（`require`）。

## 扩展（框架功能）

框架提供了**扩展** — 在 iframe 中运行的沙盒化 Alpine.js 小应用。扩展允许用户（或智能体）创建交互式小部件、仪表板和实用工具，而无需修改应用的源代码。它们显示在侧边栏的"扩展"部分下。（与 LLM 工具不同 — LLM 工具是智能体调用的函数调用原语。）

- **创建扩展**：通过侧边栏的"+"按钮、智能体聊天或 `POST /_agent-native/extensions`
- **API 调用**：扩展使用 `extensionFetch()`（旧别名 `toolFetch`），它通过服务器代理请求并注入 `${keys.NAME}` 密钥
- **样式**：扩展自动继承主应用的 Tailwind v4 主题
- **共享**：默认为私有，可与组织或特定用户共享（与其他可拥有资源模型相同）
- **安全**：Iframe 沙盒 + CSP + 代理上的 SSRF 防护

完整实现细节请参阅 `.agents/skills/extensions/SKILL.md` 中的 `extensions` 技能。