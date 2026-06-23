import { useLocation } from "react-router";
import { useDecks } from "@/context/DeckContext";
import { useHeaderTitle, useHeaderActions } from "./HeaderActions";
import { AgentToggleButton } from "@agent-native/core/client";
import { RunsTray } from "@agent-native/core/client/progress";
import { useI18n } from "@agent-native/i18n";

const pageTitles: Record<string, string> = {
  "/": "slides.pageTitle.decks",
  "/design-systems": "slides.pageTitle.designSystems",
  "/team": "slides.pageTitle.team",
  "/settings": "slides.pageTitle.settings",
  "/extensions": "slides.pageTitle.extensions",
};

function DeckTitle({ id }: { id: string }) {
  const { t } = useI18n();
  const { getDeck } = useDecks();
  const deck = getDeck(id);
  return (
    <h1 className="text-lg font-semibold tracking-tight truncate">
      {deck?.title || t("slides.common.deck")}
    </h1>
  );
}

function ResolvedTitle({ pathname }: { pathname: string }) {
  const { t } = useI18n();
  if (pageTitles[pathname]) {
    return (
      <h1 className="text-lg font-semibold tracking-tight truncate">
        {t(pageTitles[pathname])}
      </h1>
    );
  }

  const deckMatch = pathname.match(/^\/deck\/([^/]+)$/);
  if (deckMatch) return <DeckTitle id={deckMatch[1]} />;

  if (pathname.startsWith("/extensions/")) {
    return (
      <h1 className="text-lg font-semibold tracking-tight truncate">
        {t("slides.common.tool")}
      </h1>
    );
  }

  return (
    <h1 className="text-lg font-semibold tracking-tight truncate">
      {t("slides.app.title")}
    </h1>
  );
}

export function Header() {
  const location = useLocation();
  const title = useHeaderTitle();
  const actions = useHeaderActions();

  return (
    <header className="flex h-12 items-center gap-3 border-b border-border bg-background px-4 lg:px-6 shrink-0">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {title ?? <ResolvedTitle pathname={location.pathname} />}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {actions}
        <RunsTray pollMs={1500} />
        <AgentToggleButton />
      </div>
    </header>
  );
}
