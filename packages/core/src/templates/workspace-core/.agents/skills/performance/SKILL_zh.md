---
name: performance
description: >-
  保持应用和模板加载快速。在添加数据模型、列表/读取 action、加载
  数据的页面或侧边栏，或某内容加载缓慢时阅读。涵盖列投影、热路径
  查询索引、避免 N+1 和往返瀑布流、低成本轮询，以及不在每次读取
  时重新计算。
metadata:
  internal: true
---

# 性能 — 保持加载快速

## 规则

将每个列表、每次读取和每个页面加载视为一个延迟预算。两个因素主导它：**有多少数据通过网络传输**，以及**需要多少次往返和表扫描**。在托管/无服务器 SQL 后端上，每个查询都是一次网络往返，未索引的过滤器会扫描整个——通常是共享且不断增长的——表。因此默认采用**投影列**、**热路径查询索引**和**并行/批量**获取。这些规则与提供商无关：在 SQLite、Postgres 或任何托管 SQL 后端上都适用。

本技能关于数据和加载路径。有关其引用的 schema 和迁移机制，请参阅 `storing-data` 技能；有关更新如何在不轮询的情况下到达 UI，请参阅 `real-time-sync` 技能。

## 1. 投影列 — 列表中永远不要 `SELECT *`

列表/索引查询应仅选择列表实际渲染的列。

- **永远不要在列表中返回重型列**：大型 JSON/文本 blob，如文档正文、渲染的 HTML、`config`/`layout`/`spec`/`data`/`tracks`、工具结果或 base64 附件。为每一行拉取它们是列表缓慢的最常见原因。
- 重型/完整列仅属于**单项 GET/详情**路径。
- 需要从大列中获取预览？在**数据库端选择截断的子字符串**，而不是整列——并且保持可移植：

  ```ts
  // Drizzle — 投影，并为预览截断重型列
  const rows = await db
    .select({
      id: docs.id,
      title: docs.title,
      updatedAt: docs.updatedAt,
      // substr/length 在 SQLite 和 Postgres 上均可工作
      preview: sql<string>`substr(${docs.content}, 1, 400)`,
    })
    .from(docs)
    .where(accessFilter(docs, docShares))
    .orderBy(desc(docs.updatedAt));
  ```

- 缩小投影后，更新行映射器及其返回类型，使被丢弃的列在列表路径上可证明未被使用。如果列表确实渲染了重型列（缩略图、UI 显示的内联预览），保留它——不要为了追求载荷优化而破坏行为。

## 2. 索引热路径

索引通过 `server/plugins/db.ts` 中的**版本化迁移数组**以 `CREATE INDEX IF NOT EXISTS …` 的方式添加——而不是通过 schema 级别的 `index()` 辅助函数（框架通过迁移应用索引；参见 `storing-data` 技能）。为热查询**过滤或排序**的任何列添加索引。常见的有：

- **可拥有表** → `(owner_email, org_id, <列表的 ORDER BY 列>)`。
  访问范围按 owner/org 过滤，列表按 `updated_at`/`created_at` 排序。
- **Shares 表**（`{resource}_shares`）→ `(resource_id, principal_type, principal_id)`。
  访问检查在每个列表上运行关联的 `EXISTS` 子查询。
- **子表/外键列**，用于加载子记录（如 `responses.form_id`、`comments.parent_id`、事件日志的 `*_id`）→ 索引 FK，加上子记录排序时的排序列。未索引的 FK 意味着每次打开父记录时都要对子表进行全表扫描。**外键引用不会自动创建索引**——必须显式添加。
- **状态过滤列表** → 匹配实际的 `WHERE`，如 `(owner_email, status)` 或 `(status, <sort>)`。

保持索引 DDL **方言无关且幂等**：

```sql
CREATE INDEX IF NOT EXISTS forms_owner_org_updated_idx ON forms (owner_email, org_id, updated_at)
```

不要 `DESC`，不要部分 `WHERE`，不要提供商特定语法——这样它在 SQLite 和 Postgres 上都能运行，可以安全地重复执行，并在下次启动时应用。索引主要在**数据增长时**和**无界子表**上产生问题（10 行的顺序扫描是即时的；共享的、不断增长的日志则不是），所以优先索引增长的表。

## 3. 不要扇出查询 — 批量和并行化

- **不要 N+1。** 永远不要循环对每个项发出一次查询。用一个 `inArray(child.parentId, ids)` 查询加载多个父记录的子记录，然后在内存中分组。
- **在 SQL 中计数**（`count()`），永远不要"选择所有行然后 `.length`"。
- 用 `Promise.all` **并行化独立查询**，而不是顺序 `await`——每个 `await` 都是又一次往返。
- 优先使用**一个组合端点**，而不是多个依赖调用。

## 4. 避免客户端瀑布流

- 除非查询 B 确实需要查询 A 的结果，否则不要让 B 等待 A。**并行**触发独立的 `useActionQuery` / `useQuery` 钩子；永远不要让加载骨架等待串行链。
- 尽可能从一个读取加载可见页面，并在首次绘制后**懒加载**次要/首屏下方数据。

## 5. 低成本轮询；计算一次

- 更新已通过 `real-time-sync` 技能（`useDbSync` / SSE）到达 UI。不要添加激进的 `refetchInterval`，每隔几秒重新运行一个重型列表/读取。如果必须轮询，使用**较宽的间隔**和**廉价的**端点。
- **永远不要在每次加载/轮询时运行的读取上做昂贵的逐请求工作**：重新渲染 HTML/markdown、美化打印、重新解析/迁移/规范化/清理存储的 JSON。在**写入时**完成这些工作（存储结果），或仅为需要它的调用者**懒计算**。热路径上的读取必须是廉价的。
- UI 不显示的数据（导出格式、替代渲染）属于单独的按需 action，不要烘焙到热读取中。

## 6. 大载荷和长列表

- 对无界列表（消息、响应、事件、活动）**分页或窗口化**。不要在打开时加载全部历史；加载最近的窗口并按需获取更早的。
- 不要在列表/加载拉取的行中**内联存储无界 blob**。将大型内容单独引用，这样打开父记录仍然廉价。
- 在客户端**虚拟化**非常长的渲染列表，使屏幕外的行不在每次更新时被解析/渲染。

## 检查清单 — 在发布列表/读取或新表之前运行

- [ ] 列表仅选择显示的列；重型 blob 已排除或 `substr` 截断。
- [ ] 每个热路径 `WHERE` / `ORDER BY` 列都已通过 `db.ts` 迁移索引（owner/org/sort、shares `resource_id`、子表 FK、状态过滤器）。
- [ ] 没有 N+1；独立查询已并行化；计数通过 SQL `count()`。
- [ ] 客户端并行触发独立查询，而非瀑布流。
- [ ] 每次读取没有重型重计算；没有对重型端点的激进轮询。
- [ ] 无界列表已分页/窗口化；大型 blob 未内联在热路径上。