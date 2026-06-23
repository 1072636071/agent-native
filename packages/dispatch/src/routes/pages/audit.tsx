import { useActionQuery } from "@agent-native/core/client";
import { useI18n } from "@agent-native/i18n";
import { DispatchShell } from "@/components/dispatch-shell";

export function meta() {
  return [{ title: "Audit — Dispatch" }];
}

export default function AuditRoute() {
  const { t } = useI18n();
  const { data } = useActionQuery("list-dispatch-audit", { limit: 100 });

  return (
    <DispatchShell
      title={t("dispatch.audit.title")}
      description={t("dispatch.audit.description")}
    >
      <section className="rounded-2xl border bg-card p-5">
        <div className="space-y-3">
          {(data || []).map((event: any) => (
            <div
              key={event.id}
              className="rounded-xl border bg-muted/30 px-4 py-3"
            >
              <div className="text-sm font-medium text-foreground">
                {event.summary}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {event.actor} · {event.action} ·{" "}
                {new Date(event.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
          {(data?.length || 0) === 0 && (
            <div className="rounded-xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
              {t("dispatch.audit.noAuditEntriesYet")}
            </div>
          )}
        </div>
      </section>
    </DispatchShell>
  );
}
