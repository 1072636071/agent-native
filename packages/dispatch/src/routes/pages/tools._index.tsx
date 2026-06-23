import { ToolsListPage } from "@agent-native/core/client/tools";
import { useI18n } from "@agent-native/i18n";

export function meta() {
  return [{ title: "Extensions \u2014 Dispatch" }];
}

export default function ToolsRoute() {
  const { t } = useI18n();
  return <ToolsListPage />;
}
