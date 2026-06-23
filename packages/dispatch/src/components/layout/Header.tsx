import { useLocation, useNavigate } from "react-router";
import { useHeaderTitle, useHeaderActions } from "./HeaderActions";
import { AgentToggleButton } from "@agent-native/core/client";
import { RunsTray } from "@agent-native/core/client/progress";
import { Button } from "@/components/ui/button";
import { IconLayoutSidebar } from "@tabler/icons-react";
import { useI18n, type I18nKey } from "@agent-native/i18n";

const pageTitleKeys: Record<string, I18nKey> = {
  "/": "dispatch.common.overview",
  "/overview": "dispatch.common.overview",
  "/vault": "dispatch.common.vault",
  "/integrations": "dispatch.common.integrations",
  "/workspace": "dispatch.common.resources",
  "/messaging": "dispatch.common.messaging",
  "/agents": "dispatch.common.agents",
  "/destinations": "dispatch.common.destinations",
  "/identities": "dispatch.common.identities",
  "/approvals": "dispatch.common.approvals",
  "/audit": "dispatch.common.audit",
  "/team": "dispatch.common.team",
};

function resolveTitle(pathname: string, t: (key: I18nKey) => string): string {
  const key = pageTitleKeys[pathname];
  if (key) return t(key);

  if (pathname.startsWith("/extensions"))
    return t("dispatch.common.extensions");

  return "Dispatch";
}

export function Header({
  onOpenMobile,
  showAgentToggle = true,
}: {
  onOpenMobile?: () => void;
  showAgentToggle?: boolean;
}) {
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const title = useHeaderTitle();
  const actions = useHeaderActions();

  function openRunThread(threadId: string) {
    navigate("/chat", {
      state: {
        dispatchThread: {
          id: `${Date.now()}-${threadId}`,
          threadId,
        },
      },
    });
    window.requestAnimationFrame(() => {
      window.dispatchEvent(
        new CustomEvent("agent-chat:open-thread", {
          detail: { threadId },
        }),
      );
    });
  }

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border bg-background px-4 lg:px-6">
      {onOpenMobile ? (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 lg:hidden cursor-pointer"
          onClick={onOpenMobile}
          aria-label={t("dispatch.shell.openNavigation")}
        >
          <IconLayoutSidebar />
        </Button>
      ) : null}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {title ?? (
          <h1 className="text-lg font-semibold tracking-tight truncate">
            {resolveTitle(location.pathname, t)}
          </h1>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {actions}
        <RunsTray limit={8} onOpenThread={openRunThread} />
        {showAgentToggle ? (
          <AgentToggleButton className="h-8 w-8 rounded-md hover:bg-accent" />
        ) : null}
      </div>
    </header>
  );
}
