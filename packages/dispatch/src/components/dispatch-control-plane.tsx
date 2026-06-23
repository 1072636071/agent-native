import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  PromptComposer,
  agentNativePath,
  isInBuilderFrame,
  useActionQuery,
  useChangeVersions,
  useChatModels,
  useChatThreads,
  type ChatThreadSummary,
} from "@agent-native/core/client";
import { RunsTray } from "@agent-native/core/client/progress";
import {
  IconActivity,
  IconAlertTriangle,
  IconArrowUpRight,
  IconBolt,
  IconBroadcast,
  IconCheck,
  IconClockHour4,
  IconListCheck,
  IconMessages,
  IconPlayerPlay,
  IconPlugConnected,
  IconPlus,
  IconRobot,
  IconRocket,
  IconSettingsAutomation,
  IconShieldCheck,
  IconStack3,
  IconUsersGroup,
  type IconProps,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { useI18n, type I18nKey } from "@agent-native/i18n";
import { CreateAppPopover } from "@/components/create-app-popover";
import { DispatchShell } from "@/components/dispatch-shell";
import { WorkspaceAppCard } from "@/components/workspace-app-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  listDispatchAutomations,
  setDispatchAutomationEnabled,
  type DispatchAutomationItem,
  type SetDispatchAutomationEnabledInput,
} from "@/lib/automations";
import { submitOverviewPrompt } from "@/lib/overview-chat";
import type { ConnectedAgent } from "@/components/agents-panel";
import type { WorkspaceAppSummary } from "@/lib/workspace-apps";

interface DispatchOverview {
  counts?: {
    destinations?: number;
    pendingApprovals?: number;
    linkedIdentities?: number;
    activeTokens?: number;
  };
  recentApprovals?: Array<{
    id: string;
    summary: string;
    status: string;
    requestedBy?: string;
  }>;
  recentAudit?: RecentAuditEvent[];
  settings?: {
    enabled?: boolean;
  };
  vault?: {
    secretCount?: number;
    activeGrantCount?: number;
    accessMode?: string;
  };
}

interface RecentAuditEvent {
  id: string;
  summary: string;
  actor: string;
  action?: string;
  createdAt: string;
}

interface TaskQueueRecentFailure {
  id: string;
  platform: string;
  error: string;
  attempts: number;
}

interface TaskQueueStats {
  pending: number;
  processing: number;
  completed_last_hour: number;
  failed_last_hour: number;
  oldest_pending_age_seconds: number;
  recent_failures: TaskQueueRecentFailure[];
}

type AutomationItem = DispatchAutomationItem;

const ZERO_TASK_QUEUE_STATS: TaskQueueStats = {
  pending: 0,
  processing: 0,
  completed_last_hour: 0,
  failed_last_hour: 0,
  oldest_pending_age_seconds: 0,
  recent_failures: [],
};

const AUTOMATIONS_QUERY_KEY = [
  "dispatch-control-plane",
  "automations",
] as const;

function formatNumber(value: number): string {
  return new Intl.NumberFormat(undefined, {
    notation: value >= 10_000 ? "compact" : "standard",
    maximumFractionDigits: value >= 10_000 ? 1 : 0,
  }).format(value);
}

function formatAgeSeconds(seconds: number): string {
  if (!seconds || seconds < 0) return "0s";
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

function timeAgo(value: number | string | null | undefined): string {
  if (value == null || value === "") return "never";
  const timestamp =
    typeof value === "number" ? value : new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "never";
  const diff = Math.max(0, Date.now() - timestamp);
  if (diff < 60_000) return "now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
  return `${Math.floor(diff / 86_400_000)}d`;
}

function relativeRunTime(value: string | null | undefined): string {
  if (!value) return "never";
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "never";
  const diff = timestamp - Date.now();
  const abs = Math.abs(diff);
  const suffix = diff >= 0 ? "from now" : "ago";
  if (abs < 60_000) return diff >= 0 ? "soon" : "now";
  if (abs < 3_600_000) return `${Math.floor(abs / 60_000)}m ${suffix}`;
  if (abs < 86_400_000) return `${Math.floor(abs / 3_600_000)}h ${suffix}`;
  return `${Math.floor(abs / 86_400_000)}d ${suffix}`;
}

function dateTimeTitle(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return undefined;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(timestamp);
}

function threadUpdatedAt(thread: ChatThreadSummary): number {
  return Number.isFinite(thread.updatedAt)
    ? thread.updatedAt
    : Number.isFinite(thread.createdAt)
      ? thread.createdAt
      : 0;
}

function threadTitle(thread: ChatThreadSummary, fallback: string): string {
  return thread.title || thread.preview || fallback;
}

function automationTarget(item: AutomationItem): string {
  if (item.triggerType === "event" && item.event) return item.event;
  if (item.scheduleDescription) return item.scheduleDescription;
  if (item.schedule) return item.schedule;
  return item.triggerType || "schedule";
}

function automationLastRun(item: AutomationItem): string {
  return item.lastRun ? relativeRunTime(item.lastRun) : "never";
}

function automationNextRun(item: AutomationItem): string {
  if (!item.enabled) return "paused";
  if (item.triggerType === "event") return "on event";
  return item.nextRun ? relativeRunTime(item.nextRun) : "not scheduled";
}

function automationStatus(item: AutomationItem): {
  label: string;
  tone: "default" | "success" | "warning" | "danger" | "muted";
} {
  if (!item.enabled) return { label: "Paused", tone: "muted" };
  if (item.lastStatus === "error") return { label: "Error", tone: "danger" };
  if (item.lastStatus === "running")
    return { label: "Running", tone: "warning" };
  if (item.lastStatus === "skipped")
    return { label: "Skipped", tone: "warning" };
  if (item.lastStatus === "success")
    return { label: "Healthy", tone: "success" };
  return { label: "Ready", tone: "default" };
}

function automationIdentity(
  item: Pick<AutomationItem, "owner" | "path">,
): string {
  return `${item.owner}:${item.path}`;
}

function StatusDot({
  tone = "default",
}: {
  tone?: "default" | "success" | "warning" | "danger" | "muted";
}) {
  return (
    <span
      className={cn(
        "size-2 rounded-full",
        tone === "success" && "bg-emerald-500",
        tone === "warning" && "bg-amber-500",
        tone === "danger" && "bg-destructive",
        tone === "muted" && "bg-muted-foreground/35",
        tone === "default" && "bg-primary",
      )}
    />
  );
}

function useAutomationsStatus() {
  const version = useChangeVersions(["action", "screen-refresh"]);
  return useQuery<AutomationItem[]>({
    queryKey: [...AUTOMATIONS_QUERY_KEY, version],
    queryFn: listDispatchAutomations,
    placeholderData: (prev) => prev,
    refetchInterval: 15_000,
    staleTime: 5_000,
  });
}

function useToggleAutomation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: setDispatchAutomationEnabled,
    onMutate: async (input: SetDispatchAutomationEnabledInput) => {
      await queryClient.cancelQueries({ queryKey: AUTOMATIONS_QUERY_KEY });
      const snapshots = queryClient.getQueriesData<AutomationItem[]>({
        queryKey: AUTOMATIONS_QUERY_KEY,
      });

      queryClient.setQueriesData<AutomationItem[]>(
        { queryKey: AUTOMATIONS_QUERY_KEY },
        (rows) =>
          rows?.map((item) =>
            automationIdentity(item) === automationIdentity(input)
              ? { ...item, enabled: input.enabled }
              : item,
          ),
      );

      return { snapshots };
    },
    onError: (err, _input, context) => {
      for (const [queryKey, data] of context?.snapshots ?? []) {
        queryClient.setQueryData(queryKey, data);
      }
      toast.error(
        `Could not update automation: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    },
    onSuccess: (updated) => {
      queryClient.setQueriesData<AutomationItem[]>(
        { queryKey: AUTOMATIONS_QUERY_KEY },
        (rows) =>
          rows?.map((item) =>
            automationIdentity(item) === automationIdentity(updated)
              ? updated
              : item,
          ),
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: AUTOMATIONS_QUERY_KEY });
    },
  });
}

function useTaskQueueStats() {
  return useQuery<TaskQueueStats>({
    queryKey: ["dispatch-control-plane", "task-queue"],
    queryFn: async () => {
      const res = await fetch(
        agentNativePath("/_agent-native/integrations/task-queue/status"),
      );
      if (!res.ok) return ZERO_TASK_QUEUE_STATS;
      const stats = await res.json();
      if (!stats || typeof stats !== "object") return ZERO_TASK_QUEUE_STATS;
      return {
        pending: Number(stats.pending ?? 0),
        processing: Number(stats.processing ?? 0),
        completed_last_hour: Number(stats.completed_last_hour ?? 0),
        failed_last_hour: Number(stats.failed_last_hour ?? 0),
        oldest_pending_age_seconds: Number(
          stats.oldest_pending_age_seconds ?? 0,
        ),
        recent_failures: Array.isArray(stats.recent_failures)
          ? stats.recent_failures
          : [],
      };
    },
    placeholderData: (prev) => prev,
    refetchInterval: 15_000,
    staleTime: 5_000,
  });
}

function CommandPanel() {
  const { t } = useI18n();
  const { selectedModel } = useChatModels();
  const navigate = useNavigate();
  const suggestions = useMemo(
    () => [
      t("dispatch.command.suggestionHealth"),
      t("dispatch.command.suggestionOnboardingApp"),
      t("dispatch.command.suggestionAnalyticsAgents"),
    ],
    [t],
  );

  function send(message: string) {
    const trimmed = message.trim();
    if (!trimmed) return;

    if (isInBuilderFrame()) {
      submitOverviewPrompt(trimmed, selectedModel);
      return;
    }

    navigate("/chat", {
      state: {
        dispatchPrompt: {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          message: trimmed,
          selectedModel,
        },
      },
    });
  }

  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <IconBroadcast size={16} className="text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">
            {t("dispatch.controlPlane.askDispatch")}
          </h2>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/chat">
            {t("dispatch.controlPlane.openChat")}
            <IconArrowUpRight size={14} />
          </Link>
        </Button>
      </div>
      <PromptComposer
        placeholder={t("dispatch.controlPlane.routeWorkPlaceholder")}
        onSubmit={(text) => send(text)}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => send(suggestion)}
            className="cursor-pointer rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-muted-foreground transition hover:border-foreground/30 hover:text-foreground"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  to,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  detail: string;
  icon: React.ComponentType<IconProps>;
  to?: string;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Icon size={15} />
          <span className="truncate">{label}</span>
        </div>
        <StatusDot
          tone={
            tone === "success"
              ? "success"
              : tone === "warning"
                ? "warning"
                : tone === "danger"
                  ? "danger"
                  : "default"
          }
        />
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
        {value}
      </div>
      <div className="mt-1 truncate text-xs text-muted-foreground">
        {detail}
      </div>
    </>
  );

  const className = cn(
    "block min-w-0 rounded-lg border bg-card p-4 transition",
    to && "hover:border-foreground/30 hover:bg-muted/20",
  );

  if (to) {
    return (
      <Link to={to} className={className}>
        {body}
      </Link>
    );
  }

  return <div className={className}>{body}</div>;
}

function ControlPlaneMetrics({
  overview,
  apps,
  agents,
  automations,
  threads,
  taskQueue,
}: {
  overview?: DispatchOverview;
  apps: WorkspaceAppSummary[];
  agents: ConnectedAgent[];
  automations: AutomationItem[];
  threads: ChatThreadSummary[];
  taskQueue: TaskQueueStats;
}) {
  const { t } = useI18n();
  const activeApps = apps.filter((app) => !app.isDispatch && !app.archived);
  const pendingApps = activeApps.filter((app) => app.status === "pending");
  const enabledAutomations = automations.filter((item) => item.enabled);
  const automationErrors = automations.filter(
    (item) => item.enabled && item.lastStatus === "error",
  );
  const pendingApprovals = overview?.counts?.pendingApprovals ?? 0;
  const activeRuns = taskQueue.processing;

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      <MetricCard
        label={t("dispatch.controlPlane.chats")}
        value={formatNumber(threads.length)}
        detail={t("dispatch.controlPlane.metricChatsDetail", {
          count: threads.filter((thread) => thread.messageCount > 0).length,
        })}
        icon={IconMessages}
        to="/chat"
      />
      <MetricCard
        label={t("dispatch.controlPlane.runs")}
        value={formatNumber(activeRuns)}
        detail={t("dispatch.controlPlane.metricRunsDetail", {
          count: formatNumber(taskQueue.pending),
        })}
        icon={IconPlayerPlay}
        tone={
          taskQueue.failed_last_hour > 0
            ? "danger"
            : taskQueue.pending > 5
              ? "warning"
              : "default"
        }
      />
      <MetricCard
        label={t("dispatch.controlPlane.apps")}
        value={formatNumber(activeApps.length)}
        detail={t("dispatch.controlPlane.metricAppsDetail", {
          count: formatNumber(pendingApps.length),
        })}
        icon={IconStack3}
        to="/apps"
        tone={pendingApps.length > 0 ? "warning" : "default"}
      />
      <MetricCard
        label={t("dispatch.controlPlane.agents")}
        value={formatNumber(agents.length)}
        detail={t("dispatch.controlPlane.metricAgentsDetail", {
          count: formatNumber(
            agents.filter((agent) => agent.source === "custom").length,
          ),
        })}
        icon={IconRobot}
        to="/agents"
      />
      <MetricCard
        label={t("dispatch.controlPlane.automations")}
        value={formatNumber(enabledAutomations.length)}
        detail={t("dispatch.controlPlane.metricAutomationsDetail", {
          count: formatNumber(automationErrors.length),
        })}
        icon={IconSettingsAutomation}
        tone={automationErrors.length > 0 ? "danger" : "success"}
      />
      <MetricCard
        label={t("dispatch.controlPlane.approvals")}
        value={formatNumber(pendingApprovals)}
        detail={
          overview?.settings?.enabled
            ? t("dispatch.controlPlane.metricApprovalsDetailReview")
            : t("dispatch.controlPlane.metricApprovalsDetailImmediate")
        }
        icon={IconShieldCheck}
        to="/approvals"
        tone={pendingApprovals > 0 ? "warning" : "default"}
      />
    </section>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  detail,
  action,
}: {
  icon: React.ComponentType<IconProps>;
  title: string;
  detail?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        <Icon size={16} className="shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-foreground">
            {title}
          </h2>
          {detail ? (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {detail}
            </p>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

function RecentChatsPanel() {
  const { t } = useI18n();
  const newChatLabel = t("dispatch.controlPlane.startADispatchChat");
  const navigate = useNavigate();
  const { threads, activeThreadId, createThread, switchThread } =
    useChatThreads(undefined, undefined, undefined, { autoCreate: false });
  const [creating, setCreating] = useState(false);

  const visibleThreads = useMemo(
    () =>
      threads
        .filter(
          (thread) => thread.messageCount > 0 || thread.id === activeThreadId,
        )
        .sort((a, b) => threadUpdatedAt(b) - threadUpdatedAt(a))
        .slice(0, 5),
    [activeThreadId, threads],
  );

  function openThread(threadId: string, isNew = false) {
    switchThread(threadId);
    navigate("/chat", {
      state: {
        dispatchThread: {
          id: `${Date.now()}-${threadId}`,
          threadId,
        },
      },
    });
    window.requestAnimationFrame(() => {
      window.dispatchEvent(
        new CustomEvent("agent-chat:open-thread", {
          detail: { threadId, newThread: isNew },
        }),
      );
    });
  }

  async function handleNewChat() {
    setCreating(true);
    try {
      const threadId = await createThread();
      if (threadId) openThread(threadId, true);
    } finally {
      setCreating(false);
    }
  }

  return (
    <section className="rounded-lg border bg-card p-4">
      <SectionHeader
        icon={IconMessages}
        title={t("dispatch.controlPlane.chats")}
        detail={`${visibleThreads.length} ${t("dispatch.controlPlane.recent")}`}
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={handleNewChat}
            disabled={creating}
          >
            <IconPlus size={14} />
            {t("dispatch.controlPlane.new")}
          </Button>
        }
      />
      <div className="mt-3 divide-y rounded-md border">
        {visibleThreads.length > 0 ? (
          visibleThreads.map((thread) => (
            <button
              key={thread.id}
              type="button"
              onClick={() => openThread(thread.id)}
              className="grid w-full grid-cols-[minmax(0,1fr)_auto] gap-3 px-3 py-2.5 text-left transition hover:bg-muted/40"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-foreground">
                  {threadTitle(thread, newChatLabel)}
                </span>
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                  {thread.preview ||
                    t("dispatch.controlPlane.messages", {
                      count: thread.messageCount,
                    })}
                </span>
              </span>
              <span className="text-[11px] text-muted-foreground">
                {timeAgo(threadUpdatedAt(thread))}
              </span>
            </button>
          ))
        ) : (
          <button
            type="button"
            onClick={handleNewChat}
            className="block w-full px-3 py-8 text-center text-sm text-muted-foreground transition hover:bg-muted/40"
          >
            {newChatLabel}
          </button>
        )}
      </div>
    </section>
  );
}

function RunsPanel({ taskQueue }: { taskQueue: TaskQueueStats }) {
  const { t } = useI18n();
  const hasFailure = taskQueue.failed_last_hour > 0;
  const hasBacklog =
    taskQueue.pending > 5 || taskQueue.oldest_pending_age_seconds > 300;

  return (
    <section className="rounded-lg border bg-card p-4">
      <SectionHeader
        icon={IconPlayerPlay}
        title={t("dispatch.controlPlane.runs")}
        detail={
          hasFailure
            ? t("dispatch.controlPlane.runsDetailFailed", {
                count: taskQueue.failed_last_hour,
              })
            : t("dispatch.controlPlane.runsDetailProcessing", {
                count: taskQueue.processing,
              })
        }
        action={
          <RunsTray
            triggerVariant="pill"
            hideWhenIdle={false}
            showRecent
            limit={8}
          />
        }
      />
      <div className="mt-3 grid grid-cols-4 gap-2">
        <QueueCell
          label={t("dispatch.controlPlane.queued")}
          value={taskQueue.pending}
        />
        <QueueCell
          label={t("dispatch.controlPlane.active")}
          value={taskQueue.processing}
        />
        <QueueCell
          label={t("dispatch.controlPlane.done1h")}
          value={taskQueue.completed_last_hour}
        />
        <QueueCell
          label={t("dispatch.controlPlane.failed1h")}
          value={taskQueue.failed_last_hour}
          danger={hasFailure}
        />
      </div>
      <div
        className={cn(
          "mt-3 rounded-md border px-3 py-2 text-xs",
          hasFailure
            ? "border-destructive/30 bg-destructive/5 text-destructive"
            : hasBacklog
              ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
              : "bg-muted/20 text-muted-foreground",
        )}
      >
        {t("dispatch.controlPlane.oldestQueued")}{" "}
        {formatAgeSeconds(taskQueue.oldest_pending_age_seconds)}
      </div>
      {taskQueue.recent_failures.length > 0 ? (
        <div className="mt-3 divide-y rounded-md border">
          {taskQueue.recent_failures.slice(0, 3).map((failure) => (
            <div key={failure.id} className="px-3 py-2">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-medium text-foreground">
                  {failure.platform}
                </span>
                <span className="text-muted-foreground">
                  {t("dispatch.controlPlane.attempts", {
                    count: failure.attempts,
                  })}
                </span>
              </div>
              <div className="mt-1 truncate text-xs text-muted-foreground">
                {failure.error || t("dispatch.controlPlane.noErrorMessage")}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function QueueCell({
  label,
  value,
  danger,
}: {
  label: string;
  value: number;
  danger?: boolean;
}) {
  return (
    <div className="rounded-md border bg-background px-2 py-2">
      <div
        className={cn(
          "text-lg font-semibold text-foreground",
          danger && "text-destructive",
        )}
      >
        {formatNumber(value)}
      </div>
      <div className="truncate text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

function AppsPanel({
  apps,
  isLoading,
}: {
  apps: WorkspaceAppSummary[];
  isLoading: boolean;
}) {
  const { t } = useI18n();
  const visibleApps = apps
    .filter((app) => !app.isDispatch && !app.archived)
    .slice(0, 4);
  const showSkeletons = isLoading && visibleApps.length === 0;
  const activeCount = apps.filter(
    (app) => !app.isDispatch && !app.archived,
  ).length;

  return (
    <section className="space-y-3">
      <SectionHeader
        icon={IconStack3}
        title={t("dispatch.controlPlane.projectsAndApps")}
        detail={t("dispatch.controlPlane.activeCount", { count: activeCount })}
        action={
          <Button variant="outline" size="sm" asChild>
            <Link to="/apps">
              {t("dispatch.controlPlane.viewAll")}
              <IconArrowUpRight size={14} />
            </Link>
          </Button>
        }
      />
      {showSkeletons ? (
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-lg border bg-card p-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-3 h-3 w-24" />
              <Skeleton className="mt-3 h-3 w-full" />
            </div>
          ))}
        </div>
      ) : visibleApps.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {visibleApps.map((app) => (
            <WorkspaceAppCard key={app.id} app={app} className="min-h-32" />
          ))}
        </div>
      ) : (
        <CreateAppPopover />
      )}
    </section>
  );
}

function AutomationsPanel({
  automations,
  isLoading,
}: {
  automations: AutomationItem[];
  isLoading: boolean;
}) {
  const { t } = useI18n();
  const toggleAutomation = useToggleAutomation();
  const ordered = useMemo(
    () =>
      [...automations].sort((a, b) => {
        const aError = a.enabled && a.lastStatus === "error" ? 1 : 0;
        const bError = b.enabled && b.lastStatus === "error" ? 1 : 0;
        if (aError !== bError) return bError - aError;
        return (b.lastRun || "").localeCompare(a.lastRun || "");
      }),
    [automations],
  );
  const enabled = automations.filter((item) => item.enabled).length;
  const errors = automations.filter(
    (item) => item.enabled && item.lastStatus === "error",
  ).length;
  const pendingToggleIdentity = toggleAutomation.isPending
    ? toggleAutomation.variables
      ? automationIdentity(toggleAutomation.variables)
      : null
    : null;

  function handleToggle(item: AutomationItem, enabled: boolean) {
    toggleAutomation.mutate({
      owner: item.owner,
      path: item.path,
      enabled,
    });
  }

  return (
    <section className="rounded-lg border bg-card p-4">
      <SectionHeader
        icon={IconSettingsAutomation}
        title={t("dispatch.controlPlane.automations")}
        detail={t("dispatch.controlPlane.automationsDetail", {
          enabled,
          errors,
        })}
        action={
          <Button variant="outline" size="sm" asChild>
            <Link to="/chat">
              {t("dispatch.controlPlane.create")}
              <IconArrowUpRight size={14} />
            </Link>
          </Button>
        }
      />
      <div className="mt-3 divide-y rounded-md border">
        {isLoading && ordered.length === 0 ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="px-3 py-2.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="mt-2 h-3 w-28" />
            </div>
          ))
        ) : ordered.length > 0 ? (
          ordered.slice(0, 6).map((item) => {
            const status = automationStatus(item);
            const canUpdate = item.canUpdate !== false;
            const isToggling =
              pendingToggleIdentity === automationIdentity(item);
            return (
              <div
                key={item.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <StatusDot tone={status.tone} />
                    <span className="truncate text-sm font-medium text-foreground">
                      {item.name}
                    </span>
                  </div>
                  <div className="mt-1 truncate text-xs text-muted-foreground">
                    {automationTarget(item)}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                    <span title={dateTimeTitle(item.lastRun)}>
                      {t("dispatch.controlPlane.last")}{" "}
                      {automationLastRun(item)}
                    </span>
                    <span title={dateTimeTitle(item.nextRun)}>
                      {t("dispatch.controlPlane.next")}{" "}
                      {automationNextRun(item)}
                    </span>
                  </div>
                  {item.lastError ? (
                    <div className="mt-1 truncate text-xs text-destructive">
                      {item.lastError}
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge
                    variant={
                      status.tone === "danger" ? "destructive" : "outline"
                    }
                    className="h-5"
                  >
                    {status.label}
                  </Badge>
                  <Switch
                    checked={!!item.enabled}
                    disabled={!canUpdate || isToggling}
                    aria-label={`${item.enabled ? t("dispatch.controlPlane.disable") : t("dispatch.controlPlane.enable")} ${t("dispatch.controlPlane.automation")} ${item.name}`}
                    onCheckedChange={(checked) => handleToggle(item, checked)}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <div className="px-3 py-8 text-center text-sm text-muted-foreground">
            {t("dispatch.controlPlane.noAutomationsYet")}
          </div>
        )}
      </div>
    </section>
  );
}

function AgentsPanelSummary({ agents }: { agents: ConnectedAgent[] }) {
  const { t } = useI18n();
  const builtin = agents.filter((agent) => agent.source === "builtin");
  const extra = agents.filter((agent) => agent.source !== "builtin");

  return (
    <section className="rounded-lg border bg-card p-4">
      <SectionHeader
        icon={IconPlugConnected}
        title={t("dispatch.controlPlane.agents")}
        detail={t("dispatch.controlPlane.agentsDetail", {
          builtin: builtin.length,
          extra: extra.length,
        })}
        action={
          <Button variant="outline" size="sm" asChild>
            <Link to="/agents">
              {t("dispatch.controlPlane.manage")}
              <IconArrowUpRight size={14} />
            </Link>
          </Button>
        }
      />
      <div className="mt-3 flex flex-wrap gap-2">
        {agents.slice(0, 12).map((agent) => (
          <span
            key={agent.id}
            className="inline-flex max-w-full items-center gap-2 rounded-md border bg-background px-2.5 py-1.5 text-xs text-muted-foreground"
          >
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: agent.color || "hsl(var(--primary))" }}
            />
            <span className="truncate">{agent.name}</span>
          </span>
        ))}
        {agents.length === 0 ? (
          <div className="w-full rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
            {t("dispatch.controlPlane.noAgentsDetected")}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function ApprovalsAndAuditPanel({
  overview,
  isLoading,
}: {
  overview?: DispatchOverview;
  isLoading: boolean;
}) {
  const { t } = useI18n();
  const approvals = overview?.recentApprovals ?? [];
  const audit = overview?.recentAudit ?? [];

  return (
    <section className="rounded-lg border bg-card p-4">
      <SectionHeader
        icon={IconActivity}
        title={t("dispatch.controlPlane.activity")}
        detail={t("dispatch.controlPlane.activityDetail", {
          approvals: approvals.length,
          audit: audit.length,
        })}
        action={
          <Button variant="outline" size="sm" asChild>
            <Link to="/audit">
              {t("dispatch.controlPlane.audit")}
              <IconArrowUpRight size={14} />
            </Link>
          </Button>
        }
      />
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <div className="rounded-md border">
          <div className="flex items-center justify-between gap-3 border-b px-3 py-2">
            <div className="text-xs font-medium uppercase text-muted-foreground">
              {t("dispatch.controlPlane.approvals")}
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/approvals">{t("dispatch.controlPlane.open")}</Link>
            </Button>
          </div>
          <div className="divide-y">
            {isLoading && approvals.length === 0 ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="px-3 py-2.5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="mt-2 h-3 w-24" />
                </div>
              ))
            ) : approvals.length > 0 ? (
              approvals.slice(0, 4).map((approval) => (
                <div key={approval.id} className="px-3 py-2.5">
                  <div className="truncate text-sm font-medium text-foreground">
                    {approval.summary}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <StatusDot
                      tone={approval.status === "pending" ? "warning" : "muted"}
                    />
                    <span>{approval.status}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                {t("dispatch.controlPlane.noApprovalRequests")}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-md border">
          <div className="border-b px-3 py-2 text-xs font-medium uppercase text-muted-foreground">
            {t("dispatch.controlPlane.recentAudit")}
          </div>
          <div className="divide-y">
            {isLoading && audit.length === 0 ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="px-3 py-2.5">
                  <Skeleton className="h-4 w-44" />
                  <Skeleton className="mt-2 h-3 w-28" />
                </div>
              ))
            ) : audit.length > 0 ? (
              audit.slice(0, 4).map((event) => (
                <div key={event.id} className="px-3 py-2.5">
                  <div className="truncate text-sm font-medium text-foreground">
                    {event.summary}
                  </div>
                  <div className="mt-1 truncate text-xs text-muted-foreground">
                    {event.actor} · {timeAgo(event.createdAt)}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                {t("dispatch.controlPlane.noAuditEntries")}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function ReadinessPanel({
  overview,
  apps,
  agents,
  automations,
}: {
  overview?: DispatchOverview;
  apps: WorkspaceAppSummary[];
  agents: ConnectedAgent[];
  automations: AutomationItem[];
}) {
  const { t } = useI18n();
  const rows = [
    {
      label: t("dispatch.controlPlane.vault"),
      detail:
        (overview?.vault?.secretCount ?? 0) > 0
          ? t("dispatch.controlPlane.secrets", {
              count: overview?.vault?.secretCount ?? 0,
            })
          : t("dispatch.controlPlane.noSecrets"),
      ok: (overview?.vault?.secretCount ?? 0) > 0,
      to: "/vault",
      icon: IconShieldCheck,
    },
    {
      label: t("dispatch.controlPlane.apps"),
      detail: t("dispatch.controlPlane.activeCount", {
        count: apps.filter((app) => !app.isDispatch && !app.archived).length,
      }),
      ok: apps.some((app) => !app.isDispatch && !app.archived),
      to: "/apps",
      icon: IconRocket,
    },
    {
      label: t("dispatch.controlPlane.agents"),
      detail: t("dispatch.controlPlane.available", { count: agents.length }),
      ok: agents.length > 0,
      to: "/agents",
      icon: IconRobot,
    },
    {
      label: t("dispatch.controlPlane.automations"),
      detail: t("dispatch.controlPlane.enabledCount", {
        count: automations.filter((item) => item.enabled).length,
      }),
      ok: automations.every(
        (item) => !item.enabled || item.lastStatus !== "error",
      ),
      to: "/chat",
      icon: IconBolt,
    },
    {
      label: t("dispatch.common.team"),
      detail: t("dispatch.controlPlane.linkedIdentities", {
        count: overview?.counts?.linkedIdentities ?? 0,
      }),
      ok: (overview?.counts?.linkedIdentities ?? 0) > 0,
      to: "/team",
      icon: IconUsersGroup,
    },
  ];

  return (
    <section className="rounded-lg border bg-card p-4">
      <SectionHeader
        icon={IconListCheck}
        title={t("dispatch.controlPlane.readiness")}
      />
      <div className="mt-3 divide-y rounded-md border">
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <Link
              key={row.label}
              to={row.to}
              className="flex items-center gap-3 px-3 py-2.5 transition hover:bg-muted/40"
            >
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-md border",
                  row.ok
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-background text-muted-foreground",
                )}
              >
                {row.ok ? <IconCheck size={14} /> : <Icon size={14} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">
                  {row.label}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {row.detail}
                </span>
              </span>
              <IconArrowUpRight size={14} className="text-muted-foreground" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function DispatchControlPlane() {
  const { t } = useI18n();
  const { data: overviewData, isLoading: overviewLoading } =
    useActionQuery<DispatchOverview>("list-dispatch-overview", {});
  const { data: connectedAgents = [] } = useActionQuery<ConnectedAgent[]>(
    "list-connected-agents",
    {},
  );
  const { data: workspaceApps = [], isLoading: appsLoading } = useActionQuery<
    WorkspaceAppSummary[]
  >(
    "list-workspace-apps",
    { includeAgentCards: false, includeArchived: true },
    { refetchInterval: 2_000 },
  );
  const { threads } = useChatThreads(undefined, undefined, undefined, {
    autoCreate: false,
  });
  const automationsQuery = useAutomationsStatus();
  const taskQueueQuery = useTaskQueueStats();

  const overview = overviewData;
  const apps = workspaceApps ?? [];
  const agents = connectedAgents ?? [];
  const automations = automationsQuery.data ?? [];
  const taskQueue = taskQueueQuery.data ?? ZERO_TASK_QUEUE_STATS;
  const visibleThreads = threads.filter((thread) => thread.messageCount > 0);

  useEffect(() => {
    const handleRunning = () => {
      void taskQueueQuery.refetch();
    };
    window.addEventListener("agentNative.chatRunning", handleRunning);
    return () => {
      window.removeEventListener("agentNative.chatRunning", handleRunning);
    };
  }, [taskQueueQuery]);

  return (
    <DispatchShell
      title={t("dispatch.controlPlane.title")}
      description={t("dispatch.controlPlane.description")}
    >
      <div className="space-y-6">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
          <CommandPanel />
          <div className="grid gap-3 sm:grid-cols-2">
            <MetricCard
              label={t("dispatch.controlPlane.vault")}
              value={formatNumber(overview?.vault?.secretCount ?? 0)}
              detail={t("dispatch.controlPlane.activeGrants", {
                count: formatNumber(overview?.vault?.activeGrantCount ?? 0),
              })}
              icon={IconShieldCheck}
              to="/vault"
              tone={
                (overview?.vault?.secretCount ?? 0) > 0 ? "success" : "default"
              }
            />
            <MetricCard
              label={t("dispatch.controlPlane.resources")}
              value={formatNumber(overview?.counts?.destinations ?? 0)}
              detail={t("dispatch.controlPlane.destinations")}
              icon={IconArrowUpRight}
              to="/destinations"
            />
          </div>
        </div>

        <ControlPlaneMetrics
          overview={overview}
          apps={apps}
          agents={agents}
          automations={automations}
          threads={visibleThreads}
          taskQueue={taskQueue}
        />

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <RecentChatsPanel />
              <RunsPanel taskQueue={taskQueue} />
            </div>
            <AppsPanel apps={apps} isLoading={appsLoading} />
            <ApprovalsAndAuditPanel
              overview={overview}
              isLoading={overviewLoading}
            />
          </div>

          <div className="space-y-4">
            <AutomationsPanel
              automations={automations}
              isLoading={automationsQuery.isLoading}
            />
            <AgentsPanelSummary agents={agents} />
            <ReadinessPanel
              overview={overview}
              apps={apps}
              agents={agents}
              automations={automations}
            />
            {taskQueue.failed_last_hour > 0 ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                <div className="flex items-center gap-2 font-medium">
                  <IconAlertTriangle size={16} />
                  {t("dispatch.controlPlane.integrationFailuresDetected")}
                </div>
                <div className="mt-1 text-xs">
                  {t("dispatch.controlPlane.checkCredentialsDestinations")}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </DispatchShell>
  );
}
