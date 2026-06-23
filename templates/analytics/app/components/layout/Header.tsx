import { useLocation } from "react-router";
import type { ReactNode } from "react";
import { dashboards } from "@/pages/adhoc/registry";
import {
  DashboardTitleSkeleton,
  useHeaderTitle,
  useHeaderActions,
} from "./HeaderActions";
import { AgentToggleButton } from "@agent-native/core/client";
import { RunsTray } from "@agent-native/core/client/progress";
import { useI18n } from "@agent-native/i18n";

const pageTitles: Record<string, string> = {
  "/": "analytics.header.overview",
  "/data-sources": "analytics.header.dataSources",
  "/data-dictionary": "analytics.header.dataDictionary",
  "/catalog": "analytics.header.templateCatalog",
  "/analyses": "analytics.header.analyses",
  "/adhoc/explorer": "analytics.header.explorer",
  "/team": "analytics.header.team",
  "/settings": "analytics.header.settings",
  "/about": "analytics.header.about",
};

function resolveTitle(pathname: string, t: (key: string) => string): ReactNode {
  const key = pageTitles[pathname];
  if (key) return t(key);

  const adhocMatch = pathname.match(/^\/adhoc\/(.+)$/);
  if (adhocMatch) {
    const id = adhocMatch[1];
    const dash = dashboards.find((d) => d.id === id);
    return dash?.name || <DashboardTitleSkeleton />;
  }

  if (pathname.startsWith("/analyses/")) return t("analytics.header.analyses");

  return t("analytics.title");
}

export function Header() {
  const { t } = useI18n();
  const location = useLocation();
  const title = useHeaderTitle();
  const actions = useHeaderActions();
  const fallbackTitle = resolveTitle(location.pathname, t);

  return (
    <header className="flex h-12 items-center gap-3 border-b border-border bg-background px-4 lg:px-6 shrink-0">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {title ??
          (typeof fallbackTitle === "string" ? (
            <h1 className="text-lg font-semibold tracking-tight truncate">
              {fallbackTitle}
            </h1>
          ) : (
            fallbackTitle
          ))}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {actions}
        <RunsTray pollMs={1500} />
        <AgentToggleButton />
      </div>
    </header>
  );
}
