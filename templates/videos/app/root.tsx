import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { useCallback, useState, useEffect } from "react";
import { useNavigationState } from "@/hooks/use-navigation-state";
import { useQueryClient } from "@tanstack/react-query";
import {
  AppProviders,
  CommandMenu,
  appPath,
  createAgentNativeQueryClient,
  useCommandMenuShortcut,
  useDbSync,
} from "@agent-native/core/client";
import { I18nProvider, useI18n, useLocale } from "@agent-native/i18n";
import { Layout as AppLayout } from "@/components/layout/Layout";
import { IconSun, IconMoon } from "@tabler/icons-react";
import { useTheme } from "next-themes";
import type { LinksFunction } from "react-router";
import stylesheet from "./global.css?url";
import { TAB_ID } from "@/lib/tab-id";
import {
  configureTracking,
  getThemeInitScript,
} from "@agent-native/core/client";
configureTracking({
  getDefaultProps: (_name, properties) => ({
    ...properties,
    app: "agent-native-videos",
  }),
});

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
];

const THEME_INIT_SCRIPT = getThemeInitScript("dark", true);

export function Layout({ children }: { children: React.ReactNode }) {
  const { locale } = useLocale();
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
        <link rel="manifest" href={appPath("/manifest.json")} />
        <meta name="theme-color" content="#EF4444" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="Videos" />
        <link rel="icon" type="image/svg+xml" href={appPath("/favicon.svg")} />
        <link rel="apple-touch-icon" href={appPath("/icon-180.svg")} />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

function AppContent() {
  useNavigationState();
  const qc = useQueryClient();
  useDbSync({
    queryClient: qc,
    queryKeys: ["action", "env-status"],
    ignoreSource: TAB_ID,
  });
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [cmdkOpen, setCmdkOpen] = useState(false);
  useCommandMenuShortcut(useCallback(() => setCmdkOpen(true), []));
  const { t } = useI18n();

  return (
    <>
      <CommandMenu open={cmdkOpen} onOpenChange={setCmdkOpen}>
        <CommandMenu.Group heading={t("command.videos")}>
          <CommandMenu.Item onSelect={() => {}}>
            {t("command.searchCompositions")}
          </CommandMenu.Item>
        </CommandMenu.Group>
        <CommandMenu.Group heading={t("command.appearance")}>
          <CommandMenu.Item
            onSelect={() => setTheme(isDark ? "light" : "dark")}
            keywords={["theme", "dark", "light", "mode"]}
          >
            {isDark ? <IconSun size={16} /> : <IconMoon size={16} />}
            {isDark ? t("command.toggleLight") : t("command.toggleDark")}
          </CommandMenu.Item>
        </CommandMenu.Group>
      </CommandMenu>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </>
  );
}

export default function Root() {
  const [queryClient] = useState(() => createAgentNativeQueryClient());
  return (
    <AppProviders queryClient={queryClient} defaultTheme="dark">
      <I18nProvider>
        <AppContent />
      </I18nProvider>
    </AppProviders>
  );
}

export { ErrorBoundary } from "@agent-native/core/client";
