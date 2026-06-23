import {
  IconChartBar,
  IconMessage,
  IconLayoutDashboard,
  IconDatabase,
} from "@tabler/icons-react";
import { dataSources, categoryLabels, categoryOrder } from "@/lib/data-sources";
import { useI18n } from "@agent-native/i18n";

const capabilities = [
  {
    icon: IconDatabase,
    titleKey: "analytics.about.capability.connectSources",
    descKey: "analytics.about.capability.connectSourcesDesc",
  },
  {
    icon: IconLayoutDashboard,
    titleKey: "analytics.about.capability.createDashboards",
    descKey: "analytics.about.capability.createDashboardsDesc",
  },
  {
    icon: IconChartBar,
    titleKey: "analytics.about.capability.queryExplorer",
    descKey: "analytics.about.capability.queryExplorerDesc",
  },
  {
    icon: IconMessage,
    titleKey: "analytics.about.capability.askChat",
    descKey: "analytics.about.capability.askChatDesc",
  },
];

export default function About() {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-4xl space-y-10 p-6 md:p-10">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">{t("analytics.about.title")}</h1>
        <p className="mt-2 text-muted-foreground text-lg">
          {t("analytics.about.description")}
        </p>
      </header>

      {/* Capabilities */}
      <section>
        <h2 className="text-xl font-semibold mb-4">{t("analytics.about.whatYouCanDo")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {capabilities.map((cap) => (
            <div
              key={cap.titleKey}
              className="rounded-lg border border-border bg-card p-5 space-y-2"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <cap.icon className="h-5 w-5" />
                </div>
                <h3 className="font-medium">{t(cap.titleKey as any)}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t(cap.descKey as any)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Available Data Sources */}
      <section>
        <h2 className="text-xl font-semibold mb-4">{t("analytics.about.availableDataSources")}</h2>
        {categoryOrder.map((category) => {
          const sources = dataSources.filter((s) => s.category === category);
          if (sources.length === 0) return null;
          return (
            <div key={category} className="mb-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {categoryLabels[category]}
              </h3>
              <div className="grid gap-2 sm:grid-cols-3">
                {sources.map((source) => {
                  const Icon = source.icon;
                  return (
                    <div
                      key={source.id}
                      className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2.5"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium">{source.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>

      <footer className="text-xs text-muted-foreground pt-4 border-t border-border">
        {t("analytics.about.footer")}
      </footer>
    </div>
  );
}
