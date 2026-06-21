// ── Barrel export ────────────────────────────────────────────────────────────

export { I18nProvider, useI18n } from "./context.js";
export type { I18nProviderProps } from "./context.js";
export { LanguageSwitcher } from "./language-switcher.js";
export type { LanguageSwitcherProps } from "./language-switcher.js";
export type {
  Language,
  I18nKey,
  I18nMessages,
  I18nParams,
  I18nContextValue,
  I18nStorage,
} from "./types.js";
export { createStorage, STORAGE_KEY } from "./storage.js";
