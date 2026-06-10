# Status-Aware Error Pages (401/403/404/500/503) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a page-load fetch to the access-manager fails, render a full-page, status-specific error page (401/403/404/500/503 + generic fallback) in place, showing the API message as secondary text.

**Architecture:** Server actions propagate the HTTP status in `ActionResult`. Server pages throw a new `HttpStatusError` whose `digest` encodes `status|message` (survives Next.js production redaction). Segment `error.tsx` boundaries delegate to a shared `StatusAwareError` that renders `StatusErrorPage` when the digest carries a status, or the segment's existing fallback UI otherwise.

**Tech Stack:** Next.js 15 App Router, React 19, TanStack Query v5, `@igrp/igrp-framework-react-design-system`, Vitest + Testing Library, Biome.

**Spec:** `docs/superpowers/specs/2026-06-10-status-error-pages-design.md`

**Verification commands** (used throughout):

```bash
pnpm test          # vitest run
pnpm typecheck     # tsc --noEmit
pnpm lint          # biome check --write
```

---

### Task 1: `HttpStatusError` + `parseHttpStatusDigest`

**Files:**
- Modify: `src/lib/errors.ts` (append at end)
- Test: `src/__tests__/errors/http-status-error.test.ts` (new)

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/errors/http-status-error.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { HttpStatusError, parseHttpStatusDigest } from "@/lib/errors";

describe("HttpStatusError / parseHttpStatusDigest", () => {
  it("round-trips status and message through the digest", () => {
    const err = new HttpStatusError(403, "Não tem permissões");
    expect(parseHttpStatusDigest(err.digest)).toEqual({
      status: 403,
      message: "Não tem permissões",
    });
  });

  it("round-trips a missing status", () => {
    const err = new HttpStatusError(undefined, "Algo falhou");
    expect(parseHttpStatusDigest(err.digest)).toEqual({
      status: undefined,
      message: "Algo falhou",
    });
  });

  it("round-trips a missing message", () => {
    const err = new HttpStatusError(503);
    expect(parseHttpStatusDigest(err.digest)).toEqual({
      status: 503,
      message: undefined,
    });
  });

  it("preserves pipes inside the message", () => {
    const err = new HttpStatusError(400, "campo a | campo b");
    expect(parseHttpStatusDigest(err.digest)?.message).toBe(
      "campo a | campo b",
    );
  });

  it("returns null for digests it did not produce", () => {
    expect(parseHttpStatusDigest(undefined)).toBeNull();
    expect(parseHttpStatusDigest("")).toBeNull();
    expect(parseHttpStatusDigest("abc123")).toBeNull();
    // AppError-style digest ("<errorId>|<message>") must not match.
    expect(parseHttpStatusDigest("1718-ab12cd|mensagem pública")).toBeNull();
  });

  it("is an instance of Error and HttpStatusError", () => {
    const err = new HttpStatusError(500, "x");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(HttpStatusError);
    expect(err.status).toBe(500);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/__tests__/errors/http-status-error.test.ts`
Expected: FAIL — `HttpStatusError` is not exported from `@/lib/errors`.

- [ ] **Step 3: Write the implementation**

Append to `src/lib/errors.ts`:

```ts
// ── HTTP status errors (status-aware error pages) ────────────────────────────

const HTTP_STATUS_DIGEST_PREFIX = "HTTP_STATUS_";

/**
 * Thrown by server pages when an access-manager fetch fails with an HTTP
 * status. Next.js redacts `error.message` across the server→client boundary
 * in production but leaves `error.digest` untouched (same trick as
 * `AppError`), so the status and public message are encoded into `digest`
 * as `HTTP_STATUS_<status>|<message>` and recovered client-side by
 * `parseHttpStatusDigest` inside an `error.tsx` boundary.
 */
export class HttpStatusError extends Error {
  digest: string;

  constructor(
    public readonly status?: number,
    publicMessage?: string,
  ) {
    super(publicMessage || `HTTP ${status ?? "error"}`);
    this.name = "HttpStatusError";
    this.digest = `${HTTP_STATUS_DIGEST_PREFIX}${status ?? ""}|${publicMessage ?? ""}`;
    Object.setPrototypeOf(this, HttpStatusError.prototype);
  }
}

/**
 * Recovers `{ status, message }` from a digest written by `HttpStatusError`.
 * Returns `null` for any other digest (AppError digests, React digests, …)
 * so callers can fall through to their existing error handling.
 */
export function parseHttpStatusDigest(
  digest: string | undefined,
): { status?: number; message?: string } | null {
  if (!digest?.startsWith(HTTP_STATUS_DIGEST_PREFIX)) return null;
  const rest = digest.slice(HTTP_STATUS_DIGEST_PREFIX.length);
  const sep = rest.indexOf("|");
  if (sep === -1) return null;
  const statusRaw = rest.slice(0, sep);
  const status = statusRaw ? Number(statusRaw) : undefined;
  return {
    status: Number.isFinite(status) ? status : undefined,
    message: rest.slice(sep + 1) || undefined,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/__tests__/errors/http-status-error.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/errors.ts src/__tests__/errors/http-status-error.test.ts
git commit -m "feat(errors): add HttpStatusError with digest-encoded status and message"
```

---

### Task 2: `toActionError` + `isDefaultApiErrorMessage` in utilities

**Files:**
- Modify: `src/lib/utilities.ts` (the `extractApiError` area, lines ~109–172)
- Test: `src/__tests__/errors/to-action-error.test.ts` (new)

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/errors/to-action-error.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { isDefaultApiErrorMessage, toActionError } from "@/lib/utilities";

describe("toActionError", () => {
  it("extracts message and numeric status from an SDK-shaped error", () => {
    const result = toActionError({
      status: 403,
      details: JSON.stringify({ details: "Sem permissão para listar" }),
    });
    expect(result).toEqual({
      error: "Sem permissão para listar",
      status: 403,
    });
  });

  it("falls back to the default message but keeps the status", () => {
    const result = toActionError({ status: 401 });
    expect(result).toEqual({ error: "Não autorizado", status: 401 });
  });

  it("returns undefined status when the error has none", () => {
    const result = toActionError(new Error("network down"));
    expect(result).toEqual({ error: "network down", status: undefined });
  });

  it("ignores non-numeric status values", () => {
    const result = toActionError({ status: "oops", message: "x" });
    expect(result.status).toBeUndefined();
  });
});

describe("isDefaultApiErrorMessage", () => {
  it("recognises the per-status default strings", () => {
    expect(isDefaultApiErrorMessage("Não autorizado")).toBe(true);
    expect(isDefaultApiErrorMessage("Acesso negado")).toBe(true);
    expect(isDefaultApiErrorMessage("Erro na operação")).toBe(true);
  });

  it("rejects real API messages", () => {
    expect(isDefaultApiErrorMessage("O utilizador não tem o perfil X")).toBe(
      false,
    );
    expect(isDefaultApiErrorMessage("")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/__tests__/errors/to-action-error.test.ts`
Expected: FAIL — `toActionError` is not exported.

- [ ] **Step 3: Write the implementation**

In `src/lib/utilities.ts`, the existing private `getDefaultErrorMessage(status)` (around line 147) stays as is. Append after it:

```ts
/** Every string `getDefaultErrorMessage` can produce. */
const DEFAULT_API_ERROR_MESSAGES = new Set(
  [400, 401, 403, 404, 409, 422, 429, 500, 502, 503, undefined].map(
    getDefaultErrorMessage,
  ),
);

/**
 * True when `message` is one of the generic per-status fallbacks produced
 * by `extractApiError`, i.e. NOT a real message from the API. Used by the
 * status error page to avoid repeating the default copy twice.
 */
export function isDefaultApiErrorMessage(message: string): boolean {
  return DEFAULT_API_ERROR_MESSAGES.has(message);
}

/**
 * Builds the failure payload for `ActionResult`: the human message from
 * `extractApiError` plus the raw HTTP status when the SDK error carries one.
 */
export function toActionError(error: unknown): {
  error: string;
  status?: number;
} {
  const e = (error ?? {}) as ApiErrorLike;
  return {
    error: extractApiError(error),
    status: typeof e.status === "number" ? e.status : undefined,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/__tests__/errors/to-action-error.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/utilities.ts src/__tests__/errors/to-action-error.test.ts
git commit -m "feat(errors): add toActionError and isDefaultApiErrorMessage helpers"
```

---

### Task 3: Propagate status through `ActionResult` and all action catch blocks

**Files:**
- Modify: `src/actions/types.ts:7-9`
- Modify: `src/actions/user.ts`, `src/actions/applications.ts`, `src/actions/departments.ts`, `src/actions/roles.ts`, `src/actions/file.ts`, `src/actions/user-sessions.ts`, `src/actions/user-audit.ts` (mechanical sweep — ~91 catch blocks)

No new unit test: the change is type-additive and mechanical; `pnpm typecheck` plus the existing suite is the verification.

- [ ] **Step 1: Add `status` to the failure arm of `ActionResult`**

In `src/actions/types.ts` change:

```ts
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
```

to:

```ts
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; status?: number };
```

- [ ] **Step 2: Sweep the catch blocks**

Every catch block currently reads:

```ts
return { success: false, error: extractApiError(error) };
```

and must become:

```ts
return { success: false, ...toActionError(error) };
```

Run the sweep with PowerShell (from the repo root):

```powershell
$files = Get-ChildItem src/actions -Filter *.ts -Recurse
foreach ($f in $files) {
  $c = Get-Content $f.FullName -Raw
  $c = $c -replace 'error:\s*extractApiError\(error\)', '...toActionError(error)'
  Set-Content $f.FullName $c -NoNewline
}
```

Then update the imports in each of the 7 action files: replace `extractApiError` with `toActionError` in the `from "@/lib/utilities"` import line (keep `extractApiError` only if the file still uses it elsewhere — verify with the grep below).

- [ ] **Step 3: Verify the sweep is complete**

```bash
grep -rn "extractApiError" src/actions/
```

Expected: no matches (every use was the catch-block pattern).

```bash
grep -rn "toActionError" src/actions/ | wc -l
```

Expected: ~91 usages + 7 import lines.

- [ ] **Step 4: Typecheck, lint, and run the full suite**

```bash
pnpm typecheck && pnpm lint && pnpm test
```

Expected: all pass. (Biome also fixes import ordering from the sweep.)

- [ ] **Step 5: Commit**

```bash
git add src/actions src/lib/utilities.ts
git commit -m "feat(actions): propagate HTTP status in ActionResult failures"
```

---

### Task 4: Status error copy in `error-messages.ts`

**Files:**
- Modify: `src/config/error-messages.ts` (append at end)

No dedicated test — the copy map is exercised by the `StatusErrorPage` tests in Task 5.

- [ ] **Step 1: Add the copy map**

Append to `src/config/error-messages.ts`:

```ts
// ── Status-code error pages (401/403/404/500/503) ────────────────────────────

export const STATUS_ERROR_COPY: Record<number, ErrorCopy> = {
  401: {
    title: "Acesso não autorizado",
    description:
      "Inicie sessão com as credenciais adequadas para aceder a este recurso.",
  },
  403: {
    title: "Acesso negado",
    description: "Não tem permissões para ver este recurso.",
  },
  404: {
    title: "Página não encontrada",
    description: "A página que procura não existe ou foi removida.",
  },
  500: {
    title: "Ocorreu um erro",
    description: "Pedimos desculpa pelo incómodo. Tente novamente mais tarde.",
  },
  503: {
    title: "Serviço em manutenção",
    description:
      "O serviço não está disponível de momento. Voltaremos em breve.",
  },
};

export const FALLBACK_STATUS_COPY: ErrorCopy = {
  title: "Ocorreu um erro",
  description: "Tente novamente. Se o problema persistir, contacte o suporte.",
};
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/config/error-messages.ts
git commit -m "feat(errors): add Portuguese copy for status error pages"
```

---

### Task 5: `StatusErrorPage` component

**Files:**
- Create: `src/components/errors/status-error-page.tsx`
- Test: `src/__tests__/errors/status-error-page.test.tsx` (new)

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/errors/status-error-page.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const back = vi.fn();
const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back, push }),
}));

vi.mock("@igrp/igrp-framework-react-design-system", () => ({
  Button: ({
    children,
    onClick,
    ...rest
  }: {
    children?: React.ReactNode;
    onClick?: () => void;
  } & Record<string, unknown>) => (
    <button onClick={onClick} {...rest}>
      {children}
    </button>
  ),
}));

import { StatusErrorPage } from "@/components/errors/status-error-page";

describe("StatusErrorPage", () => {
  it("renders the status number, default title and description for 403", () => {
    render(<StatusErrorPage status={403} />);
    expect(screen.getByText("403")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /acesso negado/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/não tem permissões para ver este recurso/i),
    ).toBeInTheDocument();
  });

  it("shows the API message as secondary text below the default copy", () => {
    render(
      <StatusErrorPage status={403} message="O utilizador não tem o perfil X" />,
    );
    // Default copy is ALWAYS shown…
    expect(
      screen.getByText(/não tem permissões para ver este recurso/i),
    ).toBeInTheDocument();
    // …and the API message appears in addition.
    expect(
      screen.getByText(/o utilizador não tem o perfil x/i),
    ).toBeInTheDocument();
  });

  it("hides the API message when it is just the per-status default", () => {
    render(<StatusErrorPage status={403} message="Acesso negado" />);
    expect(screen.getAllByText(/acesso negado/i)).toHaveLength(1); // title only
  });

  it("renders fallback copy when the status is unknown", () => {
    render(<StatusErrorPage status={418} />);
    expect(screen.getByText("418")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /ocorreu um erro/i }),
    ).toBeInTheDocument();
  });

  it("renders fallback copy without a number when status is missing", () => {
    render(<StatusErrorPage />);
    expect(
      screen.getByRole("heading", { name: /ocorreu um erro/i }),
    ).toBeInTheDocument();
  });

  it("navigates back and home", async () => {
    render(<StatusErrorPage status={500} />);
    await userEvent.click(screen.getByRole("button", { name: /voltar/i }));
    expect(back).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole("button", { name: /início/i }));
    expect(push).toHaveBeenCalledWith("/");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/__tests__/errors/status-error-page.test.tsx`
Expected: FAIL — module `@/components/errors/status-error-page` not found.

- [ ] **Step 3: Write the implementation**

Create `src/components/errors/status-error-page.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";

import { Button } from "@igrp/igrp-framework-react-design-system";

import {
  FALLBACK_STATUS_COPY,
  STATUS_ERROR_COPY,
} from "@/config/error-messages";
import { isDefaultApiErrorMessage } from "@/lib/utilities";

export interface StatusErrorPageProps {
  /** HTTP status from the failed access-manager call, when known. */
  status?: number;
  /** Message extracted from the API error, shown as secondary text. */
  message?: string;
}

/**
 * Full-page error for HTTP failures (401/403/404/500/503 + fallback).
 * The default copy for the status is always shown; the API message is
 * rendered smaller below it, and suppressed when it merely repeats the
 * generic per-status fallback.
 */
export function StatusErrorPage({ status, message }: StatusErrorPageProps) {
  const router = useRouter();
  const copy =
    (status !== undefined && STATUS_ERROR_COPY[status]) ||
    FALLBACK_STATUS_COPY;
  const apiMessage =
    message && !isDefaultApiErrorMessage(message) ? message : undefined;

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      {status !== undefined && (
        <span className="text-8xl font-extrabold tracking-tight">
          {status}
        </span>
      )}
      <h1 className="text-lg font-semibold">{copy.title}</h1>
      <p className="text-muted-foreground max-w-md text-sm">
        {copy.description}
      </p>
      {apiMessage && (
        <p className="text-muted-foreground/80 max-w-md text-xs">
          {apiMessage}
        </p>
      )}
      <div className="mt-2 flex gap-3">
        <Button variant="outline" onClick={() => router.back()}>
          Voltar
        </Button>
        <Button onClick={() => router.push("/")}>Início</Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/__tests__/errors/status-error-page.test.tsx`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/errors/status-error-page.tsx src/__tests__/errors/status-error-page.test.tsx
git commit -m "feat(errors): add StatusErrorPage component"
```

---

### Task 6: `StatusAwareError` shared boundary component

**Files:**
- Create: `src/components/errors/status-aware-error.tsx`
- Test: `src/__tests__/errors/status-aware-error.test.tsx` (new)

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/errors/status-aware-error.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
}));

vi.mock("@igrp/igrp-framework-react-design-system", () => ({
  Button: ({
    children,
    ...rest
  }: { children?: React.ReactNode } & Record<string, unknown>) => (
    <button {...rest}>{children}</button>
  ),
}));

import { StatusAwareError } from "@/components/errors/status-aware-error";
import { HttpStatusError } from "@/lib/errors";

describe("StatusAwareError", () => {
  it("renders StatusErrorPage when the digest carries an HTTP status", () => {
    const error = new HttpStatusError(403, "Sem permissão");
    render(
      <StatusAwareError error={error} fallback={<div>fallback ui</div>} />,
    );
    expect(screen.getByText("403")).toBeInTheDocument();
    expect(screen.getByText(/sem permissão/i)).toBeInTheDocument();
    expect(screen.queryByText("fallback ui")).not.toBeInTheDocument();
  });

  it("renders the fallback for errors without an HTTP digest", () => {
    const error = Object.assign(new Error("boom"), { digest: "abc123" });
    render(
      <StatusAwareError error={error} fallback={<div>fallback ui</div>} />,
    );
    expect(screen.getByText("fallback ui")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/__tests__/errors/status-aware-error.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

Create `src/components/errors/status-aware-error.tsx`:

```tsx
"use client";

import type { ReactNode } from "react";

import { parseHttpStatusDigest } from "@/lib/errors";

import { StatusErrorPage } from "./status-error-page";

export interface StatusAwareErrorProps {
  error: Error & { digest?: string };
  /** Rendered when the error does NOT carry an HTTP status digest. */
  fallback: ReactNode;
}

/**
 * Shared logic for segment `error.tsx` boundaries: HTTP failures thrown as
 * `HttpStatusError` render the full-page status UI; anything else falls
 * back to the segment's existing error UI.
 */
export function StatusAwareError({ error, fallback }: StatusAwareErrorProps) {
  const parsed = parseHttpStatusDigest(error.digest);
  if (parsed) {
    return <StatusErrorPage status={parsed.status} message={parsed.message} />;
  }
  return <>{fallback}</>;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/__tests__/errors/status-aware-error.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/errors/status-aware-error.tsx src/__tests__/errors/status-aware-error.test.tsx
git commit -m "feat(errors): add StatusAwareError boundary helper"
```

---

### Task 7: Wire `StatusAwareError` into the segment `error.tsx` boundaries

**Files:**
- Modify: `src/app/(igrp)/error.tsx`
- Modify: `src/app/(igrp)/(home)/settings/users/error.tsx`
- Modify: `src/app/(igrp)/(home)/settings/departments/error.tsx`
- Modify: `src/app/(igrp)/(home)/settings/applications/error.tsx`
- Modify: `src/app/(igrp)/(home)/settings/applications/[code]/error.tsx`

Pattern: each boundary keeps its reporting `useEffect` and existing UI, but the existing UI moves into the `fallback` prop. The existing test `src/__tests__/departments/error.test.tsx` must keep passing unchanged (errors without an HTTP digest render the same UI as today).

- [ ] **Step 1: Update `src/app/(igrp)/error.tsx`**

```tsx
"use client";

// Segment-level error boundary for the `(igrp)` route group.
//
// Rendered *inside* `(igrp)/layout.tsx`, so the header + sidebar chrome stay
// visible. HTTP failures (thrown as `HttpStatusError`) render the full-page
// status UI; anything else uses `IGRPSegmentError` as before. Errors thrown
// by `(igrp)/layout.tsx` itself propagate higher — the root `error.tsx` /
// `global-error.tsx` catches those.

import { useEffect } from "react";

import { IGRPSegmentError } from "@igrp/framework-next-ui";

import { StatusAwareError } from "@/components/errors/status-aware-error";
import { resolveErrorCopy } from "@/config/error-messages";
import { reportError } from "@/lib/report-error";

export default function IgrpSegmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error, { segment: "(igrp)" });
  }, [error]);

  return (
    <StatusAwareError
      error={error}
      fallback={
        <IGRPSegmentError
          error={error}
          reset={reset}
          resolveCopy={resolveErrorCopy}
        />
      }
    />
  );
}
```

- [ ] **Step 2: Update `src/app/(igrp)/(home)/settings/users/error.tsx`**

```tsx
"use client";

import { useEffect } from "react";

import { IGRPButton, IGRPIcon } from "@igrp/igrp-framework-react-design-system";

import { StatusAwareError } from "@/components/errors/status-aware-error";

export default function UsersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[users-segment] error:", error);
  }, [error]);

  return (
    <StatusAwareError
      error={error}
      fallback={
        <div className="flex flex-col items-center gap-4 p-10 text-center">
          <IGRPIcon
            iconName="AlertTriangle"
            className="size-10 text-destructive"
          />
          <h2 className="text-lg font-semibold">
            Não foi possível carregar os utilizadores
          </h2>
          <p className="text-sm text-muted-foreground max-w-md">
            {error.message}
          </p>
          <IGRPButton onClick={reset}>Tentar novamente</IGRPButton>
        </div>
      }
    />
  );
}
```

- [ ] **Step 3: Update `src/app/(igrp)/(home)/settings/departments/error.tsx`**

```tsx
"use client";

import { useEffect } from "react";

import { Button, IGRPIcon } from "@igrp/igrp-framework-react-design-system";

import { StatusAwareError } from "@/components/errors/status-aware-error";
import { reportError } from "@/lib/report-error";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DepartmentsError({ error, reset }: Props) {
  useEffect(() => {
    reportError(error, { segment: "settings/departments" });
  }, [error]);

  return (
    <StatusAwareError
      error={error}
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[320px] gap-4 px-6 text-center">
          <IGRPIcon
            iconName="TriangleAlert"
            className="size-10 text-destructive"
            strokeWidth={1.5}
          />
          <h2 className="text-lg font-semibold">
            Não foi possível carregar departamentos
          </h2>
          <p className="text-muted-foreground text-sm max-w-md">
            Ocorreu um erro ao obter a lista. Tenta novamente; se persistir,
            contacta o suporte.
          </p>
          <Button onClick={reset} variant="outline">
            <IGRPIcon iconName="RefreshCw" className="size-4" strokeWidth={2} />
            Tentar novamente
          </Button>
          {error.digest && (
            <p className="text-muted-foreground text-xs">Ref: {error.digest}</p>
          )}
        </div>
      }
    />
  );
}
```

- [ ] **Step 4: Update `src/app/(igrp)/(home)/settings/applications/error.tsx`**

```tsx
"use client";

import { useEffect } from "react";

import { StatusAwareError } from "@/components/errors/status-aware-error";
import { InlineError } from "@/components/inline-error";

export default function ApplicationsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[applications] segment error", error);
  }, [error]);

  return (
    <StatusAwareError
      error={error}
      fallback={
        <InlineError
          title="Não foi possível carregar as aplicações."
          message={error.message}
          onRetry={reset}
        />
      }
    />
  );
}
```

- [ ] **Step 5: Update `src/app/(igrp)/(home)/settings/applications/[code]/error.tsx`**

```tsx
"use client";

import { useEffect } from "react";

import { StatusAwareError } from "@/components/errors/status-aware-error";
import { InlineError } from "@/components/inline-error";

export default function ApplicationDetailsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[applications/:code] segment error", error);
  }, [error]);

  return (
    <StatusAwareError
      error={error}
      fallback={
        <InlineError
          title="Não foi possível carregar esta aplicação."
          message={error.message}
          onRetry={reset}
        />
      }
    />
  );
}
```

- [ ] **Step 6: Run the full suite (existing boundary tests must pass)**

```bash
pnpm test && pnpm typecheck && pnpm lint
```

Expected: PASS — in particular `src/__tests__/departments/error.test.tsx` (5 tests) unchanged. NOTE: that test mocks `@igrp/igrp-framework-react-design-system`; since `StatusAwareError` only renders `StatusErrorPage` for HTTP digests (the test uses `digest: "abc123"`), the fallback path renders exactly as before. If the test fails on the missing `next/navigation` mock (pulled in via `StatusErrorPage`'s import), add to the top of that test file:

```ts
vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
}));
```

- [ ] **Step 7: Commit**

```bash
git add "src/app/(igrp)/error.tsx" "src/app/(igrp)/(home)/settings"
git commit -m "feat(errors): render status error pages from segment boundaries"
```

---

### Task 8: Pages throw `HttpStatusError` on primary-fetch failure

**Files:**
- Modify: `src/app/(igrp)/(home)/settings/users/page.tsx`
- Modify: `src/app/(igrp)/(home)/settings/users/[id]/page.tsx`
- Modify: `src/app/(igrp)/(home)/settings/departments/page.tsx`
- Modify: `src/features/applications/prefetch.ts`
- Modify: `src/features/users/prefetch.ts`

Key insight: `queryClient.prefetchQuery` **swallows** errors, so failed fetches never reach the boundary today. Primary fetches switch to `queryClient.fetchQuery` (which throws the queryFn's error) — the cache is still seeded for hydration. Secondary fetches keep `prefetchQuery` and degrade gracefully.

Primary resource per page (from the spec): users list → `getUsers`; user detail → `getUser`; departments → `getDepartments`; applications list → `getApplications`; application detail → `getApplicationByCode`; home → `getCurrentUser`.

- [ ] **Step 1: Update `src/app/(igrp)/(home)/settings/users/page.tsx`**

```tsx
import { getUserInvitations, getUsers } from "@/actions/user";
import { UserListTable } from "@/features/users/components/user-list-table";
import { HttpStatusError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export default async function UserPage() {
  const [usersResult, invitationsResult] = await Promise.all([
    getUsers(),
    getUserInvitations(),
  ]);

  // Users are the page's primary resource — fail the whole page.
  if (!usersResult.success) {
    throw new HttpStatusError(usersResult.status, usersResult.error);
  }

  // Invitations are secondary — degrade to an empty list.
  const initialInvitations = invitationsResult.success
    ? invitationsResult.data
    : [];

  return (
    <UserListTable
      initialUsers={usersResult.data}
      initialInvitations={initialInvitations}
    />
  );
}
```

- [ ] **Step 2: Update `src/app/(igrp)/(home)/settings/users/[id]/page.tsx`**

`fetchQuery` replaces `prefetchQuery` + the manual cache check; `notFound()` is no longer needed because a 404 renders the in-place 404 status page.

```tsx
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { getUser } from "@/actions/user";
import { UserDetailView } from "@/features/users/components/user-detail-view";
import { HttpStatusError } from "@/lib/errors";
import { makeQueryClient } from "@/providers/query-client";

export const dynamic = "force-dynamic";

export default async function UserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const queryClient = makeQueryClient();
  // fetchQuery (unlike prefetchQuery) rethrows the queryFn error, so an
  // HTTP failure reaches the segment error boundary as a status page.
  await queryClient.fetchQuery({
    queryKey: ["user", id],
    queryFn: async () => {
      const result = await getUser(id);
      if (!result.success) {
        throw new HttpStatusError(result.status, result.error);
      }
      return result.data;
    },
  });
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UserDetailView id={id} />
    </HydrationBoundary>
  );
}
```

- [ ] **Step 3: Update `src/app/(igrp)/(home)/settings/departments/page.tsx`**

```tsx
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { getDepartments } from "@/actions/departments";
import { DepartmentListTree } from "@/features/departments/components/dept-list-tree";
import { HttpStatusError } from "@/lib/errors";
import { makeQueryClient } from "@/providers/query-client";

export default async function DepartmentListPage() {
  const queryClient = makeQueryClient();

  // fetchQuery rethrows on failure so the boundary shows the status page.
  await queryClient.fetchQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const result = await getDepartments();
      if (!result.success) {
        throw new HttpStatusError(result.status, result.error);
      }
      return result.data;
    },
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DepartmentListTree />
    </HydrationBoundary>
  );
}
```

- [ ] **Step 4: Update `src/features/applications/prefetch.ts`**

Both helpers are page-primary fetches → `fetchQuery` + `HttpStatusError`:

```ts
import { cache } from "react";

import type { QueryClient } from "@tanstack/react-query";

import {
  getApplicationByCode as getApplicationByCodeAction,
  getApplications,
} from "@/actions/applications";
import { HttpStatusError } from "@/lib/errors";
import { makeQueryClient } from "@/providers/query-client";

import { applicationsKeys } from "./query-keys";

export { makeQueryClient };

export const getApplicationByCodeCached = cache(getApplicationByCodeAction);

export async function prefetchApplicationsList(client: QueryClient) {
  // fetchQuery rethrows on failure so the segment boundary can render the
  // status error page (prefetchQuery would swallow the error).
  await client.fetchQuery({
    queryKey: applicationsKeys.list(),
    queryFn: async () => {
      const result = await getApplications();
      if (!result.success) {
        throw new HttpStatusError(result.status, result.error);
      }
      return result.data;
    },
  });
}

export async function prefetchApplicationByCode(
  client: QueryClient,
  code: string,
) {
  await client.fetchQuery({
    queryKey: applicationsKeys.detail(code),
    queryFn: async () => {
      const result = await getApplicationByCodeCached(code);
      if (!result.success) {
        throw new HttpStatusError(result.status, result.error);
      }
      return result.data;
    },
  });
}
```

- [ ] **Step 5: Update `src/features/users/prefetch.ts` (home dashboard)**

Only the `current-user` query is primary; the other six stay `prefetchQuery` and degrade gracefully. Change only the first entry in the `Promise.all` array:

```ts
import type { QueryClient } from "@tanstack/react-query";

import {
  getCurrentUser,
  getCurrentUserActiveRole,
  getCurrentUserApplications,
  getCurrentUserDepartments,
  getCurrentUserFavoriteApplications,
  getCurrentUserRecentApplications,
  getCurrentUserRoles,
} from "@/actions/user";
import { HttpStatusError } from "@/lib/errors";
import { makeQueryClient } from "@/providers/query-client";

export { makeQueryClient };
```

and inside `prefetchCurrentUserDashboard`, replace the `current-user` block:

```ts
    // Primary resource: without the current user the launcher is unusable,
    // so a failure here surfaces the status error page (fetchQuery throws;
    // the secondary prefetchQuery calls below degrade gracefully).
    client.fetchQuery({
      queryKey: ["current-user"],
      queryFn: async () => {
        const r = await getCurrentUser();
        if (!r.success) throw new HttpStatusError(r.status, r.error);
        return r.data;
      },
    }),
```

(All other entries keep `prefetchQuery` + `throw new Error(r.error)` exactly as they are.)

- [ ] **Step 6: Check `src/features/users/prefetch.test.ts` still passes**

Run: `pnpm vitest run src/features/users/prefetch.test.ts`
Expected: PASS. If it asserts `prefetchQuery` is called for `current-user`, update that single assertion to expect `fetchQuery` instead.

- [ ] **Step 7: Full verification**

```bash
pnpm test && pnpm typecheck && pnpm lint
```

Expected: all pass.

- [ ] **Step 8: Commit**

```bash
git add "src/app/(igrp)/(home)" src/features/applications/prefetch.ts src/features/users/prefetch.ts
git commit -m "feat(errors): throw HttpStatusError from page-load fetches"
```

---

### Task 9: Manual smoke test

**Files:** none (verification only).

- [ ] **Step 1: Start the dev server**

Run: `pnpm dev`

- [ ] **Step 2: Force a failure and verify the page**

Easiest reliable simulation: temporarily edit `src/actions/user.ts` → `getUsers` to `throw { status: 403, message: "Acesso negado pelo simulador" }` at the top of the `try`, then visit `/settings/users`.

Expected: full-page **403 / Acesso negado** with description "Não tem permissões para ver este recurso.", the simulated message below in smaller text, and working "Voltar" / "Início" buttons — with the app header/sidebar still visible.

Repeat with `status: 401`, `503`, and no status (plain `new Error("x")` → segment fallback UI, unchanged behavior).

- [ ] **Step 3: Revert the simulation edit**

```bash
git checkout -- src/actions/user.ts
```

- [ ] **Step 4: (Real-backend check, optional)** With an expired token or a user lacking permissions, navigate to `/settings/users`, `/settings/departments`, `/settings/applications` and confirm the status pages render in place.
