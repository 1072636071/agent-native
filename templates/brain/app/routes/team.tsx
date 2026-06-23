import { useI18n } from "@agent-native/i18n";
import { TeamPage } from "@agent-native/core/client/org";

export function meta() {
  return [{ title: "brain.team.pageTitle" }];
}

export default function TeamRoute() {
  const { t } = useI18n();
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
      <TeamPage createOrgDescription={t("brain.team.createOrg")} />
    </main>
  );
}
