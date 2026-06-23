import { useAuth } from "@/components/auth/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router";
import { useI18n } from "@agent-native/i18n";

export default function Settings() {
  const { t } = useI18n();
  const { auth } = useAuth();

  return (
    <div className="space-y-6 max-w-2xl">
      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle className="text-base">{t("analytics.settings.account")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {auth && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {t("analytics.settings.signedInAs")}
              </span>
              <span className="text-sm font-medium">{auth.email}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle className="text-base">{t("analytics.settings.dataSourceCredentials")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            {t("analytics.settings.credentialsDesc")}
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link to="/data-sources">{t("analytics.settings.manageDataSources")}</Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle className="text-base">{t("analytics.settings.aboutTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>{t("analytics.settings.aboutDesc1")}</p>
          <p>{t("analytics.settings.aboutDesc2")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
