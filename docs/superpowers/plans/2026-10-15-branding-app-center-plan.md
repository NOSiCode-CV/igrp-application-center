# Organization Branding — Application Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give administrators a Brand editor at `/settings/customization` that saves the organization's colour Tokens and Logos to Access Management, and wire this app to apply the saved Brand through the framework when `IGRP_BRANDING_ENABLED=true`.

**Architecture:** The framework (`@igrp/framework-next`, `-next-ui`, `-next-types`) already loads, validates and applies the Brand. This app adds: the env flag in its config, the favicon metadata, two server actions (`getBranding`, `saveBranding`) over the SDK's global-configuration client, and a `src/features/branding/` editor (react-hook-form over a Zod factory, culori normalization to OKLCH, a preview panel scoped by inline custom properties). The preset-theme leftovers (`getTheme()`, the sidebar comment block) go.

**Tech Stack:** Next.js 15 App Router, React 19, next-intl 4, react-hook-form + Zod v4, TanStack Query 5, culori 4, Vitest 5 + Testing Library, IGRP design system.

**Spec:** [docs/superpowers/specs/2026-10-13-platform-branding-design.md](../specs/2026-10-13-platform-branding-design.md) — the App Center parts are §7.4, §8.4–8.7, §9 (editor rules), §10, §11 (App Center line) and §13 (App Center tests). Read it with this plan.

## Global Constraints

- Framework behaviour that is already shipped and differs from the spec text (this plan follows the code, Task 12 corrects the spec):
  - Brand CSS selectors are `html:root:not(.dark)` (light) and `html:root.dark` (dark), specificity (0,2,1).
  - `IGRPBrandingStyle` renders a plain in-body `<style data-igrp-branding>`, not a hoisted `href`/`precedence` resource.
  - The loader dedupes fetches per `baseUrl` and honours each `igrp_brand_v` value once, ignoring values older than 300 s or more than 30 s in the future.
- Framework exports used here (from the framework `dev` branch, commits `c9186314..95361f26`):
  - `@igrp/framework-next`: `igrpInvalidateBranding(baseUrl?: string): void`, `igrpBrandingMetadata(branding, fallbackIcon): Metadata["icons"]`, `igrpResolveRequestBranding(config): Promise<IGRPBranding | null>`, `BRAND_FRESHNESS_COOKIE = "igrp_brand_v"`, `igrpAuthorize`, `igrpAssertAuthorize`.
  - `@igrp/framework-next-ui`: `igrpParseBranding(raw): { branding: IGRPBranding | null; dropped: number }`, `IGRP_BRANDING_CORE_TOKENS: { name: string; group: IGRPBrandingTokenGroup }[]` (50 entries), `BRANDING_MAX_BYTES` (65536), `isSafeCssValue(value): boolean`, `useIGRPBranding(): IGRPBranding | null`, `IGRPForbidden`.
  - `@igrp/framework-next-types`: `IGRPBranding { version: 1; tokens: { light?: Record<string,string>; dark?: Record<string,string> }; logos: { header?, wide?, favicon? } }`, `IGRPBrandingLogoSlot { light: string; dark?: string; width?: number; height?: number }`, `IGRPBrandingMode = "light" | "dark"`, `IGRPBrandingTokenGroup = "brand" | "surface" | "text" | "status" | "sidebar" | "chart" | "other"`.
- Configuration type `ORGANIZATION` (`GlobalConfigurationType.ORGANIZATION` from `@igrp/platform-access-management-client-ts`). `CLUSTER` stays reserved.
- Permission `igrp.applications.customize`, constant `CUSTOMIZE_PERMISSION` in `src/lib/constants.ts`. No frontend permission catalog entry.
- `isBrandingEnabled()` is `IGRP_BRANDING_ENABLED === "true" && !isAuthBypass()`, defined once in `src/lib/utilities.ts`.
- Freshness cookie: `igrp_brand_v=<epoch ms>`, `httpOnly`, `sameSite: "lax"`, `path: "/"`, `maxAge: 300`.
- `saveBranding` order: checks → SDK POST → `igrpInvalidateBranding()` → set cookie → `revalidatePath("/", "layout")`. The client then calls `router.refresh()`.
- Editor colour rule: accepted for saving are hex, `rgb`, `hsl`, `oklch`, `oklab`, `lab`, `lch` and named colours. `color-mix`, `var()`, `transparent`, `currentColor` are rejected.
- Every saved colour is `oklch(L C H)` or `oklch(L C H / A)`, four decimals, from culori.
- Logo URLs must be on the `NEXT_PUBLIC_IGRP_MINIO_URL` origin. Favicon: PNG or ICO, at most 256 KB. Wide logo: natural size read on pick, stored as `width`/`height`.
- Document at most 64 KB (`BRANDING_MAX_BYTES`), checked again on the server.
- Upload folder `"branding"`; asset URL = `NEXT_PUBLIC_IGRP_MINIO_URL` + `/` + returned path.
- Translations `pt`, `en`, `fr` complete for the `branding` namespace. 73 token labels.
- UI rules (AGENTS.md): Horizon/DS components, `gap-*`, `size-N`, no `space-*`, no raw colour classes, no `border-t` dividers, no `dark:` colour overrides. The swatch's inline `style={{ background }}` is the only raw colour.
- Commit messages carry no `Co-Authored-By:` trailer. `pnpm lint` mutates files: run it before staging, then re-check the diff.
- Gates before claiming done: `pnpm check:ui`, `pnpm typecheck`, `pnpm test` (compare against the baseline recorded in Task 1).

## Review Focus

1. **An invalid value hidden from view.** A bad colour in the Mode not being edited, in a collapsed group, or a logo error while the Cores tab is open: Guardar must switch to the failing Mode/tab and open the group, not silently do nothing. Test in Task 10.
2. **Clearing a Token the saved Brand set.** The real page carries the saved Brand on `html:root`, so a preview that only sets draft values would inherit the saved value for a cleared field. The preview must show the Default. Test in Task 5 (`previewStyle` fills Defaults).
3. **MinIO base URL shape.** `NEXT_PUBLIC_IGRP_MINIO_URL` with or without a trailing slash and with a bucket path (`https://minio.example/igrp`). `new URL(path, base)` would drop the bucket; the asset URL must keep it. Test in Task 7.
4. **A stored Brand the editor would not have written.** Hand-written configs may hold `color-mix(...)` or a logo on another host. The editor must load, show the inline error on that field and block save until it is fixed. Test in Task 8.
5. **`FileUploadField` emits `onChange(null)` on mount.** That must not wipe the saved logo URL from the form. Test in Task 9.

---

## File Structure

| Path | Responsibility |
| --- | --- |
| `src/actions/igrp/layout.ts` | Drop `getTheme()`; `configLayout()` returns `{ session }` |
| `src/styles/globals.css`, `src/lib/fonts.ts`, `docs/DESIGN_SYSTEM.md` | Remove preset-theme leftovers |
| `src/lib/utilities.ts` | `isBrandingEnabled()` |
| `src/lib/constants.ts` | `CUSTOMIZE_PERMISSION` |
| `src/igrp.template.config.ts` | `branding: { enabled }` |
| `src/app/layout.tsx` | `generateMetadata` with `igrpBrandingMetadata` |
| `.env.example`, `docs/ENVIRONMENT.md` | Document the flag |
| `scripts/branding-defaults.mjs` (+ `.d.mts`) | Reads Token Defaults from the DS tokens and `app-center.css`; generates `token-defaults.ts` |
| `src/features/branding/app-tokens.ts` | App-tier catalog (23) |
| `src/features/branding/catalog.ts` | Both tiers as ordered groups with label keys |
| `src/features/branding/token-defaults.ts` | Generated Defaults per Mode |
| `src/features/branding/lib/color-normalize.ts` | culori: `isEditorColor`, `normalizeColor`, `toHex` |
| `src/features/branding/lib/branding-rules.ts` | Pure rules shared by editor and server: host, favicon, OKLCH shape, `checkSavableBranding` |
| `src/features/branding/lib/branding-mapper.ts` | Form values ↔ `IGRPBranding` |
| `src/features/branding/lib/live-preview.ts` | `previewStyle(draft, mode)` |
| `src/features/branding/lib/persist-branding.ts` | Upload logos, build the document, call `saveBranding` |
| `src/features/branding/lib/image-size.ts` | Natural size of a picked image |
| `src/features/branding/branding-schemas.ts` | Zod factory |
| `src/features/branding/query-keys.ts`, `use-branding.ts` | Query and mutation |
| `src/features/branding/components/*.tsx` | `mode-switch`, `color-field`, `token-group`, `logo-field`, `use-object-url`, `live-preview`, `branding-screen` |
| `src/actions/global-configuration.ts` | `getBranding`, `saveBranding` |
| `src/app/(igrp)/(home)/settings/customization/{page,loading,error,forbidden}.tsx` | Route |
| `src/app/(igrp)/(home)/settings/page.tsx` | Card active when enabled |
| `src/app/(invite)/brand-logo.tsx`, `src/app/(invite)/layout.tsx` | Wide logo on invite pages |
| `src/i18n/messages/{pt,en,fr}.json` | `branding` namespace |
| `src/__tests__/branding/*` | Tests |
| `docs/TOKENS.md`, spec | Docs |

---

### Task 1: Framework release and preset-theme removal

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml`
- Modify: `src/actions/igrp/layout.ts`
- Modify: `src/styles/globals.css:27-50`
- Modify: `src/lib/fonts.ts:8`
- Modify: `docs/DESIGN_SYSTEM.md:114`

**Interfaces:**
- Produces: `configLayout(): Promise<{ session }>` (no `activeThemeValue`/`isScaled`); installed framework packages exporting the symbols listed in Global Constraints.

- [ ] **Step 1: Record the test baseline before touching anything**

Run: `pnpm test 2>&1 | tail -40`
Write down the failing test files and counts. The last recorded baseline (2026-10-13) was 114 files / 729 tests with 7 pre-existing failures in `users` and `utilities`. Later tasks compare against what you record now.

- [ ] **Step 2: Confirm the framework release exists**

Run: `npm view @igrp/framework-next versions --json` and `npm view @igrp/framework-next-ui versions --json` and `npm view @igrp/framework-next-types versions --json`
Expected: a version newer than `0.2.0-beta.7` for `framework-next` and `framework-next-ui` (the pending patch changesets give `0.2.0-beta.8`), and newer than `0.2.0-beta.6` for `framework-next-types`.
If no newer version exists, STOP: the framework branding commits are unpushed and unpublished. Report that the framework release is a prerequisite and wait. Do not link the local framework checkout into this app.

- [ ] **Step 3: Install the release**

```bash
pnpm add @igrp/framework-next@0.2.0-beta.8 @igrp/framework-next-ui@0.2.0-beta.8
pnpm add -D @igrp/framework-next-types@0.2.0-beta.7
```
(Use the exact versions Step 2 found.) Then verify the exports are present:

Run: `grep -rl "igrpInvalidateBranding" node_modules/@igrp/framework-next/dist | head -1` and `grep -rl "IGRP_BRANDING_CORE_TOKENS" node_modules/@igrp/framework-next-ui/dist | head -1`
Expected: one path each.

The same release carries the framework i18n changesets (`igrpBuildConfig({ i18n })` is optional; this app passes no `i18n`, so behaviour is unchanged). Step 7 confirms.

- [ ] **Step 4: Remove `getTheme()`**

Replace `src/actions/igrp/layout.ts` from the `import { cookies }` line to the end with:

```ts
import { PREVIEW_SESSION_STUB, serverSession } from "@/lib/auth";
import { isAuthBypass } from "@/lib/utilities";

export async function configLayout() {
  // NOTE: This function is called from both the root layout (app/layout.tsx) and the
  // protected IGRP layout (app/(igrp)/layout.tsx). Auth enforcement is handled by
  // verifySession() in dal.ts, which is called only from the protected layout.
  // Do NOT add verifySession() here — it would redirect unauthenticated users on
  // the root layout, breaking the login page.
  //
  // When auth is bypassed (preview mode OR AUTH_PROVIDER=none), provide a mock
  // session so the layout doesn't kick the user to /login. The framework reads
  // session existence rather than the preview flag when deciding redirects.
  // Use the sanitized NextAuth Session — NOT auth.getAccessToken(), which
  // returns the full JWT (including the refresh token) and would leak it into
  // the client SessionProvider. serverSession() is redirect-free, so it stays
  // safe to call from the root layout (auth enforcement lives in verifySession()).
  const session = isAuthBypass() ? PREVIEW_SESSION_STUB : await serverSession();

  return { session };
}
```
Keep the four-line header comment and `import "server-only";` above it.

- [ ] **Step 5: Remove the other leftovers**

- `src/styles/globals.css`: delete the whole comment block that starts with `/*` + `── Sidebar appearance ──` and ends with the closing `*/` after the `.dark { … }` example (lines 27–50). Keep the blank line before `/* ── Workspace animations`.
- `src/lib/fonts.ts:8`: change `// Not preloaded: only the \`theme-mono\` theme and \`font-mono\` utilities use it,` to `// Not preloaded: only the \`font-mono\` utilities use it,`.
- `docs/DESIGN_SYSTEM.md:114`: replace the line `- Theme overrides: \`src/styles/themes.css\`` with `- Organization Brand (colours and logos): set in the Application Center at \`/settings/customization\`; see [TOKENS.md](TOKENS.md)`.

Run: `grep -rn "getTheme\|activeThemeValue\|isScaled\|igrp_active_theme\|themes.css\|theme-mono" src docs --include=*.ts --include=*.tsx --include=*.css --include=*.md | grep -v superpowers`
Expected: only `docs/TOKENS.md` hits (rewritten in Task 12).

- [ ] **Step 6: Typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 7: Test suite against the baseline**

Run: `pnpm test 2>&1 | tail -40`
Expected: the same failures as Step 1, no new ones.

- [ ] **Step 8: Commit**

```bash
pnpm lint
git add package.json pnpm-lock.yaml src/actions/igrp/layout.ts src/styles/globals.css src/lib/fonts.ts docs/DESIGN_SYSTEM.md
git commit -m "chore(branding): bump framework to the branding release and drop preset-theme leftovers"
```

---

### Task 2: Flag wiring, permission constant and favicon metadata

**Files:**
- Modify: `src/lib/utilities.ts` (after `isAuthBypass`, ~line 233)
- Modify: `src/lib/constants.ts` (after `AUDIT_VIEW_PERMISSION`)
- Modify: `src/igrp.template.config.ts:34`
- Modify: `src/app/layout.tsx`
- Modify: `.env.example:130`, `docs/ENVIRONMENT.md:34`
- Test: `src/__tests__/branding/is-branding-enabled.test.ts`

**Interfaces:**
- Produces: `isBrandingEnabled(): boolean` (`@/lib/utilities`), `CUSTOMIZE_PERMISSION = "igrp.applications.customize"` (`@/lib/constants`).

- [ ] **Step 1: Write the failing test**

```ts
// src/__tests__/branding/is-branding-enabled.test.ts
import { afterEach, describe, expect, it, vi } from "vitest";

import { isBrandingEnabled } from "@/lib/utilities";

afterEach(() => vi.unstubAllEnvs());

describe("isBrandingEnabled", () => {
  it("is true only when the flag is exactly 'true' and auth is not bypassed", () => {
    vi.stubEnv("IGRP_BRANDING_ENABLED", "true");
    vi.stubEnv("IGRP_PREVIEW_MODE", "false");
    vi.stubEnv("AUTH_PROVIDER", "igrp-auth");
    expect(isBrandingEnabled()).toBe(true);
  });

  it.each(["", "false", "TRUE", "1"])("is false for flag %j", (value) => {
    vi.stubEnv("IGRP_BRANDING_ENABLED", value);
    vi.stubEnv("IGRP_PREVIEW_MODE", "false");
    vi.stubEnv("AUTH_PROVIDER", "igrp-auth");
    expect(isBrandingEnabled()).toBe(false);
  });

  it("is false in preview mode", () => {
    vi.stubEnv("IGRP_BRANDING_ENABLED", "true");
    vi.stubEnv("IGRP_PREVIEW_MODE", "true");
    expect(isBrandingEnabled()).toBe(false);
  });

  it("is false when AUTH_PROVIDER=none", () => {
    vi.stubEnv("IGRP_BRANDING_ENABLED", "true");
    vi.stubEnv("IGRP_PREVIEW_MODE", "false");
    vi.stubEnv("AUTH_PROVIDER", "none");
    expect(isBrandingEnabled()).toBe(false);
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `pnpm vitest run src/__tests__/branding/is-branding-enabled.test.ts`
Expected: FAIL — `isBrandingEnabled` is not exported.

- [ ] **Step 3: Implement**

In `src/lib/utilities.ts`, right after `isAuthBypass()`:

```ts
/**
 * Whether this app shows the Brand editor (spec §7.4). Off when the flag is
 * not exactly "true" and whenever auth is bypassed, since no save path can run
 * without a real session.
 */
export function isBrandingEnabled(): boolean {
  return process.env.IGRP_BRANDING_ENABLED === "true" && !isAuthBypass();
}
```

In `src/lib/constants.ts`, after `AUDIT_VIEW_PERMISSION`:

```ts
/* Gates the Brand editor (/settings/customization and its actions). Access
   Management enforces it again on POST /api/global-configuration. */
export const CUSTOMIZE_PERMISSION = "igrp.applications.customize";
```

In `src/igrp.template.config.ts`, after `syncAccess: …,`:

```ts
    branding: { enabled: process.env.IGRP_BRANDING_ENABLED === "true" },
```

In `src/app/layout.tsx`, replace the `IGRPRootLayout` import and the static `metadata` export:

```tsx
import {
  IGRPRootLayout,
  igrpBrandingMetadata,
  igrpResolveRequestBranding,
} from "@igrp/framework-next";
```

```tsx
// The favicon follows the organization Brand when `IGRP_BRANDING_ENABLED=true`;
// otherwise (and on any failure) the app's own icon.
export async function generateMetadata(): Promise<Metadata> {
  const config = await createConfig(await getLayoutConfig());
  const branding = await igrpResolveRequestBranding(config);
  return {
    title: "IGRP | Centro de Aplicações",
    description: "IGRP | Centro de Aplicações",
    icons: igrpBrandingMetadata(branding, `${basePath}/logo-no-text.png`),
  };
}
```

`.env.example`, after `IGRP_SYNC_ACCESS=` and its blank line:

```
# Load the organization Brand (colours and logos) from Access Management at
# render time, and enable the Brand editor at /settings/customization.
# Empty or false keeps the design-system defaults with no request.
IGRP_BRANDING_ENABLED=

```

`docs/ENVIRONMENT.md`, after the `IGRP_SYNC_ACCESS` row:

```
| `IGRP_BRANDING_ENABLED` | Load the organization Brand (colours and logos) from Access Management at render time and enable the Brand editor. Ignored when auth is bypassed | `false` |
```

- [ ] **Step 4: Run the test and typecheck**

Run: `pnpm vitest run src/__tests__/branding/is-branding-enabled.test.ts && pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
pnpm lint
git add src/lib/utilities.ts src/lib/constants.ts src/igrp.template.config.ts src/app/layout.tsx .env.example docs/ENVIRONMENT.md src/__tests__/branding/is-branding-enabled.test.ts
git commit -m "feat(branding): wire IGRP_BRANDING_ENABLED, the customize permission and the brand favicon"
```

---

### Task 3: Colour normalization and shared save rules

**Files:**
- Modify: `package.json` (add `culori`, `@types/culori`)
- Create: `src/features/branding/lib/color-normalize.ts`
- Create: `src/features/branding/lib/branding-rules.ts`
- Test: `src/__tests__/branding/color-normalize.test.ts`, `src/__tests__/branding/branding-rules.test.ts`

**Interfaces:**
- Produces:
  - `isEditorColor(value: string): boolean`
  - `normalizeColor(value: string): string | null`
  - `toHex(value: string): string` (`#rrggbb`, `#000000` when not parseable)
  - `MAX_FAVICON_BYTES = 262144`, `FAVICON_ACCEPT: string`
  - `minioBaseUrl(): string`
  - `isOnMinioHost(url: string, minioUrl: string): boolean`
  - `isFaviconFile(file: File): boolean`
  - `isNormalizedOklch(value: string): boolean`
  - `checkSavableBranding(raw: string, minioUrl: string): IGRPBranding | null`

- [ ] **Step 1: Add the dependency**

```bash
pnpm add culori@4.0.2
pnpm add -D @types/culori@4.0.1
```

- [ ] **Step 2: Write the failing tests**

```ts
// src/__tests__/branding/color-normalize.test.ts
import { describe, expect, it } from "vitest";

import {
  isEditorColor,
  normalizeColor,
  toHex,
} from "@/features/branding/lib/color-normalize";

describe("normalizeColor", () => {
  it.each([
    ["#ff0000", "oklch(0.628 0.2577 29.2339)"],
    ["#fff", "oklch(1 0 0)"],
    ["rgb(0 128 255)", "oklch(0.6152 0.2108 256.099)"],
    ["rgba(0, 0, 0, 0.5)", "oklch(0 0 0 / 0.5)"],
    ["hsl(210 50% 40%)", "oklch(0.4993 0.0987 250.4331)"],
    ["rebeccapurple", "oklch(0.4403 0.1603 303.373)"],
    ["lab(50% 40 30)", "oklch(0.5792 0.1323 31.5089)"],
    ["  oklch(0.45 0.18 250)  ", "oklch(0.45 0.18 250)"],
  ])("normalizes %j to %j", (input, expected) => {
    expect(normalizeColor(input)).toBe(expected);
  });

  it("is idempotent on its own output", () => {
    const once = normalizeColor("#3366cc");
    expect(once).not.toBeNull();
    expect(normalizeColor(once as string)).toBe(once);
  });

  it.each([
    "color-mix(in oklch, red, blue)",
    "var(--primary)",
    "rgb(var(--x) 0 0)",
    "transparent",
    "currentColor",
    "notacolor",
    "inherit",
    "red; background: url(x)",
    "",
  ])("rejects %j", (input) => {
    expect(isEditorColor(input)).toBe(false);
    expect(normalizeColor(input)).toBeNull();
  });
});

describe("toHex", () => {
  it("converts any editor colour to #rrggbb", () => {
    expect(toHex("oklch(0.628 0.2577 29.2339)")).toBe("#ff0000");
  });
  it("falls back to black for values it cannot parse", () => {
    expect(toHex("color-mix(in oklch, red, blue)")).toBe("#000000");
  });
});
```

```ts
// src/__tests__/branding/branding-rules.test.ts
import { describe, expect, it } from "vitest";

import {
  checkSavableBranding,
  isFaviconFile,
  isNormalizedOklch,
  isOnMinioHost,
} from "@/features/branding/lib/branding-rules";

const MINIO = "https://minio.example/igrp";
const doc = (over: Record<string, unknown> = {}) =>
  JSON.stringify({
    version: 1,
    tokens: { light: { "--primary": "oklch(0.45 0.18 250)" }, dark: {} },
    logos: {
      header: { light: "https://minio.example/igrp/public/branding/a/mark.png" },
    },
    ...over,
  });

describe("isOnMinioHost", () => {
  it("accepts URLs on the MinIO origin", () => {
    expect(isOnMinioHost(`${MINIO}/public/x.png`, MINIO)).toBe(true);
  });
  it.each([
    "https://evil.example/igrp/x.png",
    "http://minio.example/igrp/x.png",
    "https://minio.example:8443/igrp/x.png",
    "not a url",
  ])("rejects %j", (url) => {
    expect(isOnMinioHost(url, MINIO)).toBe(false);
  });
  it("rejects everything when the MinIO URL is unset", () => {
    expect(isOnMinioHost(`${MINIO}/x.png`, "")).toBe(false);
  });
});

describe("isFaviconFile", () => {
  const file = (type: string, size: number, name = "f") =>
    new File([new Uint8Array(size)], name, { type });
  it("accepts PNG and ICO up to 256 KB", () => {
    expect(isFaviconFile(file("image/png", 256 * 1024))).toBe(true);
    expect(isFaviconFile(file("image/x-icon", 10))).toBe(true);
    expect(isFaviconFile(file("image/vnd.microsoft.icon", 10))).toBe(true);
    expect(isFaviconFile(file("", 10, "favicon.ico"))).toBe(true);
  });
  it("rejects other types and larger files", () => {
    expect(isFaviconFile(file("image/svg+xml", 10))).toBe(false);
    expect(isFaviconFile(file("image/png", 256 * 1024 + 1))).toBe(false);
    expect(isFaviconFile(file("text/plain", 10, "favicon.ico"))).toBe(false);
  });
});

describe("isNormalizedOklch", () => {
  it.each(["oklch(0.45 0.18 250)", "oklch(1 0 0)", "oklch(0 0 0 / 0.5)"])(
    "accepts %j",
    (v) => expect(isNormalizedOklch(v)).toBe(true),
  );
  it.each(["#fff", "rgb(0 0 0)", "oklch(0.4 0.1 250) ", "oklch(50% 0.1 250)"])(
    "rejects %j",
    (v) => expect(isNormalizedOklch(v)).toBe(false),
  );
});

describe("checkSavableBranding", () => {
  it("returns the cleaned document for a valid input", () => {
    expect(checkSavableBranding(doc(), MINIO)?.tokens.light).toEqual({
      "--primary": "oklch(0.45 0.18 250)",
    });
  });
  it("rejects documents over 64 KB", () => {
    expect(checkSavableBranding(doc({ pad: "x".repeat(65 * 1024) }), MINIO)).toBeNull();
  });
  it("rejects unparseable JSON and wrong versions", () => {
    expect(checkSavableBranding("{", MINIO)).toBeNull();
    expect(checkSavableBranding(doc({ version: 2 }), MINIO)).toBeNull();
  });
  it("rejects colours the editor would not have saved", () => {
    const tokens = { light: { "--primary": "color-mix(in oklch, red, blue)" } };
    expect(checkSavableBranding(doc({ tokens }), MINIO)).toBeNull();
    const hex = { light: { "--primary": "#ff0000" } };
    expect(checkSavableBranding(doc({ tokens: hex }), MINIO)).toBeNull();
  });
  it("rejects a document with any field the framework drops", () => {
    const tokens = { light: { "--Primary": "oklch(0.45 0.18 250)" } };
    expect(checkSavableBranding(doc({ tokens }), MINIO)).toBeNull();
  });
  it("rejects logos on a foreign host", () => {
    const logos = { wide: { light: "https://evil.example/logo.svg" } };
    expect(checkSavableBranding(doc({ logos }), MINIO)).toBeNull();
  });
  it("drops unknown top-level keys from the returned document", () => {
    expect(checkSavableBranding(doc({ extra: 1 }), MINIO)).not.toHaveProperty("extra");
  });
});
```

- [ ] **Step 3: Run them to see them fail**

Run: `pnpm vitest run src/__tests__/branding/color-normalize.test.ts src/__tests__/branding/branding-rules.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 4: Implement**

```ts
// src/features/branding/lib/color-normalize.ts
import { converter, formatHex, parse } from "culori";

import { isSafeCssValue } from "@igrp/framework-next-ui";

/** Concrete colour syntaxes the editor saves (spec §9, editor rules). */
const EDITOR_SYNTAX = /^(#[0-9a-f]{3,8}|(rgba?|hsla?|oklch|oklab|lab|lch)\(.*\)|[a-z]+)$/i;
/* Keywords culori parses but that have no single OKLCH value worth storing. */
const NO_SINGLE_VALUE = new Set(["transparent", "currentcolor"]);

const toOklch = converter("oklch");
const round = (n: number | undefined) => Number((n ?? 0).toFixed(4));

/** A value the editor accepts for saving: concrete, safe, and parseable by culori. */
export function isEditorColor(value: string): boolean {
  const v = value.trim();
  return (
    isSafeCssValue(v) &&
    EDITOR_SYNTAX.test(v) &&
    !NO_SINGLE_VALUE.has(v.toLowerCase()) &&
    parse(v) !== undefined
  );
}

/** `oklch(L C H)` or `oklch(L C H / A)` with four decimals, or `null` when not an editor colour. */
export function normalizeColor(value: string): string | null {
  if (!isEditorColor(value)) return null;
  const color = toOklch(parse(value.trim()));
  if (!color) return null;
  const alpha = color.alpha ?? 1;
  const base = `${round(color.l)} ${round(color.c)} ${round(color.h)}`;
  return alpha < 1 ? `oklch(${base} / ${round(alpha)})` : `oklch(${base})`;
}

/** Hex for the native colour input, which only takes `#rrggbb`. */
export function toHex(value: string): string {
  const color = parse(value.trim());
  return color ? formatHex(color) : "#000000";
}
```

```ts
// src/features/branding/lib/branding-rules.ts
import {
  BRANDING_MAX_BYTES,
  igrpParseBranding,
} from "@igrp/framework-next-ui";
import type { IGRPBranding } from "@igrp/framework-next-types";

/* Pure rules shared by the editor (feedback) and saveBranding (enforcement). */

export const MAX_FAVICON_BYTES = 256 * 1024;
export const FAVICON_ACCEPT =
  "image/png,image/x-icon,image/vnd.microsoft.icon,.ico";

const ICO_TYPES = new Set(["image/x-icon", "image/vnd.microsoft.icon"]);
const NORMALIZED_OKLCH =
  /^oklch\(\d+(\.\d+)? \d+(\.\d+)? \d+(\.\d+)?( \/ \d+(\.\d+)?)?\)$/;

/** Read at call time so tests can stub it; Next inlines it in the client bundle. */
export function minioBaseUrl(): string {
  return process.env.NEXT_PUBLIC_IGRP_MINIO_URL ?? "";
}

/** Same origin (scheme, host, port) as the MinIO base, so only our own uploads can be saved. */
export function isOnMinioHost(url: string, minioUrl: string): boolean {
  try {
    return new URL(url).origin === new URL(minioUrl).origin;
  } catch {
    return false;
  }
}

/** PNG or ICO, at most 256 KB. Some browsers report ICO with an empty type. */
export function isFaviconFile(file: File): boolean {
  const ico =
    ICO_TYPES.has(file.type) || (file.type === "" && /\.ico$/i.test(file.name));
  return file.size <= MAX_FAVICON_BYTES && (file.type === "image/png" || ico);
}

export function isNormalizedOklch(value: string): boolean {
  return NORMALIZED_OKLCH.test(value);
}

/**
 * The cleaned Brand when `raw` is something the editor could have produced:
 * within 64 KB, parsed by the framework with nothing dropped, every colour in
 * normalized OKLCH, every logo on the MinIO origin. Otherwise `null`.
 */
export function checkSavableBranding(
  raw: string,
  minioUrl: string,
): IGRPBranding | null {
  if (new TextEncoder().encode(raw).byteLength > BRANDING_MAX_BYTES) return null;
  const { branding, dropped } = igrpParseBranding(raw);
  if (!branding || dropped > 0) return null;

  const colours = [
    ...Object.values(branding.tokens.light ?? {}),
    ...Object.values(branding.tokens.dark ?? {}),
  ];
  if (!colours.every(isNormalizedOklch)) return null;

  const urls = Object.values(branding.logos).flatMap((slot) =>
    slot ? [slot.light, ...(slot.dark ? [slot.dark] : [])] : [],
  );
  if (!urls.every((url) => isOnMinioHost(url, minioUrl))) return null;

  return branding;
}
```

- [ ] **Step 5: Run the tests**

Run: `pnpm vitest run src/__tests__/branding/color-normalize.test.ts src/__tests__/branding/branding-rules.test.ts`
Expected: PASS. If a culori value differs in the last decimal, the culori version is not 4.0.2 — pin it, do not edit the expectations.

- [ ] **Step 6: Commit**

```bash
pnpm lint
git add package.json pnpm-lock.yaml src/features/branding/lib/color-normalize.ts src/features/branding/lib/branding-rules.ts src/__tests__/branding/color-normalize.test.ts src/__tests__/branding/branding-rules.test.ts
git commit -m "feat(branding): add OKLCH normalization and the shared brand save rules"
```

---

### Task 4: Token catalog, Defaults and the `branding` messages

**Files:**
- Create: `scripts/branding-defaults.mjs`, `scripts/branding-defaults.d.mts`
- Create: `src/features/branding/app-tokens.ts`, `src/features/branding/catalog.ts`
- Create (generated): `src/features/branding/token-defaults.ts`
- Modify: `package.json` (script `branding:defaults`)
- Modify: `src/i18n/messages/pt.json`, `en.json`, `fr.json` (new top-level `branding`; `settings.items.customization.description`)
- Test: `src/__tests__/branding/catalog.test.ts`

**Interfaces:**
- Produces:
  - `APP_BRANDING_TOKENS: { name: string; group: AppTokenGroup }[]`, `type AppTokenGroup = "subtle" | "tiles" | "appOther"`
  - `type BrandingGroupKey = IGRPBrandingTokenGroup | AppTokenGroup`
  - `type BrandingTokenLabelKey = keyof (typeof pt)["branding"]["tokens"]`
  - `type CatalogToken = { name: string; labelKey: BrandingTokenLabelKey }`
  - `type CatalogGroup = { key: BrandingGroupKey; tokens: CatalogToken[] }`
  - `BRANDING_GROUPS: CatalogGroup[]` (display order), `BRANDING_TOKEN_NAMES: string[]` (73), `labelKeyOf(name: string): string`
  - `BRANDING_DEFAULTS: Record<"light" | "dark", Record<string, string>>`
  - Every message key later tasks use (listed in Step 5).

- [ ] **Step 1: Write the failing test**

```ts
// src/__tests__/branding/catalog.test.ts
import { describe, expect, it } from "vitest";

import {
  BRANDING_GROUPS,
  BRANDING_TOKEN_NAMES,
  labelKeyOf,
} from "@/features/branding/catalog";
import { BRANDING_DEFAULTS } from "@/features/branding/token-defaults";
import en from "@/i18n/messages/en.json";
import fr from "@/i18n/messages/fr.json";
import pt from "@/i18n/messages/pt.json";

import { readBrandingDefaults } from "../../../scripts/branding-defaults.mjs";

const keysDeep = (value: unknown, prefix = ""): string[] =>
  typeof value === "object" && value !== null
    ? Object.entries(value).flatMap(([k, v]) => keysDeep(v, `${prefix}${k}.`))
    : [prefix.slice(0, -1)];

describe("branding catalog", () => {
  it("holds 73 unique Tokens: 50 core and 23 app-tier", () => {
    expect(BRANDING_TOKEN_NAMES).toHaveLength(73);
    expect(new Set(BRANDING_TOKEN_NAMES).size).toBe(73);
    expect(BRANDING_TOKEN_NAMES).not.toContain("--radius");
  });

  it("derives camelCase label keys", () => {
    expect(labelKeyOf("--app-tile-1-foreground")).toBe("appTile1Foreground");
    expect(labelKeyOf("--chart-1")).toBe("chart1");
    expect(labelKeyOf("--primary")).toBe("primary");
  });

  it("has a Default for every Token in both Modes", () => {
    for (const mode of ["light", "dark"] as const) {
      expect(Object.keys(BRANDING_DEFAULTS[mode]).sort()).toEqual(
        [...BRANDING_TOKEN_NAMES].sort(),
      );
    }
  });

  it("keeps the generated Defaults in sync with the CSS", () => {
    expect(BRANDING_DEFAULTS).toEqual(readBrandingDefaults());
  });
});

describe("branding messages", () => {
  it.each([
    ["pt", pt],
    ["en", en],
    ["fr", fr],
  ])("%s labels every group and Token", (_, messages) => {
    for (const group of BRANDING_GROUPS) {
      expect(messages.branding.groups).toHaveProperty(group.key);
      for (const token of group.tokens) {
        expect(messages.branding.tokens).toHaveProperty(token.labelKey);
      }
    }
  });

  it("en and fr carry exactly the pt keys", () => {
    const ptKeys = keysDeep(pt.branding).sort();
    expect(keysDeep(en.branding).sort()).toEqual(ptKeys);
    expect(keysDeep(fr.branding).sort()).toEqual(ptKeys);
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `pnpm vitest run src/__tests__/branding/catalog.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Write the catalogs**

```ts
// src/features/branding/app-tokens.ts
/** Tokens only the Application Center uses (spec §6.2). Defaults live in app-center.css. */
export type AppTokenGroup = "subtle" | "tiles" | "appOther";

const GROUPS: Record<AppTokenGroup, string[]> = {
  subtle: [
    "--primary-subtle",
    "--primary-subtle-foreground",
    "--success-subtle",
    "--success-subtle-foreground",
    "--warning-subtle",
    "--warning-subtle-foreground",
    "--info-subtle",
    "--info-subtle-foreground",
    "--destructive-subtle",
    "--destructive-subtle-foreground",
  ],
  tiles: [1, 2, 3, 4, 5].flatMap((n) => [
    `--app-tile-${n}`,
    `--app-tile-${n}-foreground`,
  ]),
  appOther: ["--favorite", "--scrollbar-thumb", "--scrollbar-thumb-hover"],
};

export const APP_BRANDING_TOKENS = Object.entries(GROUPS).flatMap(
  ([group, names]) => names.map((name) => ({ name, group: group as AppTokenGroup })),
);
```

```ts
// src/features/branding/catalog.ts
import { IGRP_BRANDING_CORE_TOKENS } from "@igrp/framework-next-ui";
import type { IGRPBrandingTokenGroup } from "@igrp/framework-next-types";

import type pt from "@/i18n/messages/pt.json";

import { APP_BRANDING_TOKENS, type AppTokenGroup } from "./app-tokens";

export type BrandingGroupKey = IGRPBrandingTokenGroup | AppTokenGroup;
export type BrandingTokenLabelKey = keyof (typeof pt)["branding"]["tokens"];
export type CatalogToken = { name: string; labelKey: BrandingTokenLabelKey };
export type CatalogGroup = { key: BrandingGroupKey; tokens: CatalogToken[] };

/* Display order: brand first (open by default), app-tier groups next to the
   core group they extend. */
const GROUP_ORDER: BrandingGroupKey[] = [
  "brand",
  "surface",
  "text",
  "status",
  "subtle",
  "sidebar",
  "chart",
  "tiles",
  "other",
  "appOther",
];

/** `--app-tile-1-foreground` → `appTile1Foreground` (messages use camelCase keys). */
export function labelKeyOf(name: string): string {
  return name.slice(2).replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}

const ALL = [...IGRP_BRANDING_CORE_TOKENS, ...APP_BRANDING_TOKENS];

// The catalog test proves every labelKey exists in the messages.
export const BRANDING_GROUPS: CatalogGroup[] = GROUP_ORDER.map((key) => ({
  key,
  tokens: ALL.filter((t) => t.group === key).map((t) => ({
    name: t.name,
    labelKey: labelKeyOf(t.name) as BrandingTokenLabelKey,
  })),
}));

export const BRANDING_TOKEN_NAMES = ALL.map((t) => t.name);
```

- [ ] **Step 4: Write the Defaults generator and generate**

```js
// scripts/branding-defaults.mjs
// Reads the Token Defaults the Brand editor shows: the design-system tokens,
// overlaid by this app's app-center.css (it is imported after them, so its
// :root/.dark values win, e.g. --ring). Run `pnpm branding:defaults` after a
// design-system bump; the catalog test fails while the generated file is stale.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SOURCES = [
  "node_modules/@igrp/igrp-framework-react-design-system/dist/tokens.css",
  "src/styles/app-center.css",
];
const OUT = "src/features/branding/token-defaults.ts";

function declarations(css, selector) {
  const out = {};
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const re = new RegExp(`(?:^|\\n)\\s*${selector}\\s*\\{([^}]*)\\}`, "g");
  for (const match of clean.matchAll(re)) {
    for (const decl of match[1].split(";")) {
      const i = decl.indexOf(":");
      const name = decl.slice(0, i).trim();
      if (name.startsWith("--") && name !== "--radius") {
        out[name] = decl.slice(i + 1).trim();
      }
    }
  }
  return out;
}

export function readBrandingDefaults(root = process.cwd()) {
  const defaults = { light: {}, dark: {} };
  for (const file of SOURCES) {
    const css = readFileSync(path.join(root, file), "utf8");
    Object.assign(defaults.light, declarations(css, ":root"));
    Object.assign(defaults.dark, declarations(css, "\\.dark"));
  }
  return defaults;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const d = readBrandingDefaults();
  const body = (map) =>
    Object.keys(map)
      .sort()
      .map((k) => `    "${k}": "${map[k]}",`)
      .join("\n");
  writeFileSync(
    OUT,
    `// Generated by scripts/branding-defaults.mjs (pnpm branding:defaults). Do not edit.
// The value each Token has when the Brand leaves it unset, per Mode.
export const BRANDING_DEFAULTS: Record<"light" | "dark", Record<string, string>> = {
  light: {
${body(d.light)}
  },
  dark: {
${body(d.dark)}
  },
};
`,
  );
}
```

```ts
// scripts/branding-defaults.d.mts
export function readBrandingDefaults(root?: string): {
  light: Record<string, string>;
  dark: Record<string, string>;
};
```

In `package.json` `scripts`, add `"branding:defaults": "node scripts/branding-defaults.mjs",`.

Run: `pnpm branding:defaults`
Expected: `src/features/branding/token-defaults.ts` exists with 73 keys per Mode (spot-check: `"--ring": "oklch(0.58 0.06 256.788)"` in light, from `app-center.css`; `"--sidebar-active": "color-mix(in oklab, var(--sidebar-primary) 10%, transparent)"` in light).

- [ ] **Step 5: Add the `branding` messages**

Add a top-level `"branding"` object to each file (after `"menus"`). These are all the keys every later task uses.

`src/i18n/messages/pt.json`:

```json
"branding": {
  "meta": {
    "title": "Personalização",
    "description": "Defina as cores e os logótipos da organização."
  },
  "title": "Personalização",
  "subtitle": "As cores e os logótipos aplicam-se a todas as aplicações IGRP com a personalização ativa.",
  "tabs": { "colors": "Cores", "logos": "Logótipos" },
  "modes": { "label": "Editar o modo escuro", "light": "Claro", "dark": "Escuro" },
  "groups": {
    "brand": "Marca",
    "surface": "Superfícies",
    "text": "Texto",
    "status": "Estados",
    "subtle": "Estados suaves",
    "sidebar": "Barra lateral",
    "chart": "Gráficos",
    "tiles": "Mosaicos de aplicações",
    "other": "Outros",
    "appOther": "Outros do Centro de Aplicações"
  },
  "tokens": {
    "primary": "Primária",
    "primaryForeground": "Texto sobre primária",
    "secondary": "Secundária",
    "secondaryForeground": "Texto sobre secundária",
    "accent": "Destaque",
    "accentForeground": "Texto sobre destaque",
    "ring": "Anel de foco",
    "background": "Fundo",
    "card": "Cartão",
    "cardForeground": "Texto do cartão",
    "popover": "Painel flutuante",
    "popoverForeground": "Texto do painel flutuante",
    "muted": "Atenuado",
    "border": "Contorno",
    "input": "Contorno dos campos",
    "foreground": "Texto",
    "mutedForeground": "Texto atenuado",
    "destructive": "Destrutivo",
    "destructiveForeground": "Texto sobre destrutivo",
    "success": "Sucesso",
    "successForeground": "Texto sobre sucesso",
    "warning": "Aviso",
    "warningForeground": "Texto sobre aviso",
    "info": "Informação",
    "infoForeground": "Texto sobre informação",
    "indigo": "Índigo",
    "indigoForeground": "Texto sobre índigo",
    "highlight": "Realce",
    "highlightForeground": "Texto sobre realce",
    "sidebar": "Fundo da barra lateral",
    "sidebarForeground": "Texto da barra lateral",
    "sidebarPrimary": "Primária da barra lateral",
    "sidebarPrimaryForeground": "Texto sobre primária da barra lateral",
    "sidebarAccent": "Destaque da barra lateral",
    "sidebarAccentForeground": "Texto sobre destaque da barra lateral",
    "sidebarActive": "Item ativo",
    "sidebarActiveForeground": "Texto do item ativo",
    "sidebarBorder": "Contorno da barra lateral",
    "sidebarRing": "Anel de foco da barra lateral",
    "chart1": "Gráfico 1",
    "chart2": "Gráfico 2",
    "chart3": "Gráfico 3",
    "chart4": "Gráfico 4",
    "chart5": "Gráfico 5",
    "chart6": "Gráfico 6",
    "chart7": "Gráfico 7",
    "chart8": "Gráfico 8",
    "ringInvalid": "Anel de campo inválido",
    "processCompleted": "Processo concluído",
    "processActive": "Processo ativo",
    "primarySubtle": "Primária suave",
    "primarySubtleForeground": "Texto sobre primária suave",
    "successSubtle": "Sucesso suave",
    "successSubtleForeground": "Texto sobre sucesso suave",
    "warningSubtle": "Aviso suave",
    "warningSubtleForeground": "Texto sobre aviso suave",
    "infoSubtle": "Informação suave",
    "infoSubtleForeground": "Texto sobre informação suave",
    "destructiveSubtle": "Destrutivo suave",
    "destructiveSubtleForeground": "Texto sobre destrutivo suave",
    "appTile1": "Mosaico 1",
    "appTile1Foreground": "Texto do mosaico 1",
    "appTile2": "Mosaico 2",
    "appTile2Foreground": "Texto do mosaico 2",
    "appTile3": "Mosaico 3",
    "appTile3Foreground": "Texto do mosaico 3",
    "appTile4": "Mosaico 4",
    "appTile4Foreground": "Texto do mosaico 4",
    "appTile5": "Mosaico 5",
    "appTile5Foreground": "Texto do mosaico 5",
    "favorite": "Favorito",
    "scrollbarThumb": "Barra de deslocamento",
    "scrollbarThumbHover": "Barra de deslocamento ao passar o cursor"
  },
  "logos": {
    "header": {
      "title": "Marca do cabeçalho",
      "description": "Imagem quadrada mostrada no cabeçalho de todas as aplicações."
    },
    "wide": {
      "title": "Logótipo horizontal",
      "description": "Mostrado no ecrã de entrada e nos convites, com altura máxima de 80 px."
    },
    "favicon": {
      "title": "Ícone do separador",
      "description": "PNG ou ICO, até 256 KB."
    },
    "light": "Versão clara",
    "dark": "Versão escura (opcional)",
    "pick": "Selecionar imagem",
    "drop": "Arraste a imagem para aqui",
    "current": "Imagem atual",
    "remove": "Remover"
  },
  "preview": {
    "title": "Pré-visualização",
    "appName": "Centro de Aplicações",
    "cardTitle": "Cartão de exemplo",
    "cardBody": "Texto atenuado para descrições.",
    "primary": "Primário",
    "secondary": "Secundário",
    "destructive": "Eliminar",
    "fieldLabel": "Campo com foco",
    "fieldValue": "Valor",
    "success": "Ativo",
    "warning": "Pendente",
    "info": "Novo",
    "danger": "Erro",
    "menuActive": "Página atual",
    "menuItem": "Outra página",
    "login": "Entrar"
  },
  "actions": {
    "save": "Guardar",
    "saving": "A guardar…",
    "discard": "Descartar",
    "reset": "Repor predefinições",
    "clear": "Repor a predefinição de {token}",
    "pickColor": "Escolher a cor de {token}"
  },
  "unsaved": "Tem alterações por guardar.",
  "saved": "Personalização guardada.",
  "logoAlt": "Logótipo da organização",
  "forbidden": {
    "description": "Precisa da permissão de personalização da plataforma. As permissões vêm do seu perfil ativo."
  },
  "errors": {
    "load": "Não foi possível carregar a personalização.",
    "saveTitle": "Não foi possível guardar.",
    "forbidden": "Não tem permissão para personalizar a plataforma.",
    "upload": "Não foi possível carregar a imagem: {slot}.",
    "invalidColor": "Use uma cor concreta: hex, rgb, hsl, oklch, oklab, lab, lch ou um nome de cor.",
    "logoHost": "Só são aceites imagens carregadas aqui.",
    "favicon": "Use um PNG ou ICO até 256 KB.",
    "darkWithoutLight": "Adicione a versão clara antes da escura.",
    "invalid": "A personalização tem valores inválidos. Reveja os campos e tente novamente.",
    "generic": "Tente novamente. Se o problema persistir, contacte o suporte."
  }
}
```

`src/i18n/messages/en.json` (same keys):

```json
"branding": {
  "meta": {
    "title": "Customization",
    "description": "Set the organization's colours and logos."
  },
  "title": "Customization",
  "subtitle": "Colours and logos apply to every IGRP app with customization turned on.",
  "tabs": { "colors": "Colours", "logos": "Logos" },
  "modes": { "label": "Edit dark mode", "light": "Light", "dark": "Dark" },
  "groups": {
    "brand": "Brand",
    "surface": "Surfaces",
    "text": "Text",
    "status": "Status",
    "subtle": "Subtle status",
    "sidebar": "Sidebar",
    "chart": "Charts",
    "tiles": "App tiles",
    "other": "Other",
    "appOther": "Other Application Center"
  },
  "tokens": {
    "primary": "Primary",
    "primaryForeground": "Text on primary",
    "secondary": "Secondary",
    "secondaryForeground": "Text on secondary",
    "accent": "Accent",
    "accentForeground": "Text on accent",
    "ring": "Focus ring",
    "background": "Background",
    "card": "Card",
    "cardForeground": "Card text",
    "popover": "Popover",
    "popoverForeground": "Popover text",
    "muted": "Muted",
    "border": "Border",
    "input": "Field border",
    "foreground": "Text",
    "mutedForeground": "Muted text",
    "destructive": "Destructive",
    "destructiveForeground": "Text on destructive",
    "success": "Success",
    "successForeground": "Text on success",
    "warning": "Warning",
    "warningForeground": "Text on warning",
    "info": "Info",
    "infoForeground": "Text on info",
    "indigo": "Indigo",
    "indigoForeground": "Text on indigo",
    "highlight": "Highlight",
    "highlightForeground": "Text on highlight",
    "sidebar": "Sidebar background",
    "sidebarForeground": "Sidebar text",
    "sidebarPrimary": "Sidebar primary",
    "sidebarPrimaryForeground": "Text on sidebar primary",
    "sidebarAccent": "Sidebar accent",
    "sidebarAccentForeground": "Text on sidebar accent",
    "sidebarActive": "Active item",
    "sidebarActiveForeground": "Active item text",
    "sidebarBorder": "Sidebar border",
    "sidebarRing": "Sidebar focus ring",
    "chart1": "Chart 1",
    "chart2": "Chart 2",
    "chart3": "Chart 3",
    "chart4": "Chart 4",
    "chart5": "Chart 5",
    "chart6": "Chart 6",
    "chart7": "Chart 7",
    "chart8": "Chart 8",
    "ringInvalid": "Invalid field ring",
    "processCompleted": "Process completed",
    "processActive": "Process active",
    "primarySubtle": "Subtle primary",
    "primarySubtleForeground": "Text on subtle primary",
    "successSubtle": "Subtle success",
    "successSubtleForeground": "Text on subtle success",
    "warningSubtle": "Subtle warning",
    "warningSubtleForeground": "Text on subtle warning",
    "infoSubtle": "Subtle info",
    "infoSubtleForeground": "Text on subtle info",
    "destructiveSubtle": "Subtle destructive",
    "destructiveSubtleForeground": "Text on subtle destructive",
    "appTile1": "Tile 1",
    "appTile1Foreground": "Tile 1 text",
    "appTile2": "Tile 2",
    "appTile2Foreground": "Tile 2 text",
    "appTile3": "Tile 3",
    "appTile3Foreground": "Tile 3 text",
    "appTile4": "Tile 4",
    "appTile4Foreground": "Tile 4 text",
    "appTile5": "Tile 5",
    "appTile5Foreground": "Tile 5 text",
    "favorite": "Favourite",
    "scrollbarThumb": "Scrollbar",
    "scrollbarThumbHover": "Scrollbar on hover"
  },
  "logos": {
    "header": {
      "title": "Header mark",
      "description": "Square image shown in the header of every app."
    },
    "wide": {
      "title": "Wide logo",
      "description": "Shown on the sign-in screen and on invitations, at most 80 px tall."
    },
    "favicon": {
      "title": "Tab icon",
      "description": "PNG or ICO, up to 256 KB."
    },
    "light": "Light version",
    "dark": "Dark version (optional)",
    "pick": "Choose image",
    "drop": "Drag the image here",
    "current": "Current image",
    "remove": "Remove"
  },
  "preview": {
    "title": "Preview",
    "appName": "Application Center",
    "cardTitle": "Sample card",
    "cardBody": "Muted text for descriptions.",
    "primary": "Primary",
    "secondary": "Secondary",
    "destructive": "Delete",
    "fieldLabel": "Focused field",
    "fieldValue": "Value",
    "success": "Active",
    "warning": "Pending",
    "info": "New",
    "danger": "Error",
    "menuActive": "Current page",
    "menuItem": "Another page",
    "login": "Sign in"
  },
  "actions": {
    "save": "Save",
    "saving": "Saving…",
    "discard": "Discard",
    "reset": "Restore defaults",
    "clear": "Restore the default for {token}",
    "pickColor": "Pick the colour for {token}"
  },
  "unsaved": "You have unsaved changes.",
  "saved": "Customization saved.",
  "logoAlt": "Organization logo",
  "forbidden": {
    "description": "You need the platform customization permission. Permissions come from your active role."
  },
  "errors": {
    "load": "Could not load the customization.",
    "saveTitle": "Could not save.",
    "forbidden": "You do not have permission to customize the platform.",
    "upload": "Could not upload the image: {slot}.",
    "invalidColor": "Use a concrete colour: hex, rgb, hsl, oklch, oklab, lab, lch or a colour name.",
    "logoHost": "Only images uploaded here are accepted.",
    "favicon": "Use a PNG or ICO up to 256 KB.",
    "darkWithoutLight": "Add the light version before the dark one.",
    "invalid": "The customization has invalid values. Check the fields and try again.",
    "generic": "Try again. If the problem persists, contact support."
  }
}
```

`src/i18n/messages/fr.json` (same keys):

```json
"branding": {
  "meta": {
    "title": "Personnalisation",
    "description": "Définissez les couleurs et les logos de l'organisation."
  },
  "title": "Personnalisation",
  "subtitle": "Les couleurs et les logos s'appliquent à toutes les applications IGRP où la personnalisation est activée.",
  "tabs": { "colors": "Couleurs", "logos": "Logos" },
  "modes": { "label": "Modifier le mode sombre", "light": "Clair", "dark": "Sombre" },
  "groups": {
    "brand": "Marque",
    "surface": "Surfaces",
    "text": "Texte",
    "status": "États",
    "subtle": "États atténués",
    "sidebar": "Barre latérale",
    "chart": "Graphiques",
    "tiles": "Tuiles d'applications",
    "other": "Autres",
    "appOther": "Autres du Centre d'applications"
  },
  "tokens": {
    "primary": "Primaire",
    "primaryForeground": "Texte sur primaire",
    "secondary": "Secondaire",
    "secondaryForeground": "Texte sur secondaire",
    "accent": "Accent",
    "accentForeground": "Texte sur accent",
    "ring": "Anneau de focus",
    "background": "Arrière-plan",
    "card": "Carte",
    "cardForeground": "Texte de la carte",
    "popover": "Panneau flottant",
    "popoverForeground": "Texte du panneau flottant",
    "muted": "Atténué",
    "border": "Bordure",
    "input": "Bordure des champs",
    "foreground": "Texte",
    "mutedForeground": "Texte atténué",
    "destructive": "Destructif",
    "destructiveForeground": "Texte sur destructif",
    "success": "Succès",
    "successForeground": "Texte sur succès",
    "warning": "Avertissement",
    "warningForeground": "Texte sur avertissement",
    "info": "Information",
    "infoForeground": "Texte sur information",
    "indigo": "Indigo",
    "indigoForeground": "Texte sur indigo",
    "highlight": "Surlignage",
    "highlightForeground": "Texte sur surlignage",
    "sidebar": "Fond de la barre latérale",
    "sidebarForeground": "Texte de la barre latérale",
    "sidebarPrimary": "Primaire de la barre latérale",
    "sidebarPrimaryForeground": "Texte sur primaire de la barre latérale",
    "sidebarAccent": "Accent de la barre latérale",
    "sidebarAccentForeground": "Texte sur accent de la barre latérale",
    "sidebarActive": "Élément actif",
    "sidebarActiveForeground": "Texte de l'élément actif",
    "sidebarBorder": "Bordure de la barre latérale",
    "sidebarRing": "Anneau de focus de la barre latérale",
    "chart1": "Graphique 1",
    "chart2": "Graphique 2",
    "chart3": "Graphique 3",
    "chart4": "Graphique 4",
    "chart5": "Graphique 5",
    "chart6": "Graphique 6",
    "chart7": "Graphique 7",
    "chart8": "Graphique 8",
    "ringInvalid": "Anneau de champ invalide",
    "processCompleted": "Processus terminé",
    "processActive": "Processus actif",
    "primarySubtle": "Primaire atténué",
    "primarySubtleForeground": "Texte sur primaire atténué",
    "successSubtle": "Succès atténué",
    "successSubtleForeground": "Texte sur succès atténué",
    "warningSubtle": "Avertissement atténué",
    "warningSubtleForeground": "Texte sur avertissement atténué",
    "infoSubtle": "Information atténuée",
    "infoSubtleForeground": "Texte sur information atténuée",
    "destructiveSubtle": "Destructif atténué",
    "destructiveSubtleForeground": "Texte sur destructif atténué",
    "appTile1": "Tuile 1",
    "appTile1Foreground": "Texte de la tuile 1",
    "appTile2": "Tuile 2",
    "appTile2Foreground": "Texte de la tuile 2",
    "appTile3": "Tuile 3",
    "appTile3Foreground": "Texte de la tuile 3",
    "appTile4": "Tuile 4",
    "appTile4Foreground": "Texte de la tuile 4",
    "appTile5": "Tuile 5",
    "appTile5Foreground": "Texte de la tuile 5",
    "favorite": "Favori",
    "scrollbarThumb": "Barre de défilement",
    "scrollbarThumbHover": "Barre de défilement au survol"
  },
  "logos": {
    "header": {
      "title": "Marque de l'en-tête",
      "description": "Image carrée affichée dans l'en-tête de chaque application."
    },
    "wide": {
      "title": "Logo horizontal",
      "description": "Affiché sur l'écran de connexion et sur les invitations, 80 px de haut au maximum."
    },
    "favicon": {
      "title": "Icône de l'onglet",
      "description": "PNG ou ICO, jusqu'à 256 Ko."
    },
    "light": "Version claire",
    "dark": "Version sombre (facultative)",
    "pick": "Choisir une image",
    "drop": "Glissez l'image ici",
    "current": "Image actuelle",
    "remove": "Retirer"
  },
  "preview": {
    "title": "Aperçu",
    "appName": "Centre d'applications",
    "cardTitle": "Carte d'exemple",
    "cardBody": "Texte atténué pour les descriptions.",
    "primary": "Primaire",
    "secondary": "Secondaire",
    "destructive": "Supprimer",
    "fieldLabel": "Champ avec focus",
    "fieldValue": "Valeur",
    "success": "Actif",
    "warning": "En attente",
    "info": "Nouveau",
    "danger": "Erreur",
    "menuActive": "Page actuelle",
    "menuItem": "Autre page",
    "login": "Se connecter"
  },
  "actions": {
    "save": "Enregistrer",
    "saving": "Enregistrement…",
    "discard": "Abandonner",
    "reset": "Rétablir les valeurs par défaut",
    "clear": "Rétablir la valeur par défaut de {token}",
    "pickColor": "Choisir la couleur de {token}"
  },
  "unsaved": "Vous avez des modifications non enregistrées.",
  "saved": "Personnalisation enregistrée.",
  "logoAlt": "Logo de l'organisation",
  "forbidden": {
    "description": "Vous avez besoin de l'autorisation de personnalisation de la plateforme. Les autorisations viennent de votre rôle actif."
  },
  "errors": {
    "load": "Impossible de charger la personnalisation.",
    "saveTitle": "Impossible d'enregistrer.",
    "forbidden": "Vous n'avez pas l'autorisation de personnaliser la plateforme.",
    "upload": "Impossible de téléverser l'image : {slot}.",
    "invalidColor": "Utilisez une couleur concrète : hex, rgb, hsl, oklch, oklab, lab, lch ou un nom de couleur.",
    "logoHost": "Seules les images téléversées ici sont acceptées.",
    "favicon": "Utilisez un PNG ou un ICO de 256 Ko au maximum.",
    "darkWithoutLight": "Ajoutez la version claire avant la sombre.",
    "invalid": "La personnalisation contient des valeurs invalides. Vérifiez les champs et réessayez.",
    "generic": "Réessayez. Si le problème persiste, contactez le support."
  }
}
```

In all three files, replace `settings.items.customization.description` ("theme" is retired as a noun, spec §2):
- pt: `"Defina as cores e os logótipos da organização em todas as aplicações."`
- en: `"Set the organization's colours and logos across every app."`
- fr: `"Définissez les couleurs et les logos de l'organisation dans toutes les applications."`

- [ ] **Step 6: Run the test and typecheck**

Run: `pnpm vitest run src/__tests__/branding/catalog.test.ts && pnpm typecheck`
Expected: PASS. If the Default key set differs from the catalog, look at what the generator picked up from an extra `:root` block and narrow `SOURCES` or the selector; do not hand-edit the generated file.

- [ ] **Step 7: Commit**

```bash
pnpm lint
git add scripts/branding-defaults.mjs scripts/branding-defaults.d.mts package.json src/features/branding/app-tokens.ts src/features/branding/catalog.ts src/features/branding/token-defaults.ts src/i18n/messages/pt.json src/i18n/messages/en.json src/i18n/messages/fr.json src/__tests__/branding/catalog.test.ts
git commit -m "feat(branding): add the token catalog, generated defaults and branding messages"
```

---

### Task 5: Form mapper and preview style helper

**Files:**
- Create: `src/features/branding/lib/branding-mapper.ts`
- Create: `src/features/branding/lib/live-preview.ts`
- Test: `src/__tests__/branding/branding-mapper.test.ts`, `src/__tests__/branding/live-preview.test.ts`

**Interfaces:**
- Consumes: `normalizeColor`, `isEditorColor` (Task 3); `BRANDING_TOKEN_NAMES`, `BRANDING_DEFAULTS` (Task 4).
- Produces:
  - `LOGO_SLOTS = ["header", "wide", "favicon"] as const`, `type LogoSlotKey`
  - `type LogoSlotForm<F = File | string> = { light: F; dark: F; width?: number; height?: number }` (`""` means no image)
  - `type BrandingFormValues<F = File | string> = { tokens: { light: Record<string, string>; dark: Record<string, string> }; logos: Record<LogoSlotKey, LogoSlotForm<F>> }`
  - `toFormValues(branding: IGRPBranding | null): BrandingFormValues`
  - `toBrandingDocument(values: BrandingFormValues<string>): IGRPBranding` (throws on a colour that is not an editor colour)
  - `previewStyle(draft: Record<string, string>, mode: IGRPBrandingMode): Record<string, string>`

- [ ] **Step 1: Write the failing tests**

```ts
// src/__tests__/branding/branding-mapper.test.ts
import type { IGRPBranding } from "@igrp/framework-next-types";
import { describe, expect, it } from "vitest";

import { BRANDING_TOKEN_NAMES } from "@/features/branding/catalog";
import {
  toBrandingDocument,
  toFormValues,
} from "@/features/branding/lib/branding-mapper";

const URL_A = "https://minio.example/igrp/public/branding/u/a.png";
const saved: IGRPBranding = {
  version: 1,
  tokens: {
    light: { "--primary": "oklch(0.45 0.18 250)" },
    dark: { "--app-tile-1": "oklch(0.3 0.06 41.116)" },
  },
  logos: {
    header: { light: URL_A },
    wide: { light: URL_A, dark: URL_A, width: 320, height: 96 },
  },
};

describe("toFormValues", () => {
  it("gives every catalog Token a field in both Modes, empty when unset", () => {
    const values = toFormValues(null);
    for (const mode of ["light", "dark"] as const) {
      expect(Object.keys(values.tokens[mode]).sort()).toEqual(
        [...BRANDING_TOKEN_NAMES].sort(),
      );
      expect(Object.values(values.tokens[mode]).every((v) => v === "")).toBe(true);
    }
    expect(values.logos.favicon).toEqual({ light: "", dark: "" });
  });

  it("fills saved values", () => {
    const values = toFormValues(saved);
    expect(values.tokens.light["--primary"]).toBe("oklch(0.45 0.18 250)");
    expect(values.tokens.dark["--app-tile-1"]).toBe("oklch(0.3 0.06 41.116)");
    expect(values.logos.wide).toEqual({ light: URL_A, dark: URL_A, width: 320, height: 96 });
    expect(values.logos.header).toEqual({ light: URL_A, dark: "" });
  });
});

describe("toBrandingDocument", () => {
  it("keeps only filled Tokens and normalizes them to OKLCH", () => {
    const values = toFormValues(null);
    values.tokens.light["--primary"] = "#ff0000";
    // No File in these values, so the string-only overload is safe.
    const doc = toBrandingDocument(values as never);
    expect(doc).toEqual({
      version: 1,
      tokens: { light: { "--primary": "oklch(0.628 0.2577 29.2339)" }, dark: {} },
      logos: {},
    });
  });

  it("drops empty logo slots, keeps size only on the wide slot", () => {
    const values = toFormValues(saved);
    values.logos.header = { light: URL_A, dark: "", width: 10, height: 10 };
    const doc = toBrandingDocument(values as never);
    expect(doc.logos.header).toEqual({ light: URL_A });
    expect(doc.logos.wide).toEqual({ light: URL_A, dark: URL_A, width: 320, height: 96 });
    expect(doc.logos.favicon).toBeUndefined();
  });

  it("round-trips a saved Brand", () => {
    expect(toBrandingDocument(toFormValues(saved) as never)).toEqual(saved);
  });

  it("throws on a colour the editor rejects", () => {
    const values = toFormValues(null);
    values.tokens.dark["--primary"] = "color-mix(in oklch, red, blue)";
    expect(() => toBrandingDocument(values as never)).toThrow();
  });
});
```

```ts
// src/__tests__/branding/live-preview.test.ts
import { describe, expect, it } from "vitest";

import { previewStyle } from "@/features/branding/lib/live-preview";
import { BRANDING_DEFAULTS } from "@/features/branding/token-defaults";

describe("previewStyle", () => {
  it("is the Mode's Defaults when the draft is empty", () => {
    expect(previewStyle({ "--primary": "" }, "dark")).toEqual(BRANDING_DEFAULTS.dark);
  });

  it("overrides only the filled, valid draft values", () => {
    const style = previewStyle(
      { "--primary": "#ff0000", "--accent": "color-mix(in oklch, red, blue)" },
      "light",
    );
    expect(style["--primary"]).toBe("#ff0000");
    expect(style["--accent"]).toBe(BRANDING_DEFAULTS.light["--accent"]);
  });

  it("never touches the document root", () => {
    const before = document.documentElement.getAttribute("style");
    previewStyle({ "--primary": "#ff0000" }, "light");
    expect(document.documentElement.getAttribute("style")).toBe(before);
  });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `pnpm vitest run src/__tests__/branding/branding-mapper.test.ts src/__tests__/branding/live-preview.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement**

```ts
// src/features/branding/lib/branding-mapper.ts
import type {
  IGRPBranding,
  IGRPBrandingLogos,
  IGRPBrandingMode,
} from "@igrp/framework-next-types";

import { BRANDING_TOKEN_NAMES } from "../catalog";
import { normalizeColor } from "./color-normalize";

export const LOGO_SLOTS = ["header", "wide", "favicon"] as const;
export type LogoSlotKey = (typeof LOGO_SLOTS)[number];

/** `""` means "no image". A `File` is a pick that is not uploaded yet. */
export type LogoSlotForm<F = File | string> = {
  light: F;
  dark: F;
  width?: number;
  height?: number;
};

export type BrandingFormValues<F = File | string> = {
  tokens: Record<IGRPBrandingMode, Record<string, string>>;
  logos: Record<LogoSlotKey, LogoSlotForm<F>>;
};

const MODES: IGRPBrandingMode[] = ["light", "dark"];

/** Every catalog Token gets a field (controlled inputs); unset ones are `""`. */
export function toFormValues(branding: IGRPBranding | null): BrandingFormValues {
  const tokens = { light: {}, dark: {} } as BrandingFormValues["tokens"];
  for (const mode of MODES) {
    for (const name of BRANDING_TOKEN_NAMES) {
      tokens[mode][name] = branding?.tokens[mode]?.[name] ?? "";
    }
  }
  const logos = {} as BrandingFormValues["logos"];
  for (const slot of LOGO_SLOTS) {
    const s = branding?.logos[slot];
    logos[slot] = {
      light: s?.light ?? "",
      dark: s?.dark ?? "",
      ...(s?.width && s.height ? { width: s.width, height: s.height } : {}),
    };
  }
  return { tokens, logos };
}

/** The document to save. Drops empty fields; colours become OKLCH. Logos must already be URLs. */
export function toBrandingDocument(
  values: BrandingFormValues<string>,
): IGRPBranding {
  const tokens: Record<IGRPBrandingMode, Record<string, string>> = {
    light: {},
    dark: {},
  };
  for (const mode of MODES) {
    for (const [name, raw] of Object.entries(values.tokens[mode])) {
      if (!raw.trim()) continue;
      const value = normalizeColor(raw);
      if (!value) throw new Error(`branding: invalid colour for ${name}`);
      tokens[mode][name] = value;
    }
  }
  const logos: IGRPBrandingLogos = {};
  for (const slot of LOGO_SLOTS) {
    const s = values.logos[slot];
    if (!s.light) continue;
    logos[slot] = {
      light: s.light,
      ...(s.dark ? { dark: s.dark } : {}),
      ...(slot === "wide" && s.width && s.height
        ? { width: s.width, height: s.height }
        : {}),
    };
  }
  return { version: 1, tokens, logos };
}
```

```ts
// src/features/branding/lib/live-preview.ts
import type { IGRPBrandingMode } from "@igrp/framework-next-types";

import { BRANDING_DEFAULTS } from "../token-defaults";
import { isEditorColor } from "./color-normalize";

/**
 * Inline custom properties for the preview panel: every Token at its Default
 * for the Mode, overlaid by the valid draft values. Setting every Token (not
 * just the draft) keeps the panel independent of the saved Brand on
 * `html:root` and of the page's own Mode, so a cleared field shows its Default.
 */
export function previewStyle(
  draft: Record<string, string>,
  mode: IGRPBrandingMode,
): Record<string, string> {
  const style = { ...BRANDING_DEFAULTS[mode] };
  for (const [name, value] of Object.entries(draft)) {
    if (value.trim() && isEditorColor(value)) style[name] = value.trim();
  }
  return style;
}
```

- [ ] **Step 4: Run the tests**

Run: `pnpm vitest run src/__tests__/branding/branding-mapper.test.ts src/__tests__/branding/live-preview.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
pnpm lint
git add src/features/branding/lib/branding-mapper.ts src/features/branding/lib/live-preview.ts src/__tests__/branding/branding-mapper.test.ts src/__tests__/branding/live-preview.test.ts
git commit -m "feat(branding): map editor form values to the Brand document and compute the preview style"
```

---

### Task 6: Server actions `getBranding` and `saveBranding`

**Files:**
- Create: `src/actions/global-configuration.ts`
- Test: `src/__tests__/actions/global-configuration.test.ts`

**Interfaces:**
- Consumes: `isBrandingEnabled`, `CUSTOMIZE_PERMISSION` (Task 2); `checkSavableBranding`, `minioBaseUrl` (Task 3).
- Produces:
  - `getBranding(): Promise<ActionResult<IGRPBranding | null>>`
  - `saveBranding(raw: string): Promise<ActionResult<void>>` — failure statuses: `404` flag off, `403` no permission, `422` our validation, otherwise the API status.

- [ ] **Step 1: Write the failing test**

```ts
// src/__tests__/actions/global-configuration.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  authorize: vi.fn(),
  invalidate: vi.fn(),
  cookieSet: vi.fn(),
  revalidatePath: vi.fn(),
  calls: [] as string[],
}));

vi.mock("@/actions/access-client", () => ({
  getClientAccess: vi.fn(async () => ({
    globalConfiguration: {
      getGlobalConfiguration: mocks.get,
      setGlobalConfiguration: mocks.set,
    },
  })),
}));
vi.mock("@igrp/framework-next", () => ({
  igrpAuthorize: (name: string) => mocks.authorize(name),
  igrpInvalidateBranding: (...a: unknown[]) => {
    mocks.calls.push("invalidate");
    mocks.invalidate(...a);
  },
  BRAND_FRESHNESS_COOKIE: "igrp_brand_v",
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    set: (...a: unknown[]) => {
      mocks.calls.push("cookie");
      mocks.cookieSet(...a);
    },
  }),
}));
vi.mock("next/cache", () => ({
  revalidatePath: (...a: unknown[]) => {
    mocks.calls.push("revalidate");
    mocks.revalidatePath(...a);
  },
}));

import { getBranding, saveBranding } from "@/actions/global-configuration";

const MINIO = "https://minio.example/igrp";
const valid = {
  version: 1,
  tokens: { light: { "--primary": "oklch(0.45 0.18 250)" }, dark: {} },
  logos: { header: { light: `${MINIO}/public/branding/u/mark.png` } },
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.calls.length = 0;
  vi.stubEnv("IGRP_BRANDING_ENABLED", "true");
  vi.stubEnv("IGRP_PREVIEW_MODE", "false");
  vi.stubEnv("AUTH_PROVIDER", "igrp-auth");
  vi.stubEnv("NEXT_PUBLIC_IGRP_MINIO_URL", MINIO);
  mocks.authorize.mockResolvedValue(true);
  mocks.set.mockImplementation(async () => {
    mocks.calls.push("post");
    return { data: {} };
  });
});
afterEach(() => vi.unstubAllEnvs());

describe("getBranding", () => {
  it("parses the stored ORGANIZATION config", async () => {
    mocks.get.mockResolvedValue({ data: { type: "ORGANIZATION", config: JSON.stringify(valid) } });
    const result = await getBranding();
    expect(mocks.get).toHaveBeenCalledWith("ORGANIZATION");
    expect(result).toEqual({ success: true, data: valid });
  });

  it("maps 404 to no Brand", async () => {
    mocks.get.mockRejectedValue({ status: 404 });
    expect(await getBranding()).toEqual({ success: true, data: null });
  });

  it("returns null for an unusable stored document", async () => {
    mocks.get.mockResolvedValue({ data: { config: "{" } });
    expect(await getBranding()).toEqual({ success: true, data: null });
  });

  it("returns 403 without calling the SDK when the permission is missing", async () => {
    mocks.authorize.mockResolvedValue(false);
    expect(await getBranding()).toMatchObject({ success: false, status: 403 });
    expect(mocks.get).not.toHaveBeenCalled();
  });

  it("passes other API errors through with their status", async () => {
    mocks.get.mockRejectedValue({ status: 500 });
    expect(await getBranding()).toMatchObject({ success: false, status: 500 });
  });
});

describe("saveBranding", () => {
  it("posts the cleaned document, then invalidates, sets the cookie and revalidates", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1_760_000_000_000);
    const result = await saveBranding(JSON.stringify({ ...valid, extra: 1 }));

    expect(result).toEqual({ success: true, data: undefined });
    expect(mocks.authorize).toHaveBeenCalledWith("igrp.applications.customize");
    expect(mocks.set).toHaveBeenCalledWith({
      type: "ORGANIZATION",
      config: JSON.stringify(valid),
    });
    expect(mocks.calls).toEqual(["post", "invalidate", "cookie", "revalidate"]);
    expect(mocks.invalidate).toHaveBeenCalledWith();
    expect(mocks.cookieSet).toHaveBeenCalledWith("igrp_brand_v", "1760000000000", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 300,
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it.each([
    ["oversized input", JSON.stringify({ ...valid, pad: "x".repeat(65 * 1024) })],
    ["a color-mix value", JSON.stringify({ ...valid, tokens: { light: { "--primary": "color-mix(in oklch, red, blue)" } } })],
    ["a non-OKLCH value", JSON.stringify({ ...valid, tokens: { light: { "--primary": "#ff0000" } } })],
    ["a foreign logo host", JSON.stringify({ ...valid, logos: { wide: { light: "https://evil.example/l.svg" } } })],
    ["invalid JSON", "{"],
  ])("rejects %s with 422 before calling the SDK", async (_, raw) => {
    expect(await saveBranding(raw)).toMatchObject({ success: false, status: 422 });
    expect(mocks.set).not.toHaveBeenCalled();
    expect(mocks.calls).toEqual([]);
  });

  it("rejects unauthorized callers with 403 before calling the SDK", async () => {
    mocks.authorize.mockResolvedValue(false);
    expect(await saveBranding(JSON.stringify(valid))).toMatchObject({ status: 403 });
    expect(mocks.set).not.toHaveBeenCalled();
  });

  it("rejects when the flag is off or auth is bypassed", async () => {
    vi.stubEnv("IGRP_BRANDING_ENABLED", "false");
    expect(await saveBranding(JSON.stringify(valid))).toMatchObject({ status: 404 });
    vi.stubEnv("IGRP_BRANDING_ENABLED", "true");
    vi.stubEnv("IGRP_PREVIEW_MODE", "true");
    expect(await saveBranding(JSON.stringify(valid))).toMatchObject({ status: 404 });
    expect(mocks.authorize).not.toHaveBeenCalled();
    expect(mocks.set).not.toHaveBeenCalled();
  });

  it("does not invalidate or set the cookie when the API fails", async () => {
    mocks.set.mockRejectedValue({ status: 403 });
    expect(await saveBranding(JSON.stringify(valid))).toMatchObject({ success: false, status: 403 });
    expect(mocks.invalidate).not.toHaveBeenCalled();
    expect(mocks.cookieSet).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `pnpm vitest run src/__tests__/actions/global-configuration.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
// src/actions/global-configuration.ts
"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import {
  BRAND_FRESHNESS_COOKIE,
  igrpAuthorize,
  igrpInvalidateBranding,
} from "@igrp/framework-next";
import { igrpParseBranding } from "@igrp/framework-next-ui";
import type { IGRPBranding } from "@igrp/framework-next-types";
import { GlobalConfigurationType } from "@igrp/platform-access-management-client-ts";

import {
  checkSavableBranding,
  minioBaseUrl,
} from "@/features/branding/lib/branding-rules";
import { CUSTOMIZE_PERMISSION } from "@/lib/constants";
import { isBrandingEnabled, toActionError } from "@/lib/utilities";

import { getClientAccess } from "./access-client";
import type { ActionResult } from "./types";

/* The page guard is navigation; these checks are the enforcement in front of
   the SDK call. Access Management enforces the permission again on POST. */
const DISABLED = {
  success: false,
  error: "A personalização não está ativa.",
  status: 404,
} as const;
const FORBIDDEN = {
  success: false,
  error: "Não tem permissão para personalizar a plataforma.",
  status: 403,
} as const;
/* 422, not 400, so the editor can tell its own rule failures from API errors. */
const INVALID = {
  success: false,
  error: "Configuração de marca inválida.",
  status: 422,
} as const;

/** Freshness cookie lifetime; matches the loader's 300 s window. */
const BRAND_COOKIE_MAX_AGE_S = 300;

const statusOf = (error: unknown) =>
  (error as { status?: number } | null)?.status;

export async function getBranding(): Promise<ActionResult<IGRPBranding | null>> {
  if (!(await igrpAuthorize(CUSTOMIZE_PERMISSION))) return FORBIDDEN;
  const client = await getClientAccess();

  try {
    const result = await client.globalConfiguration.getGlobalConfiguration(
      GlobalConfigurationType.ORGANIZATION,
    );
    return { success: true, data: igrpParseBranding(result.data.config).branding };
  } catch (error) {
    if (statusOf(error) === 404) return { success: true, data: null };
    console.error("[branding] Erro ao carregar a personalização:", error);
    return { success: false, ...toActionError(error) };
  }
}

export async function saveBranding(raw: string): Promise<ActionResult<void>> {
  if (!isBrandingEnabled()) return DISABLED;
  if (!(await igrpAuthorize(CUSTOMIZE_PERMISSION))) return FORBIDDEN;
  const branding = checkSavableBranding(raw, minioBaseUrl());
  if (!branding) return INVALID;

  const client = await getClientAccess();
  try {
    // Store the cleaned document, so unknown keys never reach the database.
    await client.globalConfiguration.setGlobalConfiguration({
      type: GlobalConfigurationType.ORGANIZATION,
      config: JSON.stringify(branding),
    });
  } catch (error) {
    console.error("[branding] Erro ao guardar a personalização:", error);
    return { success: false, ...toActionError(error) };
  }

  // This instance refetches on its next request; the cookie tells other
  // instances behind the same host to refetch once (spec §8.4).
  igrpInvalidateBranding();
  (await cookies()).set(BRAND_FRESHNESS_COOKIE, String(Date.now()), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: BRAND_COOKIE_MAX_AGE_S,
  });
  revalidatePath("/", "layout");
  return { success: true, data: undefined };
}
```

Note: `BRAND_COOKIE_MAX_AGE_S` is a non-exported `const`, which a `"use server"` file allows (only exports must be async functions).

- [ ] **Step 4: Run the test**

Run: `pnpm vitest run src/__tests__/actions/global-configuration.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
pnpm lint
git add src/actions/global-configuration.ts src/__tests__/actions/global-configuration.test.ts
git commit -m "feat(branding): add getBranding and saveBranding server actions"
```

---

### Task 7: Upload-and-save flow and query hooks

**Files:**
- Create: `src/features/branding/lib/persist-branding.ts`
- Create: `src/features/branding/query-keys.ts`, `src/features/branding/use-branding.ts`
- Test: `src/__tests__/branding/persist-branding.test.ts`

**Interfaces:**
- Consumes: `uploadPublicFile(file, { folder })` (`@/actions/file`), `getBranding`, `saveBranding` (Task 6), `toBrandingDocument`, `LOGO_SLOTS`, `BrandingFormValues` (Task 5), `minioBaseUrl` (Task 3), `unwrap` (`@/actions/types`).
- Produces:
  - `class BrandingSaveError extends Error { reason: "upload" | "forbidden" | "invalid" | "api"; detail?: string }` (`detail` is the slot key for `upload`, the API message for `api`)
  - `brandingAssetUrl(path: string, base?: string): string`
  - `uploadLogos(logos): Promise<BrandingFormValues<string>["logos"]>`
  - `persistBranding(values: BrandingFormValues): Promise<void>`
  - `brandingKeys.config(): readonly ["branding", "config"]`
  - `useBrandingConfig()`, `useSaveBranding()` (mutation over `persistBranding`, invalidates `brandingKeys.config()` on success)

- [ ] **Step 1: Write the failing test**

```ts
// src/__tests__/branding/persist-branding.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  upload: vi.fn(),
  save: vi.fn(),
  calls: [] as string[],
}));
vi.mock("@/actions/file", () => ({ uploadPublicFile: mocks.upload }));
vi.mock("@/actions/global-configuration", () => ({ saveBranding: mocks.save }));

import { toFormValues } from "@/features/branding/lib/branding-mapper";
import {
  BrandingSaveError,
  brandingAssetUrl,
  persistBranding,
} from "@/features/branding/lib/persist-branding";

const MINIO = "https://minio.example/igrp";
const png = (name: string) => new File(["x"], name, { type: "image/png" });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.calls.length = 0;
  vi.stubEnv("NEXT_PUBLIC_IGRP_MINIO_URL", MINIO);
  mocks.upload.mockImplementation(async (file: File) => {
    mocks.calls.push(`upload:${file.name}`);
    return { success: true, data: `public/branding/u/${file.name}` };
  });
  mocks.save.mockImplementation(async () => {
    mocks.calls.push("save");
    return { success: true, data: undefined };
  });
});
afterEach(() => vi.unstubAllEnvs());

describe("brandingAssetUrl", () => {
  it.each([
    ["https://minio.example/igrp", "public/a.png"],
    ["https://minio.example/igrp/", "public/a.png"],
    ["https://minio.example/igrp", "/public/a.png"],
  ])("joins %j and %j keeping the bucket", (base, path) => {
    expect(brandingAssetUrl(path, base)).toBe("https://minio.example/igrp/public/a.png");
  });
});

describe("persistBranding", () => {
  it("uploads every picked file into 'branding', then saves URLs", async () => {
    const values = toFormValues(null);
    values.logos.header.light = png("mark.png");
    values.logos.wide = { light: png("wide.png"), dark: "", width: 320, height: 96 };
    values.tokens.light["--primary"] = "#ff0000";

    await persistBranding(values);

    expect(mocks.upload).toHaveBeenCalledTimes(2);
    expect(mocks.upload).toHaveBeenCalledWith(expect.any(File), { folder: "branding" });
    expect(mocks.calls.at(-1)).toBe("save");
    const doc = JSON.parse(mocks.save.mock.calls[0][0]);
    expect(doc.logos.header).toEqual({ light: `${MINIO}/public/branding/u/mark.png` });
    expect(doc.logos.wide).toEqual({
      light: `${MINIO}/public/branding/u/wide.png`,
      width: 320,
      height: 96,
    });
    expect(doc.tokens.light["--primary"]).toBe("oklch(0.628 0.2577 29.2339)");
  });

  it("aborts without saving when an upload fails, naming the slot", async () => {
    const values = toFormValues(null);
    values.logos.favicon.light = png("favicon.png");
    mocks.upload.mockResolvedValue({ success: false, error: "boom", status: 500 });

    const error = await persistBranding(values).catch((e) => e);
    expect(error).toBeInstanceOf(BrandingSaveError);
    expect(error).toMatchObject({ reason: "upload", detail: "favicon" });
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it.each([
    [403, "forbidden", undefined],
    [422, "invalid", undefined],
    [500, "api", "Erro do servidor"],
  ])("maps a %i save failure to %j", async (status, reason, detail) => {
    mocks.save.mockResolvedValue({ success: false, error: "Erro do servidor", status });
    await expect(persistBranding(toFormValues(null))).rejects.toMatchObject({ reason, detail });
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `pnpm vitest run src/__tests__/branding/persist-branding.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
// src/features/branding/lib/persist-branding.ts
import { uploadPublicFile } from "@/actions/file";
import { saveBranding } from "@/actions/global-configuration";

import {
  type BrandingFormValues,
  LOGO_SLOTS,
  type LogoSlotKey,
  toBrandingDocument,
} from "./branding-mapper";
import { minioBaseUrl } from "./branding-rules";

export class BrandingSaveError extends Error {
  constructor(
    readonly reason: "upload" | "forbidden" | "invalid" | "api",
    readonly detail?: string,
  ) {
    super(`branding.${reason}`);
  }
}

/** String join, not `new URL(path, base)`, which would drop a bucket path without a trailing slash. */
export function brandingAssetUrl(path: string, base = minioBaseUrl()): string {
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

async function upload(slot: LogoSlotKey, value: File | string): Promise<string> {
  if (!(value instanceof File)) return value;
  const result = await uploadPublicFile(value, { folder: "branding" });
  if (!result.success) throw new BrandingSaveError("upload", slot);
  return brandingAssetUrl(result.data);
}

/** Uploads every picked file in parallel; the first failure aborts. */
export async function uploadLogos(
  logos: BrandingFormValues["logos"],
): Promise<BrandingFormValues<string>["logos"]> {
  const entries = await Promise.all(
    LOGO_SLOTS.map(async (slot) => {
      const s = logos[slot];
      const [light, dark] = await Promise.all([
        upload(slot, s.light),
        upload(slot, s.dark),
      ]);
      return [slot, { ...s, light, dark }] as const;
    }),
  );
  return Object.fromEntries(entries) as BrandingFormValues<string>["logos"];
}

/** Spec §10.3: upload, normalize, save. Throws `BrandingSaveError`. */
export async function persistBranding(values: BrandingFormValues): Promise<void> {
  const logos = await uploadLogos(values.logos);
  const result = await saveBranding(
    JSON.stringify(toBrandingDocument({ ...values, logos })),
  );
  if (result.success) return;
  if (result.status === 403) throw new BrandingSaveError("forbidden");
  if (result.status === 422) throw new BrandingSaveError("invalid");
  throw new BrandingSaveError("api", result.error);
}
```

```ts
// src/features/branding/query-keys.ts
export const brandingKeys = {
  all: ["branding"] as const,
  config: () => [...brandingKeys.all, "config"] as const,
};
```

```ts
// src/features/branding/use-branding.ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getBranding } from "@/actions/global-configuration";
import { unwrap } from "@/actions/types";

import type { BrandingFormValues } from "./lib/branding-mapper";
import { persistBranding } from "./lib/persist-branding";
import { brandingKeys } from "./query-keys";

/** The saved Brand (`null` when none). 404 is already mapped to `null` by the action. */
export function useBrandingConfig() {
  return useQuery({
    queryKey: brandingKeys.config(),
    queryFn: async () => unwrap(await getBranding()),
  });
}

export function useSaveBranding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: BrandingFormValues) => persistBranding(values),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: brandingKeys.config() }),
  });
}
```

- [ ] **Step 4: Run the test and typecheck**

Run: `pnpm vitest run src/__tests__/branding/persist-branding.test.ts && pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
pnpm lint
git add src/features/branding/lib/persist-branding.ts src/features/branding/query-keys.ts src/features/branding/use-branding.ts src/__tests__/branding/persist-branding.test.ts
git commit -m "feat(branding): upload logos and save the Brand through a query mutation"
```

---

### Task 8: Form schema, colour field, token group and mode switch

**Files:**
- Create: `src/features/branding/branding-schemas.ts`
- Create: `src/features/branding/components/mode-switch.tsx`
- Create: `src/features/branding/components/color-field.tsx`
- Create: `src/features/branding/components/token-group.tsx`
- Test: `src/__tests__/branding/branding-schemas.test.ts`, `src/__tests__/branding/components/color-field.test.tsx`

**Interfaces:**
- Consumes: `isEditorColor`, `toHex` (Task 3); `isOnMinioHost`, `isFaviconFile`, `minioBaseUrl` (Task 3); `CatalogGroup`, `BRANDING_DEFAULTS` (Task 4); `BrandingFormValues`, `toFormValues` (Task 5).
- Produces:
  - `createBrandingSchema(t: (key: BrandingSchemaMessage) => string)`, `type BrandingSchemaMessage = "errors.invalidColor" | "errors.logoHost" | "errors.favicon" | "errors.darkWithoutLight"`
  - `<ModeSwitch mode onChange />`, `<ColorField name label defaultValue />`, `<TokenGroup group mode defaultOpen? />`

- [ ] **Step 1: Write the failing tests**

```ts
// src/__tests__/branding/branding-schemas.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createBrandingSchema } from "@/features/branding/branding-schemas";
import { toFormValues } from "@/features/branding/lib/branding-mapper";

const MINIO = "https://minio.example/igrp";
const t = (key: string) => key;

beforeEach(() => vi.stubEnv("NEXT_PUBLIC_IGRP_MINIO_URL", MINIO));
afterEach(() => vi.unstubAllEnvs());

const issues = (values: unknown) => {
  const result = createBrandingSchema(t).safeParse(values);
  return result.success ? [] : result.error.issues.map((i) => [i.path.join("."), i.message]);
};

describe("createBrandingSchema", () => {
  it("accepts the empty form", () => {
    expect(issues(toFormValues(null))).toEqual([]);
  });

  it("flags editor-invalid colours on their field", () => {
    const values = toFormValues(null);
    values.tokens.dark["--primary"] = "color-mix(in oklch, red, blue)";
    expect(issues(values)).toEqual([["tokens.dark.--primary", "errors.invalidColor"]]);
  });

  it("flags a hand-written stored Brand the editor would not save", () => {
    const values = toFormValues({
      version: 1,
      tokens: { light: { "--ring": "var(--primary)" } },
      logos: { wide: { light: "https://evil.example/logo.svg" } },
    });
    expect(issues(values)).toEqual(
      expect.arrayContaining([
        ["tokens.light.--ring", "errors.invalidColor"],
        ["logos.wide.light", "errors.logoHost"],
      ]),
    );
  });

  it("requires the light image when a dark one is set", () => {
    const values = toFormValues(null);
    values.logos.header.dark = `${MINIO}/public/d.png`;
    expect(issues(values)).toEqual([["logos.header.light", "errors.darkWithoutLight"]]);
  });

  it("rejects a favicon that is not PNG/ICO or is over 256 KB", () => {
    const values = toFormValues(null);
    values.logos.favicon.light = new File(["<svg/>"], "f.svg", { type: "image/svg+xml" });
    values.logos.favicon.dark = new File([new Uint8Array(300 * 1024)], "f.png", { type: "image/png" });
    expect(issues(values)).toEqual([
      ["logos.favicon.light", "errors.favicon"],
      ["logos.favicon.dark", "errors.favicon"],
    ]);
  });
});
```

```tsx
// src/__tests__/branding/components/color-field.test.tsx
import { Form } from "@igrp/igrp-framework-react-design-system";
import { fireEvent, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";

import { ColorField } from "@/features/branding/components/color-field";

import { renderWithIntl as render } from "../../helpers/intl";

function Harness({ initial = "" }: { initial?: string }) {
  const form = useForm({ defaultValues: { tokens: { light: { "--primary": initial }, dark: {} } } });
  return (
    <Form {...form}>
      <ColorField name="tokens.light.--primary" label="Primária" defaultValue="oklch(0.208 0.042 265.755)" />
      <output data-testid="value">{form.watch("tokens.light.--primary")}</output>
    </Form>
  );
}

describe("ColorField", () => {
  it("shows the Default as placeholder and as the swatch when empty", () => {
    render(<Harness />);
    const input = screen.getByLabelText("Primária");
    expect(input).toHaveAttribute("placeholder", "oklch(0.208 0.042 265.755)");
    expect(screen.getByRole("button", { name: /Repor a predefinição/ })).toBeDisabled();
  });

  it("writes hex from the native colour input", () => {
    render(<Harness />);
    fireEvent.change(screen.getByLabelText(/Escolher a cor/), { target: { value: "#ff0000" } });
    expect(screen.getByTestId("value")).toHaveTextContent("#ff0000");
  });

  it("clears back to the Default", () => {
    render(<Harness initial="#ff0000" />);
    fireEvent.click(screen.getByRole("button", { name: /Repor a predefinição/ }));
    expect(screen.getByTestId("value")).toHaveTextContent("");
  });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `pnpm vitest run src/__tests__/branding/branding-schemas.test.ts src/__tests__/branding/components/color-field.test.tsx`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement the schema**

```ts
// src/features/branding/branding-schemas.ts
import { z } from "zod";

import {
  isFaviconFile,
  isOnMinioHost,
  minioBaseUrl,
} from "./lib/branding-rules";
import { isEditorColor } from "./lib/color-normalize";

export type BrandingSchemaMessage =
  | "errors.invalidColor"
  | "errors.logoHost"
  | "errors.favicon"
  | "errors.darkWithoutLight";

/** Editor rules (spec §9, marked "editor"). The server re-checks in saveBranding. */
export function createBrandingSchema(t: (key: BrandingSchemaMessage) => string) {
  const minio = minioBaseUrl();

  const color = z
    .string()
    .refine((v) => v.trim() === "" || isEditorColor(v), {
      message: t("errors.invalidColor"),
    });

  const image = z
    .union([z.instanceof(File), z.string()])
    .refine((v) => typeof v !== "string" || v === "" || isOnMinioHost(v, minio), {
      message: t("errors.logoHost"),
    });

  const slot = z
    .object({
      light: image,
      dark: image,
      width: z.number().int().positive().optional(),
      height: z.number().int().positive().optional(),
    })
    .refine((s) => s.dark === "" || s.light !== "", {
      message: t("errors.darkWithoutLight"),
      path: ["light"],
    });

  const favicon = slot.superRefine((s, ctx) => {
    for (const variant of ["light", "dark"] as const) {
      const value = s[variant];
      if (value instanceof File && !isFaviconFile(value)) {
        ctx.addIssue({ code: "custom", path: [variant], message: t("errors.favicon") });
      }
    }
  });

  return z.object({
    tokens: z.object({
      light: z.record(z.string(), color),
      dark: z.record(z.string(), color),
    }),
    logos: z.object({ header: slot, wide: slot, favicon }),
  });
}
```

- [ ] **Step 4: Implement the components**

```tsx
// src/features/branding/components/mode-switch.tsx
"use client";

import type { IGRPBrandingMode } from "@igrp/framework-next-types";
import { cn, IGRPIcon } from "@igrp/igrp-framework-react-design-system";
import { useTranslations } from "next-intl";

/** Chooses the Mode being edited (form and preview). Never changes the user's theme. */
export function ModeSwitch({
  mode,
  onChange,
}: {
  mode: IGRPBrandingMode;
  onChange: (mode: IGRPBrandingMode) => void;
}) {
  const t = useTranslations("branding.modes");
  const dark = mode === "dark";
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={dark}
        aria-label={t("label")}
        onClick={() => onChange(dark ? "light" : "dark")}
        className="relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border bg-muted transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <span
          className={cn(
            "flex size-5 items-center justify-center rounded-full bg-background shadow-sm transition-transform",
            dark ? "translate-x-6" : "translate-x-1",
          )}
        >
          <IGRPIcon iconName={dark ? "Moon" : "Sun"} className="size-3" aria-hidden="true" />
        </span>
      </button>
      <span className="text-sm" aria-hidden="true">
        {dark ? t("dark") : t("light")}
      </span>
    </div>
  );
}
```

```tsx
// src/features/branding/components/color-field.tsx
"use client";

import {
  Button,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  IGRPIcon,
  Input,
} from "@igrp/igrp-framework-react-design-system";
import { useTranslations } from "next-intl";
import { useFormContext } from "react-hook-form";

import type { BrandingFormValues } from "../lib/branding-mapper";
import { toHex } from "../lib/color-normalize";

type TokenPath = `tokens.${"light" | "dark"}.${string}`;

export function ColorField({
  name,
  label,
  defaultValue,
}: {
  name: TokenPath;
  label: string;
  defaultValue: string;
}) {
  const t = useTranslations("branding.actions");
  const { control } = useFormContext<BrandingFormValues>();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const value = typeof field.value === "string" ? field.value : "";
        const shown = value || defaultValue;
        return (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <div className="flex items-center gap-2">
              {/* The swatch is the one place a raw colour is rendered (spec §10.6). */}
              <label
                className="relative size-8 shrink-0 cursor-pointer rounded-md border has-[input:focus-visible]:ring-[3px] has-[input:focus-visible]:ring-ring/50"
                style={{ background: shown }}
              >
                <input
                  type="color"
                  className="sr-only"
                  aria-label={t("pickColor", { token: label })}
                  value={toHex(shown)}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              </label>
              <FormControl>
                <Input
                  {...field}
                  value={value}
                  placeholder={defaultValue}
                  spellCheck={false}
                  autoComplete="off"
                  className="font-mono text-xs"
                />
              </FormControl>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={!value}
                aria-label={t("clear", { token: label })}
                onClick={() => field.onChange("")}
              >
                <IGRPIcon iconName="RotateCcw" className="size-4" aria-hidden="true" />
              </Button>
            </div>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
```

```tsx
// src/features/branding/components/token-group.tsx
"use client";

import type { IGRPBrandingMode } from "@igrp/framework-next-types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  cn,
  IGRPIcon,
} from "@igrp/igrp-framework-react-design-system";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useFormContext } from "react-hook-form";

import type { CatalogGroup } from "../catalog";
import type { BrandingFormValues } from "../lib/branding-mapper";
import { BRANDING_DEFAULTS } from "../token-defaults";
import { ColorField } from "./color-field";

/** One collapsible group of colour fields. Forced open while it holds an error. */
export function TokenGroup({
  group,
  mode,
  defaultOpen = false,
}: {
  group: CatalogGroup;
  mode: IGRPBrandingMode;
  defaultOpen?: boolean;
}) {
  const t = useTranslations("branding");
  const { formState } = useFormContext<BrandingFormValues>();
  const [open, setOpen] = useState(defaultOpen);
  const hasError = group.tokens.some(
    (token) => formState.errors.tokens?.[mode]?.[token.name],
  );
  const isOpen = open || hasError;

  return (
    <Collapsible open={isOpen} onOpenChange={setOpen} className="rounded-lg border">
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 px-4 py-3 text-sm font-medium">
        {t(`groups.${group.key}`)}
        <IGRPIcon
          iconName="ChevronDown"
          className={cn("size-4 transition-transform", isOpen && "rotate-180")}
          aria-hidden="true"
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="grid gap-4 px-4 pb-4 sm:grid-cols-2">
        {group.tokens.map((token) => (
          <ColorField
            key={`${mode}${token.name}`}
            name={`tokens.${mode}.${token.name}`}
            label={t(`tokens.${token.labelKey}`)}
            defaultValue={BRANDING_DEFAULTS[mode][token.name]}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
```

- [ ] **Step 5: Run the tests and the UI gate**

Run: `pnpm vitest run src/__tests__/branding/branding-schemas.test.ts src/__tests__/branding/components/color-field.test.tsx && pnpm check:ui && pnpm typecheck`
Expected: PASS. (`check:ui` keeps its one pre-existing finding in `app-card`; no new ones.)

- [ ] **Step 6: Commit**

```bash
pnpm lint
git add src/features/branding/branding-schemas.ts src/features/branding/components/mode-switch.tsx src/features/branding/components/color-field.tsx src/features/branding/components/token-group.tsx src/__tests__/branding/branding-schemas.test.ts src/__tests__/branding/components/color-field.test.tsx
git commit -m "feat(branding): add the editor schema, colour field, token group and mode switch"
```

---

### Task 9: Logo field

**Files:**
- Create: `src/features/branding/lib/image-size.ts`
- Create: `src/features/branding/components/use-object-url.ts`
- Create: `src/features/branding/components/logo-field.tsx`
- Test: `src/__tests__/branding/components/logo-field.test.tsx`

**Interfaces:**
- Consumes: `FileUploadField` (`@/components/file-upload-field`, props `value: FileWithPreview | null`, `onChange(file | null)`, `label`, `placeholder`, `btnLabel`, `accept`, `maxSizeMB`), `FileWithPreview` (`@/features/files/use-file-upload`), `FAVICON_ACCEPT` (Task 3), `BrandingFormValues`, `LogoSlotKey` (Task 5).
- Produces: `readImageSize(file: File): Promise<{ width: number; height: number } | null>`, `useObjectUrl(value: File | string | undefined): string`, `<LogoField slot />`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/__tests__/branding/components/logo-field.test.tsx
import { Form } from "@igrp/igrp-framework-react-design-system";
import { fireEvent, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";

import { LogoField } from "@/features/branding/components/logo-field";
import { toFormValues } from "@/features/branding/lib/branding-mapper";

import { renderWithIntl as render } from "../../helpers/intl";

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

const URL_A = "https://minio.example/igrp/public/branding/u/mark.png";

function Harness() {
  const values = toFormValues({ version: 1, tokens: {}, logos: { header: { light: URL_A } } });
  const form = useForm({ defaultValues: values });
  return (
    <Form {...form}>
      <LogoField slot="header" />
      <output data-testid="light">{String(form.watch("logos.header.light"))}</output>
      <output data-testid="dirty">{String(form.formState.isDirty)}</output>
    </Form>
  );
}

describe("LogoField", () => {
  it("keeps the saved URL on mount (FileUploadField emits null)", () => {
    render(<Harness />);
    expect(screen.getByTestId("light")).toHaveTextContent(URL_A);
    expect(screen.getByTestId("dirty")).toHaveTextContent("false");
    expect(screen.getByAltText("Imagem atual")).toHaveAttribute("src", URL_A);
  });

  it("removes the saved image on request", () => {
    render(<Harness />);
    fireEvent.click(screen.getAllByRole("button", { name: "Remover" })[0]);
    expect(screen.getByTestId("light")).toHaveTextContent("");
    expect(screen.getByTestId("dirty")).toHaveTextContent("true");
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `pnpm vitest run src/__tests__/branding/components/logo-field.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
// src/features/branding/lib/image-size.ts
/** Natural size of a picked image, or `null` when the browser cannot tell (e.g. an SVG without width/height). */
export function readImageSize(
  file: File,
): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    const done = (size: { width: number; height: number } | null) => {
      URL.revokeObjectURL(url);
      resolve(size);
    };
    img.onload = () =>
      done(
        img.naturalWidth && img.naturalHeight
          ? { width: img.naturalWidth, height: img.naturalHeight }
          : null,
      );
    img.onerror = () => done(null);
    img.src = url;
  });
}
```

```ts
// src/features/branding/components/use-object-url.ts
"use client";

import { useEffect, useState } from "react";

/** A displayable URL for a picked `File` (revoked on change) or the saved URL string. */
export function useObjectUrl(value: File | string | undefined): string {
  const [url, setUrl] = useState(typeof value === "string" ? value : "");
  useEffect(() => {
    if (!(value instanceof File)) {
      setUrl(typeof value === "string" ? value : "");
      return;
    }
    const objectUrl = URL.createObjectURL(value);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [value]);
  return url;
}
```

```tsx
// src/features/branding/components/logo-field.tsx
"use client";

import Image from "next/image";
import { useCallback, useMemo } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FormField,
  IGRPButton,
} from "@igrp/igrp-framework-react-design-system";
import { useTranslations } from "next-intl";
import { useFormContext } from "react-hook-form";

import { FileUploadField } from "@/components/file-upload-field";
import type { FileWithPreview } from "@/features/files/use-file-upload";

import type { BrandingFormValues, LogoSlotKey } from "../lib/branding-mapper";
import { FAVICON_ACCEPT } from "../lib/branding-rules";
import { readImageSize } from "../lib/image-size";
import { useObjectUrl } from "./use-object-url";

type Variant = "light" | "dark";

export function LogoField({ slot }: { slot: LogoSlotKey }) {
  const t = useTranslations("branding.logos");
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(`${slot}.title`)}</CardTitle>
        <CardDescription>{t(`${slot}.description`)}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <LogoVariant slot={slot} variant="light" />
        <LogoVariant slot={slot} variant="dark" />
      </CardContent>
    </Card>
  );
}

function LogoVariant({ slot, variant }: { slot: LogoSlotKey; variant: Variant }) {
  const t = useTranslations("branding.logos");
  const { control, getValues, resetField, setValue, watch } =
    useFormContext<BrandingFormValues>();
  const name = `logos.${slot}.${variant}` as const;
  const value = watch(name);
  const url = useObjectUrl(value);

  const picked = useMemo<FileWithPreview | null>(
    () =>
      value instanceof File
        ? { id: `${slot}-${variant}`, file: value, preview: url }
        : null,
    [value, url, slot, variant],
  );

  // FileUploadField calls onChange on every render and with null on mount:
  // ignore repeats, and only a null after a pick goes back to the saved image.
  const onChange = useCallback(
    async (next: FileWithPreview | null) => {
      const current = getValues(name);
      const file = next?.file instanceof File ? next.file : null;
      if (!file) {
        if (current instanceof File) resetField(name);
        return;
      }
      if (file === current) return;
      setValue(name, file, { shouldDirty: true, shouldValidate: true });
      if (slot === "wide" && variant === "light") {
        const size = await readImageSize(file);
        setValue("logos.wide.width", size?.width, { shouldDirty: true });
        setValue("logos.wide.height", size?.height, { shouldDirty: true });
      }
    },
    [getValues, name, resetField, setValue, slot, variant],
  );

  return (
    <FormField
      control={control}
      name={name}
      render={() => (
        <div className="flex flex-col gap-2">
          {typeof value === "string" && value !== "" && (
            <div className="flex items-center gap-3 rounded-lg border p-2">
              <Image
                src={value}
                alt={t("current")}
                width={48}
                height={48}
                unoptimized
                className="size-12 rounded-md object-contain"
              />
              <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                {value}
              </span>
              <IGRPButton
                type="button"
                variant="ghost"
                onClick={() =>
                  setValue(name, "", { shouldDirty: true, shouldValidate: true })
                }
              >
                {t("remove")}
              </IGRPButton>
            </div>
          )}
          <FileUploadField
            value={picked}
            onChange={onChange}
            label={t(variant)}
            placeholder={t("drop")}
            btnLabel={t("pick")}
            accept={slot === "favicon" ? FAVICON_ACCEPT : undefined}
            maxSizeMB={slot === "favicon" ? 0.25 : 1}
          />
        </div>
      )}
    />
  );
}
```

- [ ] **Step 4: Run the test and gates**

Run: `pnpm vitest run src/__tests__/branding/components/logo-field.test.tsx && pnpm check:ui && pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
pnpm lint
git add src/features/branding/lib/image-size.ts src/features/branding/components/use-object-url.ts src/features/branding/components/logo-field.tsx src/__tests__/branding/components/logo-field.test.tsx
git commit -m "feat(branding): add the logo field with natural-size capture for the wide logo"
```

---

### Task 10: Live preview and the editor screen

**Files:**
- Create: `src/features/branding/components/live-preview.tsx`
- Create: `src/features/branding/components/branding-screen.tsx`
- Test: `src/__tests__/branding/components/branding-screen.test.tsx`

**Interfaces:**
- Consumes: everything from Tasks 4–9; `useBrandingConfig`, `useSaveBranding`, `BrandingSaveError` (Task 7).
- Produces: `<BrandingScreen />` (client, no props), `<LivePreview mode tokens logos />`.

- [ ] **Step 1: Write the failing test**

Keep the mocked query and mutation objects at module scope: a fresh object per render makes `toFormValues` and `form.reset` loop and runs vitest out of memory.

```tsx
// src/__tests__/branding/components/branding-screen.test.tsx
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BrandingScreen } from "@/features/branding/components/branding-screen";
import { BRANDING_GROUPS } from "@/features/branding/catalog";
import pt from "@/i18n/messages/pt.json";

import { renderWithIntl as render } from "../../helpers/intl";

const mocks = vi.hoisted(() => ({
  query: { isPending: false, isError: false, error: null, data: null },
  mutation: { mutateAsync: vi.fn(), isPending: false },
  refresh: vi.fn(),
}));
vi.mock("@/features/branding/use-branding", () => ({
  useBrandingConfig: () => mocks.query,
  useSaveBranding: () => mocks.mutation,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));
vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.mutation.mutateAsync.mockResolvedValue(undefined);
});

const preview = () => screen.getByRole("region", { name: pt.branding.preview.title });

describe("BrandingScreen", () => {
  it("renders every group from both catalogs", () => {
    render(<BrandingScreen />);
    for (const group of BRANDING_GROUPS) {
      expect(screen.getByText(pt.branding.groups[group.key])).toBeInTheDocument();
    }
  });

  it("switches only the preview panel to dark", () => {
    render(<BrandingScreen />);
    expect(preview()).not.toHaveClass("dark");
    fireEvent.click(screen.getByRole("switch", { name: pt.branding.modes.label }));
    expect(preview()).toHaveClass("dark");
    expect(document.documentElement).not.toHaveClass("dark");
    expect(document.documentElement.getAttribute("style") ?? "").not.toContain("--primary");
  });

  it("previews a draft colour on the panel", () => {
    render(<BrandingScreen />);
    fireEvent.change(screen.getByLabelText("Primária"), { target: { value: "#ff0000" } });
    expect(preview().style.getPropertyValue("--primary")).toBe("#ff0000");
  });

  it("blocks save on an invalid colour and shows the error", async () => {
    render(<BrandingScreen />);
    fireEvent.change(screen.getByLabelText("Primária"), {
      target: { value: "color-mix(in oklch, red, blue)" },
    });
    fireEvent.click(screen.getByRole("button", { name: pt.branding.actions.save }));
    expect(await screen.findByText(pt.branding.errors.invalidColor)).toBeInTheDocument();
    expect(mocks.mutation.mutateAsync).not.toHaveBeenCalled();
  });

  it("switches to the Mode that holds the error", async () => {
    render(<BrandingScreen />);
    fireEvent.click(screen.getByRole("switch", { name: pt.branding.modes.label }));
    fireEvent.change(screen.getByLabelText("Primária"), { target: { value: "transparent" } });
    fireEvent.click(screen.getByRole("switch", { name: pt.branding.modes.label }));
    fireEvent.click(screen.getByRole("button", { name: pt.branding.actions.save }));
    await waitFor(() =>
      expect(screen.getByRole("switch", { name: pt.branding.modes.label })).toHaveAttribute(
        "aria-checked",
        "true",
      ),
    );
    expect(mocks.mutation.mutateAsync).not.toHaveBeenCalled();
  });

  it("saves valid edits and refreshes the page", async () => {
    render(<BrandingScreen />);
    fireEvent.change(screen.getByLabelText("Primária"), { target: { value: "#ff0000" } });
    fireEvent.click(screen.getByRole("button", { name: pt.branding.actions.save }));
    await waitFor(() => expect(mocks.mutation.mutateAsync).toHaveBeenCalledTimes(1));
    expect(mocks.mutation.mutateAsync.mock.calls[0][0].tokens.light["--primary"]).toBe("#ff0000");
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalled());
  });

  it("disables Guardar and Descartar until something changes", () => {
    render(<BrandingScreen />);
    expect(screen.getByRole("button", { name: pt.branding.actions.save })).toBeDisabled();
    expect(screen.getByRole("button", { name: pt.branding.actions.discard })).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `pnpm vitest run src/__tests__/branding/components/branding-screen.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the preview**

```tsx
// src/features/branding/components/live-preview.tsx
"use client";

import type { CSSProperties } from "react";
import Image from "next/image";

import type { IGRPBrandingMode } from "@igrp/framework-next-types";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  cn,
  Input,
  Label,
} from "@igrp/igrp-framework-react-design-system";
import { useTranslations } from "next-intl";

import type { BrandingFormValues, LogoSlotForm } from "../lib/branding-mapper";
import { previewStyle } from "../lib/live-preview";
import { useObjectUrl } from "./use-object-url";

const TILES = [1, 2, 3, 4, 5] as const;
const TILE_CLASSES: Record<(typeof TILES)[number], string> = {
  1: "bg-app-tile-1 text-app-tile-1-foreground",
  2: "bg-app-tile-2 text-app-tile-2-foreground",
  3: "bg-app-tile-3 text-app-tile-3-foreground",
  4: "bg-app-tile-4 text-app-tile-4-foreground",
  5: "bg-app-tile-5 text-app-tile-5-foreground",
};

function useSlotSrc(slot: LogoSlotForm, mode: IGRPBrandingMode): string {
  return useObjectUrl(mode === "dark" && slot.dark ? slot.dark : slot.light);
}

/**
 * The draft Brand on a panel of real components. Scoped by inline custom
 * properties and its own `dark` class; the page and the rest of the editor keep
 * the saved Brand. Limit: Tailwind `dark:` variants inside follow the page's
 * Mode, not the panel's, when the two differ.
 */
export function LivePreview({
  mode,
  tokens,
  logos,
}: {
  mode: IGRPBrandingMode;
  tokens: Record<string, string>;
  logos: BrandingFormValues["logos"];
}) {
  const t = useTranslations("branding.preview");
  const header = useSlotSrc(logos.header, mode);
  const wide = useSlotSrc(logos.wide, mode);

  return (
    <section
      aria-label={t("title")}
      className={cn(
        "flex flex-col gap-4 self-start rounded-xl border bg-background p-4 text-foreground lg:sticky lg:top-4",
        mode === "dark" && "dark",
      )}
      style={previewStyle(tokens, mode) as CSSProperties}
    >
      <div className="flex items-center gap-2 rounded-lg border bg-card p-2">
        {header ? (
          <Image src={header} alt="" width={32} height={32} unoptimized className="size-8 object-contain" />
        ) : (
          <span className="size-8 rounded-md bg-primary" aria-hidden="true" />
        )}
        <span className="text-sm font-medium">{t("appName")}</span>
      </div>

      <div className="flex gap-4">
        <nav className="flex w-36 shrink-0 flex-col gap-1 rounded-lg bg-sidebar p-2 text-sm text-sidebar-foreground">
          <span className="rounded-md bg-sidebar-active px-2 py-1 text-sidebar-active-foreground">
            {t("menuActive")}
          </span>
          <span className="rounded-md px-2 py-1">{t("menuItem")}</span>
        </nav>

        <Card className="min-w-0 flex-1">
          <CardHeader>
            <CardTitle>{t("cardTitle")}</CardTitle>
            <p className="text-sm text-muted-foreground">{t("cardBody")}</p>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <Button type="button" tabIndex={-1}>{t("primary")}</Button>
              <Button type="button" variant="secondary" tabIndex={-1}>{t("secondary")}</Button>
              <Button type="button" variant="destructive" tabIndex={-1}>{t("destructive")}</Button>
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("fieldLabel")}</Label>
              {/* Static focus look: a real focus would steal it from the editor. */}
              <Input readOnly tabIndex={-1} value={t("fieldValue")} className="border-ring ring-[3px] ring-ring/50" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-success text-success-foreground">{t("success")}</Badge>
              <Badge className="bg-warning text-warning-foreground">{t("warning")}</Badge>
              <Badge className="bg-info text-info-foreground">{t("info")}</Badge>
              <Badge className="bg-destructive text-destructive-foreground">{t("danger")}</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-success-subtle text-success-subtle-foreground">{t("success")}</Badge>
              <Badge className="bg-warning-subtle text-warning-subtle-foreground">{t("warning")}</Badge>
              <Badge className="bg-info-subtle text-info-subtle-foreground">{t("info")}</Badge>
              <Badge className="bg-destructive-subtle text-destructive-subtle-foreground">{t("danger")}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2" aria-hidden="true">
        {TILES.map((n) => (
          <span key={n} className={cn("flex size-10 items-center justify-center rounded-lg text-sm font-semibold", TILE_CLASSES[n])}>
            {n}
          </span>
        ))}
      </div>

      <div className="flex flex-col items-center gap-3 rounded-lg border bg-card p-6">
        {wide && (
          <Image
            src={wide}
            alt=""
            width={logos.wide.width ?? 160}
            height={logos.wide.height ?? 48}
            unoptimized
            className="h-auto max-h-20 w-auto"
          />
        )}
        <Button type="button" className="w-full" tabIndex={-1}>{t("login")}</Button>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Implement the screen**

```tsx
// src/features/branding/components/branding-screen.tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import type { IGRPBranding, IGRPBrandingMode } from "@igrp/framework-next-types";
import {
  Form,
  IGRPButton,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import { useTranslations } from "next-intl";
import { type FieldErrors, type Resolver, useForm } from "react-hook-form";

import { createBrandingSchema } from "../branding-schemas";
import { BRANDING_GROUPS } from "../catalog";
import {
  type BrandingFormValues,
  LOGO_SLOTS,
  toFormValues,
} from "../lib/branding-mapper";
import { BrandingSaveError } from "../lib/persist-branding";
import { useBrandingConfig, useSaveBranding } from "../use-branding";
import { LivePreview } from "./live-preview";
import { LogoField } from "./logo-field";
import { ModeSwitch } from "./mode-switch";
import { TokenGroup } from "./token-group";

type Tab = "colors" | "logos";

export function BrandingScreen() {
  const query = useBrandingConfig();
  if (query.isPending) return <Skeleton className="h-96 w-full" />;
  // Page-critical data: let the route error boundary handle it.
  if (query.isError) throw query.error;
  return <BrandingEditor saved={query.data} />;
}

function BrandingEditor({ saved }: { saved: IGRPBranding | null }) {
  const t = useTranslations("branding");
  const router = useRouter();
  const { igrpToast } = useIGRPToast();
  const save = useSaveBranding();
  const [mode, setMode] = useState<IGRPBrandingMode>("light");
  const [tab, setTab] = useState<Tab>("colors");

  const schema = useMemo(() => createBrandingSchema(t), [t]);
  const defaults = useMemo(() => toFormValues(saved), [saved]);
  const form = useForm<BrandingFormValues>({
    resolver: zodResolver(schema) as Resolver<BrandingFormValues>,
    defaultValues: defaults,
    mode: "onChange",
  });
  // A save refetches the Brand; the new saved values become the clean state.
  useEffect(() => form.reset(defaults), [defaults, form]);

  const draft = form.watch(`tokens.${mode}`);
  const logos = form.watch("logos");
  const { isDirty } = form.formState;

  function describe(error: unknown): string {
    if (!(error instanceof BrandingSaveError)) return t("errors.generic");
    switch (error.reason) {
      case "upload":
        return t("errors.upload", {
          slot: t(`logos.${error.detail as (typeof LOGO_SLOTS)[number]}.title`),
        });
      case "forbidden":
        return t("errors.forbidden");
      case "invalid":
        return t("errors.invalid");
      default:
        return error.detail || t("errors.generic");
    }
  }

  async function onValid(values: BrandingFormValues) {
    try {
      await save.mutateAsync(values);
      igrpToast({ type: "success", title: t("saved") });
      router.refresh();
    } catch (error) {
      igrpToast({ type: "error", title: t("errors.saveTitle"), description: describe(error) });
    }
  }

  // Show the first error: switch tab, then Mode, so it is never hidden.
  function onInvalid(errors: FieldErrors<BrandingFormValues>) {
    if (!errors.tokens) {
      setTab("logos");
      return;
    }
    setTab("colors");
    if (!errors.tokens[mode]) setMode(mode === "light" ? "dark" : "light");
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onValid, onInvalid)} className="flex flex-col gap-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)]">
          <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <TabsList>
                <TabsTrigger value="colors">{t("tabs.colors")}</TabsTrigger>
                <TabsTrigger value="logos">{t("tabs.logos")}</TabsTrigger>
              </TabsList>
              <ModeSwitch mode={mode} onChange={setMode} />
            </div>
            <TabsContent value="colors" className="flex flex-col gap-3">
              {BRANDING_GROUPS.map((group) => (
                <TokenGroup key={group.key} group={group} mode={mode} defaultOpen={group.key === "brand"} />
              ))}
            </TabsContent>
            <TabsContent value="logos" className="flex flex-col gap-4">
              {LOGO_SLOTS.map((slot) => (
                <LogoField key={slot} slot={slot} />
              ))}
            </TabsContent>
          </Tabs>

          <LivePreview mode={mode} tokens={draft} logos={logos} />
        </div>

        <div className="sticky bottom-4 flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground" role="status">
            {isDirty ? t("unsaved") : null}
          </p>
          <div className="flex flex-wrap gap-2">
            <IGRPButton
              type="button"
              variant="ghost"
              onClick={() => form.reset(toFormValues(null), { keepDefaultValues: true })}
            >
              {t("actions.reset")}
            </IGRPButton>
            <IGRPButton type="button" variant="outline" disabled={!isDirty} onClick={() => form.reset(defaults)}>
              {t("actions.discard")}
            </IGRPButton>
            <IGRPButton type="submit" disabled={!isDirty || save.isPending}>
              {save.isPending ? t("actions.saving") : t("actions.save")}
            </IGRPButton>
          </div>
        </div>
      </form>
    </Form>
  );
}
```

"Repor predefinições" sets every field to its Default but keeps the saved values as the clean state, so the form is dirty and nothing is saved until Guardar (spec §2).

- [ ] **Step 5: Run the tests and gates**

Run: `pnpm vitest run src/__tests__/branding && pnpm check:ui && pnpm typecheck`
Expected: PASS. If `useIGRPToast` needs a provider in tests, mock it in the screen test with `vi.mock` returning `{ igrpToast: vi.fn() }` alongside the real design-system exports (`...(await importOriginal())`).

- [ ] **Step 6: Commit**

```bash
pnpm lint
git add src/features/branding/components/live-preview.tsx src/features/branding/components/branding-screen.tsx src/__tests__/branding/components/branding-screen.test.tsx
git commit -m "feat(branding): add the live preview and the Brand editor screen"
```

---

### Task 11: Route, settings card and invite logo

**Files:**
- Create: `src/app/(igrp)/(home)/settings/customization/page.tsx`, `loading.tsx`, `error.tsx`, `forbidden.tsx`
- Modify: `src/app/(igrp)/(home)/settings/page.tsx`
- Create: `src/app/(invite)/brand-logo.tsx`; Modify: `src/app/(invite)/layout.tsx`
- Modify: `src/__tests__/i18n/literal-strings.test.ts:20-30`
- Test: `src/__tests__/branding/customization-page.test.tsx`

**Interfaces:**
- Consumes: `isBrandingEnabled`, `CUSTOMIZE_PERMISSION` (Task 2), `BrandingScreen` (Task 10), `useIGRPBranding` (`@igrp/framework-next-ui`).

- [ ] **Step 1: Write the failing test**

```tsx
// src/__tests__/branding/customization-page.test.tsx
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ assert: vi.fn() }));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));
vi.mock("@igrp/framework-next", () => ({
  igrpAssertAuthorize: (name: string) => mocks.assert(name),
}));
vi.mock("@/features/branding/components/branding-screen", () => ({
  BrandingScreen: () => null,
}));

import CustomizationPage from "@/app/(igrp)/(home)/settings/customization/page";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("IGRP_PREVIEW_MODE", "false");
  vi.stubEnv("AUTH_PROVIDER", "igrp-auth");
});
afterEach(() => vi.unstubAllEnvs());

describe("/settings/customization", () => {
  it("is not found when the flag is off, before any permission check", async () => {
    vi.stubEnv("IGRP_BRANDING_ENABLED", "false");
    await expect(CustomizationPage()).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mocks.assert).not.toHaveBeenCalled();
  });

  it("is not found when auth is bypassed", async () => {
    vi.stubEnv("IGRP_BRANDING_ENABLED", "true");
    vi.stubEnv("AUTH_PROVIDER", "none");
    await expect(CustomizationPage()).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("asserts the customize permission when enabled", async () => {
    vi.stubEnv("IGRP_BRANDING_ENABLED", "true");
    await CustomizationPage();
    expect(mocks.assert).toHaveBeenCalledWith("igrp.applications.customize");
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `pnpm vitest run src/__tests__/branding/customization-page.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the route**

```tsx
// src/app/(igrp)/(home)/settings/customization/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { igrpAssertAuthorize } from "@igrp/framework-next";
import { getTranslations } from "next-intl/server";

import { BrandingScreen } from "@/features/branding/components/branding-screen";
import { CUSTOMIZE_PERMISSION } from "@/lib/constants";
import { isBrandingEnabled } from "@/lib/utilities";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("branding.meta");
  return { title: t("title"), description: t("description") };
}

/* Flag off or auth bypassed: the route does not exist (spec §7.4). Then the
   in-chrome 403 for users without the permission. The actions check again;
   the AM API is the real enforcement. */
export default async function CustomizationPage() {
  if (!isBrandingEnabled()) notFound();
  await igrpAssertAuthorize(CUSTOMIZE_PERMISSION);
  return <BrandingScreen />;
}
```

```tsx
// src/app/(igrp)/(home)/settings/customization/loading.tsx
import { Skeleton } from "@igrp/igrp-framework-react-design-system";

/** Shaped like the editor: header, tabs with the mode switch, groups, preview. */
export default function Loading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)]">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-9 w-48" />
          {Array.from({ length: 6 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton loader
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}
```

```tsx
// src/app/(igrp)/(home)/settings/customization/error.tsx
"use client";

import { useEffect } from "react";

import { useTranslations } from "next-intl";

import { StatusAwareError } from "@/components/errors/status-aware-error";
import { InlineError } from "@/components/inline-error";

export default function CustomizationError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("branding.errors");
  useEffect(() => {
    console.error("[customization-segment] error:", error);
  }, [error]);

  return (
    <StatusAwareError
      error={error}
      fallback={<InlineError title={t("load")} message={t("generic")} onRetry={reset} />}
    />
  );
}
```

```tsx
// src/app/(igrp)/(home)/settings/customization/forbidden.tsx
import { IGRPForbidden } from "@igrp/framework-next-ui";
import { getTranslations } from "next-intl/server";

/* Replaces the (igrp) 403 for this segment only. */
export default async function CustomizationForbidden() {
  const t = await getTranslations("branding.forbidden");
  return <IGRPForbidden description={t("description")} />;
}
```

- [ ] **Step 4: Activate the settings card**

In `src/app/(igrp)/(home)/settings/page.tsx`:
- Add `import { isBrandingEnabled } from "@/lib/utilities";`.
- In the `customizacao` entry, delete `status: "inativo",`, and replace the comment above it with:
  `/* Active only when the Brand editor is (isBrandingEnabled); otherwise rendered as a plain, non-focusable div with the "Em breve" badge. */`
- In `SettingsPage`, change the `.map` to:

```tsx
    .map(({ key, ...item }) => ({
      ...item,
      ...(key === "customization" && !isBrandingEnabled()
        ? { status: "inativo" as const }
        : {}),
      title: t(`items.${key}.title`),
      description: t(`items.${key}.description`),
    }));
```

- [ ] **Step 5: Wide logo on invite pages**

```tsx
// src/app/(invite)/brand-logo.tsx
"use client";

import Image from "next/image";

import { useIGRPBranding } from "@igrp/framework-next-ui";
import { useTranslations } from "next-intl";

/** The Brand's wide logo on public invite pages (spec §2); nothing when unset. */
export function InviteBrandLogo() {
  const t = useTranslations("branding");
  const wide = useIGRPBranding()?.logos.wide;
  if (!wide) return null;
  const size = { width: wide.width ?? 160, height: wide.height ?? 48 };
  return (
    <div className="fixed top-4 left-4 z-10">
      <Image
        src={wide.light}
        alt={t("logoAlt")}
        {...size}
        unoptimized
        className={wide.dark ? "h-auto max-h-20 w-auto dark:hidden" : "h-auto max-h-20 w-auto"}
      />
      {wide.dark && (
        <Image
          src={wide.dark}
          alt={t("logoAlt")}
          {...size}
          unoptimized
          className="hidden h-auto max-h-20 w-auto dark:block"
        />
      )}
    </div>
  );
}
```

In `src/app/(invite)/layout.tsx`, import `InviteBrandLogo` from `./brand-logo` and render `<InviteBrandLogo />` as the first child inside `<IGRPQueryProvider>`.

- [ ] **Step 6: Add the folders to the literal-strings guard**

In `src/__tests__/i18n/literal-strings.test.ts`, append to `MIGRATED_FOLDERS`:

```ts
  "src/features/branding",
  "src/app/(igrp)/(home)/settings/customization",
```

- [ ] **Step 7: Run the tests and gates**

Run: `pnpm vitest run src/__tests__/branding src/__tests__/i18n src/__tests__/settings && pnpm check:ui && pnpm typecheck`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
pnpm lint
git add "src/app/(igrp)/(home)/settings/customization" "src/app/(igrp)/(home)/settings/page.tsx" "src/app/(invite)/brand-logo.tsx" "src/app/(invite)/layout.tsx" src/__tests__/i18n/literal-strings.test.ts src/__tests__/branding/customization-page.test.tsx
git commit -m "feat(branding): add the /settings/customization route, activate its card and brand the invite pages"
```

---

### Task 12: Docs, spec corrections and verification

**Files:**
- Modify: `docs/TOKENS.md` (rewrite)
- Modify: `docs/superpowers/specs/2026-10-13-platform-branding-design.md` (§7.2, §8.2, §8.5, §13, §15)
- No change: `docs/adr/0003-brand-read-with-session-token.md` (the ADR pointer from spec §7.4 is already committed)

- [ ] **Step 1: Rewrite `docs/TOKENS.md`**

Replace the whole file with:

```markdown
# Design tokens (CSS variables)

## Where values come from, in order of precedence

1. **Organization Brand** (when `IGRP_BRANDING_ENABLED=true`). Saved in the
   editor at `/settings/customization` and applied by `@igrp/framework-next` as
   a `<style data-igrp-branding>` at the top of `<body>`, with selectors
   `html:root:not(.dark)` (light) and `html:root.dark` (dark). Specificity
   (0,2,1) beats every `:root` / `.dark` rule below, whatever the stylesheet order.
2. **This app's local tokens** in `src/styles/app-center.css` (`:root` and
   `.dark`): the app-tier Tokens and a deliberate AA override of `--ring`.
3. **Design-system tokens** from `@igrp/igrp-framework-react-design-system/tokens`,
   imported in `src/styles/globals.css`.

A Token the Brand leaves unset keeps its value from 2 or 3 (its Default).

## Catalogs the editor offers

- **Core** (50): `IGRP_BRANDING_CORE_TOKENS` in `@igrp/framework-next-ui`,
  grouped Brand, Surfaces, Text, Status, Sidebar, Charts, Other. `--radius` is
  not editable.
- **App tier** (23): `src/features/branding/app-tokens.ts` — subtle status
  pairs, app tiles, `--favorite` and the scrollbar. Sibling apps ignore them.

The editor's placeholders come from `src/features/branding/token-defaults.ts`,
generated from 2 and 3 by `pnpm branding:defaults`. Re-run it after a
design-system bump or an edit to `app-center.css`; the catalog test fails
while it is stale.

## Rules for saved values

The editor saves only concrete colours (hex, `rgb`, `hsl`, `oklch`, `oklab`,
`lab`, `lch`, named) and stores them as `oklch(L C H[ / A])`. Logos must be
uploaded through the editor (MinIO). See the
[design spec](superpowers/specs/2026-10-13-platform-branding-design.md) §9.

## Changing a Default

Edit `app-center.css` (app tier, `--ring`) or the design system, then run
`pnpm branding:defaults`. Keep the AA contrast notes in `app-center.css`.
```

- [ ] **Step 2: Correct the stale spec text**

In `docs/superpowers/specs/2026-10-13-platform-branding-design.md`:

- §7.2, `igrpBrandingToCss` bullet: replace `emits \`html:root { … }\` and \`html.dark { … }\` blocks` with `emits \`html:root:not(.dark) { … }\` and \`html:root.dark { … }\` blocks`.
- §7.2, `IGRPBrandingStyle` bullet: replace the sentence about `<style href="igrp-branding" precedence="igrp-branding">` with: `renders a plain \`<style data-igrp-branding>\` as the first child of \`<body>\`. Not a hoisted \`href\`/\`precedence\` resource: React dedupes those by \`href\` and would keep the old Tokens after \`router.refresh()\` delivers a new Brand.`
- §8.2, add a bullet: `- Fetches are deduplicated per \`baseUrl\` (cold or warm). Each \`igrp_brand_v\` value forces at most one refetch, and values older than 300 s or more than 30 s in the future are ignored.`
- §8.5: replace `The stylesheet uses \`html:root\` and \`html.dark\` selectors, specificity (0,1,1).` with `The stylesheet uses \`html:root:not(.dark)\` and \`html:root.dark\` selectors, specificity (0,2,1). The light block excludes \`.dark\` so a light-only Token never replaces a dark Default.`
- §13, framework list: replace `\`html:root\` and \`html.dark\` selectors` with `\`html:root:not(.dark)\` and \`html:root.dark\` selectors`.
- §15, "Local overrides" bullet: replace `The \`html:root\` selector (section 8)` with `The \`html:root:not(.dark)\` / \`html:root.dark\` selectors (section 8)`.
- §15, "Hydration" bullet: replace it with `- **Hydration.** The Brand style is a plain in-body \`<style>\`; its CSS text is byte-stable between server and client because keys are sorted.`

- [ ] **Step 3: Full gates**

Run: `pnpm check:ui && pnpm typecheck && pnpm test 2>&1 | tail -40`
Expected: `check:ui` and `typecheck` PASS; `test` shows only the baseline failures recorded in Task 1.

- [ ] **Step 4: Browser check (needs a reachable Access Management API and a user with `igrp.applications.customize`)**

With `IGRP_BRANDING_ENABLED=true` in `.env`, start the dev server (`.claude/launch.json`, or `pnpm dev`) and sign in.
1. `/settings` shows the Customização card as a link. With the flag off it shows "Em breve" and `/settings/customization` is a 404.
2. In the editor, set light `--ring` to `#ff0000` and light `--favorite` to `#00aa00`; watch the preview change; Guardar.
3. After the refresh, in the browser console: `getComputedStyle(document.documentElement).getPropertyValue('--ring')` returns `oklch(0.628 0.2577 29.2339)`, and `document.querySelector('style[data-igrp-branding]').textContent` starts with `html:root:not(.dark){`. This confirms the Brand beats the `--ring` override in `app-center.css` (spec §15).
4. Switch the page to dark: `--ring` returns the dark Default from `app-center.css` (`oklch(0.72 0.06 256.788)`), since only light was set.
5. Upload a header mark and a favicon; after save the header and the tab icon change.
6. "Repor predefinições", then Descartar: the fields return to the saved values; nothing was saved.

If the backend is not reachable, say so in the hand-off and list this step as not verified.

- [ ] **Step 5: Commit**

```bash
git add docs/TOKENS.md docs/superpowers/specs/2026-10-13-platform-branding-design.md
git commit -m "docs(branding): describe the Brand editor in TOKENS.md and correct the spec's selector text"
```

---

## Out of scope (follow-ups)

- `FileUploadField` has hardcoded Portuguese strings (`aria-label`, the format hint, "Remove file"); en/fr users see them in the logo tab. Translate the shared component separately.
- The settings card is active for every user once the flag is on; users without the permission get the 403 page. Hiding it per permission (like the audit card) is a product call not in the spec.
- The backend M2M GET endpoint (spec §14 step 4) and the contrast warning (spec §15).
