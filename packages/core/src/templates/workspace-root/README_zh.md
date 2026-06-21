# {{APP_TITLE}} — Agent-Native 工作区

一个托管多个 agent-native 应用的 monorepo，所有应用都继承自一个私有的 **shared** 包。框架提供默认值；此包仅用于真正被多个应用共享的代码、指令和策略。

## 布局

```
{{APP_NAME}}/
├── packages/
│   └── shared/               # @{{APP_NAME}}/shared — 可选的共享代码
│       ├── src/server/       # 仅在需要时添加插件覆盖
│       ├── src/client/       # 仅在需要时添加共享 React 代码
│       └── AGENTS.md         # 工作区范围的代理指令
└── apps/
    └── example/              # 应用特定的路由、actions 和状态
```

## 三层继承

此工作区中的每个应用自动继承跨切面行为：

1. **应用本地**（最高优先级）— `apps/<name>/server/plugins/`、`apps/<name>/actions/`、`apps/<name>/.agents/skills/`、`apps/<name>/AGENTS.md` 下的任何内容。
2. **工作区共享**（中间层）— `packages/shared/src/server/`、`packages/shared/src/client/`、`packages/shared/actions/`、`packages/shared/.agents/skills/`、`packages/shared/AGENTS.md`。
3. **框架**（最低优先级）— `@agent-native/core` 默认值。

应用无需任何配置即可加入。发现机制通过此根 `package.json` 中的 `agent-native.workspaceCore` 字段实现，该字段命名了共享包（`@{{APP_NAME}}/shared`）。

工作区根还将 `.agents/skills` 链接到共享包，以便从根启动的编码代理可以发现相同的工作区范围技能。

运行时可编辑的全局资源位于 Dispatch 中，而非 `packages/shared`。使用 Dispatch **Resources** 管理管理员应在不部署代码的情况下更改的公司上下文和护栏：

- `AGENTS.md` 或 `instructions/<slug>.md` 用于每个应用代理加载的指令
- `skills/<slug>/SKILL.md` 用于工作区技能
- `context/<slug>.md` 用于角色、定位、消息、公司事实和品牌指南
- `agents/<slug>.md` 用于可重用的自定义代理配置

当每个工作区应用都应接收这些资源时，将它们设置为**所有应用**；对应用特定的包使用选定应用授权。

初始全局资源：

```text
context/company.md              # 公司概览、ICP、产品、规范链接
context/brand.md                # 品牌声音、视觉识别、拼写、避免的术语
context/messaging.md            # 定位、价值主张、证明点、异议
instructions/guardrails.md      # 合规、升级和审批规则
skills/company-voice/SKILL.md   # 面向客户工作的文案/审查指南
```

## 入门

```bash
pnpm install
cp .env.example .env   # 填写 DATABASE_URL、BETTER_AUTH_SECRET 和 LLM 提供商密钥
pnpm repair:workspace-org -- --name "Example Co" --domain example.com --owner-email owner@example.com
pnpm dev               # 启动工作区网关；存在 Dispatch 时打开
```

开发网关在保留推荐的 Dispatch 应用时，在 `/dispatch` 提供 Dispatch，每个应用在其自己的路径如 `/chat` 提供。它监视 `apps/`，因此新创建的应用无需重启 `pnpm dev` 即可被检测到。应用服务器在你首次访问其路径时延迟启动。应用链接应保持相对路径，如 `/chat` 或 `/<app-id>`；不要硬编码 localhost 或开发端口，因为活动的网关源拥有端口。

Dispatch vault 密钥默认是工作区范围的：每个保存的 vault 密钥对每个工作区应用都可用，并可从 Dispatch 同步。仅在你需要显式的按应用密钥授权时，将 Vault 页面切换为仅手动访问。Dispatch 资源是继承而非同步的：所有应用资源在工作区范围只存在一次，每个应用代理在运行时读取它们。仅对真正应用特定的上下文使用选定资源授权。

## 工作区组织身份

在生产部署前或修复跨应用信任时，设置这些根 `.env` 值：

- `WORKSPACE_ORG_NAME` — 用户应看到的组织名称。
- `WORKSPACE_ORG_DOMAIN` — 用于组织匹配的裸邮箱/域名声明。
- `WORKSPACE_OWNER_EMAIL` — 用于引导或集成回退的所有者/管理员邮箱。
- `A2A_SECRET` — 跨应用 A2A 调用的共享签名密钥。

运行 `pnpm repair:workspace-org -- --name "<org>" --domain example.com --owner-email owner@example.com` 来填充或验证这些值，而无需提交密钥。现有组织行仍应尽可能通过应用的组织设置 UI 或认证的组织路由进行修复。

## 添加新应用

```bash
pnpm exec agent-native create crm --template=chat
```

CLI 检测工作区根并搭建一个已依赖 `@{{APP_NAME}}/shared` 的最小启动应用。仅编辑你关心的路由；认证、组织切换、技能和指令来自共享包。源模板仅是脚手架：完成的应用应使用自己的名称、主屏幕、导航、包元数据和清单，而不是保留启动或新应用的 UI。如果请求从生产环境的 Dispatch 发起，Dispatch 会将其发送到 Builder 分支创建；该分支仍应添加一个新的 `apps/<app-id>` 工作区应用，而不是编辑现有应用目录。Dispatch 从 `apps/<app-id>/package.json` 发现就绪的应用；没有单独的工作区应用注册表需要编辑。React Router 应用必须通过 `appBasePath()` 在 `app/entry.client.tsx` 中保留 `APP_BASE_PATH` / `VITE_APP_BASE_PATH`，以便 `/<app-id>` 正确水合。对于表述为创建"代理"的请求，先分类范围：简单的循环 Dispatch 行为可以留在 Dispatch 中，而健壮的类应用队友应成为与其他应用并列的真正工作区应用。Mail、Calendar、Analytics、Brain、Assets 和 Dispatch 等第一方应用应被视为现有的托管或连接的邻居。如果新应用需要访问它们的数据或代理，通过工作区/A2A 路径链接/委托给这些应用，而不是在新应用内创建包装应用、子应用或克隆的模板副本。仅当用户明确要求自定义副本时才分叉其中一个应用。

## 编辑共享行为

当多个应用需要时，将跨切面代码放在 `packages/shared/` 中。例如，从 `packages/shared/src/server/index.ts` 导出 `authPlugin` 可以让每个应用在下一次开发重载时使用相同的认证自定义。