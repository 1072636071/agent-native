import { TeamPage } from "@agent-native/core/client/org";
import { useI18n } from "@agent-native/i18n";
import { useSetPageTitle } from "@/components/layout/HeaderActions";

export function meta() {
  return [{ title: "macros.team.metaTitle" }];
}

export default function TeamRoute() {
  const { t } = useI18n();
  useSetPageTitle(t("macros.team.title"));
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
      <TeamPage createOrgDescription={t("macros.team.createOrgDescription")} />
    </main>
  );
}
