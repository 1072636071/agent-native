import { useI18n } from "@agent-native/i18n";
import { ExtensionViewerPage } from "@agent-native/core/client/extensions";

export function meta() {
  return [{ title: "Extension — Dispatch" }];
}

export default function ExtensionViewerRoute() {
  const { t } = useI18n();
  return <ExtensionViewerPage />;
}
