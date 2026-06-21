// ── Language Switcher Component ─────────────────────────────────────────────

import { useI18n } from "./context.js";
import type { FC } from "react";

export interface LanguageSwitcherProps {
  /** Extra class name for styling */
  className?: string;
  /** Render as a sidebar-style button (default) */
  variant?: "sidebar" | "icon" | "text";
}

/**
 * Language switch button.
 *
 * - `sidebar` (default): full sidebar-item button, label = "EN" or "中"
 * - `icon`: icon-only inline button
 * - `text`: simple text toggle (e.g. "English | 中文")
 */
export const LanguageSwitcher: FC<LanguageSwitcherProps> = ({
  className = "",
  variant = "sidebar",
}) => {
  const { lang, setLang, t } = useI18n();

  // The "switching to" language is the opposite of current
  const toggleTo: "zh-CN" | "en" = lang === "zh-CN" ? "en" : "zh-CN";
  const ariaLabel =
    lang === "zh-CN" ? t("lang.switchTo") : t("lang.switchToZh");

  const handleClick = () => setLang(toggleTo);

  // ── Sidebar variant (desktop style) ──
  if (variant === "sidebar") {
    return (
      <button
        className={`sidebar-item ${className}`.trim()}
        tabIndex={-1}
        onClick={handleClick}
        title={ariaLabel}
        aria-label={ariaLabel}
      >
        <span className="icon-wrapper">
          <span
            className="lang-switcher-icon"
            style={{
              fontSize: 14,
              fontWeight: 600,
              lineHeight: 1,
              letterSpacing: 0.5,
            }}
          >
            {lang === "zh-CN" ? "EN" : "中"}
          </span>
        </span>
        <span className="item-label">
          {lang === "zh-CN" ? t("lang.label") : t("lang.labelZh")}
        </span>
      </button>
    );
  }

  // ── Icon variant (mobile / floating) ──
  if (variant === "icon") {
    return (
      <button
        className={className}
        onClick={handleClick}
        title={ariaLabel}
        aria-label={ariaLabel}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: 14,
          fontWeight: 600,
          padding: "4px 8px",
          color: "inherit",
        }}
      >
        {lang === "zh-CN" ? "EN" : "中"}
      </button>
    );
  }

  // ── Text variant (docs / general) ──
  return (
    <button
      className={className}
      onClick={handleClick}
      title={ariaLabel}
      aria-label={ariaLabel}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        fontSize: "inherit",
        padding: 0,
        color: "inherit",
      }}
    >
      {lang === "zh-CN" ? "English" : "中文"}
    </button>
  );
};
