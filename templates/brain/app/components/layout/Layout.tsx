import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  AgentSidebar,
  focusAgentChat,
  navigateWithAgentChatViewTransition,
  useAgentChatHomeHandoff,
  useAgentChatHomeHandoffLinks,
} from "@agent-native/core/client";
import { IconMenu2 } from "@tabler/icons-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TAB_ID } from "@/lib/tab-id";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useI18n } from "@agent-native/i18n";

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { t } = useI18n();
  const isAskRoute = location.pathname === "/";
  const chatHomeHandoffActive = useAgentChatHomeHandoff({
    storageKey: "brain",
    activePath: location.pathname,
    enabled: !isAskRoute,
  });
  useAgentChatHomeHandoffLinks({ storageKey: "brain", chatPath: "/" });

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  const sidebarFrame = (
    <>
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="w-[min(18rem,88vw)] p-0">
          <SheetTitle className="sr-only">{t("brain.layout.sidebarTitle")}</SheetTitle>
          <SheetDescription className="sr-only">
            {t("brain.layout.sidebarDesc")}
          </SheetDescription>
          <Sidebar />
        </SheetContent>
      </Sheet>
    </>
  );

  const contentFrame = (
    <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
      <div className="flex h-12 shrink-0 items-center gap-3 border-b border-border bg-card px-3 md:hidden">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setMobileSidebarOpen(true)}
          aria-label={t("brain.layout.mobileNavOpen")}
        >
          <IconMenu2 className="size-4" />
        </Button>
        <span className="text-sm font-semibold">{t("brain.layout.mobileTitle")}</span>
      </div>
      <main className="min-w-0 flex-1 overflow-y-auto overscroll-contain">
        {children}
      </main>
    </div>
  );

  if (isAskRoute) {
    return (
      <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
        {sidebarFrame}
        {contentFrame}
      </div>
    );
  }

  function openAskAgentFullscreen() {
    focusAgentChat();
    navigateWithAgentChatViewTransition(navigate, "/");
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {sidebarFrame}
      <AgentSidebar
        position="right"
        chatViewTransition
        storageKey="brain"
        browserTabId={TAB_ID}
        openOnChatRunning={chatHomeHandoffActive}
        onFullscreenRequest={openAskAgentFullscreen}
        emptyStateText={t("brain.layout.agentSidebar.emptyState")}
        suggestions={[
          t("brain.layout.agentSidebar.suggestion1"),
          t("brain.layout.agentSidebar.suggestion2"),
          t("brain.layout.agentSidebar.suggestion3"),
        ]}
      >
        {contentFrame}
      </AgentSidebar>
    </div>
  );
}
