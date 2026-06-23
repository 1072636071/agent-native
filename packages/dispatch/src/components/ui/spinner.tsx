import { IconLoader2 } from "@tabler/icons-react";
import { useI18n } from "@agent-native/i18n";

import { cn } from "@/lib/utils";

export function Spinner({
  className,
  ...props
}: React.ComponentProps<typeof IconLoader2>) {
  const { t } = useI18n();
  return (
    <IconLoader2
      role="status"
      aria-label={t("dispatch.ui.loading")}
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  );
}
