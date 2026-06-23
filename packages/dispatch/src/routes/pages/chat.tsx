import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  AgentChatSurface,
  markAgentChatHomeHandoff,
} from "@agent-native/core/client";
import { useI18n } from "@agent-native/i18n";
import { submitOverviewPrompt } from "@/lib/overview-chat";

interface DispatchChatLocationState {
  dispatchPrompt?: {
    id?: string | number;
    message?: string;
    selectedModel?: string | null;
  };
  dispatchThread?: {
    id?: string | number;
    threadId?: string;
  };
}

export function meta() {
  return [{ title: "Chat — Dispatch" }];
}

export default function ChatRoute() {
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const handledStateIds = useRef(new Set<string>());
  const state = location.state as DispatchChatLocationState | null;
  const prompt = state?.dispatchPrompt;
  const thread = state?.dispatchThread;

  useEffect(() => {
    const message = prompt?.message?.trim();
    const threadId = thread?.threadId?.trim();
    if (!message && !threadId) return;

    const stateId = String(
      prompt?.id ?? thread?.id ?? `${message ?? ""}:${threadId ?? ""}`,
    );
    if (handledStateIds.current.has(stateId)) return;
    handledStateIds.current.add(stateId);

    const timer = window.setTimeout(() => {
      if (threadId) {
        window.dispatchEvent(
          new CustomEvent("agent-chat:open-thread", {
            detail: { threadId },
          }),
        );
      }
      if (message) {
        submitOverviewPrompt(message, prompt?.selectedModel, {
          openSidebar: false,
        });
      }
      navigate(`${location.pathname}${location.search}${location.hash}`, {
        replace: true,
        state: null,
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [
    location.hash,
    location.pathname,
    location.search,
    navigate,
    prompt?.id,
    prompt?.message,
    prompt?.selectedModel,
    thread?.id,
    thread?.threadId,
  ]);

  useEffect(() => {
    function handleChatRunning(event: Event) {
      const detail = (event as CustomEvent).detail;
      if (detail?.isRunning === true) markAgentChatHomeHandoff("dispatch");
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
        className="dispatch-chat-panel"
        defaultMode="chat"
        storageKey="dispatch"
        showHeader={false}
        showTabBar={false}
        dynamicSuggestions={false}
        suggestions={[]}
        emptyStateText={t("dispatch.chat.emptyStateText")}
        emptyStateDisplay="hidden"
        centerComposerWhenEmpty
        composerLayoutVariant="hero"
        composerPlaceholder={t("dispatch.chat.composerPlaceholder")}
        composerSlot={
          <div className="dispatch-chat-intro">
            <h1>{t("dispatch.chat.whatShouldDispatchDoNext")}</h1>
            <p>{t("dispatch.chat.subtitle")}</p>
          </div>
        }
      />
    </div>
  );
}
