import { Button } from "@/components/ui/button";
import { Link } from "react-router";
import { IconFileUnknown } from "@tabler/icons-react";
import { useI18n } from "@agent-native/i18n";

export default function NotFound() {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
      <div className="bg-destructive/10 p-4 rounded-full">
        <IconFileUnknown className="h-8 w-8 text-destructive" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight">{t("analytics.notFound.title")}</h2>
      <p className="text-muted-foreground max-w-sm">
        {t("analytics.notFound.description")}
      </p>
      <Link to="/">
        <Button variant="default">{t("analytics.notFound.returnToDashboard")}</Button>
      </Link>
    </div>
  );
}
