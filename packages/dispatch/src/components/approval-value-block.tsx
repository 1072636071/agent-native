import { useI18n } from "@agent-native/i18n";

export function parseApprovalValue(value: string | null | undefined): unknown {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export function approvalValuePreview(
  value: unknown,
  t?: (...args: any[]) => string,
): string {
  if (value === null || value === undefined)
    return t ? t("dispatch.approvalValue.none") : "None";
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

export function ApprovalValueBlock({
  label,
  value,
}: {
  label: string;
  value: unknown;
}) {
  const { t } = useI18n();
  return (
    <div className="space-y-1.5">
      <div className="text-[11px] font-medium uppercase text-muted-foreground">
        {label}
      </div>
      <pre className="max-h-40 overflow-auto rounded-lg border bg-background p-2 text-[11px] leading-relaxed text-foreground">
        {approvalValuePreview(value, t)}
      </pre>
    </div>
  );
}
