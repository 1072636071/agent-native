# 扩展 API 参考

这是注入到每个扩展 iframe 的辅助函数和全局变量的详尽参考，以及向后兼容命名表。有关模型和使用时机概述，请参阅 `../SKILL_zh.md`。有关完整的 HTML 示例，请参阅 `examples_zh.md`。

## 访问应用数据

扩展可以直接调用宿主应用的 action 和 API 端点。iframe 共享会话 cookie，因此认证是自动的。

### `appAction(name, params)` — 调用应用 action

调用应用 `actions/` 目录中定义的任何 action。Action 自动挂载在 `/_agent-native/actions/:name`。

```html
<div
  x-data="{ emails: [], loading: true }"
  x-init="
  appAction('list-emails', { view: 'inbox', limit: 10 })
    .then(d => { emails = d.emails || d; loading = false })
    .catch(e => { console.error(e); loading = false })
"
>
  <h2 class="text-lg font-semibold mb-4">My Inbox</h2>
  <template x-for="email in emails" :key="email.id">
    <div class="rounded-lg border p-3 mb-2">
      <p class="font-medium text-sm" x-text="email.subject"></p>
      <p
        class="text-xs text-muted-foreground"
        x-text="email.from?.name || email.from?.email"
      ></p>
    </div>
  </template>
</div>
```

### `appFetch(path, options)` — 调用允许的框架端点

对允许的框架端点（如 `/_agent-native/application-state/navigation`）的通用 fetch。自动添加凭证和 JSON 内容类型。模板 `/api/*` 路由被扩展桥接有意阻止；请改用 `appAction(name, params)` 处理应用数据。

```javascript
// 读取 application state
const nav = await appFetch("/_agent-native/application-state/navigation");

// 调用框架路由
const nav = await appFetch("/_agent-native/application-state/navigation");
```

### `dbQuery(sql)` — 从应用数据库读取

对应用的 SQL 数据库运行只读 SELECT 查询。结果自动限定为当前用户/组织。

```html
<div
  x-data="{ rows: [] }"
  x-init="
  dbQuery('SELECT id, name FROM tools ORDER BY created_at DESC LIMIT 10')
    .then(d => rows = d.rows || d)
"
>
  <template x-for="row in rows" :key="row.id">
    <div class="border-b p-2 text-sm" x-text="row.name"></div>
  </template>
</div>
```

> 物理 SQL 表仍然命名为 `tools`（以及 `tool_data`、`tool_shares`）以保持向后兼容。Drizzle 导出为 `extensions`、`extensionData` 和 `extensionShares`——通过 ORM 查询时使用这些名称。在扩展内编写原始 SQL（如上）时，使用物理名称。

### `dbExec(sql)` — 写入应用数据库

运行 INSERT、UPDATE 或 DELETE 语句。写入自动限定为当前用户/组织，`owner_email` / `org_id` 在 INSERT 时自动注入。

```javascript
// 插入新记录
await dbExec(
  "INSERT INTO notes (id, title, body) VALUES ('abc', 'My Note', 'Hello world')",
);

// 更新现有记录
await dbExec("UPDATE notes SET title = 'Updated Title' WHERE id = 'abc'");
```

### 所有辅助函数摘要

| 辅助函数                                           | 用途                                                  | 示例                                                                                                          |
| ------------------------------------------------ | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `appAction(name, params)`                        | 调用应用 action（CRUD、查询）                         | `appAction('list-emails', { view: 'inbox' })`                                                                    |
| `appFetch(path, options)`                        | 调用允许的框架端点                         | `appFetch('/_agent-native/application-state/navigation')`                                                        |
| `dbQuery(sql)`                                   | 从应用的 SQL 数据库读取                         | `dbQuery('SELECT * FROM notes LIMIT 10')`                                                                        |
| `dbExec(sql)`                                    | 写入应用的 SQL 数据库                          | `dbExec("INSERT INTO notes ...")`                                                                                |
| `extensionFetch(url, options)`                   | 通过代理调用外部 API（别名 `toolFetch`）         | `extensionFetch('https://api.github.com/user', { headers: { 'Authorization': 'Bearer ${keys.GITHUB_TOKEN}' } })` |
| `extensionData.set(collection, id, data, opts?)` | 将项目保存到扩展存储（别名 `toolData.set`） | `extensionData.set('todos', 'todo-1', { title: 'Buy milk' })`                                                    |
| `extensionData.list(collection, opts?)`          | 列出集合中的项目                               | `extensionData.list('todos', { scope: 'all' })`                                                                  |
| `extensionData.get(collection, id, opts?)`       | 按 id 获取单个项目                                  | `extensionData.get('todos', 'todo-1')`                                                                           |
| `extensionData.remove(collection, id, opts?)`    | 删除项目                                           | `extensionData.remove('todos', 'todo-1')`                                                                        |

## 持久化自定义数据

扩展通过 `extensionData`（旧版别名：`toolData`）拥有内置的键值存储。每个扩展都有自己的隔离存储，按集合组织。每个方法接受一个可选的 `{ scope }` 选项：

- `'user'`（默认）— 当前用户私有
- `'org'` — 用户组织中的所有人都可见
- `'all'`（仅 list/get）— 返回用户和组织项目

```javascript
// 保存私有项目（默认范围：'user'）
await extensionData.set("todos", "todo-1", { title: "Buy milk", done: false });

// 保存组织共享项目
await extensionData.set(
  "todos",
  "team-todo-1",
  { title: "Ship v2", done: false },
  { scope: "org" },
);

// 列出用户项目（默认）
const myTodos = await extensionData.list("todos");

// 列出组织项目
const orgTodos = await extensionData.list("todos", { scope: "org" });

// 列出用户 + 组织项目
const allTodos = await extensionData.list("todos", { scope: "all" });
// 返回：[{ id, toolId, collection, data (JSON 字符串), ownerEmail, scope, orgId, createdAt, updatedAt }]
// （行列仍命名为 `toolId` 以保持向后兼容——它是扩展 id）

// 解析 JSON 数据
const parsed = allTodos.map((t) => ({
  ...JSON.parse(t.data),
  id: t.id,
  scope: t.scope,
}));

// 带范围的获取/删除
const item = await extensionData.get("todos", "team-todo-1", { scope: "org" });
await extensionData.remove("todos", "team-todo-1", { scope: "org" });
```

数据按扩展范围限定。用户范围的项目按用户私有；组织范围的项目在整个组织中共享。任何组织成员都可以读取、更新或删除组织范围的项目。**对于扩展特定的持久化，优先使用 `extensionData` 而非原始 `dbExec`**——它自动处理表创建、范围限定和 upsert。

## 使用 `extensionFetch()` 进行 API 调用

`extensionFetch()`（旧版别名 `toolFetch()`）是 `fetch()` 的即插即用替代品，通过服务器代理请求。服务器在请求发出前注入密钥值。

```javascript
// 基本 GET
const res = await extensionFetch("https://api.example.com/data");
const data = await res.json();

// 带密钥注入
const res = await extensionFetch("https://api.openai.com/v1/models", {
  headers: {
    Authorization: "Bearer ${keys.OPENAI_API_KEY}",
  },
});

// 带 body 的 POST
const res = await extensionFetch("https://api.example.com/items", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "New Item" }),
});
```

**重要：** 在包含 `${keys.NAME}` 的字符串周围使用单引号，以防止 JavaScript 模板字面量求值。替换在服务端进行，而非浏览器中。

## Tailwind 类

扩展继承主应用的 Tailwind v4 主题。使用相同的工具类：

- **颜色：** `bg-background`、`text-foreground`、`bg-primary`、`text-primary-foreground`、`text-muted-foreground`、`border-border`、`bg-accent`、`bg-destructive`
- **布局：** `flex`、`grid`、`space-y-2`、`gap-4`、`p-4`、`m-2`
- **排版：** `text-sm`、`text-lg`、`font-medium`、`font-bold`
- **边框：** `border`、`rounded-lg`、`rounded-md`、`rounded-sm`
- **暗色模式：** 通过 html 元素上的 `.dark` 类自动切换

## 管理密钥

扩展通过 `extensionFetch()` 调用内的 `${keys.NAME}` 引用密钥。通过以下方式创建密钥：

```
POST /_agent-native/secrets/adhoc
{ "name": "GITHUB_TOKEN", "value": "<TOKEN_VALUE_FROM_USER_SETTINGS>", "description": "GitHub PAT", "urlAllowlist": ["https://api.github.com"] }
```

或者用户可以在设置 UI 中添加它们。如果扩展需要尚未配置的 API 密钥，告诉用户需要什么密钥以及在哪里获取。永远不要编造 PAT 形式的值或将密钥存储在扩展 HTML、`extensionData` 或示例中。

有关完整的密钥 API，请参阅 `secrets` 技能。

## 共享

使用框架共享 action：

```bash
# 使扩展对组织可见
pnpm action set-resource-visibility --resourceType=tool --resourceId=EXTENSION_ID --visibility=org

# 与特定用户共享
pnpm action share-resource --resourceType=tool --resourceId=EXTENSION_ID --principalType=user --principalId=user@example.com --role=editor

# 列出当前共享
pnpm action list-resource-shares --resourceType=tool --resourceId=EXTENSION_ID
```

> `resourceType` 值仍为 `tool` 以保持与 `tool_shares` 表的向后兼容。变量名 `EXTENSION_ID` 是传入调用值的规范名称。

有关可见性级别和角色，请参阅 `sharing` 技能。

## 导航

```bash
# 导航到扩展列表
pnpm action navigate --view=extensions

# 导航到特定扩展
pnpm action navigate --view=extensions --extensionId=EXTENSION_ID

# 或直接：
set-url-path({ "pathname": "/extensions/EXTENSION_ID" })
```

## 路由

| 方法 | 路径                                   | 用途                                       |
| ------ | -------------------------------------- | --------------------------------------------- |
| GET    | `/_agent-native/extensions`            | 列出扩展（按所有权/共享过滤） |
| POST   | `/_agent-native/extensions`            | 创建扩展                           |
| GET    | `/_agent-native/extensions/:id`        | 获取扩展                              |
| PUT    | `/_agent-native/extensions/:id`        | 更新（支持 `patches` 用于差异）       |
| DELETE | `/_agent-native/extensions/:id`        | 删除扩展                           |
| GET    | `/_agent-native/extensions/:id/render` | 为 iframe 渲染 HTML                        |
| POST   | `/_agent-native/extensions/proxy`      | 带密钥注入的认证代理     |

## 数据库与 API 名称 — 向后兼容参考

从 "tools" 到 "extensions" 的重命名主要是面向用户的。多个底层名称被保留以避免破坏现有数据和代码：

| 界面                           | 保持为             | 原因                                                   |
| --------------------------------- | -------------------- | ----------------------------------------------------------- |
| 扩展的 SQL 表          | `tools`              | 重命名表 = drop+create；数据不能移动          |
| 每个扩展数据的 SQL 表        | `tool_data`          | 相同                                                        |
| 扩展共享的 SQL 表          | `tool_shares`        | 相同                                                        |
| 扩展历史的 SQL 表         | `tool_history`       | 相同的 DB 命名家族                                       |
| Drizzle schema 导出             | `extensions`         | 代码侧重命名 — 无需数据迁移                 |
| Drizzle schema 导出             | `extensionData`      | 相同                                                        |
| Drizzle schema 导出             | `extensionShares`    | 相同                                                        |
| Iframe 全局变量（旧版别名）      | `toolFetch`          | 保留以使旧版扩展主体继续工作                 |
| Iframe 全局变量（旧版别名）      | `toolData`           | 相同                                                        |
| Iframe 全局变量（规范）         | `extensionFetch`     | 在新扩展中使用此项                                  |
| Iframe 全局变量（规范）         | `extensionData`      | 相同                                                        |
| `data-tool-layout` HTML 属性 | 不变            | 运行时契约；不值得变更                        |
| 共享的 `resourceType`        | `tool`               | 匹配 `tool_shares` 表                                 |
| 插槽系统表                 | `tool_slots`         | Drizzle 导出为 `extensionSlots`（见 `extension-points`） |
| 插槽安装表               | `tool_slot_installs` | Drizzle 导出为 `extensionSlotInstalls`                   |