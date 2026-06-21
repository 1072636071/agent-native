import type { I18nStorage } from "./types.js";

/**
 * Adaptive storage: tries localStorage (browser/Electron),
 * falls back to a no-op in-memory store (RN / SSR / etc.).
 */
export function createStorage(): I18nStorage {
  try {
    if (typeof localStorage !== "undefined") {
      const testKey = "__i18n_storage_test__";
      localStorage.setItem(testKey, "1");
      localStorage.removeItem(testKey);
      return localStorage;
    }
  } catch {
    // no-op
  }
  return createInMemoryStorage();
}

function createInMemoryStorage(): I18nStorage {
  const store = new Map<string, string>();
  return {
    getItem(key) {
      return store.get(key);
    },
    setItem(key, value) {
      store.set(key, value);
    },
  };
}

export const STORAGE_KEY = "agent-native-lang";
