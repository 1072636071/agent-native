import { useActionQuery } from "@agent-native/core/client";
import { useI18n } from "@agent-native/i18n";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function appAvailabilityLabel(
  value?: string,
  t?: (...args: any[]) => string,
) {
  const fallback = (key: string, fallbackText: string) =>
    t ? t(key) : fallbackText;
  switch (value) {
    case "all-apps":
      return fallback(
        "dispatch.resourceStack.inheritedByAllApps",
        "Inherited by all apps",
      );
    case "selected-granted":
      return fallback(
        "dispatch.resourceStack.grantedToThisApp",
        "Granted to this app",
      );
    case "selected-not-granted":
      return fallback("dispatch.resourceStack.notGranted", "Not granted");
    case "selected-no-app":
      return fallback("dispatch.resourceStack.selectApp", "Select app");
    case "path-not-managed":
      return fallback("dispatch.resourceStack.notManaged", "Not managed");
    default:
      return fallback("dispatch.resourceStack.checking", "Checking");
  }
}

export function appLayerState(
  layer: any,
  t?: (...args: any[]) => string,
): {
  label: string;
  className: string;
} {
  const fallback = (key: string, fallbackText: string) =>
    t ? t(key) : fallbackText;
  if (layer.effective) {
    return {
      label: fallback("dispatch.resourceStack.wins", "Wins"),
      className: "border-green-500/30 bg-green-500/10 text-green-700",
    };
  }
  if (layer.overridden) {
    return {
      label: fallback("dispatch.resourceStack.overridden", "Overridden"),
      className: "border-amber-500/30 bg-amber-500/10 text-amber-700",
    };
  }
  return {
    label: fallback("dispatch.resourceStack.missing", "Missing"),
    className: "text-muted-foreground",
  };
}

export function formatResourceTimestamp(
  value?: number | null,
  t?: (...args: any[]) => string,
): string {
  if (!value) return t ? t("dispatch.resourceStack.notPresent") : "not present";
  return new Date(value).toLocaleString();
}

export function AppResourceEffectiveStack({
  appId,
  resource,
}: {
  appId: string;
  resource: any;
}) {
  const { t } = useI18n();
  const { data: context, isLoading } = useActionQuery(
    "get-workspace-resource-effective-context",
    { resourceId: resource.id, appId },
    { enabled: !!resource.id },
  );
  const layers = ((context as any)?.layers ?? []) as any[];
  const active = (context as any)?.effectiveResource;
  const availability = (context as any)?.availability;

  if (isLoading && !context) {
    return (
      <div className="mt-3 rounded-lg border bg-muted/20 p-3">
        <div className="h-3 w-44 animate-pulse rounded bg-muted-foreground/10" />
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <div className="h-20 animate-pulse rounded-md bg-muted-foreground/10" />
          <div className="h-20 animate-pulse rounded-md bg-muted-foreground/10" />
          <div className="h-20 animate-pulse rounded-md bg-muted-foreground/10" />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-lg border bg-muted/20 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase text-muted-foreground">
            {t("dispatch.resourceStack.effectiveContextStack")}
          </div>
          <div className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
            {resource.path}
          </div>
        </div>
        <Badge variant="outline">{appAvailabilityLabel(availability, t)}</Badge>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {layers.map((layer) => {
          const state = appLayerState(layer, t);
          return (
            <div
              key={layer.scope}
              className={cn("rounded-md border bg-background/70 p-2", {
                "border-green-500/30 bg-green-500/10": layer.effective,
              })}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-medium text-foreground">
                  {layer.label}
                </span>
                <Badge variant="outline" className={state.className}>
                  {state.label}
                </Badge>
              </div>
              <div className="mt-1 truncate font-mono text-[10px] text-muted-foreground">
                {layer.owner}
              </div>
              {layer.resource ? (
                <div className="mt-2 text-[11px] text-muted-foreground">
                  {t("dispatch.resourceStack.updated")}{" "}
                  {formatResourceTimestamp(layer.resource.updatedAt, t)}
                </div>
              ) : (
                <div className="mt-2 text-[11px] text-muted-foreground">
                  {t("dispatch.resourceStack.noFileAtLayer")}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 rounded-md bg-background/70 px-3 py-2 text-xs text-muted-foreground">
        {active ? (
          <>
            {t("dispatch.resourceStack.winningLayer")}:{" "}
            <span className="font-mono text-foreground">
              {active.owner}/{active.path}
            </span>
          </>
        ) : (
          t("dispatch.resourceStack.noActiveResource")
        )}
      </div>
    </div>
  );
}
