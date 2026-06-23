# Core Routes Plugin: Add language parameter to builder browser callback calls

## Objective
Pass SSR language parameter to `createBuilderBrowserCallbackPage()` and `createBuilderBrowserCallbackErrorPage()` calls based on the request's `Accept-Language` header.

## Changes Made

### 1. Added import
- Added `import { parseAcceptLanguage } from "./i18n.js";` after the builder-browser.js import block (line 76)

### 2. Added helper function
- Added `resolveSsrLanguage(event: H3Event): "en" | "zh" | undefined` after `parseBuilderCallbackBoolean()` (line 182)
- Uses `parseAcceptLanguage(getHeader(event, "accept-language"))` to extract the preferred SSR language from the request

### 3. Updated all 8 call sites
Added `, resolveSsrLanguage(event)` as the last argument to:
- **L1245**: `createBuilderBrowserCallbackErrorPage(crossOriginMessage, {...})` — cross-origin connect rejection
- **L1301**: `createBuilderBrowserCallbackErrorPage(msg, {...})` — storage unavailable
- **L1595**: `createBuilderBrowserCallbackErrorPage(pendingError, {...})` — pending consume storage error
- **L1640**: `createBuilderBrowserCallbackErrorPage(msg, {...})` — no active connect flow
- **L1675**: `createBuilderBrowserCallbackErrorPage(msg, {...})` — missing credentials
- **L1786**: `createBuilderBrowserCallbackErrorPage(writeError, {...})` — credential write failed
- **L1834**: `createBuilderBrowserCallbackPage(previewUrl, {...})` — success page

## Verification
- `getHeader` was already imported from "h3" (line 13 of imports)
- TypeScript compilation (`tsc --noEmit`) passes with no errors
