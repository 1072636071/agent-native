# Agent-Native 文档

此包构建 Agent-Native 的公共文档站点。

## 源码

- 应用路由和 UI 位于 `app/`。
- Markdown 文档由 `app/components/docs-content.ts` 从 `../core/docs/content/` 加载。
- 左侧导航为 `app/components/docsNavItems.ts`。
- 模板落地页元数据来自 `app/components/TemplateCard.tsx`。
- `scripts/generate-source-index.ts` 在生产构建前构建 `public/source-index.json`。
- `app/vite-sitemap-plugin.ts` 在 `pnpm build` 期间生成 `public/sitemap.xml`。

搜索在运行时从加载的 markdown 文档构建。没有生成的 `searchIndex.ts` 源文件。

## 开发

```bash
pnpm --filter @agent-native/docs dev
```

开发服务器通过 `agent-native dev` 在端口 3000 上运行。

## 测试

```bash
pnpm --filter @agent-native/docs test
node scripts/guard-template-list.mjs
```

模板列表守卫确保公共模板界面仅包含 `packages/shared-app-config/templates.ts` 中允许列表的模板。

## 构建

```bash
pnpm --filter @agent-native/docs build
```

构建输出到文档包的 `dist/` 目录。构建还会刷新 `public/source-index.json` 和 `public/sitemap.xml`。