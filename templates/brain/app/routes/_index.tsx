import { useEffect } from "react";
import { useI18n } from "@agent-native/i18n";
import {
  AgentChatSurface,
  markAgentChatHomeHandoff,
} from "@agent-native/core/client";
import { TAB_ID } from "@/lib/tab-id";

export function meta() {
  return [
    { title: "brain.meta.title" },
    { name: "description", content: "brain.meta.description" },
    { property: "og:title", content: "brain.meta.title" },
    { property: "og:description", content: "brain.meta.description" },
    { name: "twitter:card", content: "summary" },
    { name: "twitter:title", content: "brain.meta.title" },
    { name: "twitter:description", content: "brain.meta.description" },
  ];
}

export default function AskRoute() {
  const { t } = useI18n();
  useEffect(() => {
    function handleChatRunning(event: Event) {
      const detail = (event as CustomEvent).detail;
      if (detail?.isRunning === true) markAgentChatHomeHandoff("brain");
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
        className="brain-chat-panel"
        defaultMode="chat"
        storageKey="brain"
        browserTabId={TAB_ID}
        showHeader={false}
        showTabBar={false}
        dynamicSuggestions={false}
        suggestions={[]}
        emptyStateText={t("brain.ask.emptyState")}
        emptyStateDisplay="hidden"
        centerComposerWhenEmpty
        composerLayoutVariant="hero"
        composerPlaceholder={t("brain.ask.composerPlaceholder")}
        composerSlot={
          <div className="brain-chat-intro">
            <h1>{t("brain.ask.introTitle")}</h1>
            <p>{t("brain.ask.introDesc")}</p>
          </div>
        }
      />
    </div>
  );
}
