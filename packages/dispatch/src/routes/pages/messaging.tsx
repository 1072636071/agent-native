import { useI18n } from "@agent-native/i18n";
import { MessagingSetupPanel } from "@/components/messaging-setup-panel";
import { DispatchShell } from "@/components/dispatch-shell";

export function meta() {
  return [{ title: "Messaging — Dispatch" }];
}

export default function MessagingRoute() {
  const { t } = useI18n();
  return (
    <DispatchShell
      title={t("dispatch.messaging.title")}
      description={t("dispatch.messaging.description")}
    >
      <MessagingSetupPanel />
    </DispatchShell>
  );
}
