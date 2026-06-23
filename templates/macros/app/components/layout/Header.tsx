import { useLocation } from "react-router";
import { IconMenu2 } from "@tabler/icons-react";
import { AgentToggleButton } from "@agent-native/core/client";
import { useI18n } from "@agent-native/i18n";
import { useHeaderTitle, useHeaderActions } from "./HeaderActions";

const pageTitles: Record<string, string> = {
  "/": "macros.nav.entry",
  "/entry": "macros.nav.entry",
  "/analytics": "macros.nav.analytics",
  "/settings": "macros.nav.settings",
  "/extensions": "macros.nav.extensions",
};

function resolveTitle(pathname: string, t: (key: string) => string): string {
  if (pageTitles[pathname]) return t(pageTitles[pathname]);
  if (pathname.startsWith("/extensions")) return t("macros.nav.extensions");
  return t("macros.app.title");
}

interface HeaderProps {
  onOpenSidebar: () => void;
}

export function Header({ onOpenSidebar }: HeaderProps) {
  const location = useLocation();
  const title = useHeaderTitle();
  const actions = useHeaderActions();
  const { t } = useI18n();

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-background px-3 md:px-4">
      <button
        onClick={onOpenSidebar}
        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground md:hidden"
        aria-label={t("macros.header.openMenu")}
      >
        <IconMenu2 className="h-5 w-5" />
      </button>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {title ?? (
          <h1 className="truncate text-sm font-semibold text-foreground">
            {resolveTitle(location.pathname, t)}
          </h1>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {actions}
        <AgentToggleButton />
      </div>
    </header>
  );
}
