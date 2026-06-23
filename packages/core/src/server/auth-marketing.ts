import {
  parseAcceptLanguage as _parseAcceptLanguage,
  type SsrLanguage,
  SUPPORTED_LANGUAGES as _SUPPORTED_LANGUAGES,
} from "./i18n.js";

/**
 * @deprecated Use `SsrLanguage` from `./i18n.js` instead.
 */
export type AuthMarketingLanguage = SsrLanguage;

/**
 * @deprecated Use `SUPPORTED_LANGUAGES` from `./i18n.js` instead.
 */
export const SUPPORTED_LANGUAGES: AuthMarketingLanguage[] = _SUPPORTED_LANGUAGES;

/**
 * @deprecated Use `parseAcceptLanguage` from `./i18n.js` instead.
 */
export const parseAcceptLanguage = _parseAcceptLanguage;

export interface AuthMarketingContent {
  appName: string;
  tagline: string;
  description?: string;
  features?: string[];
  runLocalCommand?: string;
}

export interface ResolveBuiltInAuthMarketingOptions {
  requestHost?: string;
  requestPath?: string;
  /**
   * Preferred language for marketing content.
   * When not set, defaults to "en".
   */
  language?: AuthMarketingLanguage;
}

export const BUILT_IN_AUTH_MARKETING: Record<string, AuthMarketingContent> = {
  analytics: {
    appName: "Agent-Native Analytics",
    tagline:
      "Your AI agent queries your data sources, builds dashboards, and answers business questions alongside you.",
    features: [
      "Ask any question and get answers from BigQuery, HubSpot, Jira, and more",
      "Agent-built dashboards that pull live data from all your sources",
      "Saved analyses the agent can re-run on demand with fresh numbers",
    ],
  },
  brain: {
    appName: "Agent-Native Brain",
    tagline:
      "A company memory layer where raw conversations become reviewed, searchable institutional knowledge.",
    features: [
      "Import transcripts, notes, Slack exports, and Granola summaries",
      "Validate every fact against exact source quotes",
      "Review company-wide knowledge through proposal workflows",
    ],
  },
  calendar: {
    appName: "Agent-Native Calendar",
    tagline:
      "Your AI agent schedules, reschedules, and manages your calendar so you never have to.",
    features: [
      "Finds open slots and books meetings on your behalf",
      "Manages availability and booking links automatically",
      "Answers schedule questions and resolves conflicts instantly",
    ],
  },
  clips: {
    appName: "Agent-Native Clips",
    tagline:
      "Your AI agent transcribes, summarizes, and searches everything you record alongside you.",
    features: [
      "One-click screen recording with automatic titles, summaries, and chapters",
      "Calendar-synced meeting notes with live transcripts and action items",
      "One searchable library across recordings, meetings, and dictations",
    ],
  },
  content: {
    appName: "Agent-Native Content",
    tagline:
      "Open-source Obsidian for MDX: your AI agent edits local docs, creates custom blocks, and organizes everything alongside you.",
    features: [
      "Edit local Markdown/MDX files directly, with hosted sync when you need it",
      "Generate rich interactive custom MDX blocks and edit their props visually",
      "Search, summarize, cross-reference, and restructure document trees instantly",
    ],
  },
  plan: {
    appName: "Agent-Native Plan",
    tagline:
      "Visual plans, PR recaps, diagrams, wireframes, and shareable reviews for coding-agent work.",
    features: [
      "Turn implementation plans into structured visual artifacts",
      "Review PR recaps with diagrams, file maps, and annotated code",
      "Share links for async comments and product review",
    ],
  },
  design: {
    appName: "Agent-Native Design",
    tagline:
      "Design and prototype by describing what you want. The AI agent turns your ideas into interactive, fully responsive designs in seconds.",
    features: [
      "Create polished prototypes just by describing them",
      "Build and apply design systems to keep everything on-brand",
      "Export your work or share it with a link",
    ],
  },
  dispatch: {
    appName: "Agent-Native Dispatch",
    tagline:
      "Your AI agent manages secrets, orchestrates other agents, and routes messages across your workspace.",
    features: [
      "Centralized vault for secrets with granular per-app grants",
      "Cross-agent orchestration and delegation to specialist apps",
      "Slack and Telegram routing with approval workflows",
    ],
  },
  forms: {
    appName: "Agent-Native Forms",
    tagline:
      "Your AI agent builds, publishes, and analyzes forms alongside you.",
    features: [
      "Create complete forms from a single sentence",
      "Instant publishing with shareable links and captcha",
      "Response summaries, exports, and trend analysis on demand",
    ],
  },
  assets: {
    appName: "Agent-Native Assets",
    tagline:
      "Your AI agent creates, refines, and organizes on-brand assets alongside you.",
    features: [
      "Build reusable asset libraries from logos, product shots, videos, and references",
      "Generate heroes, diagrams, slide art, product visuals, and videos from a prompt",
      "Audit prompts, references, outputs, and refinements across every run",
    ],
  },
  mail: {
    appName: "Agent-Native Mail",
    tagline: "Your AI agent reads, drafts, and organizes email alongside you.",
    features: [
      "Replies that match your tone and style",
      "Multi-account Gmail in a single unified inbox",
      "Autonomous triage, archiving, and follow-ups",
    ],
    runLocalCommand:
      "npx @agent-native/core@latest create my-mail-app --template mail",
  },
  slides: {
    appName: "Agent-Native Slides",
    tagline:
      "Your AI agent builds, edits, and refines presentations alongside you.",
    features: [
      "Generate entire decks from a single prompt",
      "Surgical slide edits while you present or review",
      "Real-time collaboration between you and the agent",
    ],
  },
  chat: {
    appName: "Agent-Native Chat",
    tagline:
      "Start from a chat-first app and add actions, screens, and workflows as your agent grows.",
    features: [
      "Full-page chat with durable threads and tool call history",
      "Actions work from chat, UI, HTTP, MCP, A2A, and CLI",
      "Use the built-in app-agent loop or plug in your own agent backend",
    ],
  },
  videos: {
    appName: "Agent-Native Videos",
    tagline:
      "Your AI agent builds, animates, and refines programmatic videos alongside you.",
    features: [
      "Generate animated components and compositions from a description",
      "Fine-tune tracks, keyframes, and easing without touching code",
      "Camera moves, interactive elements, and effects the agent wires for you",
    ],
  },
};

export const CN_AUTH_MARKETING: Record<string, AuthMarketingContent> = {
  analytics: {
    appName: "Agent-Native 分析",
    tagline:
      "你的 AI 代理可以查询数据源、构建仪表盘，并与你一起回答业务问题。",
    features: [
      "从 BigQuery、HubSpot、Jira 等数据源提出任何问题并获得答案",
      "代理自动构建的仪表盘，实时拉取所有来源的数据",
      "已保存的分析结果，代理可按需重新运行并获取最新数据",
    ],
  },
  brain: {
    appName: "Agent-Native 知识库",
    tagline:
      "企业的记忆层——原始对话被转化为经过审查、可搜索的机构知识。",
    features: [
      "导入通话记录、笔记、Slack 导出文件和 Granola 摘要",
      "通过精确的原文引用验证每一条事实",
      "通过提案工作流进行全公司范围的知识审查",
    ],
  },
  calendar: {
    appName: "Agent-Native 日历",
    tagline:
      "你的 AI 代理替你安排、调整和管理日历，你再也不用为此操心了。",
    features: [
      "自动查找空闲时段并为你预订会议",
      "自动管理可用时间和预订链接",
      "即时回答日程问题并解决冲突",
    ],
  },
  clips: {
    appName: "Agent-Native 录制",
    tagline:
      "你的 AI 代理为你的所有录制内容提供转录、摘要和搜索服务。",
    features: [
      "一键屏幕录制，自动生成标题、摘要和章节",
      "与日历同步的会议记录，包含实况转录和待办事项",
      "在录制、会议和口述之间进行统一搜索",
    ],
  },
  content: {
    appName: "Agent-Native 内容",
    tagline:
      "面向 MDX 的开源 Obsidian：AI 代理直接在本地编辑文档、创建自定义组件，帮你组织所有内容。",
    features: [
      "直接编辑本地 Markdown/MDX 文件，按需提供托管同步",
      "生成丰富的交互式自定义 MDX 组件，可视化编辑其属性",
      "即时搜索、摘要、交叉引用和重构文档树",
    ],
  },
  plan: {
    appName: "Agent-Native 计划",
    tagline:
      "可视化计划、PR 回顾、图表、线框图和可分享的审查——为编程代理工作而生。",
    features: [
      "将实施方案转化为结构化的可视化制品",
      "审查附有图表、文件地图和注释代码的 PR 回顾",
      "通过分享链接进行异步评论和产品审查",
    ],
  },
  design: {
    appName: "Agent-Native 设计",
    tagline:
      "只需描述你的想法，AI 代理就能在数秒内将你的创意转化为交互式、完全响应式的设计。",
    features: [
      "仅凭描述即可创建精美的原型",
      "构建和应用设计系统，保持所有内容品牌统一",
      "导出你的作品或通过链接分享",
    ],
  },
  dispatch: {
    appName: "Agent-Native 调度中心",
    tagline:
      "你的 AI 代理管理密钥、编排其他代理，并跨越整个工作空间路由消息。",
    features: [
      "集中的密钥保险库，支持精细的应用级授权",
      "跨代理编排和委托任务给专业应用",
      "Slack 和 Telegram 消息路由，支持审批工作流",
    ],
  },
  forms: {
    appName: "Agent-Native 表单",
    tagline:
      "你的 AI 代理与你一起构建、发布和分析表单。",
    features: [
      "一句话就能创建完整的表单",
      "即时发布，附带可分享链接和验证码",
      "按需获取回复摘要、导出和趋势分析",
    ],
  },
  assets: {
    appName: "Agent-Native 资源",
    tagline:
      "你的 AI 代理与你一起创建、优化和组织品牌资源。",
    features: [
      "从 Logo、产品截图、视频和参考素材中构建可复用的资源库",
      "通过提示词生成英雄图、图表、幻灯片配图、产品视觉和视频",
      "审计每次运行的提示词、参考、输出和优化历史",
    ],
  },
  mail: {
    appName: "Agent-Native 邮件",
    tagline: "你的 AI 代理与你一起阅读、起草和组织邮件。",
    features: [
      "回复内容与你的语气和风格保持一致",
      "多账号 Gmail 统一收件箱",
      "自动分类、归档和跟进",
    ],
    runLocalCommand:
      "npx @agent-native/core@latest create my-mail-app --template mail",
  },
  slides: {
    appName: "Agent-Native 幻灯片",
    tagline:
      "你的 AI 代理与你一起构建、编辑和优化演示文稿。",
    features: [
      "一句话生成整份演示文稿",
      "在演示或审查过程中进行精准的幻灯片编辑",
      "你和代理之间实时协作",
    ],
  },
  chat: {
    appName: "Agent-Native 聊天",
    tagline:
      "从聊天优先的应用开始，随着代理的发展逐步添加操作、界面和工作流。",
    features: [
      "全屏聊天，支持持久化线程和工具调用历史",
      "操作可从聊天、UI、HTTP、MCP、A2A 和 CLI 触发",
      "使用内置的应用-代理循环，或接入你自己的代理后端",
    ],
  },
  videos: {
    appName: "Agent-Native 视频",
    tagline:
      "你的 AI 代理与你一起构建、动画化和优化程序化视频。",
    features: [
      "通过描述生成动画组件和合成画面",
      "精细调整轨道、关键帧和缓动效果，无需编写代码",
      "相机移动、交互元素和特效——全由代理帮你串联",
    ],
  },
};

const SLUG_ALIASES: Record<string, string> = {
  "agent-native": "",
  "blank-app": "chat",
  starter: "chat",
  asset: "assets",
  image: "assets",
  images: "assets",
  video: "videos",
};

function cloneMarketing(marketing: AuthMarketingContent): AuthMarketingContent {
  return {
    ...marketing,
    features: marketing.features ? [...marketing.features] : undefined,
  };
}

function normalizeSlug(value: string | undefined): string | undefined {
  if (!value) return undefined;
  let slug = value.trim().toLowerCase();
  if (!slug) return undefined;

  slug = slug.replace(/^@agent-native\//, "");
  slug = slug
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  slug = slug.replace(/^agent-native-/, "");
  slug = SLUG_ALIASES[slug] ?? slug;
  if (!slug) return undefined;
  return BUILT_IN_AUTH_MARKETING[slug] ? slug : undefined;
}

function slugFromUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return slugFromHost(url.host) ?? slugFromPath(url.pathname);
  } catch {
    return undefined;
  }
}

function slugFromHost(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const host = value.split(",")[0]?.trim().split(":")[0]?.toLowerCase();
  if (!host) return undefined;
  if (host.endsWith(".agent-native.com")) {
    return normalizeSlug(host.slice(0, -".agent-native.com".length));
  }
  return undefined;
}

function slugFromPath(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const firstSegment = value.split("?")[0]?.split("/").filter(Boolean)[0];
  return normalizeSlug(firstSegment);
}

function candidateSlugs(
  opts: ResolveBuiltInAuthMarketingOptions = {},
): string[] {
  const env = process.env;
  const candidates = [
    opts.requestHost ? slugFromHost(opts.requestHost) : undefined,
    opts.requestPath ? slugFromPath(opts.requestPath) : undefined,
    normalizeSlug(env.AGENT_NATIVE_TEMPLATE),
    normalizeSlug(env.APP_NAME),
    normalizeSlug(env.npm_package_name),
    slugFromPath(env.APP_BASE_PATH),
    slugFromPath(env.VITE_APP_BASE_PATH),
    slugFromUrl(env.APP_URL),
    slugFromUrl(env.BETTER_AUTH_URL),
    slugFromUrl(env.VITE_BETTER_AUTH_URL),
    slugFromUrl(env.URL),
    slugFromUrl(env.DEPLOY_URL),
    slugFromUrl(env.DEPLOY_PRIME_URL),
  ];

  return candidates.filter((slug): slug is string => !!slug);
}

/**
 * Get the marketing content map for a given language.
 */
function getMarketingForLanguage(language: AuthMarketingLanguage): Record<string, AuthMarketingContent> {
  switch (language) {
    case "zh":
      return CN_AUTH_MARKETING;
    case "en":
    default:
      return BUILT_IN_AUTH_MARKETING;
  }
}

export function resolveBuiltInAuthMarketing(
  opts: ResolveBuiltInAuthMarketingOptions = {},
): AuthMarketingContent | undefined {
  const language = opts.language ?? "en";
  const marketingMap = getMarketingForLanguage(language);
  for (const slug of candidateSlugs(opts)) {
    const marketing = marketingMap[slug];
    if (marketing) return cloneMarketing(marketing);
  }
  return undefined;
}

export function resolveBuiltInAuthMarketingByName(
  value: string | undefined,
  language?: AuthMarketingLanguage,
): AuthMarketingContent | undefined {
  const slug = normalizeSlug(value);
  const marketingMap = getMarketingForLanguage(language ?? "en");
  const marketing = slug ? marketingMap[slug] : undefined;
  return marketing ? cloneMarketing(marketing) : undefined;
}
