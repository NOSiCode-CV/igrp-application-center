# Platform branding (customization) — design

- Date: 2026-10-13
- Status: approved design, awaiting implementation plan
- Owner: Application Center team (Fidel da Luz)
- Repos touched: `igrp-framework-nextjs` (framework packages) and `igrp-application-center` (editor)

## 1. Summary

An administrator with the permission `igrp.applications.customize` opens
`/settings/customization` in the Application Center, edits the platform's CSS
color tokens for light and dark mode plus four logo slots with a live preview,
and saves. The config is stored through the Access Management API's global
configuration endpoint (type `ORGANIZATION`). Every app built on
`@igrp/framework-next` loads that config at render time, injects the token
overrides as a server-rendered stylesheet before first paint, and shows the
custom logos in the header, the login form and the favicon. Nothing saved means
the design-system defaults, and any failure degrades to those defaults.

## 2. Decisions taken during brainstorming

| Topic | Decision |
| --- | --- |
| Where "load and apply" lives | In the framework (`@igrp/framework-next`, `-next-ui`, `-next-types`), so siblings get it by upgrading. |
| Token scope | The 51 design-system tokens for light (50 for dark, which has no `--radius`), plus the Application Center's 23 app-level tokens. |
| Configuration type | `ORGANIZATION`. `CLUSTER` stays reserved. |
| Public pages (login, invite) | Branded from the per-process cache when warm. Session token is the only source today because the backend rejects M2M tokens outside `/api/m2m/`. A backend request for `GET /api/m2m/global-configuration` is filed so a later release covers cold starts. |
| Logo slots | Header mark, wide (login) logo, favicon, each with an optional dark variant. Stored as public-file URLs. |
| Per-user preset themes (default, blue, green, amber) | Removed. Only light / dark / system remains. |
| Editor features (v1) | Live preview only. Reset, import/export and contrast warnings are out of scope. |
| Propagation | Per-process cache with a 5-minute TTL in every app. The Application Center invalidates its own cache on save. |
| Opt-in per app | Env flag `IGRP_BRANDING_ENABLED` (default `false`). `true` loads and applies the organization brand; `false` or unset skips the fetch, the stylesheet, the logo overrides and, in the Application Center, the editor card and route. The app then renders exactly as it does today. |

## 3. Current state (facts the design relies on)

- Backend `GET /api/global-configuration?type=` requires only an authenticated
  user token and returns 404 (`IGRP_AUTH_GLOBAL_CONFIGURATION_NOT_FOUND`) when
  nothing was saved and 400 for an unknown type. `POST /api/global-configuration`
  requires `igrp.applications.customize`. Each POST inserts a new row; GET
  returns the newest by `lastModifiedDate`. `config` is a free-form TEXT column.
- `M2MTokenRejectionFilter` returns 401 for client-credentials tokens on any path
  outside `/api/m2m/**` and a short allowlist. The branding GET is not on it.
- SDK `@igrp/platform-access-management-client-ts@0.2.0-beta.18` exposes
  `client.globalConfiguration.getGlobalConfiguration(type)` and
  `setGlobalConfiguration(dto)`, `client.files.uploadPublicFile(file, { folder })`
  returning a URL string, and exports `GlobalConfigurationClient`,
  `ClientCredentialsTokenProvider` and `ApiClientConfig` (`baseUrl`, `timeout`,
  `headers`).
- The design system (`@igrp/igrp-framework-react-design-system/tokens`) declares
  51 variables on `:root` and 50 on `.dark` (`--radius` is light-only), all OKLCH
  except three derived ones (`--ring-invalid`, `--sidebar-active`,
  `--sidebar-active-foreground`).
- `IGRPRootLayout` (framework-next) renders `<html>` and `<body>` and wraps
  children in `IGRPNestedProviders` (session, tooltip, next-themes with
  `attribute="class"`, active-theme preset provider).
- The framework header shows `headerLogo` from `getHeaderData()` and falls back
  to `/logo-no-text.png` through `IGRPTemplateImage`, which renders remote URLs
  `unoptimized` and swaps to a fallback on load error. `IGRPAuthForm` takes a
  `logo: { src, srcDark?, width, height }` prop.
- The Application Center settings hub already lists a disabled "Customização"
  card pointing to `/settings/customization`, with i18n copy under
  `settings.items.customization`. Pages gate with `igrpAssertAuthorize`, and a
  permission name containing a dot is matched verbatim against the token.
- `src/styles/themes.css` (preset palettes) is deleted in the working tree.

## 4. Goals and non-goals

Goals

1. One brand per organization, edited in one place, applied in every framework
   app that opts in with `IGRP_BRANDING_ENABLED=true`. An app that leaves the
   flag off keeps the design-system defaults and pays no cost: no fetch, no
   stylesheet, no provider work.
2. No flash of default colors: overrides are in `<head>` before first paint.
3. Safe by default: invalid or missing config never breaks a page.
4. Siblings need no code beyond a package bump and one metadata helper call.

Non-goals (v1)

- Per-user or per-department palettes, multiple named presets.
- Reset to defaults, JSON import/export, contrast validation in the editor.
- Editing typography, radius, spacing or component-level styles.
- Any backend change in this iteration (the M2M endpoint is a separate request).

## 5. Config contract

Stored as the `config` string of the `GlobalConfigurationDTO` with
`type: "ORGANIZATION"`. JSON, UTF-8, at most 64 KB.

```jsonc
{
  "version": 1,
  "tokens": {
    "light": { "--primary": "oklch(0.45 0.18 250)", "--app-tile-1": "oklch(0.95 0.02 41)" },
    "dark":  { "--primary": "oklch(0.78 0.14 250)" }
  },
  "logos": {
    "header":  { "light": "https://minio.example/igrp/branding/mark.png", "dark": "https://minio.example/igrp/branding/mark-dark.png" },
    "wide":    { "light": "https://minio.example/igrp/branding/logo.svg", "width": 160, "height": 48 },
    "favicon": { "light": "https://minio.example/igrp/branding/favicon.png" }
  }
}
```

Rules

- `version` is required and must be `1`. Any other value: the whole document is ignored.
- `tokens.light` and `tokens.dark` are sparse maps. A key absent from the map is
  not emitted, so the design-system default applies. Keys must match
  `^--[a-z][a-z0-9-]{0,63}$`. Values must match the color grammar in section 9.
- `logos.*` are optional. `light` is required inside a slot that is present;
  `dark` is optional and falls back to `light`. `width` and `height` are
  positive integers and only meaningful on `wide`; defaults are the app's
  `siteConfig.logo` dimensions.
- Unknown top-level or nested keys are ignored, not rejected, so a newer editor
  can add fields before every app upgrades.
- An empty object for `tokens` and no `logos` is valid and means "defaults".

Type names (in `@igrp/framework-next-types`): `IGRPBranding`,
`IGRPBrandingTokens`, `IGRPBrandingLogos`, `IGRPBrandingLogoSlot`,
`IGRPBrandingMode = "light" | "dark"`.

## 6. Token catalogs

Two tiers share one storage map. Each catalog entry carries `name`, `group`,
`label` key and the default value per mode, which the editor shows as the
placeholder and the preview uses when a field is empty.

### 6.1 Core tier (framework, `IGRP_BRANDING_CORE_TOKENS` in framework-next-types)

| Group | Tokens |
| --- | --- |
| Brand | `--primary`, `--primary-foreground`, `--secondary`, `--secondary-foreground`, `--accent`, `--accent-foreground`, `--ring` |
| Surfaces | `--background`, `--card`, `--card-foreground`, `--popover`, `--popover-foreground`, `--muted`, `--border`, `--input` |
| Text | `--foreground`, `--muted-foreground` |
| Status | `--destructive`, `--destructive-foreground`, `--success`, `--success-foreground`, `--warning`, `--warning-foreground`, `--info`, `--info-foreground`, `--indigo`, `--indigo-foreground`, `--highlight`, `--highlight-foreground` |
| Sidebar | `--sidebar`, `--sidebar-foreground`, `--sidebar-primary`, `--sidebar-primary-foreground`, `--sidebar-accent`, `--sidebar-accent-foreground`, `--sidebar-active`, `--sidebar-active-foreground`, `--sidebar-border`, `--sidebar-ring` |
| Charts | `--chart-1` … `--chart-8` |
| Other | `--radius` (light only, a length not a color), `--ring-invalid`, `--process-completed`, `--process-active` |

`--radius` is the one non-color token; it accepts a CSS length (`rem`, `px`, `em`).

### 6.2 App tier (Application Center, `src/features/customization/app-tokens.ts`)

| Group | Tokens |
| --- | --- |
| Subtle status | `--primary-subtle`, `--primary-subtle-foreground`, `--success-subtle`, `--success-subtle-foreground`, `--warning-subtle`, `--warning-subtle-foreground`, `--info-subtle`, `--info-subtle-foreground`, `--destructive-subtle`, `--destructive-subtle-foreground` |
| App tiles | `--app-tile-1` … `--app-tile-5` and their `-foreground` pairs |
| Other | `--favorite`, `--scrollbar-thumb`, `--scrollbar-thumb-hover` |

The defaults for the app tier are the values currently in `app-center.css` for
`:root` and `.dark`. The framework validator accepts any well-formed custom
property name, so these pass through unchanged and reach sibling apps, where
they are inert.

## 7. Package responsibilities and public API

### 7.1 `@igrp/framework-next-types`

- Types from section 5.
- `IGRP_BRANDING_CORE_TOKENS: IGRPBrandingTokenCatalogEntry[]`.
- `IGRPBrandingTokenCatalogEntry = { name, group, defaults: { light: string; dark?: string } }`.
- `IGRPConfigArgs` gains an optional `branding?: { enabled: boolean }`. Omitted
  means disabled. Templates source it from the env:
  `branding: { enabled: process.env.IGRP_BRANDING_ENABLED === "true" }`, the
  same shape as `syncAccess`. The `igrpBuildConfig` schema accepts the field
  as an optional object with a boolean `enabled`.

### 7.2 `@igrp/framework-next-ui` (new `branding/` folder, dependency-free, isomorphic)

- `igrpParseBranding(raw: string): IGRPBranding | null` — JSON parse plus field
  by field validation (section 9). Returns `null` for a document that cannot be
  used at all, otherwise the cleaned object with invalid fields dropped.
- `igrpBrandingToCss(branding: IGRPBranding): string` — emits
  `:root{…}` and `.dark{…}` blocks from the token maps. Pure, deterministic,
  stable key order so the hoisted style deduplicates.
- `IGRPBrandingStyle({ branding })` — renders
  `<style href="igrp-branding" precedence="igrp-branding">` with the CSS text.
  React 19 hoists it into `<head>`; a null or empty branding renders nothing.
- `IGRPBrandingProvider({ branding, children })` and `useIGRPBranding()` —
  client context exposing `logos` and `tokens` to chrome components.
- `IGRPTemplateHeader`: logo precedence is `branding.logos.header` (dark variant
  when the `dark` class is active, via two images with `dark:hidden` /
  `hidden dark:block`), then `headerLogo` from `getHeaderData()`, then
  `fallbackLogo`.
- `IGRPAuthForm`: when the context has `logos.wide`, it replaces the `logo` prop
  (same `src` / `srcDark` / `width` / `height` shape). Without context the prop
  is used as today.
- `IGRPNestedProviders` accepts `branding?: IGRPBranding | null` and mounts the
  provider. The active-theme preset provider and `IGRP_DEFAULT_THEMES` are
  removed (section 11).

### 7.3 `@igrp/framework-next` (server)

- `igrpGetBranding(args: { baseUrl: string; token?: string; timeout?: number }): Promise<IGRPBranding | null>`
  — server-only loader with the cache in section 8.
- `igrpInvalidateBranding(baseUrl?: string): void` — drops the cached entry so
  the next request refetches. Called by the Application Center after a save.
- `igrpBrandingMetadata(branding: IGRPBranding | null, fallbackIcon: string): Metadata["icons"]`
  — returns the `icons` object for the app's root `generateMetadata`, using the
  favicon slot when present (light as `icon`, dark as a `media: (prefers-color-scheme: dark)` entry).
- `IGRPRootLayout` first checks `config.branding?.enabled`. When it is not
  `true`, the layout renders exactly as before this feature: no loader call,
  no `IGRPBrandingStyle`, and `IGRPNestedProviders` receives `branding: null`
  so the header and login form use their existing props. When it is `true`,
  the layout resolves the branding once per request (React `cache`), renders
  `IGRPBrandingStyle` as the first child of `<body>` (hoisted by React) and
  passes `branding` to `IGRPNestedProviders`. The preset `theme-*` body
  classes and the `igrp_active_theme` cookie read are removed in both cases.
- `igrpBrandingMetadata` returns the fallback icon unchanged when branding is
  `null`, so an app can call it unconditionally.
- Token source: one internal function `resolveBrandingToken(config)` that today
  returns `layout.session?.accessToken` and is the single place to switch to the
  M2M provider later.

### 7.4 Application Center

- `src/actions/global-configuration.ts` — server actions (section 10.4).
- `src/features/customization/` — editor feature (section 10).
- `src/app/(igrp)/(home)/settings/customization/{page,loading,error,forbidden}.tsx`.
- Root layout `generateMetadata` spreads `igrpBrandingMetadata(...)`.
- `igrp.template.config.ts` adds `branding: { enabled: process.env.IGRP_BRANDING_ENABLED === "true" }`;
  `.env.example` documents the flag next to `IGRP_SYNC_ACCESS`; `docs/ENVIRONMENT.md`
  gains a row.
- Settings hub: the customization card is enabled only when
  `IGRP_BRANDING_ENABLED=true`; otherwise it keeps `status: "inativo"` as today.
  The route `/settings/customization` calls `notFound()` when the flag is off,
  so the editor cannot save a brand the app itself would not display.
- Add `CUSTOMIZE_PERMISSION = "igrp.applications.customize"` and
  `isBrandingEnabled()` (reads the env once) to `src/lib/constants.ts` and
  `src/lib/utilities.ts` respectively.

### 7.5 Template (`templates/demo-v1` in the framework repo)

- `igrp.template.config.ts`: `branding: { enabled: process.env.IGRP_BRANDING_ENABLED === "true" }`.
- `.env.example`: a commented block in the `IGRP_*` section, default empty
  (treated as `false`), explaining that `true` loads the organization brand from
  Access Management and `false` keeps the design-system defaults with no fetch.
- `.env`: `IGRP_BRANDING_ENABLED=false`.
- `docs/ENVIRONMENT.md`: row `IGRP_BRANDING_ENABLED` | Load the organization
  brand (colors and logos) from Access Management at render time | `false`.
- Root layout `generateMetadata` spreads `igrpBrandingMetadata(...)`, which is
  a no-op while the flag is off.

## 8. Loading, caching and applying

0. `IGRPRootLayout` reads `config.branding?.enabled`. Anything but `true`
   short-circuits every step below: the request renders with defaults and
   the branding module is never touched.
1. `IGRPRootLayout` reads `config.layout.session`. With a session token and
   `previewMode === false`, it calls `igrpGetBranding`.
   Without a token (public pages, logged-out) it calls the same function with
   no token, which returns the cached value only and never fetches.
2. Cache: a module-level `Map<baseUrl, { value, fetchedAt, inflight }>`.
   - Fresh (`now - fetchedAt < 5 min`): return `value`.
   - Stale with a token: start one fetch, share it with concurrent callers, and
     return the previous `value` while it runs (stale-while-revalidate). The
     first ever request on a process awaits the fetch so the first paint is
     branded.
   - 404: store `value = null` with the current timestamp. A 404 is a valid
     "no branding" answer and is cached like any other.
   - Any other error (network, 5xx, 401): log one structured line
     `igrp.branding.fetch_failed`, keep the previous `value`, and set
     `fetchedAt` so a retry is not attempted for 60 seconds.
   - Invalid document: `igrpParseBranding` returns `null`, logged once as
     `igrp.branding.invalid_config`, cached as `null`.
3. The fetch is `GET {baseUrl}/api/global-configuration?type=ORGANIZATION`
   through `GlobalConfigurationClient` from the SDK with
   `headers.Authorization = Bearer <token>` and a 3-second timeout, so a slow
   API delays the first paint by at most 3 seconds once per process per TTL.
4. The resulting `IGRPBranding | null` feeds `IGRPBrandingStyle` (tokens) and
   `IGRPBrandingProvider` (logos). Tokens are applied as plain CSS custom
   properties on `:root` and `.dark`, which cascade over the design-system
   declarations because the hoisted style is inserted after the stylesheet in
   `<head>` and has equal specificity.
5. Timing in the Application Center: after a successful save the action calls
   `igrpInvalidateBranding()` and `revalidatePath("/", "layout")`; the client
   then calls `router.refresh()`. Siblings pick the change up within 5 minutes.
6. Preview mode (`IGRP_PREVIEW_MODE=true` or `AUTH_PROVIDER=none`): no fetch,
   `branding = null`, defaults everywhere. The editor page still renders with the
   mocked super-admin claims and the save action returns an error toast because
   there is no API.

## 9. Validation and safety

Applied identically by the editor (client, before save) and the loader (server,
after fetch). Implemented once in `framework-next-ui/branding`.

- Token name: `^--[a-z][a-z0-9-]{0,63}$`.
- Color value, after trim, max 128 characters, must match one of:
  `#[0-9a-f]{3,8}`, `rgb[a]?(…)`, `hsl[a]?(…)`, `oklch(…)`, `oklab(…)`,
  `lab(…)`, `lch(…)`, `color(…)`, `color-mix(…)`, `var(--name)` nested inside
  the above, a CSS named color, or `transparent` / `currentColor`. Inside the
  parentheses only `[0-9a-z%.,\s/+-]` and nested `var(--…)` are allowed. No
  `;`, `{`, `}`, `<`, `>`, `url(`, `expression(`, backslashes or `@`.
- `--radius` value: `^\d+(\.\d+)?(rem|px|em)$`.
- Logo URL: absolute `http(s)://`, max 2048 characters, no credentials, no
  whitespace. Rendered through `IGRPTemplateImage` (remote → `unoptimized`), so
  hosts need not be in `images.remotePatterns`. The favicon URL is placed in
  `<link rel="icon">` only after the same check.
- Document size: reject above 64 KB before parsing.
- A field that fails is dropped and counted; the loader logs the count once per
  cache fill. The editor shows an inline error on the field and blocks save.
- The emitted CSS never contains user text outside a validated value, so the
  hoisted style cannot close its own block or inject selectors.

## 10. Editor (Application Center)

### 10.1 Route and guard

`/settings/customization`, under the `(igrp)/(home)/settings` layout.
`page.tsx` awaits `igrpAssertAuthorize(CUSTOMIZE_PERMISSION)`; `forbidden.tsx`
renders `IGRPForbidden` with customization-specific copy. The server actions
check the same permission again with `igrpAuthorize` and return a 403-shaped
`ActionResult` on failure; the API remains the real enforcement. The settings
card is enabled and keeps its `Palette` icon and `warning` accent.

### 10.2 Feature layout (`src/features/customization/`)

- `customization-schemas.ts` — Zod v4 factory taking `t`: form shape
  `{ tokens: { light, dark }, logos: { header, wide, favicon } }` where each logo
  slot holds `{ light?: FileWithPreview | string; dark?: FileWithPreview | string; width?; height? }`.
  Color fields reuse the framework validator through `z.string().refine`.
- `app-tokens.ts` — the app-tier catalog (section 6.2).
- `catalog.ts` — merges core and app catalogs into ordered groups with i18n
  label keys under `customization.groups.*` and `customization.tokens.*`.
- `query-keys.ts` — `customizationKeys.config()`.
- `use-customization.ts` — `useBranding()` (query over `getBranding`, 404 → null),
  `useSaveBranding()` (mutation: upload logos → save config → invalidate query).
- `lib/branding-mapper.ts` — pure: form values → `IGRPBranding` (drops empty
  strings, keeps only changed tokens) and `IGRPBranding` → form defaults.
- `lib/live-preview.ts` — pure helpers that write `style.setProperty(name, value)`
  on `document.documentElement` for the active mode and remove every property
  they set; returns a dispose function.
- `components/`
  - `customization-screen.tsx` — page composition, `IGRPForm` with
    `react-hook-form`, unsaved-changes bar, save button, toast on result.
  - `mode-switch.tsx` — Light / Dark segmented control; switching also toggles the
    document `dark` class through next-themes so the preview shows the edited mode.
    The user's previous theme choice is remembered on mount and restored when the
    page unmounts, so editing never changes their preference.
  - `token-group.tsx` — collapsible group of `color-field`s; the first group
    (Brand) is open by default.
  - `color-field.tsx` — `IGRPFormField` with a swatch button (native
    `<input type="color">` for hex picking, converted to the stored string) and
    a text input that accepts any value the validator accepts. Placeholder is the
    default from the catalog. A clear button empties the field (per-field reset).
  - `logo-field.tsx` — one `FileUploadField` per variant, PNG/SVG/WebP/ICO,
    1 MB max, shows the current URL as preview. Favicon accepts PNG or ICO only.
  - `live-preview.tsx` — static composition rendered inside the page using the
    real design-system components: header strip with the header mark, a card
    with primary / secondary / destructive buttons, a form field with ring
    focus, status badges including the subtle variants, an app-tile row, a
    sidebar rail with an active item, and the wide logo on a login-like panel.
    Because tokens are applied to the document root, the preview and the real
    chrome around it update together.

### 10.3 Save flow

1. Validate the form (Zod). Any invalid field blocks save with inline errors.
2. For each logo slot whose value is a `File`, call `uploadPublicFile(file, { folder: "branding" })`
   and replace the value with the returned URL. Uploads run in parallel; one
   failure aborts the save with a toast naming the slot.
3. Build the `IGRPBranding` document with the mapper and serialize it.
4. Call `saveBranding(json)`; on success invalidate the query, show
   `customization.saved`, and `router.refresh()` so the hoisted style and header
   update without a full reload.
5. On a 403 show `customization.errors.forbidden`; on other errors show the
   API `detail` when present, else `errors.generic`.

### 10.4 Server actions (`src/actions/global-configuration.ts`)

- `getBranding(): Promise<ActionResult<IGRPBranding | null>>` — calls
  `client.globalConfiguration.getGlobalConfiguration("ORGANIZATION")`, maps 404
  to `{ success: true, data: null }`, parses with `igrpParseBranding`.
- `saveBranding(config: string): Promise<ActionResult<void>>` — re-validates
  size and parse, checks `igrpAuthorize(CUSTOMIZE_PERMISSION)`, posts
  `{ type: "ORGANIZATION", config }`, then calls `igrpInvalidateBranding()` and
  `revalidatePath("/", "layout")`.

### 10.5 i18n

New namespace `customization` in `pt.json` (complete), `en.json` and `fr.json`:
`meta`, `title`, `subtitle`, `modes.light|dark`, `groups.*`, `tokens.*` (one
label per token, 74 entries: 51 core plus 23 app tier), `logos.*`, `actions.save|clear`, `saved`,
`errors.forbidden|upload|invalidColor|invalidLength`. The folder is added to
`MIGRATED_FOLDERS` in the literal-strings guard.

### 10.6 UI rules

Horizon components first (`IGRPForm`, `IGRPFormField`, `IGRPInputText`,
`IGRPButton`, `IGRPCard`), `Badge` and semantic tokens for color, `gap-*` for
spacing, `size-N` for squares, `Separator` for dividers. The swatch is the one
place a raw color appears, and it is an inline `style={{ background: value }}`
on a bordered `size-8 rounded-md` button. The `no-raw-color` rule in
`scripts/check-ui-rules.mjs` matches only Tailwind palette classes such as
`bg-red-500`, so an inline style with a user value passes it.

## 11. Preset themes removed

- `framework-next-ui`: delete `templates/theme-selector`, `providers/active-theme`,
  `IGRP_DEFAULT_THEMES`, `IGRP_SCALED_THEMES`, `IGRP_ACTIVE_THEME_COOKIE`,
  `igrpActiveThemeClassName`, `useIGRPThemeConfig`; remove the selector from the
  header. The light / dark / system `IGRPTemplateModeSwitcher` stays.
- `framework-next`: `IGRPRootLayout` stops reading `activeThemeValue` and
  `isScaled`; `IGRPLayoutConfigArgs` keeps both fields for one release marked
  `@deprecated` and ignored, so templates compile.
- Application Center: `actions/igrp/layout.ts` drops `getTheme()`;
  `themes.css` stays deleted; `docs/TOKENS.md` is rewritten to describe the
  customization page and the two catalogs; the commented sidebar override block
  in `globals.css` is removed.
- Template (`templates/demo-v1`): same two edits as the Application Center.

## 12. Error handling matrix

| Situation | Behaviour |
| --- | --- |
| `IGRP_BRANDING_ENABLED` unset or not `true` | Defaults; no fetch, no stylesheet, no logo override; editor card inactive and route 404 in the Application Center. |
| API unreachable at render | Previous cached value or defaults; one log line; retry after 60 s. |
| 404 from GET | Defaults; cached as "none" for the TTL. |
| Stored JSON invalid or wrong version | Defaults; logged once per cache fill. |
| One token value invalid | That token dropped; the rest applied. |
| Logo URL fails to load | `IGRPTemplateImage` falls back to the app's static logo. |
| Favicon URL invalid | Metadata uses the app's static icon. |
| Save without permission | 403 → forbidden copy; page itself is already gated. |
| Upload fails | Save aborted, slot named in the toast, form state kept. |
| Config over 64 KB | Rejected client-side before upload; rejected server-side too. |
| Preview mode | No fetch, defaults, save returns an error toast. |

## 13. Testing

Framework (`vitest` in each package)

- `igrpParseBranding`: valid document, wrong version, oversized, invalid name,
  invalid value dropped while siblings survive, unknown keys ignored, URL rules.
- `igrpBrandingToCss`: output order stable, light-only `--radius`, empty maps emit nothing.
- `IGRPRootLayout` with `branding` omitted or `enabled: false`: no loader call,
  no style element, providers receive `null`; with `enabled: true` the loader
  is called once per request. `igrpBuildConfig` accepts and preserves the field.
- Loader cache: fresh hit, stale-while-revalidate returns old value, in-flight
  dedupe, 404 cached as null, error keeps old value and sets cooldown, no token
  never fetches, invalidate forces refetch.
- Header logo precedence and dark variant; `IGRPAuthForm` context override;
  `igrpBrandingMetadata` shapes.

Application Center (`src/__tests__/customization/`)

- `getBranding` maps 404 to null and parses valid config; `saveBranding` rejects
  oversized input and unauthorized callers before calling the SDK.
- Mapper: form → document drops empty fields and keeps only edited tokens;
  document → form round-trips.
- Live preview helper sets and clears exactly the properties it was given.
- Flag off: settings hub renders the customization card inactive and the
  route returns 404; flag on: card active and page renders for an authorized user.
- Screen: renders all groups from both catalogs, mode switch swaps values,
  invalid color blocks save, successful save calls upload then save in order.
- i18n: every catalog token has a label in `pt.json`; literal-strings guard passes.
- Gates: `pnpm check:ui`, `pnpm typecheck`, `pnpm test`.

## 14. Rollout

Implementation is two plans, one per repository, executed in this order.

1. Framework repo: implement sections 7.1 to 7.3 and 11, release
   `@igrp/framework-next-types`, `-next-ui`, `-next` together (next betas).
2. Application Center: bump the three packages, implement sections 7.4 and 10,
   run the gates, merge to `dev`.
3. Siblings: bump the packages, add `branding: { enabled: process.env.IGRP_BRANDING_ENABLED === "true" }`
   to their template config, add the `igrpBrandingMetadata` spread to their
   root metadata, and set `IGRP_BRANDING_ENABLED=true` in the environments that
   should carry the brand. A sibling that only bumps the packages keeps the
   defaults.
4. Backend request (separate ticket, not blocking): add
   `GET /api/m2m/global-configuration?type=` accepting client-credentials
   tokens, or add the existing GET path to `M2MTokenRejectionFilter`'s skip
   list. When shipped, `resolveBrandingToken` switches to the M2M provider and
   cold-start login pages are branded.

## 15. Risks and open points

- The 3-second fetch timeout on a cold process delays first paint once per TTL.
  Acceptable for v1; the M2M follow-up moves the fetch out of the user path.
- A sibling that defines its own local tokens with names colliding with the app
  tier will be recolored by the organization's values. Document the app-tier
  names in the framework README so new apps either reuse them intentionally or
  pick different names.
- React 19 style hoisting requires `href` and `precedence`; the CSS text must be
  byte-stable across server and client or React will warn. The serializer's
  fixed key order guarantees this.
- Removing the preset selector is a visible change for users who picked blue,
  green or amber. Their cookie is ignored and they see the organization brand.
