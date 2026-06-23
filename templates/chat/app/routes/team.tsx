import { TeamPage } from "@agent-native/core/client/org";
import { useSetPageTitle } from "@/components/layout/HeaderActions";
import { useI18n } from "@agent-native/i18n";

export function meta() {
  return [{ title: "chat.team.title" }];
}

export default function TeamRoute() {
  const { t } = useI18n();
  useSetPageTitle(t("chat.team.pageTitle"));
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
      <TeamPage createOrgDescription={t("chat.team.createOrgDescription")} />
    </main>
  );
}
