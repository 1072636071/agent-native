# Neon 预览分支 — 按 PR 数据库隔离

预览部署默认共享生产 `DATABASE_URL`，因此任何触及数据库的服务器冷启动都会写入生产环境。为了隔离预览部署，我们通过 GitHub Actions 使用 Neon 的写时复制分支。

## 工作原理

1. **PR 打开/更新** — `.github/workflows/neon-preview-branches.yml` 为每个托管模板的 Neon 项目创建一个 Neon 分支（`preview/pr-<number>`），然后在相应 Netlify 站点的 deploy-preview 上下文中设置 `NETLIFY_DATABASE_URL`。

2. **Netlify 自动部署** — 每个模板的 `netlify.toml` 构建命令以 `export DATABASE_URL=${NETLIFY_DATABASE_URL:-$DATABASE_URL}` 开始。当 `NETLIFY_DATABASE_URL` 被设置时（预览），构建和运行时使用分支数据库。当未设置时（生产），它们回退到真实的 `DATABASE_URL`。

3. **PR 关闭** — 工作流删除 Neon 分支并移除 `NETLIFY_DATABASE_URL` 环境变量覆盖。

`@agent-native/core` 保持 provider 无关 — 它只读取 `DATABASE_URL`。Neon/Netlify 的具体细节存在于工作流和每个模板的 `netlify.toml` 中。

## 必需的 GitHub 密钥

| 密钥                 | 从哪里获取                                     |
| -------------------- | ---------------------------------------------- |
| `NEON_API_KEY`       | Neon 仪表板 → Account → API Keys               |
| `NETLIFY_AUTH_TOKEN` | Netlify User Settings → Personal Access Token  |
| `NETLIFY_ACCOUNT_ID` | Netlify 团队设置 → Team ID                     |

## 恢复生产环境变量

预览数据库覆盖由 GitHub Actions 管理，但生产模板密钥不是。如果 Netlify 项目在迁移期间丢失了环境变量，从本地忽略的模板 env 文件恢复：

```bash
pnpm sync:netlify-env -- --template clips
NETLIFY_AUTH_TOKEN=... NETLIFY_ACCOUNT_ID=... pnpm sync:netlify-env -- --template clips --write
```

脚本默认为 dry-run，仅记录键名，写入生产上下文，并将真实密钥标记为 Netlify 密钥值，同时将公共部署元数据保持明文，以便 Netlify 的密钥扫描器不会阻止部署。它合并 `templates/<name>/.env` 和 `templates/<name>/.env.local`，因为某些部署相关的认证密钥（如 `BETTER_AUTH_SECRET`）目前存在于 `.env.local` 中。传递 `--all` 以恢复每个已知模板站点。

## 站点 ↔ Neon 项目映射

在工作流的矩阵中定义。添加新的托管模板时更新它。

| 模板      | Neon 项目 ID            | Netlify 站点 ID                      |
| --------- | ----------------------- | ------------------------------------ |
| analytics | dry-shadow-75673589     | ba983662-dac4-478d-a481-5079e67e4d33 |
| calendar  | super-fire-75593365     | 954fe53b-052e-4401-aac2-2e973e498af8 |
| clips     | aged-glitter-95425960   | 7e3f4fee-258d-4d16-9aaf-154a714e87e2 |
| content   | quiet-heart-51077706    | 5c2198f5-bee4-41c3-8a6d-4869f400eec2 |
| forms     | curly-glade-91979555    | aa0b2020-9983-4d6c-8fb0-65462f960fc4 |
| issues    | crimson-wave-50288362   | 76b94d46-f566-43cd-bddd-01123137ab9a |
| mail      | patient-cake-44789837   | dee98bb0-6143-4205-8c04-afe7bf83d5b5 |
| plan      | late-pine-39936033      | 9d0d7a73-385d-4da1-ba10-1581ffc4d413 |
| slides    | hidden-thunder-16834477 | fd5deb5b-5539-47e1-830c-e5fb5e105efd |
| videos    | soft-pine-75308618      | 3f0c2cd2-06cd-4ab8-bfb4-c199430d1dac |

## Schema 更改

`drizzle-kit push` 不在任何构建中运行（在导致生产数据丢失后已移除 — 见 PR #252）。Schema 演进使用每个模板的 `server/plugins/db.ts` 中的 `runMigrations` — 仅限附加 SQL（`CREATE TABLE IF NOT EXISTS`、`ALTER TABLE ADD COLUMN IF NOT EXISTS`）。

## 后续工作

- **Agent-Native Plans DNS/TLS。** Plans Neon 项目和 Netlify 站点已配置并包含在预览分支工作流中。要完成公共切换，`plan.agent-native.com` 应解析为仅 DNS 的 CNAME 到 `agent-native-plan.netlify.app`；然后在 Netlify 中配置/验证 TLS。

- **PR 可视回顾发布。** 当 `PLAN_RECAP_TOKEN` 包含发布令牌时，PR 自动化可以默认将组织门控的可视回顾 plan 发布到托管的 Plans 应用。仅对自托管的 Plans 应用设置 `PLAN_RECAP_APP_URL`。回顾链接是审查辅助工具；它们不替代 GitHub diff 审查。

- **仅预览操作。** 涉及数据库外部的 action（发送邮件、扣款、发 Slack 消息）需要自己的预览 vs 生产门控，以便预览部署不会触发真实世界的副作用。