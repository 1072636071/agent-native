import { useLocation } from "react-router";
import { IconMenu2 } from "@tabler/icons-react";
import { useHeaderTitle, useHeaderActions } from "./HeaderActions";
import { AgentToggleButton } from "@agent-native/core/client";
import { compositions } from "@/remotion/registry";
import { useI18n } from "@agent-native/i18n";

const pageTitles: Record<string, string> = {};

function resolveTitle(pathname: string, t: (key: string) => string): string {
  if (pathname === "/") return t("pageTitle.videos");
  if (pathname === "/components") return t("pageTitle.components");
  if (pathname === "/design-systems") return t("pageTitle.designSystems");
  if (pathname === "/team") return t("pageTitle.team");
  if (pathname === "/settings") return t("pageTitle.settings");
  if (pathname.startsWith("/extensions")) return t("pageTitle.extensions");
  const studioMatch = pathname.match(/^\/c\/(.+)$/);
  if (studioMatch) {
    const id = studioMatch[1];
    if (id === "new") return t("pageTitle.newComposition");
    const comp = compositions.find((c) => c.id === id);
    return comp?.title || t("common.studio");
  }
  return t("app.title");
}

interface HeaderProps {
  onOpenMobileSidebar?: () => void;
}

export function Header({ onOpenMobileSidebar }: HeaderProps) {
  const location = useLocation();
  const title = useHeaderTitle();
  const actions = useHeaderActions();
  const { t } = useI18n();

  return (
    <header className="flex h-12 items-center gap-3 border-b border-border bg-background px-4 lg:px-6 shrink-0">
      {onOpenMobileSidebar && (
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          aria-label={t("header.openNavigation")}
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent md:hidden"
        >
          <IconMenu2 className="h-4 w-4" />
        </button>
      )}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {title ?? (
          <h1 className="text-lg font-semibold tracking-tight truncate">
            {resolveTitle(location.pathname, t)}
          </h1>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {actions}
        <AgentToggleButton />
      </div>
    </header>
  );
}
