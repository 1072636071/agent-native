# Deck Generator — 开发指南

本指南面向开发模式下编辑此应用源代码的代理。有关应用操作和工具，请参阅 AGENTS.md。

## 技术栈

- **框架**: @agent-native/core
- **包管理器**: pnpm
- **前端**: React 18, React Router 6, TypeScript, Vite, TailwindCSS 3
- **后端**: Nitro（通过 @agent-native/core）— 基于文件的 API 路由
- **UI 组件**: Radix UI 基础组件 + Lucide 图标
- **图片生成**: Google Gemini 通过 `@google/genai`
- **状态**: 通过 `/api/decks` 的 SQL 支持、内存中的撤销/重做、分享令牌
- **Logo 查询**: Logo.dev API（免费层带令牌）或 Google 图片搜索后备
- **路径别名**: `@/*` → app/, `@shared/*` → shared/

## 项目结构

```
app/                           # React SPA 前端
├── pages/                     # 路由组件
│   ├── DeckEditor.tsx         # 主编辑器页面
│   ├── DeckList.tsx           # Deck 列表 / 首页
│   └── PresentView.tsx        # 演示模式
├── components/
│   ├── editor/                # 编辑器 UI 组件
│   │   ├── EditorToolbar.tsx  # 主工具栏（布局、背景、图片、撤销/重做）
│   │   ├── EditorSidebar.tsx  # 带拖拽的幻灯片列表
│   │   ├── SlideEditor.tsx    # 幻灯片预览 / 代码编辑器
│   │   ├── ImageGenPanel.tsx  # 图片生成对话框（委托给代理聊天）
│   │   ├── HistoryPanel.tsx   # 撤销/重做历史弹出框
│   │   └── ShareDialog.tsx    # 分享链接对话框
│   ├── deck/
│   │   └── SlideRenderer.tsx  # 核心 960x540 幻灯片渲染
│   └── ui/                    # 可复用 UI 基础组件（基于 Radix）
├── data/                      # 共享数据类型和工具
├── context/
│   └── DeckContext.tsx        # 核心状态：decks、slides、撤销/重做（从 /api/decks 获取）
├── lib/
│   └── utils.ts               # cn() 工具函数
└── root.tsx               # HTML 外壳 + 全局提供者

server/                        # Nitro API 服务器
├── routes/                    # 基于文件的纯路由端点（由 Nitro 自动发现）
├── handlers/                  # 路由处理模块
│   ├── decks.ts               # GET/PUT/POST/DELETE /api/decks（基于文件的 CRUD）
│   ├── image-gen.ts           # POST /api/image-gen/generate（Gemini）
│   ├── generate-slides.ts     # POST /api/generate-slides（Gemini）
│   └── share.ts               # POST /api/share, GET /api/share/:token
├── plugins/                   # 服务器插件（启动逻辑）
└── lib/                       # 共享服务器模块

data/                          # 本地开发数据库后备

shared/                        # 客户端 + 服务器 + 脚本共享
└── api.ts                     # 类型、接口、DEFAULT_STYLE_REFERENCE_URLS

actions/                       # 共享应用操作（defineAction；UI 使用 action hooks）
├── run.ts                     # 脚本调度器
├── generate-image.ts          # 带风格参考的图片生成
├── image-gen-status.ts        # 检查 API 密钥状态
├── image-search.ts            # Google 图片搜索
└── logo-lookup.ts             # Clearbit logo URL 查询
```

## 框架基础（Nitro + @agent-native/core）

本应用使用 **Nitro**（通过 `@agent-native/core`）作为服务器。所有服务器代码位于 `server/` 中。

### 添加应用数据

普通应用数据从 action 开始，而不是自定义路由。在 `actions/<verb>-<resource>.ts` 中添加 `defineAction`，将读取标记为 `http: { method: "GET" }`，并在 React 中通过 `useActionQuery` / `useActionMutation`（来自 `@agent-native/core/client`）调用读取/写入。这使 UI 和代理保持在一个契约上，并让变更 action 自动刷新 action 支持的查询。

### 添加纯路由端点

仅在协议无法建模为 JSON action 时使用 `server/routes/api/`：多部分上传、流式/SSE/WebSocket、webhook、OAuth 回调/重定向、公共 SEO/OG 端点或二进制/静态资源服务。不要为普通 CRUD、数据查询或 action 的透传包装器添加 `/api/*` 路由；action 端点已存在于 `/_agent-native/actions/:name`。

每个纯路由端点仍然导出默认的 `defineEventHandler`，但将共享应用逻辑放在 actions 或服务器库中，这样代理和 UI 的行为就不会分叉。

### 服务器插件

启动逻辑（认证、SSE 等）位于 `server/plugins/` 中。使用 core 的 `defineNitroPlugin`：

```ts
import { defineNitroPlugin } from "@agent-native/core";

export default defineNitroPlugin(async (nitroApp) => {
  // 在服务器启动时运行一次
});
```

### `@agent-native/core` 的关键导入

| 导入                                         | 用途                                                          |
| -------------------------------------------- | ------------------------------------------------------------- |
| `defineNitroPlugin`                          | 定义服务器插件（从 Nitro 重新导出）                           |
| `createDefaultSSEHandler`                    | 为 DB 变更事件创建 SSE 端点（服务器端）                      |
| `readAppState`, `writeAppState`              | 读取/写入应用状态（来自 `@agent-native/core/application-state`）|
| `readSetting`, `writeSetting`                | 读取/写入设置（来自 `@agent-native/core/settings`）           |
| `defineEventHandler`, `readBody`, `getQuery` | H3 路由处理器工具（重新导出）                                 |
| `sendToAgentChat`                            | 从 UI 向代理发送消息（客户端）                                |
| `agentChat`                                  | 从脚本向代理发送消息（服务器端）                              |

### 数据库（云部署）

本地开发默认使用 `data/app.db` 处的 SQLite 文件。该本地文件仅用于开发；容器、预览和无服务器部署可能会重置其文件系统。对于生产/云部署，设置 `DATABASE_URL` 指向持久化的 SQL 数据库。Turso 是可选的，不是必需的；常见选择包括 Neon、Supabase、Turso/libSQL、普通 Postgres、持久化 SQLite、D1 绑定以及 Builder.io 管理的环境（如果可用）。

真实的凭据值只应存在于本地 `.env` 文件、部署配置或已注册的 secrets/settings UI 中。切勿提交、记录、记录日志、返回、粘贴或在示例中包含真实的密钥、令牌、webhook URL、签名密钥或私有数据；使用空值或明显的占位符。

**环境变量：**

| 变量                    | 是否必需                        | 描述                                                                |
| ----------------------- | ------------------------------- | ------------------------------------------------------------------- |
| `DATABASE_URL`          | 生产环境必需，本地开发不需要    | 持久化 SQL 连接字符串（本地开发默认：`file:./data/app.db`）        |
| `DATABASE_AUTH_TOKEN`   | 仅当提供者需要时                | 用于 Turso/libSQL 等提供者的认证令牌                                |

## 构建和开发命令

```bash
pnpm dev          # 启动开发服务器（客户端 + 服务器在端口 8080）
pnpm build        # 生产构建
pnpm typecheck    # TypeScript 验证
pnpm test         # 运行 Vitest 测试
pnpm action <name> [--args]  # 运行一个 action
```

## 全面使用 TypeScript

本项目中的所有代码必须是 TypeScript（`.ts`）。切勿创建 `.js`、`.cjs` 或 `.mjs` 文件。Node 22+ 原生运行 `.ts` 文件，因此脚本不需要编译步骤。使用 ESM 导入（`import`），而不是 CommonJS（`require`）。

## 扩展（框架功能）

框架提供 **Extensions** — 在 iframe 中运行的小型沙箱化 Alpine.js 应用。扩展允许用户（或代理）创建交互式小部件、仪表板和实用工具，而无需修改应用的源代码。它们显示在侧边栏的"Extensions"部分下。（与 LLM 工具不同 — LLM 工具是代理调用的函数调用原语。）

- **创建扩展**：通过侧边栏的"+"按钮、代理聊天或 `POST /_agent-native/extensions`
- **API 调用**：扩展使用 `extensionFetch()`（旧别名 `toolFetch`），它通过服务器代理请求并注入 `${keys.NAME}` 密钥
- **样式**：扩展自动继承主应用的 Tailwind v4 主题
- **分享**：默认私有，可与组织或特定用户分享（与其他可拥有资源相同的模型）
- **安全性**：Iframe 沙箱 + CSP + 代理上的 SSRF 防护

完整实现细节请参阅 `.agents/skills/extensions/SKILL.md` 中的 `extensions` 技能。