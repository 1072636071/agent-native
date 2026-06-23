import { useEffect } from "react";
import {
  AgentChatSurface,
  markAgentChatHomeHandoff,
} from "@agent-native/core/client";
import { useI18n } from "@agent-native/i18n";
import { TAB_ID } from "@/lib/tab-id";

export default function AskPage() {
  const { t } = useI18n();
  useEffect(() => {
    function handleChatRunning(event: Event) {
      const detail = (event as CustomEvent).detail;
      if (detail?.isRunning === true) markAgentChatHomeHandoff("analytics");
    }

    window.addEventListener("agentNative.chatRunning", handleChatRunning);
    return () =>
      window.removeEventListener("agentNative.chatRunning", handleChatRunning);
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <AgentChatSurface
        mode="page"
        chatViewTransition
        className="analytics-chat-panel"
        defaultMode="chat"
        storageKey="analytics"
        browserTabId={TAB_ID}
        showHeader={false}
        showTabBar={false}
        dynamicSuggestions={false}
        suggestions={[]}
        emptyStateText={t("analytics.ask.emptyState")}
        emptyStateDisplay="hidden"
        centerComposerWhenEmpty
        composerLayoutVariant="hero"
        composerPlaceholder={t("analytics.ask.composerPlaceholder")}
        composerSlot={
          <div className="analytics-chat-intro">
            <h1>{t("analytics.ask.introTitle")}</h1>
            <p>{t("analytics.ask.introDesc")}</p>
          </div>
        }
      />
    </div>
  );
}
