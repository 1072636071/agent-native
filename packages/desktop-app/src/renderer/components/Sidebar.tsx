import {
  IconMail,
  IconCalendar,
  IconFileText,
  IconChartBar,
  IconPresentation,
  IconStack2,
  IconVideo,
  IconBrandJira,
  IconClipboardList,
  IconUsers,
  IconCode as IconCodeIcon,
  IconContract,
  IconMessageCircle,
  IconSettings,
  IconScreenShare,
  IconBrush,
  IconBrain,
  IconPhone,
  IconNote,
  IconMicrophone,
  IconCalendarTime,
  IconPlus,
  IconWorld,
  IconPhoto,
} from "@tabler/icons-react";
import { useI18n, LanguageSwitcher } from "@agent-native/i18n";
import type { AppDefinition } from "@shared/app-registry";
import { UpdateIndicator } from "./UpdateIndicator.js";

const agentNativeIconUrl = new URL(
  "../assets/agent-native-icon-dark.svg",
  import.meta.url,
).href;

// Map icon name strings (from shared-app-config) to Tabler components
const ICON_MAP: Record<string, React.ComponentType<Record<string, unknown>>> = {
  Mail: IconMail,
  CalendarDays: IconCalendar,
  FileText: IconFileText,
  BarChart2: IconChartBar,
  GalleryHorizontal: IconPresentation,
  Video: IconVideo,
  BrandJira: IconBrandJira,
  ClipboardList: IconClipboardList,
  Users: IconUsers,
  Code: IconCodeIcon,
  Contract: IconContract,
  MessageCircle: IconMessageCircle,
  ScreenShare: IconScreenShare,
  Brush: IconBrush,
  Brain: IconBrain,
  Phone: IconPhone,
  Note: IconNote,
  Microphone: IconMicrophone,
  CalendarTime: IconCalendarTime,
  Globe: IconWorld,
  Photo: IconPhoto,
};

interface SidebarProps {
  apps: AppDefinition[];
  activeAppId: string;
  onTabChange: (appId: string) => void;
  onAddAppClick?: () => void;
  isCodeAgentsActive?: boolean;
  onCodeAgentsClick?: () => void;
  onSettingsClick?: () => void;
}

export default function Sidebar({
  apps,
  activeAppId,
  onTabChange,
  onAddAppClick,
  isCodeAgentsActive = false,
  onCodeAgentsClick,
  onSettingsClick,
}: SidebarProps) {
  const { t } = useI18n();
  const pinnedBottomOrder = ["dispatch"];
  const pinnedBottom = pinnedBottomOrder
    .map((id) => apps.find((app) => app.id === id))
    .filter((app): app is AppDefinition => !!app);
  const mainApps = apps.filter((app) => !pinnedBottomOrder.includes(app.id));
  const orderedApps = [...mainApps, ...pinnedBottom];

  return (
    <aside className="sidebar">
      {/* Windows/Linux custom traffic lights */}
      <div className="win-controls">
        <button
          className="win-btn win-btn--close"
          tabIndex={-1}
          onClick={() => window.electronAPI?.windowControls.close()}
          title={t("window.close")}
          aria-label={t("window.close")}
        />
        <button
          className="win-btn win-btn--minimize"
          tabIndex={-1}
          onClick={() => window.electronAPI?.windowControls.minimize()}
          title={t("window.minimize")}
          aria-label={t("window.minimize")}
        />
        <button
          className="win-btn win-btn--maximize"
          tabIndex={-1}
          onClick={() => window.electronAPI?.windowControls.maximize()}
          title={t("window.maximize")}
          aria-label={t("window.maximize")}
        />
      </div>

      {/* App tabs */}
      <nav className="sidebar-nav">
        {orderedApps.map((app) => (
          <SidebarItem
            key={app.id}
            app={app}
            isActive={app.id === activeAppId}
            onClick={() => onTabChange(app.id)}
          />
        ))}
        {onAddAppClick && <SidebarAddButton onClick={onAddAppClick} />}
      </nav>

      {/* Footer: update indicator + language switcher + settings */}
      <div className="sidebar-footer">
        <UpdateIndicator />
        <LanguageSwitcher />
        {onCodeAgentsClick && (
          <button
            className={`sidebar-item${isCodeAgentsActive ? " sidebar-item--active" : ""}`}
            tabIndex={-1}
            onClick={onCodeAgentsClick}
            title={t("sidebar.agentNativeCode")}
            aria-label={t("sidebar.agentNativeCode")}
            aria-current={isCodeAgentsActive ? "page" : undefined}
          >
            <span className="icon-wrapper">
              <img
                src={agentNativeIconUrl}
                alt=""
                aria-hidden="true"
                className="sidebar-agent-native-icon"
              />
            </span>
            <span className="item-label">{t("sidebar.code")}</span>
          </button>
        )}
        {onSettingsClick && (
          <button
            className="sidebar-item"
            tabIndex={-1}
            onClick={onSettingsClick}
            title={t("sidebar.settings")}
            aria-label={t("sidebar.settings")}
          >
            <span className="icon-wrapper">
              <IconSettings size={18} strokeWidth={1.75} />
            </span>
            <span className="item-label">{t("sidebar.settings")}</span>
          </button>
        )}
      </div>
    </aside>
  );
}

function SidebarAddButton({ onClick }: { onClick: () => void }) {
  const { t } = useI18n();
  return (
    <button
      className="sidebar-item sidebar-item--add"
      tabIndex={-1}
      onClick={onClick}
      title={t("sidebar.addApp")}
      aria-label={t("sidebar.addApp")}
    >
      <span className="icon-wrapper">
        <IconPlus size={18} strokeWidth={1.75} />
      </span>
      <span className="item-label">{t("sidebar.add")}</span>
    </button>
  );
}

interface SidebarItemProps {
  app: AppDefinition;
  isActive: boolean;
  onClick: () => void;
}

function SidebarItem({ app, isActive, onClick }: SidebarItemProps) {
  const Icon = ICON_MAP[app.icon] ?? IconStack2;

  return (
    <button
      className={`sidebar-item${isActive ? " sidebar-item--active" : ""}`}
      tabIndex={-1}
      onClick={onClick}
      title={app.description}
      aria-label={app.name}
      aria-current={isActive ? "page" : undefined}
    >
      <span className="icon-wrapper">
        <Icon size={18} strokeWidth={1.75} />
      </span>
      <span className="item-label">{app.name}</span>
    </button>
  );
}
