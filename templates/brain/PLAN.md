# Brain Template i18n Wiring Plan

## Objective
Wire the 311 existing brain i18n keys into all Brain template components, replacing hardcoded English strings with `useI18n()` / `t()` calls.

## Steps

### Step 1: Wire infrastructure (root.tsx, Layout.tsx, Sidebar.tsx)
- **root.tsx**: Import `useI18n`, wrap `AppContent` in I18nProvider? No — use `useI18n()` inside components. Replace command menu labels, theme toggle text.
- **Layout.tsx**: Replace sidebar title/desc, mobile nav aria-labels, agent sidebar emptyStateText and suggestions.
- **Sidebar.tsx**: Replace "Chats", "New chat", "New Brain chat", "Rename chat", "Pin chat", "Unpin chat", "Archive chat", toast messages, thread titles, aria-labels.

### Step 2: Wire shared components (Surface.tsx, CanonicalPreviewSheet.tsx)
- **Surface.tsx**: PageHeader (eyebrow/title/description are caller-provided, so caller should use `t()`), EmptyActionState, StatusBadge, PriorityBadge are fine as-is since strings come from callers.
- **CanonicalPreviewSheet.tsx**: Replace hardcoded title, intent text, badges, button labels.

### Step 3: Wire route pages
- **search.tsx**: PageHeader props, filter placeholder text, button labels, empty state messages, details text.
- **knowledge.tsx**: PageHeader props, filter options, table headers, canonical buttons, toast messages.
- **ops.tsx**: PageHeader props, table headers, filter options, retry buttons, toast messages.
- **review.tsx**: PageHeader props, filter options, action buttons, menu items, details sheet text.
- **settings.tsx**: PageHeader props, card titles/descriptions, field labels, tone/source policy options, switch labels, policy row labels, auto-publish gate text.
- **sources.tsx**: PageHeader props, source setup dialog text, capture review panel, provider/generic source forms.

## Execution
Spawn parallel sub-agents for each major file group.
