// ── React Context-based i18n provider and hooks ───────────────────────────────

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from "react";
import type { Language, I18nContextValue, I18nKey, I18nParams } from "./types.js";
import type { I18nMessages } from "./types.js";
import { zhCN } from "./locales/zh-CN.js";
import { en } from "./locales/en.js";
import { createStorage, STORAGE_KEY } from "./storage.js";

// ── Messages registry ────────────────────────────────────────────────────────

const messages: Record<Language, I18nMessages> = {
  "zh-CN": zhCN,
  "en": en as I18nMessages,
};

// ── Context ──────────────────────────────────────────────────────────────────

const I18nContext = createContext<I18nContextValue | null>(null);

// ── Provider ─────────────────────────────────────────────────────────────────

export interface I18nProviderProps {
  children: ReactNode;
  /** Default language when no saved preference exists */
  defaultLang?: Language;
  /** Custom storage (for SSR / RN / test injection) */
  storage?: ReturnType<typeof createStorage>;
}

export function I18nProvider({
  children,
  defaultLang = "zh-CN",
  storage: externalStorage,
}: I18nProviderProps) {
  const storage = externalStorage ?? createStorage();

  const [lang, setLangState] = useState<Language>(() => {
    try {
      const saved = storage.getItem(STORAGE_KEY);
      if (saved === "zh-CN" || saved === "en") return saved;
    } catch {
      // no-op
    }
    return defaultLang;
  });

  // Sync to storage whenever lang changes
  useEffect(() => {
    try {
      storage.setItem(STORAGE_KEY, lang);
    } catch {
      // no-op
    }
  }, [lang, storage]);

  const setLang = useCallback(
    (next: Language) => {
      setLangState(next);
    },
    [],
  );

  const t = useCallback(
    <K extends I18nKey>(key: K, params?: I18nParams<K>): string => {
      let val = messages[lang][key] as string;
      if (params && typeof val === "string") {
        val = val.replace(
          /\{(\w+)\}/g,
          (_, name: string) =>
            String(
              (params as Record<string, string | number>)[name] ?? `{${name}}`,
            ),
        );
      }
      return val;
    },
    [lang],
  );

  const value = useMemo(
    () => ({ lang, setLang, t }),
    [lang, setLang, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within <I18nProvider>");
  }
  return ctx;
}
