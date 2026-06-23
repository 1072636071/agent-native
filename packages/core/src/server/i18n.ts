/**
 * Server-side i18n utilities for SSR pages.
 *
 * Provides language detection (via Accept-Language header parsing)
 * and shared types used by all server-rendered pages that need
 * to serve content in the user's preferred language.
 */

/**
 * Supported SSR languages.
 * "en" — English (default)
 * "zh" — Chinese (Simplified)
 */
export type SsrLanguage = "en" | "zh";

export const SUPPORTED_LANGUAGES: SsrLanguage[] = ["en", "zh"];

/**
 * Parse an Accept-Language header value and determine the strongest
 * preferred language from our supported set.
 *
 * Follows RFC 4647 / RFC 7231 quality-value semantics, handles
 * wildcards, and gives exact matches priority over region variants.
 * Falls back to English when the header is empty, unparseable, or
 * doesn't prefer any supported language.
 */
export function parseAcceptLanguage(
  acceptLanguageHeader: string | undefined | null,
): SsrLanguage {
  if (!acceptLanguageHeader) return "en";

  const languages: Array<{ lang: string; q: number }> = [];
  let hasWildcard = false;

  for (const part of acceptLanguageHeader.split(",")) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const [langTag, qPart] = trimmed.split(";") as [string, string?] | [string];
    const lang = langTag.trim().toLowerCase();
    if (!lang) continue;

    if (lang === "*") {
      hasWildcard = true;
      continue;
    }

    let q = 1.0;
    if (qPart) {
      const qMatch = qPart.trim().match(/^q\s*=\s*(\d+(?:\.\d+)?)/);
      if (qMatch) {
        q = parseFloat(qMatch[1]);
        if (isNaN(q) || q < 0 || q > 1) q = 0;
      }
    }

    languages.push({ lang, q });
  }

  // Sort by quality value, highest first
  languages.sort((a, b) => b.q - a.q);

  // Build a map of language to its highest quality value
  const langQuality: Record<string, number> = {};
  for (const l of languages) {
    const base = l.lang.split("-")[0];
    const key = l.lang;
    if (!(key in langQuality) || l.q > langQuality[key]) {
      langQuality[key] = l.q;
    }
    if (!(base in langQuality) || l.q > langQuality[base]) {
      langQuality[base] = l.q;
    }
  }

  // Check Chinese first (supports zh-CN, zh-TW, zh-Hans, zh-Hant, zh)
  const chineseQ = Math.max(
    langQuality["zh"] ?? 0,
    langQuality["zh-cn"] ?? 0,
    langQuality["zh-tw"] ?? 0,
    langQuality["zh-hans"] ?? 0,
    langQuality["zh-hant"] ?? 0,
  );

  const englishQ = langQuality["en"] ?? 0;

  if (chineseQ > 0 && chineseQ >= englishQ) return "zh";
  if (englishQ > 0) return "en";

  // Only wildcards present → default to English
  if (languages.length === 0 && hasWildcard) return "en";

  // Fallback: check if any Chinese region variant is present
  for (const l of languages) {
    const base = l.lang.split("-")[0];
    if (base === "zh") return "zh";
  }

  return "en";
}
