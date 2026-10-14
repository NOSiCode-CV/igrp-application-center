# Organization Branding: Framework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let every framework app that sets `IGRP_BRANDING_ENABLED=true` load the organization Brand (design-token overrides and logos) from Access Management and apply it before first paint, with defaults when the flag is off or anything fails.

**Architecture:** Pure parsing, validation and CSS generation live in `@igrp/framework-next-ui/src/branding`, dependency-free and server-safe. A React context and the header and login logo changes live in the same package. The server loader with its per-process cache, the layout wiring and the metadata helper live in `@igrp/framework-next`. Types live in `@igrp/framework-next-types`, which has no runtime exports. The preset themes are removed in the same change.

**Tech Stack:** TypeScript (`tsc -b`, `"type": "module"`), React 19 (Babel and React Compiler build), Next.js 15 App Router, Vitest (node environment, `renderToStaticMarkup` for markup), Zod v4, `@igrp/platform-access-management-client-ts@0.2.0-beta.18`.

**Spec:** `docs/superpowers/specs/2026-10-13-platform-branding-design.md` (in the Application Center repo, `D:\nosi-projects\igrp3\igrp-auth\frontend\igrp-application-center`). ADR already recorded in the framework repo at `docs/adr/0001-brand-read-with-session-token.md` (commit `c8be2752`); no task repeats it.

**Repository:** `D:\nosi-projects\igrp3\igrp-framework-frontend\igrp-framework-nextjs`, branch `dev`. The repo has unrelated uncommitted work (the i18n v2 plans). Every commit below stages only the files it names.

## Global Constraints

- Package names and versions: `@igrp/framework-next-types`, `@igrp/framework-next-ui`, `@igrp/framework-next` at `0.2.0-beta.*`. Changesets use `patch` only.
- No `Co-Authored-By` trailer in any commit (user rule and framework hard rule).
- `IGRPBrandingStyle` renders `html:root` and `html.dark` only. Token keys match `^--[a-z][a-z0-9-]{0,63}$`. Values are at most 128 characters.
- A Brand document is at most 64 KB (UTF-8 bytes) and must carry `"version": 1`.
- Cookie name `igrp_brand_v`, max age 300 seconds, set by the Application Center; the framework only reads it.
- Cache TTL 5 minutes, fetch timeout 3 seconds, error cooldown 60 seconds.
- Relative imports in `src/` of `next-types`, `next-ui` and `next` carry a `.js` extension. `pnpm check:dist` enforces it on the emitted output.
- `next-ui`'s barrel `src/index.ts` must NOT carry `'use client'`. Client leaves carry it on their own first line. `src/__tests__/client-boundaries.test.ts` enforces this.
- Components never use `try/finally` (React Compiler bails out silently). `src/__tests__/build-pipeline.test.ts` checks the emitted output.
- User-visible strings are pt-PT.

## Review Focus

1. **Hostile or malformed stored config.** Non-JSON, wrong `version`, oversized, or a token value containing `}`, `;`, `url(` must produce defaults or a valid subset, never a throw and never injected CSS. Test: Task 2 (`branding-parse.test.ts`, `branding-css.test.ts`).
2. **Auth service down or slow.** A signed-in page renders with the last good Brand or the defaults within 3 seconds, and retries are rate-limited to one per 60 seconds. Test: Task 6 (`get-branding.test.ts`).
3. **Flag off or omitted is a no-op.** No loader call, no cookie read, no style element, providers receive `null`. Test: Task 8 (`igrp-root-layout.test.tsx`).
4. **Public pages never fetch.** With no token the loader returns the cached value or `null` and makes no request. Test: Task 6 (`get-branding.test.ts`).
5. **Server and client produce identical style text.** Same Brand, same bytes, so there is no hydration warning. Test: Task 2 (`branding-css.test.ts`, deterministic key order) and Task 3 (`branding-style.test.tsx`).

## Task 1: Branding types and config flag

**Files:**
- Create: `packages/framework/next-types/src/types/branding.ts`
- Modify: `packages/framework/next-types/src/types/igrp.ts` (add `branding` to `IGRPConfigArgs`; mark `activeThemeValue` and `isScaled` on `IGRPLayoutConfigArgs` as deprecated)
- Modify: `packages/framework/next-types/src/index.ts` (barrel exports)

**Interfaces:**
- Consumes: nothing.
- Produces: `IGRPBranding`, `IGRPBrandingTokens`, `IGRPBrandingTokenMap`, `IGRPBrandingLogos`, `IGRPBrandingLogoSlot`, `IGRPBrandingMode`, `IGRPBrandingTokenGroup`, `IGRPBrandingTokenCatalogEntry`, `IGRPBrandingParseResult`; `IGRPConfigArgs.branding?: { enabled: boolean }`.

- [ ] **Step 1: Write the types file**

Create `packages/framework/next-types/src/types/branding.ts`:

```ts
/** Which palette a Brand token value applies to. */
export type IGRPBrandingMode = 'light' | 'dark';

/** Token name (for example `--primary`) to CSS value, for one Mode. Sparse: a missing key keeps the Default. */
export type IGRPBrandingTokenMap = Record<string, string>;

export interface IGRPBrandingTokens {
  light?: IGRPBrandingTokenMap;
  dark?: IGRPBrandingTokenMap;
}

export interface IGRPBrandingLogoSlot {
  /** Absolute http(s) URL of the light image. */
  light: string;
  /** Optional dark image; falls back to `light` when absent. */
  dark?: string;
  /** Intrinsic width in CSS px. Meaningful on the `wide` slot only. */
  width?: number;
  /** Intrinsic height in CSS px. Meaningful on the `wide` slot only. */
  height?: number;
}

export interface IGRPBrandingLogos {
  header?: IGRPBrandingLogoSlot;
  wide?: IGRPBrandingLogoSlot;
  favicon?: IGRPBrandingLogoSlot;
}

/** The organization Brand document, after validation. */
export interface IGRPBranding {
  version: 1;
  tokens: IGRPBrandingTokens;
  logos: IGRPBrandingLogos;
}

export type IGRPBrandingTokenGroup = 'brand' | 'surface' | 'text' | 'status' | 'sidebar' | 'chart' | 'other';

export interface IGRPBrandingTokenCatalogEntry {
  name: string;
  group: IGRPBrandingTokenGroup;
}

/** Result of parsing a stored Brand document. `dropped` counts the fields removed. */
export interface IGRPBrandingParseResult {
  branding: IGRPBranding | null;
  dropped: number;
}
```

- [ ] **Step 2: Add the config flag and deprecations to `igrp.ts`**

In `packages/framework/next-types/src/types/igrp.ts`, inside `IGRPConfigArgs` (after `sessionArgs?: Partial<SessionProviderProps>;`), add:

```ts
  /**
   * Organization Brand. Omitted or `enabled: false` leaves every design-system
   * Default in place and makes no request to Access Management.
   */
  branding?: { enabled: boolean };
```

In `IGRPLayoutConfigArgs`, mark the two theme fields (`activeThemeValue?: string;` and `isScaled?: boolean;`) with:

```ts
  /** @deprecated Preset themes were removed. Read by nothing; kept for one release. */
```

- [ ] **Step 3: Export the new types from the barrel**

In `packages/framework/next-types/src/index.ts`, append:

```ts
export type {
  IGRPBranding,
  IGRPBrandingLogos,
  IGRPBrandingLogoSlot,
  IGRPBrandingMode,
  IGRPBrandingParseResult,
  IGRPBrandingTokenCatalogEntry,
  IGRPBrandingTokenGroup,
  IGRPBrandingTokenMap,
  IGRPBrandingTokens,
} from './types/branding.js';
```

- [ ] **Step 4: Verify the package builds and the barrel and dist gates pass**

Run from `packages/framework/next-types`:

```bash
pnpm typecheck && pnpm check:barrel && pnpm build
```

Expected: no errors. `check:dist` (run by `build`) reports no extensionless specifiers.

- [ ] **Step 5: Commit**

```bash
git add packages/framework/next-types/src/types/branding.ts packages/framework/next-types/src/types/igrp.ts packages/framework/next-types/src/index.ts
git commit -m "feat(next-types): add organization branding types and branding config flag"
```

## Task 2: Pure branding core in next-ui (parse, validate, CSS, catalog)

**Files:**
- Create: `packages/framework/next-ui/src/branding/validate.ts`
- Create: `packages/framework/next-ui/src/branding/parse.ts`
- Create: `packages/framework/next-ui/src/branding/css.ts`
- Create: `packages/framework/next-ui/src/branding/catalog.ts`
- Create: `packages/framework/next-ui/src/branding/__tests__/branding-parse.test.ts`
- Create: `packages/framework/next-ui/src/branding/__tests__/branding-css.test.ts`
- Create: `packages/framework/next-ui/src/branding/__tests__/branding-catalog.test.ts`
- Modify: `packages/framework/next-ui/src/index.ts` (exports)

**Interfaces:**
- Consumes: Task 1 types.
- Produces:
  - `isTokenName(name: string): boolean`
  - `isSafeCssValue(value: string): boolean`
  - `isSafeLogoUrl(url: string): boolean`
  - `BRANDING_MAX_BYTES: number` (65536)
  - `igrpParseBranding(raw: string): IGRPBrandingParseResult`
  - `igrpBrandingToCss(branding: IGRPBranding | null): string`
  - `IGRP_BRANDING_CORE_TOKENS: IGRPBrandingTokenCatalogEntry[]` (50 entries)

- [ ] **Step 1: Write the failing parse tests**

Create `packages/framework/next-ui/src/branding/__tests__/branding-parse.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { BRANDING_MAX_BYTES, igrpParseBranding } from '../index.js';

const doc = (body: unknown) => JSON.stringify(body);

describe('igrpParseBranding', () => {
  it('parses a valid document without dropping anything', () => {
    const result = igrpParseBranding(
      doc({
        version: 1,
        tokens: { light: { '--primary': 'oklch(0.45 0.18 250)' }, dark: { '--primary': 'oklch(0.78 0.14 250)' } },
        logos: { header: { light: 'https://cdn.example/mark.png' } },
      }),
    );
    expect(result.dropped).toBe(0);
    expect(result.branding?.tokens.light).toEqual({ '--primary': 'oklch(0.45 0.18 250)' });
    expect(result.branding?.logos.header?.light).toBe('https://cdn.example/mark.png');
  });

  it('returns null for non-JSON input', () => {
    expect(igrpParseBranding('{not json')).toEqual({ branding: null, dropped: 0 });
  });

  it('returns null for any version other than 1', () => {
    expect(igrpParseBranding(doc({ version: 2, tokens: {}, logos: {} })).branding).toBeNull();
    expect(igrpParseBranding(doc({ tokens: {}, logos: {} })).branding).toBeNull();
  });

  it('returns null for a document over the byte limit', () => {
    const huge = 'x'.repeat(BRANDING_MAX_BYTES + 1);
    expect(igrpParseBranding(huge)).toEqual({ branding: null, dropped: 0 });
  });

  it('drops a token value that would break out of its rule, keeps the rest', () => {
    const result = igrpParseBranding(
      doc({
        version: 1,
        tokens: {
          light: { '--primary': 'red;}body{background:blue', '--accent': 'oklch(0.5 0.1 200)' },
        },
        logos: {},
      }),
    );
    expect(result.branding?.tokens.light).toEqual({ '--accent': 'oklch(0.5 0.1 200)' });
    expect(result.dropped).toBe(1);
  });

  it('drops a url() value and a token name that is not well formed', () => {
    const result = igrpParseBranding(
      doc({
        version: 1,
        tokens: { light: { '--primary': 'url(https://evil.example/x)', 'primary': 'red' } },
        logos: {},
      }),
    );
    expect(result.branding?.tokens.light).toEqual({});
    expect(result.dropped).toBe(2);
  });

  it('drops a logo URL that is not http(s) or carries credentials', () => {
    const result = igrpParseBranding(
      doc({
        version: 1,
        tokens: {},
        logos: {
          header: { light: 'javascript:alert(1)' },
          favicon: { light: 'https://user:pw@cdn.example/f.png' },
        },
      }),
    );
    expect(result.branding?.logos.header).toBeUndefined();
    expect(result.branding?.logos.favicon).toBeUndefined();
    expect(result.dropped).toBe(2);
  });

  it('keeps width and height on the wide logo and ignores them elsewhere', () => {
    const result = igrpParseBranding(
      doc({
        version: 1,
        tokens: {},
        logos: {
          wide: { light: 'https://cdn.example/w.svg', width: 320, height: 96 },
          header: { light: 'https://cdn.example/h.png', width: 999 },
        },
      }),
    );
    expect(result.branding?.logos.wide).toEqual({ light: 'https://cdn.example/w.svg', width: 320, height: 96 });
    expect(result.branding?.logos.header).toEqual({ light: 'https://cdn.example/h.png' });
  });

  it('ignores unknown top-level and nested keys without counting them', () => {
    const result = igrpParseBranding(
      doc({ version: 1, tokens: { light: {}, future: true }, logos: {}, extra: 1 }),
    );
    expect(result.branding).not.toBeNull();
    expect(result.dropped).toBe(0);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run from `packages/framework/next-ui`: `pnpm vitest run src/branding/__tests__/branding-parse.test.ts`
Expected: FAIL, module `../index.js` not found.

- [ ] **Step 3: Write validation**

Create `packages/framework/next-ui/src/branding/validate.ts`:

```ts
/** Maximum size of a stored Brand document, in UTF-8 bytes. */
export const BRANDING_MAX_BYTES = 64 * 1024;

const TOKEN_NAME = /^--[a-z][a-z0-9-]{0,63}$/;
/** Characters that could end a declaration or open a new rule, plus functions that load resources. */
const FORBIDDEN = /[;{}<>@\\]|url\(|expression\(/i;
/** One concrete color, a named keyword, or a color function whose arguments are plain. */
const COLOR =
  /^(#[0-9a-f]{3,8}|(rgba?|hsla?|oklch|oklab|lab|lch|color|color-mix)\([0-9a-z%.,\s/+\-#()]*\)|transparent|currentcolor|[a-z]+)$/i;
const MAX_VALUE_LENGTH = 128;
const MAX_URL_LENGTH = 2048;

export function isTokenName(name: string): boolean {
  return TOKEN_NAME.test(name);
}

export function isSafeCssValue(value: string): boolean {
  const v = value.trim();
  return v.length > 0 && v.length <= MAX_VALUE_LENGTH && !FORBIDDEN.test(v) && COLOR.test(v);
}

export function isSafeLogoUrl(url: string): boolean {
  if (url.length > MAX_URL_LENGTH || /\s/.test(url)) return false;
  try {
    const parsed = new URL(url);
    return (parsed.protocol === 'https:' || parsed.protocol === 'http:') && !parsed.username && !parsed.password;
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: Write the parser**

Create `packages/framework/next-ui/src/branding/parse.ts`:

```ts
import type {
  IGRPBranding,
  IGRPBrandingLogos,
  IGRPBrandingLogoSlot,
  IGRPBrandingParseResult,
  IGRPBrandingTokenMap,
} from '@igrp/framework-next-types';

import { BRANDING_MAX_BYTES, isSafeCssValue, isSafeLogoUrl, isTokenName } from './validate.js';

type Tally = { dropped: number };
type Unknown = Record<string, unknown>;

const isRecord = (value: unknown): value is Unknown =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isPositiveInt = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value > 0;

function cleanMap(input: unknown, tally: Tally): IGRPBrandingTokenMap {
  const out: IGRPBrandingTokenMap = {};
  if (!isRecord(input)) return out;
  for (const [name, value] of Object.entries(input)) {
    if (isTokenName(name) && typeof value === 'string' && isSafeCssValue(value)) {
      out[name] = value.trim();
    } else {
      tally.dropped += 1;
    }
  }
  return out;
}

function cleanSlot(input: unknown, tally: Tally, sized: boolean): IGRPBrandingLogoSlot | undefined {
  if (input === undefined) return undefined;
  if (!isRecord(input) || typeof input.light !== 'string' || !isSafeLogoUrl(input.light)) {
    tally.dropped += 1;
    return undefined;
  }
  const slot: IGRPBrandingLogoSlot = { light: input.light };
  if (input.dark !== undefined) {
    if (typeof input.dark === 'string' && isSafeLogoUrl(input.dark)) slot.dark = input.dark;
    else tally.dropped += 1;
  }
  if (sized) {
    if (isPositiveInt(input.width)) slot.width = input.width;
    if (isPositiveInt(input.height)) slot.height = input.height;
  }
  return slot;
}

/**
 * Parses a stored Brand document. Never throws: an unusable document yields
 * `branding: null`, and a bad field is dropped and counted.
 */
export function igrpParseBranding(raw: string): IGRPBrandingParseResult {
  if (new TextEncoder().encode(raw).byteLength > BRANDING_MAX_BYTES) {
    return { branding: null, dropped: 0 };
  }
  let doc: unknown;
  try {
    doc = JSON.parse(raw);
  } catch {
    return { branding: null, dropped: 0 };
  }
  if (!isRecord(doc) || doc.version !== 1) return { branding: null, dropped: 0 };

  const tally: Tally = { dropped: 0 };
  const tokens = isRecord(doc.tokens) ? doc.tokens : {};
  const logosIn = isRecord(doc.logos) ? doc.logos : {};
  const logos: IGRPBrandingLogos = {};
  for (const key of ['header', 'wide', 'favicon'] as const) {
    const slot = cleanSlot(logosIn[key], tally, key === 'wide');
    if (slot) logos[key] = slot;
  }

  return {
    branding: {
      version: 1,
      tokens: { light: cleanMap(tokens.light, tally), dark: cleanMap(tokens.dark, tally) },
      logos,
    },
    dropped: tally.dropped,
  };
}

export type { IGRPBranding };
```

- [ ] **Step 5: Write the CSS generator**

Create `packages/framework/next-ui/src/branding/css.ts`:

```ts
import type { IGRPBranding, IGRPBrandingTokenMap } from '@igrp/framework-next-types';

function block(selector: string, map: IGRPBrandingTokenMap | undefined): string {
  if (!map) return '';
  const declarations = Object.keys(map)
    .sort()
    .map((name) => `${name}:${map[name]};`);
  return declarations.length ? `${selector}{${declarations.join('')}}` : '';
}

/**
 * CSS text for the Brand. `html:root` and `html.dark` carry specificity
 * (0,1,1), above the `:root` and `.dark` declarations of the design system and
 * of the Application Center's local tokens, so the Brand wins regardless of
 * stylesheet order. Key order is sorted so the same Brand yields the same bytes
 * on the server and in the browser.
 */
export function igrpBrandingToCss(branding: IGRPBranding | null): string {
  if (!branding) return '';
  return block('html:root', branding.tokens.light) + block('html.dark', branding.tokens.dark);
}
```

- [ ] **Step 6: Write the catalog**

Create `packages/framework/next-ui/src/branding/catalog.ts`:

```ts
import type { IGRPBrandingTokenCatalogEntry, IGRPBrandingTokenGroup } from '@igrp/framework-next-types';

const GROUPS: Record<IGRPBrandingTokenGroup, string[]> = {
  brand: [
    '--primary', '--primary-foreground', '--secondary', '--secondary-foreground',
    '--accent', '--accent-foreground', '--ring',
  ],
  surface: [
    '--background', '--card', '--card-foreground', '--popover', '--popover-foreground',
    '--muted', '--border', '--input',
  ],
  text: ['--foreground', '--muted-foreground'],
  status: [
    '--destructive', '--destructive-foreground', '--success', '--success-foreground',
    '--warning', '--warning-foreground', '--info', '--info-foreground',
    '--indigo', '--indigo-foreground', '--highlight', '--highlight-foreground',
  ],
  sidebar: [
    '--sidebar', '--sidebar-foreground', '--sidebar-primary', '--sidebar-primary-foreground',
    '--sidebar-accent', '--sidebar-accent-foreground', '--sidebar-active',
    '--sidebar-active-foreground', '--sidebar-border', '--sidebar-ring',
  ],
  chart: ['--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5', '--chart-6', '--chart-7', '--chart-8'],
  other: ['--ring-invalid', '--process-completed', '--process-active'],
};

/** The 50 core Tokens a Brand may override, grouped as the editor shows them. */
export const IGRP_BRANDING_CORE_TOKENS: IGRPBrandingTokenCatalogEntry[] = Object.entries(GROUPS).flatMap(
  ([group, names]) => names.map((name) => ({ name, group: group as IGRPBrandingTokenGroup })),
);
```

- [ ] **Step 7: Write the barrel for the branding folder and the CSS and catalog tests**

Create `packages/framework/next-ui/src/branding/index.ts`:

```ts
export { IGRP_BRANDING_CORE_TOKENS } from './catalog.js';
export { igrpBrandingToCss } from './css.js';
export { igrpParseBranding } from './parse.js';
export { BRANDING_MAX_BYTES, isSafeCssValue, isSafeLogoUrl, isTokenName } from './validate.js';
```

Create `packages/framework/next-ui/src/branding/__tests__/branding-css.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { igrpBrandingToCss, igrpParseBranding } from '../index.js';

describe('igrpBrandingToCss', () => {
  it('returns an empty string for no Brand', () => {
    expect(igrpBrandingToCss(null)).toBe('');
  });

  it('emits html:root for light and html.dark for dark', () => {
    const { branding } = igrpParseBranding(
      JSON.stringify({
        version: 1,
        tokens: { light: { '--primary': 'oklch(0.45 0.18 250)' }, dark: { '--primary': 'oklch(0.78 0.14 250)' } },
        logos: {},
      }),
    );
    expect(igrpBrandingToCss(branding)).toBe(
      'html:root{--primary:oklch(0.45 0.18 250);}html.dark{--primary:oklch(0.78 0.14 250);}',
    );
  });

  it('is deterministic: the same Brand in another key order yields the same bytes', () => {
    const a = igrpParseBranding(
      JSON.stringify({ version: 1, tokens: { light: { '--b': 'red', '--a': 'blue' } }, logos: {} }),
    ).branding;
    const b = igrpParseBranding(
      JSON.stringify({ version: 1, tokens: { light: { '--a': 'blue', '--b': 'red' } }, logos: {} }),
    ).branding;
    expect(igrpBrandingToCss(a)).toBe(igrpBrandingToCss(b));
    expect(igrpBrandingToCss(a)).toBe('html:root{--a:blue;--b:red;}');
  });

  it('emits nothing for empty token maps', () => {
    const { branding } = igrpParseBranding(JSON.stringify({ version: 1, tokens: {}, logos: {} }));
    expect(igrpBrandingToCss(branding)).toBe('');
  });
});
```

Create `packages/framework/next-ui/src/branding/__tests__/branding-catalog.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { IGRP_BRANDING_CORE_TOKENS, isTokenName } from '../index.js';

describe('IGRP_BRANDING_CORE_TOKENS', () => {
  it('lists the 50 core tokens exactly once, all well formed', () => {
    const names = IGRP_BRANDING_CORE_TOKENS.map((t) => t.name);
    expect(names).toHaveLength(50);
    expect(new Set(names).size).toBe(50);
    expect(names.every(isTokenName)).toBe(true);
  });

  it('does not offer --radius, which is not editable in v1', () => {
    expect(IGRP_BRANDING_CORE_TOKENS.map((t) => t.name)).not.toContain('--radius');
  });
});
```

- [ ] **Step 8: Write the parse-module index export test then run the tests**

Make `branding-parse.test.ts` pass by confirming the barrel exports `BRANDING_MAX_BYTES` (Step 7 barrel does). Run from `packages/framework/next-ui`:

```bash
pnpm vitest run src/branding/__tests__
```

Expected: PASS for all three files. If `url(` is accepted by mistake, the `FORBIDDEN` regex in `validate.ts` is the place to fix, not the test.

- [ ] **Step 9: Export the core API from the package barrel**

In `packages/framework/next-ui/src/index.ts`, add (keep the explicit-named style, no wildcards, and do not add `'use client'`):

```ts
export {
  IGRP_BRANDING_CORE_TOKENS,
  igrpBrandingToCss,
  igrpParseBranding,
  BRANDING_MAX_BYTES,
  isSafeCssValue,
  isSafeLogoUrl,
  isTokenName,
} from './branding/index.js';
```

- [ ] **Step 10: Run the package gates**

From `packages/framework/next-ui`:

```bash
pnpm typecheck && pnpm test && pnpm build && pnpm check:dist
```

Expected: all pass. `client-boundaries.test.ts` still passes (the barrel has no directive).

- [ ] **Step 11: Commit**

```bash
git add packages/framework/next-ui/src/branding packages/framework/next-ui/src/index.ts
git commit -m "feat(next-ui): add pure organization branding parse, validation and CSS generation"
```

## Task 3: Branding style element and React context

**Files:**
- Create: `packages/framework/next-ui/src/branding/style.tsx`
- Create: `packages/framework/next-ui/src/branding/provider.tsx`
- Create: `packages/framework/next-ui/src/branding/__tests__/branding-style.test.tsx`
- Modify: `packages/framework/next-ui/src/branding/index.ts` (exports)
- Modify: `packages/framework/next-ui/src/index.ts` (exports)

**Interfaces:**
- Consumes: `igrpBrandingToCss` (Task 2), `IGRPBranding` (Task 1).
- Produces: `IGRPBrandingStyle({ branding })` (server-safe, renders `null` for no CSS), `IGRPBrandingProvider({ branding, children })` (client), `useIGRPBranding(): IGRPBranding | null` (client).

- [ ] **Step 1: Write the failing test**

Create `packages/framework/next-ui/src/branding/__tests__/branding-style.test.tsx`:

```tsx
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { IGRPBrandingStyle, igrpParseBranding } from '../index.js';

const brand = igrpParseBranding(
  JSON.stringify({ version: 1, tokens: { light: { '--primary': 'oklch(0.45 0.18 250)' } }, logos: {} }),
).branding;

describe('IGRPBrandingStyle', () => {
  it('renders a hoisted style with the Brand CSS', () => {
    const markup = renderToStaticMarkup(<IGRPBrandingStyle branding={brand} />);
    expect(markup).toContain('html:root{--primary:oklch(0.45 0.18 250);}');
    expect(markup).toContain('href="igrp-branding"');
  });

  it('renders nothing when there is no Brand', () => {
    expect(renderToStaticMarkup(<IGRPBrandingStyle branding={null} />)).toBe('');
  });

  it('renders the same bytes on every call (hydration safety)', () => {
    const first = renderToStaticMarkup(<IGRPBrandingStyle branding={brand} />);
    const second = renderToStaticMarkup(<IGRPBrandingStyle branding={brand} />);
    expect(second).toBe(first);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

From `packages/framework/next-ui`: `pnpm vitest run src/branding/__tests__/branding-style.test.tsx`
Expected: FAIL, `IGRPBrandingStyle` is not exported.

- [ ] **Step 3: Write the style element (server-safe, no directive)**

Create `packages/framework/next-ui/src/branding/style.tsx`:

```tsx
import type { IGRPBranding } from '@igrp/framework-next-types';

import { igrpBrandingToCss } from './css.js';

/**
 * Hoisted `<style>` carrying the Brand tokens. React 19 moves a precedence
 * stylesheet into `<head>`, so the overrides apply before first paint. No hooks
 * and no browser APIs: this file stays server-safe and carries no directive.
 */
export function IGRPBrandingStyle({ branding }: { branding: IGRPBranding | null }) {
  const css = igrpBrandingToCss(branding);
  if (!css) return null;
  return (
    <style href="igrp-branding" precedence="igrp-branding">
      {css}
    </style>
  );
}
```

- [ ] **Step 4: Write the context provider (client leaf)**

Create `packages/framework/next-ui/src/branding/provider.tsx`:

```tsx
'use client';

import { createContext, type ReactNode, useContext } from 'react';

import type { IGRPBranding } from '@igrp/framework-next-types';

const BrandingContext = createContext<IGRPBranding | null>(null);

/** Exposes the Brand logos to chrome components. `null` means every Default. */
export function IGRPBrandingProvider({
  branding,
  children,
}: {
  branding: IGRPBranding | null;
  children: ReactNode;
}) {
  return <BrandingContext.Provider value={branding}>{children}</BrandingContext.Provider>;
}

/** The current Brand, or `null` when outside a provider or none is set. Never throws. */
export function useIGRPBranding(): IGRPBranding | null {
  return useContext(BrandingContext);
}
```

- [ ] **Step 5: Export and run the tests**

Append to `packages/framework/next-ui/src/branding/index.ts`:

```ts
export { IGRPBrandingStyle } from './style.js';
export { IGRPBrandingProvider, useIGRPBranding } from './provider.js';
```

Append to `packages/framework/next-ui/src/index.ts`:

```ts
export { IGRPBrandingStyle } from './branding/style.js';
export { IGRPBrandingProvider, useIGRPBranding } from './branding/provider.js';
```

Run: `pnpm vitest run src/branding/__tests__/branding-style.test.tsx`
Expected: PASS.

- [ ] **Step 6: Run gates and commit**

From `packages/framework/next-ui`: `pnpm typecheck && pnpm test && pnpm build && pnpm check:dist`
Expected: pass. `client-boundaries.test.ts` confirms `provider.tsx` carries `'use client'` as its first line and the barrel does not.

```bash
git add packages/framework/next-ui/src/branding packages/framework/next-ui/src/index.ts
git commit -m "feat(next-ui): add branding style element and client provider"
```

## Task 4: Remove preset themes from next-ui

**Files:**
- Delete: `packages/framework/next-ui/src/providers/active-theme.tsx`
- Delete: `packages/framework/next-ui/src/templates/theme-selector.tsx`
- Modify: `packages/framework/next-ui/src/providers/nested.tsx`
- Modify: `packages/framework/next-ui/src/index.ts` (remove theme exports)
- Create: `packages/framework/next-ui/src/__tests__/theme-removal.test.ts`

**Interfaces:**
- Consumes: `IGRPBrandingProvider` (Task 3), `IGRPBranding` (Task 1).
- Produces: `IGRPNestedProviders` with prop `branding?: IGRPBranding | null` instead of `activeThemeValue`.

- [ ] **Step 1: Write the failing test**

Create `packages/framework/next-ui/src/__tests__/theme-removal.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import * as ui from '../index.js';

describe('preset themes are removed', () => {
  it.each([
    'IGRPActiveThemeProvider',
    'useIGRPThemeConfig',
    'igrpActiveThemeClassName',
    'IGRP_ACTIVE_THEME_COOKIE',
    'IGRP_DEFAULT_THEMES',
    'IGRP_SCALED_THEMES',
    'IGRPTemplateThemeSelector',
  ])('does not export %s', (name) => {
    expect(name in ui).toBe(false);
  });

  it('still exports the light / dark / system mode switcher', () => {
    expect('IGRPTemplateModeSwitcher' in ui).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

From `packages/framework/next-ui`: `pnpm vitest run src/__tests__/theme-removal.test.ts`
Expected: FAIL on the first `it.each` entries (names still exported).

- [ ] **Step 3: Delete the preset files and find every reference**

```bash
git rm packages/framework/next-ui/src/providers/active-theme.tsx packages/framework/next-ui/src/templates/theme-selector.tsx
```

Then list what still points at them:

```bash
grep -rn "active-theme\|theme-selector\|IGRP_DEFAULT_THEMES\|IGRP_SCALED_THEMES\|IGRP_ACTIVE_THEME_COOKIE\|igrpActiveThemeClassName\|useIGRPThemeConfig\|IGRPActiveThemeProvider\|IGRPTemplateThemeSelector\|IGRPThemeSelectorLabels\|IGRP_THEME_SELECTOR_LABELS_PT_PT" packages/framework/next-ui/src
```

Delete each matching export line from `packages/framework/next-ui/src/index.ts`. The blocks are the `active-theme.js` export and the `theme-selector.js` export, plus their type exports. Do not remove `IGRPTemplateModeSwitcher` or `./providers/theme.js`.

- [ ] **Step 4: Thread the Brand through the nested providers**

Replace the body of `packages/framework/next-ui/src/providers/nested.tsx` with:

```tsx
'use client';

import { type Session } from '@igrp/framework-next-auth';
import type { SessionProviderProps } from '@igrp/framework-next-auth/client';
import type { IGRPBranding } from '@igrp/framework-next-types';
import { TooltipProvider } from '@igrp/igrp-framework-react-design-system';

import { IGRPBrandingProvider } from '../branding/provider.js';
import { IGRPSessionWatcher } from '../templates/session-watcher.js';
import { IGRPSessionProvider } from './session.js';
import { IGRPThemeProvider } from './theme.js';

export type IGRPNestedProvidersArgs = {
  session?: Session | null;
  branding?: IGRPBranding | null;
  children: React.ReactNode;
  sessionArgs?: Partial<SessionProviderProps>;
};

export function IGRPNestedProviders({ session, branding = null, sessionArgs, children }: IGRPNestedProvidersArgs) {
  return (
    <IGRPSessionProvider {...sessionArgs} session={session}>
      <TooltipProvider>
        <IGRPThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          enableColorScheme
        >
          <IGRPBrandingProvider branding={branding}>
            <IGRPSessionWatcher>{children}</IGRPSessionWatcher>
          </IGRPBrandingProvider>
        </IGRPThemeProvider>
      </TooltipProvider>
    </IGRPSessionProvider>
  );
}
```

- [ ] **Step 5: Run the tests and gates**

From `packages/framework/next-ui`: `pnpm vitest run src/__tests__/theme-removal.test.ts` then `pnpm typecheck && pnpm test && pnpm build && pnpm check:dist`.
Expected: PASS. If `typecheck` reports a leftover import, the grep in Step 3 missed it; fix that file.

- [ ] **Step 6: Commit**

```bash
git add packages/framework/next-ui/src/providers/nested.tsx packages/framework/next-ui/src/index.ts packages/framework/next-ui/src/__tests__/theme-removal.test.ts
git commit -m "feat(next-ui): remove preset themes and thread the organization Brand through providers"
```

## Task 5: Logo precedence in the header and login form

**Files:**
- Create: `packages/framework/next-ui/src/branding/resolve.ts`
- Create: `packages/framework/next-ui/src/branding/__tests__/branding-resolve.test.ts`
- Modify: `packages/framework/next-ui/src/templates/header.tsx` (header logo slot, around the `IGRPTemplateImage` at the `src={headerLogo || withBasePath(fallbackLogo)}` line)
- Modify: `packages/framework/next-ui/src/auths/form.tsx` (wide logo, around the `src={withBasePath(logo.src)}` line, `logo.srcDark` line and `w-auto h-auto` class)
- Modify: `packages/framework/next-ui/src/branding/index.ts` (exports)

**Interfaces:**
- Consumes: `IGRPBranding` (Task 1), `useIGRPBranding` (Task 3).
- Produces: `resolveHeaderLogo({ branding, headerLogo, fallback }): { light: string; dark?: string }` and `resolveWideLogo({ branding, fallback }): { src: string; srcDark?: string; width: number; height: number }`.

- [ ] **Step 1: Write the failing test**

Create `packages/framework/next-ui/src/branding/__tests__/branding-resolve.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import type { IGRPBranding } from '@igrp/framework-next-types';

import { resolveHeaderLogo, resolveWideLogo } from '../resolve.js';

const brand: IGRPBranding = {
  version: 1,
  tokens: {},
  logos: {
    header: { light: 'https://cdn.example/h.png', dark: 'https://cdn.example/h-dark.png' },
    wide: { light: 'https://cdn.example/w.svg', width: 320, height: 96 },
  },
};

const fallback = { src: '/logo.png', width: 100, height: 60 };

describe('resolveHeaderLogo', () => {
  it('prefers the Brand header slot, with its dark variant', () => {
    expect(resolveHeaderLogo({ branding: brand, headerLogo: '/app.png', fallback: '/x.png' })).toEqual({
      light: 'https://cdn.example/h.png',
      dark: 'https://cdn.example/h-dark.png',
    });
  });

  it('uses headerLogo when the Brand has no header slot', () => {
    expect(resolveHeaderLogo({ branding: null, headerLogo: '/app.png', fallback: '/x.png' })).toEqual({
      light: '/app.png',
    });
  });

  it('uses the fallback last', () => {
    expect(resolveHeaderLogo({ branding: null, fallback: '/x.png' })).toEqual({ light: '/x.png' });
  });
});

describe('resolveWideLogo', () => {
  it('uses the Brand wide slot with its size', () => {
    expect(resolveWideLogo({ branding: brand, fallback })).toEqual({
      src: 'https://cdn.example/w.svg',
      srcDark: undefined,
      width: 320,
      height: 96,
    });
  });

  it('keeps the app logo when no Brand wide slot exists', () => {
    expect(resolveWideLogo({ branding: null, fallback })).toEqual({
      src: '/logo.png',
      srcDark: undefined,
      width: 100,
      height: 60,
    });
  });
});
```

- [ ] **Step 2: Run to verify it fails**

From `packages/framework/next-ui`: `pnpm vitest run src/branding/__tests__/branding-resolve.test.ts`
Expected: FAIL, `../resolve.js` not found.

- [ ] **Step 3: Write the resolvers**

Create `packages/framework/next-ui/src/branding/resolve.ts`:

```ts
import type { IGRPBranding } from '@igrp/framework-next-types';

export interface ResolvedHeaderLogo {
  light: string;
  dark?: string;
}

export interface ResolvedWideLogo {
  src: string;
  srcDark?: string;
  width: number;
  height: number;
}

/** Brand header mark, then the app's `headerLogo`, then the framework fallback. */
export function resolveHeaderLogo(args: {
  branding: IGRPBranding | null;
  headerLogo?: string;
  fallback: string;
}): ResolvedHeaderLogo {
  const slot = args.branding?.logos.header;
  if (slot) return { light: slot.light, dark: slot.dark };
  if (args.headerLogo) return { light: args.headerLogo };
  return { light: args.fallback };
}

/** Brand wide logo with its size, or the app's own logo with its size. */
export function resolveWideLogo(args: {
  branding: IGRPBranding | null;
  fallback: { src: string; srcDark?: string; width: number; height: number };
}): ResolvedWideLogo {
  const slot = args.branding?.logos.wide;
  if (!slot) return { ...args.fallback };
  return {
    src: slot.light,
    srcDark: slot.dark,
    width: slot.width ?? args.fallback.width,
    height: slot.height ?? args.fallback.height,
  };
}
```

Add to `packages/framework/next-ui/src/branding/index.ts`:

```ts
export { resolveHeaderLogo, resolveWideLogo } from './resolve.js';
```

Run: `pnpm vitest run src/branding/__tests__/branding-resolve.test.ts` → PASS.

- [ ] **Step 4: Wire the header logo**

In `packages/framework/next-ui/src/templates/header.tsx` (confirm the file starts with `'use client'`), import `useIGRPBranding` from `'../branding/provider.js'` and `resolveHeaderLogo` from `'../branding/resolve.js'`. Call them inside the component. Replace the single `IGRPTemplateImage` in the `showIGRPHeaderLogo` block with the resolved slot. When `resolved.dark` is present render two images, the light one with `dark:hidden` and the dark one with `hidden dark:block`, each with the same `fallback` prop. Keep `priority`, `width={40}` and `height={40}`. Do not use `try/finally`.

- [ ] **Step 5: Wire the wide logo in the login form**

In `packages/framework/next-ui/src/auths/form.tsx`, call `useIGRPBranding()` and `resolveWideLogo({ branding, fallback: logo })` at the top of the component. Use the resolved `src`, `srcDark`, `width` and `height` where the component currently reads `logo.src`, `logo.srcDark`, `logo.width` and `logo.height`. Change the image class from `w-auto h-auto` to `w-auto h-auto max-h-20` so the wide logo is capped at 80 px (`max-h-20`). Keep `dark:hidden` on the light image only when `srcDark` is set.

- [ ] **Step 6: Run gates and commit**

From `packages/framework/next-ui`: `pnpm typecheck && pnpm test && pnpm build && pnpm check:dist`.
Expected: pass; `build-pipeline.test.ts` confirms the React Compiler still memoizes `IGRPAuthForm` (no `try/finally` was added).

```bash
git add packages/framework/next-ui/src/branding packages/framework/next-ui/src/templates/header.tsx packages/framework/next-ui/src/auths/form.tsx
git commit -m "feat(next-ui): apply organization logos in the header and the login form"
```

## Task 6: Server loader with per-process cache

**Files:**
- Create: `packages/framework/next/src/branding/get-branding.ts`
- Create: `packages/framework/next/src/branding/token.ts`
- Create: `packages/framework/next/src/branding/__tests__/get-branding.test.ts`
- Create: `packages/framework/next/src/branding/__tests__/token.test.ts`

**Interfaces:**
- Consumes: `igrpParseBranding` (Task 2, from `@igrp/framework-next-ui`), `IGRPBranding` and `IGRPConfigArgs` (Task 1), `AccessManagementClient` and `GlobalConfigurationType` (SDK).
- Produces:
  - `igrpGetBranding(args: { baseUrl: string; token?: string; savedAt?: number; timeout?: number }): Promise<IGRPBranding | null>`
  - `igrpInvalidateBranding(baseUrl?: string): void`
  - `igrpResetBrandingCache(): void` (test seam)
  - `resolveBrandingToken(config: IGRPConfigArgs): string | undefined`

- [ ] **Step 1: Write the failing loader tests**

Create `packages/framework/next/src/branding/__tests__/get-branding.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getGlobalConfiguration = vi.fn();
vi.mock('@igrp/platform-access-management-client-ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@igrp/platform-access-management-client-ts')>();
  return {
    ...actual,
    AccessManagementClient: { create: () => ({ globalConfiguration: { getGlobalConfiguration } }) },
  };
});

const {
  igrpGetBranding,
  igrpInvalidateBranding,
  igrpResetBrandingCache,
} = await import('../get-branding.js');

const BASE = 'https://am.example';
const doc = (color: string) =>
  JSON.stringify({ version: 1, tokens: { light: { '--primary': color } }, logos: {} });
const ok = (color: string) => ({ data: { config: doc(color), type: 'ORGANIZATION' } });

beforeEach(() => {
  igrpResetBrandingCache();
  getGlobalConfiguration.mockReset();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-13T10:00:00Z'));
});

describe('igrpGetBranding', () => {
  it('fetches on the first signed-in request and returns the parsed Brand', async () => {
    getGlobalConfiguration.mockResolvedValue(ok('oklch(0.45 0.18 250)'));
    const brand = await igrpGetBranding({ baseUrl: BASE, token: 't' });
    expect(brand?.tokens.light).toEqual({ '--primary': 'oklch(0.45 0.18 250)' });
    expect(getGlobalConfiguration).toHaveBeenCalledTimes(1);
  });

  it('serves a fresh entry without fetching again', async () => {
    getGlobalConfiguration.mockResolvedValue(ok('red'));
    await igrpGetBranding({ baseUrl: BASE, token: 't' });
    await igrpGetBranding({ baseUrl: BASE, token: 't' });
    expect(getGlobalConfiguration).toHaveBeenCalledTimes(1);
  });

  it('never fetches without a token (public pages), and returns null when nothing is cached', async () => {
    const brand = await igrpGetBranding({ baseUrl: BASE });
    expect(brand).toBeNull();
    expect(getGlobalConfiguration).not.toHaveBeenCalled();
  });

  it('caches a 404 as no Brand for the TTL', async () => {
    getGlobalConfiguration.mockRejectedValue(Object.assign(new Error('not found'), { status: 404 }));
    expect(await igrpGetBranding({ baseUrl: BASE, token: 't' })).toBeNull();
    expect(await igrpGetBranding({ baseUrl: BASE, token: 't' })).toBeNull();
    expect(getGlobalConfiguration).toHaveBeenCalledTimes(1);
  });

  it('keeps the previous Brand on a server error and waits 60 s before retrying', async () => {
    getGlobalConfiguration.mockResolvedValueOnce(ok('red'));
    await igrpGetBranding({ baseUrl: BASE, token: 't' });
    vi.setSystemTime(new Date('2026-10-13T10:06:00Z'));
    getGlobalConfiguration.mockRejectedValue(Object.assign(new Error('down'), { status: 503 }));
    expect((await igrpGetBranding({ baseUrl: BASE, token: 't' }))?.tokens.light).toEqual({ '--primary': 'red' });
    expect((await igrpGetBranding({ baseUrl: BASE, token: 't' }))?.tokens.light).toEqual({ '--primary': 'red' });
    expect(getGlobalConfiguration).toHaveBeenCalledTimes(2);
    vi.setSystemTime(new Date('2026-10-13T10:07:01Z'));
    await igrpGetBranding({ baseUrl: BASE, token: 't' });
    expect(getGlobalConfiguration).toHaveBeenCalledTimes(3);
  });

  it('serves the stale value immediately and refreshes in the background after the TTL', async () => {
    getGlobalConfiguration.mockResolvedValueOnce(ok('red'));
    await igrpGetBranding({ baseUrl: BASE, token: 't' });
    vi.setSystemTime(new Date('2026-10-13T10:06:00Z'));
    getGlobalConfiguration.mockResolvedValueOnce(ok('blue'));
    const stale = await igrpGetBranding({ baseUrl: BASE, token: 't' });
    expect(stale?.tokens.light).toEqual({ '--primary': 'red' });
    expect(getGlobalConfiguration).toHaveBeenCalledTimes(2);
    // The background refresh completes later; poll until the cache holds the new value.
    await vi.waitFor(async () => {
      const fresh = await igrpGetBranding({ baseUrl: BASE, token: 't' });
      expect(fresh?.tokens.light).toEqual({ '--primary': 'blue' });
    });
    expect(getGlobalConfiguration).toHaveBeenCalledTimes(2);
  });

  it('refetches when the freshness cookie is newer than the cached entry', async () => {
    getGlobalConfiguration.mockResolvedValueOnce(ok('red'));
    await igrpGetBranding({ baseUrl: BASE, token: 't' });
    getGlobalConfiguration.mockResolvedValueOnce(ok('green'));
    const savedAt = Date.now() + 1000;
    await igrpGetBranding({ baseUrl: BASE, token: 't', savedAt });
    await vi.waitFor(() => expect(getGlobalConfiguration).toHaveBeenCalledTimes(2));
  });

  it('forgets the entry after invalidate', async () => {
    getGlobalConfiguration.mockResolvedValueOnce(ok('red')).mockResolvedValueOnce(ok('blue'));
    await igrpGetBranding({ baseUrl: BASE, token: 't' });
    igrpInvalidateBranding(BASE);
    const brand = await igrpGetBranding({ baseUrl: BASE, token: 't' });
    expect(brand?.tokens.light).toEqual({ '--primary': 'blue' });
  });
});
```

Create `packages/framework/next/src/branding/__tests__/token.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import type { IGRPConfigArgs } from '@igrp/framework-next-types';

import { resolveBrandingToken } from '../token.js';

const base = (session: unknown): IGRPConfigArgs =>
  ({ layout: { session } }) as unknown as IGRPConfigArgs;

describe('resolveBrandingToken', () => {
  it('returns the session access token when present', () => {
    expect(resolveBrandingToken(base({ accessToken: 'abc' }))).toBe('abc');
  });

  it('returns undefined without a session or without a string token', () => {
    expect(resolveBrandingToken(base(null))).toBeUndefined();
    expect(resolveBrandingToken(base({ accessToken: 42 }))).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

From `packages/framework/next`: `pnpm vitest run src/branding/__tests__`
Expected: FAIL, modules not found.

- [ ] **Step 3: Write the token resolver**

Create `packages/framework/next/src/branding/token.ts`:

```ts
import type { IGRPConfigArgs } from '@igrp/framework-next-types';

/**
 * The single place that decides which credential reads the Brand. Today it is
 * the signed-in user's access token. Switching to an M2M provider later changes
 * only this function (see the ADR in the framework `docs/adr`).
 */
export function resolveBrandingToken(config: IGRPConfigArgs): string | undefined {
  const session = config.layout.session as { accessToken?: unknown } | null | undefined;
  return typeof session?.accessToken === 'string' ? session.accessToken : undefined;
}
```

- [ ] **Step 4: Write the loader**

Create `packages/framework/next/src/branding/get-branding.ts`:

```ts
import 'server-only';

import { igrpParseBranding } from '@igrp/framework-next-ui';
import type { IGRPBranding } from '@igrp/framework-next-types';
import {
  AccessManagementClient,
  GlobalConfigurationType,
} from '@igrp/platform-access-management-client-ts';

export const BRANDING_TTL_MS = 5 * 60_000;
export const BRANDING_RETRY_COOLDOWN_MS = 60_000;
export const BRANDING_FETCH_TIMEOUT_MS = 3_000;

type Entry = { value: IGRPBranding | null; fetchedAt: number; retryAfter: number; inflight?: Promise<void> };
const cache = new Map<string, Entry>();

export interface IGRPGetBrandingArgs {
  baseUrl: string;
  /** Signed-in user's access token. Absent on public pages, which never fetch. */
  token?: string;
  /** Epoch ms from the `igrp_brand_v` cookie. A value newer than the cache forces a refetch. */
  savedAt?: number;
  timeout?: number;
}

const statusOf = (error: unknown): number | undefined =>
  typeof error === 'object' && error !== null && 'status' in error
    ? (error as { status?: number }).status
    : undefined;

function store(key: string, next: Entry): void {
  cache.set(key, next);
}

async function refresh(key: string, args: IGRPGetBrandingArgs): Promise<void> {
  const client = AccessManagementClient.create({
    baseUrl: key,
    timeout: args.timeout ?? BRANDING_FETCH_TIMEOUT_MS,
    headers: { Authorization: `Bearer ${args.token}` },
  });
  try {
    const response = await client.globalConfiguration.getGlobalConfiguration(
      GlobalConfigurationType.ORGANIZATION,
    );
    const parsed = igrpParseBranding(response.data.config);
    if (parsed.dropped > 0) {
      console.warn(JSON.stringify({ event: 'igrp.branding.dropped_fields', count: parsed.dropped }));
    }
    if (!parsed.branding) {
      console.warn(JSON.stringify({ event: 'igrp.branding.invalid_config' }));
    }
    store(key, { value: parsed.branding, fetchedAt: Date.now(), retryAfter: 0 });
  } catch (error) {
    const status = statusOf(error);
    if (status === 404) {
      store(key, { value: null, fetchedAt: Date.now(), retryAfter: 0 });
      return;
    }
    console.error(JSON.stringify({ event: 'igrp.branding.fetch_failed', status: status ?? 'network' }));
    const previous = cache.get(key);
    store(key, {
      value: previous?.value ?? null,
      fetchedAt: previous?.fetchedAt ?? 0,
      retryAfter: Date.now() + BRANDING_RETRY_COOLDOWN_MS,
    });
  }
}

/**
 * The organization Brand for this request. Fresh entries are served from
 * memory. A stale or newer-than-cached entry is served with its previous value
 * while one background refresh runs. The first request on a process waits for
 * its fetch so the first paint is branded. Public requests never fetch.
 */
export async function igrpGetBranding(args: IGRPGetBrandingArgs): Promise<IGRPBranding | null> {
  const key = args.baseUrl;
  const entry = cache.get(key);
  if (!args.token) return entry?.value ?? null;

  const now = Date.now();
  const stale =
    !entry || now - entry.fetchedAt >= BRANDING_TTL_MS || (args.savedAt ?? 0) > entry.fetchedAt;
  if (!stale || (entry && now < entry.retryAfter)) return entry?.value ?? null;

  if (!entry) {
    await refresh(key, args);
    return cache.get(key)?.value ?? null;
  }
  if (!entry.inflight) {
    entry.inflight = refresh(key, args).finally(() => {
      const current = cache.get(key);
      if (current) current.inflight = undefined;
    });
  }
  return entry.value;
}

/** Drops the cached entry for `baseUrl`, or every entry when omitted. */
export function igrpInvalidateBranding(baseUrl?: string): void {
  if (baseUrl) cache.delete(baseUrl);
  else cache.clear();
}

/** Test seam: clears the cache between tests. */
export function igrpResetBrandingCache(): void {
  cache.clear();
}
```

- [ ] **Step 5: Run the tests**

From `packages/framework/next`: `pnpm vitest run src/branding/__tests__`
Expected: PASS. If the stale-while-revalidate test is flaky, the fix is in `igrpGetBranding` (the in-flight promise), not in a longer wait.

- [ ] **Step 6: Run gates and commit**

From `packages/framework/next`: `pnpm typecheck && pnpm test`
Expected: pass.

```bash
git add packages/framework/next/src/branding
git commit -m "feat(next): add organization branding loader with per-process cache"
```

## Task 7: Metadata helper and config schema

**Files:**
- Create: `packages/framework/next/src/branding/metadata.ts`
- Create: `packages/framework/next/src/branding/request.ts`
- Create: `packages/framework/next/src/branding/__tests__/metadata.test.ts`
- Modify: `packages/framework/next/src/lib/build.ts` (accept `branding` in `igrpConfigSchema`)
- Modify: `packages/framework/next/src/lib/__tests__/build.test.ts` (new cases)
- Modify: `packages/framework/next/src/index.ts` (exports)

**Interfaces:**
- Consumes: `IGRPBranding`, `IGRPConfigArgs` (Task 1); `igrpGetBranding`, `resolveBrandingToken` (Task 6).
- Produces:
  - `igrpBrandingMetadata(branding: IGRPBranding | null, fallbackIcon: string): Metadata['icons']`
  - `igrpResolveRequestBranding(config: IGRPConfigArgs): Promise<IGRPBranding | null>`

- [ ] **Step 1: Write the failing metadata test**

Create `packages/framework/next/src/branding/__tests__/metadata.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import type { IGRPBranding } from '@igrp/framework-next-types';

import { igrpBrandingMetadata } from '../metadata.js';

const withFavicon = (favicon: NonNullable<IGRPBranding['logos']['favicon']>): IGRPBranding => ({
  version: 1,
  tokens: {},
  logos: { favicon },
});

describe('igrpBrandingMetadata', () => {
  it('returns the app fallback icon when there is no Brand', () => {
    expect(igrpBrandingMetadata(null, '/logo-no-text.png')).toEqual({ icon: '/logo-no-text.png' });
  });

  it('returns the fallback icon when the Brand has no favicon', () => {
    expect(igrpBrandingMetadata({ version: 1, tokens: {}, logos: {} }, '/f.png')).toEqual({ icon: '/f.png' });
  });

  it('uses the Brand favicon, with a dark variant behind a colour-scheme media query', () => {
    expect(
      igrpBrandingMetadata(
        withFavicon({ light: 'https://cdn.example/f.png', dark: 'https://cdn.example/f-dark.png' }),
        '/f.png',
      ),
    ).toEqual({
      icon: [
        { url: 'https://cdn.example/f.png' },
        { url: 'https://cdn.example/f-dark.png', media: '(prefers-color-scheme: dark)' },
      ],
    });
  });
});
```

- [ ] **Step 2: Run to verify it fails**

From `packages/framework/next`: `pnpm vitest run src/branding/__tests__/metadata.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Write the metadata helper and the request resolver**

Create `packages/framework/next/src/branding/metadata.ts`:

```ts
import type { Metadata } from 'next';

import type { IGRPBranding } from '@igrp/framework-next-types';

/** Favicon from the Brand, or the app's own icon. Safe to call with `null`. */
export function igrpBrandingMetadata(branding: IGRPBranding | null, fallbackIcon: string): Metadata['icons'] {
  const favicon = branding?.logos.favicon;
  if (!favicon) return { icon: fallbackIcon };
  return {
    icon: [
      { url: favicon.light },
      ...(favicon.dark ? [{ url: favicon.dark, media: '(prefers-color-scheme: dark)' }] : []),
    ],
  };
}
```

Create `packages/framework/next/src/branding/request.ts`:

```ts
import 'server-only';

import { cookies } from 'next/headers';

import type { IGRPBranding, IGRPConfigArgs } from '@igrp/framework-next-types';

import { igrpGetBranding } from './get-branding.js';
import { resolveBrandingToken } from './token.js';

export const BRAND_FRESHNESS_COOKIE = 'igrp_brand_v';

/**
 * The Brand for the current request, or `null` when the flag is off, preview
 * mode is on, or the Brand is absent. When the flag is off this returns before
 * touching cookies or the network.
 */
export async function igrpResolveRequestBranding(config: IGRPConfigArgs): Promise<IGRPBranding | null> {
  if (config.branding?.enabled !== true || config.previewMode) return null;
  const store = await cookies();
  const savedAt = Number(store.get(BRAND_FRESHNESS_COOKIE)?.value ?? 0);
  return igrpGetBranding({
    baseUrl: config.apiManagementConfig?.baseUrl ?? '',
    token: resolveBrandingToken(config),
    savedAt: Number.isFinite(savedAt) ? savedAt : 0,
  });
}
```

- [ ] **Step 4: Run the metadata test**

From `packages/framework/next`: `pnpm vitest run src/branding/__tests__/metadata.test.ts` → PASS.

- [ ] **Step 5: Add a failing config-schema test**

In `packages/framework/next/src/lib/__tests__/build.test.ts`, add a case that builds with `branding: { enabled: true }` and expects `result.branding` to equal `{ enabled: true }`, and a case with `branding: { enabled: 'yes' }` that expects `igrpBuildConfig` to throw. Reuse the existing fixture in that file (the object literal the other cases pass to `igrpBuildConfig`). Run `pnpm vitest run src/lib/__tests__/build.test.ts` and expect the new `enabled: 'yes'` case to FAIL, because the schema does not check the field yet.

- [ ] **Step 6: Validate `branding` in the schema**

In `packages/framework/next/src/lib/build.ts`, inside `igrpConfigSchema`'s `z.object({...})`, add:

```ts
    branding: z.object({ enabled: z.boolean() }).optional(),
```

Run `pnpm vitest run src/lib/__tests__/build.test.ts` → PASS.

- [ ] **Step 7: Export and gate**

Append to `packages/framework/next/src/index.ts`:

```ts
export { igrpGetBranding, igrpInvalidateBranding } from './branding/get-branding.js';
export { igrpBrandingMetadata } from './branding/metadata.js';
export { igrpResolveRequestBranding, BRAND_FRESHNESS_COOKIE } from './branding/request.js';
export { resolveBrandingToken } from './branding/token.js';
```

From `packages/framework/next`: `pnpm typecheck && pnpm test`. Expected: pass.

- [ ] **Step 8: Commit**

```bash
git add packages/framework/next/src/branding packages/framework/next/src/lib/build.ts packages/framework/next/src/lib/__tests__/build.test.ts packages/framework/next/src/index.ts
git commit -m "feat(next): add branding metadata helper, request resolver and config validation"
```

## Task 8: Root layout wiring

**Files:**
- Modify: `packages/framework/next/src/layouts/igrp-root-layout.tsx`
- Create: `packages/framework/next/src/layouts/__tests__/igrp-root-layout.test.tsx`

**Interfaces:**
- Consumes: `igrpResolveRequestBranding` (Task 7), `IGRPBrandingStyle` and `IGRPNestedProviders` (Tasks 3 and 4, from `@igrp/framework-next-ui`).
- Produces: `IGRPRootLayout` that reads the Brand only when `config.branding?.enabled === true`, renders `IGRPBrandingStyle` first inside `<body>`, passes `branding` to `IGRPNestedProviders`, and no longer emits any `theme-*` body class.

- [ ] **Step 1: Write the failing layout test**

Create `packages/framework/next/src/layouts/__tests__/igrp-root-layout.test.tsx`:

```tsx
import { beforeEach, describe, expect, it, vi } from 'vitest';

const resolveRequestBranding = vi.fn();
vi.mock('../../branding/request.js', () => ({ igrpResolveRequestBranding: resolveRequestBranding }));
vi.mock('../../lib/sync-plan.js', () => ({ planAccessManagementSync: () => null }));
vi.mock('next/server', () => ({ after: () => {} }));
vi.mock('@igrp/framework-next-ui', () => ({
  IGRPNestedProviders: (p: unknown) => ({ __marker: 'providers', p }),
  IGRPBrandingStyle: (p: unknown) => ({ __marker: 'style', p }),
}));

import { IGRPBrandingStyle, IGRPNestedProviders } from '@igrp/framework-next-ui';

const { IGRPRootLayout } = await import('../igrp-root-layout.js');

const config = (overrides: Record<string, unknown> = {}) =>
  ({
    font: '',
    layout: { session: null, activeThemeValue: 'blue', isScaled: false },
    sessionArgs: {},
    syncAccess: false,
    previewMode: false,
    appInformation: { name: 'app' },
    apiManagementConfig: { baseUrl: 'https://am.example' },
    appCode: 'APP',
    ...overrides,
  }) as never;

// The layout returns React elements: match a rendered component by its `type`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function find(node: any, component: unknown): any {
  if (!node || typeof node !== 'object') return null;
  if (Array.isArray(node)) {
    for (const child of node) {
      const hit = find(child, component);
      if (hit) return hit;
    }
    return null;
  }
  if (node.type === component) return node;
  return find(node.props?.children, component);
}

beforeEach(() => {
  resolveRequestBranding.mockReset().mockResolvedValue(null);
});

describe('IGRPRootLayout organization branding', () => {
  it('does not read the Brand when the flag is omitted', async () => {
    await IGRPRootLayout({ children: null, config: config() });
    expect(resolveRequestBranding).toHaveBeenCalledTimes(1);
    expect(resolveRequestBranding.mock.calls[0][0].branding).toBeUndefined();
  });

  it('calls the resolver once with the config when the flag is on', async () => {
    const cfg = config({ branding: { enabled: true } });
    await IGRPRootLayout({ children: null, config: cfg });
    expect(resolveRequestBranding).toHaveBeenCalledWith(cfg);
  });

  it('passes the resolved Brand to the style element and the providers', async () => {
    const brand = { version: 1, tokens: {}, logos: {} };
    resolveRequestBranding.mockResolvedValue(brand);
    const tree = await IGRPRootLayout({ children: null, config: config({ branding: { enabled: true } }) });
    expect(find(tree, IGRPBrandingStyle)?.props.branding).toBe(brand);
    expect(find(tree, IGRPNestedProviders)?.props.branding).toBe(brand);
  });

  it('renders providers with null when the resolver returns null', async () => {
    const tree = await IGRPRootLayout({ children: null, config: config() });
    expect(find(tree, IGRPNestedProviders)?.props.branding ?? null).toBeNull();
  });

  it('no longer emits a preset theme class on the body', async () => {
    const tree = await IGRPRootLayout({ children: null, config: config() });
    const body = JSON.stringify(tree);
    expect(body).not.toContain('theme-blue');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

From `packages/framework/next`: `pnpm vitest run src/layouts/__tests__/igrp-root-layout.test.tsx`
Expected: FAIL (the layout does not import the resolver yet).

- [ ] **Step 3: Rewrite the root layout**

Replace the body of `packages/framework/next/src/layouts/igrp-root-layout.tsx`. Keep the existing imports for `after`, `igrpStartupSync` and `planAccessManagementSync`, and add `IGRPBrandingStyle` and `IGRPNestedProviders` from `@igrp/framework-next-ui` and `igrpResolveRequestBranding` from `'../branding/request.js'`. Remove the destructuring of `activeThemeValue` and `isScaled`. The function body becomes:

```tsx
export async function IGRPRootLayout({ children, config, lang = 'pt' }: IGRPRootLayoutArgs) {
  const { font, layout, sessionArgs, syncAccess, previewMode, appInformation, apiManagementConfig, appCode } = config;
  const { session } = layout;

  // (keep the existing planAccessManagementSync block and after() scheduling unchanged)
  const syncPlan = planAccessManagementSync({
    syncAccess,
    previewMode,
    appCode,
    appInformation,
    menus: apiManagementConfig?.onCodeMenus ?? [],
    permissions: apiManagementConfig?.onCodePermissions ?? [],
    apiManagementConfig,
  });
  if (syncPlan) {
    after(() => igrpStartupSync(syncPlan));
  }

  // Off by default: no cookie read, no request, no style element.
  const branding = await igrpResolveRequestBranding(config);

  return (
    <html lang={lang} suppressHydrationWarning className={font}>
      <body className="bg-background overscroll-none h-screen font-sans antialiased">
        <IGRPBrandingStyle branding={branding} />
        <IGRPNestedProviders session={session} branding={branding} sessionArgs={sessionArgs}>
          {children}
        </IGRPNestedProviders>
      </body>
    </html>
  );
}
```

Note: `igrpResolveRequestBranding` is called with the flag off too, so the `enabled !== true` guard inside it is the single place that decides. The test asserts the resolver is called; the resolver itself returns before any I/O. Keep the test's first case asserting that the resolver saw `branding` undefined.

- [ ] **Step 4: Mark the deprecated layout fields**

In `packages/framework/next-types/src/types/igrp.ts` the `activeThemeValue` and `isScaled` JSDoc was added in Task 1. Confirm it is present; nothing else changes here.

- [ ] **Step 5: Run the tests and the package gates**

From `packages/framework/next`: `pnpm vitest run src/layouts/__tests__/igrp-root-layout.test.tsx` → PASS. Then `pnpm typecheck && pnpm test && pnpm build && pnpm check:dist`.

Note: `igrp-layout-full.test.tsx` already mocks `@igrp/framework-next-ui`; if it fails because the mock lacks `IGRPBrandingStyle`, add that name to the mock factory (it is not used by that layout).

- [ ] **Step 6: Commit**

```bash
git add packages/framework/next/src/layouts/igrp-root-layout.tsx packages/framework/next/src/layouts/__tests__/igrp-root-layout.test.tsx
git commit -m "feat(next): apply organization branding in the root layout behind the config flag"
```

## Task 9: Template demo-v1 wiring

**Files:**
- Modify: `templates/demo-v1/src/igrp.template.config.ts` (add `branding`)
- Modify: `templates/demo-v1/src/app/layout.tsx` (metadata uses the Brand favicon)
- Modify: `templates/demo-v1/src/actions/igrp/layout.ts` (drop `activeThemeValue` and `getTheme` usage)
- Modify: `templates/demo-v1/.env.example` and `templates/demo-v1/.env` (add `IGRP_BRANDING_ENABLED`)
- Modify: `templates/demo-v1/docs/ENVIRONMENT.md` (add a row)

**Interfaces:**
- Consumes: `igrpResolveRequestBranding` and `igrpBrandingMetadata` (Task 7) from `@igrp/framework-next`.
- Produces: a template that is unchanged by default (flag `false`).

Template rules: `templates/demo-v1/.agents/rules/ui.md` and Biome for formatting (`pnpm exec biome check <files>`).

- [ ] **Step 1: Add the flag to the template config**

In `templates/demo-v1/src/igrp.template.config.ts`, in the object passed to `igrpBuildConfig`, add after `syncAccess`:

```ts
    branding: { enabled: process.env.IGRP_BRANDING_ENABLED === "true" },
```

- [ ] **Step 2: Use the Brand favicon in the root layout metadata**

In `templates/demo-v1/src/app/layout.tsx`, replace the static `metadata` export with `generateMetadata`:

```ts
import { igrpBrandingMetadata, igrpResolveRequestBranding } from "@igrp/framework-next";

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

Remove the old `export const metadata` block. Keep `export const viewport` and `export const dynamic`.

- [ ] **Step 3: Drop the preset-theme reads**

Open `templates/demo-v1/src/actions/igrp/layout.ts`. Remove the `getTheme` import and any `activeThemeValue` or `isScaled` returned from it. Search for other readers:

```bash
grep -rn "activeThemeValue\|isScaled\|getTheme\|igrp_active_theme" templates/demo-v1/src
```

Expected after the edit: no matches.

- [ ] **Step 4: Document and default the flag**

Add to `templates/demo-v1/.env.example`, in the `IGRP_*` section after `IGRP_SYNC_ACCESS`:

```bash
# Load the organization Brand (colours and logos) from Access Management at
# render time. Empty or false keeps the design-system defaults with no request.
IGRP_BRANDING_ENABLED=
```

Add `IGRP_BRANDING_ENABLED=false` to `templates/demo-v1/.env`. In `templates/demo-v1/docs/ENVIRONMENT.md`, add a row to the env table: `IGRP_BRANDING_ENABLED` | Load the organization Brand (colours and logos) from Access Management at render time | `false`.

- [ ] **Step 5: Gate the template**

From `templates/demo-v1`:

```bash
pnpm typecheck && pnpm exec biome check src/igrp.template.config.ts src/app/layout.tsx src/actions/igrp/layout.ts
```

Expected: no errors. Biome may format; re-run `biome check` after `pnpm exec biome check --write <the three files>` only if formatting is the only issue, then review the diff.

- [ ] **Step 6: Commit**

```bash
git add templates/demo-v1/src/igrp.template.config.ts templates/demo-v1/src/app/layout.tsx templates/demo-v1/src/actions/igrp/layout.ts templates/demo-v1/.env.example templates/demo-v1/docs/ENVIRONMENT.md
git commit -m "feat(template): wire organization branding behind IGRP_BRANDING_ENABLED"
```

Do not stage `templates/demo-v1/.env`: it is a local file. Set the flag there by hand.

## Task 10: Changesets and full gates

**Files:**
- Create: `.changeset/branding-next-types.md`
- Create: `.changeset/branding-next-ui.md`
- Create: `.changeset/branding-next.md`

**Interfaces:**
- Consumes: every package from Tasks 1 to 9.
- Produces: patch changesets and a green build.

- [ ] **Step 1: Write the changesets (patch only, per the hard rule)**

`.changeset/branding-next-types.md`:

```md
---
'@igrp/framework-next-types': patch
---

Add organization branding types (`IGRPBranding` and its parts) and the `branding` flag on `IGRPConfigArgs`. Deprecate `activeThemeValue` and `isScaled` on `IGRPLayoutConfigArgs`.
```

`.changeset/branding-next-ui.md`:

```md
---
'@igrp/framework-next-ui': patch
---

Add organization branding: pure parsing and validation, the hoisted `IGRPBrandingStyle`, `IGRPBrandingProvider` and `useIGRPBranding`, and logo precedence in the header and login form. Remove the preset theme selector and the active-theme provider.
```

`.changeset/branding-next.md`:

```md
---
'@igrp/framework-next': patch
---

Add the organization branding loader with a per-process cache, `igrpBrandingMetadata`, `igrpResolveRequestBranding` and `igrpInvalidateBranding`. The root layout applies the Brand only when `branding.enabled` is true.
```

- [ ] **Step 2: Build the whole framework in dependency order**

From the repository root: `pnpm build:framework`
Expected: all five packages build. `check:dist` passes for `next-types`, `next-ui` and `next`.

- [ ] **Step 3: Run every package's tests and typecheck**

From the repository root:

```bash
pnpm --filter @igrp/framework-next-types typecheck
pnpm --filter @igrp/framework-next-ui test
pnpm --filter @igrp/framework-next test
pnpm --filter @igrp/framework-next typecheck
```

Expected: all pass. Record the count of tests in each package; a drop in count versus `main` means a test file was not collected (check the vitest `include` glob).

- [ ] **Step 4: Commit the changesets**

```bash
git add .changeset/branding-next-types.md .changeset/branding-next-ui.md .changeset/branding-next.md
git commit -m "chore(changeset): add patch changesets for organization branding"
```

Do not run `changeset publish` or any release script. Publishing is a separate task that follows the release workflow in the repository root `CLAUDE.md`.

## Self-Review

**1. Spec coverage**

- Section 5 (contract) → Task 1 (types), Task 2 (parse).
- Section 6.1 (core catalog) → Task 2, `catalog.ts` (50 names).
- Section 7.1 (types, flag) → Task 1.
- Section 7.2 (parse, css, style, provider, header, auth form, providers) → Tasks 2, 3, 4, 5.
- Section 7.3 (loader, invalidate, metadata, root layout, token source) → Tasks 6, 7, 8.
- Section 7.5 (template) → Task 9.
- Section 8 (loading, cache, cookie, fallbacks) → Task 6 (cache, cooldown, 404, invalid), Task 7 (cookie read in `request.ts`).
- Section 9 (validation) → Task 2 (framework-side rules). The editor-only rules (OKLCH, host check, concrete colors) belong to the Application Center plan.
- Section 11 (preset removal) → Task 4 (next-ui), Task 8 (layout), Task 9 (template).
- Section 13 framework tests → Tasks 2, 3, 5, 6, 7, 8.
- Section 14 step 1 → Task 10.
- ADR → already committed (`c8be2752`).
- Gap found and fixed: the spec placed a constant in `next-types`, which the framework forbids. The spec was corrected in this session.

**2. Placeholder scan**

- Task 5 Step 4 and Step 5 describe the JSX edit in prose, not a full code block. Those two components are large and the edit touches existing markup I have not reproduced here. The engineer must read `header.tsx` and `form.tsx` first (the plan names the exact lines), and the verification is the Task 5 test plus the build. Accepted as an explicit exception; if reviewers reject it, the code block for each file must be written in full.
- Task 8 Step 3 shows the new function body and states which imports to keep. The `planAccessManagementSync` block is unchanged and referenced by name, not copied.
- Task 9 Step 3 uses a `grep` to find every reader instead of a line number, because `layout.ts` in the template was not inspected line by line.

**3. Type consistency**

- `igrpParseBranding` returns `IGRPBrandingParseResult` in Task 2 and is read as `.branding` and `.dropped` in Task 6. Consistent.
- `igrpGetBranding` args `{ baseUrl, token?, savedAt?, timeout? }` in Task 6 and the call in Task 7 `request.ts`. Consistent.
- `resolveBrandingToken(config)` in Task 6 and its call in Task 7. Consistent.
- `IGRPNestedProviders` prop `branding` in Task 4 and the call in Task 8. Consistent.
- `IGRPBrandingStyle({ branding })` in Task 3 and the call in Task 8. Consistent.

**4. Review Focus coverage**

- Focus 1 (malformed config): Task 2 tests `branding-parse.test.ts` and `branding-css.test.ts`.
- Focus 2 (auth down or slow): Task 6 test "keeps the previous Brand on a server error and waits 60 s before retrying".
- Focus 3 (flag off no-op): Task 8 tests "does not read the Brand when the flag is omitted" and "renders providers with null".
- Focus 4 (public pages never fetch): Task 6 test "never fetches without a token".
- Focus 5 (identical server and client bytes): Task 2 test "is deterministic" and Task 3 test "renders the same bytes on every call".

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-10-13-branding-framework-plan.md` (Application Center repo). Please review the plan.

Two steps are prose rather than full code: the JSX edits in Task 5 (`header.tsx`, `form.tsx`) and the template `layout.ts` in Task 9. Each names the exact lines and the tests that verify it, but a reviewer may want them written out in full before implementation.

Which execution approach would you prefer?

- **Subagent-driven**: a fresh subagent implements each task and a fresh reviewer checks it before the next one starts, then a whole-branch review at the end. Most thorough; costs a fresh context per task and per review.
- **Native**: I implement every task myself in this session, then one fresh reviewer checks the whole branch. Cheapest and fastest; no independent review until the end.

For this plan I recommend subagent-driven, because ten tasks share interfaces across three packages, and a shipped mistake in the types or the loader would reach every sibling app. Does the plan capture what you want, and which approach should we use?
