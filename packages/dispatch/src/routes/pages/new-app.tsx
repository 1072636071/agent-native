import { NewWorkspaceAppFlow } from "@agent-native/core/client";
import { useI18n } from "@agent-native/i18n";
import { DispatchShell } from "@/components/dispatch-shell";

export function meta() {
  return [{ title: "New App — Dispatch" }];
}

export default function NewAppRoute() {
  const { t } = useI18n();
  return (
    <DispatchShell
      title={t("dispatch.newApp.title")}
      description={t("dispatch.newApp.description")}
    >
      <NewWorkspaceAppFlow sourceApp="dispatch" className="px-0 py-0" />
    </DispatchShell>
  );
}
