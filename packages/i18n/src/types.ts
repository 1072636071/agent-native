// ── i18n core types ──────────────────────────────────────────────────────────

/** Supported language tags */
export type Language = "zh-CN" | "en";

/** All message keys derived from the zh-CN dictionary */
export type I18nKey = keyof typeof import("./locales/zh-CN.js").zhCN;

/** The full message record shape */
export type I18nMessages = Record<I18nKey, string>;

/**
 * Extract template parameter names from a template string.
 * e.g. "Downloading {percent}%" → "percent"
 */
type TemplateParams<S extends string> =
  S extends `${string}{${infer P}}${infer Rest}`
    ? Record<P, string | number> & TemplateParams<Rest>
    : Record<string, string | number>;

/** Narrow params type per key — empty object when no params exist */
export type I18nParams<K extends I18nKey> =
  TemplateParams<(typeof import("./locales/zh-CN.js").zhCN)[K]>;

/** Context value exposed by I18nProvider */
export interface I18nContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: <K extends I18nKey>(
    key: K,
    params?: I18nParams<K>,
  ) => string;
}

/** Storage abstraction for cross-platform persistence */
export interface I18nStorage {
  getItem(key: string): string | null | undefined;
  setItem(key: string, value: string): void;
}
