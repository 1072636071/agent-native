import { ExtensionsListPage } from "@agent-native/core/client/extensions";
import { useI18n } from "@agent-native/i18n";
import { useSetPageTitle } from "@/components/layout/HeaderActions";

export function meta() {
  return [{ title: "chat.extensions.title" }];
}

export default function ExtensionsRoute() {
  const { t } = useI18n();
  useSetPageTitle(t("chat.extensions.title"));
  return <ExtensionsListPage />;
}
