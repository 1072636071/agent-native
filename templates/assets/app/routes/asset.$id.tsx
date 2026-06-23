import { Link, useNavigate, useParams } from "react-router";
import {
  useEffect,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import {
  sendToAgentChat,
  useActionMutation,
  useActionQuery,
} from "@agent-native/core/client";
import { useI18n } from "@agent-native/i18n";
import {
  IconArrowLeft,
  IconClipboard,
  IconCopy,
  IconDownload,
  IconTrash,
  IconVideo,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { assetMediaUrl } from "@/lib/asset-urls";
import { assetPreviewSources } from "@/lib/asset-preview-sources";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function AssetDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const assetQuery = useActionQuery("get-asset", { id: id! }) as any;
  const exportAsset = useActionMutation("export-asset");
  const deleteAsset = useActionMutation("delete-asset");
  const asset = assetQuery.data;

  if (!asset) {
    if (assetQuery.isLoading || assetQuery.isPending || assetQuery.isFetching) {
      return (
        <div className="p-6 text-sm text-muted-foreground">
          {t("assets.detail.loading")}
        </div>
      );
    }
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="max-w-sm space-y-3 text-center">
          <h2 className="text-lg font-semibold tracking-tight">
            {t("assets.detail.unavailableTitle")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("assets.detail.unavailableDesc")}
          </p>
          <Button asChild variant="outline">
            <Link to="/library">{t("assets.detail.backToLibrary")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isVideo =
    asset.mediaType === "video" || asset.mimeType?.startsWith("video/");
  const previewSources = assetPreviewSources(asset);
  const previewUrl = previewSources[0];
  const categoryLabel = assetCategoryLabel(asset, t);
  const isStarterAsset =
    asset.metadata?.isStarterAsset === true ||
    String(asset.libraryId || "").startsWith("starter:");
  const libraryBackPath = isStarterAsset
    ? "/library"
    : `/brand-kits/${asset.libraryId}`;
  const libraryBackLabel = isStarterAsset
    ? t("assets.detail.library")
    : t("assets.detail.brandKit");

  function refine() {
    sendToAgentChat({
      message: isVideo
        ? `Create a new video variation inspired by asset ${asset.id}. Ask me what should change, then call generate-video with this libraryId and folderId when ready.`
        : `Refine image ${asset.id}. Ask me what to change, then call refine-image with this assetId and show the new preview.`,
      context: `Asset: ${asset.id}\nLibrary: ${asset.libraryId}\nFolder: ${asset.folderId || "none"}\nPrompt: ${asset.prompt || ""}`,
      submit: true,
      newTab: true,
    });
  }

  async function copyTextToClipboard(text: string, successMessage: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(successMessage);
    } catch {
      toast.error(t("assets.detail.copyFailed"));
    }
  }

  function assetUrlForClipboard(url: string | undefined) {
    if (!url) return "";
    return new URL(url, window.location.origin).toString();
  }

  function handoffPrompt() {
    const previewLine = previewUrl
      ? `Preview URL: ${assetUrlForClipboard(previewUrl)}`
      : null;
    return [
      `Handoff asset ${asset.id}.`,
      `Library ID: ${asset.libraryId}`,
      asset.collectionId ? `Collection ID: ${asset.collectionId}` : null,
      asset.metadata?.presetId ? `Preset ID: ${asset.metadata.presetId}` : null,
      asset.generationRunId ? `Run ID: ${asset.generationRunId}` : null,
      previewLine,
      `Prompt: ${asset.prompt || asset.description || "Continue refining this asset."}`,
      "Ask what should change, then refine this active image and show the new preview.",
    ]
      .filter(Boolean)
      .join("\n");
  }

  return (
    <div className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="overflow-y-auto border-b border-border bg-background p-5 lg:border-b-0 lg:border-r">
        <div className="mb-4">
          <Button variant="ghost" size="sm" asChild className="-ml-2 gap-2">
            <Link to={libraryBackPath}>
              <IconArrowLeft className="h-4 w-4" />
              {libraryBackLabel}
            </Link>
          </Button>
        </div>
        <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          {isVideo && <IconVideo className="h-4 w-4 text-muted-foreground" />}
          {asset.title || (isVideo ? t("assets.detail.videoAsset") : t("assets.detail.loading"))}
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="secondary">{asset.status}</Badge>
          <Badge variant="outline">{asset.role}</Badge>
          <Badge variant="outline">{isVideo ? t("assets.index.labelVideo") : t("assets.index.labelImage")}</Badge>
          {categoryLabel && <Badge variant="outline">{categoryLabel}</Badge>}
        </div>
        <Separator className="my-5" />
        <div className="space-y-4 text-sm">
          {isVideo ? (
            <Field
              label={t("assets.detail.fieldVideo")}
              value={`${asset.durationSeconds || "?"}s · ${asset.aspectRatio || "n/a"} · ${asset.model || "n/a"}`}
            />
          ) : (
            <Field
              label={t("assets.detail.fieldDimensions")}
              value={`${asset.width || "?"} x ${asset.height || "?"}`}
            />
          )}
          <Field label={t("assets.detail.fieldMime")} value={asset.mimeType || "n/a"} />
          <Field label={t("assets.detail.fieldFolder")} value={asset.folderId || t("assets.detail.unfiled")} />
          <Field
            label={t("assets.detail.fieldDescription")}
            value={
              asset.description || asset.altText || t("assets.detail.noDescription")
            }
            multiline
          />
          <Field
            label={t("assets.detail.fieldPrompt")}
            value={asset.prompt || t("assets.detail.noPrompt")}
            multiline
          />
        </div>
        <Separator className="my-5" />
        <div className="grid gap-3">
          {!isStarterAsset ? (
            <Button onClick={refine}>
              {isVideo ? t("assets.detail.makeVideoVariation") : t("assets.detail.makeVariations")}
            </Button>
          ) : null}
          <div className="flex items-center gap-2">
            {!isVideo && !isStarterAsset ? (
              <AssetActionButton
                label={t("assets.detail.handoff")}
                onClick={() =>
                  void copyTextToClipboard(handoffPrompt(), t("assets.detail.copiedPrompt"))
                }
              >
                <IconClipboard className="h-4 w-4" />
              </AssetActionButton>
            ) : null}
            <AssetActionButton
              label={t("assets.detail.download")}
              disabled={exportAsset.isPending}
              onClick={() => {
                if (isStarterAsset) {
                  const downloadUrl =
                    assetMediaUrl(asset.downloadUrl) ?? previewUrl;
                  if (downloadUrl) window.location.href = downloadUrl;
                  return;
                }
                exportAsset.mutate(
                  { assetId: asset.id },
                  {
                    onSuccess: (result: any) => {
                      window.location.href =
                        assetMediaUrl(result.downloadUrl) ?? result.downloadUrl;
                    },
                  },
                );
              }}
            >
              <IconDownload className="h-4 w-4" />
            </AssetActionButton>
            <AssetActionButton
              label={t("assets.detail.copyUrl")}
              disabled={!previewUrl}
              onClick={() => {
                if (previewUrl) {
                  void copyTextToClipboard(
                    assetUrlForClipboard(previewUrl),
                    t("assets.detail.copiedUrl"),
                  );
                }
              }}
            >
              <IconCopy className="h-4 w-4" />
            </AssetActionButton>
            {!isStarterAsset ? (
              <AlertDialog>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t("assets.detail.delete")}
                        className="size-9 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        disabled={deleteAsset.isPending}
                      >
                        <IconTrash className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="top">{t("assets.detail.delete")}</TooltipContent>
                </Tooltip>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("assets.detail.deleteTitle")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("assets.detail.deleteDesc")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("assets.detail.deleteCancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() =>
                        deleteAsset.mutate(
                          { id: asset.id },
                          {
                            onSuccess: () =>
                              navigate(`/brand-kits/${asset.libraryId}`),
                          },
                        )
                      }
                    >
                      {t("assets.detail.deleteConfirm")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : null}
          </div>
        </div>
      </aside>
      <div className="flex min-h-0 items-center justify-center bg-muted/30 p-6">
        {isVideo ? (
          <video
            src={previewUrl}
            controls
            playsInline
            className="max-h-full max-w-full rounded-lg border border-border bg-black object-contain shadow-sm"
          />
        ) : (
          <AssetImagePreview
            sources={previewSources}
            alt={asset.altText || asset.title || ""}
          />
        )}
      </div>
    </div>
  );
}

function AssetActionButton({
  label,
  children,
  className,
  ...props
}: ComponentProps<typeof Button> & {
  label: string;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={label}
          className={cn("size-9 shrink-0", className)}
          {...props}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}

function assetCategoryLabel(asset: any, t: (key: string) => string): string | null {
  if (
    asset?.metadata?.intent === "subject" ||
    asset?.role === "subject_reference"
  ) {
    return t("assets.detail.labelContentOnly");
  }
  const category = asset?.metadata?.category;
  if (typeof category !== "string") return null;
  if (category === "style-only") return t("assets.detail.labelStyleRef");
  return category.replace(/-/g, " ");
}

function AssetImagePreview({
  sources,
  alt,
}: {
  sources: string[];
  alt: string;
}) {
  const { t } = useI18n();
  const [sourceIndex, setSourceIndex] = useState(0);
  const [unavailable, setUnavailable] = useState(false);
  const sourcesKey = sources.join("\n");

  useEffect(() => {
    setSourceIndex(0);
    setUnavailable(false);
  }, [sourcesKey]);

  const src = sources[sourceIndex];
  if (!src || unavailable) {
    return (
      <div className="flex min-h-48 min-w-72 items-center justify-center rounded-lg border border-dashed border-border bg-background px-6 text-sm font-medium text-muted-foreground">
        {t("assets.detail.previewUnavailable")}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className="max-h-full max-w-full rounded-lg border border-border object-contain shadow-sm"
      onError={() => {
        const nextIndex = sourceIndex + 1;
        if (nextIndex < sources.length) {
          setSourceIndex(nextIndex);
        } else {
          setUnavailable(true);
        }
      }}
    />
  );
}

function Field({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className={multiline ? "mt-1 whitespace-pre-wrap" : "mt-1 truncate"}>
        {value}
      </div>
    </div>
  );
}
