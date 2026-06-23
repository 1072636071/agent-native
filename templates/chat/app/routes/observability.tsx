import { ObservabilityDashboard } from "@agent-native/core/client";
import { useSetPageTitle } from "@/components/layout/HeaderActions";
import { useI18n } from "@agent-native/i18n";

export function meta() {
  return [{ title: "chat.observability.title" }];
}

export default function ObservabilityPage() {
  const { t } = useI18n();
  useSetPageTitle(t("chat.observability.pageTitle"));
  return (
    <div className="p-6">
      <ObservabilityDashboard />
    </div>
  );
}
