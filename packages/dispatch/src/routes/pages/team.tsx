import { useI18n } from "@agent-native/i18n";
import { TeamPage } from "@agent-native/core/client/org";
import { DispatchShell } from "@/components/dispatch-shell";

export function meta() {
  return [{ title: "Team — Dispatch" }];
}

export default function TeamRoute() {
  const { t } = useI18n();
  return (
    <TeamPage
      title={t("dispatch.team.title")}
      createOrgDescription={t("dispatch.team.createOrgDescription")}
      layout={(children) => (
        <DispatchShell
          title={t("dispatch.team.title")}
          description={t("dispatch.team.description")}
        >
          {children}
        </DispatchShell>
      )}
    />
  );
}
