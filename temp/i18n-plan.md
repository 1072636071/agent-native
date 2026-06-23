# Agent Native 国际化（i18n）方案

> 版本: v1.0 | 日期: 2026-06-21 | 作者: 小代 ⚡

---

## 一、目标

为 Agent Native 项目的全部 UI 面（桌面端、移动端、Web 文档站、Dev Frame、Code Agents UI 组件库）实现国际化，支持中英文一键切换，默认中文，切换按钮在所有界面可见且固定位置。

---

## 二、项目现状分析

### 2.1 技术栈总览

| 应用面 | 技术栈 | 构建工具 | 路由 |
|--------|--------|---------|------|
| `desktop-app` | React 19 + TypeScript + Electron 41 | electron-vite (Vite 8) | 无路由，状态驱动视图 |
| `mobile-app` | React Native 0.83 + Expo 55 | Metro + Babel | expo-router |
| `docs` | React 19 + TypeScript SSR | Vite 6 + React Router 7 | 文件系统路由 |
| `frame` | React 19 + TypeScript | Vite 8 | 无路由，仅一个 App |
| `code-agents-ui` | React 19 + TypeScript（共享组件库） | tsc | 无，导出组件 |

### 2.2 硬编码英文现状

> **整个项目零 i18n 基础设施，所有用户可见文本均为 JSX/TSX 中硬编码的英文字符串。**

**影响面统计：**

| 包 | 文件数（含英文UI文本） | 典型字符串量 | 预估 KEY 数量 |
|----|----------------------|-------------|-------------|
| `desktop-app` | App.tsx, Sidebar.tsx, AppSettings.tsx, TabBar.tsx, UpdateIndicator.tsx, UpdatePrompt.tsx, CodeAgentsHub.tsx | ~150 处 | ~80 |
| `code-agents-ui` | CodeAgentsApp.tsx, 各种子组件 | ~200 处 | ~60 |
| `frame` | client/App.tsx | ~15 处 | ~10 |
| `mobile-app` | AppForm.tsx, AppCard.tsx 等 | ~20 处 | ~15 |
| `docs` | 各类 .tsx / .mdx | ~50 处 | ~40 |
| `shared-app-config` | templates.ts (模板 label/description) | ~30 处 | ~20 |

**总计约 225 个 i18n key。**

### 2.3 典型硬编码示例

```tsx
// desktop-app/Sidebar.tsx
<span className="item-label">Code</span>
<span className="item-label">Settings</span>
<span className="item-label">Add</span>

// desktop-app/AppSettings.tsx
<h2>App Settings</h2>
<span className="settings-mode-card-title">Mode</span>
<span className="settings-mode-card-status">All apps run in dev mode</span>
<button>Relaunch</button>

// mobile-app/AppForm.tsx
<Text style={styles.title}>{isEditing ? "Edit App" : "Add App"}</Text>
<Text style={styles.cancelText}>Cancel</Text>

// code-agents-ui/CodeAgentsApp.tsx（大量上下文相关字符串）
title="Run a new agent session"
placeholder="Type a message..."
```

---

## 三、方案设计

### 3.1 核心选型：轻量自建方案

**不使用重型 i18n 库（如 react-i18next、react-intl）**，原因：

1. **依赖体积** — react-i18next + i18next 约 40KB gzipped，对 Electron（冷启动敏感）和组件库（npm 包体量敏感）是负担
2. **类型安全** — 社区库对 TypeScript 的 key 推断支持弱，需要手动维护类型
3. **多端一致** — react-i18next 的 hook API 在 React Native 中需要额外插件（AsyncStorage），Expo 下行为不同
4. **模板系统** — i18next 的模板引擎（`{{count}}`）对复杂句式支持有限

**采用自建轻量方案：基于 React Context + 编译时 key 检查 + 运行时热切换。**

### 3.2 架构总览

```
┌────────────────────────────────────────────────────────────┐
│                      @agent-native/i18n                     │
│                   (新增共享 i18n 包)                         │
├────────────────────────────────────────────────────────────┤
│  locales/                                                    │
│  ├── zh-CN.ts    ← 中文翻译（默认、完整）                     │
│  └── en.ts       ← 英文（从现有代码提取，即 origin）           │
├────────────────────────────────────────────────────────────┤
│  types.ts        ← I18nMessages 类型（自动从 zh-CN 推导）     │
│  context.tsx     ← I18nProvider + useI18n hook               │
│  storage.ts      ← localStorage / AsyncStorage 持久化         │
│  language-switcher.tsx ← 全界面固定位置的语言切换按钮          │
└────────────────────────────────────────────────────────────┘
```

### 3.3 Key 设计原则

**采用「扁平点分隔 key」方案**，避免嵌套地狱：

```typescript
// ✅ 推荐：扁平化，语义清晰
const zhCN = {
  "sidebar.code": "代码",
  "sidebar.settings": "设置",
  "sidebar.add": "添加",
  "settings.title": "应用设置",
  "settings.mode": "模式",
  "settings.mode.devAll": "所有应用运行于开发模式",
  "settings.mode.prodAll": "所有应用运行于生产环境",
  "settings.mode.mixed": "混合模式 — 部分应用已覆盖",
  "settings.softwareUpdates": "软件更新",
  "settings.remote.title": "远程控制",
  "settings.remote.off": "关闭",
  "settings.remote.polling": "轮询中",
  "settings.remote.connectedTo": "已连接到 {host}",
  "settings.installedApps": "已安装的应用",
  "settings.customizePerApp": "按应用自定义",
  "settings.addApp": "添加应用",
  "settings.editApp": "编辑应用",
  "settings.resetToDefaults": "恢复默认",
  "settings.cancel": "取消",
  "settings.save": "保存",
  "settings.production": "生产环境",
  "settings.localDev": "本地开发",
  "settings.codeTab.title": "代码标签页",
  "settings.codeTab.desc": "在侧边栏显示 Agent-Native Code。",
  "settings.shortcut.press": "按下快捷键",
  "settings.shortcut.record": "录制快捷键",
  "settings.shortcut.toggle": "切换",
  "settings.shortcut.show": "显示",
  "settings.shortcut.active": "活跃",
  "settings.shortcut.inactive": "未激活",
  "settings.shortcut.off": "关闭",
  "settings.shortcut.empty": "未配置桌面快捷键。",
  "settings.shortcut.noApps": "无已启用的应用",
  "update.available": "更新 {version} 可用",
  "update.downloading": "下载更新中 — {percent}%",
  "update.ready": "更新 {version} 已就绪 — 点击重启",
  "update.relaunch": "重启",
  "tab.new": "新建标签页",
  "find.placeholder": "在页面中查找",
  "find.prev": "上一个",
  "find.next": "下一个",
  "find.done": "完成",
  "general.loading": "加载中…",
  "general.copied": "已复制 URL",
  "general.error": "错误",
  "general.required": "必填",
} as const;

export type I18nKey = keyof typeof zhCN;

// 带模板参数的翻译类型
export type I18nParams<K extends I18nKey> = typeof zhCN[K] extends `${string}{${infer P}}${infer _}`
  ? Record<P, string | number>
  : Record<string, never>;
```

**带参数的翻译例子：**

```typescript
"update.downloading": "下载更新中 — {percent}%"
// 使用: t("update.downloading", { percent: 42 })

"settings.remote.connectedTo": "已连接到 {host}"
// 使用: t("settings.remote.connectedTo", { host: "dispatch.agent-native.com" })
```

### 3.4 核心 API 设计

```typescript
// @agent-native/i18n/context.tsx

import { createContext, useContext, useState, useCallback, useMemo } from "react";
import type { I18nKey, I18nParams } from "./types.js";
import { zhCN } from "./locales/zh-CN.js";
import { en } from "./locales/en.js";

export type Language = "zh-CN" | "en";

const messages: Record<Language, typeof zhCN> = {
  "zh-CN": zhCN,
  "en": en as typeof zhCN, // en 必须与 zhCN key 完全对齐
};

interface I18nContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: <K extends I18nKey>(key: K, params?: I18nParams<K>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  children,
  defaultLang = "zh-CN",
}: {
  children: React.ReactNode;
  defaultLang?: Language;
}) {
  const [lang, setLangState] = useState<Language>(() => {
    // 从存储恢复
    try {
      return (localStorage.getItem("agent-native-lang") as Language) || defaultLang;
    } catch {
      return defaultLang;
    }
  });

  const setLang = useCallback((next: Language) => {
    setLangState(next);
    try { localStorage.setItem("agent-native-lang", next); } catch {}
  }, []);

  const t = useCallback(<K extends I18nKey>(key: K, params?: I18nParams<K>): string => {
    const val = messages[lang][key] as string;
    if (!params) return val;
    return val.replace(/\{(\w+)\}/g, (_, name: string) =>
      String((params as Record<string, string | number>)[name] ?? `{${name}}`)
    );
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
```

### 3.5 语言切换按钮设计

**核心需求：「在任何界面都能看到，一键切换，固定位置」。**

#### 桌面端（Electron）实现

方案：在 `Sidebar` 底部固定位置插入切换按钮，始终可见。

```tsx
// 放在 sidebar-footer 区域，Settings 按钮之上
<div className="sidebar-footer">
  <LanguageSwitcher />  {/* ← 新增，所有界面可见 */}
  <UpdateIndicator />
  {/* ...existing buttons */}
</div>
```

**视觉效果：**

```
┌──────────┐
│  📧 Mail  │
│  📅 Cal   │
│  📄 Docs  │
│  ...      │
│  ⚙ Settings│
│  🌐 EN/中  │  ← 固定底部，切换按钮
└──────────┘
```

**按钮设计：**

```tsx
// @agent-native/i18n/language-switcher.tsx
export function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, setLang } = useI18n();
  const nextLang = lang === "zh-CN" ? "en" : "zh-CN";

  return (
    <button
      className={`sidebar-item ${className ?? ""}`}
      onClick={() => setLang(nextLang)}
      title={lang === "zh-CN" ? "Switch to English" : "切换到中文"}
      aria-label={lang === "zh-CN" ? "Switch to English" : "Switch to Chinese"}
    >
      <span className="icon-wrapper">
        <IconLanguage size={18} strokeWidth={1.75} />
      </span>
      <span className="item-label">
        {lang === "zh-CN" ? "EN" : "中"}
      </span>
    </button>
  );
}
```

#### 移动端（Expo）实现

在底部 Tab Bar 区域或标题栏右侧放置切换按钮，也可放在设置页面顶部。

```tsx
// 在 App 根布局的 headerRight 位置
<Stack.Screen
  options={{
    headerRight: () => <LanguageSwitcher />,
  }}
/>
```

#### Web 文档站（docs）实现

在 `Header` 组件的右上角（与主题切换、搜索等并列）。

#### Dev Frame 实现

无独立 sidebar 时，在 AgentPanel 设置面板中提供切换入口；也可在页面角落放一个浮动按钮。

### 3.6 迁移策略：三步走

#### Step 1: 创建 `@agent-native/i18n` 包 + 语言切换按钮

- 新建 `packages/i18n/` 包
- 实现 I18nProvider、useI18n、LanguageSwitcher
- 编译时通过 `en.ts` 必须与 `zh-CN.ts` key 完全对齐（TypeScript 类型约束）

#### Step 2: 按包逐包迁移

优先级（按用户可见度 + 字符串量排序）：

| 顺序 | 包 | 策略 |
|------|----|------|
| 1 | `desktop-app` | 字符串最多，先迁移 Sidebar 然后 AppSettings |
| 2 | `code-agents-ui` | 共享组件，影响面广 |
| 3 | `frame` | 少量字符串，快速完成 |
| 4 | `mobile-app` | React Native 需额外适配 AsyncStorage 持久化 |
| 5 | `docs` | 文档站，SEO 敏感，附加 SSR 处理 |

**每步操作：**

1. 将包顶层 `App` 或入口用 `I18nProvider` 包裹
2. 将 `LanguageSwitcher` 插入合适位置
3. 逐个文件将硬编码字符串替换为 `t("key")` 调用
4. 提取英文原文 → 写入 `en.ts`，翻译为中文 → 写入 `zh-CN.ts`

#### Step 3: 完善与测试

- 所有 key 在 en.ts 与 zh-CN.ts 对齐检查（TypeScript 编译时 + 可选 ESLint 规则）
- 各平台手动测试：切换语言、默认中文、持久化恢复
- 文档站 SSR 独立测试（服务端渲染时语言检测逻辑）

---

## 四、翻译文件组织

### 4.1 领域拆分

为便于维护，按领域将 key 拆分到同名文件，最后由 barrel 文件聚合：

```
packages/i18n/locales/
├── zh-CN/
│   ├── index.ts          ← barrel, 聚合全部
│   ├── sidebar.ts        ← "sidebar.*"
│   ├── settings.ts       ← "settings.*"
│   ├── update.ts         ← "update.*"
│   ├── tab.ts            ← "tab.*"
│   ├── find.ts           ← "find.*"
│   ├── general.ts        ← "general.*"
│   ├── code-agents.ts    ← "codeAgents.*"
│   ├── docs.ts           ← "docs.*"
│   └── mobile.ts         ← "mobile.*"
├── en/
│   └── (与 zh-CN 镜像结构)
├── zh-CN.ts              ← 可直接导入的聚合文件
└── en.ts                 ← 可直接导入的聚合文件
```

### 4.2 聚合 barrel 示例

```typescript
// locales/zh-CN/index.ts
import { sidebar } from "./sidebar.js";
import { settings } from "./settings.js";
import { update } from "./update.js";
import { tab } from "./tab.js";
import { find } from "./find.js";
import { general } from "./general.js";
import { codeAgents } from "./code-agents.js";
import { docs } from "./docs.js";
import { mobile } from "./mobile.js";

export const zhCN = {
  ...sidebar,
  ...settings,
  ...update,
  ...tab,
  ...find,
  ...general,
  ...codeAgents,
  ...docs,
  ...mobile,
} as const;
```

**TypeScript 自动验证 en 与 zh-CN key 完全对齐：**

```typescript
// locales/en.ts
import type { I18nKey } from "./types.js";

// 此类型断言强迫 en 对象拥有与 zhCN 完全相同的所有 key
const _en: Record<I18nKey, string> = {
  "sidebar.code": "Code",
  "sidebar.settings": "Settings",
  // ... 必须覆盖所有 key，缺少任意一个 TS 编译报错
};
```

---

## 五、跨平台适配要点

### 5.1 React Native（Expo）适配

```typescript
// 启动时从 AsyncStorage 恢复语言
import AsyncStorage from "@react-native-async-storage/async-storage";

export function I18nProviderNative({
  children,
  defaultLang = "zh-CN",
}: {
  children: React.ReactNode;
  defaultLang?: Language;
}) {
  const [lang, setLangState] = useState<Language>(defaultLang);

  useEffect(() => {
    AsyncStorage.getItem("agent-native-lang").then((saved) => {
      if (saved === "zh-CN" || saved === "en") setLangState(saved);
    });
  }, []);

  const setLang = useCallback((next: Language) => {
    setLangState(next);
    AsyncStorage.setItem("agent-native-lang", next);
  }, []);

  // ...其余同 web 版
}
```

### 5.2 SSR（docs 包）适配

SSR 场景下，语言检测通过 `Accept-Language` 请求头或 URL 参数：

```typescript
// 服务端
export function detectLanguage(request: Request): Language {
  const url = new URL(request.url);
  const queryLang = url.searchParams.get("lang");
  if (queryLang === "zh-CN" || queryLang === "en") return queryLang;

  const cookie = request.headers.get("cookie");
  const cookieMatch = cookie?.match(/agent-native-lang=(zh-CN|en)/);
  if (cookieMatch) return cookieMatch[1] as Language;

  const acceptLang = request.headers.get("accept-language") ?? "";
  if (acceptLang.startsWith("zh")) return "zh-CN";
  return "en";
}
```

### 5.3 Electron（桌面端）适配

无特殊适配。I18nProvider 直出，localStorage 经 Electron 的 `webPreferences` 自动持久化到磁盘。

---

## 六、编译时安全保证

为了防止翻译文件遗漏 key 或 en/zh-CN 不一致，通过 TypeScript 类型系统强制约束：

```typescript
// types.ts — 自动从 zh-CN 推导 key 类型
import { zhCN } from "./locales/zh-CN/index.js";
export type I18nKey = keyof typeof zhCN;

// 若 en 对象缺少 key，TS 编译即报错：
// Type '{ ... }' is missing the following properties from type 'Record<I18nKey, string>': ...
```

**可选 CI 检查（添加 npm script）：**

```json
{
  "scripts": {
    "i18n:check": "tsc --noEmit --project packages/i18n/tsconfig.json"
  }
}
```

---

## 七、工作量估算

| 阶段 | 任务 | 工作量 |
|------|------|--------|
| 1 | 创建 `@agent-native/i18n` 包 + 基础 API | 0.5 天 |
| 2 | 类型系统 + 编译时安全 | 0.5 天 |
| 3 | `desktop-app` 迁移（~80 key，最复杂）| 1.5 天 |
| 4 | `code-agents-ui` 迁移（~60 key）| 1 天 |
| 5 | `frame` 迁移（~10 key）| 0.5 天 |
| 6 | `mobile-app` 迁移 + AsyncStorage 适配（~15 key）| 0.5 天 |
| 7 | `docs` 迁移 + SSR 语言检测（~40 key）| 1 天 |
| 8 | 语言切换按钮 UI 实现（各平台）| 0.5 天 |
| 9 | 中文翻译（~225 key）| 1 天 |
| 10 | 集成测试 + 修复 | 0.5 天 |
| **总计** | | **7.5 天（约 1.5 周）** |

---

## 八、备用方案对比

| 方案 | 优点 | 缺点 | 适用性 |
|------|------|------|--------|
| **自建轻量方案（推荐）** | 零依赖、类型安全、体积小 | 需要自维护 | ✅ 本项目 |
| `react-i18next` + `i18next` | 生态成熟、社区支持 | 体积大、类型弱、RN 需插件 | ❌ 过度 |
| `react-intl` (FormatJS) | ICU 标准、功能强 | 体积更大、配置复杂 | ❌ 过度 |
| `lingui` | 编译时提取、类型安全 | 需要额外构建步骤（macro）| ⚠️ 可考虑 |
| `next-intl` | SSR 原生支持 | 仅限 Next.js 生态 | ❌ 无关 |

**最终推荐：自建轻量方案。** 如果未来需求膨胀（多语言 > 5 种、复数规则复杂），再评估迁移到 `lingui` 的成本。

---

## 九、风险与注意事项

1. **翻译一致性** — 中文翻译需由中文母语者审查，避免机器翻译味
2. **热切换副作用** — 某些组件可能缓存了翻译结果在 local state 中（如 toast 消息），需确保切换时重新渲染
3. **React Native 热更新** — Expo OTA 更新后语言存储可能丢失，需回退到默认值
4. **code-agents-ui 作为公共 npm 包** — 需确保 `peerDependencies` 或 `bundledDependencies` 正确，不强制下游项目安装 i18n 包
5. **docs 站 SEO** — 切换语言后是否需要独立的 SEO 元数据（`<html lang>` 属性等），按需处理

---

## 十、文件清单（新增/修改）

### 新增文件

```
packages/i18n/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts
│   ├── types.ts
│   ├── context.tsx
│   ├── language-switcher.tsx
│   ├── locales/
│   │   ├── en.ts
│   │   ├── zh-CN.ts
│   │   ├── en/
│   │   │   ├── index.ts
│   │   │   ├── sidebar.ts
│   │   │   ├── settings.ts
│   │   │   ├── update.ts
│   │   │   ├── tab.ts
│   │   │   ├── find.ts
│   │   │   ├── general.ts
│   │   │   ├── code-agents.ts
│   │   │   ├── docs.ts
│   │   │   └── mobile.ts
│   │   └── zh-CN/
│   │       ├── index.ts
│   │       ├── sidebar.ts
│   │       ├── settings.ts
│   │       ├── update.ts
│   │       ├── tab.ts
│   │       ├── find.ts
│   │       ├── general.ts
│   │       ├── code-agents.ts
│   │       ├── docs.ts
│   │       └── mobile.ts
│   └── lib/
│       └── storage.ts (localStorage / AsyncStorage 抽象)
```

### 修改文件（按迁移顺序）

每个 UI 包均需要在根组件包裹 `<I18nProvider>`，并引入 `<LanguageSwitcher>`，同时将硬编码字符串替换为 `t("key")`。

---

## 十一、下一步行动

1. 确认方案（本文件）
2. 创建 `packages/i18n/` 基础框架
3. 从 `desktop-app` 的 `AppSettings.tsx` 开始试点迁移（字符串最集中）
4. 逐步扩展到其余包
5. 编写中文翻译
6. 各平台集成测试

---

*方案制定完毕，待确认后进入执行阶段。*
