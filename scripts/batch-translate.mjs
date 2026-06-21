// Batch translation script - processes remaining md files
// Run with: node scripts/batch-translate.mjs

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const remainingFiles = [
    // workspace-core skills not yet translated
    'packages/core/src/templates/workspace-core/.agents/skills/delegate-to-agent/SKILL.md',
    'packages/core/src/templates/workspace-core/.agents/skills/security/SKILL.md',
    'packages/core/src/templates/workspace-core/.agents/skills/self-modifying-code/SKILL.md',
    'packages/core/src/templates/workspace-core/.agents/skills/real-time-sync/SKILL.md',
    'packages/core/src/templates/workspace-core/.agents/skills/context-awareness/SKILL.md',
    'packages/core/src/templates/workspace-core/.agents/skills/authentication/SKILL.md',
    'packages/core/src/templates/workspace-core/.agents/skills/storing-data/SKILL.md',
    'packages/core/src/templates/workspace-core/.agents/skills/sharing/SKILL.md',
    'packages/core/src/templates/workspace-core/.agents/skills/shadcn-ui/SKILL.md',
    'packages/core/src/templates/workspace-core/.agents/skills/server-plugins/SKILL.md',
    'packages/core/src/templates/workspace-core/.agents/skills/a2a-protocol/SKILL.md',
    'packages/core/src/templates/workspace-core/.agents/skills/address-feedback/SKILL.md',
    'packages/core/src/templates/workspace-core/.agents/skills/agent-native-docs/SKILL.md',
    'packages/core/src/templates/workspace-core/.agents/skills/automations/SKILL.md',
    'packages/core/src/templates/workspace-core/.agents/skills/capture-learnings/SKILL.md',
    'packages/core/src/templates/workspace-core/.agents/skills/client-methods/SKILL.md',
    'packages/core/src/templates/workspace-core/.agents/skills/client-side-routing/SKILL.md',
    'packages/core/src/templates/workspace-core/.agents/skills/composable-mini-apps/SKILL.md',
    'packages/core/src/templates/workspace-core/.agents/skills/context-xray/SKILL.md',
    'packages/core/src/templates/workspace-core/.agents/skills/create-skill/SKILL.md',
    'packages/core/src/templates/workspace-core/.agents/skills/extension-points/SKILL.md',
    'packages/core/src/templates/workspace-core/.agents/skills/extensions/SKILL.md',
    'packages/core/src/templates/workspace-core/.agents/skills/external-agents/SKILL.md',
    'packages/core/src/templates/workspace-core/.agents/skills/frontend-design/SKILL.md',
    'packages/core/src/templates/workspace-core/.agents/skills/harness-agents/SKILL.md',
    'packages/core/src/templates/workspace-core/.agents/skills/integration-webhooks/SKILL.md',
    'packages/core/src/templates/workspace-core/.agents/skills/mvp-followup/SKILL.md',
    'packages/core/src/templates/workspace-core/.agents/skills/observability/SKILL.md',
    'packages/core/src/templates/workspace-core/.agents/skills/onboarding/SKILL.md',
    'packages/core/src/templates/workspace-core/.agents/skills/performance/SKILL.md',
    'packages/core/src/templates/workspace-core/.agents/skills/portability/SKILL.md',
    'packages/core/src/templates/workspace-core/.agents/skills/qa/SKILL.md',
    'packages/core/src/templates/workspace-core/.agents/skills/real-time-collab/SKILL.md',
    'packages/core/src/templates/workspace-core/.agents/skills/recurring-jobs/SKILL.md',
    'packages/core/src/templates/workspace-core/.agents/skills/secrets/SKILL.md',
    // reference files
    'packages/core/src/templates/workspace-core/.agents/skills/client-methods/references/legacy-client-fetch-audit-2026-06-03.md',
    'packages/core/src/templates/workspace-core/.agents/skills/extensions/references/api.md',
    'packages/core/src/templates/workspace-core/.agents/skills/extensions/references/examples.md',
    'packages/core/src/templates/workspace-core/.agents/skills/external-agents/references/mcp-apps-embedding.md',
    // default template
    'packages/core/src/templates/default/AGENTS.md',
    'packages/core/src/templates/default/DEVELOPING.md',
    'packages/core/src/templates/default/learnings.md',
    'packages/core/src/templates/default/learnings.defaults.md',
    'packages/core/src/templates/default/.agents/skills/actions/SKILL.md',
    'packages/core/src/templates/default/.agents/skills/adding-a-feature/SKILL.md',
    'packages/core/src/templates/default/.agents/skills/agent-engines/SKILL.md',
    'packages/core/src/templates/default/.agents/skills/agent-native-docs/SKILL.md',
    'packages/core/src/templates/default/.agents/skills/capture-learnings/SKILL.md',
    'packages/core/src/templates/default/.agents/skills/create-skill/SKILL.md',
    'packages/core/src/templates/default/.agents/skills/delegate-to-agent/SKILL.md',
    'packages/core/src/templates/default/.agents/skills/frontend-design/SKILL.md',
    'packages/core/src/templates/default/.agents/skills/inline-embeds/SKILL.md',
    'packages/core/src/templates/default/.agents/skills/notifications/SKILL.md',
    'packages/core/src/templates/default/.agents/skills/progress/SKILL.md',
    'packages/core/src/templates/default/.agents/skills/real-time-collab/SKILL.md',
    'packages/core/src/templates/default/.agents/skills/real-time-sync/SKILL.md',
    'packages/core/src/templates/default/.agents/skills/security/SKILL.md',
    'packages/core/src/templates/default/.agents/skills/self-modifying-code/SKILL.md',
    'packages/core/src/templates/default/.agents/skills/shadcn-ui/SKILL.md',
    'packages/core/src/templates/default/.agents/skills/storing-data/SKILL.md',
];

let done = 0;
let todo = 0;

for (const file of remainingFiles) {
    const zhPath = file.replace(/\.md$/, '_zh.md');
    const fullZhPath = join(root, zhPath);
    if (existsSync(fullZhPath)) {
        done++;
    } else {
        todo++;
        console.log(`TODO: ${file}`);
    }
}

console.log(`\nAlready translated: ${done}`);
console.log(`Need translation: ${todo}`);