---
name: performance
description: >-
  保持应用和模板加载快速。在添加数据模型、列表/读取 action、加载
  数据的页面或侧边栏时，或当某些东西加载缓慢时阅读。涵盖列投影、
  索引热路径查询、避免 N+1 和往返瀑布流、廉价轮询以及不在
  每次读取时重新计算。
metadata:
  internal: true
---

# 性能——保持加载快速

## 规则

将每个列表、每个读取和每个页面加载视为延迟预算。两件事主导它：**多少数据通过网络**，以及**需要多少次往返和表扫描**。在托管/无服务器 SQL 后端上，每个查询是一次网络往返，未索引的过滤器会扫描整个——通常是共享且不断增长的——表。因此默认使用**投影列**、**索引热路径查询**和**并行/批量**获取。这些规则是提供商无关的：它们在 SQLite、Postgres 或任何托管 SQL 后端上都成立。

此 skill 是关于数据和加载路径的。参见 `storing-data` skill 了解它引用的 schema 和迁移机制，参见 `real-time-sync` skill 了解更新如何已经通过轮询到达 UI。

## 1. 投影列——列表上永远不要 `SELECT *`

列表/索引查询应仅选择列表实际渲染的列。

- **永远不要在列表中返回重型列**：大型 JSON/文本 blob，如文档正文、渲染的 HTML、`config`/`layout`/`spec`/`data`/`tracks`、工具结果或 base64 附件。为每行拉取它们是慢列表最常见的原因。
- 重型/完整列仅属于**单项 GET/详情**路径。
- 需要大列的预览？在数据库选择**截断子字符串**，而不是整列——且保持可移植：

  ```ts
  // Drizzle — 投影，并为预览截断重型列
  const rows = await db
    .select({
      id: docs.id,
      title: docs.title,
      updatedAt: docs.updatedAt,
      // substr/length 在 SQLite 和 Postgres 上都可以工作
      preview: sql<string>`substr(${docs.content}, 1, 400)`,
    })
    .from(docs)
    .where(accessFilter(docs, docShares))
    .orderBy(desc(docs.updatedAt));
  ```

- 缩小投影后，更新行映射器及其返回类型，这样被丢弃的列在列表路径上可证明未使用。如果列表确实渲染了一个重型列（缩略图、UI 显示的内联预览），保留它——不要为了追求负载优化而破坏行为。

## 2. 索引热路径

索引通过 `server/plugins/db.ts` 中的**版本化迁移数组**以 `CREATE INDEX IF NOT EXISTS …` 添加——而不是通过 schema 级别的 `index()` 辅助函数（框架通过迁移应用索引；见 `storing-data` skill）。为热查询**过滤或排序**的任何列添加索引。常见的有：

- **可拥有表** → `(owner_email, org_id, <列表的 ORDER BY 列>)`。
  访问范围限定按 owner/org 过滤，列表按 `updated_at`/`created_at` 排序。
- **共享表**（`{resource}_shares`） → `(resource_id, principal_type, principal_id)`。
  访问检查在每个列表上对这些运行关联的 `EXISTS` 子查询。
- **子/外键列**用于加载子项（如 `responses.form_id`、`comments.parent_id`、事件日志的 `*_id`） → 索引 FK，加上子项排序时的排序列。未索引的 FK 意味着每次父项打开时对子表的完整扫描。**外键引用不会自动创建索引**——显式添加它。
- **状态过滤列表** → 匹配真实的 `WHERE`，如 `(owner_email, status)` 或 `(status, <sort>)`。

保持索引 DDL **方言无关且幂等**：

```sql
CREATE INDEX IF NOT EXISTS forms_owner_org_updated_idx ON forms (owner_email, org_id, updated_at)
```

不要 `DESC`、不要部分 `WHERE`、不要提供商特定的语法——这样它在 SQLite 和 Postgres 上都可以运行，可以安全地重新运行，并在下次启动时应用。索引主要在**数据增长时**和**无界子表**上造成影响（10 行的顺序扫描是即时的；共享的、不断增长的日志则不是），所以优先索引增长的表。

## 3. 不要扇出查询——批量和并行化

- **不要 N+1。** 永远不要循环为每个项目发出一个查询。在一个 `inArray(child.parentId, ids)` 查询中为多个父项加载子项，然后在内存中分组。
- **在 SQL 中计数**（`count()`），永远不要"选择所有行然后 `.length`"。
- **并行化独立查询**使用 `Promise.all` 而不是顺序 `await`——每个 `await` 是另一次往返。
- 优先使用**一个组合端点**而不是多个依赖调用。

## 4. 避免客户端瀑布流

- 除非 B 确实需要 A 的结果，否则不要让查询 B 等待查询 A 的结果。**并行**触发独立的 `useActionQuery` / `useQuery` hook；永远不要让加载骨架等待串行链。
- 尽可能从一个读取加载可见页面，并在首次绘制后**懒加载**次要/折叠线以下的数据。

## 5. 廉价轮询；计算一次

- 更新已经通过 `real-time-sync` skill（`useDbSync` / SSE）到达 UI。
  不要添加激进的 `refetchInterval` 每隔几秒重新运行重型列表/读取。如果必须轮询，使用**宽间隔**和**廉价**端点。
- **永远不要在每次加载/轮询运行的读取上做昂贵的每请求工作**：
  重新渲染 HTML/markdown、美化打印、重新解析/迁移/规范化/清理存储的 JSON。在**写入时**做该工作（存储结果）或仅**为需要它的调用者懒计算**。热路径上的读取必须廉价。
- UI 不显示的数据（导出格式、替代渲染）属于单独的按需 action，不要烘焙到热读取中。

## 6. 大负载和长列表

- **分页或窗口化**无界列表（消息、响应、事件、活动）。
  不要在打开时加载整个历史；加载最近的窗口并按需获取更旧的。
- 不要在列表/加载拉取的行中**内联存储无界 blob**。
  单独引用大型内容，这样打开父项保持廉价。
- 在客户端**虚拟化**非常长的渲染列表，这样屏幕外的行不会在每次更新时被解析/渲染。

## 检查清单——在发布列表/读取或新表之前运行

- [ ] 列表仅选择显示的列；重型 blob 被排除或 `substr` 截断。
- [ ] 每个热路径 `WHERE` / `ORDER BY` 列通过 `db.ts` 迁移被索引（owner/org/sort、
      共享 `resource_id`、子 FK、状态过滤器）。
- [ ] 没有 N+1；独立查询已并行化；计数通过 SQL `count()`。
- [ ] 客户端并行触发独立查询，不是瀑布流。
- [ ] 每次读取上没有重型重新计算；没有重型端点的激进轮询。
- [ ] 无界列表已分页/窗口化；大型 blob 未在热路径上内联。