import { DbAdminPage } from "@agent-native/core/client/db-admin";
import { useSetPageTitle } from "@/components/layout/HeaderActions";
import { useI18n } from "@agent-native/i18n";

export function meta() {
  return [{ title: "chat.database.title" }];
}

export default function DatabasePage() {
  const { t } = useI18n();
  useSetPageTitle(t("chat.database.pageTitle"));
  return (
    <div className="h-full">
      <DbAdminPage />
    </div>
  );
}
