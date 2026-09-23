# OAuth Clients Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the **OAuth Clients** half of the new `/settings/accounts` area — list, register (with one-time secret disclosure), in-place edit, deactivate/reactivate and delete — on top of server actions and a React Query data layer.

**Architecture:** Server actions in `src/actions/` wrap the SDK (`client.oauthClients`, `client.serviceAccounts`) and return `ActionResult<T>`. A new `src/features/oauth-clients/` domain holds pure helpers (request building, validation, formatting), the Zod form schema, query keys/options/prefetch, hooks, and components. Pages under `src/app/(igrp)/(home)/settings/accounts/` prefetch on the server and hydrate. Service-account *read* and *combined activation* live in a minimal `src/features/service-accounts/` slice because client pages must know whether a client is linked (delete is blocked, activation is combined, `client_credentials` is locked). The Service Accounts pages themselves are **Plan 2** (written after this plan lands).

**Tech Stack:** Next.js 15 App Router (typedRoutes on), React 19, TypeScript, `@tanstack/react-query` v5, `react-hook-form` + `@hookform/resolvers/zod` + Zod v4, `@igrp/igrp-framework-react-design-system` (shadcn-based), `@igrp/platform-access-management-client-ts@0.2.0-beta.16`, Vitest + Testing Library (jsdom), Biome.

**Spec:** [`docs/todos/CLIENT_AND_SERVICE_ACCOUNT_MANAGEMENT_SPEC.md`](../../todos/CLIENT_AND_SERVICE_ACCOUNT_MANAGEMENT_SPEC.md) · Glossary: [`CONTEXT.md`](../../../CONTEXT.md) · Mockups: [Accounts design canvas](https://claude.ai/artifact/Myg6WjfKJdYPXi72RSDpHA) (boards *Clientes OAuth — lista*, *Registo concluído — segredo*, *Cliente OAuth — definições*).

## Global Constraints

- All UI copy is **European Portuguese (pt-PT)**; no exclamation marks, no apologising (`PRODUCT.md`).
- Domain term is **OAuth Client**; bare "client" only for SDK classes. "Grant" alone means **Grant Type** (`CONTEXT.md`).
- Routes: `/settings/accounts` → redirect to `/settings/accounts/clients`; client detail `/settings/accounts/clients/[id]`; services tab `/settings/accounts/services`.
- **Secrets never enter the React Query cache.** Create mutations must not `setQueryData`; the secret lives only in component state and is dropped on unmount.
- **No secret rotation UI** (spec §4.6). **No UI permission gating** (spec §6.2) — a 403 shows as a toast.
- An OAuth Client with a linked Service Account: **cannot be deleted**, keeps `client_credentials` locked on, and activation runs the **combined** action (deactivate: client → SA; reactivate: SA → client).
- `PUT /api/clients/{id}` is full replacement: every update sends the whole request, carrying `requirePkce` and `postLogoutRedirectUris` from the loaded DTO even though the UI does not edit them.
- **Applications are identified by `code` in the UI and form** (select value, form field `applicationCode`, filters). The SDK request only accepts a numeric `applicationId`, so the create/update server actions resolve `applicationCode → id` via `client.applications.getApplications({ code })` just before calling the SDK. No form, hook or component handles application ids; only server-side mapping does (`toOAuthClientRequest` for activation PUTs, `toServiceAccountRequest`).
- `clientId` regex `^[a-z0-9]+(-[a-z0-9]+)*$`; redirect URIs `https://` only, except `http://localhost` / `http://127.0.0.1`; description ≤ 140 chars; 409 on create → error on the `clientId` field, not a toast.
- Design-system rules enforced by `pnpm check:ui`: no `space-x/y-*`, no raw colour literals (`bg-red-500`), no `animate-pulse`, no `dark:` colour overrides, no `<hr>`/`border-t` dividers. Use semantic tokens (`bg-success-subtle text-success-subtle-foreground`, `text-destructive`, `text-muted-foreground`), `gap-*`, `size-N`, `Separator`.
- Imports: UI from `@igrp/igrp-framework-react-design-system`; `cn` from `@/lib/utils`; `toActionError` from `@/lib/app-utilities`.
- Tests live in `src/__tests__/<domain>/`. Component tests render the **real** design system (as `src/__tests__/components/multi-select-field.test.tsx` does) and mock only actions/hooks. Mocked query hooks must return a **module-level stable object** (a fresh literal per call causes an infinite render loop that OOMs the worker).
- Gates before claiming done: `pnpm typecheck`, `pnpm test`, `pnpm check:ui`, `npx biome check` (do **not** use `pnpm lint` to verify — it mutates files).
- Commits: conventional style, **no `Co-Authored-By:` trailer**.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/features/oauth-clients/lib/oauth-client-utils.ts` | Pure domain helpers: grant-type catalogue, client kind, redirect-URI rule, seconds → pt-PT duration, linked-SA lookup |
| `src/features/oauth-clients/lib/oauth-client-request.ts` | Pure DTO ↔ request mapping (full-replacement safe) |
| `src/features/oauth-clients/oauth-client-schemas.ts` | Zod form schema + form-value defaults |
| `src/actions/oauth-clients.ts` | Server actions: list/get/create/update/delete/setActive |
| `src/features/service-accounts/lib/service-account-request.ts` | Pure SA DTO → request mapping |
| `src/actions/service-accounts.ts` | Server actions (Plan 1 subset): `listServiceAccounts`, `setServiceAccountActive` (combined) |
| `src/features/oauth-clients/{query-keys,query-options,prefetch,use-oauth-clients}.ts` | Data layer for clients |
| `src/features/service-accounts/{query-keys,query-options,use-service-accounts}.ts` | Data layer for SA reads + combined activation |
| `src/features/accounts/components/accounts-tabs.tsx` | Tab nav shared by both sections |
| `src/app/(igrp)/(home)/settings/accounts/**` | Route shells |
| `src/components/chip-input.tsx` | Reusable chip editor (redirect URIs, scopes) |
| `src/components/sensitive-value-disclosure.tsx` | One-time secret display |
| `src/components/unsaved-changes-bar.tsx` | Sticky save bar |
| `src/features/oauth-clients/components/*` | Badges, columns, list, form sections, create dialog, detail, danger zone, delete dialog |

---

### Task 0: Commit the agreed spec and glossary

**Files:**
- Add: `CONTEXT.md`, `docs/todos/CLIENT_AND_SERVICE_ACCOUNT_MANAGEMENT_SPEC.md`, `docs/superpowers/plans/2026-09-23-oauth-clients-section.md`

- [ ] **Step 1: Verify only docs are pending**

Run: `git status --short`
Expected: only the three paths above (plus nothing under `src/`).

- [ ] **Step 2: Commit**

```bash
git add CONTEXT.md docs/todos/CLIENT_AND_SERVICE_ACCOUNT_MANAGEMENT_SPEC.md docs/superpowers/plans/2026-09-23-oauth-clients-section.md
git commit -m "docs(accounts): agree OAuth client & service account spec, glossary and plan"
```

---

### Task 1: Pure domain helpers and request mapping

**Files:**
- Create: `src/features/oauth-clients/lib/oauth-client-utils.ts`
- Create: `src/features/oauth-clients/lib/oauth-client-request.ts`
- Create: `src/features/service-accounts/lib/service-account-request.ts`
- Test: `src/__tests__/oauth-clients/lib/oauth-client-utils.test.ts`
- Test: `src/__tests__/oauth-clients/lib/oauth-client-request.test.ts`

**Interfaces:**
- Produces (used by Tasks 2–9):
  - `GRANT_TYPES: readonly { value: OAuthGrantType; description: string }[]`
  - `type ClientKind = "web" | "machine"`; `getClientKind(grantTypes: readonly string[]): ClientKind`; `CLIENT_KIND_LABEL: Record<ClientKind, string>`
  - `isAllowedRedirectUri(uri: string): boolean`
  - `formatSeconds(seconds: number | undefined): string`
  - `findLinkedServiceAccount(accounts: readonly ServiceAccountDTO[] | undefined, oauthClientId: string): { account: ServiceAccountDTO | undefined; duplicate: boolean }`
  - `toOAuthClientRequest(dto: OAuthClientDTO): OAuthClientRequestDTO` (SDK-shaped; used server-side only)
  - `withActive(dto: OAuthClientDTO, active: boolean): OAuthClientRequestDTO`
  - `type OAuthClientInput = Omit<OAuthClientRequestDTO, "applicationId"> & { applicationCode?: string }` — what the UI sends to the create/update actions
  - `toServiceAccountRequest(dto: ServiceAccountDTO): ServiceAccountRequestDTO`

- [ ] **Step 1: Write the failing utils test**

`src/__tests__/oauth-clients/lib/oauth-client-utils.test.ts`:

```ts
import type { ServiceAccountDTO } from "@igrp/platform-access-management-client-ts";
import { describe, expect, it } from "vitest";

import {
  findLinkedServiceAccount,
  formatSeconds,
  getClientKind,
  isAllowedRedirectUri,
} from "@/features/oauth-clients/lib/oauth-client-utils";

describe("getClientKind", () => {
  it("is web when authorization_code is present", () => {
    expect(getClientKind(["authorization_code", "refresh_token"])).toBe("web");
  });
  it("is machine otherwise", () => {
    expect(getClientKind(["client_credentials"])).toBe("machine");
    expect(getClientKind([])).toBe("machine");
  });
});

describe("isAllowedRedirectUri", () => {
  it.each([
    "https://invoice.gov.cv/api/auth/callback/igrp-auth",
    "http://localhost:3000/callback",
    "http://localhost/callback",
    "http://127.0.0.1:8080/cb",
  ])("allows %s", (uri) => expect(isAllowedRedirectUri(uri)).toBe(true));

  it.each([
    "http://invoice.gov.cv/callback",
    "ftp://x.y",
    "not a url",
    "",
    "http://localhost.evil.com/cb",
  ])("rejects %s", (uri) => expect(isAllowedRedirectUri(uri)).toBe(false));
});

describe("formatSeconds", () => {
  it.each([
    [60, "1 minuto"],
    [180, "3 minutos"],
    [3600, "1 hora"],
    [7200, "2 horas"],
    [86400, "1 dia"],
    [2592000, "30 dias"],
    [45, "45 segundos"],
    [1, "1 segundo"],
    [90, "90 segundos"],
  ])("formats %i as %s", (s, text) => expect(formatSeconds(s)).toBe(text));

  it("returns empty for missing or non-positive values", () => {
    expect(formatSeconds(undefined)).toBe("");
    expect(formatSeconds(0)).toBe("");
    expect(formatSeconds(Number.NaN)).toBe("");
  });
});

describe("findLinkedServiceAccount", () => {
  const sa = (id: string, oauthClientId: string) =>
    ({ id, oauthClientId, name: id, active: true, clientId: "c" }) as ServiceAccountDTO;

  it("finds the single linked account", () => {
    const r = findLinkedServiceAccount([sa("a", "c1"), sa("b", "c2")], "c2");
    expect(r.account?.id).toBe("b");
    expect(r.duplicate).toBe(false);
  });
  it("flags a 1:1 violation", () => {
    const r = findLinkedServiceAccount([sa("a", "c1"), sa("b", "c1")], "c1");
    expect(r.account?.id).toBe("a");
    expect(r.duplicate).toBe(true);
  });
  it("handles no data", () => {
    expect(findLinkedServiceAccount(undefined, "c1")).toEqual({
      account: undefined,
      duplicate: false,
    });
  });
});
```

- [ ] **Step 2: Write the failing request test**

`src/__tests__/oauth-clients/lib/oauth-client-request.test.ts`:

```ts
import type {
  OAuthClientDTO,
  ServiceAccountDTO,
} from "@igrp/platform-access-management-client-ts";
import { describe, expect, it } from "vitest";

import {
  toOAuthClientRequest,
  withActive,
} from "@/features/oauth-clients/lib/oauth-client-request";
import { toServiceAccountRequest } from "@/features/service-accounts/lib/service-account-request";

const dto: OAuthClientDTO = {
  id: "uuid-1",
  clientId: "my-invoice",
  clientSecret: "must-never-be-sent",
  clientName: "Invoice App",
  description: "Portal",
  active: true,
  requirePkce: false,
  applicationId: 7,
  applicationCode: "INV",
  accessTokenTtl: 180,
  refreshTokenTtl: 86400,
  authorizationCodeTtl: 60,
  scopes: ["openid"],
  redirectUris: ["https://a.gov.cv/cb"],
  postLogoutRedirectUris: ["https://a.gov.cv/"],
  grantTypes: ["authorization_code", "refresh_token"],
  createdAt: "2026-01-01T00:00:00Z",
};

describe("toOAuthClientRequest", () => {
  it("carries every writable field, including ones the UI does not edit", () => {
    expect(toOAuthClientRequest(dto)).toEqual({
      clientId: "my-invoice",
      clientName: "Invoice App",
      description: "Portal",
      active: true,
      requirePkce: false,
      applicationId: 7,
      accessTokenTtl: 180,
      refreshTokenTtl: 86400,
      authorizationCodeTtl: 60,
      scopes: ["openid"],
      redirectUris: ["https://a.gov.cv/cb"],
      postLogoutRedirectUris: ["https://a.gov.cv/"],
      grantTypes: ["authorization_code", "refresh_token"],
    });
  });

  it("never includes the secret or read-only fields", () => {
    const req = toOAuthClientRequest(dto) as Record<string, unknown>;
    expect(req.clientSecret).toBeUndefined();
    expect(req.id).toBeUndefined();
    expect(req.applicationCode).toBeUndefined();
    expect(req.createdAt).toBeUndefined();
  });

  it("falls back to clientId when clientName is missing", () => {
    expect(toOAuthClientRequest({ ...dto, clientName: undefined }).clientName).toBe(
      "my-invoice",
    );
  });
});

describe("withActive", () => {
  it("only flips active", () => {
    expect(withActive(dto, false)).toEqual({
      ...toOAuthClientRequest(dto),
      active: false,
    });
  });
});

describe("toServiceAccountRequest", () => {
  it("maps the full replacement set", () => {
    const sa: ServiceAccountDTO = {
      id: "sa-1",
      name: "Nightly",
      description: "d",
      active: true,
      oauthClientId: "uuid-1",
      clientId: "etl",
      applicationId: 7,
      applicationCode: "INV",
      roleIds: [1, 2],
      roleCodes: ["a", "b"],
      permissionIds: [9],
      permissionNames: ["p"],
    };
    expect(toServiceAccountRequest(sa)).toEqual({
      name: "Nightly",
      description: "d",
      active: true,
      oauthClientId: "uuid-1",
      applicationId: 7,
      roleIds: [1, 2],
      permissionIds: [9],
    });
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/oauth-clients/lib`
Expected: FAIL — cannot resolve `@/features/oauth-clients/lib/oauth-client-utils`.

- [ ] **Step 4: Implement `oauth-client-utils.ts`**

```ts
import type {
  OAuthGrantType,
  ServiceAccountDTO,
} from "@igrp/platform-access-management-client-ts";

/** Order and copy match the grant-type cards in the design canvas. */
export const GRANT_TYPES: readonly {
  value: OAuthGrantType;
  description: string;
}[] = [
  { value: "authorization_code", description: "Utilizadores iniciam sessão no browser." },
  { value: "refresh_token", description: "Renova a sessão sem novo login." },
  {
    value: "client_credentials",
    description: "Máquina a máquina, sem utilizador. Necessário para uma conta de serviço.",
  },
  { value: "device_code", description: "Dispositivos sem browser (TV, linha de comandos)." },
] as const;

export type ClientKind = "web" | "machine";

export const CLIENT_KIND_LABEL: Record<ClientKind, string> = {
  web: "Aplicação web",
  machine: "Máquina",
};

export function getClientKind(grantTypes: readonly string[]): ClientKind {
  return grantTypes.includes("authorization_code") ? "web" : "machine";
}

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1"]);

/** `https://` anywhere; plain `http://` only on the loopback host (dev). */
export function isAllowedRedirectUri(uri: string): boolean {
  let url: URL;
  try {
    url = new URL(uri);
  } catch {
    return false;
  }
  if (url.protocol === "https:") return true;
  return url.protocol === "http:" && LOOPBACK_HOSTS.has(url.hostname);
}

const UNITS = [
  { size: 86_400, one: "dia", many: "dias" },
  { size: 3_600, one: "hora", many: "horas" },
  { size: 60, one: "minuto", many: "minutos" },
] as const;

/** Largest unit that divides exactly; otherwise seconds. Empty when unknown. */
export function formatSeconds(seconds: number | undefined): string {
  if (seconds === undefined || !Number.isFinite(seconds) || seconds <= 0) return "";
  for (const unit of UNITS) {
    if (seconds % unit.size === 0) {
      const n = seconds / unit.size;
      return `${n} ${n === 1 ? unit.one : unit.many}`;
    }
  }
  return `${seconds} ${seconds === 1 ? "segundo" : "segundos"}`;
}

export function findLinkedServiceAccount(
  accounts: readonly ServiceAccountDTO[] | undefined,
  oauthClientId: string,
): { account: ServiceAccountDTO | undefined; duplicate: boolean } {
  const linked = (accounts ?? []).filter((a) => a.oauthClientId === oauthClientId);
  return { account: linked[0], duplicate: linked.length > 1 };
}
```

- [ ] **Step 5: Implement `oauth-client-request.ts`**

```ts
import type {
  OAuthClientDTO,
  OAuthClientRequestDTO,
} from "@igrp/platform-access-management-client-ts";

/**
 * PUT /api/clients/{id} replaces the whole client. Build the request from the
 * loaded DTO so fields the UI does not edit (requirePkce,
 * postLogoutRedirectUris) survive every save. Never copies clientSecret.
 */
export function toOAuthClientRequest(dto: OAuthClientDTO): OAuthClientRequestDTO {
  return {
    clientId: dto.clientId,
    clientName: dto.clientName ?? dto.clientId,
    description: dto.description,
    active: dto.active,
    requirePkce: dto.requirePkce,
    applicationId: dto.applicationId,
    accessTokenTtl: dto.accessTokenTtl,
    refreshTokenTtl: dto.refreshTokenTtl,
    authorizationCodeTtl: dto.authorizationCodeTtl,
    scopes: [...dto.scopes],
    redirectUris: [...dto.redirectUris],
    postLogoutRedirectUris: dto.postLogoutRedirectUris
      ? [...dto.postLogoutRedirectUris]
      : undefined,
    grantTypes: [...dto.grantTypes],
  };
}

export function withActive(dto: OAuthClientDTO, active: boolean): OAuthClientRequestDTO {
  return { ...toOAuthClientRequest(dto), active };
}

/**
 * What the UI sends to createOAuthClient/updateOAuthClient: the application is
 * named by its code; the server action resolves it to the SDK's numeric id.
 */
export type OAuthClientInput = Omit<OAuthClientRequestDTO, "applicationId"> & {
  applicationCode?: string;
};
```

- [ ] **Step 6: Implement `service-account-request.ts`**

```ts
import type {
  ServiceAccountDTO,
  ServiceAccountRequestDTO,
} from "@igrp/platform-access-management-client-ts";

/** PUT replaces roleIds/permissionIds wholesale — always send the full current set. */
export function toServiceAccountRequest(dto: ServiceAccountDTO): ServiceAccountRequestDTO {
  return {
    name: dto.name,
    description: dto.description,
    active: dto.active,
    oauthClientId: dto.oauthClientId,
    applicationId: dto.applicationId,
    roleIds: [...(dto.roleIds ?? [])],
    permissionIds: [...(dto.permissionIds ?? [])],
  };
}
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/oauth-clients/lib`
Expected: PASS (all).

- [ ] **Step 8: Commit**

```bash
git add src/features/oauth-clients/lib src/features/service-accounts/lib src/__tests__/oauth-clients/lib
git commit -m "feat(oauth-clients): add domain helpers and full-replacement request mapping"
```

---

### Task 2: Form schema and defaults

**Files:**
- Create: `src/features/oauth-clients/oauth-client-schemas.ts`
- Test: `src/__tests__/oauth-clients/oauth-client-schemas.test.ts`

**Interfaces:**
- Consumes: `isAllowedRedirectUri`, `toOAuthClientRequest` (Task 1)
- Produces:
  - `oauthClientFormSchema` (Zod object); `type OAuthClientFormValues = z.infer<typeof oauthClientFormSchema>`
  - `emptyOAuthClientFormValues(): OAuthClientFormValues`
  - `toFormValues(dto: OAuthClientDTO): OAuthClientFormValues`
  - `toCreateRequest(values: OAuthClientFormValues): OAuthClientInput`
  - `toUpdateRequest(dto: OAuthClientDTO, values: OAuthClientFormValues): OAuthClientInput`

Form value shape (TTL fields are `number | undefined`; empty input → `undefined`):
`{ clientId: string; clientName: string; description: string; applicationCode?: string; grantTypes: OAuthGrantType[]; redirectUris: string[]; scopes: string[]; accessTokenTtl?: number; refreshTokenTtl?: number; authorizationCodeTtl?: number; active: boolean }`

- [ ] **Step 1: Write the failing test**

```ts
import type { OAuthClientDTO } from "@igrp/platform-access-management-client-ts";
import { describe, expect, it } from "vitest";

import {
  emptyOAuthClientFormValues,
  oauthClientFormSchema,
  toCreateRequest,
  toFormValues,
  toUpdateRequest,
} from "@/features/oauth-clients/oauth-client-schemas";

const valid = {
  ...emptyOAuthClientFormValues(),
  clientId: "my-invoice",
  clientName: "Invoice App",
  redirectUris: ["https://invoice.gov.cv/cb"],
};

function issues(values: unknown) {
  const r = oauthClientFormSchema.safeParse(values);
  return r.success ? [] : r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
}

describe("oauthClientFormSchema", () => {
  it("accepts a valid web client", () => {
    expect(issues(valid)).toEqual([]);
  });

  it.each(["My-Invoice", "my_invoice", "-lead", "trail-", "a--b", ""])(
    "rejects clientId %j",
    (clientId) => {
      expect(issues({ ...valid, clientId }).some((m) => m.startsWith("clientId"))).toBe(true);
    },
  );

  it("requires a redirect URI when authorization_code is selected", () => {
    expect(issues({ ...valid, redirectUris: [] })).toContain(
      "redirectUris: Adicione pelo menos um URI de redirecionamento.",
    );
  });

  it("does not require redirect URIs for a machine client", () => {
    expect(
      issues({ ...valid, grantTypes: ["client_credentials"], redirectUris: [], scopes: [] }),
    ).toEqual([]);
  });

  it("rejects plain http outside localhost", () => {
    expect(issues({ ...valid, redirectUris: ["http://invoice.gov.cv/cb"] })).toContain(
      "redirectUris: «http://invoice.gov.cv/cb» não é permitido. Use https:// (ou http://localhost).",
    );
  });

  it("requires at least one grant type", () => {
    expect(issues({ ...valid, grantTypes: [] })).toContain(
      "grantTypes: Escolha pelo menos um grant type.",
    );
  });

  it("caps description at 140 characters", () => {
    expect(issues({ ...valid, description: "x".repeat(141) })).toContain(
      "description: Até 140 caracteres.",
    );
  });

  it("rejects non-integer or non-positive TTLs", () => {
    expect(issues({ ...valid, accessTokenTtl: 0 }).length).toBe(1);
    expect(issues({ ...valid, accessTokenTtl: 1.5 }).length).toBe(1);
    expect(issues({ ...valid, accessTokenTtl: undefined })).toEqual([]);
  });
});

describe("mapping", () => {
  const dto: OAuthClientDTO = {
    id: "u1",
    clientId: "my-invoice",
    clientName: "Invoice App",
    active: true,
    requirePkce: true,
    applicationId: 7,
    applicationCode: "INV",
    accessTokenTtl: 180,
    refreshTokenTtl: 86400,
    authorizationCodeTtl: 60,
    scopes: ["openid"],
    redirectUris: ["https://a.gov.cv/cb"],
    postLogoutRedirectUris: ["https://a.gov.cv/"],
    grantTypes: ["authorization_code"],
  };

  it("round-trips a DTO through form values", () => {
    expect(toFormValues(dto)).toEqual({
      clientId: "my-invoice",
      clientName: "Invoice App",
      description: "",
      applicationCode: "INV",
      grantTypes: ["authorization_code"],
      redirectUris: ["https://a.gov.cv/cb"],
      scopes: ["openid"],
      accessTokenTtl: 180,
      refreshTokenTtl: 86400,
      authorizationCodeTtl: 60,
      active: true,
    });
  });

  it("update keeps clientId, requirePkce and postLogoutRedirectUris from the DTO", () => {
    const req = toUpdateRequest(dto, {
      ...toFormValues(dto),
      clientId: "tampered",
      clientName: "Renamed",
    });
    expect(req.clientId).toBe("my-invoice");
    expect(req.clientName).toBe("Renamed");
    expect(req.requirePkce).toBe(true);
    expect(req.postLogoutRedirectUris).toEqual(["https://a.gov.cv/"]);
  });

  it("names the application by code, never by id", () => {
    const req = toUpdateRequest(dto, { ...toFormValues(dto), applicationCode: "CAD" });
    expect(req.applicationCode).toBe("CAD");
    expect("applicationId" in req).toBe(false);
    expect("applicationId" in toCreateRequest(valid)).toBe(false);
  });

  it("drops redirect URIs when authorization_code is not selected", () => {
    const values = { ...toFormValues(dto), grantTypes: ["client_credentials" as const] };
    expect(toCreateRequest(values).redirectUris).toEqual([]);
    expect(toUpdateRequest(dto, values).redirectUris).toEqual([]);
  });

  it("omits blank description and empty TTLs so the server defaults apply", () => {
    const req = toCreateRequest(valid);
    expect(req.description).toBeUndefined();
    expect(req.accessTokenTtl).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/oauth-clients/oauth-client-schemas.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `oauth-client-schemas.ts`**

```ts
import type {
  OAuthClientDTO,
  OAuthGrantType,
} from "@igrp/platform-access-management-client-ts";
import { z } from "zod";

import { type OAuthClientInput, toOAuthClientRequest } from "./lib/oauth-client-request";
import { isAllowedRedirectUri } from "./lib/oauth-client-utils";

export const grantTypeSchema = z.enum([
  "authorization_code",
  "refresh_token",
  "client_credentials",
  "device_code",
]);

const ttlSchema = z
  .number({ error: "Use um número inteiro de segundos." })
  .int("Use um número inteiro de segundos.")
  .positive("Use um número inteiro de segundos.")
  .optional();

export const oauthClientFormSchema = z
  .object({
    clientId: z
      .string()
      .trim()
      .min(1, "Indique o client ID.")
      .max(100, "Até 100 caracteres.")
      .regex(
        /^[a-z0-9]+(-[a-z0-9]+)*$/,
        "Use minúsculas, números e hífenes (ex.: my-invoice).",
      ),
    clientName: z.string().trim().min(1, "Indique o nome.").max(255, "Até 255 caracteres."),
    description: z.string().trim().max(140, "Até 140 caracteres."),
    applicationCode: z.string().trim().min(1).optional(),
    grantTypes: z.array(grantTypeSchema).min(1, "Escolha pelo menos um grant type."),
    redirectUris: z.array(z.string().trim()),
    scopes: z.array(z.string().trim().min(1)),
    accessTokenTtl: ttlSchema,
    refreshTokenTtl: ttlSchema,
    authorizationCodeTtl: ttlSchema,
    active: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (!v.grantTypes.includes("authorization_code")) return;
    if (v.redirectUris.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["redirectUris"],
        message: "Adicione pelo menos um URI de redirecionamento.",
      });
    }
    for (const uri of v.redirectUris) {
      if (!isAllowedRedirectUri(uri)) {
        ctx.addIssue({
          code: "custom",
          path: ["redirectUris"],
          message: `«${uri}» não é permitido. Use https:// (ou http://localhost).`,
        });
      }
    }
  });

export type OAuthClientFormValues = z.infer<typeof oauthClientFormSchema>;

export function emptyOAuthClientFormValues(): OAuthClientFormValues {
  return {
    clientId: "",
    clientName: "",
    description: "",
    applicationCode: undefined,
    grantTypes: ["authorization_code", "refresh_token"],
    redirectUris: [],
    scopes: ["openid", "email", "profile"],
    accessTokenTtl: undefined,
    refreshTokenTtl: undefined,
    authorizationCodeTtl: undefined,
    active: true,
  };
}

export function toFormValues(dto: OAuthClientDTO): OAuthClientFormValues {
  return {
    clientId: dto.clientId,
    clientName: dto.clientName ?? "",
    description: dto.description ?? "",
    applicationCode: dto.applicationCode,
    grantTypes: dto.grantTypes.filter((g): g is OAuthGrantType =>
      grantTypeSchema.safeParse(g).success,
    ),
    redirectUris: [...dto.redirectUris],
    scopes: [...dto.scopes],
    accessTokenTtl: dto.accessTokenTtl,
    refreshTokenTtl: dto.refreshTokenTtl,
    authorizationCodeTtl: dto.authorizationCodeTtl,
    active: dto.active,
  };
}

function editableFields(values: OAuthClientFormValues) {
  const usesRedirects = values.grantTypes.includes("authorization_code");
  return {
    clientName: values.clientName.trim(),
    description: values.description.trim() || undefined,
    applicationCode: values.applicationCode,
    grantTypes: [...values.grantTypes],
    // Hidden section ⇒ no hidden config: a client without authorization_code
    // carries no redirect URIs.
    redirectUris: usesRedirects ? [...values.redirectUris] : [],
    scopes: [...values.scopes],
    accessTokenTtl: values.accessTokenTtl,
    refreshTokenTtl: values.refreshTokenTtl,
    authorizationCodeTtl: values.authorizationCodeTtl,
    active: values.active,
  };
}

export function toCreateRequest(values: OAuthClientFormValues): OAuthClientInput {
  return { clientId: values.clientId.trim(), ...editableFields(values) };
}

export function toUpdateRequest(
  dto: OAuthClientDTO,
  values: OAuthClientFormValues,
): OAuthClientInput {
  // Start from the full DTO (keeps requirePkce, postLogoutRedirectUris), but
  // drop the numeric id: the application travels as a code and the server
  // action resolves it.
  const { applicationId: _applicationId, ...base } = toOAuthClientRequest(dto);
  return {
    ...base,
    ...editableFields(values),
    clientId: dto.clientId, // immutable
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/oauth-clients/oauth-client-schemas.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/oauth-clients/oauth-client-schemas.ts src/__tests__/oauth-clients/oauth-client-schemas.test.ts
git commit -m "feat(oauth-clients): add form schema with grant-dependent redirect rules"
```

---

### Task 3: Server actions — OAuth clients and service-account subset

**Files:**
- Create: `src/actions/oauth-clients.ts`
- Create: `src/actions/service-accounts.ts`
- Test: `src/__tests__/actions/oauth-clients.test.ts`
- Test: `src/__tests__/actions/service-accounts.test.ts`

**Interfaces:**
- Consumes: `withActive`, `toServiceAccountRequest` (Task 1); `getClientAccess` (`src/actions/access-client.ts`); `ActionResult` (`src/actions/types.ts`); `toActionError` (`src/lib/app-utilities.ts`).
- Produces:
  - `listOAuthClients(): Promise<ActionResult<OAuthClientDTO[]>>`
  - `getOAuthClient(id: string): Promise<ActionResult<OAuthClientDTO>>`
  - `createOAuthClient(input: OAuthClientInput): Promise<ActionResult<OAuthClientDTO>>` — resolves `applicationCode → applicationId`; the only response that includes `clientSecret`
  - `updateOAuthClient(id: string, input: OAuthClientInput): Promise<ActionResult<OAuthClientDTO>>` — resolves the code the same way; strips any `clientSecret` defensively
  - An unknown `applicationCode` returns `{ success: false, status: 422, error: "A aplicação «<code>» não existe." }` without calling the OAuth-client SDK method.
  - `deleteOAuthClient(id: string): Promise<ActionResult<null>>`
  - `setOAuthClientActive(id: string, active: boolean): Promise<ActionResult<OAuthClientDTO>>` — GET then full PUT
  - `listServiceAccounts(): Promise<ActionResult<ServiceAccountDTO[]>>`
  - `type ActivationStep = "client" | "serviceAccount"`
  - `type SetActiveResult = { success: true; data: null } | { success: false; error: string; status?: number; failedStep: ActivationStep }`
  - `setServiceAccountActive(id: string, active: boolean): Promise<SetActiveResult>`

- [ ] **Step 1: Write the failing OAuth-client actions test**

`src/__tests__/actions/oauth-clients.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const oauthClients = {
  listOAuthClients: vi.fn(),
  getOAuthClient: vi.fn(),
  createOAuthClient: vi.fn(),
  updateOAuthClient: vi.fn(),
  deleteOAuthClient: vi.fn(),
};

const applications = {
  getApplications: vi.fn(async ({ code }: { code: string }) => ({
    data: code === "INV" ? [{ id: 7, code: "INV", name: "Faturação" }] : [],
  })),
};

vi.mock("@/actions/access-client", () => ({
  getClientAccess: vi.fn(async () => ({ oauthClients, applications })),
}));
vi.mock("@/lib/auth", () => ({
  serverSession: vi.fn(async () => ({ accessToken: "t" })),
}));

import {
  createOAuthClient,
  deleteOAuthClient,
  listOAuthClients,
  setOAuthClientActive,
  updateOAuthClient,
} from "@/actions/oauth-clients";

const dto = {
  id: "u1",
  clientId: "my-invoice",
  clientName: "Invoice",
  active: true,
  accessTokenTtl: 180,
  refreshTokenTtl: 86400,
  authorizationCodeTtl: 60,
  scopes: [],
  redirectUris: [],
  grantTypes: ["client_credentials"],
};

beforeEach(() => vi.clearAllMocks());

describe("oauth-client actions", () => {
  it("lists clients", async () => {
    oauthClients.listOAuthClients.mockResolvedValue({ data: [dto] });
    expect(await listOAuthClients()).toEqual({ success: true, data: [dto] });
  });

  it("returns the secret from create", async () => {
    oauthClients.createOAuthClient.mockResolvedValue({
      data: { ...dto, clientSecret: "s3cret" },
    });
    const r = await createOAuthClient({
      clientId: "my-invoice",
      clientName: "Invoice",
      scopes: [],
      grantTypes: ["client_credentials"],
    });
    expect(r.success && r.data.clientSecret).toBe("s3cret");
  });

  it("resolves applicationCode to the SDK's applicationId", async () => {
    oauthClients.createOAuthClient.mockResolvedValue({ data: dto });
    await createOAuthClient({
      clientId: "my-invoice",
      clientName: "Invoice",
      scopes: [],
      grantTypes: ["client_credentials"],
      applicationCode: "INV",
    });
    const sent = oauthClients.createOAuthClient.mock.calls[0][0];
    expect(sent.applicationId).toBe(7);
    expect("applicationCode" in sent).toBe(false);
  });

  it("rejects an unknown applicationCode before calling the SDK", async () => {
    const r = await createOAuthClient({
      clientId: "my-invoice",
      clientName: "Invoice",
      scopes: [],
      grantTypes: ["client_credentials"],
      applicationCode: "NOPE",
    });
    expect(r).toEqual({ success: false, status: 422, error: "A aplicação «NOPE» não existe." });
    expect(oauthClients.createOAuthClient).not.toHaveBeenCalled();
  });

  it("sends no applicationId when no application is chosen", async () => {
    oauthClients.createOAuthClient.mockResolvedValue({ data: dto });
    await createOAuthClient({ clientId: "x", clientName: "x", scopes: [], grantTypes: ["client_credentials"] });
    expect(oauthClients.createOAuthClient.mock.calls[0][0].applicationId).toBeUndefined();
    expect(applications.getApplications).not.toHaveBeenCalled();
  });

  it("surfaces a 409 status on duplicate clientId", async () => {
    oauthClients.createOAuthClient.mockRejectedValue({ status: 409, title: "Conflict" });
    const r = await createOAuthClient({
      clientId: "dup",
      clientName: "x",
      scopes: [],
      grantTypes: ["client_credentials"],
    });
    expect(r).toMatchObject({ success: false, status: 409 });
  });

  it("strips a secret from update responses", async () => {
    oauthClients.updateOAuthClient.mockResolvedValue({
      data: { ...dto, clientSecret: "leak" },
    });
    const r = await updateOAuthClient("u1", {
      clientId: "my-invoice",
      clientName: "Invoice",
      scopes: [],
      grantTypes: ["client_credentials"],
    });
    expect(r.success && "clientSecret" in r.data).toBe(false);
  });

  it("deletes and returns null", async () => {
    oauthClients.deleteOAuthClient.mockResolvedValue({ data: undefined });
    expect(await deleteOAuthClient("u1")).toEqual({ success: true, data: null });
  });

  it("toggles active with a full PUT built from the current client", async () => {
    oauthClients.getOAuthClient.mockResolvedValue({ data: dto });
    oauthClients.updateOAuthClient.mockResolvedValue({ data: { ...dto, active: false } });

    const r = await setOAuthClientActive("u1", false);

    expect(oauthClients.updateOAuthClient).toHaveBeenCalledWith(
      "u1",
      expect.objectContaining({ clientId: "my-invoice", active: false, grantTypes: ["client_credentials"] }),
    );
    expect(r).toMatchObject({ success: true, data: { active: false } });
  });
});
```

- [ ] **Step 2: Write the failing service-account actions test**

`src/__tests__/actions/service-accounts.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const calls: string[] = [];
const oauthClients = { getOAuthClient: vi.fn(), updateOAuthClient: vi.fn() };
const serviceAccounts = {
  listServiceAccounts: vi.fn(),
  getServiceAccount: vi.fn(),
  updateServiceAccount: vi.fn(),
};

vi.mock("@/actions/access-client", () => ({
  getClientAccess: vi.fn(async () => ({ oauthClients, serviceAccounts })),
}));
vi.mock("@/lib/auth", () => ({
  serverSession: vi.fn(async () => ({ accessToken: "t" })),
}));

import { listServiceAccounts, setServiceAccountActive } from "@/actions/service-accounts";

const sa = {
  id: "sa1",
  name: "Nightly",
  active: true,
  oauthClientId: "c1",
  clientId: "etl",
  roleIds: [1],
  permissionIds: [2],
};
const client = {
  id: "c1",
  clientId: "etl",
  clientName: "ETL",
  active: true,
  accessTokenTtl: 1,
  refreshTokenTtl: 1,
  authorizationCodeTtl: 1,
  scopes: [],
  redirectUris: [],
  grantTypes: ["client_credentials"],
};

beforeEach(() => {
  vi.clearAllMocks();
  calls.length = 0;
  serviceAccounts.getServiceAccount.mockResolvedValue({ data: sa });
  oauthClients.getOAuthClient.mockResolvedValue({ data: client });
  oauthClients.updateOAuthClient.mockImplementation(async () => {
    calls.push("client");
    return { data: client };
  });
  serviceAccounts.updateServiceAccount.mockImplementation(async () => {
    calls.push("serviceAccount");
    return { data: sa };
  });
});

describe("listServiceAccounts", () => {
  it("returns the list", async () => {
    serviceAccounts.listServiceAccounts.mockResolvedValue({ data: [sa] });
    expect(await listServiceAccounts()).toEqual({ success: true, data: [sa] });
  });
});

describe("setServiceAccountActive", () => {
  it("deactivates the client first, then the service account", async () => {
    expect(await setServiceAccountActive("sa1", false)).toEqual({ success: true, data: null });
    expect(calls).toEqual(["client", "serviceAccount"]);
    expect(oauthClients.updateOAuthClient).toHaveBeenCalledWith(
      "c1",
      expect.objectContaining({ active: false }),
    );
    expect(serviceAccounts.updateServiceAccount).toHaveBeenCalledWith(
      "sa1",
      expect.objectContaining({ active: false, roleIds: [1], permissionIds: [2] }),
    );
  });

  it("reactivates the service account first, then the client", async () => {
    await setServiceAccountActive("sa1", true);
    expect(calls).toEqual(["serviceAccount", "client"]);
  });

  it("reports which step failed and stops", async () => {
    oauthClients.updateOAuthClient.mockRejectedValue({ status: 500, title: "Boom" });
    const r = await setServiceAccountActive("sa1", false);
    expect(r).toMatchObject({ success: false, failedStep: "client", status: 500 });
    expect(serviceAccounts.updateServiceAccount).not.toHaveBeenCalled();
  });

  it("reports a failure on the second step", async () => {
    serviceAccounts.updateServiceAccount.mockRejectedValue({ status: 500, title: "Boom" });
    const r = await setServiceAccountActive("sa1", false);
    expect(r).toMatchObject({ success: false, failedStep: "serviceAccount" });
    expect(calls).toEqual(["client"]);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/actions/oauth-clients.test.ts src/__tests__/actions/service-accounts.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 4: Implement `src/actions/oauth-clients.ts`**

```ts
"use server";

import type {
  OAuthClientDTO,
  OAuthClientRequestDTO,
} from "@igrp/platform-access-management-client-ts";

import {
  type OAuthClientInput,
  withActive,
} from "@/features/oauth-clients/lib/oauth-client-request";
import { toActionError } from "@/lib/app-utilities";

import { getClientAccess } from "./access-client";
import type { AccessClient, ActionResult } from "./types";

function withoutSecret(dto: OAuthClientDTO): OAuthClientDTO {
  const { clientSecret: _secret, ...rest } = dto;
  return rest;
}

class UnknownApplicationError extends Error {
  constructor(readonly code: string) {
    super(`A aplicação «${code}» não existe.`);
  }
}

/**
 * The UI names applications by code; the SDK request wants the numeric id.
 * Same lookup as getApplicationByCode in ./applications.ts.
 */
async function toSdkRequest(
  client: AccessClient,
  { applicationCode, ...rest }: OAuthClientInput,
): Promise<OAuthClientRequestDTO> {
  if (!applicationCode) return { ...rest, applicationId: undefined };
  const result = await client.applications.getApplications({ code: applicationCode });
  const app = result.data.find((a) => a.code === applicationCode);
  if (!app) throw new UnknownApplicationError(applicationCode);
  return { ...rest, applicationId: app.id };
}

function failure(error: unknown) {
  if (error instanceof UnknownApplicationError) {
    return { success: false as const, status: 422, error: error.message };
  }
  return { success: false as const, ...toActionError(error) };
}

export async function listOAuthClients(): Promise<ActionResult<OAuthClientDTO[]>> {
  const client = await getClientAccess();
  try {
    const result = await client.oauthClients.listOAuthClients();
    return { success: true, data: result.data.map(withoutSecret) };
  } catch (error) {
    console.error("[oauth-clients] Erro ao carregar clientes OAuth:", error);
    return { success: false, ...toActionError(error) };
  }
}

export async function getOAuthClient(id: string): Promise<ActionResult<OAuthClientDTO>> {
  const client = await getClientAccess();
  try {
    const result = await client.oauthClients.getOAuthClient(id);
    return { success: true, data: withoutSecret(result.data) };
  } catch (error) {
    console.error("[oauth-client] Erro ao carregar cliente OAuth:", error);
    return { success: false, ...toActionError(error) };
  }
}

/** The ONLY action whose data carries the raw clientSecret. Never cache it. */
export async function createOAuthClient(
  input: OAuthClientInput,
): Promise<ActionResult<OAuthClientDTO>> {
  const client = await getClientAccess();
  try {
    const request = await toSdkRequest(client, input);
    const result = await client.oauthClients.createOAuthClient(request);
    return { success: true, data: result.data };
  } catch (error) {
    console.error("[oauth-client-create] Erro ao registar cliente OAuth:", error);
    return failure(error);
  }
}

export async function updateOAuthClient(
  id: string,
  input: OAuthClientInput,
): Promise<ActionResult<OAuthClientDTO>> {
  const client = await getClientAccess();
  try {
    const request = await toSdkRequest(client, input);
    const result = await client.oauthClients.updateOAuthClient(id, request);
    return { success: true, data: withoutSecret(result.data) };
  } catch (error) {
    console.error("[oauth-client-update] Erro ao atualizar cliente OAuth:", error);
    return failure(error);
  }
}

export async function deleteOAuthClient(id: string): Promise<ActionResult<null>> {
  const client = await getClientAccess();
  try {
    await client.oauthClients.deleteOAuthClient(id);
    return { success: true, data: null };
  } catch (error) {
    console.error("[oauth-client-delete] Erro ao eliminar cliente OAuth:", error);
    return { success: false, ...toActionError(error) };
  }
}

/** Full-replacement PUT built from the freshly loaded client. */
export async function setOAuthClientActive(
  id: string,
  active: boolean,
): Promise<ActionResult<OAuthClientDTO>> {
  const client = await getClientAccess();
  try {
    const current = await client.oauthClients.getOAuthClient(id);
    const result = await client.oauthClients.updateOAuthClient(
      id,
      withActive(current.data, active),
    );
    return { success: true, data: withoutSecret(result.data) };
  } catch (error) {
    console.error("[oauth-client-active] Erro ao alterar estado do cliente OAuth:", error);
    return { success: false, ...toActionError(error) };
  }
}
```

- [ ] **Step 5: Implement `src/actions/service-accounts.ts`**

```ts
"use server";

import type { ServiceAccountDTO } from "@igrp/platform-access-management-client-ts";

import { withActive } from "@/features/oauth-clients/lib/oauth-client-request";
import { toServiceAccountRequest } from "@/features/service-accounts/lib/service-account-request";
import { toActionError } from "@/lib/app-utilities";

import { getClientAccess } from "./access-client";
import type { ActionResult } from "./types";

export type ActivationStep = "client" | "serviceAccount";

export type SetActiveResult =
  | { success: true; data: null }
  | { success: false; error: string; status?: number; failedStep: ActivationStep };

export async function listServiceAccounts(): Promise<ActionResult<ServiceAccountDTO[]>> {
  const client = await getClientAccess();
  try {
    const result = await client.serviceAccounts.listServiceAccounts();
    return { success: true, data: result.data };
  } catch (error) {
    console.error("[service-accounts] Erro ao carregar contas de serviço:", error);
    return { success: false, ...toActionError(error) };
  }
}

/**
 * Deactivation turns off BOTH the service account and its OAuth client
 * (CONTEXT.md → Deactivation). Order matters: on deactivate the client goes
 * first because that is what actually blocks authentication; on reactivate
 * the service account goes first so the identity never authenticates without
 * its roles. Stops at the first failure and reports the step.
 */
export async function setServiceAccountActive(
  id: string,
  active: boolean,
): Promise<SetActiveResult> {
  const client = await getClientAccess();

  let step: ActivationStep = "serviceAccount";
  try {
    const sa = (await client.serviceAccounts.getServiceAccount(id)).data;
    step = "client";
    const oauth = (await client.oauthClients.getOAuthClient(sa.oauthClientId)).data;

    const updateClient = async () => {
      step = "client";
      await client.oauthClients.updateOAuthClient(oauth.id, withActive(oauth, active));
    };
    const updateAccount = async () => {
      step = "serviceAccount";
      await client.serviceAccounts.updateServiceAccount(id, {
        ...toServiceAccountRequest(sa),
        active,
      });
    };

    if (active) {
      await updateAccount();
      await updateClient();
    } else {
      await updateClient();
      await updateAccount();
    }
    return { success: true, data: null };
  } catch (error) {
    console.error(`[service-account-active] Falhou no passo ${step}:`, error);
    return { success: false, failedStep: step, ...toActionError(error) };
  }
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/actions/oauth-clients.test.ts src/__tests__/actions/service-accounts.test.ts`
Expected: PASS.

- [ ] **Step 7: Typecheck**

Run: `pnpm typecheck`
Expected: 0 errors. (If `client.serviceAccounts.getServiceAccount` has a different name in `node_modules/@igrp/platform-access-management-client-ts/dist/client/service-account-client.d.ts`, use the name declared there.)

- [ ] **Step 8: Commit**

```bash
git add src/actions/oauth-clients.ts src/actions/service-accounts.ts src/__tests__/actions/oauth-clients.test.ts src/__tests__/actions/service-accounts.test.ts
git commit -m "feat(actions): add OAuth client actions and combined service-account activation"
```

---

### Task 4: Data layer — keys, options, prefetch, hooks

**Files:**
- Create: `src/features/oauth-clients/query-keys.ts`, `query-options.ts`, `prefetch.ts`, `use-oauth-clients.ts`
- Create: `src/features/service-accounts/query-keys.ts`, `query-options.ts`, `use-service-accounts.ts`
- Test: `src/__tests__/oauth-clients/use-oauth-clients.test.tsx`

**Interfaces:**
- Consumes: all actions from Task 3; `unwrap` from `@/actions/types`; `findLinkedServiceAccount` (Task 1).
- Produces:
  - `oauthClientKeys = { all: ["oauth-clients"], list: () => ["oauth-clients","list"], detail: (id) => ["oauth-clients","detail",id] }`
  - `serviceAccountKeys = { all: ["service-accounts"], list: () => ["service-accounts","list"] }`
  - `oauthClientListOptions()`, `oauthClientByIdOptions(id)`, `serviceAccountListOptions()`
  - `prefetchOAuthClientList(qc)`, `prefetchOAuthClient(qc, id)`, `getOAuthClientCached` (React `cache`)
  - Hooks: `useOAuthClients()`, `useOAuthClient(id)`, `useCreateOAuthClient()`, `useUpdateOAuthClient()`, `useDeleteOAuthClient()`, `useServiceAccounts()`, `useLinkedServiceAccount(oauthClientId)`, `useSetClientActive()`
  - `useSetClientActive().mutateAsync({ client: OAuthClientDTO; linkedAccountId?: string; active: boolean })` → `Promise<ActionResult<unknown> | SetActiveResult>` — routes to `setServiceAccountActive(linkedAccountId, active)` when linked, else `setOAuthClientActive(client.id, active)`.

- [ ] **Step 1: Write the failing hooks test**

```tsx
import type { ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { setOAuthClientActive } from "@/actions/oauth-clients";
import { setServiceAccountActive } from "@/actions/service-accounts";
import { oauthClientKeys } from "@/features/oauth-clients/query-keys";
import {
  useCreateOAuthClient,
  useDeleteOAuthClient,
  useSetClientActive,
  useUpdateOAuthClient,
} from "@/features/oauth-clients/use-oauth-clients";
import { serviceAccountKeys } from "@/features/service-accounts/query-keys";

vi.mock("@/actions/oauth-clients", () => ({
  listOAuthClients: vi.fn(),
  getOAuthClient: vi.fn(),
  createOAuthClient: vi.fn(async () => ({
    success: true,
    data: { id: "new", clientId: "x", clientSecret: "s3cret" },
  })),
  updateOAuthClient: vi.fn(async () => ({ success: true, data: { id: "u1" } })),
  deleteOAuthClient: vi.fn(async () => ({ success: true, data: null })),
  setOAuthClientActive: vi.fn(async () => ({ success: true, data: { id: "u1" } })),
}));
vi.mock("@/actions/service-accounts", () => ({
  listServiceAccounts: vi.fn(),
  setServiceAccountActive: vi.fn(async () => ({ success: true, data: null })),
}));

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, invalidate, wrapper };
}

const req = { clientId: "x", clientName: "x", scopes: [], grantTypes: ["client_credentials"] };

describe("useCreateOAuthClient", () => {
  it("invalidates the list and never writes the secret into the cache", async () => {
    const { client, invalidate, wrapper } = setup();
    const { result } = renderHook(() => useCreateOAuthClient(), { wrapper });

    const r = await result.current.mutateAsync(req);

    expect(r.success && r.data.clientSecret).toBe("s3cret");
    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({ queryKey: oauthClientKeys.all }),
    );
    const cached = JSON.stringify(client.getQueryCache().getAll().map((q) => q.state.data));
    expect(cached).not.toContain("s3cret");
  });
});

describe("useUpdateOAuthClient / useDeleteOAuthClient", () => {
  it("update invalidates the family", async () => {
    const { invalidate, wrapper } = setup();
    const { result } = renderHook(() => useUpdateOAuthClient(), { wrapper });
    await result.current.mutateAsync({ id: "u1", request: req });
    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({ queryKey: oauthClientKeys.all }),
    );
  });

  it("delete invalidates clients and service accounts", async () => {
    const { invalidate, wrapper } = setup();
    const { result } = renderHook(() => useDeleteOAuthClient(), { wrapper });
    await result.current.mutateAsync("u1");
    await waitFor(() => {
      expect(invalidate).toHaveBeenCalledWith({ queryKey: oauthClientKeys.all });
      expect(invalidate).toHaveBeenCalledWith({ queryKey: serviceAccountKeys.all });
    });
  });
});

describe("useSetClientActive", () => {
  const oauth = { id: "u1" } as never;

  it("uses the single-client action when nothing is linked", async () => {
    const { wrapper } = setup();
    const { result } = renderHook(() => useSetClientActive(), { wrapper });
    await result.current.mutateAsync({ client: oauth, active: false });
    expect(setOAuthClientActive).toHaveBeenCalledWith("u1", false);
    expect(setServiceAccountActive).not.toHaveBeenCalled();
  });

  it("uses the combined action when a service account is linked", async () => {
    const { invalidate, wrapper } = setup();
    const { result } = renderHook(() => useSetClientActive(), { wrapper });
    await result.current.mutateAsync({ client: oauth, linkedAccountId: "sa1", active: false });
    expect(setServiceAccountActive).toHaveBeenCalledWith("sa1", false);
    await waitFor(() => {
      expect(invalidate).toHaveBeenCalledWith({ queryKey: oauthClientKeys.all });
      expect(invalidate).toHaveBeenCalledWith({ queryKey: serviceAccountKeys.all });
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/oauth-clients/use-oauth-clients.test.tsx`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement keys and options**

`src/features/oauth-clients/query-keys.ts`:

```ts
export const oauthClientKeys = {
  all: ["oauth-clients"] as const,
  list: () => ["oauth-clients", "list"] as const,
  detail: (id: string) => ["oauth-clients", "detail", id] as const,
};
```

`src/features/service-accounts/query-keys.ts`:

```ts
export const serviceAccountKeys = {
  all: ["service-accounts"] as const,
  list: () => ["service-accounts", "list"] as const,
};
```

`src/features/oauth-clients/query-options.ts`:

```ts
import { queryOptions } from "@tanstack/react-query";

import { getOAuthClient, listOAuthClients } from "@/actions/oauth-clients";
import { unwrap } from "@/actions/types";

import { oauthClientKeys } from "./query-keys";

export const oauthClientListOptions = () =>
  queryOptions({
    queryKey: oauthClientKeys.list(),
    queryFn: async () => unwrap(await listOAuthClients()),
  });

export const oauthClientByIdOptions = (id: string) =>
  queryOptions({
    queryKey: oauthClientKeys.detail(id),
    queryFn: async () => unwrap(await getOAuthClient(id)),
    enabled: !!id,
  });
```

`src/features/service-accounts/query-options.ts`:

```ts
import { queryOptions } from "@tanstack/react-query";

import { listServiceAccounts } from "@/actions/service-accounts";
import { unwrap } from "@/actions/types";

import { serviceAccountKeys } from "./query-keys";

export const serviceAccountListOptions = () =>
  queryOptions({
    queryKey: serviceAccountKeys.list(),
    queryFn: async () => unwrap(await listServiceAccounts()),
  });
```

`src/features/oauth-clients/prefetch.ts`:

```ts
import { cache } from "react";

import type { QueryClient } from "@tanstack/react-query";

import { getOAuthClient } from "@/actions/oauth-clients";
import { unwrap } from "@/actions/types";
import { serviceAccountListOptions } from "@/features/service-accounts/query-options";

import { oauthClientByIdOptions, oauthClientListOptions } from "./query-options";

export const getOAuthClientCached = cache(getOAuthClient);

/** Clients are page-critical (fetchQuery rethrows → error.tsx); the SA list is
 *  supplementary (prefetchQuery swallows → the page degrades, see Task 7). */
export async function prefetchOAuthClientList(client: QueryClient) {
  await Promise.all([
    client.fetchQuery(oauthClientListOptions()),
    client.prefetchQuery(serviceAccountListOptions()),
  ]);
}

export async function prefetchOAuthClient(client: QueryClient, id: string) {
  await Promise.all([
    client.fetchQuery({
      ...oauthClientByIdOptions(id),
      queryFn: async () => unwrap(await getOAuthClientCached(id)),
    }),
    client.prefetchQuery(serviceAccountListOptions()),
  ]);
}
```

- [ ] **Step 4: Implement hooks**

`src/features/service-accounts/use-service-accounts.ts`:

```ts
import { useQuery } from "@tanstack/react-query";

import { findLinkedServiceAccount } from "@/features/oauth-clients/lib/oauth-client-utils";

import { serviceAccountListOptions } from "./query-options";

export const useServiceAccounts = () => useQuery(serviceAccountListOptions());

/** `isError` lets callers fail safe (treat as possibly linked) — see Task 9. */
export const useLinkedServiceAccount = (oauthClientId: string) => {
  const query = useServiceAccounts();
  return {
    ...findLinkedServiceAccount(query.data, oauthClientId),
    isLoading: query.isLoading,
    isError: query.isError,
  };
};
```

`src/features/oauth-clients/use-oauth-clients.ts`:

```ts
import type { OAuthClientDTO } from "@igrp/platform-access-management-client-ts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createOAuthClient,
  deleteOAuthClient,
  setOAuthClientActive,
  updateOAuthClient,
} from "@/actions/oauth-clients";
import { setServiceAccountActive } from "@/actions/service-accounts";
import { serviceAccountKeys } from "@/features/service-accounts/query-keys";

import type { OAuthClientInput } from "./lib/oauth-client-request";
import { oauthClientKeys } from "./query-keys";
import { oauthClientByIdOptions, oauthClientListOptions } from "./query-options";

export const useOAuthClients = () => useQuery(oauthClientListOptions());

export const useOAuthClient = (id: string) => useQuery(oauthClientByIdOptions(id));

/** Deliberately no setQueryData: the response carries the raw secret. */
export const useCreateOAuthClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: OAuthClientInput) => createOAuthClient(input),
    onSuccess: async (result) => {
      if (result.success) await qc.invalidateQueries({ queryKey: oauthClientKeys.all });
    },
  });
};

export const useUpdateOAuthClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: OAuthClientInput }) =>
      updateOAuthClient(id, request),
    onSuccess: async (result) => {
      if (result.success) await qc.invalidateQueries({ queryKey: oauthClientKeys.all });
    },
  });
};

export const useDeleteOAuthClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteOAuthClient(id),
    onSuccess: async (result) => {
      if (!result.success) return;
      await Promise.all([
        qc.invalidateQueries({ queryKey: oauthClientKeys.all }),
        qc.invalidateQueries({ queryKey: serviceAccountKeys.all }),
      ]);
    },
  });
};

/** One entry point for both toggles so a linked pair never diverges (spec §6.1). */
export const useSetClientActive = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      client,
      linkedAccountId,
      active,
    }: {
      client: OAuthClientDTO;
      linkedAccountId?: string;
      active: boolean;
    }) =>
      linkedAccountId
        ? setServiceAccountActive(linkedAccountId, active)
        : setOAuthClientActive(client.id, active),
    // Invalidate on settle, not success: a partial combined failure still
    // changed server state (the first step went through).
    onSettled: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: oauthClientKeys.all }),
        qc.invalidateQueries({ queryKey: serviceAccountKeys.all }),
      ]);
    },
  });
};
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/__tests__/oauth-clients/use-oauth-clients.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/oauth-clients src/features/service-accounts src/__tests__/oauth-clients/use-oauth-clients.test.tsx
git commit -m "feat(oauth-clients): add query keys, prefetch and mutation hooks"
```

---

### Task 5: Accounts shell — routes, tabs, settings card

**Files:**
- Modify: `src/lib/constants.ts:5-13` (add routes)
- Create: `src/features/accounts/components/accounts-tabs.tsx`
- Create: `src/app/(igrp)/(home)/settings/accounts/layout.tsx`
- Create: `src/app/(igrp)/(home)/settings/accounts/page.tsx`
- Create: `src/app/(igrp)/(home)/settings/accounts/services/page.tsx`
- Modify: `src/app/(igrp)/(home)/settings/page.tsx:54-62` (activate card)
- Test: `src/__tests__/accounts/accounts-tabs.test.tsx`

**Interfaces:**
- Produces: `ROUTES.ACCOUNTS = "/settings/accounts"`, `ROUTES.OAUTH_CLIENTS = "/settings/accounts/clients"`, `ROUTES.SERVICE_ACCOUNTS = "/settings/accounts/services"`; `<AccountsTabs />`.

- [ ] **Step 1: Write the failing tabs test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const pathname = vi.hoisted(() => ({ value: "/settings/accounts/clients" }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.value }));

import { AccountsTabs } from "@/features/accounts/components/accounts-tabs";

describe("AccountsTabs", () => {
  it("marks the clients tab current on a client route", () => {
    pathname.value = "/settings/accounts/clients/abc";
    render(<AccountsTabs />);
    expect(screen.getByRole("link", { name: "Clientes OAuth" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Contas de Serviço" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("marks the services tab current on a services route", () => {
    pathname.value = "/settings/accounts/services";
    render(<AccountsTabs />);
    expect(screen.getByRole("link", { name: "Contas de Serviço" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/__tests__/accounts/accounts-tabs.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Add routes** — in `src/lib/constants.ts`, inside `ROUTES` after `DEPARTMENTS_ROLE: "roles",`:

```ts
  ACCOUNTS: "/settings/accounts",
  OAUTH_CLIENTS: "/settings/accounts/clients",
  SERVICE_ACCOUNTS: "/settings/accounts/services",
```

- [ ] **Step 4: Implement `accounts-tabs.tsx`**

Links, not ARIA tabs: each tab is its own route, so this is navigation (`aria-current="page"`), which keeps browser back/forward and deep links correct.

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const TABS = [
  { href: ROUTES.OAUTH_CLIENTS, label: "Clientes OAuth" },
  { href: ROUTES.SERVICE_ACCOUNTS, label: "Contas de Serviço" },
] as const;

export function AccountsTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Secções de Contas e Serviços" className="border-b border-border">
      <ul className="flex gap-7">
        {TABS.map((tab) => {
          const current = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "-mb-px inline-flex h-10 items-center border-b-2 font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  current
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
```

- [ ] **Step 5: Route shells**

`src/app/(igrp)/(home)/settings/accounts/layout.tsx`:

```tsx
import { PageHeader } from "@/components/page-header";
import { AccountsTabs } from "@/features/accounts/components/accounts-tabs";

export default function AccountsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Contas e Serviços"
        description="Identidades que acedem às APIs do iGRP: clientes OAuth e as contas de serviço que os envolvem."
        showBackButton
        linkBackButton="/settings"
      />
      <AccountsTabs />
      {children}
    </div>
  );
}
```

> Check `src/components/page-header.tsx` props before writing: `title`, `description?`, `showBackButton?`, `linkBackButton?`. If `PageHeader` renders an `h1`, the detail page (Task 9) must use `h2` for the client name.

`src/app/(igrp)/(home)/settings/accounts/page.tsx`:

```tsx
import { redirect } from "next/navigation";

import { ROUTES } from "@/lib/constants";

export default function AccountsIndexPage() {
  redirect(ROUTES.OAUTH_CLIENTS);
}
```

`src/app/(igrp)/(home)/settings/accounts/services/page.tsx` (honest placeholder until Plan 2 replaces it):

```tsx
import type { Metadata } from "next";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@igrp/igrp-framework-react-design-system";

export const metadata: Metadata = { title: "Contas de Serviço" };

export default function ServiceAccountsPage() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>Contas de serviço ainda não disponíveis</EmptyTitle>
        <EmptyDescription>
          A gestão de contas de serviço chega numa próxima versão. Os clientes OAuth já podem ser geridos no separador ao lado.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
```

> Confirm `Empty`, `EmptyHeader`, `EmptyTitle`, `EmptyDescription` are exported from the design system (`node_modules/@igrp/igrp-framework-react-design-system/dist/components/primitives/empty.d.ts`). If a name differs, use the declared one.

- [ ] **Step 6: Activate the settings card** — in `src/app/(igrp)/(home)/settings/page.tsx`, replace the `gestao-contas-servicos` entry with:

```ts
    {
      id: "gestao-contas-servicos",
      title: "Contas e Serviços",
      description:
        "Registe clientes OAuth e faça a gestão das contas de serviço que acedem às APIs.",
      icon: "KeyRound",
      href: "/settings/accounts",
      accent: "primary",
    },
```

(Title matches the page heading, per the comment at the top of `settingsConfig`. Move the entry above the `status: "inativo"` comment block so the comment still only describes inactive cards.)

- [ ] **Step 7: Run test + typecheck**

Run: `npx vitest run src/__tests__/accounts/accounts-tabs.test.tsx && pnpm typecheck`
Expected: PASS; 0 type errors. typedRoutes only accepts hrefs whose route files exist, so this task also creates a temporary `src/app/(igrp)/(home)/settings/accounts/clients/page.tsx` containing `export default function OAuthClientsPage() { return null; }` — Task 8 Step 7 replaces it. Include it in this task's commit.

- [ ] **Step 8: Commit**

```bash
git add src/lib/constants.ts src/features/accounts "src/app/(igrp)/(home)/settings/accounts" "src/app/(igrp)/(home)/settings/page.tsx" src/__tests__/accounts
git commit -m "feat(accounts): add accounts area shell, tabs and activate settings card"
```

---

### Task 6: Shared UI primitives — ChipInput, SensitiveValueDisclosure, UnsavedChangesBar

**Files:**
- Create: `src/components/chip-input.tsx`
- Create: `src/components/sensitive-value-disclosure.tsx`
- Create: `src/components/unsaved-changes-bar.tsx`
- Test: `src/__tests__/components/chip-input.test.tsx`
- Test: `src/__tests__/components/sensitive-value-disclosure.test.tsx`

**Interfaces:**
- Produces:
  - `ChipInput(props: { id: string; value: string[]; onChange: (next: string[]) => void; placeholder?: string; mono?: boolean; "aria-describedby"?: string; "aria-invalid"?: boolean })` — Enter/comma/Space commits the draft (trimmed, de-duplicated); Backspace on empty draft removes the last chip; each chip has a remove button labelled `Remover <value>`.
  - `SensitiveValueDisclosure(props: { label: string; value: string; confirmationLabel?: string; onConfirmedChange: (confirmed: boolean) => void })` — masked by default, "Mostrar"/"Ocultar" toggle (`aria-pressed`), "Copiar" writes the raw value and toasts.
  - `UnsavedChangesBar(props: { count?: number; onDiscard: () => void; onSave?: () => void; isSaving: boolean; formId?: string })` — renders a `role="region"` bar; Save is `type="submit"` with `form={formId}` when `formId` is given.

- [ ] **Step 1: Write the failing ChipInput test**

```tsx
import { useState } from "react";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { ChipInput } from "@/components/chip-input";

function Harness({ initial = [] as string[] }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <label htmlFor="c">URIs</label>
      <ChipInput id="c" value={value} onChange={setValue} />
      <output>{value.join("|")}</output>
    </>
  );
}

describe("ChipInput", () => {
  it("commits on Enter, trims and de-duplicates", async () => {
    render(<Harness initial={["openid"]} />);
    const input = screen.getByLabelText("URIs");
    await userEvent.type(input, "  email{Enter}openid{Enter}");
    expect(document.querySelector("output")?.textContent).toBe("openid|email");
    expect(screen.getByRole("status")).toHaveTextContent("email adicionado");
  });

  it("removes a chip with its button", async () => {
    render(<Harness initial={["openid", "email"]} />);
    await userEvent.click(screen.getByRole("button", { name: "Remover openid" }));
    expect(document.querySelector("output")?.textContent).toBe("email");
  });

  it("removes the last chip on Backspace with an empty draft", async () => {
    render(<Harness initial={["openid", "email"]} />);
    await userEvent.type(screen.getByLabelText("URIs"), "{Backspace}");
    expect(document.querySelector("output")?.textContent).toBe("openid");
  });
});
```

- [ ] **Step 2: Write the failing disclosure test**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const toast = vi.fn();
vi.mock("@igrp/igrp-framework-react-design-system", async (orig) => ({
  ...(await orig<typeof import("@igrp/igrp-framework-react-design-system")>()),
  useIGRPToast: () => ({ igrpToast: toast }),
}));

import { SensitiveValueDisclosure } from "@/components/sensitive-value-disclosure";

describe("SensitiveValueDisclosure", () => {
  it("is masked by default and can be revealed", async () => {
    render(<SensitiveValueDisclosure label="Client secret" value="s3cret" onConfirmedChange={vi.fn()} />);
    const input = screen.getByLabelText("Client secret");
    expect(input).toHaveAttribute("type", "password");
    await userEvent.click(screen.getByRole("button", { name: "Mostrar" }));
    expect(input).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Ocultar" })).toHaveAttribute("aria-pressed", "true");
  });

  it("copies the raw value even while masked", async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, "writeText");
    render(<SensitiveValueDisclosure label="Client secret" value="s3cret" onConfirmedChange={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Copiar" }));
    expect(writeText).toHaveBeenCalledWith("s3cret");
    expect(toast).toHaveBeenCalled();
  });

  it("reports the confirmation checkbox", async () => {
    const onConfirmedChange = vi.fn();
    render(<SensitiveValueDisclosure label="Client secret" value="s3cret" onConfirmedChange={onConfirmedChange} />);
    await userEvent.click(screen.getByRole("checkbox", { name: "Guardei o segredo num local seguro" }));
    expect(onConfirmedChange).toHaveBeenLastCalledWith(true);
  });
});
```

(`userEvent.setup()` installs a clipboard stub on `navigator.clipboard`, so `spyOn` works after it.)

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/components/chip-input.test.tsx src/__tests__/components/sensitive-value-disclosure.test.tsx`
Expected: FAIL — modules not found.

- [ ] **Step 4: Implement `chip-input.tsx`**

```tsx
"use client";

import { type KeyboardEvent, useState } from "react";

import { IGRPIcon } from "@igrp/igrp-framework-react-design-system";

import { cn } from "@/lib/utils";

interface ChipInputProps {
  id: string;
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  mono?: boolean;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}

export function ChipInput({
  id,
  value,
  onChange,
  placeholder = "Adicionar…",
  mono,
  ...aria
}: ChipInputProps) {
  const [draft, setDraft] = useState("");
  const [announcement, setAnnouncement] = useState("");

  function commit() {
    const next = draft.trim();
    setDraft("");
    if (!next || value.includes(next)) return;
    onChange([...value, next]);
    setAnnouncement(`${next} adicionado`);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === "," || e.key === " ") {
      e.preventDefault();
      commit();
    } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5 rounded-md border border-input bg-background p-2 focus-within:ring-2 focus-within:ring-ring",
        aria["aria-invalid"] && "border-destructive",
      )}
    >
      {value.map((chip) => (
        <span
          key={chip}
          className={cn(
            "inline-flex h-7 items-center gap-1 rounded-sm border border-border bg-muted ps-2.5 text-sm",
            mono && "font-mono text-xs",
          )}
        >
          {chip}
          <button
            type="button"
            className="inline-flex size-7 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Remover ${chip}`}
            onClick={() => onChange(value.filter((v) => v !== chip))}
          >
            <IGRPIcon iconName="X" className="size-3.5" aria-hidden="true" />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={commit}
        placeholder={placeholder}
        className={cn(
          "h-7 min-w-48 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground",
          mono && "font-mono text-xs",
        )}
        {...aria}
      />
      <span role="status" className="sr-only">
        {announcement}
      </span>
    </div>
  );
}
```

- [ ] **Step 5: Implement `sensitive-value-disclosure.tsx`**

```tsx
"use client";

import { useId, useState } from "react";

import {
  Button,
  Checkbox,
  IGRPIcon,
  Input,
  Label,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";

interface SensitiveValueDisclosureProps {
  label: string;
  value: string;
  confirmationLabel?: string;
  onConfirmedChange: (confirmed: boolean) => void;
}

/**
 * Shows a value that will never be retrievable again (spec §6.3). Holds it only
 * in props/state — callers must not put it in the query cache. Masked by
 * default so screen-sharing does not leak it; Copy always copies the raw value.
 */
export function SensitiveValueDisclosure({
  label,
  value,
  confirmationLabel = "Guardei o segredo num local seguro",
  onConfirmedChange,
}: SensitiveValueDisclosureProps) {
  const id = useId();
  const [revealed, setRevealed] = useState(false);
  const { igrpToast } = useIGRPToast();

  async function copy() {
    await navigator.clipboard.writeText(value);
    igrpToast({ type: "success", title: "Copiado", description: `${label} copiado.` });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-value`}>{label}</Label>
        <div className="flex items-center gap-2">
          <Input
            id={`${id}-value`}
            type={revealed ? "text" : "password"}
            value={value}
            readOnly
            className="font-mono"
            aria-describedby={`${id}-help`}
          />
          <Button
            type="button"
            variant="ghost"
            aria-pressed={revealed}
            onClick={() => setRevealed((r) => !r)}
          >
            <IGRPIcon iconName={revealed ? "EyeOff" : "Eye"} aria-hidden="true" />
            {revealed ? "Ocultar" : "Mostrar"}
          </Button>
          <Button type="button" variant="outline" onClick={copy}>
            <IGRPIcon iconName="Copy" aria-hidden="true" />
            Copiar
          </Button>
        </div>
        <p id={`${id}-help`} className="text-sm text-muted-foreground">
          Oculto por defeito, para não aparecer em partilhas de ecrã. Copiar copia sempre o valor completo.
        </p>
      </div>
      <Label
        htmlFor={`${id}-confirm`}
        className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 font-normal"
      >
        <Checkbox
          id={`${id}-confirm`}
          onCheckedChange={(checked) => onConfirmedChange(checked === true)}
        />
        {confirmationLabel}
      </Label>
    </div>
  );
}
```

- [ ] **Step 6: Implement `unsaved-changes-bar.tsx`**

```tsx
"use client";

import { Button } from "@igrp/igrp-framework-react-design-system";

interface UnsavedChangesBarProps {
  onDiscard: () => void;
  isSaving: boolean;
  /** Submit the form with this id (preferred), or call onSave. */
  formId?: string;
  onSave?: () => void;
}

export function UnsavedChangesBar({ onDiscard, isSaving, formId, onSave }: UnsavedChangesBarProps) {
  return (
    <div
      role="region"
      aria-label="Alterações por guardar"
      className="sticky bottom-4 z-10 flex items-center gap-3 rounded-xl bg-foreground px-5 py-3 text-background shadow-lg"
    >
      <span className="flex-1">Tem alterações por guardar.</span>
      <Button type="button" variant="ghost" onClick={onDiscard} disabled={isSaving} className="text-background hover:bg-background/10 hover:text-background">
        Descartar
      </Button>
      <Button
        type={formId ? "submit" : "button"}
        form={formId}
        onClick={formId ? undefined : onSave}
        disabled={isSaving}
        variant="secondary"
      >
        {isSaving ? "A guardar…" : "Guardar alterações"}
      </Button>
    </div>
  );
}
```

- [ ] **Step 7: Run tests + UI rules**

Run: `npx vitest run src/__tests__/components/chip-input.test.tsx src/__tests__/components/sensitive-value-disclosure.test.tsx && pnpm check:ui`
Expected: PASS; 0 strict violations.

- [ ] **Step 8: Commit**

```bash
git add src/components/chip-input.tsx src/components/sensitive-value-disclosure.tsx src/components/unsaved-changes-bar.tsx src/__tests__/components/chip-input.test.tsx src/__tests__/components/sensitive-value-disclosure.test.tsx
git commit -m "feat(components): add chip input, one-time secret disclosure and save bar"
```

---

### Task 7: Form sections and create dialog (with one-time secret)

**Files:**
- Create: `src/features/oauth-clients/components/oauth-client-form-sections.tsx`
- Create: `src/features/oauth-clients/components/oauth-client-create-dialog.tsx`
- Test: `src/__tests__/oauth-clients/components/oauth-client-create-dialog.test.tsx`

**Interfaces:**
- Consumes: `oauthClientFormSchema`, `emptyOAuthClientFormValues`, `toCreateRequest` (Task 2); `GRANT_TYPES`, `formatSeconds` (Task 1); `useCreateOAuthClient` (Task 4); `ChipInput`, `SensitiveValueDisclosure` (Task 6); `useApplications` (`src/features/applications/use-applications.ts`).
- Produces:
  - `OAuthClientFormSections(props: { mode: "create" | "edit"; lockClientCredentials?: { accountName: string }; lockedSecretHint?: boolean })` — renders inside a react-hook-form `FormProvider` (`Form` from the DS); sections: Informação básica, Grant types, Redirect URIs (only while `authorization_code`), Scopes, Duração dos tokens. Each section is `<section aria-labelledby>` with the two-column layout (`grid md:grid-cols-[280px_minmax(0,1fr)] gap-6 md:gap-12`).
  - `OAuthClientCreateDialog({ open, onOpenChange })`

- [ ] **Step 1: Write the failing dialog test**

```tsx
import type { ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { createOAuthClient } from "@/actions/oauth-clients";

vi.mock("@/actions/oauth-clients", () => ({
  createOAuthClient: vi.fn(),
  listOAuthClients: vi.fn(),
  getOAuthClient: vi.fn(),
  updateOAuthClient: vi.fn(),
  deleteOAuthClient: vi.fn(),
  setOAuthClientActive: vi.fn(),
}));
vi.mock("@/actions/service-accounts", () => ({
  listServiceAccounts: vi.fn(),
  setServiceAccountActive: vi.fn(),
}));
const APPS = { data: [{ id: 7, code: "INV", name: "Faturação" }] };
vi.mock("@/features/applications/use-applications", () => ({
  useApplications: () => APPS,
}));

import { OAuthClientCreateDialog } from "@/features/oauth-clients/components/oauth-client-create-dialog";

function renderDialog() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  render(<OAuthClientCreateDialog open onOpenChange={vi.fn()} />, { wrapper });
}

async function fillValidWebClient() {
  await userEvent.type(screen.getByLabelText(/^Client ID/), "my-invoice");
  await userEvent.type(screen.getByLabelText(/^Nome/), "Invoice App");
  await userEvent.type(screen.getByLabelText(/URIs de redirecionamento/), "https://a.gov.cv/cb{Enter}");
}

describe("OAuthClientCreateDialog", () => {
  it("hides redirect URIs when authorization_code is unticked", async () => {
    renderDialog();
    expect(screen.getByLabelText(/URIs de redirecionamento/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("checkbox", { name: /authorization_code/ }));
    expect(screen.queryByLabelText(/URIs de redirecionamento/)).not.toBeInTheDocument();
  });

  it("puts a 409 on the clientId field", async () => {
    vi.mocked(createOAuthClient).mockResolvedValueOnce({ success: false, error: "Conflict", status: 409 });
    renderDialog();
    await fillValidWebClient();
    await userEvent.click(screen.getByRole("button", { name: "Registar" }));
    expect(await screen.findByText("Já existe um cliente com este client ID.")).toBeInTheDocument();
  });

  it("shows the secret once, with Concluir disabled until confirmed", async () => {
    vi.mocked(createOAuthClient).mockResolvedValueOnce({
      success: true,
      data: {
        id: "u1",
        clientId: "my-invoice",
        clientSecret: "s3cret",
        active: true,
        accessTokenTtl: 1,
        refreshTokenTtl: 1,
        authorizationCodeTtl: 1,
        scopes: [],
        redirectUris: [],
        grantTypes: [],
      },
    });
    renderDialog();
    await fillValidWebClient();
    await userEvent.click(screen.getByRole("button", { name: "Registar" }));

    expect(await screen.findByText("Este segredo não volta a ser mostrado.")).toBeInTheDocument();
    const done = screen.getByRole("button", { name: /Concluir/ });
    expect(done).toBeDisabled();
    await userEvent.click(screen.getByRole("checkbox", { name: "Guardei o segredo num local seguro" }));
    await waitFor(() => expect(done).toBeEnabled());
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/__tests__/oauth-clients/components/oauth-client-create-dialog.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `oauth-client-form-sections.tsx`**

```tsx
"use client";

import type { ReactNode } from "react";

import {
  Checkbox,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  IGRPIcon,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@igrp/igrp-framework-react-design-system";
import { useFormContext, useWatch } from "react-hook-form";

import { ChipInput } from "@/components/chip-input";
import { useApplications } from "@/features/applications/use-applications";
import { cn } from "@/lib/utils";

import { formatSeconds, GRANT_TYPES } from "../lib/oauth-client-utils";
import type { OAuthClientFormValues } from "../oauth-client-schemas";

function Section({ id, title, description, children }: { id: string; title: string; description: ReactNode; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="grid gap-6 p-6 md:grid-cols-[280px_minmax(0,1fr)] md:gap-12 md:p-8">
      <div className="flex flex-col gap-1.5">
        <h3 id={id} className="text-base font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex max-w-2xl flex-col gap-5">{children}</div>
    </section>
  );
}

const TTL_FIELDS = [
  { name: "accessTokenTtl", label: "Access token" },
  { name: "refreshTokenTtl", label: "Refresh token" },
  { name: "authorizationCodeTtl", label: "Authorization code" },
] as const;

export function OAuthClientFormSections({
  mode,
  lockClientCredentials,
}: {
  mode: "create" | "edit";
  /** Set when a service account is linked: client_credentials stays on. */
  lockClientCredentials?: { accountName: string };
}) {
  const form = useFormContext<OAuthClientFormValues>();
  const grantTypes = useWatch({ control: form.control, name: "grantTypes" });
  const ttls = useWatch({ control: form.control, name: ["accessTokenTtl", "refreshTokenTtl", "authorizationCodeTtl"] });
  const { data: applications = [] } = useApplications();
  const usesRedirects = grantTypes.includes("authorization_code");

  return (
    <div className="flex flex-col divide-y divide-border">
      <Section id="sec-basic" title="Informação básica" description="Como o cliente é identificado no servidor de autorização.">
        <FormField
          control={form.control}
          name="clientId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Client ID{mode === "create" ? " *" : ""}</FormLabel>
              <FormControl>
                <Input {...field} className="font-mono" readOnly={mode === "edit"} autoComplete="off" spellCheck={false} />
              </FormControl>
              <FormDescription>
                {mode === "create"
                  ? "Minúsculas, números e hífenes. Não pode ser alterado depois."
                  : "Definido no registo. Não pode ser alterado."}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="clientName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome *</FormLabel>
              <FormControl><Input {...field} autoComplete="off" /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {mode === "edit" ? (
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Client secret</span>
            <div className="flex h-9 items-center gap-2.5 rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground">
              <IGRPIcon iconName="Lock" className="size-4" aria-hidden="true" />
              Mostrado apenas uma vez, no registo
            </div>
            <p className="text-sm text-muted-foreground">
              O servidor guarda só uma versão cifrada — ninguém o pode voltar a ler. Se foi exposto, desative este cliente e registe um novo.
            </p>
          </div>
        ) : null}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl><Textarea {...field} rows={3} maxLength={140} /></FormControl>
              <FormDescription>Até 140 caracteres.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="applicationCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Aplicação</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Selecionar aplicação" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {applications.map((app) => (
                    <SelectItem key={app.code} value={app.code}>
                      {app.code} — {app.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>A aplicação a que este cliente pertence. Uma conta de serviço herda-a.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </Section>

      <Section id="sec-grants" title="Grant types" description="Como este cliente obtém tokens. As secções abaixo mudam conforme a escolha.">
        <FormField
          control={form.control}
          name="grantTypes"
          render={({ field }) => (
            <FormItem>
              <fieldset className="grid gap-3 sm:grid-cols-2">
                <legend className="sr-only">Grant types</legend>
                {GRANT_TYPES.map((grant) => {
                  const checked = field.value.includes(grant.value);
                  const locked = grant.value === "client_credentials" && !!lockClientCredentials;
                  const inputId = `grant-${grant.value}`;
                  return (
                    <label
                      key={grant.value}
                      htmlFor={inputId}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-lg border p-3.5",
                        checked ? "border-foreground ring-1 ring-foreground" : "border-input",
                        locked && "cursor-not-allowed",
                      )}
                    >
                      <Checkbox
                        id={inputId}
                        checked={checked}
                        disabled={locked}
                        aria-describedby={`${inputId}-help`}
                        onCheckedChange={(on) =>
                          field.onChange(
                            on === true
                              ? [...field.value, grant.value]
                              : field.value.filter((g) => g !== grant.value),
                          )
                        }
                      />
                      <span className="flex flex-col gap-1">
                        <span className="font-mono text-sm font-medium">{grant.value}</span>
                        <span id={`${inputId}-help`} className="text-sm text-muted-foreground">
                          {locked
                            ? `Necessário enquanto a conta de serviço «${lockClientCredentials.accountName}» existir.`
                            : grant.description}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </fieldset>
              <FormMessage />
            </FormItem>
          )}
        />
      </Section>

      {usesRedirects ? (
        <Section
          id="sec-redirects"
          title="Redirect URIs"
          description={<>Para onde o servidor devolve o utilizador depois do login. Aparece porque <span className="font-mono">authorization_code</span> está ativo.</>}
        >
          <FormField
            control={form.control}
            name="redirectUris"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel htmlFor="redirect-uris">URIs de redirecionamento *</FormLabel>
                <ChipInput
                  id="redirect-uris"
                  mono
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Adicionar URI…"
                  aria-describedby="redirect-uris-help"
                  aria-invalid={!!fieldState.error}
                />
                <FormDescription id="redirect-uris-help">
                  Prima Enter depois de cada URI. Só https://, exceto http://localhost.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </Section>
      ) : null}

      <Section id="sec-scopes" title="Scopes" description="Informação que o cliente pode pedir.">
        <FormField
          control={form.control}
          name="scopes"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="scopes">Scopes</FormLabel>
              <ChipInput id="scopes" mono value={field.value} onChange={field.onChange} placeholder="Adicionar scope…" />
              <FormMessage />
            </FormItem>
          )}
        />
      </Section>

      <Section id="sec-ttl" title="Duração dos tokens" description="Deixe em branco para usar os valores do servidor.">
        <div className="grid gap-4 sm:grid-cols-3">
          {TTL_FIELDS.map((ttl, i) => (
            <FormField
              key={ttl.name}
              control={form.control}
              name={ttl.name}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{ttl.label}</FormLabel>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Input
                        inputMode="numeric"
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const raw = e.target.value.trim();
                          field.onChange(raw === "" ? undefined : Number(raw));
                        }}
                        onBlur={field.onBlur}
                      />
                    </FormControl>
                    <span className="text-sm text-muted-foreground">segundos</span>
                  </div>
                  <FormDescription aria-live="polite">
                    {formatSeconds(ttls[i]) ? `= ${formatSeconds(ttls[i])}` : " "}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>
      </Section>
    </div>
  );
}
```

> `divide-y` is a divider utility, not `border-t`; confirm `pnpm check:ui` accepts it. If the `no-hr-divider` rule flags it, replace with `<Separator />` between sections.

- [ ] **Step 4: Implement `oauth-client-create-dialog.tsx`**

```tsx
"use client";

import Link from "next/link";
import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
  IGRPIcon,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import type { OAuthClientDTO } from "@igrp/platform-access-management-client-ts";
import { type Resolver, useForm } from "react-hook-form";

import { SensitiveValueDisclosure } from "@/components/sensitive-value-disclosure";
import { ROUTES } from "@/lib/constants";

import {
  emptyOAuthClientFormValues,
  oauthClientFormSchema,
  type OAuthClientFormValues,
  toCreateRequest,
} from "../oauth-client-schemas";
import { useCreateOAuthClient } from "../use-oauth-clients";
import { OAuthClientFormSections } from "./oauth-client-form-sections";

export function OAuthClientCreateDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { igrpToast } = useIGRPToast();
  const create = useCreateOAuthClient();
  // The raw secret lives ONLY here; unmounting the dialog drops it.
  const [created, setCreated] = useState<OAuthClientDTO | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  const form = useForm<OAuthClientFormValues>({
    resolver: zodResolver(oauthClientFormSchema) as Resolver<OAuthClientFormValues>,
    defaultValues: emptyOAuthClientFormValues(),
    mode: "onBlur",
  });

  async function onSubmit(values: OAuthClientFormValues) {
    const result = await create.mutateAsync(toCreateRequest(values));
    if (result.success) {
      setCreated(result.data);
      return;
    }
    if (result.status === 409) {
      form.setError("clientId", { message: "Já existe um cliente com este client ID." }, { shouldFocus: true });
      return;
    }
    igrpToast({ type: "error", title: "Não foi possível registar o cliente", description: result.error });
  }

  function requestClose(next: boolean) {
    if (next) return;
    if (created && !confirmed) {
      setConfirmClose(true);
      return;
    }
    onOpenChange(false);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={requestClose}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          {created?.clientSecret ? (
            <>
              <DialogHeader>
                <DialogTitle>Cliente registado</DialogTitle>
                <DialogDescription>
                  O cliente <span className="font-mono text-foreground">{created.clientId}</span> já pode pedir tokens. Guarde as credenciais antes de fechar.
                </DialogDescription>
              </DialogHeader>
              <div role="note" className="flex gap-3 rounded-lg bg-warning-subtle p-3.5 text-warning-subtle-foreground">
                <IGRPIcon iconName="TriangleAlert" className="mt-0.5 size-4.5 shrink-0" aria-hidden="true" />
                <div className="flex flex-col gap-0.5">
                  <strong className="font-semibold">Este segredo não volta a ser mostrado.</strong>
                  <span className="text-sm">Nem a si, nem a outro administrador. Guarde-o já no seu gestor de segredos.</span>
                </div>
              </div>
              <SensitiveValueDisclosure label="Client secret" value={created.clientSecret} onConfirmedChange={setConfirmed} />
              <DialogFooter className="items-center gap-4 sm:justify-between">
                <p className="text-sm text-muted-foreground">Se o segredo for exposto, desative o cliente e registe um novo.</p>
                {confirmed ? (
                  <Button asChild>
                    <Link href={`${ROUTES.OAUTH_CLIENTS}/${created.id}`} onClick={() => onOpenChange(false)}>
                      Concluir — ver detalhes
                    </Link>
                  </Button>
                ) : (
                  <Button disabled>Concluir — ver detalhes</Button>
                )}
              </DialogFooter>
            </>
          ) : (
            <Form {...form}>
              <form id="oauth-client-create" onSubmit={form.handleSubmit(onSubmit)} noValidate>
                <DialogHeader>
                  <DialogTitle>Registar cliente OAuth2</DialogTitle>
                  <DialogDescription>O segredo é mostrado uma única vez, no fim do registo.</DialogDescription>
                </DialogHeader>
                <OAuthClientFormSections mode="create" />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                  <Button type="submit" disabled={create.isPending}>
                    {create.isPending ? "A registar…" : "Registar"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmClose} onOpenChange={setConfirmClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fechar sem confirmar?</AlertDialogTitle>
            <AlertDialogDescription>Não poderá voltar a ver este segredo. Fechar mesmo assim?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={() => onOpenChange(false)}>Fechar mesmo assim</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
```

> If `Button` in the DS does not support `asChild`, render the enabled state as `<Link className={buttonVariants()} …>` using the DS's `buttonVariants` export, or as a `Button` whose `onClick` does `router.push(...)`.

- [ ] **Step 5: Run the test**

Run: `npx vitest run src/__tests__/oauth-clients/components/oauth-client-create-dialog.test.tsx`
Expected: PASS. If a Radix portal hides content from queries, keep queries on `screen` (portals render into `document.body`).

- [ ] **Step 6: Run the domain's tests + gates**

Run: `npx vitest run src/__tests__/oauth-clients && pnpm typecheck && pnpm check:ui`
Expected: PASS / 0 / 0.

- [ ] **Step 7: Commit**

```bash
git add src/features/oauth-clients/components/oauth-client-form-sections.tsx src/features/oauth-clients/components/oauth-client-create-dialog.tsx src/__tests__/oauth-clients/components/oauth-client-create-dialog.test.tsx
git commit -m "feat(oauth-clients): add sectioned client form and register dialog with one-time secret"
```

---

### Task 8: Clients list page

**Files:**
- Create: `src/features/oauth-clients/components/oauth-client-badges.tsx`
- Create: `src/features/oauth-clients/components/oauth-client-columns.tsx`
- Create: `src/features/oauth-clients/components/oauth-client-list.tsx`
- Create: `src/app/(igrp)/(home)/settings/accounts/clients/page.tsx`, `loading.tsx`, `error.tsx`
- Test: `src/__tests__/oauth-clients/components/oauth-client-columns.test.tsx`

**Interfaces:**
- Consumes: `useOAuthClients`, `useServiceAccounts`, `useSetClientActive`, `useDeleteOAuthClient` (Task 4); `getClientKind`, `CLIENT_KIND_LABEL`, `findLinkedServiceAccount` (Task 1); `IGRPDialogDelete` (`src/components/dialog-delete.tsx`); `ConfirmDialog` (`src/components/confirmation-modal.tsx`).
- Produces:
  - `ClientKindBadge({ grantTypes })`, `ActiveBadge({ active, feminine? })`
  - `type ClientRow = OAuthClientDTO & { linkedAccount?: ServiceAccountDTO }`
  - `getOAuthClientColumns(handlers: { onToggleActive(row: ClientRow): void; onDelete(row: ClientRow): void; onCopy(clientId: string): void; deleteBlocked?: boolean }): ColumnDef<ClientRow>[]`
  - `OAuthClientActivationDialog({ client, linkedAccount?, open, onOpenChange })` and `OAuthClientDeleteDialog({ client, open, onOpenChange, onDeleted? })` — defined here, reused by Task 9.
- Also consumes: `OAuthClientCreateDialog` (Task 7).

- [ ] **Step 1: Write the failing columns test**

```tsx
import type { ServiceAccountDTO } from "@igrp/platform-access-management-client-ts";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { OAuthClientRowActions } from "@/features/oauth-clients/components/oauth-client-columns";

const base = {
  id: "u1",
  clientId: "etl-runner-m2m",
  clientName: "Nightly ETL",
  active: true,
  accessTokenTtl: 1,
  refreshTokenTtl: 1,
  authorizationCodeTtl: 1,
  scopes: [],
  redirectUris: [],
  grantTypes: ["client_credentials"],
};
const handlers = { onToggleActive: vi.fn(), onDelete: vi.fn(), onCopy: vi.fn() };

describe("OAuthClientRowActions", () => {
  it("disables delete with the reason when a service account is linked", async () => {
    const linked = { id: "sa1", name: "Nightly Invoice ETL" } as ServiceAccountDTO;
    render(<OAuthClientRowActions row={{ ...base, linkedAccount: linked }} {...handlers} />);
    await userEvent.click(screen.getByRole("button", { name: "Ações para Nightly ETL" }));
    const del = screen.getByRole("menuitem", { name: /Eliminar/ });
    expect(del).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText("Remova primeiro a conta de serviço «Nightly Invoice ETL».")).toBeInTheDocument();
  });

  it("offers delete when nothing is linked", async () => {
    render(<OAuthClientRowActions row={base} {...handlers} />);
    await userEvent.click(screen.getByRole("button", { name: "Ações para Nightly ETL" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Eliminar" }));
    expect(handlers.onDelete).toHaveBeenCalled();
  });

  it("fails safe when service accounts could not be checked", async () => {
    render(<OAuthClientRowActions row={base} {...handlers} deleteBlocked />);
    await userEvent.click(screen.getByRole("button", { name: "Ações para Nightly ETL" }));
    expect(screen.getByRole("menuitem", { name: /Eliminar/ })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText("Não foi possível verificar se existe uma conta de serviço.")).toBeInTheDocument();
  });

  it("offers Ativar on an inactive client", async () => {
    render(<OAuthClientRowActions row={{ ...base, active: false }} {...handlers} />);
    await userEvent.click(screen.getByRole("button", { name: "Ações para Nightly ETL" }));
    expect(screen.getByRole("menuitem", { name: "Ativar" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/__tests__/oauth-clients/components/oauth-client-columns.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement badges**

```tsx
import { Badge } from "@igrp/igrp-framework-react-design-system";

import { cn } from "@/lib/utils";

import { CLIENT_KIND_LABEL, getClientKind } from "../lib/oauth-client-utils";

export function ClientKindBadge({ grantTypes }: { grantTypes: readonly string[] }) {
  const kind = getClientKind(grantTypes);
  return (
    <Badge
      variant="secondary"
      className={cn(
        kind === "web"
          ? "bg-info-subtle text-info-subtle-foreground"
          : "bg-primary-subtle text-primary-subtle-foreground",
      )}
    >
      {CLIENT_KIND_LABEL[kind]}
    </Badge>
  );
}

/** Colour + dot + word: state is never carried by colour alone. */
export function ActiveBadge({ active, feminine }: { active: boolean; feminine?: boolean }) {
  const label = active ? (feminine ? "Ativa" : "Ativo") : feminine ? "Inativa" : "Inativo";
  return (
    <Badge
      variant="secondary"
      className={cn(
        "gap-1.5",
        active ? "bg-success-subtle text-success-subtle-foreground" : "bg-muted text-muted-foreground",
      )}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {label}
    </Badge>
  );
}
```

- [ ] **Step 4: Implement columns + row actions**

```tsx
"use client";

import Link from "next/link";

import {
  type ColumnDef,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IGRPDataTableHeaderDefault,
  IGRPIcon,
} from "@igrp/igrp-framework-react-design-system";
import type {
  OAuthClientDTO,
  ServiceAccountDTO,
} from "@igrp/platform-access-management-client-ts";

import { ROUTES } from "@/lib/constants";

import { getClientKind } from "../lib/oauth-client-utils";
import { ActiveBadge, ClientKindBadge } from "./oauth-client-badges";

export type ClientRow = OAuthClientDTO & { linkedAccount?: ServiceAccountDTO };

interface RowHandlers {
  onToggleActive: (row: ClientRow) => void;
  onDelete: (row: ClientRow) => void;
  onCopy: (clientId: string) => void;
  /** True when the SA list failed to load: link state is unknown, so delete fails safe. */
  deleteBlocked?: boolean;
}

export function OAuthClientRowActions({
  row,
  onToggleActive,
  onDelete,
  onCopy,
  deleteBlocked,
}: { row: ClientRow } & RowHandlers) {
  const name = row.clientName || row.clientId;
  const blockedReason = row.linkedAccount
    ? `Remova primeiro a conta de serviço «${row.linkedAccount.name}».`
    : deleteBlocked
      ? "Não foi possível verificar se existe uma conta de serviço."
      : null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex size-9 items-center justify-center rounded-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Ações para ${name}`}
      >
        <IGRPIcon iconName="Ellipsis" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-64">
        <DropdownMenuItem asChild>
          <Link href={`${ROUTES.OAUTH_CLIENTS}/${row.id}`} className="flex gap-2">
            <IGRPIcon iconName="Settings2" aria-hidden="true" />
            Ver detalhes
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onCopy(row.clientId)}>
          <IGRPIcon iconName="Copy" aria-hidden="true" />
          Copiar client ID
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {row.active ? (
          <DropdownMenuItem variant="destructive" onSelect={() => onToggleActive(row)}>
            <IGRPIcon iconName="CircleOff" aria-hidden="true" />
            Desativar
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onSelect={() => onToggleActive(row)}>
            <IGRPIcon iconName="CircleCheck" aria-hidden="true" />
            Ativar
          </DropdownMenuItem>
        )}
        {blockedReason ? (
          <DropdownMenuItem disabled className="flex-col items-start gap-0.5">
            <span>Eliminar</span>
            <span className="text-xs text-muted-foreground">{blockedReason}</span>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem variant="destructive" onSelect={() => onDelete(row)}>
            <IGRPIcon iconName="Trash" aria-hidden="true" />
            Eliminar
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function getOAuthClientColumns(handlers: RowHandlers): ColumnDef<ClientRow>[] {
  return [
    {
      id: "client",
      accessorFn: (r) => `${r.clientName ?? ""} ${r.clientId}`,
      header: ({ column }) => <IGRPDataTableHeaderDefault column={column} title="Cliente" />,
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <Link href={`${ROUTES.OAUTH_CLIENTS}/${row.original.id}`} className="font-medium hover:underline">
            {row.original.clientName || row.original.clientId}
          </Link>
          <span className="font-mono text-xs text-muted-foreground">{row.original.clientId}</span>
        </div>
      ),
    },
    {
      id: "kind",
      accessorFn: (r) => getClientKind(r.grantTypes),
      header: ({ column }) => <IGRPDataTableHeaderDefault column={column} title="Tipo" />,
      cell: ({ row }) => <ClientKindBadge grantTypes={row.original.grantTypes} />,
      filterFn: (row, id, values: string[]) => values.includes(row.getValue(id)),
    },
    {
      id: "grantTypes",
      accessorFn: (r) => r.grantTypes.join(", "),
      header: ({ column }) => <IGRPDataTableHeaderDefault column={column} title="Grant types" />,
      cell: ({ getValue }) => <span className="font-mono text-xs">{String(getValue())}</span>,
    },
    {
      id: "application",
      accessorFn: (r) => r.applicationCode ?? "—",
      header: ({ column }) => <IGRPDataTableHeaderDefault column={column} title="Aplicação" />,
      cell: ({ getValue }) => <span className="font-mono text-xs">{String(getValue())}</span>,
      filterFn: (row, id, values: string[]) => values.includes(row.getValue(id)),
    },
    {
      id: "serviceAccount",
      accessorFn: (r) => r.linkedAccount?.name ?? "",
      header: ({ column }) => <IGRPDataTableHeaderDefault column={column} title="Conta de serviço" />,
      cell: ({ row }) =>
        row.original.linkedAccount ? (
          <span className="inline-flex items-center gap-1.5">
            <IGRPIcon iconName="Bot" className="size-3.5" aria-hidden="true" />
            {row.original.linkedAccount.name}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      id: "status",
      accessorFn: (r) => (r.active ? "ACTIVE" : "INACTIVE"),
      header: ({ column }) => <IGRPDataTableHeaderDefault column={column} title="Estado" />,
      cell: ({ row }) => <ActiveBadge active={row.original.active} />,
      filterFn: (row, id, values: string[]) => values.includes(row.getValue(id)),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Ações</span>,
      cell: ({ row }) => <OAuthClientRowActions row={row.original} {...handlers} />,
      enableSorting: false,
    },
  ];
}
```

> The SA link in the "Conta de serviço" cell becomes a `Link` to `/settings/accounts/services/[id]` in Plan 2 (that route does not exist yet; typedRoutes would reject it).

- [ ] **Step 5: Implement the two dialogs used by list and detail**

`src/features/oauth-clients/components/oauth-client-activation-dialog.tsx`:

```tsx
"use client";

import { useIGRPToast } from "@igrp/igrp-framework-react-design-system";
import type {
  OAuthClientDTO,
  ServiceAccountDTO,
} from "@igrp/platform-access-management-client-ts";

import { ConfirmDialog } from "@/components/confirmation-modal";

import { useSetClientActive } from "../use-oauth-clients";

const STEP_LABEL = { client: "cliente OAuth", serviceAccount: "conta de serviço" } as const;

export function OAuthClientActivationDialog({
  client,
  linkedAccount,
  open,
  onOpenChange,
}: {
  client: OAuthClientDTO;
  linkedAccount?: ServiceAccountDTO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { igrpToast } = useIGRPToast();
  const mutation = useSetClientActive();
  const activate = !client.active;

  const description = activate
    ? linkedAccount
      ? `O cliente e a conta de serviço «${linkedAccount.name}» voltam a poder autenticar.`
      : "O cliente volta a poder pedir tokens."
    : linkedAccount
      ? `O cliente e a conta de serviço «${linkedAccount.name}» deixam de conseguir autenticar até serem reativados.`
      : "As aplicações que usam este cliente deixam de conseguir autenticar. Pode reativá-lo depois.";

  async function confirm() {
    const result = await mutation.mutateAsync({
      client,
      linkedAccountId: linkedAccount?.id,
      active: activate,
    });
    if (result.success) {
      igrpToast({
        type: "success",
        title: activate ? "Cliente ativado" : "Cliente desativado",
        description: client.clientName || client.clientId,
      });
      onOpenChange(false);
      return;
    }
    const step = "failedStep" in result ? ` (falhou: ${STEP_LABEL[result.failedStep]})` : "";
    igrpToast({
      type: "error",
      title: `Não foi possível ${activate ? "ativar" : "desativar"}${step}`,
      description: `${result.error} Tente novamente.`,
    });
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={activate ? "Ativar cliente" : "Desativar cliente"}
      description={description}
      onConfirm={confirm}
      isLoading={mutation.isPending}
      confirmText={activate ? "Ativar" : "Desativar"}
      loadingText={activate ? "A ativar…" : "A desativar…"}
      variant={activate ? "default" : "destructive"}
    />
  );
}
```

`src/features/oauth-clients/components/oauth-client-delete-dialog.tsx`:

```tsx
"use client";

import { useIGRPToast } from "@igrp/igrp-framework-react-design-system";
import type { OAuthClientDTO } from "@igrp/platform-access-management-client-ts";

import { IGRPDialogDelete } from "@/components/dialog-delete";

import { useDeleteOAuthClient } from "../use-oauth-clients";

export function OAuthClientDeleteDialog({
  client,
  open,
  onOpenChange,
  onDeleted,
}: {
  client: OAuthClientDTO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}) {
  const { igrpToast } = useIGRPToast();
  const mutation = useDeleteOAuthClient();

  async function confirmDelete() {
    const result = await mutation.mutateAsync(client.id);
    if (!result.success) {
      igrpToast({ type: "error", title: "Não foi possível eliminar", description: result.error });
      return;
    }
    igrpToast({ type: "success", title: "Cliente eliminado", description: client.clientId });
    onOpenChange(false);
    onDeleted?.();
  }

  return (
    <IGRPDialogDelete
      open={open}
      onOpenChange={onOpenChange}
      toDelete={{ name: client.clientId }}
      confirmDelete={confirmDelete}
      isDeleting={mutation.isPending}
      description="O registo é removido e as credenciais deixam de funcionar de imediato. Não é possível recuperá-lo."
      label="Client ID"
      textHeader="Eliminar cliente OAuth"
    />
  );
}
```

- [ ] **Step 6: Implement the list component**

```tsx
"use client";

import { useCallback, useMemo, useState } from "react";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  IGRPButton,
  IGRPDataTable,
  type IGRPDataTableClientFilterListProps,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";

import { ColumnFacetedFilter } from "@/components/data-table/faceted-filter";
import { ColumnSearchInput } from "@/components/data-table/search-input";
import { InlineError } from "@/components/inline-error";
import { STATUS_OPTIONS } from "@/lib/constants";
import { useServiceAccounts } from "@/features/service-accounts/use-service-accounts";

import { CLIENT_KIND_LABEL, findLinkedServiceAccount } from "../lib/oauth-client-utils";
import { useOAuthClients } from "../use-oauth-clients";
import { OAuthClientActivationDialog } from "./oauth-client-activation-dialog";
import { type ClientRow, getOAuthClientColumns } from "./oauth-client-columns";
import { OAuthClientCreateDialog } from "./oauth-client-create-dialog";
import { OAuthClientDeleteDialog } from "./oauth-client-delete-dialog";

type DialogState =
  | { kind: "none" }
  | { kind: "create" }
  | { kind: "activation"; row: ClientRow }
  | { kind: "delete"; row: ClientRow };

const KIND_OPTIONS = [
  { value: "web", label: CLIENT_KIND_LABEL.web },
  { value: "machine", label: CLIENT_KIND_LABEL.machine },
];

export function OAuthClientList() {
  const { igrpToast } = useIGRPToast();
  const { data: clients = [] } = useOAuthClients();
  const accounts = useServiceAccounts();
  const [dialog, setDialog] = useState<DialogState>({ kind: "none" });
  const close = useCallback(() => setDialog({ kind: "none" }), []);

  const rows: ClientRow[] = useMemo(
    () =>
      clients.map((c) => ({
        ...c,
        linkedAccount: findLinkedServiceAccount(accounts.data, c.id).account,
      })),
    [clients, accounts.data],
  );

  const appOptions = useMemo(
    () =>
      [...new Set(clients.map((c) => c.applicationCode ?? "—"))].map((code) => ({
        value: code,
        label: code,
      })),
    [clients],
  );

  const columns = useMemo(
    () =>
      getOAuthClientColumns({
        onToggleActive: (row) => setDialog({ kind: "activation", row }),
        onDelete: (row) => setDialog({ kind: "delete", row }),
        onCopy: async (clientId) => {
          await navigator.clipboard.writeText(clientId);
          igrpToast({ type: "success", title: "Copiado", description: `Client ID ${clientId} copiado.` });
        },
        deleteBlocked: accounts.isError,
      }),
    [igrpToast, accounts.isError],
  );

  const filters: IGRPDataTableClientFilterListProps<ClientRow>[] = useMemo(
    () => [
      {
        columnId: "client",
        component: ({ column }) => (
          <ColumnSearchInput column={column} label="Pesquisar clientes" placeholder="Pesquisar por nome ou client ID…" />
        ),
      },
      {
        columnId: "kind",
        component: ({ column }) => <ColumnFacetedFilter column={column} label="Tipo" options={KIND_OPTIONS} />,
      },
      {
        columnId: "application",
        component: ({ column }) => <ColumnFacetedFilter column={column} label="Aplicação" options={appOptions} />,
      },
      {
        columnId: "status",
        component: ({ column }) => <ColumnFacetedFilter column={column} label="Estado" options={STATUS_OPTIONS} />,
      },
    ],
    [appOptions],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <IGRPButton iconName="Plus" showIcon onClick={() => setDialog({ kind: "create" })}>
          Registar cliente
        </IGRPButton>
      </div>

      {/* Supplementary data: without SA links, delete must fail safe. */}
      {accounts.isError ? (
        <InlineError
          title="Não foi possível verificar as contas de serviço."
          message="Eliminar está indisponível até a verificação ser feita."
          onRetry={() => accounts.refetch()}
        />
      ) : null}

      {rows.length === 0 ? (
        <Empty className="rounded-xl border border-border">
          <EmptyHeader>
            <EmptyTitle>Ainda não há clientes OAuth</EmptyTitle>
            <EmptyDescription>
              Um cliente OAuth é uma aplicação ou serviço registado para pedir tokens ao servidor de autorização iGRP.
            </EmptyDescription>
          </EmptyHeader>
          <IGRPButton iconName="Plus" showIcon onClick={() => setDialog({ kind: "create" })}>
            Registar o primeiro cliente
          </IGRPButton>
        </Empty>
      ) : (
        <IGRPDataTable<ClientRow, ClientRow>
          showFilter
          showPagination
          tableClassName="table-fixed"
          columns={columns}
          data={rows}
          clientFilters={filters}
        />
      )}

      {dialog.kind === "create" ? <OAuthClientCreateDialog open onOpenChange={(o) => !o && close()} /> : null}
      {dialog.kind === "activation" ? (
        <OAuthClientActivationDialog
          client={dialog.row}
          linkedAccount={dialog.row.linkedAccount}
          open
          onOpenChange={(o) => !o && close()}
        />
      ) : null}
      {dialog.kind === "delete" ? (
        <OAuthClientDeleteDialog client={dialog.row} open onOpenChange={(o) => !o && close()} />
      ) : null}
    </div>
  );
}
```

> Verify `IGRPButton` props (`iconName`, `showIcon`) against `src/features/users/components/user-list.tsx` before writing; use the same props that file uses.

- [ ] **Step 7: Route files**

`clients/page.tsx`:

```tsx
import type { Metadata } from "next";

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { OAuthClientList } from "@/features/oauth-clients/components/oauth-client-list";
import { prefetchOAuthClientList } from "@/features/oauth-clients/prefetch";
import { getQueryClient } from "@/providers/query-client.server";

export const metadata: Metadata = {
  title: "Clientes OAuth",
  description: "Consumidores de API registados no servidor de autorização iGRP.",
};

export default async function OAuthClientsPage() {
  const queryClient = getQueryClient();
  await prefetchOAuthClientList(queryClient);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <OAuthClientList />
    </HydrationBoundary>
  );
}
```

`clients/loading.tsx`:

```tsx
import { AppCenterLoading } from "@/components/loading";

export default function OAuthClientsLoading() {
  return <AppCenterLoading description="A carregar clientes OAuth..." />;
}
```

`clients/error.tsx` — copy `src/app/(igrp)/(home)/settings/applications/error.tsx` verbatim, renaming the component to `OAuthClientsError`, the log tag to `"[oauth-clients] segment error"`, and the title to `"Não foi possível carregar os clientes OAuth."`.

- [ ] **Step 8: Run tests + gates**

Run: `npx vitest run src/__tests__/oauth-clients && pnpm typecheck && pnpm check:ui`
Expected: PASS / 0 / 0.

- [ ] **Step 9: Commit**

```bash
git add src/features/oauth-clients/components "src/app/(igrp)/(home)/settings/accounts/clients" src/__tests__/oauth-clients/components
git commit -m "feat(oauth-clients): add clients list with type, linked account and row actions"
```

---

### Task 9: Client detail page — in-place edit and danger zone

**Files:**
- Create: `src/features/oauth-clients/components/oauth-client-detail.tsx`
- Create: `src/app/(igrp)/(home)/settings/accounts/clients/[id]/page.tsx`, `loading.tsx`, `error.tsx`
- Test: `src/__tests__/oauth-clients/components/oauth-client-detail.test.tsx`

**Interfaces:**
- Consumes: `useOAuthClient`, `useUpdateOAuthClient` (Task 4); `useLinkedServiceAccount` (Task 4); `toFormValues`, `toUpdateRequest`, `oauthClientFormSchema` (Task 2); `OAuthClientFormSections` (Task 7); `UnsavedChangesBar` (Task 6); `ClientKindBadge`, `ActiveBadge`, `OAuthClientActivationDialog`, `OAuthClientDeleteDialog` (Task 8); `prefetchOAuthClient`, `getOAuthClientCached` (Task 4).
- Produces: `OAuthClientDetail({ id }: { id: string })`.

- [ ] **Step 1: Write the failing detail test**

```tsx
import type { ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { updateOAuthClient } from "@/actions/oauth-clients";
import { oauthClientKeys } from "@/features/oauth-clients/query-keys";
import { serviceAccountKeys } from "@/features/service-accounts/query-keys";

vi.mock("@/actions/oauth-clients", () => ({
  listOAuthClients: vi.fn(),
  getOAuthClient: vi.fn(),
  createOAuthClient: vi.fn(),
  updateOAuthClient: vi.fn(async () => ({ success: true, data: {} })),
  deleteOAuthClient: vi.fn(),
  setOAuthClientActive: vi.fn(),
}));
vi.mock("@/actions/service-accounts", () => ({
  listServiceAccounts: vi.fn(),
  setServiceAccountActive: vi.fn(),
}));
const APPS = { data: [] };
vi.mock("@/features/applications/use-applications", () => ({ useApplications: () => APPS }));

import { OAuthClientDetail } from "@/features/oauth-clients/components/oauth-client-detail";

const client = {
  id: "c1",
  clientId: "etl-runner-m2m",
  clientName: "Nightly ETL",
  active: true,
  requirePkce: true,
  accessTokenTtl: 180,
  refreshTokenTtl: 86400,
  authorizationCodeTtl: 60,
  scopes: [],
  redirectUris: [],
  postLogoutRedirectUris: ["https://keep.me/"],
  grantTypes: ["client_credentials"],
};

function renderWith(accounts: unknown[]) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } } });
  qc.setQueryData(oauthClientKeys.detail("c1"), client);
  qc.setQueryData(serviceAccountKeys.list(), accounts);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  render(<OAuthClientDetail id="c1" />, { wrapper });
}

beforeEach(() => vi.clearAllMocks());

describe("OAuthClientDetail", () => {
  it("shows humanised TTLs and the locked secret", () => {
    renderWith([]);
    expect(screen.getByText("= 3 minutos")).toBeInTheDocument();
    expect(screen.getByText("Mostrado apenas uma vez, no registo")).toBeInTheDocument();
  });

  it("shows the save bar only when dirty, and saves the full request", async () => {
    renderWith([]);
    expect(screen.queryByRole("region", { name: "Alterações por guardar" })).not.toBeInTheDocument();
    const name = screen.getByLabelText(/^Nome/);
    await userEvent.clear(name);
    await userEvent.type(name, "Renamed");
    await userEvent.click(await screen.findByRole("button", { name: "Guardar alterações" }));
    expect(updateOAuthClient).toHaveBeenCalledWith(
      "c1",
      expect.objectContaining({
        clientId: "etl-runner-m2m",
        clientName: "Renamed",
        requirePkce: true,
        postLogoutRedirectUris: ["https://keep.me/"],
      }),
    );
  });

  it("locks client_credentials and blocks delete when a service account is linked", () => {
    renderWith([{ id: "sa1", name: "Nightly Invoice ETL", oauthClientId: "c1" }]);
    expect(screen.getByRole("checkbox", { name: /client_credentials/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Eliminar" })).toBeDisabled();
    expect(screen.getByText(/Remova primeiro a conta de serviço «Nightly Invoice ETL»/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/__tests__/oauth-clients/components/oauth-client-detail.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `oauth-client-detail.tsx`**

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Alert,
  AlertDescription,
  Button,
  Form,
  IGRPIcon,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import { type Resolver, useForm } from "react-hook-form";

import { UnsavedChangesBar } from "@/components/unsaved-changes-bar";
import { useLinkedServiceAccount } from "@/features/service-accounts/use-service-accounts";
import { ROUTES } from "@/lib/constants";

import {
  oauthClientFormSchema,
  type OAuthClientFormValues,
  toFormValues,
  toUpdateRequest,
} from "../oauth-client-schemas";
import { useOAuthClient, useUpdateOAuthClient } from "../use-oauth-clients";
import { OAuthClientActivationDialog } from "./oauth-client-activation-dialog";
import { ActiveBadge, ClientKindBadge } from "./oauth-client-badges";
import { OAuthClientDeleteDialog } from "./oauth-client-delete-dialog";
import { OAuthClientFormSections } from "./oauth-client-form-sections";

const FORM_ID = "oauth-client-edit";

export function OAuthClientDetail({ id }: { id: string }) {
  const router = useRouter();
  const { igrpToast } = useIGRPToast();
  const { data: client } = useOAuthClient(id);
  const linked = useLinkedServiceAccount(id);
  const update = useUpdateOAuthClient();
  const [dialog, setDialog] = useState<"none" | "activation" | "delete">("none");

  const form = useForm<OAuthClientFormValues>({
    resolver: zodResolver(oauthClientFormSchema) as Resolver<OAuthClientFormValues>,
    defaultValues: client ? toFormValues(client) : undefined,
    mode: "onBlur",
  });

  // Re-seed after a save/refetch so the form's "clean" state matches the server.
  useEffect(() => {
    if (client) form.reset(toFormValues(client));
  }, [client, form]);

  // Leaving with unsaved edits asks first (spec §4.5).
  const isDirty = form.formState.isDirty;
  useEffect(() => {
    if (!isDirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  if (!client) return null; // page-critical data is prefetched; error.tsx covers failure

  async function onSubmit(values: OAuthClientFormValues) {
    if (!client) return;
    const result = await update.mutateAsync({ id, request: toUpdateRequest(client, values) });
    if (!result.success) {
      igrpToast({ type: "error", title: "Não foi possível guardar", description: result.error });
      return;
    }
    igrpToast({ type: "success", title: "Alterações guardadas", description: client.clientName || client.clientId });
  }

  // Unknown link state fails safe: treat as linked for delete.
  const deleteBlockedReason = linked.account
    ? `Remova primeiro a conta de serviço «${linked.account.name}».`
    : linked.isError || linked.isLoading
      ? "Não foi possível verificar se existe uma conta de serviço."
      : null;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center gap-4">
        <div className="flex size-13 items-center justify-center rounded-xl bg-info-subtle text-info-subtle-foreground">
          <IGRPIcon iconName="KeyRound" className="size-6" aria-hidden="true" />
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <h2 className="text-2xl font-semibold tracking-tight">{client.clientName || client.clientId}</h2>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <ClientKindBadge grantTypes={client.grantTypes} />
            <span>
              Client ID <span className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-foreground">{client.clientId}</span>
            </span>
            <ActiveBadge active={client.active} />
          </div>
        </div>
      </header>

      {linked.duplicate ? (
        <Alert variant="destructive">
          <AlertDescription>
            Este cliente tem mais do que uma conta de serviço associada. Isto não devia acontecer — contacte o suporte.
          </AlertDescription>
        </Alert>
      ) : null}

      <Form {...form}>
        <form id={FORM_ID} onSubmit={form.handleSubmit(onSubmit)} noValidate className="rounded-xl border border-border bg-card">
          <OAuthClientFormSections
            mode="edit"
            lockClientCredentials={linked.account ? { accountName: linked.account.name } : undefined}
          />
        </form>
      </Form>

      <section aria-labelledby="danger-zone" className="flex flex-col gap-3">
        <h3 id="danger-zone" className="text-base font-semibold text-destructive">Zona de perigo</h3>
        <div className="flex flex-col divide-y divide-destructive/20 rounded-xl border border-destructive/30 bg-card">
          <div className="flex items-center gap-6 p-5">
            <div className="flex flex-1 flex-col gap-1">
              <span className="font-medium">{client.active ? "Desativar cliente" : "Ativar cliente"}</span>
              <span className="text-sm text-muted-foreground">
                {client.active
                  ? linked.account
                    ? `Desativa também a conta de serviço «${linked.account.name}». A identidade deixa de conseguir autenticar.`
                    : "As aplicações que usam este cliente deixam de conseguir autenticar. Pode reativá-lo depois."
                  : "O cliente volta a poder pedir tokens."}
              </span>
            </div>
            <Button variant={client.active ? "outline" : "default"} className={client.active ? "text-destructive" : undefined} onClick={() => setDialog("activation")}>
              {client.active ? "Desativar" : "Ativar"}
            </Button>
          </div>
          <div className="flex items-center gap-6 p-5">
            <div className="flex flex-1 flex-col gap-1">
              <span className="font-medium">Eliminar cliente</span>
              <span className="text-sm text-muted-foreground">
                {deleteBlockedReason ?? "Remove o registo. As credenciais deixam de funcionar de imediato e não é possível recuperá-lo."}
              </span>
            </div>
            <Button variant="destructive" disabled={!!deleteBlockedReason} onClick={() => setDialog("delete")}>
              Eliminar
            </Button>
          </div>
        </div>
      </section>

      {isDirty ? (
        <UnsavedChangesBar formId={FORM_ID} isSaving={update.isPending} onDiscard={() => form.reset(toFormValues(client))} />
      ) : null}

      {dialog === "activation" ? (
        <OAuthClientActivationDialog client={client} linkedAccount={linked.account} open onOpenChange={(o) => !o && setDialog("none")} />
      ) : null}
      {dialog === "delete" ? (
        <OAuthClientDeleteDialog
          client={client}
          open
          onOpenChange={(o) => !o && setDialog("none")}
          onDeleted={() => router.push(ROUTES.OAUTH_CLIENTS)}
        />
      ) : null}
    </div>
  );
}
```

> The danger-zone uses `divide-y` + tokenised borders — verify `pnpm check:ui` passes; if `no-hr-divider` flags `divide-y`, use `<Separator />` between rows. `border-destructive/30` is a semantic token with alpha, not a raw colour.

- [ ] **Step 4: Route files**

`clients/[id]/page.tsx`:

```tsx
import type { Metadata } from "next";

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { OAuthClientDetail } from "@/features/oauth-clients/components/oauth-client-detail";
import { getOAuthClientCached, prefetchOAuthClient } from "@/features/oauth-clients/prefetch";
import { getQueryClient } from "@/providers/query-client.server";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const result = await getOAuthClientCached(id);
  const title = result.success ? result.data.clientName || result.data.clientId : "Cliente OAuth";
  return { title: `${title} · Clientes OAuth` };
}

export default async function OAuthClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const queryClient = getQueryClient();
  await prefetchOAuthClient(queryClient, id);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <OAuthClientDetail id={id} />
    </HydrationBoundary>
  );
}
```

`clients/[id]/loading.tsx`:

```tsx
import { Skeleton } from "@igrp/igrp-framework-react-design-system";

export default function OAuthClientDetailLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="A carregar cliente OAuth">
      <div className="flex items-center gap-4">
        <Skeleton className="size-13 rounded-xl" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-80" />
        </div>
      </div>
      <Skeleton className="h-96 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  );
}
```

`clients/[id]/error.tsx` — copy `src/app/(igrp)/(home)/settings/applications/[code]/error.tsx` verbatim, renaming the component to `OAuthClientDetailError`, the log tag to `"[oauth-client] segment error"`, and the title to `"Não foi possível carregar o cliente OAuth."`.

- [ ] **Step 5: Run the test**

Run: `npx vitest run src/__tests__/oauth-clients/components/oauth-client-detail.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/oauth-clients/components/oauth-client-detail.tsx "src/app/(igrp)/(home)/settings/accounts/clients/[id]" src/__tests__/oauth-clients/components/oauth-client-detail.test.tsx
git commit -m "feat(oauth-clients): add client settings page with in-place edit and danger zone"
```

---

### Task 10: Full verification and manual check

**Files:** none new.

- [ ] **Step 1: Full test suite**

Run: `pnpm test`
Expected: all files pass (baseline was 48 files / 247 tests; expect ~57 files now). If the run dies mid-way (worker OOM), run new files one by one with `npx vitest run <file>` — a crashed worker hides later failures.

- [ ] **Step 2: Typecheck, UI rules, Biome**

Run: `pnpm typecheck && pnpm check:ui && npx biome check`
Expected: 0 errors, 0 strict violations, clean. Fix formatting with `npx biome check --write <changed files>` only, then re-run `npx biome check`.

- [ ] **Step 3: Manual walk-through in the dev server** (preview tools; `.claude/launch.json` dev entry)

Check, against the design canvas:
1. `/settings` → the "Contas e Serviços" card is active and opens `/settings/accounts`, which lands on `/settings/accounts/clients`.
2. List shows Tipo, Grant types, Aplicação, Conta de serviço, Estado; filters work; the menu on a linked client shows **Eliminar** disabled with the reason.
3. Register a machine client (untick `authorization_code` → Redirect URIs disappears) → secret pane; Concluir disabled until the checkbox; Esc asks "Fechar mesmo assim?".
4. Register with a duplicate client ID → error under Client ID, no toast.
5. Detail: edit Nome → save bar appears → Guardar → toast; Descartar resets. TTL hints update as you type.
6. Deactivate an unlinked client → badge flips. Delete an unlinked client → type the client ID → redirected to the list.
7. `/settings/accounts/services` shows the honest placeholder.

- [ ] **Step 4: Commit any fixes, then report**

```bash
git status --short
```

If clean, the plan is complete. Plan 2 (Service Accounts pages: list, detail, wizard, delete-with-client, and the client detail's "Conta de serviço" section + list links) is written next against the same spec.
