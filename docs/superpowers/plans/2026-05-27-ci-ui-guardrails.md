# CI UI Guardrails Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a GitLab `validate` CI stage and a `check:ui` lint gate that enforces the shadcn Critical Rules, so the UI-rule cleanup (Plan B) and perf/UX refactors (Plan C) cannot silently regress.

**Architecture:** A standalone Node ESM scanner (`scripts/check-ui-rules.mjs`) exposes a pure `scanContent()` function (unit-tested with Vitest) plus a CLI that walks `src/**/*.tsx`. Strict rules drive a non-zero exit code; the one advisory rule (`size-N`) only reports. A new `validate` stage in `.gitlab-ci.yml` runs lint, tests, typecheck, and the UI gate on merge-request pipelines. The gate starts non-blocking (`allow_failure: true`) and flips to blocking once Plan B clears the existing violations.

**Tech Stack:** Node 22 (ESM, `fs.readdirSync` recursive walk), Vitest 4, Biome 2.4.15, GitLab CI, pnpm.

---

## Why this sequencing

This is the prerequisite plan. It lands **before** the mechanical sweeps (Plan B) and refactors (Plan C). Because the codebase currently has ~33 `space-x/y`, ~16 raw-color, ~9 `animate-pulse`, ~7 `dark:`, and ~101 `w-N h-N` violations, the gate is wired with `allow_failure: true` so it **reports without blocking**. After Plan B clears the strict-rule violations, a one-line CI change (Task 6) flips it to blocking. The `size-N` rule stays advisory permanently (it has false positives — only equal numeric pairs are real).

## File Structure

- Create: `scripts/check-ui-rules.mjs` — the scanner. Exports `RULES`, `scanContent(content)`, `formatViolations(violations, filePath)`; CLI walks `src` when run directly.
- Create: `scripts/check-ui-rules.test.ts` — Vitest unit tests for `scanContent`.
- Modify: `package.json` — add `typecheck` and `check:ui` scripts.
- Modify: `.gitlab-ci.yml` — add `validate` stage + job.
- Modify: `AGENTS.md` — document the gate and the strict-vs-advisory policy under Conventions.

---

### Task 1: Add `typecheck` and `check:ui` npm scripts

**Files:**
- Modify: `package.json:9-19`

- [ ] **Step 1: Add the two scripts**

In `package.json`, change the `scripts` block from:

```json
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "pnpm format && next build --turbopack",
    "start": "next start",
    "lint": "biome check --write",
    "format": "biome format --write",
    "release": "pnpm i && pnpm build && pnpm start",
    "clean-all": "rimraf node_modules && rimraf .next",
    "test": "vitest run",
    "test:watch": "vitest"
  },
```

to:

```json
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "pnpm format && next build --turbopack",
    "start": "next start",
    "lint": "biome check --write",
    "format": "biome format --write",
    "typecheck": "tsc --noEmit",
    "check:ui": "node scripts/check-ui-rules.mjs",
    "release": "pnpm i && pnpm build && pnpm start",
    "clean-all": "rimraf node_modules && rimraf .next",
    "test": "vitest run",
    "test:watch": "vitest"
  },
```

- [ ] **Step 2: Verify `typecheck` runs**

Run: `pnpm typecheck`
Expected: `tsc` runs and exits 0 (or reports pre-existing type errors — note them but do not fix here; they belong to Plan C). The script itself must resolve, not error with "command not found".

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "chore(ci): add typecheck and check:ui scripts"
```

---

### Task 2: Build the `scanContent` scanner (pure, TDD)

**Files:**
- Create: `scripts/check-ui-rules.mjs`
- Test: `scripts/check-ui-rules.test.ts`

- [ ] **Step 1: Write the failing test**

Create `scripts/check-ui-rules.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { scanContent } from "./check-ui-rules.mjs";

describe("scanContent", () => {
  it("flags space-x/space-y as strict", () => {
    const v = scanContent('<div className="space-y-4">');
    expect(v).toHaveLength(1);
    expect(v[0]).toMatchObject({ ruleId: "no-space-xy", level: "strict", line: 1 });
  });

  it("does not flag flex gap utilities", () => {
    expect(scanContent('<div className="flex flex-col gap-4">')).toHaveLength(0);
  });

  it("flags equal w-N h-N pairs as advisory", () => {
    const v = scanContent('<Avatar className="w-10 h-10" />');
    expect(v).toHaveLength(1);
    expect(v[0]).toMatchObject({ ruleId: "use-size", level: "advisory" });
  });

  it("ignores non-equal w/h pairs", () => {
    expect(scanContent('<div className="w-full h-2" />')).toHaveLength(0);
  });

  it("ignores size-N", () => {
    expect(scanContent('<Avatar className="size-10" />')).toHaveLength(0);
  });

  it("flags raw color literals as strict", () => {
    const v = scanContent('<div className="bg-emerald-600" />');
    expect(v).toHaveLength(1);
    expect(v[0]).toMatchObject({ ruleId: "no-raw-color", level: "strict" });
  });

  it("flags raw colors inside variant selectors", () => {
    const v = scanContent('className="data-[state=checked]:bg-emerald-500"');
    expect(v.some((x) => x.ruleId === "no-raw-color")).toBe(true);
  });

  it("does not flag semantic tokens", () => {
    expect(scanContent('<div className="bg-primary text-muted-foreground" />')).toHaveLength(0);
  });

  it("flags animate-pulse as strict", () => {
    const v = scanContent('<div className="animate-pulse" />');
    expect(v[0]).toMatchObject({ ruleId: "no-animate-pulse", level: "strict" });
  });

  it("flags dark: color overrides as strict", () => {
    const v = scanContent('<h2 className="text-slate-900 dark:text-white" />');
    expect(v.some((x) => x.ruleId === "no-dark-color")).toBe(true);
  });

  it("flags <hr> as strict", () => {
    const v = scanContent("<hr />");
    expect(v[0]).toMatchObject({ ruleId: "use-separator", level: "strict" });
  });

  it("flags border-t divider but not border-t-2", () => {
    expect(scanContent('<div className="border-t" />')).toHaveLength(1);
    expect(scanContent('<div className="border-t-2" />')).toHaveLength(0);
  });

  it("reports correct 1-based line numbers", () => {
    const v = scanContent('line1\nline2\n<div className="space-y-2" />');
    expect(v[0].line).toBe(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run scripts/check-ui-rules.test.ts`
Expected: FAIL — `Failed to resolve import "./check-ui-rules.mjs"` (file does not exist yet).

- [ ] **Step 3: Write the scanner module**

Create `scripts/check-ui-rules.mjs`:

```js
// @ts-check
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const COLOR_NAMES =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";

/**
 * @typedef {Object} Rule
 * @property {string} id
 * @property {"strict"|"advisory"} level
 * @property {string} message
 * @property {() => RegExp} pattern  Fresh global regex per call (avoids lastIndex state).
 */

/** @type {Rule[]} */
export const RULES = [
  {
    id: "no-space-xy",
    level: "strict",
    message: "Use `flex gap-*` (or `flex-col gap-*`) instead of space-x-*/space-y-*.",
    pattern: () => /\bspace-[xy]-[\w./[\]-]+/g,
  },
  {
    id: "use-size",
    level: "advisory",
    message: "Equal width/height: prefer `size-N` over `w-N h-N`.",
    pattern: () => /\bw-(\d+)\s+h-\1\b/g,
  },
  {
    id: "no-raw-color",
    level: "strict",
    message: "Use Badge variants or semantic tokens (bg-primary, text-muted-foreground), not raw color literals.",
    pattern: () => new RegExp(`\\b(?:bg|text|border|fill|ring)-(?:${COLOR_NAMES})-\\d{2,3}\\b`, "g"),
  },
  {
    id: "no-animate-pulse",
    level: "strict",
    message: "Use the `Skeleton` primitive instead of custom animate-pulse.",
    pattern: () => /\banimate-pulse\b/g,
  },
  {
    id: "no-dark-color",
    level: "strict",
    message: "Remove manual dark: color overrides — semantic tokens handle dark mode.",
    pattern: () => new RegExp(`\\bdark:(?:bg|text|border|fill|ring)-\\S+`, "g"),
  },
  {
    id: "use-separator",
    level: "strict",
    message: "Use the `Separator` component instead of <hr> or border-t dividers.",
    pattern: () => /<hr[\s/>]|\bborder-t(?![-\w])/g,
  },
];

/**
 * @typedef {Object} Violation
 * @property {string} ruleId
 * @property {"strict"|"advisory"} level
 * @property {number} line  1-based.
 * @property {string} match
 * @property {string} message
 */

/**
 * Scan a file's text content for rule violations.
 * @param {string} content
 * @returns {Violation[]}
 */
export function scanContent(content) {
  /** @type {Violation[]} */
  const out = [];
  const lines = content.split("\n");
  lines.forEach((line, i) => {
    for (const rule of RULES) {
      const re = rule.pattern();
      let m;
      while ((m = re.exec(line)) !== null) {
        out.push({
          ruleId: rule.id,
          level: rule.level,
          line: i + 1,
          match: m[0],
          message: rule.message,
        });
      }
    }
  });
  return out;
}

/**
 * @param {Violation[]} violations
 * @param {string} filePath
 * @returns {string}
 */
export function formatViolations(violations, filePath) {
  return violations
    .map(
      (v) =>
        `  ${filePath}:${v.line}  [${v.level}] ${v.ruleId} → "${v.match}"\n      ${v.message}`,
    )
    .join("\n");
}

/** @returns {string[]} absolute-ish paths of all .tsx files under src/ */
function listTsxFiles(root = "src") {
  return readdirSync(root, { recursive: true })
    .filter((p) => typeof p === "string" && p.endsWith(".tsx"))
    .map((p) => join(root, p));
}

function main() {
  const files = listTsxFiles();
  let strictCount = 0;
  let advisoryCount = 0;
  for (const file of files) {
    const violations = scanContent(readFileSync(file, "utf8"));
    if (violations.length === 0) continue;
    console.log(formatViolations(violations, file));
    strictCount += violations.filter((v) => v.level === "strict").length;
    advisoryCount += violations.filter((v) => v.level === "advisory").length;
  }
  console.log(
    `\ncheck:ui — ${strictCount} strict, ${advisoryCount} advisory violation(s).`,
  );
  // Advisory never fails the build; strict does.
  process.exitCode = strictCount > 0 ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run scripts/check-ui-rules.test.ts`
Expected: PASS — all assertions green.

- [ ] **Step 5: Commit**

```bash
git add scripts/check-ui-rules.mjs scripts/check-ui-rules.test.ts
git commit -m "feat(ci): add check:ui shadcn-rule scanner with tests"
```

---

### Task 3: Verify the CLI runs against the real codebase

**Files:**
- (none — verification only, no code change)

- [ ] **Step 1: Run the gate against the repo**

Run: `pnpm check:ui`
Expected: prints a list of existing violations and a summary line like `check:ui — N strict, M advisory violation(s).`, then exits **non-zero** (because Plan B hasn't run yet). This confirms the CLI walks `src` and the strict exit code works. Record the strict count — Plan B must drive it to 0.

- [ ] **Step 2: Sanity-check a known-clean run**

Run: `node -e "import('./scripts/check-ui-rules.mjs').then(m => console.log(m.scanContent('<div className=\"flex gap-4\" />').length))"`
Expected: prints `0`.

- [ ] **Step 3: Commit (no-op if nothing changed)**

No file changes in this task. Skip the commit if `git status` is clean.

---

### Task 4: Add the `validate` stage to GitLab CI (non-blocking)

**Files:**
- Modify: `.gitlab-ci.yml:15-18` (stages) and add a new job

- [ ] **Step 1: Add `validate` to the stages list**

In `.gitlab-ci.yml`, change:

```yaml
stages:
  - build
  - manifest
  - deploy
```

to:

```yaml
stages:
  - validate
  - build
  - manifest
  - deploy
```

- [ ] **Step 2: Add the validate job**

Append this job to `.gitlab-ci.yml` (place it after the `variables:` block, before `.build-template`):

```yaml
validate:
  stage: validate
  image: node:22-alpine
  tags:
    - nosi-runner
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
  # allow_failure stays true until Plan B clears existing strict violations,
  # then it is removed (see Task 6) so strict UI rules block merges.
  allow_failure: true
  before_script:
    - corepack enable
    - corepack prepare pnpm@latest --activate
  script:
    - pnpm install --frozen-lockfile
    - pnpm lint
    - pnpm typecheck
    - pnpm test
    - pnpm check:ui
```

- [ ] **Step 3: Validate the YAML locally**

Run: `node -e "const f=require('fs').readFileSync('.gitlab-ci.yml','utf8'); console.log(f.includes('validate:') && f.includes('- validate'))"`
Expected: prints `true` (job present and stage registered). If your environment has `yamllint`, also run `yamllint .gitlab-ci.yml` and expect no syntax errors.

- [ ] **Step 4: Commit**

```bash
git add .gitlab-ci.yml
git commit -m "ci: add non-blocking validate stage (lint, typecheck, test, check:ui)"
```

---

### Task 5: Document the gate in AGENTS.md

**Files:**
- Modify: `AGENTS.md` (Conventions section, around line 102-107)

- [ ] **Step 1: Add the gate policy under Conventions**

In `AGENTS.md`, find the `## Conventions` list (the bullet starting `- Formatter/linter: Biome 2.4.15...`) and add these two bullets at the end of that list:

```markdown
- CI gate: merge-request pipelines run a `validate` stage (`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm check:ui`) before build. See [.gitlab-ci.yml](.gitlab-ci.yml).
- `pnpm check:ui` ([scripts/check-ui-rules.mjs](scripts/check-ui-rules.mjs)) enforces shadcn Critical Rules on `src/**/*.tsx`. **Strict** (fail build): `space-x/y-*`, raw color literals, `animate-pulse`, manual `dark:` color overrides, `<hr>`/`border-t` dividers. **Advisory** (report only): equal `w-N h-N` → `size-N`. The validate job is `allow_failure: true` until the initial cleanup lands, then flipped to blocking.
```

- [ ] **Step 2: Verify the edit**

Run: `node -e "console.log(require('fs').readFileSync('AGENTS.md','utf8').includes('pnpm check:ui'))"`
Expected: prints `true`.

- [ ] **Step 3: Commit**

```bash
git add AGENTS.md
git commit -m "docs: document validate stage and check:ui rule policy"
```

---

### Task 6: Flip the gate to blocking — DEFERRED until Plan B completes

**Files:**
- Modify: `.gitlab-ci.yml` (the `validate` job)

> **Do NOT execute this task in the guardrails plan.** It is documented here so the follow-up is not lost. Execute it only after Plan B (mechanical UI sweeps) has driven `pnpm check:ui` strict count to 0.

- [ ] **Step 1 (deferred): Confirm strict count is zero**

Run: `pnpm check:ui`
Expected: summary line shows `0 strict` (advisory may be > 0 — that's fine).

- [ ] **Step 2 (deferred): Remove `allow_failure`**

In `.gitlab-ci.yml`, delete the line `  allow_failure: true` and its comment from the `validate` job so strict violations block merges.

- [ ] **Step 3 (deferred): Update AGENTS.md**

Remove the trailing sentence "The validate job is `allow_failure: true` until the initial cleanup lands, then flipped to blocking." from the `check:ui` bullet.

- [ ] **Step 4 (deferred): Commit**

```bash
git add .gitlab-ci.yml AGENTS.md
git commit -m "ci: make check:ui strict rules block merges"
```

---

## Self-Review

**Spec coverage:**
- #1 (validate stage) → Task 4. ✓
- #2 (check:ui gate, strict/advisory split, MR-based, advisory-then-strict) → Tasks 2, 3, 4, 6. ✓
- AGENTS.md "design system is shadcn" note → already landed in a prior edit; gate policy → Task 5. ✓

**Placeholder scan:** No TBD/TODO/"handle edge cases". All code blocks complete. ✓

**Type consistency:** `scanContent` returns `Violation[]` with `{ ruleId, level, line, match, message }` — the test asserts exactly these keys (`ruleId`, `level`, `line`), and `formatViolations`/`main` read the same keys. `RULES[].pattern` is a factory `() => RegExp` (fresh regex avoids `lastIndex` bleakage across lines) — used consistently in `scanContent`. ✓

**Known limitation (intentional):** the scanner is regex-on-text, not AST-aware. It can flag a banned token appearing in a comment or string literal. Accepted: false positives are rare in `.tsx`, the advisory rule is non-blocking, and the alternative (a second AST linter) was rejected during planning as contradicting the single-Biome convention.
