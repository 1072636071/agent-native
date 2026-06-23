import { useEffect } from "react";
import {
  AgentChatSurface,
  markAgentChatHomeHandoff,
} from "@agent-native/core/client";
import { useI18n } from "@agent-native/i18n";
import { TAB_ID } from "@/lib/tab-id";

export function meta() {
  return [
    { title: "chat.seo.title" },
    {
      name: "description",
      content: "chat.seo.description",
    },
    { property: "og:title", content: "chat.seo.title" },
    {
      property: "og:description",
      content: "chat.seo.description",
    },
    { name: "twitter:card", content: "summary" },
    { name: "twitter:title", content: "chat.seo.title" },
    {
      name: "twitter:description",
      content: "chat.seo.description",
    },
  ];
}

export default function ChatRoute() {
  const { t } = useI18n();
  useEffect(() => {
    function handleChatRunning(event: Event) {
      const detail = (event as CustomEvent).detail;
      if (detail?.isRunning === true) markAgentChatHomeHandoff("chat");
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
        className="h-full"
        defaultMode="chat"
        storageKey="chat"
        browserTabId={TAB_ID}
        showHeader={false}
        showTabBar={false}
        dynamicSuggestions={false}
        suggestions={[
          t("chat.index.suggestion1"),
          t("chat.index.suggestion2"),
          t("chat.index.suggestion3"),
        ]}
        emptyStateText={t("chat.index.emptyState")}
        emptyStateDisplay="hidden"
        centerComposerWhenEmpty
        composerLayoutVariant="hero"
        composerPlaceholder={t("chat.index.composerPlaceholder")}
        composerSlot={
          <div className="mx-auto mb-5 max-w-xl px-4 text-center">
            <h1 className="text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">
              {t("chat.index.introTitle")}
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {t("chat.index.introDesc")}
            </p>
          </div>
        }
      />
    </div>
  );
}
