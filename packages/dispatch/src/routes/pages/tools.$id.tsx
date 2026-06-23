import { ToolViewerPage } from "@agent-native/core/client/tools";
import { useI18n } from "@agent-native/i18n";

export function meta() {
  return [{ title: "Extension \u2014 Dispatch" }];
}

export default function ToolViewerRoute() {
  const { t } = useI18n();
  return <ToolViewerPage />;
}
