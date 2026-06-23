import { useActionMutation, useActionQuery } from "@agent-native/core/client";
import { toast } from "sonner";
import { useI18n } from "@agent-native/i18n";
import { DispatchShell } from "@/components/dispatch-shell";
import { Button } from "@/components/ui/button";

export function meta() {
  return [{ title: "Identities — Dispatch" }];
}

export default function IdentitiesRoute() {
  const { t } = useI18n();
  const { data } = useActionQuery("list-linked-identities", {});
  const createToken = useActionMutation("create-link-token", {
    onSuccess: () => toast.success(t("dispatch.identities.linkTokenCreated")),
  });

  return (
    <DispatchShell
      title={t("dispatch.identities.title")}
      description={t("dispatch.identities.description")}
    >
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-foreground">
              {t("dispatch.identities.activeLinks")}
            </h2>
            <div className="flex shrink-0 gap-2">
              <Button
                variant="outline"
                onClick={() => createToken.mutate({ platform: "slack" })}
              >
                {t("dispatch.identities.newSlackToken")}
              </Button>
              <Button
                onClick={() => createToken.mutate({ platform: "telegram" })}
              >
                {t("dispatch.identities.newTelegramToken")}
              </Button>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {(data?.links || []).map((link: any) => (
              <div
                key={link.id}
                className="rounded-xl border bg-muted/30 px-4 py-3"
              >
                <div className="text-sm font-medium text-foreground">
                  {link.externalUserName || link.externalUserId}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {link.platform} → {link.ownerEmail}
                </div>
              </div>
            ))}
            {(data?.links?.length || 0) === 0 && (
              <div className="rounded-xl border border-dashed px-4 py-8 text-sm text-muted-foreground">
                {t("dispatch.identities.noLinkedIdentitiesYet")}{" "}
                <code>/link TOKEN</code>{" "}
                {t("dispatch.identities.fromSlackOrTelegram")}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-5">
          <h2 className="text-lg font-semibold text-foreground">
            {t("dispatch.identities.linkTokens")}
          </h2>
          <div className="mt-4 space-y-3">
            {(data?.tokens || []).map((token: any) => (
              <div key={token.id} className="rounded-xl border px-4 py-3">
                <div className="text-sm font-medium text-foreground">
                  /link {token.token}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {token.platform} · {t("dispatch.identities.expires")}{" "}
                  {new Date(token.expiresAt).toLocaleString()}
                  {token.claimedAt
                    ? ` · claimed by ${token.claimedByExternalUserName || token.claimedByExternalUserId}`
                    : " · waiting to be claimed"}
                </div>
              </div>
            ))}
            {(data?.tokens?.length || 0) === 0 && (
              <div className="rounded-xl border border-dashed px-4 py-8 text-sm text-muted-foreground">
                {t("dispatch.identities.noActiveLinkTokens")}
              </div>
            )}
          </div>
        </section>
      </div>
    </DispatchShell>
  );
}
