import { useI18n } from "@agent-native/i18n";
import { ExtensionsListPage } from "@agent-native/core/client/extensions";

export function meta() {
  return [{ title: "Extensions — Dispatch" }];
}

export default function ExtensionsRoute() {
  const { t } = useI18n();
  return <ExtensionsListPage />;
}
