import { useLocation } from "react-router";
import { IconMenu2 } from "@tabler/icons-react";
import { useI18n } from "@agent-native/i18n";
import { useHeaderTitle, useHeaderActions } from "./HeaderActions";
import { AgentToggleButton } from "@agent-native/core/client";
import { APP_TITLE } from "@/lib/app-config";

function pageTitles(t: (key: string) => string): Record<string, string> {
  return {
    "/": t("chat.header.pageChat"),
    "/observability": t("chat.header.pageObservability"),
    "/settings": t("chat.header.pageSettings"),
    "/team": t("chat.header.pageTeam"),
  };
}

function resolveTitle(pathname: string, t: (key: string) => string): string {
  const titles = pageTitles(t);
  if (titles[pathname]) return titles[pathname];
  if (pathname.startsWith("/extensions")) return t("chat.header.pageExtensions");
  return APP_TITLE;
}

interface HeaderProps {
  onOpenMobileSidebar?: () => void;
}

export function Header({ onOpenMobileSidebar }: HeaderProps) {
  const { t } = useI18n();
  const location = useLocation();
  const title = useHeaderTitle();
  const actions = useHeaderActions();

  return (
    <header className="flex h-12 items-center gap-3 border-b border-border bg-background px-4 lg:px-6 shrink-0">
      {onOpenMobileSidebar && (
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          aria-label={t("chat.layout.ariaOpenNav")}
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
