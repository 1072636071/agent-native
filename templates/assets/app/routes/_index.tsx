import { useEffect } from "react";
import {
  AgentChatSurface,
  markAgentChatHomeHandoff,
} from "@agent-native/core/client";
import { useI18n } from "@agent-native/i18n";
import { IconPhoto, IconSparkles, IconVideo } from "@tabler/icons-react";
import { ASSETS_CHAT_STORAGE_KEY } from "@/lib/chat";
import { TAB_ID } from "@/lib/tab-id";

const SEO_TITLE =
  "Agent-Native Assets - Open Source AI asset library for brand-safe images and video";
const SEO_DESCRIPTION =
  "Open Source asset manager for AI teams to organize brand libraries, search creative work, and generate on-brand images and videos.";

export function meta() {
  return [
    { title: SEO_TITLE },
    { name: "description", content: SEO_DESCRIPTION },
    { property: "og:title", content: SEO_TITLE },
    { property: "og:description", content: SEO_DESCRIPTION },
    { name: "twitter:card", content: "summary" },
    { name: "twitter:title", content: SEO_TITLE },
    { name: "twitter:description", content: SEO_DESCRIPTION },
  ];
}

export default function CreatePage() {
  const { t } = useI18n();
  useEffect(() => {
    function handleChatRunning(event: Event) {
      const detail = (event as CustomEvent).detail;
      if (detail?.isRunning === true) {
        markAgentChatHomeHandoff(ASSETS_CHAT_STORAGE_KEY);
      }
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
        className="assets-create-chat-panel"
        defaultMode="chat"
        storageKey={ASSETS_CHAT_STORAGE_KEY}
        browserTabId={TAB_ID}
        showHeader={false}
        showTabBar={false}
        dynamicSuggestions={false}
        suggestions={[]}
        emptyStateText={t("assets.index.emptyState")}
        emptyStateDisplay="hidden"
        centerComposerWhenEmpty
        composerLayoutVariant="hero"
        composerPlaceholder={t("assets.index.composerPlaceholder")}
        composerSlot={
          <div className="assets-create-chat-intro">
            <h1>{t("assets.index.introTitle")}</h1>
            <p>
              {t("assets.index.introDesc")}
            </p>
            <div className="assets-create-chat-pill-row" aria-hidden="true">
              <span>
                <IconPhoto className="size-3.5" />
                {t("assets.index.labelImage")}
              </span>
              <span>
                <IconVideo className="size-3.5" />
                {t("assets.index.labelVideo")}
              </span>
              <span>
                <IconSparkles className="size-3.5" />
                {t("assets.index.labelRefine")}
              </span>
            </div>
          </div>
        }
      />
    </div>
  );
}
