import { useMemo, useState, type KeyboardEvent } from "react";
import { useI18n } from "@agent-native/i18n";
import { useSearchParams } from "react-router";
import { useActionMutation, useActionQuery } from "@agent-native/core/client";
import {
  type Icon,
  IconChartBar,
  IconCheck,
  IconBook,
  IconDotsVertical,
  IconExternalLink,
  IconFileText,
  IconGitMerge,
  IconInfoCircle,
  IconListDetails,
  IconPencil,
  IconShieldCheck,
  IconX,
} from "@tabler/icons-react";
import { type ReviewItem, type ReviewQueueResponse } from "@/lib/brain";
import {
  type CanonicalPreviewData,
  CanonicalPreviewSheet,
} from "@/components/brain/CanonicalPreviewSheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  EmptyActionState,
  LoadingRows,
  PageHeader,
  StatusBadge,
} from "@/components/brain/Surface";
import { cn } from "@/lib/utils";

type ProposalStatus = "pending" | "approved" | "rejected";

interface ProposalDraft {
  title?: string;
  body?: string;
  rationale?: string;
}

interface TargetContext {
  label: string;
  detail: string;
  knowledgeId?: string | null;
  supersedesId?: string | null;
}

interface ProposalInsight {
  confidence: number | null;
  queueReason: string;
  privacyFlags: string[];
  target: TargetContext;
  publishTier: string | null;
  kind: string | null;
  topic: string | null;
  status: string | null;
  summary: string | null;
  tags: string[];
  approveLabel: string;
}

export default function ReviewRoute() {
  const [params, setParams] = useSearchParams();
  const status = proposalStatus(params.get("status"));
  const selectedProposalId = params.get("reviewItemId");
  const [drafts, setDrafts] = useState<Record<string, ProposalDraft>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [canonicalChoices, setCanonicalChoices] = useState<
    Record<string, boolean>
  >({});
  const [editingProposalIds, setEditingProposalIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [previewOpen, setPreviewOpen] = useState(false);
  const [canonicalPreview, setCanonicalPreview] =
    useState<CanonicalPreviewData | null>(null);
  const [previewProposal, setPreviewProposal] = useState<ReviewItem | null>(
    null,
  );
  const { t } = useI18n();

  const reviewQuery = useActionQuery<ReviewQueueResponse>(
    "list-proposals" as any,
    { status } as any,
  );
  const updateProposal = useActionMutation<
    unknown,
    {
      proposalId: string;
      title?: string;
      body?: string;
      rationale?: string;
    }
  >("update-proposal" as any);
  const approveProposal = useActionMutation<
    unknown,
    {
      proposalId: string;
      reviewerNotes?: string;
      publishCanonical?: boolean;
    }
  >("approve-proposal" as any);
  const previewCanonical = useActionMutation<
    { preview: CanonicalPreviewData },
    {
      proposalId: string;
      operation: "publish";
      draft?: {
        title?: string;
        body?: string;
      };
    }
  >("preview-canonical-resource" as any);
  const rejectProposal = useActionMutation<
    unknown,
    { proposalId: string; reviewerNotes?: string }
  >("reject-proposal" as any);

  const proposals =
    reviewQuery.data?.proposals ?? reviewQuery.data?.items ?? [];
  const pendingMutation =
    updateProposal.isPending ||
    approveProposal.isPending ||
    previewCanonical.isPending ||
    rejectProposal.isPending;
  const actionError =
    updateProposal.error ??
    approveProposal.error ??
    previewCanonical.error ??
    rejectProposal.error;

  const summary = useMemo(() => {
    const label =
      status === "pending"
        ? t("brain.review.summaryPending")
        : status === "approved"
          ? t("brain.review.summaryApproved")
          : t("brain.review.summaryRejected");
    return `${label}: ${proposals.length} ${
      proposals.length === 1 ? t("brain.review.item") : t("brain.review.items")
    } ${t("brain.review.shown")}`;
  }, [proposals.length, status, t]);

  function updateStatus(value: string) {
    const next = new URLSearchParams(params);
    if (value === "pending") next.delete("status");
    else next.set("status", value);
    setParams(next, { replace: true });
  }

  function patchDraft(proposalId: string, patch: ProposalDraft) {
    setDrafts((current) => ({
      ...current,
      [proposalId]: { ...current[proposalId], ...patch },
    }));
  }

  function draftValue(
    proposal: ReviewItem,
    field: keyof ProposalDraft,
  ): string {
    const value = drafts[proposal.id]?.[field];
    if (value !== undefined) return value;
    if (field === "title") return proposal.title;
    if (field === "body") return proposal.body ?? proposal.proposedAnswer ?? "";
    return proposal.rationale ?? "";
  }

  function hasDraftChanges(proposal: ReviewItem) {
    const draft = drafts[proposal.id];
    if (!draft) return false;
    return (
      (draft.title !== undefined && draft.title !== proposal.title) ||
      (draft.body !== undefined &&
        draft.body !== (proposal.body ?? proposal.proposedAnswer ?? "")) ||
      (draft.rationale !== undefined &&
        draft.rationale !== (proposal.rationale ?? ""))
    );
  }

  async function saveDraft(proposal: ReviewItem) {
    if (!hasDraftChanges(proposal)) return;
    await updateProposal.mutateAsync({
      proposalId: proposal.id,
      title: draftValue(proposal, "title"),
      body: draftValue(proposal, "body"),
      rationale: draftValue(proposal, "rationale"),
    });
    setDrafts((current) => {
      const next = { ...current };
      delete next[proposal.id];
      return next;
    });
  }

  async function approve(
    proposal: ReviewItem,
    options: { confirmedCanonical?: boolean } = {},
  ) {
    if (canonicalChoice(proposal) && !options.confirmedCanonical) {
      await openCanonicalPreview(proposal);
      return;
    }
    await saveDraft(proposal);
    await approveProposal.mutateAsync({
      proposalId: proposal.id,
      reviewerNotes: cleanNote(notes[proposal.id]),
      publishCanonical: canonicalChoice(proposal),
    });
  }

  async function openCanonicalPreview(proposal: ReviewItem) {
    const result = await previewCanonical.mutateAsync({
      proposalId: proposal.id,
      operation: "publish",
      draft: {
        title: draftValue(proposal, "title"),
        body: draftValue(proposal, "body"),
      },
    });
    setCanonicalPreview(result.preview);
    setPreviewProposal(proposal);
    setPreviewOpen(true);
  }

  async function approvePreviewedProposal() {
    if (!previewProposal) return;
    await approve(previewProposal, { confirmedCanonical: true });
    setPreviewOpen(false);
    setCanonicalPreview(null);
    setPreviewProposal(null);
  }

  async function reject(proposal: ReviewItem) {
    await rejectProposal.mutateAsync({
      proposalId: proposal.id,
      reviewerNotes: cleanNote(notes[proposal.id]),
    });
  }

  function canonicalChoice(proposal: ReviewItem) {
    return (
      canonicalChoices[proposal.id] ??
      readBoolean(proposal.payload?.publishCanonical)
    );
  }

  function setCanonicalChoice(proposalId: string, publishCanonical: boolean) {
    setCanonicalChoices((current) => ({
      ...current,
      [proposalId]: publishCanonical,
    }));
  }

  function toggleProposalEditing(proposalId: string) {
    setEditingProposalIds((current) => {
      const next = new Set(current);
      if (next.has(proposalId)) next.delete(proposalId);
      else next.add(proposalId);
      return next;
    });
  }

  function handleProposalShortcut(
    event: KeyboardEvent<HTMLElement>,
    proposal: ReviewItem,
  ) {
    if (pendingMutation || proposal.status !== "pending") return;
    if (isEditableTarget(event.target)) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const key = event.key.toLowerCase();
    if (key === "a") {
      event.preventDefault();
      void approve(proposal);
    } else if (key === "r") {
      event.preventDefault();
      void reject(proposal);
    } else if (key === "s" && hasDraftChanges(proposal)) {
      event.preventDefault();
      void saveDraft(proposal);
    }
  }

  return (
    <div className="min-h-full bg-muted/20">
      <PageHeader
        eyebrow="Review"
        title={t("brain.review.title")}
        description={t("brain.review.description")}
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
            <Badge variant="outline" className="w-fit max-w-full">
              {summary}
            </Badge>
            <Select value={status} onValueChange={updateStatus}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder={t("brain.review.filter.pending")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">{t("brain.review.filter.pending")}</SelectItem>
                <SelectItem value="approved">{t("brain.review.filter.approved")}</SelectItem>
                <SelectItem value="rejected">{t("brain.review.filter.rejected")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      <div className="grid gap-5 p-5 lg:p-7">
        {reviewQuery.isLoading ? (
          <LoadingRows rows={4} />
        ) : proposals.length ? (
          <div className="grid gap-4">
            {proposals.map((proposal) => {
              const evidence = proposal.evidence ?? [];
              const sourceUrl = firstSourceUrl(proposal);
              const canReview = proposal.status === "pending";
              const insight = buildProposalInsight(proposal);
              const hasChanges = hasDraftChanges(proposal);
              const publishCanonical = canonicalChoice(proposal);
              const selected = selectedProposalId === proposal.id;
              const editing = editingProposalIds.has(proposal.id);
              return (
                <Card
                  key={proposal.id}
                  tabIndex={canReview ? 0 : undefined}
                  onKeyDown={(event) => handleProposalShortcut(event, proposal)}
                  className={cn(
                    "shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    selected && "ring-2 ring-ring",
                  )}
                    aria-label={
                    canReview
                      ? t("brain.review.ariaReviewShortcut", { title: proposal.title })
                      : proposal.title
                  }
                >
                  <CardHeader className="pb-3 sm:pb-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex min-w-0 flex-col gap-2">
                          <CardTitle className="min-w-0 break-words text-base leading-6">
                            {proposal.title}
                          </CardTitle>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span>{formatDate(proposal.createdAt)}</span>
                            <span className="hidden sm:inline">/</span>
                            <span>
                              {proposal.createdBy ?? "Reviewer queue"}
                            </span>
                            {hasChanges ? (
                              <>
                                <span className="hidden sm:inline">/</span>
                                <span className="font-medium text-foreground">
                                  {t("brain.review.unsavedEdits")}
                                </span>
                              </>
                            ) : null}
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <StatusBadge status={proposal.status ?? "pending"} />
                        <ConfidenceBadge confidence={insight.confidence} />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-4 pt-0">
                    <div className="grid gap-4">
                      <p className="line-clamp-3 max-w-5xl whitespace-pre-wrap break-words text-sm leading-6 text-foreground">
                        {draftValue(proposal, "body") ||
                          t("brain.review.noProposedKnowledge")}
                      </p>
                      <ReviewSignalStrip
                        target={insight.target.label}
                        privacy={privacySummary(insight.privacyFlags)}
                        evidenceCount={evidence.length}
                        proposedAction={proposal.proposedAction}
                        publishCanonical={publishCanonical}
                        t={t}
                      />
                    </div>

                    {editing ? (
                      <div className="grid gap-4 rounded-md border border-border bg-muted/20 p-4">
                        <div className="grid gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor={`proposal-title-${proposal.id}`}>
                              {t("brain.review.titleField")}
                            </Label>
                            <Input
                              id={`proposal-title-${proposal.id}`}
                              value={draftValue(proposal, "title")}
                              disabled={!canReview || pendingMutation}
                              onChange={(event) =>
                                patchDraft(proposal.id, {
                                  title: event.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor={`proposal-body-${proposal.id}`}>
                              {t("brain.review.proposedKnowledgeField")}
                            </Label>
                            <Textarea
                              id={`proposal-body-${proposal.id}`}
                              className="min-h-32"
                              value={draftValue(proposal, "body")}
                              disabled={!canReview || pendingMutation}
                              onChange={(event) =>
                                patchDraft(proposal.id, {
                                  body: event.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label
                              htmlFor={`proposal-rationale-${proposal.id}`}
                            >
                              {t("brain.review.rationaleField")}
                            </Label>
                            <Textarea
                              id={`proposal-rationale-${proposal.id}`}
                              className="min-h-20"
                              value={draftValue(proposal, "rationale")}
                              disabled={!canReview || pendingMutation}
                              placeholder={t("brain.review.rationalePlaceholder")}
                              onChange={(event) =>
                                patchDraft(proposal.id, {
                                  rationale: event.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor={`reviewer-notes-${proposal.id}`}>
                              {t("brain.review.reviewerNotesField")}
                            </Label>
                            <Textarea
                              id={`reviewer-notes-${proposal.id}`}
                              className="min-h-20"
                              value={
                                notes[proposal.id] ??
                                proposal.reviewerNotes ??
                                ""
                              }
                              disabled={!canReview || pendingMutation}
                              placeholder={t("brain.review.reviewerNotesPlaceholder")}
                              onChange={(event) =>
                                setNotes((current) => ({
                                  ...current,
                                  [proposal.id]: event.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>

                        {canReview ? (
                          <div className="flex flex-col gap-3 rounded-md border border-border bg-background p-3 sm:flex-row sm:items-center sm:justify-between">
                            <Label
                              htmlFor={`canonical-${proposal.id}`}
                              className="flex items-center gap-2 text-sm font-medium"
                            >
                              <IconBook className="size-4 text-muted-foreground" />
                              {t("brain.review.publishCanonical")}
                            </Label>
                            <div className="flex items-center gap-3">
                              {publishCanonical ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  disabled={pendingMutation}
                                  onClick={() =>
                                    void openCanonicalPreview(proposal)
                                  }
                                >
                                  <IconFileText className="size-4" />
                                  {t("brain.review.overflow.preview")}
                                </Button>
                              ) : null}
                              <Switch
                                id={`canonical-${proposal.id}`}
                                checked={publishCanonical}
                                disabled={pendingMutation}
                                onCheckedChange={(checked) =>
                                  setCanonicalChoice(proposal.id, checked)
                                }
                              />
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="flex flex-col gap-3 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs leading-5 text-muted-foreground sm:max-w-xl">
                        {canReview
                          ? hasChanges
                            ? t("brain.review.approveHintHasChanges")
                            : t("brain.review.approveHint")
                          : reviewedSummary(proposal)}
                      </p>
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:flex sm:flex-wrap sm:justify-end">
                        <ProposalDetailsSheet
                          proposal={proposal}
                          insight={insight}
                          evidence={evidence}
                          sourceUrl={sourceUrl}
                          draftTitle={draftValue(proposal, "title")}
                          draftBody={draftValue(proposal, "body")}
                          draftRationale={draftValue(proposal, "rationale")}
                          hasDraftChanges={hasChanges}
                        />
                        <ProposalOverflowMenu
                          canReview={canReview}
                          editing={editing}
                          pendingMutation={pendingMutation}
                          publishCanonical={publishCanonical}
                          sourceUrl={sourceUrl}
                          onToggleEditing={() =>
                            toggleProposalEditing(proposal.id)
                          }
                          onPreviewCanonical={() =>
                            void openCanonicalPreview(proposal)
                          }
                        />
                        {editing && canReview ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="col-span-2 sm:col-span-1"
                            disabled={pendingMutation || !hasChanges}
                            onClick={() => void saveDraft(proposal)}
                          >
                            <IconPencil className="size-4" />
                            {t("brain.review.saveDraft")}
                          </Button>
                        ) : null}
                        {canReview ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="col-span-2 sm:col-span-1"
                              disabled={pendingMutation}
                              onClick={() => void reject(proposal)}
                            >
                              <IconX className="size-4" />
                              {t("brain.review.reject")}
                            </Button>
                            <Button
                              size="sm"
                              className="col-span-2 sm:col-span-1"
                              disabled={pendingMutation}
                              onClick={() => void approve(proposal)}
                            >
                              <IconCheck className="size-4" />
                              {insight.approveLabel}
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyActionState
            title={t("brain.review.emptyFiltered.title")}
            detail={t("brain.review.emptyFiltered.detail")}
          />
        )}

        {reviewQuery.isError || actionError ? (
          <EmptyActionState
            title={t("brain.review.emptyFiltered.title")}
            detail={
              actionError?.message ??
              reviewQuery.error?.message ??
              t("brain.review.emptyFiltered.detail")
            }
          />
        ) : null}
      </div>
      <CanonicalPreviewSheet
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        preview={canonicalPreview}
        loading={previewCanonical.isPending || approveProposal.isPending}
        error={previewCanonical.error?.message ?? null}
        primaryLabel={t("brain.review.approve")}
        primaryDisabled={!previewProposal || pendingMutation}
        onPrimaryAction={() => void approvePreviewedProposal()}
      />
    </div>
  );
}

function proposalStatus(value: string | null): ProposalStatus {
  if (value === "approved" || value === "rejected") return value;
  return "pending";
}

function cleanNote(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  if (tag === "button" || tag === "a") return true;
  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    target.isContentEditable ||
    target.getAttribute("role") === "textbox" ||
    Boolean(
      target.closest(
        "button,a,[role='button'],[role='switch'],[role='menuitem']",
      ),
    )
  );
}

function firstSourceUrl(proposal: ReviewItem) {
  for (const item of proposal.evidence ?? []) {
    const url = item.sourceUrl ?? item.url;
    if (url) return url;
  }
  return null;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function buildProposalInsight(proposal: ReviewItem): ProposalInsight {
  const payload = proposal.payload ?? {};
  const confidence = readNumber(
    payload.confidence ?? payload.score ?? payload.confidenceScore,
  );
  const publishTier = readString(payload.publishTier ?? payload.publish_tier);
  const kind = readString(payload.kind ?? payload.type);
  const topic = readString(payload.topic);
  const status = readString(payload.status);
  const summary = readString(payload.summary);
  const tags = readStringArray(payload.tags);
  const target = buildTargetContext(proposal, payload);
  const privacyFlags = buildPrivacyFlags(proposal, payload, {
    publishTier,
    status,
  });

  return {
    confidence,
    queueReason: buildQueueReason(proposal, {
      confidence,
      payload,
      publishTier,
      privacyFlags,
    }),
    privacyFlags,
    target,
    publishTier,
    kind,
    topic,
    status,
    summary,
    tags,
    approveLabel: buildApproveLabel(target, status),
  };
}

function buildTargetContext(
  proposal: ReviewItem,
  payload: Record<string, unknown>,
): TargetContext {
  const knowledgeId =
    proposal.knowledgeId ??
    readString(payload.knowledgeId ?? payload.knowledge_id);
  const supersedesId = readString(payload.supersedesId ?? payload.supersedes);

  if (knowledgeId && supersedesId) {
    return {
      label: "Merge update and supersede",
      detail: `Updates ${shortId(knowledgeId)} and archives ${shortId(
        supersedesId,
      )}.`,
      knowledgeId,
      supersedesId,
    };
  }

  if (knowledgeId) {
    return {
      label: "Merge into existing knowledge",
      detail: `Approving applies this wording to ${shortId(knowledgeId)}.`,
      knowledgeId,
    };
  }

  if (supersedesId) {
    return {
      label: "Supersede existing knowledge",
      detail: `Approving creates a replacement and archives ${shortId(
        supersedesId,
      )}.`,
      supersedesId,
    };
  }

  if (proposal.proposedAction === "archive") {
    return {
      label: "Archive knowledge",
      detail: "Approving marks the target knowledge as archived.",
      knowledgeId,
    };
  }

  return {
    label: "Create new knowledge",
    detail: "Approving adds a new durable company knowledge entry.",
  };
}

function buildPrivacyFlags(
  proposal: ReviewItem,
  payload: Record<string, unknown>,
  context: { publishTier: string | null; status: string | null },
) {
  const flags: string[] = readStringArray(
    payload.privacyFlags ?? payload.privacy_flags ?? payload.flags,
  );
  const visibility = readString(payload.visibility) ?? proposal.visibility;
  const redactions = readStringArray(payload.redactions);

  if (context.status === "redacted" || containsRedaction(proposal)) {
    flags.push("Redacted content");
  }
  if (redactions.length) {
    flags.push(
      `${redactions.length} redaction ${redactions.length === 1 ? "rule" : "rules"}`,
    );
  }
  if (context.publishTier === "company") {
    flags.push("Company-tier knowledge");
  } else if (context.publishTier) {
    flags.push(`${titleCase(context.publishTier)} publish tier`);
  }
  if (visibility) {
    flags.push(`${titleCase(visibility)} visibility`);
  }
  if (readBoolean(payload.publishCanonical)) {
    flags.push("Canonical export");
  }

  const unique = Array.from(new Set(flags));
  return unique.length ? unique : ["No privacy flags"];
}

function buildQueueReason(
  proposal: ReviewItem,
  context: {
    confidence: number | null;
    payload: Record<string, unknown>;
    publishTier: string | null;
    privacyFlags: string[];
  },
) {
  const explicit =
    proposal.rationale?.trim() ||
    proposal.reason?.trim() ||
    readString(
      context.payload.reason ??
        context.payload.queueReason ??
        context.payload.queue_reason,
    );
  if (explicit) return explicit;
  if (context.privacyFlags.some((flag) => flag.includes("Redacted"))) {
    return "Privacy-sensitive or redacted content needs reviewer confirmation.";
  }
  if (context.confidence !== null && context.confidence < 90) {
    return `Confidence is ${formatConfidence(
      context.confidence,
    )}, below the auto-publish threshold.`;
  }
  if (context.publishTier === "company") {
    return "Company-tier knowledge requires reviewer approval.";
  }
  return "Queued for reviewer approval before becoming durable company knowledge.";
}

function buildApproveLabel(target: TargetContext, status: string | null) {
  if (status === "redacted") return "Approve redacted draft";
  if (target.supersedesId) return "Approve replacement";
  if (target.knowledgeId) return "Approve update";
  return "Approve knowledge";
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : null))
    .filter((item): item is string => Boolean(item));
}

function readNumber(value: unknown) {
  const number =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;
  if (!Number.isFinite(number)) return null;
  const normalized = number <= 1 ? number * 100 : number;
  return Math.max(0, Math.min(100, Math.round(normalized)));
}

function readBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return false;
}

function containsRedaction(proposal: ReviewItem) {
  const values = [
    proposal.title,
    proposal.body,
    proposal.rationale,
    ...(proposal.evidence ?? []).flatMap((item) => [item.quote, item.note]),
  ];
  return values.some(
    (value) =>
      typeof value === "string" && value.toLowerCase().includes("[redacted]"),
  );
}

function privacySummary(flags: string[]) {
  if (!flags.length || flags[0] === "No privacy flags") return "No flags";
  return flags.length === 1 ? flags[0] : `${flags[0]} +${flags.length - 1}`;
}

function privacyDetail(flags: string[]) {
  if (!flags.length || flags[0] === "No privacy flags") {
    return "No redaction, export, or visibility warning was attached.";
  }
  return flags.slice(1).join(" · ") || "Review before approving.";
}

function formatConfidence(confidence: number | null) {
  return confidence === null ? "Not scored" : `${confidence}%`;
}

function shortId(value: string) {
  return value.length > 12
    ? `${value.slice(0, 6)}...${value.slice(-4)}`
    : value;
}

function titleCase(value: string) {
  return value
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function reviewedSummary(proposal: ReviewItem) {
  const status = proposal.status ?? "reviewed";
  if (proposal.reviewedAt || proposal.reviewedBy) {
    return `${titleCase(status)} ${formatDate(proposal.reviewedAt)} by ${
      proposal.reviewedBy ?? "reviewer"
    }.`;
  }
  return `This proposal is ${status.replace(/_/g, " ")}.`;
}

function timecode(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const totalSeconds = Math.max(0, Math.floor(value / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = `${totalSeconds % 60}`.padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function ConfidenceBadge({ confidence }: { confidence: number | null }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5",
        confidence !== null &&
          confidence >= 90 &&
          "border-border bg-secondary text-secondary-foreground",
        confidence !== null &&
          confidence < 70 &&
          "border-amber-500/35 bg-amber-500/10 text-amber-700 dark:text-amber-300",
      )}
    >
      <IconChartBar className="size-3" />
      {formatConfidence(confidence)}
    </Badge>
  );
}

function SignalRow({
  icon: IconComponent,
  label,
  value,
  detail,
}: {
  icon: Icon;
  label: string;
  value?: string | null;
  detail?: string | null;
}) {
  return (
    <div className="grid gap-1.5 text-sm">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
        <IconComponent className="size-3.5" />
        <span>{label}</span>
      </div>
      <p className="line-clamp-3 break-words font-medium leading-5 text-foreground">
        {value || "Not recorded"}
      </p>
      {detail ? (
        <p className="break-words text-xs leading-5 text-muted-foreground">
          {detail}
        </p>
      ) : null}
    </div>
  );
}

function ReviewSignalStrip({
  target,
  privacy,
  evidenceCount,
  proposedAction,
  publishCanonical,
  t,
}: {
  target: string;
  privacy: string;
  evidenceCount: number;
  proposedAction?: string | null;
  publishCanonical: boolean;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  const signals = [
    { label: t("brain.review.signalTarget"), value: target },
    { label: t("brain.review.signalPrivacy"), value: privacy },
    {
      label: t("brain.review.signalEvidence"),
      value: evidenceCount
        ? `${evidenceCount} ${evidenceCount === 1 ? t("brain.review.signalEvidenceSnippet", { count: evidenceCount }) : t("brain.review.signalEvidenceSnippets", { count: evidenceCount })}`
        : t("brain.review.signalNoSnippets"),
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
      {signals.map((signal) => (
        <div key={signal.label} className="flex min-w-0 items-center gap-1.5">
          <span className="text-muted-foreground">{signal.label}</span>
          <span className="max-w-56 truncate font-medium text-foreground">
            {signal.value}
          </span>
        </div>
      ))}
      {proposedAction ? (
        <Badge variant="secondary" className="h-5 capitalize">
          {proposedAction}
        </Badge>
      ) : null}
      {publishCanonical ? (
        <Badge variant="outline" className="h-5 gap-1.5">
          <IconBook className="size-3" />
          {t("brain.review.signalCompanyContext")}
        </Badge>
      ) : null}
    </div>
  );
}

function ProposalOverflowMenu({
  canReview,
  editing,
  pendingMutation,
  publishCanonical,
  sourceUrl,
  onToggleEditing,
  onPreviewCanonical,
}: {
  canReview: boolean;
  editing: boolean;
  pendingMutation: boolean;
  publishCanonical: boolean;
  sourceUrl: string | null;
  onToggleEditing: () => void;
  onPreviewCanonical: () => void;
}) {
  if (!canReview && !sourceUrl) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="outline"
          aria-label={t("brain.review.ariaMoreActions")}
        >
          <IconDotsVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canReview ? (
          <DropdownMenuItem
            disabled={pendingMutation}
            onSelect={onToggleEditing}
          >
            <IconPencil className="size-4" />
            {editing ? t("brain.review.menuHideEditor") : t("brain.review.menuEditWording")}
          </DropdownMenuItem>
        ) : null}
        {canReview && publishCanonical ? (
          <DropdownMenuItem
            disabled={pendingMutation}
            onSelect={onPreviewCanonical}
          >
            <IconFileText className="size-4" />
            {t("brain.review.menuPreviewCompanyContext")}
          </DropdownMenuItem>
        ) : null}
        {sourceUrl && canReview ? <DropdownMenuSeparator /> : null}
        {sourceUrl ? (
          <DropdownMenuItem asChild>
            <a href={sourceUrl} target="_blank" rel="noreferrer">
              <IconExternalLink className="size-4" />
              {t("brain.review.menuOpenSource")}
            </a>
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function EvidenceSnippet({
  item,
  t,
}: {
  item: NonNullable<ReviewItem["evidence"]>[number];
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  const source = item.captureTitle ?? item.captureId ?? t("brain.review.evidenceSource");
  const when = timecode(item.timestampMs);
  const detail = [source, when ? `at ${when}` : null, item.note]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="rounded-md border border-border bg-background p-3 text-sm">
      <p className="whitespace-pre-wrap break-words leading-6">
        {item.quote ?? t("brain.review.evidenceQuoteUnavailable")}
      </p>
      <p className="mt-2 break-words text-xs leading-5 text-muted-foreground">
        {detail || t("brain.review.evidenceSource")}
      </p>
    </div>
  );
}

function ProposalDetailsSheet({
  proposal,
  insight,
  evidence,
  sourceUrl,
  draftTitle,
  draftBody,
  draftRationale,
  hasDraftChanges,
}: {
  proposal: ReviewItem;
  insight: ProposalInsight;
  evidence: NonNullable<ReviewItem["evidence"]>;
  sourceUrl: string | null;
  draftTitle: string;
  draftBody: string;
  draftRationale: string;
  hasDraftChanges: boolean;
}) {
  const queuedBody = proposal.body ?? proposal.proposedAnswer ?? "";
  const detailRows = [
    { label: t("brain.review.insightSource"), value: proposal.sourceName ?? proposal.sourceId },
    { label: t("brain.review.insightCapture"), value: proposal.captureId, mono: true },
    {
      label: t("brain.review.insightKnowledgeTarget"),
      value: insight.target.knowledgeId,
      mono: true,
    },
    { label: t("brain.review.insightSupersedes"), value: insight.target.supersedesId, mono: true },
    { label: t("brain.review.insightVisibility"), value: proposal.visibility },
    { label: t("brain.review.insightUpdated"), value: formatDate(proposal.updatedAt) },
  ];
  const payloadRows = [
    { label: t("brain.review.insightKind"), value: insight.kind },
    { label: t("brain.review.insightTopic"), value: insight.topic },
    { label: t("brain.review.insightPublishTier"), value: insight.publishTier },
    { label: t("brain.review.insightResultStatus"), value: insight.status },
    { label: t("brain.review.insightTags"), value: insight.tags.join(", ") },
    { label: t("brain.review.insightSummary"), value: insight.summary },
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="sm" variant="outline" className="w-full sm:w-auto">
          <IconListDetails className="size-4" />
          {t("brain.review.details.title")}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle className="pr-8">{proposal.title}</SheetTitle>
          <SheetDescription>
            {insight.target.label} · {formatConfidence(insight.confidence)}
          </SheetDescription>
        </SheetHeader>

        <div className="grid gap-6 py-6">
          <section className="grid gap-3">
            <SectionHeading icon={IconInfoCircle} title={t("brain.review.detailsReviewSignals")} />
            <div className="grid gap-3 sm:grid-cols-2">
              <SignalRow
                icon={IconInfoCircle}
                label={t("brain.review.detailsWhyQueued")}
                value={insight.queueReason}
              />
              <SignalRow
                icon={IconGitMerge}
                label={t("brain.review.targetContext")}
                value={insight.target.label}
                detail={insight.target.detail}
              />
              <SignalRow
                icon={IconShieldCheck}
                label={t("brain.review.detailsPrivacyFlags")}
                value={privacySummary(insight.privacyFlags)}
                detail={privacyDetail(insight.privacyFlags)}
              />
              <div className="grid gap-1.5 text-sm">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  <IconChartBar className="size-3.5" />
                  <span>{t("brain.review.confidenceLevel")}</span>
                </div>
                <div>
                  <ConfidenceBadge confidence={insight.confidence} />
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-3">
            <SectionHeading icon={IconGitMerge} title={t("brain.review.detailsTargetAndPayload")} />
            <MetadataGrid rows={detailRows} t={t} />
            <MetadataGrid rows={payloadRows} t={t} />
          </section>

          <section className="grid gap-3">
            <SectionHeading
              icon={IconPencil}
              title={hasDraftChanges ? t("brain.review.details.draft") : t("brain.review.detailsQueuedProposal")}
            />
            <DraftDiff
              label={t("brain.review.detailsDraftDiffTitle")}
              queued={proposal.title}
              current={draftTitle}
              t={t}
            />
            <DraftDiff
              label={t("brain.review.detailsDraftDiffBody")}
              queued={queuedBody}
              current={draftBody}
              multiline
              t={t}
            />
            <DraftDiff
              label={t("brain.review.detailsDraftDiffRationale")}
              queued={proposal.rationale ?? ""}
              current={draftRationale}
              multiline
              t={t}
            />
          </section>

          <section className="grid gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <SectionHeading icon={IconFileText} title={t("brain.review.details.evidence")} />
              {sourceUrl ? (
                <Button asChild size="sm" variant="outline">
                  <a href={sourceUrl} target="_blank" rel="noreferrer">
                    <IconExternalLink className="size-4" />
                    {t("brain.review.overflow.source")}
                  </a>
                </Button>
              ) : null}
            </div>
            {evidence.length ? (
              <div className="grid gap-3">
                {evidence.map((item, index) => (
                  <EvidenceSnippet
                    key={`${proposal.id}-detail-evidence-${index}`}
                    item={item}
                    t={t}
                  />
                ))}
              </div>
            ) : (
              <p className="rounded-md border border-dashed border-border bg-muted/20 p-3 text-sm leading-6 text-muted-foreground">
                {t("brain.review.detailsNoEvidence")}
              </p>
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SectionHeading({
  icon: IconComponent,
  title,
}: {
  icon: Icon;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
      <IconComponent className="size-4 text-muted-foreground" />
      <span>{title}</span>
    </div>
  );
}

function MetadataGrid({
  rows,
  t,
}: {
  rows: Array<{ label: string; value?: string | null; mono?: boolean }>;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {rows.map((row) => (
        <MetadataRow
          key={row.label}
          label={row.label}
          value={row.value}
          mono={row.mono}
          t={t}
        />
      ))}
    </div>
  );
}

function DraftDiff({
  label,
  queued,
  current,
  multiline = false,
  t,
}: {
  label: string;
  queued: string;
  current: string;
  multiline?: boolean;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  const changed = queued !== current;
  return (
    <div className="grid gap-2 rounded-md border border-border bg-muted/20 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">{label}</p>
        {changed ? <Badge variant="outline">{t("brain.review.detailsEdited")}</Badge> : null}
      </div>
      {changed ? (
        <div className="grid gap-2 md:grid-cols-2">
          <DiffText label={t("brain.review.detailsQueued")} value={queued} multiline={multiline} t={t} />
          <DiffText
            label={t("brain.review.detailsCurrentDraft")}
            value={current}
            multiline={multiline}
            t={t}
          />
        </div>
      ) : (
        <DiffText label={t("brain.review.detailsCurrent")} value={current} multiline={multiline} t={t} />
      )}
    </div>
  );
}

function DiffText({
  label,
  value,
  multiline,
  t,
}: {
  label: string;
  value: string;
  multiline: boolean;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  return (
    <div className="grid gap-1">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "break-words rounded-md bg-background p-3 text-sm leading-6",
          multiline && "whitespace-pre-wrap",
        )}
      >
        {value || t("brain.review.detailsNotRecorded")}
      </p>
    </div>
  );
}

function MetadataRow({
  label,
  value,
  mono = false,
  t,
}: {
  label: string;
  value?: string | null;
  mono?: boolean;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  return (
    <div className="grid gap-1 rounded-md border border-border bg-background p-3">
      <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <span className={cn("break-words text-sm", mono && "font-mono text-xs")}>
        {value || t("brain.review.detailsNotRecorded")}
      </span>
    </div>
  );
}
