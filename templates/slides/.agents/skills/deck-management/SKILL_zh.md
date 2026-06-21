---
name: deck-management
description: 演示文稿如何存储在 SQL 中，如何创建/读取/更新/删除演示文稿。在处理演示文稿数据之前阅读。
---

# 演示文稿管理

演示文稿通过 Drizzle ORM 存储在 `decks` SQL 表中。每个演示文稿行在 `data` TEXT 列中包含完整的演示文稿 JSON（幻灯片、元数据）。

## Schema

```sql
CREATE TABLE decks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  data TEXT NOT NULL,       -- 完整的演示文稿 JSON（slides 数组、元数据）
  created_at TEXT DEFAULT (current_timestamp),
  updated_at TEXT DEFAULT (current_timestamp)
);
```

## 演示文稿 JSON 结构

`data` 列存储一个 JSON 对象：

```json
{
  "title": "My Presentation",
  "slides": [
    {
      "id": "slide-1",
      "content": "<div class=\"fmd-slide\" style=\"...\">...</div>",
      "layout": "title"
    },
    {
      "id": "slide-2",
      "content": "<div class=\"fmd-slide\" style=\"...\">...</div>",
      "layout": "content"
    }
  ]
}
```

每张幻灯片有一个 `id`、HTML `content` 和可选的 `layout` 类型。

## 读取演示文稿

**从脚本：**

```bash
# 列出所有演示文稿（仅元数据）
pnpm action list-decks

# 获取特定演示文稿及所有幻灯片
pnpm action get-deck --id=<deckId>

# 查看用户正在查看的内容
pnpm action view-screen
```

**从 API：**

- `GET /api/decks` -- 列出所有演示文稿（返回 id、title、幻灯片数量、时间戳）
- `GET /api/decks/:id` -- 获取单个演示文稿及完整数据

## 写入演示文稿

**从脚本：**

```bash
# 使用 db-exec 插入/更新
pnpm action db-exec --sql "INSERT INTO decks (id, title, data) VALUES (?, ?, ?)" --params '["new-id", "Title", "{...}"]'
```

**从 API：**

- `POST /api/decks` -- 创建新演示文稿
- `PUT /api/decks/:id` -- 更新现有演示文稿
- `DELETE /api/decks/:id` -- 删除演示文稿

## 重要规则

1. **始终使用 API 或 Drizzle** — 切勿为演示文稿存储写入原始 JSON 文件
2. **演示文稿 ID 是稳定的** — 一旦创建，演示文稿的 ID 不会改变
3. **演示文稿内的幻灯片 ID 是稳定的** — 用于引用特定幻灯片
4. **`data` 列是完整的真实来源** — title 在顶层重复用于列表查询
5. **SSE 事件**（`source: "resources"`）在演示文稿更改时触发，保持 UI 同步