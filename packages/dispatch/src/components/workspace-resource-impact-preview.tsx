import { useActionQuery } from "@agent-native/core/client";
import { useI18n } from "@agent-native/i18n";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatResourceTimestamp } from "./workspace-resource-effective-stack";

function isApprovalRequest(result: any): boolean {
  return (
    result?.status === "pending" &&
    typeof result?.changeType === "string" &&
    result.changeType.startsWith("workspace-resource.")
  );
}

export function workspaceResourceMutationMessage(
  result: any,
  fallback: string,
  t?: (...args: any[]) => string,
): string {
  return isApprovalRequest(result)
    ? t
      ? t("dispatch.resourceImpact.approvalRequested")
      : "Approval requested"
    : fallback;
}

export function ImpactPreview({
  operation,
  resourceId,
  path,
  scope,
  enabled = true,
}: {
  operation: "create" | "update" | "delete";
  resourceId?: string;
  path?: string;
  scope?: "all" | "selected";
  enabled?: boolean;
}) {
  const { t } = useI18n();
  const { data: impact, isLoading } = useActionQuery(
    "preview-workspace-resource-change",
    {
      operation,
      resourceId,
      path,
      scope,
    },
    { enabled: enabled && Boolean(resourceId || path) },
  );

  if (!enabled || (!resourceId && !path)) return null;

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-muted/30 p-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-2 h-3 w-72" />
      </div>
    );
  }

  const data = impact as any;
  if (!data) return null;
  const affectsAllApps = data.affectsAllApps === true;
  const appCount = data.affectedApps?.count;
  const overrides = data.overrides ?? { count: 0, items: [] };
  const willRequestApproval = data.approval?.willRequestApproval === true;

  return (
    <div className="rounded-lg border bg-muted/30 p-3 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={affectsAllApps ? "secondary" : "outline"}>
          {affectsAllApps
            ? t("dispatch.resourceImpact.allAppsImpact")
            : t("dispatch.resourceImpact.selectedOnly")}
        </Badge>
        {willRequestApproval ? (
          <Badge
            variant="outline"
            className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
          >
            {t("dispatch.resourceImpact.approvalRequired")}
          </Badge>
        ) : null}
        {overrides.count > 0 ? (
          <Badge variant="outline">
            {t("dispatch.resourceImpact.moreOverrides", {
              count: overrides.count,
            })}
          </Badge>
        ) : null}
      </div>
      <p className="mt-2 leading-relaxed text-muted-foreground">
        {affectsAllApps
          ? t("dispatch.resourceImpact.allAppsDescription", { count: appCount })
          : t("dispatch.resourceImpact.selectedAppsDescription")}{" "}
        {willRequestApproval
          ? t("dispatch.resourceImpact.willBeQueued")
          : t("dispatch.resourceImpact.takesEffectImmediately")}
      </p>
      {overrides.count > 0 ? (
        <div className="mt-2 space-y-1">
          {overrides.items.slice(0, 4).map((override: any) => (
            <div
              key={`${override.scope}:${override.owner}`}
              className="flex items-center justify-between gap-3 rounded-md border bg-background px-2 py-1.5"
            >
              <span className="min-w-0 truncate text-muted-foreground">
                {override.label}
              </span>
              <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                {formatResourceTimestamp(override.updatedAt)}
              </span>
            </div>
          ))}
          {overrides.count > 4 ? (
            <div className="text-muted-foreground">
              +
              {t("dispatch.resourceImpact.moreOverrides", {
                count: overrides.count - 4,
              })}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
