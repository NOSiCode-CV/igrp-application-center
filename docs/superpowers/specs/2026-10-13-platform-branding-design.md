# Platform Brand (customization) — design

- Date: 2026-10-13
- Revision: 2 (grill-with-docs decisions Q1 to Q21 applied)
- Status: approved design, awaiting implementation plans
- Owner: Application Center team (Fidel da Luz)
- Repos touched: `igrp-framework-nextjs` (framework packages, ADR) and `igrp-application-center` (editor, ADR pointer)
- Domain vocabulary: [CONTEXT.md](../../../CONTEXT.md) (Brand, Token, Mode, Logo Slot, Default)

## 1. Summary

An administrator with the permission `igrp.applications.customize` opens
`/settings/customization` in the Application Center, edits the Brand: the
Tokens for light and dark Mode plus three Logo Slots, with a live preview, and
saves. The Brand is stored through the Access Management global configuration
endpoint (type `ORGANIZATION`). Every app built on `@igrp/framework-next` that
opts in with `IGRP_BRANDING_ENABLED=true` loads the Brand at render time,
injects the Token overrides as a server-rendered stylesheet before first paint,
and shows the Logos in the header, the login form and the favicon. A missing
Brand, a disabled flag or any failure leaves every Token and logo at its
Default.

## 2. Decisions

| Topic | Decision |
| --- | --- |
| Domain noun | **Brand**. "Theme" means light/dark Mode; "customization" names the activity and the route; "preset" is retired. |
| Where "load and apply" lives | Framework packages (`@igrp/framework-next`, `-next-ui`, `-next-types`), so siblings get it by upgrading. |
| Token scope | 50 core Tokens (design system, per Mode) plus 23 app-tier Tokens (Application Center only). `--radius` is not editable in v1. 73 labels total. |
| Color storage | The editor accepts only concrete colors and normalizes every saved value to OKLCH with `culori`, added to the Application Center only. The framework validator stays dependency-free and still accepts any well-formed CSS color for hand-written configs. |
| Configuration type | `ORGANIZATION`. `CLUSTER` stays reserved. |
| Public pages (login, invite) | Branded from the per-process cache when warm. The session token is the only source today because the backend rejects M2M tokens outside `/api/m2m/`. |
| Logo Slots | Header mark (square), wide logo (login and invite), favicon. Each has a light image and an optional dark image. |
| Logo storage | Absolute https URLs built by the Application Center from the upload path and its MinIO base URL. Save accepts only URLs on that MinIO host. |
| Wide logo size | Natural size read when the image is picked; rendered height capped at 80 px. No manual width or height fields. |
| Favicon | PNG or ICO, at most 256 KB, no dimension check. |
| Freshness | Per-process cache with a 5-minute TTL. Saving sets a short-lived cookie `igrp_brand_v` holding the save time; a loader that sees a newer cookie than its cache entry refetches. Other browsers pick up changes within the TTL. |
| Live preview | Scoped to the preview panel. The panel carries the draft Tokens as inline custom properties and its own `dark` class. The rest of the editor and the real page keep the saved Brand. |
| Mode switch | A pill switch with a sun knob in Claro and a moon knob in Escuro, labelled beside it. It chooses the Mode being edited: the form values and the preview both follow it. It never changes the user's theme preference. |
| Editor features (v1) | Live preview, per-field clear to Default, "Repor predefinições" (sets every unsaved edit back to its Default; nothing is saved until Guardar), Descartar (drops unsaved edits back to the saved Brand), Guardar. No JSON import/export, no contrast warnings, no version history, no revert. |
| Browser chrome color | Not driven by the Brand in v1 (`viewport.themeColor` unchanged). |
| Orphaned uploads | Accepted. Replaced logo files stay in storage until a backend delete endpoint exists. |
| Uploader identity | Upload paths embed the uploader's username; the public URL reveals it. Accepted. |
| Translations | `pt`, `en` and `fr` are complete for the editor's labels and copy. |
| Opt-in per app | Env flag `IGRP_BRANDING_ENABLED`, default `false`. The Application Center's editor card and route are also hidden when auth is bypassed (`isAuthBypass()`). |
| Editor access | Super admins and any role Access Management grants `igrp.applications.customize`. No frontend permission catalog entry. |
| Decision record | ADR `0001-brand-read-with-session-token.md` in the framework repo, with a pointer from the Application Center's `docs/adr/`. |

## 3. Current state (facts the design relies on)

- Backend `GET /api/global-configuration?type=` requires an authenticated user
  token. It returns 404 (`IGRP_AUTH_GLOBAL_CONFIGURATION_NOT_FOUND`) when nothing
  was saved and 400 for an unknown type. `POST /api/global-configuration`
  requires `igrp.applications.customize`. Every POST inserts a row; GET returns
  the newest by `lastModifiedDate`. `config` is free-form TEXT.
- `M2MTokenRejectionFilter` returns 401 for client-credentials tokens on any path
  outside `/api/m2m/**` and a short allowlist. The branding GET is not on it.
- `POST /api/files/public` (the `uploadPublicFile` SDK call, `folder` parameter)
  stores the object and returns a **storage path**, not a URL, shaped
  `public/<folder>/<username>/<uuid>_<originalFilename>`.
- SDK `@igrp/platform-access-management-client-ts@0.2.0-beta.18` exposes
  `client.globalConfiguration.getGlobalConfiguration(type)` and
  `setGlobalConfiguration(dto)`, and `client.files.uploadPublicFile(file, { folder })`
  returning the path. It exports `GlobalConfigurationClient`,
  `ClientCredentialsTokenProvider` and `ApiClientConfig`.
- The design system (`@igrp/igrp-framework-react-design-system/tokens`) declares
  51 variables on `:root` (including `--radius`) and 50 on `.dark`, all OKLCH
  except the derived `--ring-invalid`, `--sidebar-active` and
  `--sidebar-active-foreground`.
- **This app's `src/styles/app-center.css` already sets some core and app-tier
  Tokens on `:root` and `.dark`**: `--ring` (a deliberate AA override), `--favorite`,
  `--scrollbar-thumb`, `--scrollbar-thumb-hover`, the subtle status pairs and the
  app tiles. Section 8 explains how the Brand takes precedence over them.
- `IGRPRootLayout` (framework-next) renders `<html>` and `<body>` and wraps
  children in `IGRPNestedProviders` (session, tooltip, next-themes with
  `attribute="class"`, and the active-theme preset provider).
- The framework header shows `headerLogo` from `getHeaderData()` and falls back
  to `/logo-no-text.png` through `IGRPTemplateImage`, which renders remote URLs
  `unoptimized` and swaps to a fallback on load error. `IGRPAuthForm` takes
  `logo: { src, srcDark?, width, height }`.
- `NEXT_PUBLIC_IGRP_MINIO_URL` is the base the Application Center already uses to
  resolve picture paths (`app-card.tsx`).
- The Application Center settings hub lists a disabled "Customização" card
  pointing to `/settings/customization`, with copy under `settings.items.customization`.
- `src/styles/themes.css` (preset palettes) is deleted in the working tree.

### 3.1 Reference: tweakcn

Reviewed the editor at tweakcn.com and the repository `jnsahaj/tweakcn`
(Apache-2.0, shallow clone). Findings that shape this design:

- **Light and dark as paired maps.** Each theme is one object with `light` and
  `dark` style maps, validated by a schema. Same shape as our Brand document.
- **Role pairs, not raw variables.** Tokens are grouped as background and
  foreground pairs (Primary, Secondary, Accent, Card, Popover, Muted,
  Destructive, Sidebar) with Border, Input, Ring and Chart 1 to 5 alone. We
  adopt the same grouping.
- **Convert at apply time, emit from one map.** tweakcn parses with culori,
  applies inline on the root element and toggles a `dark` class, and generates
  its CSS export from the same map. We keep that: one map feeds the hoisted
  stylesheet and the preview.
- **Contrast checker exists.** tweakcn ships a WCAG ratio helper. We deferred
  contrast warnings as out of scope for v1; see section 15 for the open question.
- **Output format differs.** tweakcn emits HSL for Tailwind 3 compatibility.
  Our Tokens are OKLCH in the design system, so we store OKLCH.
- **Persistence differs.** tweakcn keeps themes in its own database (Drizzle).
  We store the Brand in Access Management, which already has the endpoint.
- **Ideas only.** We reuse the structure and the pattern, not the code.

Limits: the public pages returned summaries, not source. The findings above come
from the cloned source for the conversion and generation modules, and from the
page for the editor layout.

## 4. Goals and non-goals

Goals

1. One Brand per organization, edited in one place, applied in every framework
   app that opts in with `IGRP_BRANDING_ENABLED=true`.
2. An app that leaves the flag off keeps the Defaults and pays nothing: no
   fetch, no stylesheet, no provider work.
3. No flash of default colors: Token overrides are in `<head>` before first paint.
4. Safe by default: an invalid or missing Brand never breaks a page.
5. Siblings need no code beyond a package bump, the flag, and one metadata helper call.

Non-goals (v1)

- Per-user or per-department palettes, named presets.
- JSON import and export, version history, revert to an earlier saved Brand.
- Contrast warnings in the editor (see section 15).
- Editing typography, radius, spacing, shadows or component styles.
- Driving browser chrome color from the Brand.
- Any backend change in this iteration (the M2M read is a separate request).

## 5. Brand document contract

Stored as the `config` string of `GlobalConfigurationDTO` with
`type: "ORGANIZATION"`. JSON, UTF-8, at most 64 KB.

```jsonc
{
  "version": 1,
  "tokens": {
    "light": { "--primary": "oklch(0.45 0.18 250)", "--app-tile-1": "oklch(0.95 0.02 41)" },
    "dark":  { "--primary": "oklch(0.78 0.14 250)" }
  },
  "logos": {
    "header":  { "light": "https://minio.example/igrp/public/branding/…/mark.png", "dark": "https://minio.example/igrp/public/branding/…/mark-dark.png" },
    "wide":    { "light": "https://minio.example/igrp/public/branding/…/logo.svg", "width": 320, "height": 96 },
    "favicon": { "light": "https://minio.example/igrp/public/branding/…/favicon.png" }
  }
}
```

Rules

- `version` is required and must be `1`. Any other value: the whole document is ignored.
- `tokens.light` and `tokens.dark` are sparse maps. A key absent from a map is
  not emitted, so the Default applies. Keys match `^--[a-z][a-z0-9-]{0,63}$`.
  Values follow the framework grammar in section 9.
- `logos.*` are optional. `light` is required inside a present slot. `dark` is
  optional and falls back to `light`. `width` and `height` are positive integers
  and apply to `wide` only.
- Unknown keys are ignored, not rejected, so a newer editor can add fields.
- Empty `tokens` and no `logos` is valid and means all Defaults.

Type names (`@igrp/framework-next-types`): `IGRPBranding`, `IGRPBrandingTokens`,
`IGRPBrandingLogos`, `IGRPBrandingLogoSlot`, `IGRPBrandingMode = "light" | "dark"`.

## 6. Token catalogs

Both tiers share one storage map. Each catalog entry carries `name`, `group`, a
label key and the Default per Mode (the editor shows it as placeholder).

### 6.1 Core tier (`IGRP_BRANDING_CORE_TOKENS` in framework-next-types, 50 entries)

| Group | Tokens |
| --- | --- |
| Brand | `--primary`, `--primary-foreground`, `--secondary`, `--secondary-foreground`, `--accent`, `--accent-foreground`, `--ring` |
| Surfaces | `--background`, `--card`, `--card-foreground`, `--popover`, `--popover-foreground`, `--muted`, `--border`, `--input` |
| Text | `--foreground`, `--muted-foreground` |
| Status | `--destructive`, `--destructive-foreground`, `--success`, `--success-foreground`, `--warning`, `--warning-foreground`, `--info`, `--info-foreground`, `--indigo`, `--indigo-foreground`, `--highlight`, `--highlight-foreground` |
| Sidebar | `--sidebar`, `--sidebar-foreground`, `--sidebar-primary`, `--sidebar-primary-foreground`, `--sidebar-accent`, `--sidebar-accent-foreground`, `--sidebar-active`, `--sidebar-active-foreground`, `--sidebar-border`, `--sidebar-ring` |
| Charts | `--chart-1` … `--chart-8` |
| Other | `--ring-invalid`, `--process-completed`, `--process-active` |

### 6.2 App tier (`src/features/branding/app-tokens.ts`, 23 entries)

| Group | Tokens |
| --- | --- |
| Subtle status | `--primary-subtle`, `--primary-subtle-foreground`, `--success-subtle`, `--success-subtle-foreground`, `--warning-subtle`, `--warning-subtle-foreground`, `--info-subtle`, `--info-subtle-foreground`, `--destructive-subtle`, `--destructive-subtle-foreground` |
| App tiles | `--app-tile-1` … `--app-tile-5` and their `-foreground` pairs (10) |
| Other | `--favorite`, `--scrollbar-thumb`, `--scrollbar-thumb-hover` |

App-tier Defaults are the values in `app-center.css`. Sibling apps that receive
app-tier keys have no matching elements, so those keys are inert there.

Labels: 73 entries in `branding.tokens.*`, translated in `pt`, `en` and `fr`.

## 7. Package responsibilities and public API

### 7.1 `@igrp/framework-next-types`

- Types from section 5 and `IGRP_BRANDING_CORE_TOKENS` with entries
  `{ name, group, defaults: { light: string; dark: string } }`.
- `IGRPConfigArgs` gains `branding?: { enabled: boolean }`. Omitted means disabled.
  Templates set it from the env: `branding: { enabled: process.env.IGRP_BRANDING_ENABLED === "true" }`,
  the same shape as `syncAccess`. The `igrpBuildConfig` schema accepts the field.

### 7.2 `@igrp/framework-next-ui` (new `branding/` folder, dependency-free, isomorphic)

- `igrpParseBranding(raw: string): IGRPBranding | null` — size check, JSON parse,
  field-by-field validation (section 9). Returns `null` for an unusable document;
  otherwise the cleaned object with invalid fields dropped.
- `igrpBrandingToCss(branding: IGRPBranding): string` — emits
  `html:root { … }` and `html.dark { … }` blocks (section 8 explains the selectors).
  Pure, fixed key order, so the hoisted style is byte-stable.
- `IGRPBrandingStyle({ branding })` — renders
  `<style href="igrp-branding" precedence="igrp-branding">` with the CSS text.
  Renders nothing for `null` or empty branding.
- `IGRPBrandingProvider({ branding, children })` and `useIGRPBranding()` — client
  context exposing `logos` and `tokens` to chrome components.
- `IGRPTemplateHeader`: logo precedence is `branding.logos.header` (dark variant
  via two images with `dark:hidden` / `hidden dark:block`), then `headerLogo`,
  then `fallbackLogo`.
- `IGRPAuthForm`: when the context has `logos.wide`, it replaces the `logo` prop.
  The rendered height is capped at 80 px with `w-auto`, and the width follows
  the natural ratio. Without context, the prop is used as today.
- `IGRPNestedProviders` accepts `branding?: IGRPBranding | null` and mounts the
  provider. The active-theme preset provider and `IGRP_DEFAULT_THEMES` are
  removed (section 11).

### 7.3 `@igrp/framework-next` (server)

- `igrpGetBranding(args: { baseUrl: string; token?: string; timeout?: number }): Promise<IGRPBranding | null>` — loader with the cache in section 8.
- `igrpInvalidateBranding(baseUrl?: string): void` — drops the cache entry.
- `igrpBrandingMetadata(branding: IGRPBranding | null, fallbackIcon: string): Metadata["icons"]`
  — light favicon as `icon`, dark variant as a `prefers-color-scheme: dark`
  entry; returns the fallback icon unchanged when the Brand is `null`.
- `IGRPRootLayout`: when `config.branding?.enabled` is not `true`, the layout
  renders as before this feature. No loader call, no `IGRPBrandingStyle`,
  `IGRPNestedProviders` receives `branding: null`. When `true`, the layout
  resolves the Brand once per request (React `cache`), renders
  `IGRPBrandingStyle` as the first child of `<body>`, and passes `branding` on.
  The preset `theme-*` body classes and the `igrp_active_theme` cookie read are
  removed in both cases.
- Token source: `resolveBrandingToken(config)` returns
  `layout.session?.accessToken` today and is the single switch point for the M2M provider.

### 7.4 Application Center

- `src/actions/global-configuration.ts` — server actions (section 10.4).
- `src/features/branding/` — editor feature (section 10).
- `src/app/(igrp)/(home)/settings/customization/{page,loading,error,forbidden}.tsx`.
- Root layout `generateMetadata` spreads `igrpBrandingMetadata(...)`.
- `igrp.template.config.ts` sets `branding: { enabled: process.env.IGRP_BRANDING_ENABLED === "true" }`.
- `.env.example` documents the flag next to `IGRP_SYNC_ACCESS`; `docs/ENVIRONMENT.md` gains a row.
- Settings hub: the card is active only when `isBrandingEnabled()` is true.
  `isBrandingEnabled()` is `IGRP_BRANDING_ENABLED === "true" && !isAuthBypass()`,
  read once, in `src/lib/utilities.ts`.
- The route calls `notFound()` when `isBrandingEnabled()` is false. This covers
  both the flag being off and auth bypass (Q14).
- `CUSTOMIZE_PERMISSION = "igrp.applications.customize"` in `src/lib/constants.ts`.
- `docs/adr/0003-brand-read-with-session-token.md` pointer to the framework ADR.
- `docs/TOKENS.md` rewritten to describe the editor and the two catalogs.
- `culori` added as a dependency of this app only.

### 7.5 Template (`templates/demo-v1` in the framework repo)

- `igrp.template.config.ts`: `branding: { enabled: process.env.IGRP_BRANDING_ENABLED === "true" }`.
- `.env.example`: commented block in the `IGRP_*` section, default empty
  (treated as `false`).
- `.env`: `IGRP_BRANDING_ENABLED=false`.
- `docs/ENVIRONMENT.md`: row `IGRP_BRANDING_ENABLED` | Load the organization Brand
  (colors and logos) from Access Management at render time | `false`.
- Root layout `generateMetadata` spreads `igrpBrandingMetadata(...)`, a no-op while the flag is off.

## 8. Loading, caching and applying

0. `IGRPRootLayout` reads `config.branding?.enabled`. Anything but `true` skips
   everything below.
1. With a session token and `previewMode === false`, the layout calls
   `igrpGetBranding`. Without a token, the same call returns the cached value
   and never fetches.
2. Cache: module-level `Map<baseUrl, { value, fetchedAt, inflight }>`.
   - Fresh (`now − fetchedAt < 5 min`) and no newer `igrp_brand_v` cookie:
     return `value`.
   - Stale with a token, or a newer `igrp_brand_v` cookie: start one fetch,
     share it with concurrent callers, return the previous `value` while it
     runs. The first request on a process awaits the fetch so the first paint is branded.
   - 404: cache `value = null` with the current timestamp.
   - Other errors (network, 5xx, 401): log `igrp.branding.fetch_failed`, keep the
     previous `value`, and skip retries for 60 seconds.
   - Invalid document: `igrpParseBranding` returns `null`, logs
     `igrp.branding.invalid_config` once, caches `null`.
3. Fetch: `GET {baseUrl}/api/global-configuration?type=ORGANIZATION` through
   `GlobalConfigurationClient` with `Authorization: Bearer <token>` and a 3-second
   timeout.
4. Freshness cookie: `saveBranding` sets `igrp_brand_v=<epoch ms>` with
   `httpOnly`, `sameSite=lax`, `path=/`, `maxAge=300`. The loader reads it with
   `cookies()`. The cookie only helps browsers that reach the same host, so other
   apps still wait for the TTL.
5. Application: the resolved Brand feeds `IGRPBrandingStyle` (Tokens) and
   `IGRPBrandingProvider` (Logos). The stylesheet uses `html:root` and `html.dark`
   selectors, specificity (0,1,1). This beats the `:root` and `.dark` declarations
   in `app-center.css` regardless of stylesheet order, so the Brand wins over
   the local `--ring`, `--favorite` and scrollbar defaults. The app-tier
   Defaults in `app-center.css` stay as the fallback when no Brand is set.
6. Save timing in the Application Center: `saveBranding` calls
   `igrpInvalidateBranding()`, sets the freshness cookie and calls
   `revalidatePath("/", "layout")`. The client then calls `router.refresh()`.
7. Preview mode (`IGRP_PREVIEW_MODE=true` or `AUTH_PROVIDER=none`): no fetch,
   `branding = null`. The editor is hidden (section 7.4), so no save path runs.

## 9. Validation and safety

Implemented once in `framework-next-ui/branding` and used by the loader. The
editor applies the same rules plus the stricter rules marked **(editor)**.

- Token name: `^--[a-z][a-z0-9-]{0,63}$`.
- Color value, trimmed, at most 128 characters, one of: `#` hex (3, 4, 6 or 8
  digits), `rgb`, `rgba`, `hsl`, `hsla`, `oklch`, `oklab`, `lab`, `lch`, `color`,
  `color-mix`, `var(--name)` nested in those, a CSS named color, `transparent`,
  `currentColor`. Inside parentheses only `[0-9a-z%.,\s/+-]` and nested `var(--…)`.
  No `;`, `{`, `}`, `<`, `>`, `url(`, `expression(`, backslash or `@`.
- **(editor)** Accepted for saving: hex, `rgb`, `hsl`, `oklch`, `oklab`, `lab`,
  `lch` and named colors only. `color-mix`, `var()`, `transparent` and
  `currentColor` are rejected in the editor because they have no single OKLCH value.
- **(editor)** Every saved color is normalized to OKLCH with culori
  (`formatCss(converter("oklch")(parse(value)))`, lightness, chroma and hue
  with four decimals). The stored string is `oklch(L C H)` or `oklch(L C H / A)`.
- Logo URL: absolute `https://` (the framework also accepts `http://`), at most
  2048 characters, no credentials, no whitespace. Rendered through
  `IGRPTemplateImage`, so hosts need not be in `images.remotePatterns`.
- **(editor)** Logo URL host must equal the host of `NEXT_PUBLIC_IGRP_MINIO_URL`.
  Only the editor's own uploads can be saved.
- **(editor)** Favicon: PNG or ICO, at most 256 KB. Wide logo: natural size
  read on pick and stored as `width` and `height`.
- Document size: reject above 64 KB before parsing.
- A failing field is dropped and counted; the loader logs the count once per
  cache fill. The editor shows an inline error and blocks save.
- Emitted CSS only contains validated values, so the hoisted style cannot close
  its block or inject selectors.

## 10. Editor (Application Center)

### 10.1 Route and guard

`/settings/customization`, under `(igrp)/(home)/settings`. The page renders inside
the settings layout's `max-w-7xl` container, with the page header and section
spacing of `settings/page.tsx`; it does not take over the viewport. Breadcrumbs
come from the framework header. The editor has two tabs, Cores and Logótipos.
Typography is out of scope for this version. `page.tsx` calls
`notFound()` when `isBrandingEnabled()` is false, then awaits
`igrpAssertAuthorize(CUSTOMIZE_PERMISSION)`. `forbidden.tsx` renders
`IGRPForbidden` with editor-specific copy. The server actions check the
permission again with `igrpAuthorize` and return a forbidden `ActionResult`.
The API remains the real enforcement.

### 10.2 Feature layout (`src/features/branding/`)

- `branding-schemas.ts` — Zod v4 factory taking `t`. Form shape:
  `{ tokens: { light, dark }, logos: { header, wide, favicon } }`. A logo slot
  holds `{ light?: File | string; dark?: File | string; width?: number; height?: number }`.
  Color fields run the editor color rules through `z.string().refine`.
- `app-tokens.ts` — app-tier catalog (section 6.2).
- `catalog.ts` — merges both tiers into ordered groups with label keys
  `branding.groups.*` and `branding.tokens.*`.
- `query-keys.ts` — `brandingKeys.config()`.
- `use-branding.ts` — `useBrandingConfig()` (query over `getBranding`, 404 → null)
  and `useSaveBranding()` (mutation: upload logos, normalize, save, invalidate).
- `lib/branding-mapper.ts` — pure: form values → `IGRPBranding` (drops empty
  fields, keeps only edited Tokens, normalizes colors) and `IGRPBranding` → form defaults.
- `lib/color-normalize.ts` — pure wrapper around culori for the editor rules.
- `lib/live-preview.ts` — pure helpers that compute the inline custom property
  map for a draft and Mode. The preview panel applies it to its own element,
  not to the document root.
- `components/`
  - `branding-screen.tsx` — page composition: `IGRPForm` with `react-hook-form`,
    the unsaved-changes bar, the save button, the result toast.
  - `mode-switch.tsx` — switch control (`role="switch"`, labelled Claro / Escuro).
    The knob moves right and shows the moon in Escuro, and sits left with the sun
    in Claro. It sets the Mode for the editor form and the preview.
  - `token-group.tsx` — collapsible group of `color-field`s. Brand is open by default.
  - `color-field.tsx` — `IGRPFormField` with a swatch button (native
    `<input type="color">` writes hex) and a text input that accepts any editor-valid
    color. Placeholder is the catalog Default. A clear button returns the field to its Default.
  - `logo-field.tsx` — one `FileUploadField` per variant. Picks read natural size
    for the wide logo and show the current URL. Favicon accepts PNG or ICO only.
  - `live-preview.tsx` — static composition with the real design-system components
    inside a panel element: header with the header mark, card with primary,
    secondary and destructive buttons, a focused form field, status badges including
    the subtle variants, the app-tile row, a sidebar rail with an active item, and
    the wide logo on a login-like panel.

### 10.3 Save flow

1. Validate the form. Any invalid field blocks save with inline errors.
2. For each logo slot holding a `File`, call `uploadPublicFile(file, { folder: "branding" })`.
   Uploads run in parallel. The returned path is turned into
   `NEXT_PUBLIC_IGRP_MINIO_URL` + path. One failure aborts with a toast naming the slot.
3. Normalize colors to OKLCH and build the `IGRPBranding` document with the mapper.
4. Serialize and call `saveBranding(json)`. On success: invalidate the query,
   show `branding.saved`, and `router.refresh()`.
5. 403 → `branding.errors.forbidden`. Other errors → the API `detail` when present,
   else `errors.generic`.

### 10.4 Server actions (`src/actions/global-configuration.ts`)

- `getBranding(): Promise<ActionResult<IGRPBranding | null>>` — calls
  `client.globalConfiguration.getGlobalConfiguration("ORGANIZATION")`, maps 404
  to `{ success: true, data: null }`, parses with `igrpParseBranding`.
- `saveBranding(config: string): Promise<ActionResult<void>>` — checks
  `isBrandingEnabled()` and `igrpAuthorize(CUSTOMIZE_PERMISSION)`, re-validates
  size, parse and the editor rules (logo host, OKLCH), posts
  `{ type: "ORGANIZATION", config }`, then `igrpInvalidateBranding()`, sets
  `igrp_brand_v`, and `revalidatePath("/", "layout")`.

### 10.5 i18n

Namespace `branding` in `pt.json`, `en.json` and `fr.json`, all complete:
`meta`, `title`, `subtitle`, `modes.light|dark`, `groups.*`, `tokens.*` (73 labels),
`logos.*`, `actions.save|clear`, `saved`, `errors.forbidden|upload|invalidColor|logoHost|favicon`.
Folder added to `MIGRATED_FOLDERS` in the literal-strings guard.

### 10.6 UI rules

Horizon components first (`IGRPForm`, `IGRPFormField`, `IGRPInputText`,
`IGRPButton`, `IGRPCard`), `Badge` and semantic tokens for color, `gap-*` for
spacing, `size-N` for squares, `Separator` for dividers. The swatch is the only
place a raw color appears, as inline `style={{ background: value }}` on a
bordered `size-8 rounded-md` button. The `no-raw-color` rule in
`scripts/check-ui-rules.mjs` matches only Tailwind palette classes, so it passes.

## 11. Preset themes removed

- `framework-next-ui`: delete `templates/theme-selector`, `providers/active-theme`,
  `IGRP_DEFAULT_THEMES`, `IGRP_SCALED_THEMES`, `IGRP_ACTIVE_THEME_COOKIE`,
  `igrpActiveThemeClassName`, `useIGRPThemeConfig`. Remove the selector from the
  header. The light / dark / system `IGRPTemplateModeSwitcher` stays.
- `framework-next`: `IGRPRootLayout` stops reading `activeThemeValue` and
  `isScaled`. `IGRPLayoutConfigArgs` keeps both marked `@deprecated` and ignored
  for one release.
- Application Center: `actions/igrp/layout.ts` drops `getTheme()`. `themes.css`
  stays deleted. The commented sidebar override block in `globals.css` is removed.
- Template (`templates/demo-v1`): the same two edits.

## 12. Error handling matrix

| Situation | Behaviour |
| --- | --- |
| Flag not `true`, or auth bypass | Defaults; no fetch, no stylesheet, no logo override. Editor card inactive and route 404. |
| API unreachable at render | Previous cached value or Defaults; one log line; retry after 60 s. |
| 404 from GET | Defaults; cached as "none" for the TTL. |
| Stored JSON invalid or wrong version | Defaults; logged once per cache fill. |
| One Token value invalid | That Token dropped; the rest applied. |
| Editor color uses `color-mix`, `var()`, `transparent` | Inline error on the field; save blocked. |
| Logo URL on a foreign host (editor) | Inline error; save blocked. |
| Logo URL fails to load at render | `IGRPTemplateImage` falls back to the app's static logo. |
| Favicon URL invalid | Metadata uses the app's static icon. |
| Save without permission | 403 → forbidden copy. |
| Upload fails | Save aborted, slot named in the toast, form state kept. |
| Config over 64 KB | Rejected in the editor before upload and again on the server. |
| Save in one browser, other browser on another instance | Saving browser refetches at once; other browsers wait for the 5-minute TTL. |

## 13. Testing

Framework (`vitest`)

- `igrpParseBranding`: valid document, wrong version, oversized, invalid name,
  one bad value dropped while others survive, unknown keys ignored, URL rules.
- `igrpBrandingToCss`: stable order, `html:root` and `html.dark` selectors, empty maps emit nothing.
- `IGRPRootLayout`: flag omitted or `false` → no loader call, no style, providers get `null`;
  flag `true` → loader called once per request. `igrpBuildConfig` preserves the field.
- Loader cache: fresh hit, stale-while-revalidate, in-flight dedupe, 404 cached as null,
  error keeps old value with cooldown, no token never fetches, invalidate forces refetch,
  newer `igrp_brand_v` cookie forces refetch.
- Header logo precedence and dark variant; `IGRPAuthForm` context override with the 80 px cap;
  `igrpBrandingMetadata` shapes.

Application Center (`src/__tests__/branding/`)

- `isBrandingEnabled()` is false when the flag is off or auth is bypassed.
- `getBranding` maps 404 to null and parses valid config.
- `saveBranding` rejects: oversized input, unauthorized callers, flag off, foreign logo
  host, `color-mix` values; accepts valid OKLCH; sets `igrp_brand_v`; calls the SDK only after checks.
- Color normalization: hex, rgb, hsl and named inputs produce the expected OKLCH string.
- Mapper: form → document drops empty fields, keeps only edited Tokens; document → form round-trips.
- Live preview helper: computes exactly the draft properties and never touches `document.documentElement`.
- Screen: all groups from both catalogs render; mode switch changes only the panel class;
  invalid color blocks save; successful save uploads, then saves, in order.
- i18n: every catalog token has a label in `pt`, `en` and `fr`; literal-strings guard passes.
- Gates: `pnpm check:ui`, `pnpm typecheck`, `pnpm test`.

## 14. Rollout

Implementation is two plans, one per repository, executed in this order.

1. Framework repo (`igrp-framework-nextjs`, branch `dev`): sections 7.1 to 7.3 and
   11, the ADR `docs/adr/0001-brand-read-with-session-token.md`, and the template
   changes in 7.5. Release `@igrp/framework-next-types`, `-next-ui` and `-next` together as betas.
2. Application Center (branch `dev`): bump the packages, implement sections 7.4 and 10,
   add `culori`, run the gates, add the ADR pointer, merge.
3. Siblings: bump the packages, add the `branding` line to their config, add the
   `igrpBrandingMetadata` spread, and set `IGRP_BRANDING_ENABLED=true` where the
   Brand should show. A sibling that only bumps packages keeps the Defaults.
4. Backend request (separate ticket, not blocking): `GET /api/m2m/global-configuration?type=`
   accepting client-credentials tokens, or add the existing GET to
   `M2MTokenRejectionFilter`'s skip list. Then `resolveBrandingToken` switches to
   the M2M provider and cold-start login pages are branded.

## 15. Risks and open points

- **Cold start delay.** The 3-second fetch on a cold process delays first paint
  once per TTL. The M2M follow-up removes it from the user path.
- **Name collisions.** A sibling with its own local Token names matching the
  app tier gets the organization's values. Document the app-tier names in the
  framework README.
- **Local overrides in this app.** `app-center.css` sets `--ring`, `--favorite`,
  `--scrollbar-thumb` and the app tiles. The `html:root` selector (section 8)
  makes the Brand win; the local values remain the Defaults. Verify with a
  browser check during implementation.
- **Contrast.** tweakcn ships a contrast checker and this app holds an AA
  contract. v1 leaves contrast warnings out. Open question: should the editor warn
  on text pairs below 4.5:1? Proposed as a follow-up, not v1.
- **Hydration.** React 19 style hoisting needs `href` and `precedence`. The CSS
  text must be byte-stable between server and client, which the fixed key order guarantees.
- **Preset removal.** Users who chose blue, green or amber see the organization
  Brand or the Defaults. Their cookie is ignored.
- **Cookie scope.** `igrp_brand_v` only helps the same host. Other apps wait for the TTL.
- **Accepted:** orphaned logo files and uploader usernames in public paths (section 2).
