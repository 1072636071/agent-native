import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@agent-native/i18n";
import { useActionMutation, useActionQuery } from "@agent-native/core/client";
import {
  IconAdjustments,
  IconBuilding,
  IconDeviceFloppy,
  IconFileText,
  IconGauge,
  IconMessageCircle,
  IconShieldCheck,
} from "@tabler/icons-react";
import {
  type BrainSettings,
  type SettingsResponse,
  defaultSettings,
} from "@/lib/brain";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { EmptyActionState, PageHeader } from "@/components/brain/Surface";



export default function SettingsRoute() {
  const { t } = useI18n();

  const toneOptions = [
    { value: "direct", label: t("brain.settings.tone.direct"), description: t("brain.settings.tone.directDesc") },
    { value: "friendly", label: t("brain.settings.tone.friendly"), description: t("brain.settings.tone.friendlyDesc") },
    { value: "formal", label: t("brain.settings.tone.formal"), description: t("brain.settings.tone.formalDesc") },
    { value: "technical", label: t("brain.settings.tone.technical"), description: t("brain.settings.tone.technicalDesc") },
  ] as const;

  const sourcePolicyOptions = [
    { value: "strict", label: t("brain.settings.sourcePolicy.strict"), description: t("brain.settings.sourcePolicy.strictDesc") },
    { value: "balanced", label: t("brain.settings.sourcePolicy.balanced"), description: t("brain.settings.sourcePolicy.balancedDesc") },
    { value: "exploratory", label: t("brain.settings.sourcePolicy.exploratory"), description: t("brain.settings.sourcePolicy.exploratoryDesc") },
  ] as const;

  type ToneValue = (typeof toneOptions)[number]["value"];
  type SourcePolicyValue = (typeof sourcePolicyOptions)[number]["value"];

  const settingsQuery = useActionQuery<SettingsResponse>(
    "get-brain-settings" as any,
    {} as any,
  );
  const saveSettings = useActionMutation<unknown, BrainSettings>(
    "update-brain-settings" as any,
  );

  const loaded = useMemo(
    () => ({ ...defaultSettings, ...(settingsQuery.data?.settings ?? {}) }),
    [settingsQuery.data],
  );
  const [settings, setSettings] = useState<BrainSettings>(loaded);

  useEffect(() => {
    setSettings(loaded);
  }, [loaded]);

  const isDirty = useMemo(
    () => JSON.stringify(settings) !== JSON.stringify(loaded),
    [loaded, settings],
  );

  const toneDescription =
    toneOptions.find((option) => option.value === settings.assistantTone)
      ?.description ?? toneOptions[0].description;
  const sourcePolicyDescription =
    sourcePolicyOptions.find((option) => option.value === settings.sourcePolicy)
      ?.description ?? sourcePolicyOptions[1].description;

  function update<K extends keyof BrainSettings>(
    key: K,
    value: BrainSettings[K],
  ) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="min-h-full bg-background">
      <PageHeader
        eyebrow={t("brain.settings.eyebrow")}
        title={t("brain.settings.title")}
        description={t("brain.settings.description")}
        actions={
          <Button
            size="sm"
            className="w-full sm:w-auto"
            disabled={saveSettings.isPending || !isDirty}
            onClick={() => saveSettings.mutate(settings)}
          >
            <IconDeviceFloppy className="size-4" />
            {saveSettings.isPending
              ? t("brain.settings.saving")
              : isDirty
                ? t("brain.settings.saveChanges")
                : t("brain.settings.saved")}
          </Button>
        }
      />

      <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:p-7">
        <main className="grid gap-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <IconBuilding className="size-4 text-primary" />
                {t("brain.settings.identity")}
              </CardTitle>
              <CardDescription>
                {t("brain.settings.identityDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-2">
              <TextField
                id="company-name"
                label={t("brain.settings.companyName")}
                value={settings.companyName ?? ""}
                placeholder={t("brain.settings.companyNamePlaceholder")}
                onChange={(value) => update("companyName", value)}
              />
              <TextField
                id="assistant-name"
                label={t("brain.settings.assistantName")}
                value={settings.assistantName ?? ""}
                placeholder={t("brain.settings.assistantNamePlaceholder")}
                onChange={(value) => update("assistantName", value)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <IconMessageCircle className="size-4 text-primary" />
                {t("brain.settings.assistantBehavior")}
              </CardTitle>
              <CardDescription>
                {t("brain.settings.assistantBehaviorDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid gap-5 md:grid-cols-2">
                <SelectField
                  id="assistant-tone"
                  label={t("brain.settings.tone")}
                  value={(settings.assistantTone ?? "direct") as ToneValue}
                  options={toneOptions}
                  onChange={(value) => update("assistantTone", value)}
                />
                <SelectField
                  id="source-policy"
                  label={t("brain.settings.sourcePolicy")}
                  value={
                    (settings.sourcePolicy ?? "balanced") as SourcePolicyValue
                  }
                  options={sourcePolicyOptions}
                  onChange={(value) => update("sourcePolicy", value)}
                />
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <p className="rounded-md border border-border bg-muted/30 p-3 text-xs leading-5 text-muted-foreground">
                  {toneDescription}
                </p>
                <p className="rounded-md border border-border bg-muted/30 p-3 text-xs leading-5 text-muted-foreground">
                  {sourcePolicyDescription}
                </p>
              </div>
              <Separator />
              <div className="grid gap-2">
                <Label htmlFor="distillation-instructions">
                  {t("brain.settings.distillationInstructions")}
                </Label>
                <Textarea
                  id="distillation-instructions"
                  value={settings.distillationInstructions ?? ""}
                  onChange={(event) =>
                    update("distillationInstructions", event.target.value)
                  }
                  className="min-h-36 resize-y leading-6"
                />
                <p className="text-xs leading-5 text-muted-foreground">
                  {t("brain.settings.distillationInstructionsPlaceholder")}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <IconAdjustments className="size-4 text-primary" />
                {t("brain.settings.publishingReview")}
              </CardTitle>
              <CardDescription>
                {t("brain.settings.publishingReviewDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="publish-tier">{t("brain.settings.publishTier")}</Label>
                  <Select
                    value={settings.defaultPublishTier}
                    onValueChange={(value) =>
                      update(
                        "defaultPublishTier",
                        value as BrainSettings["defaultPublishTier"],
                      )
                    }
                  >
                    <SelectTrigger id="publish-tier">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="private">{t("brain.settings.publishTierPrivate")}</SelectItem>
                        <SelectItem value="team">{t("brain.settings.publishTierTeam")}</SelectItem>
                        <SelectItem value="company">{t("brain.settings.publishTierCompany")}</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <p className="text-xs leading-5 text-muted-foreground">
                    {t("brain.settings.publishTierDesc")}
                  </p>
                </div>

                <NumberField
                  id="connector-poll-minutes"
                  label={t("brain.settings.pollInterval")}
                  value={settings.connectorPollMinutes ?? 60}
                  min={5}
                  max={1440}
                  suffix={t("brain.settings.minSuffix")}
                  onChange={(value) => update("connectorPollMinutes", value)}
                  t={t}
                />
              </div>

              <Separator />

              <div className="grid gap-4">
                <SettingSwitch
                  label={t("brain.settings.approvalRequired")}
                  description={t("brain.settings.approvalRequiredDesc")}
                  checked={Boolean(settings.requireApprovalForCompanyKnowledge)}
                  onChange={(checked) =>
                    update("requireApprovalForCompanyKnowledge", checked)
                  }
                />
                <SettingSwitch
                  label={t("brain.settings.autoArchiveDesc")}
                  description={t("brain.settings.autoArchiveResolvedDesc")}
                  checked={Boolean(settings.autoArchiveResolved)}
                  onChange={(checked) => update("autoArchiveResolved", checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <IconShieldCheck className="size-4 text-primary" />
                {t("brain.settings.safetyEvidence")}
              </CardTitle>
              <CardDescription>
                {t("brain.settings.safetyEvidenceDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <SettingSwitch
                label={t("brain.settings.sanitizePII")}
                description={t("brain.settings.sanitizePIIDesc")}
                checked={settings.captureSanitizationEnabled !== false}
                onChange={(checked) =>
                  update("captureSanitizationEnabled", checked)
                }
              />
              {settings.captureSanitizationEnabled !== false ? (
                <div className="grid gap-4 rounded-md border border-border p-4">
                  <div className="grid gap-2">
                    <Label htmlFor="capture-sanitization-model">
                      {t("brain.settings.sanitizationModel")}
                    </Label>
                    <Input
                      id="capture-sanitization-model"
                      value={settings.captureSanitizationModel ?? ""}
                      placeholder={t("brain.settings.sanitizationModelPlaceholder")}
                      onChange={(event) =>
                        update("captureSanitizationModel", event.target.value)
                      }
                    />
                    <p className="text-xs leading-5 text-muted-foreground">
                      {t("brain.settings.sanitizationModelDesc")}
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="capture-sanitization-instructions">
                      {t("brain.settings.sanitizationInstructions")}
                    </Label>
                    <Textarea
                      id="capture-sanitization-instructions"
                      value={settings.captureSanitizationInstructions ?? ""}
                      onChange={(event) =>
                        update(
                          "captureSanitizationInstructions",
                          event.target.value,
                        )
                      }
                      className="min-h-24 resize-y leading-6"
                    />
                  </div>
                </div>
              ) : null}
              <SettingSwitch
                label={t("brain.settings.redactConfidential")}
                description={t("brain.settings.redactConfidentialDesc")}
                checked={Boolean(settings.autoRedactEmails)}
                onChange={(checked) => update("autoRedactEmails", checked)}
              />
              <SettingSwitch
                label={t("brain.settings.citationRequired")}
                description={t("brain.settings.citationRequiredDesc")}
                checked={Boolean(settings.requireCitations)}
                onChange={(checked) => update("requireCitations", checked)}
              />
              <SettingSwitch
                label={t("brain.settings.sourceErrorNotification")}
                description={t("brain.settings.sourceErrorNotificationDesc")}
                checked={Boolean(settings.notifyOnSourceErrors)}
                onChange={(checked) => update("notifyOnSourceErrors", checked)}
              />
            </CardContent>
          </Card>
        </main>

        <aside className="grid content-start gap-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <IconFileText className="size-4 text-primary" />
                {t("brain.settings.currentPolicy")}
              </CardTitle>
              <CardDescription>
                {t("brain.settings.currentPolicyDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <PolicyRow
                label={t("brain.settings.policyRowAssistant")}
                value={settings.assistantName || "Brain"}
              />
              <PolicyRow
                label={t("brain.settings.policyRowCompany")}
                value={settings.companyName || t("brain.settings.policyNotSet")}
              />
              <PolicyRow
                label={t("brain.settings.policyRowTone")}
                value={settings.assistantTone ?? "direct"}
              />
              <PolicyRow
                label={t("brain.settings.policyRowSources")}
                value={settings.sourcePolicy ?? "balanced"}
              />
              <PolicyRow
                label={t("brain.settings.policyRowPublishTier")}
                value={settings.defaultPublishTier ?? "team"}
              />
              <PolicyRow
                label={t("brain.settings.policyRowApproval")}
                value={
                  settings.requireApprovalForCompanyKnowledge
                    ? t("brain.settings.policyRequired")
                    : t("brain.settings.policyNotRequired")
                }
              />
              <PolicyRow
                label={t("brain.settings.policyRowRedaction")}
                value={settings.autoRedactEmails ? t("brain.settings.policyEnabled") : t("brain.settings.policyDisabled")}
              />
              <PolicyRow
                label={t("brain.settings.policyRowPreSaveFilter")}
                value={
                  settings.captureSanitizationEnabled === false
                    ? t("brain.settings.policyDisabled")
                    : t("brain.settings.policyEnabled")
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <IconGauge className="size-4 text-primary" />
                {t("brain.settings.autoPublishGateTitle")}
              </CardTitle>
              <CardDescription>
                {t("brain.settings.autoPublishGateDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">
                  {t("brain.settings.confidenceThreshold")}
                </span>
                <Badge variant="secondary">90%+</Badge>
              </div>
              <Progress value={90} className="h-2" />
              <p className="text-xs leading-5 text-muted-foreground">
                {t("brain.settings.autoPublishDetail")}
              </p>
            </CardContent>
          </Card>

          {settingsQuery.isError || saveSettings.isError ? (
            <EmptyActionState
              title={t("brain.settings.error")}
              detail={t("brain.settings.errorDetail")}
            />
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function TextField({
  id,
  label,
  value,
  placeholder,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function SelectField<TValue extends string>({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: TValue;
  options: ReadonlyArray<{ value: TValue; label: string }>;
  onChange: (value: TValue) => void;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={(next) => onChange(next as TValue)}>
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}

function NumberField({
  id,
  label,
  value,
  min,
  max,
  suffix,
  onChange,
  t,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  suffix: string;
  onChange: (value: number) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex">
        <Input
          id={id}
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="rounded-r-none"
        />
        <div className="flex min-w-20 items-center justify-center rounded-r-md border border-l-0 border-input bg-muted px-3 text-sm text-muted-foreground">
          {suffix}
        </div>
      </div>
      <p className="text-xs leading-5 text-muted-foreground">
        {t("brain.settings.numberFieldHint", { min: String(min), max: String(max) })}
      </p>
    </div>
  );
}

function SettingSwitch({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex flex-col items-start justify-between gap-4 rounded-md border border-border p-4 sm:flex-row sm:items-center">
      <span className="min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-muted-foreground">
          {description}
        </span>
      </span>
      <Switch
        className="shrink-0"
        checked={checked}
        onCheckedChange={onChange}
      />
    </label>
  );
}

function PolicyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="min-w-0 text-muted-foreground">{label}</span>
      <span className="max-w-40 truncate text-right font-medium capitalize">
        {value.replace(/_/g, " ")}
      </span>
    </div>
  );
}
