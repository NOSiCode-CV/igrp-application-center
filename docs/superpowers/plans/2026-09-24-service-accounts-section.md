# Service Accounts Section Implementation Plan (Plan 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the **Service Accounts** half of `/settings/accounts`: a list, a detail page where roles and direct permissions are managed, a three-step create wizard (existing or new OAuth Client, with one-time secret disclosure), delete-with-client, and the OAuth Client pages' links back to their Service Account.

**Architecture:** Builds on Plan 1 (`2026-09-23-oauth-clients-section.md`, fully landed). Server actions in `src/actions/service-accounts.ts` gain CRUD plus the composite `createServiceAccountWithNewClient` and `deleteServiceAccount(id, { alsoDeleteClient })`. Every Service Account write re-reads fresh state on the server and resolves `applicationId` from the linked OAuth Client, so the browser never builds a full `ServiceAccountRequestDTO`. The `src/features/service-accounts/` slice grows pure helpers, a wizard reducer, hooks and components. Pages under `src/app/(igrp)/(home)/settings/accounts/services/` prefetch on the server and hydrate.

**Tech Stack:** Next.js 15 App Router (typedRoutes on), React 19, TypeScript, `@tanstack/react-query` v5, `react-hook-form` + `@hookform/resolvers/zod` + Zod v4, `@igrp/igrp-framework-react-design-system`, `@igrp/platform-access-management-client-ts@0.2.0-beta.17`, Vitest + Testing Library (jsdom), Biome.

**Spec:** [`docs/todos/CLIENT_AND_SERVICE_ACCOUNT_MANAGEMENT_SPEC.md`](../../todos/CLIENT_AND_SERVICE_ACCOUNT_MANAGEMENT_SPEC.md) §1, §3, §5, §6 · Glossary: [`CONTEXT.md`](../../../CONTEXT.md) · Open backend questions: [`ACCOUNTS_BACKEND_REQUESTS.md`](../../todos/ACCOUNTS_BACKEND_REQUESTS.md) · Mockups: [Accounts design canvas](https://claude.ai/artifact/Myg6WjfKJdYPXi72RSDpHA) (boards *Contas de serviço — lista*, *Nova conta de serviço — passo 3*, *Conta de serviço — detalhe*, *Eliminar conta*). Where the canvas and this plan disagree on copy or layout, the canvas wins.

## Global Constraints

Everything in Plan 1's Global Constraints still applies (pt-PT copy with no exclamation marks, the **OAuth Client** term, secrets never enter the React Query cache, no UI permission gating, design-system rules from `pnpm check:ui`, the import conventions, test conventions, gates, and no `Co-Authored-By:` trailer). In addition:

- Routes: list `/settings/accounts/services`, detail `/settings/accounts/services/[id]`, wizard `/settings/accounts/services/new` (`?oauthClientId=<uuid>` deep link jumps to step 2).
- **A Service Account never has its own application** (spec §1). No form, hook or component sends `applicationId` for a Service Account. Server actions always set it from the linked OAuth Client (`ServiceAccountInput = Omit<ServiceAccountRequestDTO, "applicationId">`).
- **PUT replaces `roleIds` / `permissionIds` wholesale.** Identity and access edits go through `updateServiceAccountIdentity` / `setServiceAccountAccess`, which GET the account and its client on the server, then PUT the full request. Mutations are **not optimistic**: controls disable while pending and the detail refetches on success. (Spec §5.5 mentions optimistic updates; server-side fresh reads make them unnecessary for correctness. This is a deliberate simplification.)
- **Direct permission id ↔ name pairing is positional** (`ACCOUNTS_BACKEND_REQUESTS.md` §1, unanswered). `pairDirectPermissions` pairs `permissionIds[i]` with `permissionNames[i]` only when the two lists have the same length. Otherwise names are shown read-only and removal is disabled with a reason. Keep that comment next to the helper so it can be removed once the backend answers.
- Role details (code, description, department, permissions) come from `getRoleById` per role (`useRoleDetails`). Effective Permissions = union of each role's `permissions` and the account's `permissionNames` (spec §5.4/§5.5, backend gap §7.5).
- Field limits until the backend answers (`ACCOUNTS_BACKEND_REQUESTS.md` §7): `name` 1–255, `description` ≤ 255.
- Deactivating a Service Account deactivates its OAuth Client too (existing `setServiceAccountActive`, client → SA; reactivation SA → client). All copy says so plainly.
- Delete: type-the-name-to-confirm, with **"Eliminar também o cliente OAuth `<clientId>`" checked by default**. The confirm label follows the checkbox ("Eliminar conta e cliente" / "Eliminar conta").
- The role and permission pickers are department-scoped: the admin picks a department, then ticks items. Confirming replaces the selection **within that department only** (`mergeScopedSelection`). They use a simple checkbox list rather than `SelectableDataTable` (lists per department are short).
- Tests that mock `@/actions/service-accounts` must list every export the code under test reaches. Vitest throws `No "<name>" export is defined on the mock` when one is missing. Existing Plan 1 tests keep their mocks unless they start failing for that reason.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/features/service-accounts/lib/service-account-utils.ts` | Pure helpers: available clients, access summary, effective permissions, scoped merge, id/name pairing, grouping by department |
| `src/features/service-accounts/service-account-schemas.ts` | Zod identity schema, defaults, machine-client form defaults |
| `src/actions/service-accounts.ts` (modify) | Adds get/create/updateIdentity/setAccess/createWithNewClient/delete |
| `src/features/service-accounts/{query-keys,query-options,prefetch,use-service-accounts,use-role-details}.ts` | Data layer |
| `src/components/dialog-delete.tsx` (modify) | Optional `children` slot |
| `src/features/service-accounts/components/service-account-{delete,activation}-dialog.tsx` | Shared dialogs (list + detail) |
| `src/features/service-accounts/components/service-account-{columns,toolbar,list}.tsx` | List page |
| `src/features/service-accounts/components/service-account-detail.tsx` + `service-account-{client,identity}-card.tsx` | Detail shell and side column |
| `src/features/service-accounts/components/{scoped-picker-dialog,role-picker-dialog,permission-picker-dialog,effective-permissions-card,service-account-roles-section,service-account-permissions-section}.tsx` | Access management |
| `src/features/service-accounts/lib/wizard-state.ts` | Pure wizard reducer |
| `src/features/service-accounts/components/wizard/*` | Wizard UI and result screens |
| `src/features/oauth-clients/components/oauth-client-form-sections.tsx` (modify) | `grantTypesFixed` prop for the wizard's new-client form |
| `src/features/oauth-clients/components/oauth-client-service-account-section.tsx` + detail/columns (modify) | Client ↔ account links |
| `src/app/(igrp)/(home)/settings/accounts/services/**` | Route shells |

---

### Task 1: Pure helpers and identity schema

**Files:**
- Create: `src/features/service-accounts/lib/service-account-utils.ts`
- Create: `src/features/service-accounts/service-account-schemas.ts`
- Test: `src/__tests__/service-accounts/lib/service-account-utils.test.ts`
- Test: `src/__tests__/service-accounts/service-account-schemas.test.ts`

**Interfaces:**
- Produces:
  - `getAvailableOAuthClients(clients: readonly OAuthClientDTO[] | undefined, accounts: readonly ServiceAccountDTO[] | undefined): OAuthClientDTO[]`
  - `formatAccessSummary(roleCount: number, directCount: number): string` → `"2 perfis · 3 diretas"`
  - `type EffectivePermission = { name: string; roleCodes: string[]; direct: boolean }`
  - `computeEffectivePermissions(roles: readonly Pick<RoleDTO, "code" | "permissions">[], directNames: readonly string[]): { fromRoles: number; direct: number; total: number; items: EffectivePermission[] }`
  - `mergeScopedSelection<T>(current: readonly T[], scope: readonly T[], selected: readonly T[], key?: (item: T) => string | number): T[]`
  - `type DirectPermission = { id: number | null; name: string }`; `pairDirectPermissions(account: Pick<ServiceAccountDTO, "permissionIds" | "permissionNames">): { items: DirectPermission[]; reliable: boolean }`
  - `groupRolesByDepartment(roles: readonly RoleDTO[]): { departmentCode: string; roles: RoleDTO[] }[]`
  - `serviceAccountIdentitySchema`, `type ServiceAccountIdentityValues`, `emptyIdentityValues()`, `machineClientFormValues(): OAuthClientFormValues`

- [ ] **Step 1: Write the failing utils test**

`src/__tests__/service-accounts/lib/service-account-utils.test.ts`:

```ts
import type {
  OAuthClientDTO,
  RoleDTO,
  ServiceAccountDTO,
} from "@igrp/platform-access-management-client-ts";
import { describe, expect, it } from "vitest";

import {
  computeEffectivePermissions,
  formatAccessSummary,
  getAvailableOAuthClients,
  groupRolesByDepartment,
  mergeScopedSelection,
  pairDirectPermissions,
} from "@/features/service-accounts/lib/service-account-utils";

const client = (id: string, grantTypes: string[]) =>
  ({ id, clientId: id, grantTypes }) as OAuthClientDTO;
const account = (oauthClientId: string) =>
  ({ id: `sa-${oauthClientId}`, oauthClientId }) as ServiceAccountDTO;

describe("getAvailableOAuthClients", () => {
  it("keeps client_credentials clients with no linked account", () => {
    const clients = [
      client("a", ["client_credentials"]),
      client("b", ["client_credentials"]),
      client("c", ["authorization_code"]),
    ];
    expect(
      getAvailableOAuthClients(clients, [account("b")]).map((c) => c.id),
    ).toEqual(["a"]);
  });
  it("handles missing data", () => {
    expect(getAvailableOAuthClients(undefined, undefined)).toEqual([]);
  });
});

describe("formatAccessSummary", () => {
  it.each([
    [0, 0, "0 perfis · 0 diretas"],
    [1, 1, "1 perfil · 1 direta"],
    [2, 3, "2 perfis · 3 diretas"],
  ])("formats %i roles and %i direct", (r, d, text) =>
    expect(formatAccessSummary(r, d)).toBe(text),
  );
});

describe("computeEffectivePermissions", () => {
  it("unions role and direct permissions, marking sources", () => {
    const r = computeEffectivePermissions(
      [
        { code: "reader", permissions: ["inv.read", "inv.list"] },
        { code: "exporter", permissions: ["inv.read", "inv.export"] },
      ],
      ["inv.approve", "inv.read"],
    );
    expect(r).toMatchObject({ fromRoles: 3, direct: 2, total: 4 });
    expect(r.items).toEqual([
      { name: "inv.approve", roleCodes: [], direct: true },
      { name: "inv.export", roleCodes: ["exporter"], direct: false },
      { name: "inv.list", roleCodes: ["reader"], direct: false },
      { name: "inv.read", roleCodes: ["reader", "exporter"], direct: true },
    ]);
  });
  it("tolerates roles without a permissions list", () => {
    const r = computeEffectivePermissions(
      [{ code: "x" } as RoleDTO],
      [],
    );
    expect(r.total).toBe(0);
  });
});

describe("mergeScopedSelection", () => {
  it("replaces only the items inside the scope", () => {
    expect(mergeScopedSelection([1, 2, 10], [1, 2, 3], [2, 3])).toEqual([
      10, 2, 3,
    ]);
  });
  it("never duplicates", () => {
    expect(mergeScopedSelection([5], [1], [1, 1, 5])).toEqual([5, 1]);
  });
  it("uses a key for objects", () => {
    const merged = mergeScopedSelection(
      [{ id: 1 }, { id: 9 }],
      [{ id: 1 }, { id: 2 }],
      [{ id: 2 }],
      (i) => i.id,
    );
    expect(merged.map((i) => i.id)).toEqual([9, 2]);
  });
});

describe("pairDirectPermissions", () => {
  it("pairs by position when both lists line up", () => {
    expect(
      pairDirectPermissions({ permissionIds: [4, 7], permissionNames: ["a", "b"] }),
    ).toEqual({
      reliable: true,
      items: [
        { id: 4, name: "a" },
        { id: 7, name: "b" },
      ],
    });
  });
  it("falls back to names without ids when lengths differ", () => {
    expect(
      pairDirectPermissions({ permissionIds: [4], permissionNames: ["a", "b"] }),
    ).toEqual({
      reliable: false,
      items: [
        { id: null, name: "a" },
        { id: null, name: "b" },
      ],
    });
  });
  it("handles missing lists", () => {
    expect(pairDirectPermissions({})).toEqual({ reliable: true, items: [] });
  });
});

describe("groupRolesByDepartment", () => {
  it("groups and sorts by department, then role code", () => {
    const role = (code: string, departmentCode: string) =>
      ({ id: code.length, code, departmentCode, permissions: [] }) as unknown as RoleDTO;
    const groups = groupRolesByDepartment([
      role("b", "INV"),
      role("z", "ADM"),
      role("a", "INV"),
    ]);
    expect(
      groups.map((g) => [g.departmentCode, g.roles.map((r) => r.code)]),
    ).toEqual([
      ["ADM", ["z"]],
      ["INV", ["a", "b"]],
    ]);
  });
});
```

- [ ] **Step 2: Write the failing schema test**

`src/__tests__/service-accounts/service-account-schemas.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { oauthClientFormSchema } from "@/features/oauth-clients/oauth-client-schemas";
import {
  emptyIdentityValues,
  machineClientFormValues,
  serviceAccountIdentitySchema,
} from "@/features/service-accounts/service-account-schemas";

function issues(values: unknown) {
  const r = serviceAccountIdentitySchema.safeParse(values);
  return r.success ? [] : r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
}

describe("serviceAccountIdentitySchema", () => {
  it("requires a name", () => {
    expect(issues(emptyIdentityValues())).toEqual(["name: Indique o nome."]);
  });
  it("caps name and description at 255", () => {
    expect(
      issues({ ...emptyIdentityValues(), name: "x".repeat(256), description: "y".repeat(256) }),
    ).toEqual(["name: Até 255 caracteres.", "description: Até 255 caracteres."]);
  });
  it("accepts a valid identity", () => {
    expect(issues({ name: "Nightly", description: "", active: true })).toEqual([]);
  });
});

describe("machineClientFormValues", () => {
  it("is a client_credentials-only client with no scopes", () => {
    const v = machineClientFormValues();
    expect(v.grantTypes).toEqual(["client_credentials"]);
    expect(v.scopes).toEqual([]);
  });
  it("validates once clientId and name are filled", () => {
    const r = oauthClientFormSchema.safeParse({
      ...machineClientFormValues(),
      clientId: "nightly-etl",
      clientName: "Nightly ETL",
    });
    expect(r.success).toBe(true);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/service-accounts`
Expected: FAIL — cannot resolve `@/features/service-accounts/lib/service-account-utils`.

- [ ] **Step 4: Implement `service-account-utils.ts`**

```ts
import type {
  OAuthClientDTO,
  RoleDTO,
  ServiceAccountDTO,
} from "@igrp/platform-access-management-client-ts";

/** client_credentials clients with no Service Account yet (spec §5.3). */
export function getAvailableOAuthClients(
  clients: readonly OAuthClientDTO[] | undefined,
  accounts: readonly ServiceAccountDTO[] | undefined,
): OAuthClientDTO[] {
  const linked = new Set((accounts ?? []).map((a) => a.oauthClientId));
  return (clients ?? []).filter(
    (c) => c.grantTypes.includes("client_credentials") && !linked.has(c.id),
  );
}

export function formatAccessSummary(
  roleCount: number,
  directCount: number,
): string {
  const roles = `${roleCount} ${roleCount === 1 ? "perfil" : "perfis"}`;
  const direct = `${directCount} ${directCount === 1 ? "direta" : "diretas"}`;
  return `${roles} · ${direct}`;
}

export type EffectivePermission = {
  name: string;
  roleCodes: string[];
  direct: boolean;
};

/** Union of role-inherited and direct permissions (CONTEXT.md → Effective Permissions). */
export function computeEffectivePermissions(
  roles: readonly Pick<RoleDTO, "code" | "permissions">[],
  directNames: readonly string[],
) {
  const byName = new Map<string, EffectivePermission>();
  const entry = (name: string) => {
    let found = byName.get(name);
    if (!found) {
      found = { name, roleCodes: [], direct: false };
      byName.set(name, found);
    }
    return found;
  };
  for (const role of roles) {
    for (const name of role.permissions ?? []) {
      const e = entry(name);
      if (!e.roleCodes.includes(role.code)) e.roleCodes.push(role.code);
    }
  }
  for (const name of directNames) entry(name).direct = true;
  const items = [...byName.values()].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  return {
    fromRoles: items.filter((i) => i.roleCodes.length > 0).length,
    direct: new Set(directNames).size,
    total: items.length,
    items,
  };
}

/**
 * A department-scoped picker only sees its own department's items. Replace
 * the selection inside `scope`, keep everything outside it, never duplicate.
 */
export function mergeScopedSelection<T>(
  current: readonly T[],
  scope: readonly T[],
  selected: readonly T[],
  key: (item: T) => string | number = (item) => item as unknown as string | number,
): T[] {
  const scopeKeys = new Set(scope.map(key));
  const result = current.filter((item) => !scopeKeys.has(key(item)));
  const seen = new Set(result.map(key));
  for (const item of selected) {
    const k = key(item);
    if (seen.has(k)) continue;
    seen.add(k);
    result.push(item);
  }
  return result;
}

export type DirectPermission = { id: number | null; name: string };

/**
 * ASSUMPTION — ACCOUNTS_BACKEND_REQUESTS.md §1 is unanswered: the DTO carries
 * `permissionIds` and `permissionNames` as two separate sets and nothing
 * guarantees their order matches. We pair by position only when the lengths
 * agree; otherwise names are shown without ids and removal is disabled.
 * Replace with the backend's `{ id, name }` pairs once they exist.
 */
export function pairDirectPermissions(
  account: Pick<ServiceAccountDTO, "permissionIds" | "permissionNames">,
): { items: DirectPermission[]; reliable: boolean } {
  const ids = account.permissionIds ?? [];
  const names = account.permissionNames ?? [];
  if (ids.length !== names.length) {
    return { reliable: false, items: names.map((name) => ({ id: null, name })) };
  }
  return {
    reliable: true,
    items: ids.map((id, i) => ({ id, name: names[i] })),
  };
}

export function groupRolesByDepartment(roles: readonly RoleDTO[]) {
  const groups = new Map<string, RoleDTO[]>();
  for (const role of roles) {
    const list = groups.get(role.departmentCode) ?? [];
    list.push(role);
    groups.set(role.departmentCode, list);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([departmentCode, list]) => ({
      departmentCode,
      roles: [...list].sort((a, b) => a.code.localeCompare(b.code)),
    }));
}
```

- [ ] **Step 5: Implement `service-account-schemas.ts`**

```ts
import { z } from "zod";

import {
  emptyOAuthClientFormValues,
  type OAuthClientFormValues,
} from "@/features/oauth-clients/oauth-client-schemas";

/** Limits are provisional — ACCOUNTS_BACKEND_REQUESTS.md §7. */
export const serviceAccountIdentitySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Indique o nome.")
    .max(255, "Até 255 caracteres."),
  description: z.string().trim().max(255, "Até 255 caracteres."),
  active: z.boolean(),
});

export type ServiceAccountIdentityValues = z.infer<
  typeof serviceAccountIdentitySchema
>;

export function emptyIdentityValues(): ServiceAccountIdentityValues {
  return { name: "", description: "", active: true };
}

/** Wizard step 1, "new client": grant types are fixed to client_credentials. */
export function machineClientFormValues(): OAuthClientFormValues {
  return {
    ...emptyOAuthClientFormValues(),
    grantTypes: ["client_credentials"],
    scopes: [],
  };
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/service-accounts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/features/service-accounts/lib/service-account-utils.ts src/features/service-accounts/service-account-schemas.ts src/__tests__/service-accounts
git commit -m "feat(service-accounts): add access helpers and identity schema"
```

---

### Task 2: Server actions — CRUD and composites

**Files:**
- Modify: `src/actions/service-accounts.ts`
- Test: `src/__tests__/actions/service-accounts-crud.test.ts`

**Interfaces:**
- Consumes: `toServiceAccountRequest` (Plan 1), `createOAuthClient` + `OAuthClientInput` (Plan 1), `getClientAccess`, `toActionError`.
- Produces (all exported from `@/actions/service-accounts`):
  - `type ServiceAccountInput = Omit<ServiceAccountRequestDTO, "applicationId">`
  - `type ServiceAccountIdentity = { name: string; description?: string }`
  - `type ServiceAccountAccess = { roleIds?: number[]; permissionIds?: number[] }`
  - `getServiceAccount(id: string): Promise<ActionResult<ServiceAccountDTO>>`
  - `createServiceAccount(input: ServiceAccountInput): Promise<ActionResult<ServiceAccountDTO>>`
  - `updateServiceAccountIdentity(id: string, identity: ServiceAccountIdentity): Promise<ActionResult<ServiceAccountDTO>>`
  - `setServiceAccountAccess(id: string, access: ServiceAccountAccess): Promise<ActionResult<ServiceAccountDTO>>`
  - `type CreateWithClientResult = { success: true; data: { client: OAuthClientDTO; account: ServiceAccountDTO } } | { success: false; failedStep: "client"; error: string; status?: number } | { success: false; failedStep: "serviceAccount"; error: string; status?: number; client: OAuthClientDTO }`
  - `createServiceAccountWithNewClient(clientInput: OAuthClientInput, account: Omit<ServiceAccountInput, "oauthClientId">): Promise<CreateWithClientResult>`
  - `type DeleteServiceAccountResult = { success: true; data: null } | { success: false; failedStep: ActivationStep; error: string; status?: number; oauthClientId?: string }`
  - `deleteServiceAccount(id: string, options: { alsoDeleteClient: boolean }): Promise<DeleteServiceAccountResult>`

- [ ] **Step 1: Write the failing test**

`src/__tests__/actions/service-accounts-crud.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const oauthClients = {
  getOAuthClient: vi.fn(),
  createOAuthClient: vi.fn(),
  deleteOAuthClient: vi.fn(),
};
const serviceAccounts = {
  getServiceAccount: vi.fn(),
  createServiceAccount: vi.fn(),
  updateServiceAccount: vi.fn(),
  deleteServiceAccount: vi.fn(),
};
const applications = { getApplications: vi.fn() };

vi.mock("@/actions/access-client", () => ({
  getClientAccess: vi.fn(async () => ({
    oauthClients,
    serviceAccounts,
    applications,
  })),
}));
vi.mock("@/lib/auth", () => ({
  serverSession: vi.fn(async () => ({ accessToken: "t" })),
}));

import {
  createServiceAccount,
  createServiceAccountWithNewClient,
  deleteServiceAccount,
  setServiceAccountAccess,
  updateServiceAccountIdentity,
} from "@/actions/service-accounts";

const sa = {
  id: "sa1",
  name: "Nightly",
  description: "old",
  active: true,
  oauthClientId: "c1",
  clientId: "etl",
  applicationId: 99, // drifted — must be healed from the client
  roleIds: [1, 2],
  permissionIds: [9],
};
const oauth = { id: "c1", clientId: "etl", applicationId: 7, grantTypes: ["client_credentials"] };
const clientInput = {
  clientId: "etl",
  clientName: "ETL",
  scopes: [],
  grantTypes: ["client_credentials" as const],
};

beforeEach(() => {
  vi.clearAllMocks();
  serviceAccounts.getServiceAccount.mockResolvedValue({ data: sa });
  oauthClients.getOAuthClient.mockResolvedValue({ data: oauth });
  serviceAccounts.updateServiceAccount.mockImplementation(async (_id, req) => ({
    data: { ...sa, ...req },
  }));
});

describe("createServiceAccount", () => {
  it("takes applicationId from the linked client", async () => {
    serviceAccounts.createServiceAccount.mockResolvedValue({ data: sa });
    await createServiceAccount({ name: "N", oauthClientId: "c1", roleIds: [1] });
    expect(serviceAccounts.createServiceAccount).toHaveBeenCalledWith({
      name: "N",
      oauthClientId: "c1",
      roleIds: [1],
      applicationId: 7,
    });
  });
  it("reports failures", async () => {
    serviceAccounts.createServiceAccount.mockRejectedValue({ status: 409, title: "Conflict" });
    expect(await createServiceAccount({ name: "N", oauthClientId: "c1" })).toMatchObject({
      success: false,
      status: 409,
    });
  });
});

describe("updateServiceAccountIdentity", () => {
  it("PUTs the fresh account with only name/description changed", async () => {
    const r = await updateServiceAccountIdentity("sa1", { name: "Renamed", description: undefined });
    expect(serviceAccounts.updateServiceAccount).toHaveBeenCalledWith("sa1", {
      name: "Renamed",
      description: undefined,
      active: true,
      oauthClientId: "c1",
      applicationId: 7,
      roleIds: [1, 2],
      permissionIds: [9],
    });
    expect(r.success).toBe(true);
  });
});

describe("setServiceAccountAccess", () => {
  it("replaces only the sets it is given", async () => {
    await setServiceAccountAccess("sa1", { roleIds: [2] });
    expect(serviceAccounts.updateServiceAccount).toHaveBeenCalledWith(
      "sa1",
      expect.objectContaining({ roleIds: [2], permissionIds: [9], applicationId: 7 }),
    );
  });
});

describe("createServiceAccountWithNewClient", () => {
  it("creates the client, then the account on it", async () => {
    oauthClients.createOAuthClient.mockResolvedValue({
      data: { ...oauth, clientSecret: "s3cret" },
    });
    serviceAccounts.createServiceAccount.mockResolvedValue({ data: sa });
    const r = await createServiceAccountWithNewClient(clientInput, { name: "N", roleIds: [1] });
    expect(serviceAccounts.createServiceAccount).toHaveBeenCalledWith({
      name: "N",
      roleIds: [1],
      oauthClientId: "c1",
      applicationId: 7,
    });
    expect(r.success && r.data.client.clientSecret).toBe("s3cret");
  });

  it("refuses a client without client_credentials", async () => {
    const r = await createServiceAccountWithNewClient(
      { ...clientInput, grantTypes: ["authorization_code"] },
      { name: "N" },
    );
    expect(r).toMatchObject({ success: false, failedStep: "client", status: 422 });
    expect(oauthClients.createOAuthClient).not.toHaveBeenCalled();
  });

  it("reports a client failure with its status", async () => {
    oauthClients.createOAuthClient.mockRejectedValue({ status: 409, title: "Conflict" });
    const r = await createServiceAccountWithNewClient(clientInput, { name: "N" });
    expect(r).toMatchObject({ success: false, failedStep: "client", status: 409 });
    expect(serviceAccounts.createServiceAccount).not.toHaveBeenCalled();
  });

  it("returns the created client (with its secret) when the account step fails", async () => {
    oauthClients.createOAuthClient.mockResolvedValue({
      data: { ...oauth, clientSecret: "s3cret" },
    });
    serviceAccounts.createServiceAccount.mockRejectedValue({ status: 500, title: "Boom" });
    const r = await createServiceAccountWithNewClient(clientInput, { name: "N" });
    expect(r).toMatchObject({
      success: false,
      failedStep: "serviceAccount",
      client: { id: "c1", clientSecret: "s3cret" },
    });
  });
});

describe("deleteServiceAccount", () => {
  it("deletes the account, then the client when asked", async () => {
    const order: string[] = [];
    serviceAccounts.deleteServiceAccount.mockImplementation(async () => order.push("sa"));
    oauthClients.deleteOAuthClient.mockImplementation(async () => order.push("client"));
    expect(await deleteServiceAccount("sa1", { alsoDeleteClient: true })).toEqual({
      success: true,
      data: null,
    });
    expect(order).toEqual(["sa", "client"]);
    expect(oauthClients.deleteOAuthClient).toHaveBeenCalledWith("c1");
  });

  it("leaves the client alone when not asked", async () => {
    await deleteServiceAccount("sa1", { alsoDeleteClient: false });
    expect(oauthClients.deleteOAuthClient).not.toHaveBeenCalled();
  });

  it("reports a client-step failure with the client id", async () => {
    oauthClients.deleteOAuthClient.mockRejectedValue({ status: 500, title: "Boom" });
    const r = await deleteServiceAccount("sa1", { alsoDeleteClient: true });
    expect(r).toMatchObject({ success: false, failedStep: "client", oauthClientId: "c1" });
  });

  it("reports an account-step failure", async () => {
    serviceAccounts.deleteServiceAccount.mockRejectedValue({ status: 404, title: "Not found" });
    const r = await deleteServiceAccount("sa1", { alsoDeleteClient: true });
    expect(r).toMatchObject({ success: false, failedStep: "serviceAccount", status: 404 });
    expect(oauthClients.deleteOAuthClient).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/__tests__/actions/service-accounts-crud.test.ts`
Expected: FAIL — `createServiceAccount` is not exported.

- [ ] **Step 3: Implement** — in `src/actions/service-accounts.ts`, replace the import block with:

```ts
"use server";

import type {
  OAuthClientDTO,
  ServiceAccountDTO,
  ServiceAccountRequestDTO,
} from "@igrp/platform-access-management-client-ts";

import {
  type OAuthClientInput,
  withActive,
} from "@/features/oauth-clients/lib/oauth-client-request";
import { toServiceAccountRequest } from "@/features/service-accounts/lib/service-account-request";
import { toActionError } from "@/lib/app-utilities";

import { getClientAccess } from "./access-client";
import { createOAuthClient } from "./oauth-clients";
import type { AccessClient, ActionResult } from "./types";
```

then append after `setServiceAccountActive`:

```ts
/** What the UI sends: never an applicationId — it always comes from the client (spec §1). */
export type ServiceAccountInput = Omit<ServiceAccountRequestDTO, "applicationId">;
export type ServiceAccountIdentity = { name: string; description?: string };
export type ServiceAccountAccess = { roleIds?: number[]; permissionIds?: number[] };

async function applicationOf(client: AccessClient, oauthClientId: string) {
  return (await client.oauthClients.getOAuthClient(oauthClientId)).data
    .applicationId;
}

/** PUT replaces everything: start from a fresh GET, heal applicationId, apply the patch. */
async function putFromFresh(
  client: AccessClient,
  id: string,
  patch: Partial<ServiceAccountRequestDTO>,
) {
  const sa = (await client.serviceAccounts.getServiceAccount(id)).data;
  const applicationId = await applicationOf(client, sa.oauthClientId);
  const result = await client.serviceAccounts.updateServiceAccount(id, {
    ...toServiceAccountRequest(sa),
    applicationId,
    ...patch,
  });
  return result.data;
}

export async function getServiceAccount(
  id: string,
): Promise<ActionResult<ServiceAccountDTO>> {
  const client = await getClientAccess();
  try {
    const result = await client.serviceAccounts.getServiceAccount(id);
    return { success: true, data: result.data };
  } catch (error) {
    console.error("[service-account] Erro ao carregar conta de serviço:", error);
    return { success: false, ...toActionError(error) };
  }
}

export async function createServiceAccount(
  input: ServiceAccountInput,
): Promise<ActionResult<ServiceAccountDTO>> {
  const client = await getClientAccess();
  try {
    const applicationId = await applicationOf(client, input.oauthClientId);
    const result = await client.serviceAccounts.createServiceAccount({
      ...input,
      applicationId,
    });
    return { success: true, data: result.data };
  } catch (error) {
    console.error("[service-account-create] Erro ao criar conta de serviço:", error);
    return { success: false, ...toActionError(error) };
  }
}

export async function updateServiceAccountIdentity(
  id: string,
  identity: ServiceAccountIdentity,
): Promise<ActionResult<ServiceAccountDTO>> {
  const client = await getClientAccess();
  try {
    const data = await putFromFresh(client, id, {
      name: identity.name,
      description: identity.description,
    });
    return { success: true, data };
  } catch (error) {
    console.error("[service-account-identity] Erro ao guardar identidade:", error);
    return { success: false, ...toActionError(error) };
  }
}

export async function setServiceAccountAccess(
  id: string,
  access: ServiceAccountAccess,
): Promise<ActionResult<ServiceAccountDTO>> {
  const client = await getClientAccess();
  try {
    const patch: Partial<ServiceAccountRequestDTO> = {};
    if (access.roleIds) patch.roleIds = [...access.roleIds];
    if (access.permissionIds) patch.permissionIds = [...access.permissionIds];
    const data = await putFromFresh(client, id, patch);
    return { success: true, data };
  } catch (error) {
    console.error("[service-account-access] Erro ao guardar acessos:", error);
    return { success: false, ...toActionError(error) };
  }
}

export type CreateWithClientResult =
  | {
      success: true;
      data: { client: OAuthClientDTO; account: ServiceAccountDTO };
    }
  | { success: false; failedStep: "client"; error: string; status?: number }
  | {
      success: false;
      failedStep: "serviceAccount";
      error: string;
      status?: number;
      /** Carries the raw clientSecret — the UI must still disclose it. */
      client: OAuthClientDTO;
    };

/**
 * Spec §3.1: POST client → POST account. If the account step fails the new
 * client (and its one-time secret) is returned so the UI can still show the
 * secret and retry `createServiceAccount` against it.
 */
export async function createServiceAccountWithNewClient(
  clientInput: OAuthClientInput,
  account: Omit<ServiceAccountInput, "oauthClientId">,
): Promise<CreateWithClientResult> {
  if (!clientInput.grantTypes.includes("client_credentials")) {
    return {
      success: false,
      failedStep: "client",
      status: 422,
      error: "Uma conta de serviço exige o grant type client_credentials.",
    };
  }
  const created = await createOAuthClient(clientInput);
  if (!created.success) {
    return {
      success: false,
      failedStep: "client",
      error: created.error,
      status: created.status,
    };
  }
  const client = await getClientAccess();
  try {
    const result = await client.serviceAccounts.createServiceAccount({
      ...account,
      oauthClientId: created.data.id,
      applicationId: created.data.applicationId,
    });
    return {
      success: true,
      data: { client: created.data, account: result.data },
    };
  } catch (error) {
    console.error(
      "[service-account-create-with-client] Cliente criado, conta falhou:",
      error,
    );
    return {
      success: false,
      failedStep: "serviceAccount",
      client: created.data,
      ...toActionError(error),
    };
  }
}

export type DeleteServiceAccountResult =
  | { success: true; data: null }
  | {
      success: false;
      failedStep: ActivationStep;
      error: string;
      status?: number;
      oauthClientId?: string;
    };

/** Spec §5.6: DELETE account → (optional) DELETE its client. */
export async function deleteServiceAccount(
  id: string,
  { alsoDeleteClient }: { alsoDeleteClient: boolean },
): Promise<DeleteServiceAccountResult> {
  const client = await getClientAccess();
  let step: ActivationStep = "serviceAccount";
  let oauthClientId: string | undefined;
  try {
    const sa = (await client.serviceAccounts.getServiceAccount(id)).data;
    oauthClientId = sa.oauthClientId;
    await client.serviceAccounts.deleteServiceAccount(id);
    if (alsoDeleteClient) {
      step = "client";
      await client.oauthClients.deleteOAuthClient(sa.oauthClientId);
    }
    return { success: true, data: null };
  } catch (error) {
    console.error(`[service-account-delete] Falhou no passo ${step}:`, error);
    return {
      success: false,
      failedStep: step,
      oauthClientId,
      ...toActionError(error),
    };
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/actions/service-accounts-crud.test.ts src/__tests__/actions/service-accounts.test.ts src/__tests__/actions/oauth-clients.test.ts`
Expected: PASS (the Plan 1 files are unaffected).

- [ ] **Step 5: Typecheck**

Run: `pnpm typecheck`
Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/actions/service-accounts.ts src/__tests__/actions/service-accounts-crud.test.ts
git commit -m "feat(actions): add service account CRUD, create-with-client and delete-with-client"
```

---

### Task 3: Data layer — keys, options, prefetch, hooks

**Files:**
- Modify: `src/features/service-accounts/query-keys.ts`, `query-options.ts`, `use-service-accounts.ts`
- Create: `src/features/service-accounts/prefetch.ts`, `src/features/service-accounts/use-role-details.ts`
- Test: `src/__tests__/service-accounts/use-service-accounts.test.tsx`

**Interfaces:**
- Consumes: Task 2 actions; `getAvailableOAuthClients` (Task 1); `oauthClientKeys`, `oauthClientListOptions`, `oauthClientByIdOptions`, `useOAuthClients` (Plan 1); `getRoleById` (`src/actions/roles.ts`).
- Produces:
  - `serviceAccountKeys.detail(id)` → `["service-accounts", "detail", id]`
  - `serviceAccountByIdOptions(id)`
  - `getServiceAccountCached`, `prefetchServiceAccountList(qc)`, `prefetchServiceAccount(qc, id)`, `prefetchServiceAccountWizard(qc)`
  - `useServiceAccount(id)`, `useAvailableOAuthClients(): { data: OAuthClientDTO[]; isLoading: boolean; isError: boolean }`
  - `useCreateServiceAccount()` → `mutateAsync(input: ServiceAccountInput)`
  - `useCreateServiceAccountWithNewClient()` → `mutateAsync({ client: OAuthClientInput; account: Omit<ServiceAccountInput, "oauthClientId"> })`
  - `useUpdateServiceAccountIdentity()` → `mutateAsync({ id; identity: ServiceAccountIdentity })`
  - `useSetServiceAccountAccess()` → `mutateAsync({ id; access: ServiceAccountAccess })`
  - `useDeleteServiceAccount()` → `mutateAsync({ id; alsoDeleteClient: boolean })`
  - `useSetServiceAccountActive()` → `mutateAsync({ id; active: boolean })`
  - `useRoleDetails(roleIds: readonly number[]): { roles: RoleDTO[]; isLoading: boolean; isError: boolean; refetch: () => void }`

- [ ] **Step 1: Write the failing hooks test**

`src/__tests__/service-accounts/use-service-accounts.test.tsx`:

```tsx
import type { ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getRoleById } from "@/actions/roles";
import { deleteServiceAccount } from "@/actions/service-accounts";
import { oauthClientKeys } from "@/features/oauth-clients/query-keys";
import { serviceAccountKeys } from "@/features/service-accounts/query-keys";
import { useRoleDetails } from "@/features/service-accounts/use-role-details";
import {
  useAvailableOAuthClients,
  useCreateServiceAccountWithNewClient,
  useDeleteServiceAccount,
  useSetServiceAccountAccess,
} from "@/features/service-accounts/use-service-accounts";

vi.mock("@/actions/oauth-clients", () => ({
  listOAuthClients: vi.fn(),
  getOAuthClient: vi.fn(),
  createOAuthClient: vi.fn(),
  updateOAuthClient: vi.fn(),
  deleteOAuthClient: vi.fn(),
  setOAuthClientActive: vi.fn(),
}));
vi.mock("@/actions/service-accounts", () => ({
  listServiceAccounts: vi.fn(),
  getServiceAccount: vi.fn(),
  createServiceAccount: vi.fn(),
  createServiceAccountWithNewClient: vi.fn(async () => ({
    success: false,
    failedStep: "serviceAccount",
    error: "Boom",
    client: { id: "c9", clientSecret: "s3cret" },
  })),
  updateServiceAccountIdentity: vi.fn(),
  setServiceAccountAccess: vi.fn(async () => ({ success: true, data: {} })),
  deleteServiceAccount: vi.fn(async () => ({ success: true, data: null })),
  setServiceAccountActive: vi.fn(),
}));
vi.mock("@/actions/roles", () => ({
  getRoleById: vi.fn(async (id: number) => ({
    success: true,
    data: { id, code: `r${id}`, departmentCode: "D", permissions: [] },
  })),
  getRoleByCode: vi.fn(),
}));

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
  });
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, invalidate, wrapper };
}

beforeEach(() => vi.clearAllMocks());

describe("useAvailableOAuthClients", () => {
  it("filters to unlinked client_credentials clients", () => {
    const { client, wrapper } = setup();
    client.setQueryData(oauthClientKeys.list(), [
      { id: "a", grantTypes: ["client_credentials"] },
      { id: "b", grantTypes: ["client_credentials"] },
    ]);
    client.setQueryData(serviceAccountKeys.list(), [{ id: "s", oauthClientId: "b" }]);
    const { result } = renderHook(() => useAvailableOAuthClients(), { wrapper });
    expect(result.current.data.map((c) => c.id)).toEqual(["a"]);
  });
});

describe("useCreateServiceAccountWithNewClient", () => {
  it("returns the secret on partial failure but never caches it", async () => {
    const { client, invalidate, wrapper } = setup();
    const { result } = renderHook(() => useCreateServiceAccountWithNewClient(), { wrapper });
    const r = await result.current.mutateAsync({
      client: { clientId: "x", clientName: "x", scopes: [], grantTypes: ["client_credentials"] },
      account: { name: "N" },
    });
    expect(!r.success && r.failedStep === "serviceAccount" && r.client.clientSecret).toBe("s3cret");
    await waitFor(() => {
      expect(invalidate).toHaveBeenCalledWith({ queryKey: serviceAccountKeys.all });
      expect(invalidate).toHaveBeenCalledWith({ queryKey: oauthClientKeys.all });
    });
    const cached = JSON.stringify(client.getQueryCache().getAll().map((q) => q.state.data));
    expect(cached).not.toContain("s3cret");
  });
});

describe("useSetServiceAccountAccess", () => {
  it("invalidates the service-account family", async () => {
    const { invalidate, wrapper } = setup();
    const { result } = renderHook(() => useSetServiceAccountAccess(), { wrapper });
    await result.current.mutateAsync({ id: "sa1", access: { roleIds: [1] } });
    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({ queryKey: serviceAccountKeys.all }),
    );
  });
});

describe("useDeleteServiceAccount", () => {
  it("drops the detail and refreshes both lists", async () => {
    const { client, invalidate, wrapper } = setup();
    client.setQueryData(serviceAccountKeys.detail("sa1"), { id: "sa1" });
    const { result } = renderHook(() => useDeleteServiceAccount(), { wrapper });
    await result.current.mutateAsync({ id: "sa1", alsoDeleteClient: true });
    expect(deleteServiceAccount).toHaveBeenCalledWith("sa1", { alsoDeleteClient: true });
    expect(client.getQueryData(serviceAccountKeys.detail("sa1"))).toBeUndefined();
    await waitFor(() => {
      expect(invalidate).toHaveBeenCalledWith({ queryKey: serviceAccountKeys.list() });
      expect(invalidate).toHaveBeenCalledWith({ queryKey: oauthClientKeys.all });
    });
  });
});

describe("useRoleDetails", () => {
  it("fetches each role and keeps a stable result", async () => {
    const { wrapper } = setup();
    const { result, rerender } = renderHook(() => useRoleDetails([1, 2]), { wrapper });
    await waitFor(() => expect(result.current.roles).toHaveLength(2));
    expect(getRoleById).toHaveBeenCalledTimes(2);
    const first = result.current.roles;
    rerender();
    expect(result.current.roles).toBe(first);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/__tests__/service-accounts/use-service-accounts.test.tsx`
Expected: FAIL — missing exports.

- [ ] **Step 3: Keys and options**

`src/features/service-accounts/query-keys.ts`:

```ts
export const serviceAccountKeys = {
  all: ["service-accounts"] as const,
  list: () => ["service-accounts", "list"] as const,
  detail: (id: string) => ["service-accounts", "detail", id] as const,
};
```

`src/features/service-accounts/query-options.ts`:

```ts
import { queryOptions } from "@tanstack/react-query";

import { getServiceAccount, listServiceAccounts } from "@/actions/service-accounts";
import { unwrap } from "@/actions/types";

import { serviceAccountKeys } from "./query-keys";

export const serviceAccountListOptions = () =>
  queryOptions({
    queryKey: serviceAccountKeys.list(),
    queryFn: async () => unwrap(await listServiceAccounts()),
  });

export const serviceAccountByIdOptions = (id: string) =>
  queryOptions({
    queryKey: serviceAccountKeys.detail(id),
    queryFn: async () => unwrap(await getServiceAccount(id)),
    enabled: !!id,
  });
```

- [ ] **Step 4: Prefetch** — `src/features/service-accounts/prefetch.ts`:

```ts
import { cache } from "react";

import type { QueryClient } from "@tanstack/react-query";

import { getServiceAccount } from "@/actions/service-accounts";
import { unwrap } from "@/actions/types";
import {
  oauthClientByIdOptions,
  oauthClientListOptions,
} from "@/features/oauth-clients/query-options";

import { serviceAccountByIdOptions, serviceAccountListOptions } from "./query-options";

export const getServiceAccountCached = cache(getServiceAccount);

/** Accounts are page-critical (fetchQuery rethrows → error.tsx); clients only enrich rows. */
export async function prefetchServiceAccountList(client: QueryClient) {
  await Promise.all([
    client.fetchQuery(serviceAccountListOptions()),
    client.prefetchQuery(oauthClientListOptions()),
  ]);
}

export async function prefetchServiceAccount(client: QueryClient, id: string) {
  const account = await client.fetchQuery({
    ...serviceAccountByIdOptions(id),
    queryFn: async () => unwrap(await getServiceAccountCached(id)),
  });
  await client.prefetchQuery(oauthClientByIdOptions(account.oauthClientId));
}

/** Both lists feed "available clients"; neither failure should block the wizard. */
export async function prefetchServiceAccountWizard(client: QueryClient) {
  await Promise.all([
    client.prefetchQuery(oauthClientListOptions()),
    client.prefetchQuery(serviceAccountListOptions()),
  ]);
}
```

- [ ] **Step 5: Role details** — `src/features/service-accounts/use-role-details.ts`:

```ts
import type { RoleDTO } from "@igrp/platform-access-management-client-ts";
import { useQueries } from "@tanstack/react-query";

import { getRoleById } from "@/actions/roles";
import { unwrap } from "@/actions/types";

/**
 * One GET per role (backend gap §7.5). Same key as `useRoleById` so the cache
 * is shared, but errors stay local instead of throwing to the boundary.
 * `combine` gives a structurally shared, stable result.
 */
export function useRoleDetails(roleIds: readonly number[]) {
  return useQueries({
    queries: roleIds.map((id) => ({
      queryKey: ["roleById", id] as const,
      queryFn: async () => unwrap(await getRoleById(id)),
      staleTime: 60_000,
    })),
    combine: (results) => ({
      roles: results.flatMap((r) => (r.data ? [r.data as RoleDTO] : [])),
      isLoading: results.some((r) => r.isLoading),
      isError: results.some((r) => r.isError),
      refetch: () => {
        for (const r of results) if (r.isError) void r.refetch();
      },
    }),
  });
}
```

> If the "stable result" assertion fails, `combine` is being re-run with a new closure each render: hoist it to a module-level function (`function combineRoles(results) {…}`) and pass that. TanStack only memoises `combine` when its reference is stable.

- [ ] **Step 6: Hooks** — replace `src/features/service-accounts/use-service-accounts.ts` with:

```ts
import { useMemo } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { OAuthClientInput } from "@/features/oauth-clients/lib/oauth-client-request";
import {
  createServiceAccount,
  createServiceAccountWithNewClient,
  deleteServiceAccount,
  type ServiceAccountAccess,
  type ServiceAccountIdentity,
  type ServiceAccountInput,
  setServiceAccountAccess,
  setServiceAccountActive,
  updateServiceAccountIdentity,
} from "@/actions/service-accounts";
import { findLinkedServiceAccount } from "@/features/oauth-clients/lib/oauth-client-utils";
import { oauthClientKeys } from "@/features/oauth-clients/query-keys";
import { oauthClientListOptions } from "@/features/oauth-clients/query-options";

import { getAvailableOAuthClients } from "./lib/service-account-utils";
import { serviceAccountKeys } from "./query-keys";
import { serviceAccountByIdOptions, serviceAccountListOptions } from "./query-options";

export const useServiceAccounts = () => useQuery(serviceAccountListOptions());

export const useServiceAccount = (id: string) =>
  useQuery(serviceAccountByIdOptions(id));

/** `isError` lets callers fail safe (treat as possibly linked). */
export const useLinkedServiceAccount = (oauthClientId: string) => {
  const query = useServiceAccounts();
  return {
    ...findLinkedServiceAccount(query.data, oauthClientId),
    isLoading: query.isLoading,
    isError: query.isError,
  };
};

export const useAvailableOAuthClients = () => {
  const clients = useQuery(oauthClientListOptions());
  const accounts = useServiceAccounts();
  const data = useMemo(
    () => getAvailableOAuthClients(clients.data, accounts.data),
    [clients.data, accounts.data],
  );
  return {
    data,
    isLoading: clients.isLoading || accounts.isLoading,
    isError: clients.isError || accounts.isError,
  };
};

function useInvalidateBoth() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: serviceAccountKeys.all }),
      qc.invalidateQueries({ queryKey: oauthClientKeys.all }),
    ]);
}

export const useCreateServiceAccount = () => {
  const invalidateBoth = useInvalidateBoth();
  return useMutation({
    mutationFn: (input: ServiceAccountInput) => createServiceAccount(input),
    onSuccess: async (result) => {
      if (result.success) await invalidateBoth();
    },
  });
};

/**
 * The result may carry a raw clientSecret (success or partial failure), so:
 * no setQueryData, `gcTime: 0`, and a fire-and-forget refresh that doesn't
 * hold the mutation pending (Plan 1's useCreateOAuthClient pattern).
 */
export const useCreateServiceAccountWithNewClient = () => {
  const invalidateBoth = useInvalidateBoth();
  return useMutation({
    mutationFn: ({
      client,
      account,
    }: {
      client: OAuthClientInput;
      account: Omit<ServiceAccountInput, "oauthClientId">;
    }) => createServiceAccountWithNewClient(client, account),
    gcTime: 0,
    onSettled: () => {
      void invalidateBoth();
    },
  });
};

export const useUpdateServiceAccountIdentity = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, identity }: { id: string; identity: ServiceAccountIdentity }) =>
      updateServiceAccountIdentity(id, identity),
    onSuccess: async (result) => {
      if (result.success)
        await qc.invalidateQueries({ queryKey: serviceAccountKeys.all });
    },
  });
};

export const useSetServiceAccountAccess = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, access }: { id: string; access: ServiceAccountAccess }) =>
      setServiceAccountAccess(id, access),
    onSuccess: async (result) => {
      if (result.success)
        await qc.invalidateQueries({ queryKey: serviceAccountKeys.all });
    },
  });
};

export const useDeleteServiceAccount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, alsoDeleteClient }: { id: string; alsoDeleteClient: boolean }) =>
      deleteServiceAccount(id, { alsoDeleteClient }),
    // Settled, not success: a client-step failure still deleted the account.
    onSettled: async (result, _error, { id }) => {
      if (result?.success || result?.failedStep === "client") {
        qc.removeQueries({ queryKey: serviceAccountKeys.detail(id) });
      }
      await Promise.all([
        qc.invalidateQueries({ queryKey: serviceAccountKeys.list() }),
        qc.invalidateQueries({ queryKey: oauthClientKeys.all }),
      ]);
    },
  });
};

export const useSetServiceAccountActive = () => {
  const invalidateBoth = useInvalidateBoth();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      setServiceAccountActive(id, active),
    onSettled: async () => {
      await invalidateBoth();
    },
  });
};
```

- [ ] **Step 7: Run tests**

Run: `npx vitest run src/__tests__/service-accounts src/__tests__/oauth-clients`
Expected: PASS. If a Plan 1 test fails with `No "<name>" export is defined on the "@/actions/service-accounts" mock`, add that name as `vi.fn()` to the test's mock factory.

- [ ] **Step 8: Typecheck and commit**

Run: `pnpm typecheck` — expected 0 errors.

```bash
git add src/features/service-accounts src/__tests__/service-accounts src/__tests__/oauth-clients
git commit -m "feat(service-accounts): add query layer, role details and mutation hooks"
```

---

### Task 4: Shared dialogs — delete-with-client and activation

**Files:**
- Modify: `src/components/dialog-delete.tsx` (add `children`)
- Create: `src/features/service-accounts/components/service-account-delete-dialog.tsx`
- Create: `src/features/service-accounts/components/service-account-activation-dialog.tsx`
- Test: `src/__tests__/service-accounts/components/service-account-dialogs.test.tsx`

**Interfaces:**
- Consumes: `useDeleteServiceAccount`, `useSetServiceAccountActive` (Task 3); `ConfirmDialog`; `IGRPDialogDelete`.
- Produces:
  - `IGRPDialogDelete` accepts `children?: ReactNode`, rendered between the confirmation input and the footer.
  - `<ServiceAccountDeleteDialog account={ServiceAccountDTO} open onOpenChange onDeleted? />`
  - `<ServiceAccountActivationDialog account={ServiceAccountDTO} open onOpenChange />`

- [ ] **Step 1: Write the failing test**

`src/__tests__/service-accounts/components/service-account-dialogs.test.tsx`:

```tsx
import type { ReactNode } from "react";

import type { ServiceAccountDTO } from "@igrp/platform-access-management-client-ts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  deleteServiceAccount,
  setServiceAccountActive,
} from "@/actions/service-accounts";

vi.mock("@/actions/oauth-clients", () => ({
  listOAuthClients: vi.fn(),
  getOAuthClient: vi.fn(),
  createOAuthClient: vi.fn(),
  updateOAuthClient: vi.fn(),
  deleteOAuthClient: vi.fn(),
  setOAuthClientActive: vi.fn(),
}));
vi.mock("@/actions/service-accounts", () => ({
  listServiceAccounts: vi.fn(),
  getServiceAccount: vi.fn(),
  createServiceAccount: vi.fn(),
  createServiceAccountWithNewClient: vi.fn(),
  updateServiceAccountIdentity: vi.fn(),
  setServiceAccountAccess: vi.fn(),
  deleteServiceAccount: vi.fn(async () => ({ success: true, data: null })),
  setServiceAccountActive: vi.fn(async () => ({ success: true, data: null })),
}));

import { ServiceAccountActivationDialog } from "@/features/service-accounts/components/service-account-activation-dialog";
import { ServiceAccountDeleteDialog } from "@/features/service-accounts/components/service-account-delete-dialog";

const account = {
  id: "sa1",
  name: "Nightly ETL",
  active: true,
  oauthClientId: "c1",
  clientId: "etl-runner-m2m",
} as ServiceAccountDTO;

function wrap(ui: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

beforeEach(() => vi.clearAllMocks());

describe("ServiceAccountDeleteDialog", () => {
  it("deletes the client too by default, and the label follows the checkbox", async () => {
    const onDeleted = vi.fn();
    wrap(
      <ServiceAccountDeleteDialog account={account} open onOpenChange={() => {}} onDeleted={onDeleted} />,
    );
    expect(screen.getByRole("checkbox", { name: /Eliminar também o cliente OAuth/ })).toBeChecked();
    await userEvent.type(screen.getByLabelText(/Nome da conta/), "Nightly ETL");
    await userEvent.click(screen.getByRole("button", { name: /Eliminar conta e cliente/ }));
    await waitFor(() =>
      expect(deleteServiceAccount).toHaveBeenCalledWith("sa1", { alsoDeleteClient: true }),
    );
    await waitFor(() => expect(onDeleted).toHaveBeenCalled());
  });

  it("keeps the client when unticked", async () => {
    wrap(<ServiceAccountDeleteDialog account={account} open onOpenChange={() => {}} />);
    await userEvent.click(screen.getByRole("checkbox", { name: /Eliminar também o cliente OAuth/ }));
    await userEvent.type(screen.getByLabelText(/Nome da conta/), "Nightly ETL");
    await userEvent.click(screen.getByRole("button", { name: /^Eliminar conta$/ }));
    await waitFor(() =>
      expect(deleteServiceAccount).toHaveBeenCalledWith("sa1", { alsoDeleteClient: false }),
    );
  });
});

describe("ServiceAccountActivationDialog", () => {
  it("names the client that is also deactivated", async () => {
    wrap(<ServiceAccountActivationDialog account={account} open onOpenChange={() => {}} />);
    expect(screen.getByText(/etl-runner-m2m/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Desativar" }));
    await waitFor(() => expect(setServiceAccountActive).toHaveBeenCalledWith("sa1", false));
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/__tests__/service-accounts/components/service-account-dialogs.test.tsx`
Expected: FAIL — modules not found.

- [ ] **Step 3: Add the `children` slot** — in `src/components/dialog-delete.tsx`:
  - add to `IGRPDialogDeleteProps`: `/** Extra controls between the confirmation field and the buttons. */ children?: ReactNode;`
  - destructure `children` in `IGRPDialogDelete`
  - render `{children}` right after the closing `</div>` of the `flex flex-col gap-2` block and before `<DialogFooter`.

- [ ] **Step 4: Implement `service-account-delete-dialog.tsx`**

```tsx
"use client";

import { useId, useState } from "react";

import {
  Checkbox,
  Label,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import type { ServiceAccountDTO } from "@igrp/platform-access-management-client-ts";

import { IGRPDialogDelete } from "@/components/dialog-delete";

import { useDeleteServiceAccount } from "../use-service-accounts";

export function ServiceAccountDeleteDialog({
  account,
  open,
  onOpenChange,
  onDeleted,
}: {
  account: ServiceAccountDTO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}) {
  const id = useId();
  const { igrpToast } = useIGRPToast();
  const mutation = useDeleteServiceAccount();
  // Checked by default: an orphaned client is a live, untracked credential (spec §5.6).
  const [alsoDeleteClient, setAlsoDeleteClient] = useState(true);

  async function confirmDelete() {
    const result = await mutation.mutateAsync({ id: account.id, alsoDeleteClient });
    if (result.success) {
      igrpToast({
        type: "success",
        title: alsoDeleteClient ? "Conta e cliente eliminados" : "Conta eliminada",
        description: alsoDeleteClient
          ? `${account.name} · ${account.clientId}`
          : account.name,
      });
      onOpenChange(false);
      onDeleted?.();
      return;
    }
    if (result.failedStep === "client") {
      igrpToast({
        type: "error",
        title: "A conta foi eliminada, o cliente não",
        description: `Elimine o cliente OAuth ${account.clientId} na página Clientes OAuth. ${result.error}`,
      });
      onOpenChange(false);
      onDeleted?.();
      return;
    }
    igrpToast({
      type: "error",
      title: "Não foi possível eliminar",
      description: result.error,
    });
  }

  return (
    <IGRPDialogDelete
      open={open}
      onOpenChange={onOpenChange}
      toDelete={{ name: account.name }}
      confirmDelete={confirmDelete}
      isDeleting={mutation.isPending}
      description="A conta deixa de existir, com os perfis e permissões que tinha. Não é possível recuperá-la."
      label="Nome da conta"
      textHeader="Eliminar conta de serviço"
      labelBtnDelete={alsoDeleteClient ? "Eliminar conta e cliente" : "Eliminar conta"}
    >
      <Label
        htmlFor={`${id}-also`}
        className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 font-normal"
      >
        <Checkbox
          id={`${id}-also`}
          checked={alsoDeleteClient}
          onCheckedChange={(c) => setAlsoDeleteClient(c === true)}
        />
        <span className="flex flex-col gap-0.5">
          <span>
            Eliminar também o cliente OAuth{" "}
            <span className="font-mono">{account.clientId}</span>
          </span>
          <span className="text-sm text-muted-foreground">
            Sem a conta, o cliente continua a conseguir autenticar.
          </span>
        </span>
      </Label>
    </IGRPDialogDelete>
  );
}
```

- [ ] **Step 5: Implement `service-account-activation-dialog.tsx`**

```tsx
"use client";

import { useState } from "react";

import { useIGRPToast } from "@igrp/igrp-framework-react-design-system";
import type { ServiceAccountDTO } from "@igrp/platform-access-management-client-ts";

import { ConfirmDialog } from "@/components/confirmation-modal";

import { useSetServiceAccountActive } from "../use-service-accounts";

const STEP_LABEL = {
  client: "cliente OAuth",
  serviceAccount: "conta de serviço",
} as const;

export function ServiceAccountActivationDialog({
  account,
  open,
  onOpenChange,
}: {
  account: ServiceAccountDTO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { igrpToast } = useIGRPToast();
  const mutation = useSetServiceAccountActive();
  // Frozen at open: a refetch mid-dialog must not flip the action.
  const [activate] = useState(() => !account.active);

  async function confirm() {
    const result = await mutation.mutateAsync({ id: account.id, active: activate });
    if (result.success) {
      igrpToast({
        type: "success",
        title: activate ? "Conta ativada" : "Conta desativada",
        description: account.name,
      });
      onOpenChange(false);
      return;
    }
    igrpToast({
      type: "error",
      title: `Não foi possível ${activate ? "ativar" : "desativar"} (falhou: ${STEP_LABEL[result.failedStep]})`,
      description: `${result.error} Tente novamente.`,
    });
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={activate ? "Ativar conta de serviço" : "Desativar conta de serviço"}
      description={
        activate
          ? `A conta «${account.name}» e o cliente OAuth ${account.clientId} voltam a poder autenticar.`
          : `A conta «${account.name}» e o cliente OAuth ${account.clientId} deixam de conseguir autenticar até serem reativados.`
      }
      onConfirm={confirm}
      isLoading={mutation.isPending}
      confirmText={activate ? "Ativar" : "Desativar"}
      loadingText={activate ? "A ativar…" : "A desativar…"}
      variant={activate ? "default" : "destructive"}
    />
  );
}
```

- [ ] **Step 6: Run tests**

Run: `npx vitest run src/__tests__/service-accounts/components/service-account-dialogs.test.tsx`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/dialog-delete.tsx src/features/service-accounts/components src/__tests__/service-accounts/components
git commit -m "feat(service-accounts): add delete-with-client and combined activation dialogs"
```

---

### Task 5: Service Accounts list page

**Files:**
- Modify: `src/lib/constants.ts` (add `SERVICE_ACCOUNT_NEW`)
- Create: `src/features/service-accounts/components/service-account-columns.tsx`
- Create: `src/features/service-accounts/components/service-account-toolbar.tsx`
- Create: `src/features/service-accounts/components/service-account-list.tsx`
- Replace: `src/app/(igrp)/(home)/settings/accounts/services/page.tsx`
- Create: `src/app/(igrp)/(home)/settings/accounts/services/{loading,error}.tsx`
- Create (temporary, replaced in Tasks 6 and 9): `services/[id]/page.tsx`, `services/new/page.tsx`, each `export default function Page() { return null; }`. typedRoutes rejects links to routes whose files don't exist yet.
- Test: `src/__tests__/service-accounts/components/service-account-list.test.tsx`

**Interfaces:**
- Consumes: `useServiceAccounts`, `useCopyClientId`, `ActiveBadge`, `formatAccessSummary`, `FacetedFilter`, `SearchInput`, `MultiSelectField`, `STATUS_OPTIONS`, `useApplications`, dialogs from Task 4.
- Produces: `ROUTES.SERVICE_ACCOUNT_NEW = "/settings/accounts/services/new"`; `<ServiceAccountList />`; `ServiceAccountRowActions`.

- [ ] **Step 1: Write the failing test**

`src/__tests__/service-accounts/components/service-account-list.test.tsx`:

```tsx
import type { ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { serviceAccountKeys } from "@/features/service-accounts/query-keys";

vi.mock("@/actions/oauth-clients", () => ({
  listOAuthClients: vi.fn(),
  getOAuthClient: vi.fn(),
  createOAuthClient: vi.fn(),
  updateOAuthClient: vi.fn(),
  deleteOAuthClient: vi.fn(),
  setOAuthClientActive: vi.fn(),
}));
vi.mock("@/actions/service-accounts", () => ({
  listServiceAccounts: vi.fn(),
  getServiceAccount: vi.fn(),
  createServiceAccount: vi.fn(),
  createServiceAccountWithNewClient: vi.fn(),
  updateServiceAccountIdentity: vi.fn(),
  setServiceAccountAccess: vi.fn(),
  deleteServiceAccount: vi.fn(),
  setServiceAccountActive: vi.fn(),
}));
const APPS = { data: [{ id: 7, code: "INV", name: "Faturação" }] };
vi.mock("@/features/applications/use-applications", () => ({
  useApplications: () => APPS,
}));

import { ServiceAccountList } from "@/features/service-accounts/components/service-account-list";

const accounts = [
  {
    id: "sa1",
    name: "Nightly Invoice",
    active: true,
    oauthClientId: "c1",
    clientId: "etl-runner-m2m",
    applicationCode: "INV",
    roleIds: [1, 2],
    roleCodes: ["INV.reader", "INV.exporter"],
    permissionIds: [9, 10, 11],
    permissionNames: ["a", "b", "c"],
  },
  {
    id: "sa2",
    name: "Legacy Reporter",
    active: false,
    oauthClientId: "c2",
    clientId: "legacy-report",
    roleIds: [],
    permissionIds: [],
  },
];

function renderList(data: unknown[]) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
  });
  qc.setQueryData(serviceAccountKeys.list(), data);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  render(<ServiceAccountList />, { wrapper });
}

describe("ServiceAccountList", () => {
  it("shows name, client, access summary and state", () => {
    renderList(accounts);
    const row = screen.getByRole("row", { name: /Nightly Invoice/ });
    expect(within(row).getByRole("link", { name: "Nightly Invoice" })).toHaveAttribute(
      "href",
      "/settings/accounts/services/sa1",
    );
    expect(within(row).getByRole("link", { name: "etl-runner-m2m" })).toHaveAttribute(
      "href",
      "/settings/accounts/clients/c1",
    );
    expect(within(row).getByText("2 perfis · 3 diretas")).toBeInTheDocument();
    expect(within(row).getByText("Ativa")).toBeInTheDocument();
    expect(
      within(screen.getByRole("row", { name: /Legacy Reporter/ })).getByText("Inativa"),
    ).toBeInTheDocument();
  });

  it("filters by search", async () => {
    renderList(accounts);
    await userEvent.type(screen.getByLabelText("Pesquisar contas"), "legacy");
    expect(screen.queryByText("Nightly Invoice")).not.toBeInTheDocument();
    expect(screen.getByText("Legacy Reporter")).toBeInTheDocument();
  });

  it("explains the empty state", () => {
    renderList([]);
    expect(screen.getByText("Ainda não há contas de serviço")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Nova conta de serviço/ })).toHaveAttribute(
      "href",
      "/settings/accounts/services/new",
    );
  });

  it("offers the row actions", async () => {
    renderList(accounts);
    await userEvent.click(screen.getByRole("button", { name: "Ações para Nightly Invoice" }));
    expect(screen.getByRole("menuitem", { name: /Ver detalhes/ })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Copiar client ID/ })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Desativar/ })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Eliminar/ })).toBeInTheDocument();
  });
});
```

> If `getByRole("row", { name })` doesn't resolve (IGRPDataTable rows may not have an accessible name), use `screen.getByText("Nightly Invoice").closest("tr")` and wrap it with `within(... as HTMLElement)`.

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/__tests__/service-accounts/components/service-account-list.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Route constant** — in `src/lib/constants.ts`, after `SERVICE_ACCOUNTS: "/settings/accounts/services",` add:

```ts
  SERVICE_ACCOUNT_NEW: "/settings/accounts/services/new",
```

Also create the two temporary route files listed under **Files**.

- [ ] **Step 4: Columns** — `service-account-columns.tsx`:

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
  IGRPDataTableHeaderSortToggle,
  IGRPIcon,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@igrp/igrp-framework-react-design-system";
import type { ServiceAccountDTO } from "@igrp/platform-access-management-client-ts";

import { ActiveBadge } from "@/features/oauth-clients/components/oauth-client-badges";
import { ROUTES } from "@/lib/constants";

import { formatAccessSummary } from "../lib/service-account-utils";

interface RowHandlers {
  onToggleActive: (row: ServiceAccountDTO) => void;
  onDelete: (row: ServiceAccountDTO) => void;
  onCopy: (clientId: string) => void;
}

export function ServiceAccountRowActions({
  row,
  onToggleActive,
  onDelete,
  onCopy,
}: { row: ServiceAccountDTO } & RowHandlers) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex size-9 items-center justify-center rounded-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Ações para ${row.name}`}
      >
        <IGRPIcon iconName="Ellipsis" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-max max-w-64">
        <DropdownMenuItem asChild>
          <Link href={`${ROUTES.SERVICE_ACCOUNTS}/${row.id}`} className="flex gap-2">
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
        <DropdownMenuItem variant="destructive" onSelect={() => onDelete(row)}>
          <IGRPIcon iconName="Trash" aria-hidden="true" />
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Role and direct counts; the popover names the roles (spec §5.2). */
function AccessCell({ row }: { row: ServiceAccountDTO }) {
  const roleCodes = row.roleCodes ?? [];
  const summary = formatAccessSummary(
    row.roleIds?.length ?? 0,
    row.permissionIds?.length ?? 0,
  );
  if (roleCodes.length === 0) return <span>{summary}</span>;
  return (
    <Popover>
      <PopoverTrigger className="rounded-sm underline decoration-dotted underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {summary}
      </PopoverTrigger>
      <PopoverContent className="w-max max-w-80">
        <p className="mb-2 text-sm font-medium">Perfis</p>
        <ul className="flex flex-col gap-1 font-mono text-xs">
          {roleCodes.map((code) => (
            <li key={code}>{code}</li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

export function getServiceAccountColumns(
  handlers: RowHandlers,
): ColumnDef<ServiceAccountDTO>[] {
  return [
    {
      id: "name",
      accessorFn: (r) => r.name,
      header: ({ column }) => <IGRPDataTableHeaderSortToggle title="Nome" column={column} />,
      cell: ({ row }) => (
        <Link
          href={`${ROUTES.SERVICE_ACCOUNTS}/${row.original.id}`}
          className="font-medium underline"
        >
          {row.original.name}
        </Link>
      ),
      size: 260,
    },
    {
      id: "clientId",
      accessorFn: (r) => r.clientId,
      header: () => <IGRPDataTableHeaderDefault title="Client ID" />,
      cell: ({ row }) => (
        <Link
          href={`${ROUTES.OAUTH_CLIENTS}/${row.original.oauthClientId}`}
          className="font-mono text-xs underline"
        >
          {row.original.clientId}
        </Link>
      ),
    },
    {
      id: "application",
      accessorFn: (r) => r.applicationCode ?? "—",
      header: () => <IGRPDataTableHeaderDefault title="Aplicação" />,
      cell: ({ getValue }) => <span className="font-mono text-xs">{String(getValue())}</span>,
    },
    {
      id: "access",
      header: () => <IGRPDataTableHeaderDefault title="Permissões" />,
      cell: ({ row }) => <AccessCell row={row.original} />,
    },
    {
      id: "status",
      accessorFn: (r) => (r.active ? "ACTIVE" : "INACTIVE"),
      header: ({ column }) => <IGRPDataTableHeaderSortToggle title="Estado" column={column} />,
      cell: ({ row }) => <ActiveBadge active={row.original.active} feminine />,
      size: 80,
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Ações</span>,
      cell: ({ row }) => <ServiceAccountRowActions row={row.original} {...handlers} />,
      enableSorting: false,
      size: 50,
    },
  ];
}
```

- [ ] **Step 5: Toolbar** — `service-account-toolbar.tsx`:

```tsx
"use client";

import Link from "next/link";

import { Button, IGRPButton, IGRPIcon } from "@igrp/igrp-framework-react-design-system";

import { FacetedFilter } from "@/components/data-table/faceted-filter";
import { SearchInput } from "@/components/data-table/search-input";
import { MultiSelectField, type MultiSelectOption } from "@/components/multi-select-field";
import { ROUTES } from "@/lib/constants";

export interface ServiceAccountFilters {
  search: string;
  application: string[];
  status: string[];
}

export const EMPTY_SERVICE_ACCOUNT_FILTERS: ServiceAccountFilters = {
  search: "",
  application: [],
  status: [],
};

const STATUS = [
  { value: "ACTIVE", label: "Ativa" },
  { value: "INACTIVE", label: "Inativa" },
];

export function ServiceAccountToolbar({
  filters,
  onFiltersChange,
  applicationOptions,
  statusCounts,
  disabled = false,
}: {
  filters: ServiceAccountFilters;
  onFiltersChange: (next: ServiceAccountFilters) => void;
  applicationOptions: MultiSelectOption[];
  statusCounts: Record<string, number>;
  disabled?: boolean;
}) {
  const isFiltered =
    filters.search !== "" || filters.application.length > 0 || filters.status.length > 0;
  const set = <K extends keyof ServiceAccountFilters>(key: K, value: ServiceAccountFilters[K]) =>
    onFiltersChange({ ...filters, [key]: value });

  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
      <div className="flex w-full flex-col gap-2 md:flex-row md:items-start">
        <SearchInput
          value={filters.search}
          onChange={(v) => set("search", v)}
          label="Pesquisar contas"
          placeholder="Pesquisar por nome ou client ID…"
          disabled={disabled}
        />
        <div className="flex flex-wrap items-start gap-2">
          <MultiSelectField
            className="w-60"
            options={applicationOptions}
            value={filters.application}
            onChange={(v) => set("application", v)}
            placeholder="Aplicação"
            searchPlaceholder="Pesquisar aplicações…"
            emptyLabel="Nenhuma aplicação encontrada."
            showSearch
            disabled={disabled}
          />
          <FacetedFilter
            label="Estado"
            options={STATUS}
            value={filters.status}
            onChange={(v) => set("status", v)}
            counts={statusCounts}
            disabled={disabled}
          />
          {isFiltered && !disabled ? (
            <IGRPButton
              variant="ghost"
              showIcon
              iconName="X"
              onClick={() => onFiltersChange(EMPTY_SERVICE_ACCOUNT_FILTERS)}
            >
              Limpar
            </IGRPButton>
          ) : null}
        </div>
      </div>
      <Button asChild className="shrink-0">
        <Link href={ROUTES.SERVICE_ACCOUNT_NEW}>
          <IGRPIcon iconName="Plus" aria-hidden="true" />
          Nova conta
        </Link>
      </Button>
    </div>
  );
}
```

> Check `SearchInput`'s props in `src/components/data-table/search-input.tsx` (`value`, `onChange`, `label`, `placeholder`, `disabled`, as used by `OAuthClientToolbar`). If `label` isn't rendered as the input's accessible name, change the test's `getByLabelText` to match what it produces.

- [ ] **Step 6: List** — `service-account-list.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import {
  Button,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  IGRPDataTable,
  IGRPIcon,
} from "@igrp/igrp-framework-react-design-system";
import type { ServiceAccountDTO } from "@igrp/platform-access-management-client-ts";

import { useApplications } from "@/features/applications/use-applications";
import { useCopyClientId } from "@/features/oauth-clients/use-copy-client-id";
import { ROUTES } from "@/lib/constants";

import { useServiceAccounts } from "../use-service-accounts";
import { ServiceAccountActivationDialog } from "./service-account-activation-dialog";
import { getServiceAccountColumns } from "./service-account-columns";
import { ServiceAccountDeleteDialog } from "./service-account-delete-dialog";
import {
  EMPTY_SERVICE_ACCOUNT_FILTERS,
  type ServiceAccountFilters,
  ServiceAccountToolbar,
} from "./service-account-toolbar";

type DialogState =
  | { kind: "none" }
  | { kind: "activation"; row: ServiceAccountDTO }
  | { kind: "delete"; row: ServiceAccountDTO };

const statusOf = (r: ServiceAccountDTO) => (r.active ? "ACTIVE" : "INACTIVE");
const appOf = (r: ServiceAccountDTO) => r.applicationCode ?? "—";

export function ServiceAccountList() {
  const copyClientId = useCopyClientId();
  const { data: rows = [] } = useServiceAccounts();
  const { data: applications = [] } = useApplications();
  const [dialog, setDialog] = useState<DialogState>({ kind: "none" });
  const [filters, setFilters] = useState<ServiceAccountFilters>(EMPTY_SERVICE_ACCOUNT_FILTERS);
  const close = useCallback(() => setDialog({ kind: "none" }), []);

  const filteredRows = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return rows.filter((row) => {
      if (filters.application.length && !filters.application.includes(appOf(row))) return false;
      if (filters.status.length && !filters.status.includes(statusOf(row))) return false;
      return !term || `${row.name} ${row.clientId}`.toLowerCase().includes(term);
    });
  }, [rows, filters]);

  const { statusCounts, appOptions } = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of rows) counts[statusOf(r)] = (counts[statusOf(r)] ?? 0) + 1;
    const nameByCode = new Map(applications.map((a) => [a.code, a.name]));
    return {
      statusCounts: counts,
      appOptions: [...new Set(rows.map(appOf))]
        .map((code) =>
          code === "—"
            ? { value: code, label: "Sem aplicação" }
            : { value: code, label: nameByCode.get(code) || code, description: code },
        )
        .sort((a, b) => a.label.localeCompare(b.label)),
    };
  }, [rows, applications]);

  const columns = useMemo(
    () =>
      getServiceAccountColumns({
        onToggleActive: (row) => setDialog({ kind: "activation", row }),
        onDelete: (row) => setDialog({ kind: "delete", row }),
        onCopy: copyClientId,
      }),
    [copyClientId],
  );

  return (
    <div className="flex flex-col gap-4">
      <ServiceAccountToolbar
        filters={filters}
        onFiltersChange={setFilters}
        applicationOptions={appOptions}
        statusCounts={statusCounts}
        disabled={rows.length === 0}
      />

      {rows.length === 0 ? (
        <Empty className="rounded-xl border border-border">
          <EmptyHeader>
            <EmptyTitle>Ainda não há contas de serviço</EmptyTitle>
            <EmptyDescription>
              Uma conta de serviço envolve um cliente OAuth client_credentials e
              dá-lhe perfis e permissões, para que um sistema aceda às APIs sem
              utilizador.
            </EmptyDescription>
          </EmptyHeader>
          <Button asChild>
            <Link href={ROUTES.SERVICE_ACCOUNT_NEW}>
              <IGRPIcon iconName="Plus" aria-hidden="true" />
              Nova conta de serviço
            </Link>
          </Button>
        </Empty>
      ) : (
        <IGRPDataTable<ServiceAccountDTO, ServiceAccountDTO>
          showPagination
          tableClassName="table-fixed"
          tableHeaderClassName="bg-muted"
          columns={columns}
          data={filteredRows}
          notFoundLabel="Nenhuma conta corresponde aos filtros."
        />
      )}

      {dialog.kind === "activation" ? (
        <ServiceAccountActivationDialog account={dialog.row} open onOpenChange={(o) => !o && close()} />
      ) : null}
      {dialog.kind === "delete" ? (
        <ServiceAccountDeleteDialog account={dialog.row} open onOpenChange={(o) => !o && close()} />
      ) : null}
    </div>
  );
}
```

- [ ] **Step 7: Routes** — replace `services/page.tsx`:

```tsx
import type { Metadata } from "next";

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { ServiceAccountList } from "@/features/service-accounts/components/service-account-list";
import { prefetchServiceAccountList } from "@/features/service-accounts/prefetch";
import { getQueryClient } from "@/providers/query-client.server";

export const metadata: Metadata = {
  title: "Contas de Serviço",
  description: "Identidades de máquina que autenticam via client_credentials.",
};

export default async function ServiceAccountsPage() {
  const queryClient = getQueryClient();
  await prefetchServiceAccountList(queryClient);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ServiceAccountList />
    </HydrationBoundary>
  );
}
```

`services/loading.tsx`:

```tsx
import { AppCenterLoading } from "@/components/loading";

export default function ServiceAccountsLoading() {
  return <AppCenterLoading description="A carregar contas de serviço..." />;
}
```

`services/error.tsx` — copy `clients/error.tsx`, renaming the component `ServiceAccountsError`, the log tag to `"[service-accounts] segment error"` and the title to `"Não foi possível carregar as contas de serviço."`.

- [ ] **Step 8: Run tests, typecheck, UI rules**

Run: `npx vitest run src/__tests__/service-accounts && pnpm typecheck && pnpm check:ui`
Expected: PASS / 0 errors / 0 violations.

- [ ] **Step 9: Commit**

```bash
git add src/lib/constants.ts src/features/service-accounts "src/app/(igrp)/(home)/settings/accounts/services" src/__tests__/service-accounts
git commit -m "feat(service-accounts): add service accounts list with access summary and row actions"
```

---

### Task 6: Detail page shell — header, side column, identity edit, danger zone

**Files:**
- Create: `src/features/service-accounts/components/service-account-detail.tsx`
- Create: `src/features/service-accounts/components/service-account-client-card.tsx`
- Create: `src/features/service-accounts/components/service-account-identity-card.tsx`
- Replace: `src/app/(igrp)/(home)/settings/accounts/services/[id]/page.tsx`
- Create: `services/[id]/loading.tsx`, `services/[id]/error.tsx`
- Test: `src/__tests__/service-accounts/components/service-account-detail.test.tsx`

**Interfaces:**
- Consumes: `useServiceAccount`, `useUpdateServiceAccountIdentity` (Task 3); `useOAuthClient`, `useCopyClientId`, `ActiveBadge` (Plan 1); dialogs (Task 4); `serviceAccountIdentitySchema` (Task 1); `formatDate`.
- Produces: `<ServiceAccountDetail id={string} />` exposing a `main` slot. Task 7 adds the access sections to it.

- [ ] **Step 1: Write the failing test**

`src/__tests__/service-accounts/components/service-account-detail.test.tsx`:

```tsx
import type { ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { updateServiceAccountIdentity } from "@/actions/service-accounts";
import { oauthClientKeys } from "@/features/oauth-clients/query-keys";
import { serviceAccountKeys } from "@/features/service-accounts/query-keys";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/actions/oauth-clients", () => ({
  listOAuthClients: vi.fn(),
  getOAuthClient: vi.fn(),
  createOAuthClient: vi.fn(),
  updateOAuthClient: vi.fn(),
  deleteOAuthClient: vi.fn(),
  setOAuthClientActive: vi.fn(),
}));
vi.mock("@/actions/service-accounts", () => ({
  listServiceAccounts: vi.fn(),
  getServiceAccount: vi.fn(),
  createServiceAccount: vi.fn(),
  createServiceAccountWithNewClient: vi.fn(),
  updateServiceAccountIdentity: vi.fn(async () => ({ success: true, data: {} })),
  setServiceAccountAccess: vi.fn(),
  deleteServiceAccount: vi.fn(),
  setServiceAccountActive: vi.fn(),
}));
vi.mock("@/actions/roles", () => ({
  getRoleById: vi.fn(async () => ({ success: false, error: "x" })),
  getRoleByCode: vi.fn(),
}));

import { ServiceAccountDetail } from "@/features/service-accounts/components/service-account-detail";

const account = {
  id: "sa1",
  name: "Nightly Invoice ETL",
  description: "Exporta faturas",
  active: true,
  oauthClientId: "c1",
  clientId: "etl-runner-m2m",
  applicationCode: "INV",
  roleIds: [],
  roleCodes: [],
  permissionIds: [],
  permissionNames: [],
  createdAt: "2026-03-14T10:05:00Z",
};
const client = {
  id: "c1",
  clientId: "etl-runner-m2m",
  clientName: "ETL runner",
  active: true,
  grantTypes: ["client_credentials"],
  scopes: [],
  redirectUris: [],
};

function renderDetail() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
  });
  qc.setQueryData(serviceAccountKeys.detail("sa1"), account);
  qc.setQueryData(oauthClientKeys.detail("c1"), client);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  render(<ServiceAccountDetail id="sa1" />, { wrapper });
}

beforeEach(() => vi.clearAllMocks());

describe("ServiceAccountDetail", () => {
  it("shows the header and the linked client", () => {
    renderDetail();
    expect(screen.getByRole("heading", { level: 2, name: "Nightly Invoice ETL" })).toBeInTheDocument();
    expect(screen.getByText("Ativa")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /etl-runner-m2m/ })[0]).toHaveAttribute(
      "href",
      "/settings/accounts/clients/c1",
    );
    expect(screen.getByText("Fixo enquanto esta conta existir.")).toBeInTheDocument();
    expect(screen.getByText("Herdada do cliente OAuth.")).toBeInTheDocument();
  });

  it("edits the identity in place", async () => {
    renderDetail();
    await userEvent.click(screen.getByRole("button", { name: "Editar identidade" }));
    const name = screen.getByLabelText("Nome *");
    await userEvent.clear(name);
    await userEvent.type(name, "Renamed");
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() =>
      expect(updateServiceAccountIdentity).toHaveBeenCalledWith("sa1", {
        name: "Renamed",
        description: "Exporta faturas",
      }),
    );
  });

  it("names the client in the deactivate copy", () => {
    renderDetail();
    expect(
      screen.getByText(/Desativa também o cliente OAuth etl-runner-m2m/),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/__tests__/service-accounts/components/service-account-detail.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Client card** — `service-account-client-card.tsx`:

```tsx
"use client";

import Link from "next/link";

import { Button, IGRPIcon } from "@igrp/igrp-framework-react-design-system";
import type { ServiceAccountDTO } from "@igrp/platform-access-management-client-ts";

import { InlineError } from "@/components/inline-error";
import { ActiveBadge } from "@/features/oauth-clients/components/oauth-client-badges";
import { useCopyClientId } from "@/features/oauth-clients/use-copy-client-id";
import { useOAuthClient } from "@/features/oauth-clients/use-oauth-clients";
import { ROUTES } from "@/lib/constants";

export function ServiceAccountClientCard({ account }: { account: ServiceAccountDTO }) {
  const copyClientId = useCopyClientId();
  const client = useOAuthClient(account.oauthClientId);
  const href = `${ROUTES.OAUTH_CLIENTS}/${account.oauthClientId}` as const;

  return (
    <section aria-labelledby="sa-client" className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 id="sa-client" className="font-semibold">Cliente OAuth</h3>
        <Button asChild variant="outline" size="sm">
          <Link href={href}>Abrir</Link>
        </Button>
      </div>
      {client.isError ? (
        // Spec §6.5: a missing client should not happen (FK NOT NULL) — say so, never render a broken card.
        <InlineError
          title="Não foi possível carregar o cliente OAuth."
          message="Tente novamente. Se o problema persistir, contacte o suporte."
          onRetry={() => client.refetch()}
        />
      ) : (
        <dl className="flex flex-col gap-3 text-sm">
          <div className="flex flex-col gap-1">
            <dt className="text-muted-foreground">Client ID</dt>
            <dd className="flex items-center gap-1">
              <Link href={href} className="font-mono underline">
                {account.clientId}
              </Link>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7"
                aria-label="Copiar client ID"
                onClick={() => copyClientId(account.clientId)}
              >
                <IGRPIcon iconName="Copy" className="size-3.5" aria-hidden="true" />
              </Button>
            </dd>
          </div>
          {client.data?.clientName ? (
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground">Nome</dt>
              <dd>{client.data.clientName}</dd>
            </div>
          ) : null}
          <div className="flex flex-col gap-1">
            <dt className="text-muted-foreground">Grant type</dt>
            <dd className="flex flex-col gap-0.5">
              <span className="inline-flex items-center gap-1.5 font-mono">
                <IGRPIcon iconName="Lock" className="size-3.5" aria-hidden="true" />
                client_credentials
              </span>
              <span className="text-muted-foreground">Fixo enquanto esta conta existir.</span>
            </dd>
          </div>
          {client.data ? (
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground">Estado</dt>
              <dd>
                <ActiveBadge active={client.data.active} />
              </dd>
            </div>
          ) : null}
        </dl>
      )}
    </section>
  );
}
```

- [ ] **Step 4: Identity card** — `service-account-identity-card.tsx`:

```tsx
"use client";

import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import type { ServiceAccountDTO } from "@igrp/platform-access-management-client-ts";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { LimitedTextareaField } from "@/components/limited-textarea-field";
import { formatDate } from "@/lib/app-utilities";

import { serviceAccountIdentitySchema } from "../service-account-schemas";
import { useUpdateServiceAccountIdentity } from "../use-service-accounts";

const identitySchema = serviceAccountIdentitySchema.pick({ name: true, description: true });
type IdentityValues = z.infer<typeof identitySchema>;

function timestamp(value?: string) {
  if (!value || Number.isNaN(new Date(value).getTime())) return "—";
  return formatDate(value);
}

export function ServiceAccountIdentityCard({ account }: { account: ServiceAccountDTO }) {
  const { igrpToast } = useIGRPToast();
  const update = useUpdateServiceAccountIdentity();
  const [editing, setEditing] = useState(false);
  const form = useForm<IdentityValues>({
    resolver: zodResolver(identitySchema),
    values: { name: account.name, description: account.description ?? "" },
  });

  async function onSubmit(values: IdentityValues) {
    const result = await update.mutateAsync({
      id: account.id,
      identity: { name: values.name, description: values.description || undefined },
    });
    if (!result.success) {
      igrpToast({ type: "error", title: "Não foi possível guardar", description: result.error });
      return;
    }
    igrpToast({ type: "success", title: "Identidade guardada", description: values.name });
    setEditing(false);
  }

  return (
    <section aria-labelledby="sa-identity" className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 id="sa-identity" className="font-semibold">Identidade</h3>
        {editing ? null : (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            Editar identidade
          </Button>
        )}
      </div>
      {editing ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input {...field} autoComplete="off" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <LimitedTextareaField id="description" label="Descrição" maxLength={255} />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={update.isPending}
                onClick={() => {
                  form.reset();
                  setEditing(false);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={update.isPending}>
                {update.isPending ? "A guardar…" : "Guardar"}
              </Button>
            </div>
          </form>
        </Form>
      ) : (
        <dl className="flex flex-col gap-3 text-sm">
          <div className="flex flex-col gap-1">
            <dt className="text-muted-foreground">Descrição</dt>
            <dd>{account.description || "—"}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-muted-foreground">Aplicação</dt>
            <dd className="flex flex-col gap-0.5">
              <span className="font-mono">{account.applicationCode ?? "—"}</span>
              <span className="text-muted-foreground">Herdada do cliente OAuth.</span>
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-muted-foreground">Criada em</dt>
            <dd>{timestamp(account.createdAt)}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-muted-foreground">Atualizada em</dt>
            <dd>{timestamp(account.updatedAt)}</dd>
          </div>
        </dl>
      )}
    </section>
  );
}
```

> `useForm({ values })` re-seeds the form whenever the account refetches. That's safe here because it's only mounted in edit mode while the admin is typing and nothing else mutates the name. If `LimitedTextareaField` needs `id` to match the field name, `"description"` already does.

- [ ] **Step 5: Detail** — `service-account-detail.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";

import { Button, IGRPIcon } from "@igrp/igrp-framework-react-design-system";

import { ActiveBadge } from "@/features/oauth-clients/components/oauth-client-badges";
import { ROUTES } from "@/lib/constants";

import { useServiceAccount } from "../use-service-accounts";
import { ServiceAccountActivationDialog } from "./service-account-activation-dialog";
import { ServiceAccountClientCard } from "./service-account-client-card";
import { ServiceAccountDeleteDialog } from "./service-account-delete-dialog";
import { ServiceAccountIdentityCard } from "./service-account-identity-card";

export function ServiceAccountDetail({
  id,
  main,
}: {
  id: string;
  /** The access column (Task 7). */
  main?: ReactNode;
}) {
  const router = useRouter();
  const { data: account } = useServiceAccount(id);
  const [dialog, setDialog] = useState<"none" | "activation" | "delete">("none");

  if (!account) return null; // prefetched; error.tsx covers failure

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={ROUTES.SERVICE_ACCOUNTS}
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <IGRPIcon iconName="ArrowLeft" className="size-4" aria-hidden="true" />
        Contas de serviço
      </Link>

      <header className="flex items-center gap-4">
        <div className="flex size-13 items-center justify-center rounded-xl bg-primary-subtle text-primary-subtle-foreground">
          <IGRPIcon iconName="Bot" className="size-6" aria-hidden="true" />
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <h2 className="text-2xl font-semibold tracking-tight">{account.name}</h2>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <ActiveBadge active={account.active} feminine />
            <span>
              Aplicação <span className="font-mono text-foreground">{account.applicationCode ?? "—"}</span>
            </span>
            <span>
              Autentica como{" "}
              <Link
                href={`${ROUTES.OAUTH_CLIENTS}/${account.oauthClientId}`}
                className="font-mono text-foreground underline"
              >
                {account.clientId}
              </Link>
            </span>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-6">{main}</div>
        <aside className="flex flex-col gap-6">
          <ServiceAccountClientCard account={account} />
          <ServiceAccountIdentityCard account={account} />
        </aside>
      </div>

      <section aria-labelledby="danger-zone" className="flex flex-col gap-3">
        <h3 id="danger-zone" className="text-base font-semibold text-destructive">
          Zona de perigo
        </h3>
        <div className="flex flex-col divide-y divide-destructive/20 rounded-xl border border-destructive/30 bg-card">
          <div className="flex items-center gap-6 p-5">
            <div className="flex flex-1 flex-col gap-1">
              <span className="font-medium">{account.active ? "Desativar conta" : "Ativar conta"}</span>
              <span className="text-sm text-muted-foreground">
                {account.active
                  ? `Desativa também o cliente OAuth ${account.clientId}. A identidade deixa de conseguir autenticar.`
                  : `Reativa também o cliente OAuth ${account.clientId}.`}
              </span>
            </div>
            <Button
              variant={account.active ? "outline" : "default"}
              className={account.active ? "text-destructive" : undefined}
              onClick={() => setDialog("activation")}
            >
              {account.active ? "Desativar" : "Ativar"}
            </Button>
          </div>
          <div className="flex items-center gap-6 p-5">
            <div className="flex flex-1 flex-col gap-1">
              <span className="font-medium">Eliminar conta</span>
              <span className="text-sm text-muted-foreground">
                Remove a conta e, por defeito, o cliente OAuth. Não é possível recuperá-los.
              </span>
            </div>
            <Button variant="destructive" onClick={() => setDialog("delete")}>
              Eliminar
            </Button>
          </div>
        </div>
      </section>

      {dialog === "activation" ? (
        <ServiceAccountActivationDialog account={account} open onOpenChange={(o) => !o && setDialog("none")} />
      ) : null}
      {dialog === "delete" ? (
        <ServiceAccountDeleteDialog
          account={account}
          open
          onOpenChange={(o) => !o && setDialog("none")}
          onDeleted={() => router.push(ROUTES.SERVICE_ACCOUNTS)}
        />
      ) : null}
    </div>
  );
}
```

- [ ] **Step 6: Routes** — replace `services/[id]/page.tsx`:

```tsx
import type { Metadata } from "next";

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { ServiceAccountDetail } from "@/features/service-accounts/components/service-account-detail";
import {
  getServiceAccountCached,
  prefetchServiceAccount,
} from "@/features/service-accounts/prefetch";
import { getQueryClient } from "@/providers/query-client.server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const result = await getServiceAccountCached(id);
  return {
    title: `${result.success ? result.data.name : "Conta de serviço"} · Contas de Serviço`,
  };
}

export default async function ServiceAccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const queryClient = getQueryClient();
  await prefetchServiceAccount(queryClient, id);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ServiceAccountDetail id={id} />
    </HydrationBoundary>
  );
}
```

`services/[id]/loading.tsx` → `AppCenterLoading description="A carregar a conta de serviço..."`. `services/[id]/error.tsx` → copy `clients/[id]/error.tsx`, renaming it to `ServiceAccountDetailError` with the tag `"[service-account] segment error"` and the title `"Não foi possível carregar a conta de serviço."`.

- [ ] **Step 7: Run tests, typecheck, UI rules**

Run: `npx vitest run src/__tests__/service-accounts && pnpm typecheck && pnpm check:ui`
Expected: PASS / 0 / 0.

- [ ] **Step 8: Commit**

```bash
git add src/features/service-accounts "src/app/(igrp)/(home)/settings/accounts/services" src/__tests__/service-accounts
git commit -m "feat(service-accounts): add account detail with client card, inline identity edit and danger zone"
```

---

### Task 7: Access management — pickers, effective permissions, roles and direct permissions

**Files:**
- Create: `src/features/service-accounts/components/scoped-picker-dialog.tsx`
- Create: `src/features/service-accounts/components/role-picker-dialog.tsx`
- Create: `src/features/service-accounts/components/permission-picker-dialog.tsx`
- Create: `src/features/service-accounts/components/effective-permissions-card.tsx`
- Create: `src/features/service-accounts/components/service-account-roles-section.tsx`
- Create: `src/features/service-accounts/components/service-account-permissions-section.tsx`
- Create: `src/features/service-accounts/components/service-account-access.tsx`
- Modify: `src/app/(igrp)/(home)/settings/accounts/services/[id]/page.tsx` (pass `main`)
- Test: `src/__tests__/service-accounts/components/service-account-access.test.tsx`
- Test: `src/__tests__/service-accounts/components/scoped-picker-dialog.test.tsx`

**Interfaces:**
- Consumes: `useRoles(departmentCode)`, `useDepartmentPermissions(departmentCode)`, `useDepartments()` (`@/features/departments/use-departments`); `useRoleDetails`, `useSetServiceAccountAccess`, `useServiceAccount` (Task 3); helpers (Task 1).
- Produces:
  - `type PickerItem = { id: number; label: string; description?: string | null }`
  - `<ScopedPickerDialog open onOpenChange title description departmentCode onDepartmentChange items isLoading isError selectedIds onConfirm={({ scopeIds, selectedIds }) => void} isSaving confirmLabel />`
  - `<RolePickerDialog open onOpenChange selectedIds onConfirm isSaving />` and `<PermissionPickerDialog … />`. Both call `onConfirm({ scope: T[]; selected: T[] })` with full DTOs (`RoleDTO` / `PermissionDTO`).
  - `<EffectivePermissionsCard roles directNames isLoading isError />`
  - `<ServiceAccountAccess id={string} />`: the main column (effective card, roles section, direct permissions section).

- [ ] **Step 1: Write the failing picker test**

`src/__tests__/service-accounts/components/scoped-picker-dialog.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const DEPTS = { data: [{ code: "INV", name: "Faturação" }], isLoading: false, error: null };
vi.mock("@/features/departments/use-departments", () => ({
  useDepartments: () => DEPTS,
}));

import { ScopedPickerDialog } from "@/features/service-accounts/components/scoped-picker-dialog";

const ITEMS = [
  { id: 1, label: "INV.reader", description: "Lê faturas" },
  { id: 2, label: "INV.exporter" },
  { id: 3, label: "INV.admin" },
];

describe("ScopedPickerDialog", () => {
  it("preselects current items and confirms the department's selection", async () => {
    const onConfirm = vi.fn();
    render(
      <ScopedPickerDialog
        open
        onOpenChange={() => {}}
        title="Atribuir perfis"
        description="d"
        departmentCode="INV"
        onDepartmentChange={() => {}}
        items={ITEMS}
        isLoading={false}
        isError={false}
        selectedIds={[1, 99]}
        onConfirm={onConfirm}
        isSaving={false}
        confirmLabel="Guardar perfis"
      />,
    );
    expect(screen.getByRole("checkbox", { name: /INV.reader/ })).toBeChecked();
    await userEvent.click(screen.getByRole("checkbox", { name: /INV.reader/ }));
    await userEvent.click(screen.getByRole("checkbox", { name: /INV.admin/ }));
    await userEvent.type(screen.getByLabelText("Filtrar"), "exp");
    expect(screen.queryByRole("checkbox", { name: /INV.admin/ })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Guardar perfis" }));
    expect(onConfirm).toHaveBeenCalledWith({ scopeIds: [1, 2, 3], selectedIds: [3] });
  });
});
```

- [ ] **Step 2: Write the failing access test**

`src/__tests__/service-accounts/components/service-account-access.test.tsx`:

```tsx
import type { ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { setServiceAccountAccess } from "@/actions/service-accounts";
import { serviceAccountKeys } from "@/features/service-accounts/query-keys";

vi.mock("@/actions/service-accounts", () => ({
  listServiceAccounts: vi.fn(),
  getServiceAccount: vi.fn(),
  createServiceAccount: vi.fn(),
  createServiceAccountWithNewClient: vi.fn(),
  updateServiceAccountIdentity: vi.fn(),
  setServiceAccountAccess: vi.fn(async () => ({ success: true, data: {} })),
  deleteServiceAccount: vi.fn(),
  setServiceAccountActive: vi.fn(),
}));
vi.mock("@/actions/oauth-clients", () => ({
  listOAuthClients: vi.fn(),
  getOAuthClient: vi.fn(),
  createOAuthClient: vi.fn(),
  updateOAuthClient: vi.fn(),
  deleteOAuthClient: vi.fn(),
  setOAuthClientActive: vi.fn(),
}));
const ROLES: Record<number, unknown> = {
  1: { id: 1, code: "INV.reader", description: "Lê faturas", departmentCode: "INV", permissions: ["inv.read", "inv.list"] },
  2: { id: 2, code: "INV.exporter", departmentCode: "INV", permissions: ["inv.read", "inv.export"] },
};
vi.mock("@/actions/roles", () => ({
  getRoleById: vi.fn(async (id: number) => ({ success: true, data: ROLES[id] })),
  getRoleByCode: vi.fn(),
}));
const DEPTS = { data: [], isLoading: false, error: null };
const EMPTY = { data: [], isLoading: false, isError: false };
vi.mock("@/features/departments/use-departments", () => ({
  useDepartments: () => DEPTS,
  useRoles: () => EMPTY,
  useDepartmentPermissions: () => EMPTY,
}));

import { ServiceAccountAccess } from "@/features/service-accounts/components/service-account-access";

const base = {
  id: "sa1",
  name: "Nightly",
  active: true,
  oauthClientId: "c1",
  clientId: "etl",
  roleIds: [1, 2],
  roleCodes: ["INV.reader", "INV.exporter"],
  permissionIds: [9],
  permissionNames: ["inv.approve"],
};

function renderAccess(account = base) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
  });
  qc.setQueryData(serviceAccountKeys.detail("sa1"), account);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  render(<ServiceAccountAccess id="sa1" />, { wrapper });
}

beforeEach(() => vi.clearAllMocks());

describe("ServiceAccountAccess", () => {
  it("counts effective permissions from roles and direct grants", async () => {
    renderAccess();
    await waitFor(() => expect(screen.getByTestId("effective-from-roles")).toHaveTextContent("3"));
    expect(screen.getByTestId("effective-direct")).toHaveTextContent("1");
    expect(screen.getByTestId("effective-total")).toHaveTextContent("4");
  });

  it("lists roles by department with permission counts", async () => {
    renderAccess();
    expect(await screen.findByText("INV.reader")).toBeInTheDocument();
    expect(screen.getAllByText("2 permissões")).toHaveLength(2);
  });

  it("removes a role after inline confirmation, sending the reduced set", async () => {
    renderAccess();
    await userEvent.click(await screen.findByRole("button", { name: "Remover perfil INV.reader" }));
    await userEvent.click(screen.getByRole("button", { name: "Confirmar remoção" }));
    await waitFor(() =>
      expect(setServiceAccountAccess).toHaveBeenCalledWith("sa1", { roleIds: [2] }),
    );
  });

  it("removes a direct permission", async () => {
    renderAccess();
    await userEvent.click(screen.getByRole("button", { name: "Remover permissão inv.approve" }));
    await userEvent.click(screen.getByRole("button", { name: "Confirmar remoção" }));
    await waitFor(() =>
      expect(setServiceAccountAccess).toHaveBeenCalledWith("sa1", { permissionIds: [] }),
    );
  });

  it("refuses to remove direct permissions it cannot pair", () => {
    renderAccess({ ...base, permissionIds: [9, 10], permissionNames: ["inv.approve"] });
    expect(screen.getByRole("button", { name: "Remover permissão inv.approve" })).toBeDisabled();
  });
});
```

- [ ] **Step 3: Run to verify they fail**

Run: `npx vitest run src/__tests__/service-accounts/components/scoped-picker-dialog.test.tsx src/__tests__/service-accounts/components/service-account-access.test.tsx`
Expected: FAIL — modules not found.

- [ ] **Step 4: Scoped picker** — `scoped-picker-dialog.tsx`:

```tsx
"use client";

import { useEffect, useId, useMemo, useState } from "react";

import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@igrp/igrp-framework-react-design-system";

import { useDepartments } from "@/features/departments/use-departments";

export type PickerItem = { id: number; label: string; description?: string | null };

/**
 * Department-scoped multi-select (spec §5.4). Only the chosen department's
 * items are visible; `onConfirm` reports that scope so the caller replaces
 * the selection inside it and keeps the rest (`mergeScopedSelection`).
 */
export function ScopedPickerDialog({
  open,
  onOpenChange,
  title,
  description,
  departmentCode,
  onDepartmentChange,
  items,
  isLoading,
  isError,
  selectedIds,
  onConfirm,
  isSaving,
  confirmLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  departmentCode: string | undefined;
  onDepartmentChange: (code: string) => void;
  items: readonly PickerItem[];
  isLoading: boolean;
  isError: boolean;
  selectedIds: readonly number[];
  onConfirm: (r: { scopeIds: number[]; selectedIds: number[] }) => void;
  isSaving: boolean;
  confirmLabel: string;
}) {
  const id = useId();
  const { data: departments = [] } = useDepartments();
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());

  // Re-seed whenever the visible scope changes (department switch or load).
  useEffect(() => {
    const current = new Set(selectedIds);
    setSelected(new Set(items.filter((i) => current.has(i.id)).map((i) => i.id)));
  }, [items, selectedIds]);

  const visible = useMemo(() => {
    const term = filter.trim().toLowerCase();
    return term
      ? items.filter((i) => `${i.label} ${i.description ?? ""}`.toLowerCase().includes(term))
      : items;
  }, [items, filter]);

  function toggle(itemId: number, on: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(itemId);
      else next.delete(itemId);
      return next;
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] md:min-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor={`${id}-dept`}>Departamento</Label>
            <Select value={departmentCode} onValueChange={onDepartmentChange}>
              <SelectTrigger id={`${id}-dept`}>
                <SelectValue placeholder="Selecionar departamento" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((d) => (
                  <SelectItem key={d.code} value={d.code}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor={`${id}-filter`}>Filtrar</Label>
            <Input
              id={`${id}-filter`}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              disabled={!departmentCode}
            />
          </div>
        </div>
        <div className="max-h-80 overflow-y-auto rounded-md border border-border">
          {!departmentCode ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Escolha um departamento para ver o que pode atribuir.
            </p>
          ) : isLoading ? (
            <p className="p-6 text-center text-sm text-muted-foreground">A carregar…</p>
          ) : isError ? (
            <p className="p-6 text-center text-sm text-destructive">
              Não foi possível carregar a lista. Feche e tente novamente.
            </p>
          ) : visible.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">Nada encontrado.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {visible.map((item) => (
                <li key={item.id}>
                  <Label
                    htmlFor={`${id}-${item.id}`}
                    className="flex cursor-pointer items-start gap-3 p-3 font-normal"
                  >
                    <Checkbox
                      id={`${id}-${item.id}`}
                      checked={selected.has(item.id)}
                      onCheckedChange={(c) => toggle(item.id, c === true)}
                    />
                    <span className="flex flex-col gap-0.5">
                      <span className="font-mono text-sm">{item.label}</span>
                      {item.description ? (
                        <span className="text-sm text-muted-foreground">{item.description}</span>
                      ) : null}
                    </span>
                  </Label>
                </li>
              ))}
            </ul>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button
            disabled={!departmentCode || isLoading || isError || isSaving}
            onClick={() =>
              onConfirm({ scopeIds: items.map((i) => i.id), selectedIds: [...selected] })
            }
          >
            {isSaving ? "A guardar…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

> The test's expected `selectedIds: [3]` depends on `Set` insertion order after unticking 1 and ticking 3. If your change reorders it, assert with `expect.arrayContaining` and a length check instead.

- [ ] **Step 5: Role and permission pickers**

`role-picker-dialog.tsx`:

```tsx
"use client";

import { useMemo, useState } from "react";

import type { RoleDTO } from "@igrp/platform-access-management-client-ts";

import { useRoles } from "@/features/departments/use-departments";

import { ScopedPickerDialog } from "./scoped-picker-dialog";

export function RolePickerDialog({
  open,
  onOpenChange,
  selectedIds,
  onConfirm,
  isSaving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: readonly number[];
  onConfirm: (r: { scope: RoleDTO[]; selected: RoleDTO[] }) => void;
  isSaving: boolean;
}) {
  const [departmentCode, setDepartmentCode] = useState<string>();
  const roles = useRoles(departmentCode ?? "");
  const data = roles.data;
  const items = useMemo(
    () => (data ?? []).map((r) => ({ id: r.id, label: r.code, description: r.description })),
    [data],
  );
  return (
    <ScopedPickerDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Atribuir perfis"
      description="Os perfis de outros departamentos não são alterados aqui."
      departmentCode={departmentCode}
      onDepartmentChange={setDepartmentCode}
      items={items}
      isLoading={roles.isLoading}
      isError={roles.isError}
      selectedIds={selectedIds}
      isSaving={isSaving}
      confirmLabel="Guardar perfis"
      onConfirm={({ scopeIds, selectedIds: ids }) => {
        const all = data ?? [];
        onConfirm({
          scope: all.filter((r) => scopeIds.includes(r.id)),
          selected: all.filter((r) => ids.includes(r.id)),
        });
      }}
    />
  );
}
```

`permission-picker-dialog.tsx`: same as above with these substitutions:
- `import type { PermissionDTO }` in place of `RoleDTO`, and `useDepartmentPermissions(departmentCode)` in place of `useRoles(departmentCode ?? "")`
- items map `(p) => ({ id: p.id, label: p.name, description: p.description })`
- `title="Adicionar permissões diretas"`, `description="Permissões diretas não são revogadas ao remover um perfil. Prefira perfis."`, `confirmLabel="Guardar permissões"`
- the component is `PermissionPickerDialog` and `onConfirm` receives `{ scope: PermissionDTO[]; selected: PermissionDTO[] }`.

Write that file out in full (don't import from the role picker). `PermissionDTO` is exported from `@igrp/platform-access-management-client-ts`. If it isn't, use `SdkData<AccessClient["departments"]["getDepartmentPermissions"]>[number]` from `@/actions/types`.

- [ ] **Step 6: Effective permissions card** — `effective-permissions-card.tsx`:

```tsx
"use client";

import { useId, useState } from "react";

import { Badge, Button } from "@igrp/igrp-framework-react-design-system";
import type { RoleDTO } from "@igrp/platform-access-management-client-ts";

import { computeEffectivePermissions } from "../lib/service-account-utils";

export function EffectivePermissionsCard({
  roles,
  directNames,
  isLoading,
  isError,
}: {
  roles: readonly Pick<RoleDTO, "code" | "permissions">[];
  directNames: readonly string[];
  isLoading: boolean;
  isError: boolean;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const result = computeEffectivePermissions(roles, directNames);
  const unknown = isLoading || isError;
  const count = (n: number) => (unknown ? "—" : String(n));

  return (
    <section aria-labelledby={`${id}-title`} className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 id={`${id}-title`} className="font-semibold">Permissões efetivas</h3>
        <Button
          variant="outline"
          size="sm"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          disabled={unknown}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "Ocultar lista" : "Ver lista completa"}
        </Button>
      </div>
      <dl className="grid grid-cols-3 gap-3">
        {[
          { key: "from-roles", label: "De perfis", value: result.fromRoles },
          { key: "direct", label: "Diretas", value: result.direct },
          { key: "total", label: "Total únicas", value: result.total },
        ].map((s) => (
          <div key={s.key} className="flex flex-col gap-1 rounded-lg bg-muted p-3">
            <dt className="text-sm text-muted-foreground">{s.label}</dt>
            <dd data-testid={`effective-${s.key}`} className="text-2xl font-semibold">
              {count(s.value)}
            </dd>
          </div>
        ))}
      </dl>
      {isError ? (
        <p className="text-sm text-destructive">
          Não foi possível carregar os perfis, por isso as contagens estão incompletas.
        </p>
      ) : null}
      {open && !unknown ? (
        <ul id={`${id}-list`} className="flex flex-col divide-y divide-border rounded-lg border border-border">
          {result.items.map((p) => (
            <li key={p.name} className="flex flex-wrap items-center gap-2 p-3 text-sm">
              <span className="font-mono">{p.name}</span>
              {p.direct ? <Badge variant="secondary">direta</Badge> : null}
              {p.roleCodes.length ? (
                <span className="text-muted-foreground">via {p.roleCodes.join(", ")}</span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
```

- [ ] **Step 7: Roles section** — `service-account-roles-section.tsx`:

```tsx
"use client";

import { useState } from "react";

import { Button, useIGRPToast } from "@igrp/igrp-framework-react-design-system";
import type { RoleDTO, ServiceAccountDTO } from "@igrp/platform-access-management-client-ts";

import { InlineError } from "@/components/inline-error";

import { groupRolesByDepartment, mergeScopedSelection } from "../lib/service-account-utils";
import { useSetServiceAccountAccess } from "../use-service-accounts";
import { RolePickerDialog } from "./role-picker-dialog";

export function ServiceAccountRolesSection({
  account,
  roles,
  isLoading,
  isError,
  onRetry,
}: {
  account: ServiceAccountDTO;
  roles: readonly RoleDTO[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  const { igrpToast } = useIGRPToast();
  const access = useSetServiceAccountAccess();
  const [picking, setPicking] = useState(false);
  const [confirming, setConfirming] = useState<number | null>(null);
  const roleIds = account.roleIds ?? [];

  async function save(next: number[], success: string) {
    const result = await access.mutateAsync({ id: account.id, access: { roleIds: next } });
    if (!result.success) {
      igrpToast({ type: "error", title: "Não foi possível guardar os perfis", description: result.error });
      return false;
    }
    igrpToast({ type: "success", title: success, description: account.name });
    return true;
  }

  return (
    <section aria-labelledby="sa-roles" className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 id="sa-roles" className="font-semibold">Perfis</h3>
        <Button size="sm" variant="outline" onClick={() => setPicking(true)}>
          Atribuir perfil
        </Button>
      </div>
      {isError ? (
        <InlineError title="Não foi possível carregar os perfis." message="Tente novamente." onRetry={onRetry} />
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">A carregar perfis…</p>
      ) : roleIds.length === 0 ? (
        <p className="text-sm text-muted-foreground">Esta conta ainda não tem perfis.</p>
      ) : (
        groupRolesByDepartment(roles).map((group) => (
          <div key={group.departmentCode} className="flex flex-col gap-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {group.departmentCode}
            </h4>
            <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
              {group.roles.map((role) => (
                <li key={role.id} className="flex items-center gap-3 p-3">
                  <div className="flex flex-1 flex-col gap-0.5">
                    <span className="font-mono text-sm">{role.code}</span>
                    {role.description ? (
                      <span className="text-sm text-muted-foreground">{role.description}</span>
                    ) : null}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {(role.permissions ?? []).length} permissões
                  </span>
                  {confirming === role.id ? (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setConfirming(null)} disabled={access.isPending}>
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={access.isPending}
                        onClick={async () => {
                          if (await save(roleIds.filter((r) => r !== role.id), "Perfil removido"))
                            setConfirming(null);
                        }}
                      >
                        Confirmar remoção
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label={`Remover perfil ${role.code}`}
                      disabled={access.isPending}
                      onClick={() => setConfirming(role.id)}
                    >
                      Remover
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
      {picking ? (
        <RolePickerDialog
          open
          onOpenChange={setPicking}
          selectedIds={roleIds}
          isSaving={access.isPending}
          onConfirm={async ({ scope, selected }) => {
            const next = mergeScopedSelection(roleIds, scope.map((r) => r.id), selected.map((r) => r.id));
            if (await save(next, "Perfis atualizados")) setPicking(false);
          }}
        />
      ) : null}
    </section>
  );
}
```

> The "2 permissões" text uses a `<span>`. Keep the plural simple ("permissões") to match the canvas. If the canvas shows "1 permissão", add a singular branch.

- [ ] **Step 8: Direct permissions section** — `service-account-permissions-section.tsx`:

```tsx
"use client";

import { useState } from "react";

import { Badge, Button, IGRPIcon, useIGRPToast } from "@igrp/igrp-framework-react-design-system";
import type { ServiceAccountDTO } from "@igrp/platform-access-management-client-ts";

import { mergeScopedSelection, pairDirectPermissions } from "../lib/service-account-utils";
import { useSetServiceAccountAccess } from "../use-service-accounts";
import { PermissionPickerDialog } from "./permission-picker-dialog";

const UNPAIRED_REASON =
  "Não é possível remover: o servidor não indicou que permissão corresponde a cada identificador.";

export function ServiceAccountPermissionsSection({ account }: { account: ServiceAccountDTO }) {
  const { igrpToast } = useIGRPToast();
  const access = useSetServiceAccountAccess();
  const [picking, setPicking] = useState(false);
  const [confirming, setConfirming] = useState<string | null>(null);
  const permissionIds = account.permissionIds ?? [];
  const { items, reliable } = pairDirectPermissions(account);

  async function save(next: number[], success: string) {
    const result = await access.mutateAsync({ id: account.id, access: { permissionIds: next } });
    if (!result.success) {
      igrpToast({ type: "error", title: "Não foi possível guardar as permissões", description: result.error });
      return false;
    }
    igrpToast({ type: "success", title: success, description: account.name });
    return true;
  }

  return (
    <section aria-labelledby="sa-direct" className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 id="sa-direct" className="font-semibold">Permissões diretas</h3>
        <Button size="sm" variant="outline" onClick={() => setPicking(true)}>
          Adicionar permissão
        </Button>
      </div>
      <p role="note" className="flex gap-2 rounded-lg bg-info-subtle p-3 text-sm text-info-subtle-foreground">
        <IGRPIcon iconName="Info" className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        Permissões diretas não são revogadas quando se remove um perfil. Prefira perfis.
      </p>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sem permissões diretas.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
          {items.map((p) => (
            <li key={p.name} className="flex items-center gap-3 p-3">
              <span className="flex-1 font-mono text-sm">{p.name}</span>
              <Badge variant="secondary">direta</Badge>
              {confirming === p.name && p.id !== null ? (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setConfirming(null)} disabled={access.isPending}>
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={access.isPending}
                    onClick={async () => {
                      if (await save(permissionIds.filter((id) => id !== p.id), "Permissão removida"))
                        setConfirming(null);
                    }}
                  >
                    Confirmar remoção
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={`Remover permissão ${p.name}`}
                  title={reliable ? undefined : UNPAIRED_REASON}
                  disabled={!reliable || access.isPending}
                  onClick={() => setConfirming(p.name)}
                >
                  Remover
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      {!reliable ? <p className="text-sm text-muted-foreground">{UNPAIRED_REASON}</p> : null}
      {picking ? (
        <PermissionPickerDialog
          open
          onOpenChange={setPicking}
          selectedIds={permissionIds}
          isSaving={access.isPending}
          onConfirm={async ({ scope, selected }) => {
            const next = mergeScopedSelection(permissionIds, scope.map((p) => p.id), selected.map((p) => p.id));
            if (await save(next, "Permissões atualizadas")) setPicking(false);
          }}
        />
      ) : null}
    </section>
  );
}
```

- [ ] **Step 9: Access column** — `service-account-access.tsx`:

```tsx
"use client";

import { useRoleDetails } from "../use-role-details";
import { useServiceAccount } from "../use-service-accounts";
import { EffectivePermissionsCard } from "./effective-permissions-card";
import { ServiceAccountPermissionsSection } from "./service-account-permissions-section";
import { ServiceAccountRolesSection } from "./service-account-roles-section";

const NO_IDS: number[] = [];

export function ServiceAccountAccess({ id }: { id: string }) {
  const { data: account } = useServiceAccount(id);
  const roleDetails = useRoleDetails(account?.roleIds ?? NO_IDS);
  if (!account) return null;
  return (
    <>
      <EffectivePermissionsCard
        roles={roleDetails.roles}
        directNames={account.permissionNames ?? []}
        isLoading={roleDetails.isLoading}
        isError={roleDetails.isError}
      />
      <ServiceAccountRolesSection
        account={account}
        roles={roleDetails.roles}
        isLoading={roleDetails.isLoading}
        isError={roleDetails.isError}
        onRetry={roleDetails.refetch}
      />
      <ServiceAccountPermissionsSection account={account} />
    </>
  );
}
```

- [ ] **Step 10: Wire the page** — in `services/[id]/page.tsx`, import `ServiceAccountAccess` and render `<ServiceAccountDetail id={id} main={<ServiceAccountAccess id={id} />} />`.

- [ ] **Step 11: Run tests, typecheck, UI rules**

Run: `npx vitest run src/__tests__/service-accounts && pnpm typecheck && pnpm check:ui`
Expected: PASS / 0 / 0.

- [ ] **Step 12: Commit**

```bash
git add src/features/service-accounts "src/app/(igrp)/(home)/settings/accounts/services" src/__tests__/service-accounts
git commit -m "feat(service-accounts): manage roles and direct permissions with effective-permission counts"
```

---

### Task 8: Wizard state (pure)

**Files:**
- Create: `src/features/service-accounts/lib/wizard-state.ts`
- Test: `src/__tests__/service-accounts/lib/wizard-state.test.ts`

**Interfaces:**
- Consumes: `OAuthClientFormValues` (Plan 1), `ServiceAccountIdentityValues`, `formatAccessSummary` (Task 1), `ServiceAccountInput` (Task 2).
- Produces:
  - `type WizardStep = 1 | 2 | 3`
  - `type ClientChoice = { kind: "existing"; oauthClientId: string } | { kind: "new"; values: OAuthClientFormValues }`
  - `type PickedRole = { id: number; code: string; departmentCode: string }`; `type PickedPermission = { id: number; name: string; departmentCode: string }`
  - `interface WizardState { step: WizardStep; client?: ClientChoice; identity?: ServiceAccountIdentityValues; roles: PickedRole[]; permissions: PickedPermission[] }`
  - `type WizardAction = { type: "chooseClient"; client: ClientChoice } | { type: "setIdentity"; identity: ServiceAccountIdentityValues } | { type: "setRoles"; roles: PickedRole[] } | { type: "setPermissions"; permissions: PickedPermission[] } | { type: "goTo"; step: WizardStep }`
  - `initialWizardState(oauthClientId?: string): WizardState`, `wizardReducer(state, action): WizardState`, `canGoTo(state, step): boolean`
  - `toAccountInput(state): Omit<ServiceAccountInput, "oauthClientId">` (throws if identity is missing)
  - `stepSummary(state, step, clientLabel?: (oauthClientId: string) => string): string | undefined`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";

import { machineClientFormValues } from "@/features/service-accounts/service-account-schemas";
import {
  canGoTo,
  initialWizardState,
  stepSummary,
  toAccountInput,
  wizardReducer,
} from "@/features/service-accounts/lib/wizard-state";

const identity = { name: " Nightly ETL ", description: "", active: true };

describe("wizard state", () => {
  it("starts at step 1, or at step 2 with a deep-linked client", () => {
    expect(initialWizardState().step).toBe(1);
    expect(initialWizardState("c1")).toMatchObject({
      step: 2,
      client: { kind: "existing", oauthClientId: "c1" },
    });
  });

  it("advances as each step is completed", () => {
    let s = initialWizardState();
    s = wizardReducer(s, { type: "chooseClient", client: { kind: "existing", oauthClientId: "c1" } });
    expect(s.step).toBe(2);
    s = wizardReducer(s, { type: "setIdentity", identity });
    expect(s.step).toBe(3);
  });

  it("only jumps back to reachable steps", () => {
    const s = initialWizardState();
    expect(canGoTo(s, 1)).toBe(true);
    expect(canGoTo(s, 2)).toBe(false);
    expect(wizardReducer(s, { type: "goTo", step: 3 }).step).toBe(1);
    const done = wizardReducer(
      wizardReducer(s, { type: "chooseClient", client: { kind: "existing", oauthClientId: "c1" } }),
      { type: "setIdentity", identity },
    );
    expect(wizardReducer(done, { type: "goTo", step: 1 }).step).toBe(1);
    // Going back keeps later answers.
    expect(wizardReducer(done, { type: "goTo", step: 1 }).identity).toEqual(identity);
  });

  it("builds the account input from identity and access", () => {
    let s = wizardReducer(initialWizardState("c1"), { type: "setIdentity", identity });
    s = wizardReducer(s, { type: "setRoles", roles: [{ id: 1, code: "r", departmentCode: "D" }] });
    s = wizardReducer(s, {
      type: "setPermissions",
      permissions: [{ id: 9, name: "p", departmentCode: "D" }],
    });
    expect(toAccountInput(s)).toEqual({
      name: "Nightly ETL",
      description: undefined,
      active: true,
      roleIds: [1],
      permissionIds: [9],
    });
  });

  it("summarises completed steps", () => {
    const newClient = wizardReducer(initialWizardState(), {
      type: "chooseClient",
      client: { kind: "new", values: { ...machineClientFormValues(), clientId: "nightly-etl-m2m" } },
    });
    expect(stepSummary(newClient, 1)).toBe("Novo: nightly-etl-m2m");
    const existing = initialWizardState("c1");
    expect(stepSummary(existing, 1, () => "etl-runner")).toBe("etl-runner");
    const withIdentity = wizardReducer(existing, { type: "setIdentity", identity });
    expect(stepSummary(withIdentity, 2)).toBe("Nightly ETL");
    expect(stepSummary(withIdentity, 3)).toBe("0 perfis · 0 diretas");
    expect(stepSummary(initialWizardState(), 2)).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/__tests__/service-accounts/lib/wizard-state.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `wizard-state.ts`**

```ts
import type { ServiceAccountInput } from "@/actions/service-accounts";
import type { OAuthClientFormValues } from "@/features/oauth-clients/oauth-client-schemas";

import type { ServiceAccountIdentityValues } from "../service-account-schemas";
import { formatAccessSummary } from "./service-account-utils";

export type WizardStep = 1 | 2 | 3;

export type ClientChoice =
  | { kind: "existing"; oauthClientId: string }
  | { kind: "new"; values: OAuthClientFormValues };

export type PickedRole = { id: number; code: string; departmentCode: string };
export type PickedPermission = { id: number; name: string; departmentCode: string };

/** Nothing is persisted until the final submit (spec §5.4). */
export interface WizardState {
  step: WizardStep;
  client?: ClientChoice;
  identity?: ServiceAccountIdentityValues;
  roles: PickedRole[];
  permissions: PickedPermission[];
}

export type WizardAction =
  | { type: "chooseClient"; client: ClientChoice }
  | { type: "setIdentity"; identity: ServiceAccountIdentityValues }
  | { type: "setRoles"; roles: PickedRole[] }
  | { type: "setPermissions"; permissions: PickedPermission[] }
  | { type: "goTo"; step: WizardStep };

export function initialWizardState(oauthClientId?: string): WizardState {
  return oauthClientId
    ? { step: 2, client: { kind: "existing", oauthClientId }, roles: [], permissions: [] }
    : { step: 1, roles: [], permissions: [] };
}

export function canGoTo(state: WizardState, step: WizardStep): boolean {
  if (step === 1) return true;
  if (step === 2) return !!state.client;
  return !!state.client && !!state.identity;
}

export function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "chooseClient":
      return { ...state, client: action.client, step: 2 };
    case "setIdentity":
      return { ...state, identity: action.identity, step: 3 };
    case "setRoles":
      return { ...state, roles: action.roles };
    case "setPermissions":
      return { ...state, permissions: action.permissions };
    case "goTo":
      return canGoTo(state, action.step) ? { ...state, step: action.step } : state;
  }
}

export function toAccountInput(state: WizardState): Omit<ServiceAccountInput, "oauthClientId"> {
  if (!state.identity) throw new Error("Wizard identity step not completed");
  return {
    name: state.identity.name.trim(),
    description: state.identity.description.trim() || undefined,
    active: state.identity.active,
    roleIds: state.roles.map((r) => r.id),
    permissionIds: state.permissions.map((p) => p.id),
  };
}

export function stepSummary(
  state: WizardState,
  step: WizardStep,
  clientLabel?: (oauthClientId: string) => string,
): string | undefined {
  if (step === 1) {
    if (!state.client) return undefined;
    return state.client.kind === "new"
      ? `Novo: ${state.client.values.clientId}`
      : (clientLabel?.(state.client.oauthClientId) ?? state.client.oauthClientId);
  }
  if (step === 2) return state.identity?.name.trim();
  return state.identity
    ? formatAccessSummary(state.roles.length, state.permissions.length)
    : undefined;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/service-accounts/lib/wizard-state.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/service-accounts/lib/wizard-state.ts src/__tests__/service-accounts/lib/wizard-state.test.ts
git commit -m "feat(service-accounts): add create-wizard state reducer"
```

---

### Task 9: Wizard UI — existing-client path

**Files:**
- Create: `src/features/service-accounts/components/wizard/service-account-wizard.tsx`
- Create: `src/features/service-accounts/components/wizard/wizard-client-step.tsx`
- Create: `src/features/service-accounts/components/wizard/wizard-identity-step.tsx`
- Create: `src/features/service-accounts/components/wizard/wizard-access-step.tsx`
- Replace: `src/app/(igrp)/(home)/settings/accounts/services/new/page.tsx`
- Create: `services/new/loading.tsx`
- Test: `src/__tests__/service-accounts/components/service-account-wizard.test.tsx`

**Interfaces:**
- Consumes: Task 8 reducer; `useAvailableOAuthClients`, `useCreateServiceAccount`, `useRoleDetails` (Task 3); `RolePickerDialog`, `PermissionPickerDialog`, `EffectivePermissionsCard` (Task 7); `serviceAccountIdentitySchema` (Task 1); `mergeScopedSelection`.
- Produces:
  - `<ServiceAccountWizard initialOAuthClientId?: string />`
  - `<WizardClientStep state dispatch available={OAuthClientDTO[]} />`. Task 10 adds the "new client" option inside it.
  - `<WizardIdentityStep state dispatch applicationLabel />`, `<WizardAccessStep state dispatch onSubmit isSubmitting submitNote />`

- [ ] **Step 1: Write the failing test**

`src/__tests__/service-accounts/components/service-account-wizard.test.tsx`:

```tsx
import type { ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createServiceAccount } from "@/actions/service-accounts";
import { oauthClientKeys } from "@/features/oauth-clients/query-keys";
import { serviceAccountKeys } from "@/features/service-accounts/query-keys";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/actions/oauth-clients", () => ({
  listOAuthClients: vi.fn(),
  getOAuthClient: vi.fn(),
  createOAuthClient: vi.fn(),
  updateOAuthClient: vi.fn(),
  deleteOAuthClient: vi.fn(),
  setOAuthClientActive: vi.fn(),
}));
vi.mock("@/actions/service-accounts", () => ({
  listServiceAccounts: vi.fn(),
  getServiceAccount: vi.fn(),
  createServiceAccount: vi.fn(async () => ({ success: true, data: { id: "sa-new" } })),
  createServiceAccountWithNewClient: vi.fn(),
  updateServiceAccountIdentity: vi.fn(),
  setServiceAccountAccess: vi.fn(),
  deleteServiceAccount: vi.fn(),
  setServiceAccountActive: vi.fn(),
}));
vi.mock("@/actions/roles", () => ({ getRoleById: vi.fn(), getRoleByCode: vi.fn() }));
const APPS = { data: [{ id: 7, code: "INV", name: "Faturação" }] };
vi.mock("@/features/applications/use-applications", () => ({ useApplications: () => APPS }));
const DEPTS = { data: [], isLoading: false, error: null };
const EMPTY = { data: [], isLoading: false, isError: false };
vi.mock("@/features/departments/use-departments", () => ({
  useDepartments: () => DEPTS,
  useRoles: () => EMPTY,
  useDepartmentPermissions: () => EMPTY,
}));

import { ServiceAccountWizard } from "@/features/service-accounts/components/wizard/service-account-wizard";

const clients = [
  { id: "c1", clientId: "etl-runner-m2m", clientName: "ETL", applicationCode: "INV", grantTypes: ["client_credentials"] },
  { id: "c2", clientId: "taken", grantTypes: ["client_credentials"] },
];

function renderWizard(initialOAuthClientId?: string) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
  });
  qc.setQueryData(oauthClientKeys.list(), clients);
  qc.setQueryData(serviceAccountKeys.list(), [{ id: "x", oauthClientId: "c2" }]);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  render(<ServiceAccountWizard initialOAuthClientId={initialOAuthClientId} />, { wrapper });
}

beforeEach(() => vi.clearAllMocks());

describe("ServiceAccountWizard — existing client", () => {
  it("walks the three steps and creates the account", async () => {
    renderWizard();
    expect(screen.getByText("Nada é criado até confirmar no último passo.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("combobox", { name: "Cliente OAuth" }));
    expect(screen.queryByRole("option", { name: /taken/ })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("option", { name: /etl-runner-m2m/ }));
    await userEvent.click(screen.getByRole("button", { name: "Continuar" }));

    expect(screen.getByText("INV — Faturação")).toBeInTheDocument(); // inherited application
    await userEvent.type(screen.getByLabelText("Nome *"), "Nightly Invoice ETL");
    await userEvent.click(screen.getByRole("button", { name: "Continuar" }));

    await userEvent.click(screen.getByRole("button", { name: "Criar conta" }));
    await waitFor(() =>
      expect(createServiceAccount).toHaveBeenCalledWith({
        oauthClientId: "c1",
        name: "Nightly Invoice ETL",
        description: undefined,
        active: true,
        roleIds: [],
        permissionIds: [],
      }),
    );
    await waitFor(() => expect(push).toHaveBeenCalledWith("/settings/accounts/services/sa-new"));
  });

  it("jumps to step 2 from a deep link and links back to step 1", async () => {
    renderWizard("c1");
    expect(screen.getByLabelText("Nome *")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Cliente OAuth.*ETL/ }));
    expect(screen.getByRole("combobox", { name: "Cliente OAuth" })).toBeInTheDocument();
  });

  it("warns when a deep-linked client is not available", () => {
    renderWizard("c2");
    expect(
      screen.getByText(/Este cliente não pode receber uma conta de serviço/),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/__tests__/service-accounts/components/service-account-wizard.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Client step** — `wizard/wizard-client-step.tsx`:

```tsx
"use client";

import { type Dispatch, type ReactNode, useId, useState } from "react";

import {
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@igrp/igrp-framework-react-design-system";
import type { OAuthClientDTO } from "@igrp/platform-access-management-client-ts";

import type { WizardAction, WizardState } from "../../lib/wizard-state";

export function WizardClientStep({
  state,
  dispatch,
  available,
  newClientOption,
}: {
  state: WizardState;
  dispatch: Dispatch<WizardAction>;
  available: readonly OAuthClientDTO[];
  /** Task 10 plugs the "register a new client" branch in here. */
  newClientOption?: ReactNode;
}) {
  const id = useId();
  const initial = state.client?.kind === "existing" ? state.client.oauthClientId : undefined;
  const [oauthClientId, setOAuthClientId] = useState(initial);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h3 className="text-lg font-semibold">Cliente OAuth</h3>
        <p className="text-sm text-muted-foreground">
          A conta autentica como este cliente. Só aparecem clientes client_credentials sem conta de serviço.
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-client`}>Usar um cliente OAuth existente</Label>
        <Select value={oauthClientId} onValueChange={setOAuthClientId}>
          <SelectTrigger id={`${id}-client`} aria-label="Cliente OAuth">
            <SelectValue placeholder="Selecionar cliente" />
          </SelectTrigger>
          <SelectContent>
            {available.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.clientName ? `${c.clientName} — ${c.clientId}` : c.clientId}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {available.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Não há clientes disponíveis. Registe um novo cliente.
          </p>
        ) : null}
      </div>
      {newClientOption}
      <div className="flex justify-end">
        <Button
          disabled={!oauthClientId}
          onClick={() =>
            oauthClientId &&
            dispatch({ type: "chooseClient", client: { kind: "existing", oauthClientId } })
          }
        >
          Continuar
        </Button>
      </div>
    </div>
  );
}
```

> The design-system `Select` renders options as `role="option"` inside a portal. If the test's `getByRole("option")` doesn't find them in jsdom (Radix Select needs pointer-event polyfills), add `hasPointerCapture`/`scrollIntoView` stubs at the top of the test file, as other tests in the repo do. Run `grep -rn "hasPointerCapture" src/__tests__` to find one.

- [ ] **Step 4: Identity step** — `wizard/wizard-identity-step.tsx`:

```tsx
"use client";

import type { Dispatch } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Checkbox,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from "@igrp/igrp-framework-react-design-system";
import { useForm } from "react-hook-form";

import { LimitedTextareaField } from "@/components/limited-textarea-field";

import type { WizardAction, WizardState } from "../../lib/wizard-state";
import {
  emptyIdentityValues,
  type ServiceAccountIdentityValues,
  serviceAccountIdentitySchema,
} from "../../service-account-schemas";

export function WizardIdentityStep({
  state,
  dispatch,
  applicationLabel,
}: {
  state: WizardState;
  dispatch: Dispatch<WizardAction>;
  /** "INV — Faturação", or "Sem aplicação". */
  applicationLabel: string;
}) {
  const form = useForm<ServiceAccountIdentityValues>({
    resolver: zodResolver(serviceAccountIdentitySchema),
    defaultValues: state.identity ?? emptyIdentityValues(),
  });

  return (
    <Form {...form}>
      <form
        noValidate
        className="flex flex-col gap-6"
        onSubmit={form.handleSubmit((identity) => dispatch({ type: "setIdentity", identity }))}
      >
        <div className="flex flex-col gap-1.5">
          <h3 className="text-lg font-semibold">Identidade</h3>
          <p className="text-sm text-muted-foreground">Como esta conta aparece aos administradores.</p>
        </div>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome *</FormLabel>
              <FormControl>
                <Input {...field} autoComplete="off" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <LimitedTextareaField id="description" label="Descrição" maxLength={255} />
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">Aplicação</span>
          <span className="font-mono text-sm">{applicationLabel}</span>
          <span className="text-sm text-muted-foreground">Herdada do cliente OAuth.</span>
        </div>
        <FormField
          control={form.control}
          name="active"
          render={({ field }) => (
            <FormItem className="flex items-center gap-3">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={(c) => field.onChange(c === true)} />
              </FormControl>
              <FormLabel className="font-normal">Ativa na criação</FormLabel>
            </FormItem>
          )}
        />
        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => dispatch({ type: "goTo", step: 1 })}>
            Voltar
          </Button>
          <Button type="submit">Continuar</Button>
        </div>
      </form>
    </Form>
  );
}
```

- [ ] **Step 5: Access step** — `wizard/wizard-access-step.tsx`:

```tsx
"use client";

import { type Dispatch, useState } from "react";

import { Badge, Button, IGRPIcon } from "@igrp/igrp-framework-react-design-system";

import { mergeScopedSelection } from "../../lib/service-account-utils";
import type { WizardAction, WizardState } from "../../lib/wizard-state";
import { useRoleDetails } from "../../use-role-details";
import { EffectivePermissionsCard } from "../effective-permissions-card";
import { PermissionPickerDialog } from "../permission-picker-dialog";
import { RolePickerDialog } from "../role-picker-dialog";

export function WizardAccessStep({
  state,
  dispatch,
  onSubmit,
  isSubmitting,
  submitNote,
}: {
  state: WizardState;
  dispatch: Dispatch<WizardAction>;
  onSubmit: () => void;
  isSubmitting: boolean;
  /** What "Criar conta" will do, stated before the click (spec §5.4). */
  submitNote: string;
}) {
  const [picker, setPicker] = useState<"none" | "roles" | "permissions">("none");
  const roleIds = state.roles.map((r) => r.id);
  const roleDetails = useRoleDetails(roleIds);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h3 className="text-lg font-semibold">Perfis e permissões</h3>
        <p className="text-sm text-muted-foreground">O que esta conta pode fazer. Pode alterar depois.</p>
      </div>

      <section aria-labelledby="wz-roles" className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h4 id="wz-roles" className="font-medium">Perfis</h4>
          <Button size="sm" variant="outline" onClick={() => setPicker("roles")}>
            Adicionar perfil
          </Button>
        </div>
        <ul className="flex flex-wrap gap-2">
          {state.roles.map((r) => (
            <li key={r.id}>
              <Badge variant="secondary" className="gap-1 font-mono">
                {r.code}
                <button
                  type="button"
                  aria-label={`Remover perfil ${r.code}`}
                  onClick={() =>
                    dispatch({ type: "setRoles", roles: state.roles.filter((x) => x.id !== r.id) })
                  }
                >
                  <IGRPIcon iconName="X" className="size-3" aria-hidden="true" />
                </button>
              </Badge>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="wz-direct" className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h4 id="wz-direct" className="font-medium">Permissões diretas</h4>
          <Button size="sm" variant="outline" onClick={() => setPicker("permissions")}>
            Adicionar permissão
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Permissões diretas não são revogadas ao remover um perfil. Prefira perfis.
        </p>
        <ul className="flex flex-wrap gap-2">
          {state.permissions.map((p) => (
            <li key={p.id}>
              <Badge variant="secondary" className="gap-1 font-mono">
                {p.name}
                <span className="font-sans text-xs">direta</span>
                <button
                  type="button"
                  aria-label={`Remover permissão ${p.name}`}
                  onClick={() =>
                    dispatch({
                      type: "setPermissions",
                      permissions: state.permissions.filter((x) => x.id !== p.id),
                    })
                  }
                >
                  <IGRPIcon iconName="X" className="size-3" aria-hidden="true" />
                </button>
              </Badge>
            </li>
          ))}
        </ul>
      </section>

      <EffectivePermissionsCard
        roles={roleDetails.roles}
        directNames={state.permissions.map((p) => p.name)}
        isLoading={roleDetails.isLoading}
        isError={roleDetails.isError}
      />

      <div className="flex flex-col gap-3 border-border sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">{submitNote}</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => dispatch({ type: "goTo", step: 2 })} disabled={isSubmitting}>
            Voltar
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? "A criar…" : "Criar conta"}
          </Button>
        </div>
      </div>

      {picker === "roles" ? (
        <RolePickerDialog
          open
          onOpenChange={(o) => !o && setPicker("none")}
          selectedIds={roleIds}
          isSaving={false}
          onConfirm={({ scope, selected }) => {
            const pick = (r: { id: number; code: string; departmentCode: string }) => ({
              id: r.id,
              code: r.code,
              departmentCode: r.departmentCode,
            });
            dispatch({
              type: "setRoles",
              roles: mergeScopedSelection(state.roles, scope.map(pick), selected.map(pick), (r) => r.id),
            });
            setPicker("none");
          }}
        />
      ) : null}
      {picker === "permissions" ? (
        <PermissionPickerDialog
          open
          onOpenChange={(o) => !o && setPicker("none")}
          selectedIds={state.permissions.map((p) => p.id)}
          isSaving={false}
          onConfirm={({ scope, selected }) => {
            const pick = (p: { id: number; name: string; departmentCode: string }) => ({
              id: p.id,
              name: p.name,
              departmentCode: p.departmentCode,
            });
            dispatch({
              type: "setPermissions",
              permissions: mergeScopedSelection(
                state.permissions,
                scope.map(pick),
                selected.map(pick),
                (p) => p.id,
              ),
            });
            setPicker("none");
          }}
        />
      ) : null}
    </div>
  );
}
```

- [ ] **Step 6: Wizard shell** — `wizard/service-account-wizard.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useReducer } from "react";

import {
  Alert,
  AlertDescription,
  Button,
  IGRPIcon,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";

import { useApplications } from "@/features/applications/use-applications";
import { useOAuthClients } from "@/features/oauth-clients/use-oauth-clients";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

import {
  canGoTo,
  initialWizardState,
  stepSummary,
  toAccountInput,
  type WizardStep,
  wizardReducer,
} from "../../lib/wizard-state";
import { useAvailableOAuthClients, useCreateServiceAccount } from "../../use-service-accounts";
import { WizardAccessStep } from "./wizard-access-step";
import { WizardClientStep } from "./wizard-client-step";
import { WizardIdentityStep } from "./wizard-identity-step";

const STEPS: { step: WizardStep; title: string }[] = [
  { step: 1, title: "Cliente OAuth" },
  { step: 2, title: "Identidade" },
  { step: 3, title: "Perfis e permissões" },
];

export function ServiceAccountWizard({ initialOAuthClientId }: { initialOAuthClientId?: string }) {
  const router = useRouter();
  const { igrpToast } = useIGRPToast();
  const [state, dispatch] = useReducer(wizardReducer, initialOAuthClientId, initialWizardState);
  const available = useAvailableOAuthClients();
  const { data: allClients = [] } = useOAuthClients();
  const { data: applications = [] } = useApplications();
  const create = useCreateServiceAccount();

  const existingId = state.client?.kind === "existing" ? state.client.oauthClientId : undefined;
  const existing = allClients.find((c) => c.id === existingId);
  const unavailable =
    !!existingId && !available.isLoading && !available.data.some((c) => c.id === existingId);

  const applicationCode =
    state.client?.kind === "new" ? state.client.values.applicationCode : existing?.applicationCode;
  const appName = applications.find((a) => a.code === applicationCode)?.name;
  const applicationLabel = applicationCode
    ? `${applicationCode}${appName ? ` — ${appName}` : ""}`
    : "Sem aplicação";

  const clientLabel = (id: string) => {
    const c = allClients.find((x) => x.id === id);
    return c ? (c.clientName ? `${c.clientName} · ${c.clientId}` : c.clientId) : id;
  };

  async function submitExisting() {
    if (!existingId) return;
    const result = await create.mutateAsync({ oauthClientId: existingId, ...toAccountInput(state) });
    if (!result.success) {
      igrpToast({ type: "error", title: "Não foi possível criar a conta", description: result.error });
      return;
    }
    igrpToast({ type: "success", title: "Conta de serviço criada", description: result.data.name });
    router.push(`${ROUTES.SERVICE_ACCOUNTS}/${result.data.id}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-5 py-3">
        <Button asChild variant="ghost">
          <Link href={ROUTES.SERVICE_ACCOUNTS}>
            <IGRPIcon iconName="X" aria-hidden="true" />
            Cancelar
          </Link>
        </Button>
        <p className="text-sm text-muted-foreground">Nada é criado até confirmar no último passo.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-[260px_minmax(0,1fr)]">
        <nav aria-label="Passos">
          <ol className="flex flex-col gap-2">
            {STEPS.map(({ step, title }) => {
              const current = state.step === step;
              const reachable = canGoTo(state, step);
              const summary = step < state.step || (reachable && !current)
                ? stepSummary(state, step, clientLabel)
                : undefined;
              return (
                <li key={step}>
                  <button
                    type="button"
                    disabled={!reachable || current}
                    aria-current={current ? "step" : undefined}
                    onClick={() => dispatch({ type: "goTo", step })}
                    className={cn(
                      "flex w-full flex-col items-start gap-0.5 rounded-lg p-3 text-left",
                      current ? "bg-muted" : "hover:bg-muted disabled:hover:bg-transparent",
                    )}
                  >
                    <span className="flex items-center gap-2 font-medium">
                      {summary ? (
                        <IGRPIcon iconName="Check" className="size-4 text-success" aria-hidden="true" />
                      ) : (
                        <span className="text-muted-foreground">{step}.</span>
                      )}
                      {title}
                    </span>
                    {summary ? <span className="text-sm text-muted-foreground">{summary}</span> : null}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="rounded-xl border border-border bg-card p-6">
          {unavailable && state.step !== 1 ? (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>
                Este cliente não pode receber uma conta de serviço: já tem uma, ou não usa client_credentials.
                Escolha outro no passo 1.
              </AlertDescription>
            </Alert>
          ) : null}
          {state.step === 1 ? (
            <WizardClientStep state={state} dispatch={dispatch} available={available.data} />
          ) : state.step === 2 ? (
            <WizardIdentityStep state={state} dispatch={dispatch} applicationLabel={applicationLabel} />
          ) : (
            <WizardAccessStep
              state={state}
              dispatch={dispatch}
              onSubmit={submitExisting}
              isSubmitting={create.isPending}
              submitNote="Cria a conta de serviço ligada ao cliente escolhido."
            />
          )}
        </div>
      </div>
    </div>
  );
}
```

> The step-nav button's accessible name includes the title and the summary (e.g. "Cliente OAuth ETL · etl-runner-m2m"). That's what the test's `/Cliente OAuth.*ETL/` matches. If `text-success` isn't a token in this design system, use `text-success-subtle-foreground` (`pnpm check:ui` will say).

- [ ] **Step 7: Route** — replace `services/new/page.tsx`:

```tsx
import type { Metadata } from "next";

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { ServiceAccountWizard } from "@/features/service-accounts/components/wizard/service-account-wizard";
import { prefetchServiceAccountWizard } from "@/features/service-accounts/prefetch";
import { getQueryClient } from "@/providers/query-client.server";

export const metadata: Metadata = { title: "Nova conta de serviço" };

export default async function NewServiceAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ oauthClientId?: string | string[] }>;
}) {
  const { oauthClientId } = await searchParams;
  const queryClient = getQueryClient();
  await prefetchServiceAccountWizard(queryClient);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ServiceAccountWizard
        initialOAuthClientId={typeof oauthClientId === "string" ? oauthClientId : undefined}
      />
    </HydrationBoundary>
  );
}
```

`services/new/loading.tsx` → `AppCenterLoading description="A preparar o assistente..."`.

> The accounts `layout.tsx` wraps every child in `AccountsTabs`. The wizard therefore renders under the "Contas de Serviço" tab. That's acceptable, and it's what the canvas shows.

- [ ] **Step 8: Run tests, typecheck, UI rules**

Run: `npx vitest run src/__tests__/service-accounts && pnpm typecheck && pnpm check:ui`
Expected: PASS / 0 / 0.

- [ ] **Step 9: Commit**

```bash
git add src/features/service-accounts "src/app/(igrp)/(home)/settings/accounts/services/new" src/__tests__/service-accounts
git commit -m "feat(service-accounts): add create wizard for an existing OAuth client"
```

---

### Task 10: Wizard — new-client path, secret disclosure and partial-failure retry

**Files:**
- Modify: `src/features/oauth-clients/components/oauth-client-form-sections.tsx` (add `grantTypesFixed`)
- Create: `src/features/service-accounts/components/wizard/wizard-new-client-form.tsx`
- Create: `src/features/service-accounts/components/wizard/wizard-result.tsx`
- Modify: `wizard/wizard-client-step.tsx`, `wizard/service-account-wizard.tsx`
- Test: `src/__tests__/service-accounts/components/service-account-wizard-new-client.test.tsx`

**Interfaces:**
- Consumes: `OAuthClientFormSections`, `oauthClientFormSchema`, `toCreateRequest` (Plan 1); `machineClientFormValues` (Task 1); `useCreateServiceAccountWithNewClient`, `useCreateServiceAccount` (Task 3); `SensitiveValueDisclosure`.
- Produces:
  - `OAuthClientFormSections` prop `grantTypesFixed?: boolean`. When true, the grant section renders one locked `client_credentials` card reading "Fixo para contas de serviço." and ignores `lockClientCredentials`.
  - `<WizardNewClientForm form={UseFormReturn<OAuthClientFormValues>} onContinue={(values) => void} />`
  - `type WizardOutcome = { kind: "created"; client: OAuthClientDTO; accountId: string } | { kind: "accountFailed"; client: OAuthClientDTO; error: string }`
  - `<WizardResult outcome onRetry isRetrying onDone />`

- [ ] **Step 1: Write the failing test**

`src/__tests__/service-accounts/components/service-account-wizard-new-client.test.tsx`: reuse the whole mock/setup block from `service-account-wizard.test.tsx` (copy it; tests must be independently readable). Then:

```tsx
import {
  createServiceAccount,
  createServiceAccountWithNewClient,
} from "@/actions/service-accounts";

async function fillNewClientAndIdentity() {
  renderWizard();
  await userEvent.click(screen.getByRole("radio", { name: "Registar um novo cliente OAuth" }));
  await userEvent.type(screen.getByLabelText(/Client ID/), "nightly-etl-m2m");
  await userEvent.type(screen.getByLabelText("Nome *"), "Nightly ETL client");
  await userEvent.click(screen.getByRole("button", { name: "Continuar" }));
  await userEvent.type(screen.getByLabelText("Nome *"), "Nightly Invoice ETL");
  await userEvent.click(screen.getByRole("button", { name: "Continuar" }));
}

describe("ServiceAccountWizard — new client", () => {
  it("locks grant types to client_credentials", async () => {
    renderWizard();
    await userEvent.click(screen.getByRole("radio", { name: "Registar um novo cliente OAuth" }));
    expect(screen.getByText("Fixo para contas de serviço.")).toBeInTheDocument();
    expect(screen.queryByText("authorization_code")).not.toBeInTheDocument();
  });

  it("creates both, then shows the secret once before going to the account", async () => {
    vi.mocked(createServiceAccountWithNewClient).mockResolvedValueOnce({
      success: true,
      data: {
        client: { id: "c9", clientId: "nightly-etl-m2m", clientSecret: "s3cret" } as never,
        account: { id: "sa9", name: "Nightly Invoice ETL" } as never,
      },
    });
    await fillNewClientAndIdentity();
    expect(screen.getByText(/O segredo do novo cliente é mostrado uma única vez/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Criar conta" }));
    const done = await screen.findByRole("button", { name: "Concluir — ver conta" });
    expect(done).toBeDisabled();
    await userEvent.click(screen.getByRole("checkbox", { name: /Guardei o segredo/ }));
    await userEvent.click(done);
    expect(push).toHaveBeenCalledWith("/settings/accounts/services/sa9");
  });

  it("still shows the secret when the account step fails, and retries on that client", async () => {
    vi.mocked(createServiceAccountWithNewClient).mockResolvedValueOnce({
      success: false,
      failedStep: "serviceAccount",
      error: "Boom",
      client: { id: "c9", clientId: "nightly-etl-m2m", clientSecret: "s3cret" } as never,
    });
    vi.mocked(createServiceAccount).mockResolvedValueOnce({
      success: true,
      data: { id: "sa9" } as never,
    });
    await fillNewClientAndIdentity();
    await userEvent.click(screen.getByRole("button", { name: "Criar conta" }));
    expect(await screen.findByLabelText("Client secret")).toHaveValue("s3cret");
    expect(screen.getByText(/A conta de serviço não foi criada/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Tentar criar a conta novamente" }));
    await waitFor(() =>
      expect(createServiceAccount).toHaveBeenCalledWith(
        expect.objectContaining({ oauthClientId: "c9", name: "Nightly Invoice ETL" }),
      ),
    );
    expect(await screen.findByRole("button", { name: "Concluir — ver conta" })).toBeInTheDocument();
  });

  it("sends a duplicate client ID back to step 1 with a field error", async () => {
    vi.mocked(createServiceAccountWithNewClient).mockResolvedValueOnce({
      success: false,
      failedStep: "client",
      status: 409,
      error: "Conflict",
    });
    await fillNewClientAndIdentity();
    await userEvent.click(screen.getByRole("button", { name: "Criar conta" }));
    expect(await screen.findByText("Já existe um cliente com este client ID.")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/__tests__/service-accounts/components/service-account-wizard-new-client.test.tsx`
Expected: FAIL — no "Registar um novo cliente OAuth" radio.

- [ ] **Step 3: `grantTypesFixed` in the form sections** — in `oauth-client-form-sections.tsx`:
  - add `grantTypesFixed?: boolean` to the props (doc comment: `/** Service-account wizard: grant types are exactly client_credentials and cannot change. */`)
  - in the `sec-grants` `FormSection`, render this in place of the `FormField` when `grantTypesFixed` is true:

```tsx
<div className="flex items-start gap-3 rounded-lg border border-foreground p-3.5 ring-1 ring-foreground">
  <IGRPIcon iconName="Lock" className="mt-0.5 size-4" aria-hidden="true" />
  <span className="flex flex-col gap-1">
    <span className="font-mono text-sm font-medium">client_credentials</span>
    <span className="text-sm text-muted-foreground">Fixo para contas de serviço.</span>
  </span>
</div>
```

  Redirect URIs already hide because `authorization_code` is absent.

- [ ] **Step 4: New-client form** — `wizard/wizard-new-client-form.tsx`:

```tsx
"use client";

import { Button, Form } from "@igrp/igrp-framework-react-design-system";
import type { UseFormReturn } from "react-hook-form";

import { OAuthClientFormSections } from "@/features/oauth-clients/components/oauth-client-form-sections";
import type { OAuthClientFormValues } from "@/features/oauth-clients/oauth-client-schemas";

/** The form instance lives in the wizard so a 409 at submit can land on clientId. */
export function WizardNewClientForm({
  form,
  onContinue,
}: {
  form: UseFormReturn<OAuthClientFormValues>;
  onContinue: (values: OAuthClientFormValues) => void;
}) {
  return (
    <Form {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit(onContinue)}
        className="flex flex-col gap-4 rounded-lg border border-border"
      >
        <OAuthClientFormSections mode="create" grantTypesFixed />
        <div className="flex justify-end p-4">
          <Button type="submit">Continuar</Button>
        </div>
      </form>
    </Form>
  );
}
```

- [ ] **Step 5: Client step gains the choice** — in `wizard-client-step.tsx`:
  - add props `mode: "existing" | "new"`, `onModeChange: (m: "existing" | "new") => void`, `newClientForm: ReactNode` (replacing `newClientOption`)
  - wrap the two options in a `RadioGroup` (`value={mode}`, `onValueChange`), with items `RadioGroupItem value="existing"` labelled "Usar um cliente OAuth existente" and `value="new"` labelled "Registar um novo cliente OAuth"
  - when `mode === "existing"`, show the `Select` and the existing "Continuar" footer. When `mode === "new"`, render `newClientForm` (it has its own "Continuar").
  - the `Select` keeps `aria-label="Cliente OAuth"`. Drop its separate `Label`, since the radio item labels the choice.

- [ ] **Step 6: Result screen** — `wizard/wizard-result.tsx`:

```tsx
"use client";

import { useState } from "react";

import {
  Alert,
  AlertDescription,
  Button,
  IGRPIcon,
} from "@igrp/igrp-framework-react-design-system";
import type { OAuthClientDTO } from "@igrp/platform-access-management-client-ts";

import { SensitiveValueDisclosure } from "@/components/sensitive-value-disclosure";

export type WizardOutcome =
  | { kind: "created"; client: OAuthClientDTO; accountId: string }
  | { kind: "accountFailed"; client: OAuthClientDTO; error: string };

/**
 * Shown after any submit that created a new client: its secret exists only
 * here (spec §5.4). A partial failure still discloses it, then offers the retry.
 */
export function WizardResult({
  outcome,
  onRetry,
  isRetrying,
  onDone,
}: {
  outcome: WizardOutcome;
  onRetry: () => void;
  isRetrying: boolean;
  onDone: (accountId: string) => void;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const secret = outcome.client.clientSecret;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h3 className="text-lg font-semibold">
          {outcome.kind === "created" ? "Conta de serviço criada" : "Cliente registado"}
        </h3>
        <p className="text-sm text-muted-foreground">
          O cliente <span className="font-mono text-foreground">{outcome.client.clientId}</span> foi registado.
          Guarde o segredo antes de sair desta página.
        </p>
      </div>
      {secret ? (
        <>
          <div role="note" className="flex gap-3 rounded-lg bg-warning-subtle p-3.5 text-warning-subtle-foreground">
            <IGRPIcon iconName="TriangleAlert" className="mt-0.5 size-4.5 shrink-0" aria-hidden="true" />
            <div className="flex flex-col gap-0.5">
              <strong className="font-semibold">Este segredo não volta a ser mostrado.</strong>
              <span className="text-sm">Nem a si, nem a outro administrador. Guarde-o já no seu gestor de segredos.</span>
            </div>
          </div>
          <SensitiveValueDisclosure label="Client secret" value={secret} onConfirmedChange={setConfirmed} />
        </>
      ) : (
        <Alert variant="destructive">
          <AlertDescription>
            O servidor não devolveu o segredo. Desative este cliente e registe um novo.
          </AlertDescription>
        </Alert>
      )}
      {outcome.kind === "accountFailed" ? (
        <Alert variant="destructive">
          <AlertDescription>
            A conta de serviço não foi criada: {outcome.error} O cliente já existe; pode tentar criar a conta
            novamente com os mesmos dados.
          </AlertDescription>
        </Alert>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Se o segredo for exposto, desative o cliente e registe um novo.
        </p>
        {outcome.kind === "accountFailed" ? (
          <Button onClick={onRetry} disabled={isRetrying}>
            {isRetrying ? "A criar…" : "Tentar criar a conta novamente"}
          </Button>
        ) : (
          <Button disabled={!!secret && !confirmed} onClick={() => onDone(outcome.accountId)}>
            Concluir — ver conta
          </Button>
        )}
      </div>
    </div>
  );
}
```

> `SensitiveValueDisclosure` labels its input with `label`. The test's `getByLabelText("Client secret")` depends on that. The confirmation checkbox resets when the component remounts after a successful retry, so the admin confirms once more. That's acceptable and safer.

- [ ] **Step 7: Wire the wizard** — in `service-account-wizard.tsx`:
  - add state: `const [clientMode, setClientMode] = useState<"existing" | "new">("existing")` and `const [outcome, setOutcome] = useState<WizardOutcome | null>(null)`
  - create the new-client form at wizard level:

```tsx
const clientForm = useForm<OAuthClientFormValues>({
  resolver: zodResolver(oauthClientFormSchema) as Resolver<OAuthClientFormValues>,
  defaultValues: machineClientFormValues(),
  mode: "onBlur",
});
const createWithClient = useCreateServiceAccountWithNewClient();
```

  - pass `mode={clientMode}`, `onModeChange={setClientMode}` and `newClientForm={<WizardNewClientForm form={clientForm} onContinue={(values) => dispatch({ type: "chooseClient", client: { kind: "new", values } })} />}` to `WizardClientStep`
  - route submit by client kind:

```tsx
async function submitNew() {
  if (state.client?.kind !== "new") return;
  const account = toAccountInput(state);
  const result = await createWithClient.mutateAsync({
    client: toCreateRequest(state.client.values),
    account,
  });
  if (result.success) {
    setOutcome({ kind: "created", client: result.data.client, accountId: result.data.account.id });
    return;
  }
  if (result.failedStep === "serviceAccount") {
    setOutcome({ kind: "accountFailed", client: result.client, error: result.error });
    return;
  }
  if (result.status === 409) {
    setClientMode("new");
    dispatch({ type: "goTo", step: 1 });
    clientForm.setError("clientId", { message: "Já existe um cliente com este client ID." }, { shouldFocus: true });
    return;
  }
  igrpToast({ type: "error", title: "Não foi possível registar o cliente", description: result.error });
}

async function retryAccount() {
  if (outcome?.kind !== "accountFailed") return;
  const result = await create.mutateAsync({ oauthClientId: outcome.client.id, ...toAccountInput(state) });
  if (!result.success) {
    setOutcome({ ...outcome, error: result.error });
    return;
  }
  setOutcome({ kind: "created", client: outcome.client, accountId: result.data.id });
}
```

  - `onSubmit={state.client?.kind === "new" ? submitNew : submitExisting}`, `isSubmitting={create.isPending || createWithClient.isPending}`, and `submitNote`:
    - new: `"Regista o cliente OAuth e cria a conta. O segredo do novo cliente é mostrado uma única vez, a seguir."`
    - existing: the Task 9 note
  - when `outcome` is set, render `<WizardResult outcome={outcome} onRetry={retryAccount} isRetrying={create.isPending} onDone={(id) => router.push(`${ROUTES.SERVICE_ACCOUNTS}/${id}`)} />` in place of the step panel, and hide the step nav's buttons (disable them) so the admin can't navigate back into the form with a secret on screen
  - while `outcome` holds an unconfirmed secret, warn on unload, reusing the `beforeunload` effect pattern from `oauth-client-detail.tsx`:

```tsx
const holdingSecret = !!outcome?.client.clientSecret;
useEffect(() => {
  if (!holdingSecret) return;
  const warn = (e: BeforeUnloadEvent) => {
    e.preventDefault();
    e.returnValue = "";
  };
  window.addEventListener("beforeunload", warn);
  return () => window.removeEventListener("beforeunload", warn);
}, [holdingSecret]);
```

  - in the identity step's application label, `applicationCode` for a new client already comes from `state.client.values.applicationCode` (Task 9).
  - Imports to add: `useEffect`, `useState` from react; `zodResolver`; `type Resolver, useForm` from react-hook-form; `oauthClientFormSchema`, `type OAuthClientFormValues`, `toCreateRequest` from `@/features/oauth-clients/oauth-client-schemas`; `machineClientFormValues`; `useCreateServiceAccountWithNewClient`; `WizardNewClientForm`; `WizardResult`, `type WizardOutcome`.

- [ ] **Step 8: Run tests, typecheck, UI rules**

Run: `npx vitest run src/__tests__/service-accounts src/__tests__/oauth-clients && pnpm typecheck && pnpm check:ui`
Expected: PASS / 0 / 0. The OAuth-client form tests must still pass: `grantTypesFixed` defaults to off.

- [ ] **Step 9: Commit**

```bash
git add src/features/oauth-clients/components/oauth-client-form-sections.tsx src/features/service-accounts src/__tests__/service-accounts
git commit -m "feat(service-accounts): register a new client from the wizard with one-time secret and retry"
```

---

### Task 11: OAuth Client pages link to their Service Account

**Files:**
- Create: `src/features/oauth-clients/components/oauth-client-service-account-section.tsx`
- Modify: `src/features/oauth-clients/components/oauth-client-detail.tsx`
- Modify: `src/features/oauth-clients/components/oauth-client-columns.tsx` (client cell)
- Test: `src/__tests__/oauth-clients/components/oauth-client-service-account-section.test.tsx`

**Interfaces:**
- Consumes: `FormSection` (Plan 1), `useLinkedServiceAccount`, `formatAccessSummary`, `ActiveBadge`, `LINK_UNKNOWN_REASON`, `ROUTES.SERVICE_ACCOUNT_NEW`.
- Produces: `<OAuthClientServiceAccountSection clientId={string} savedWithClientCredentials={boolean} />`. It renders only while the form's `grantTypes` include `client_credentials`, and must sit inside the detail's `<Form>`.

- [ ] **Step 1: Write the failing test**

```tsx
import type { ReactNode } from "react";

import { Form } from "@igrp/igrp-framework-react-design-system";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";

import { serviceAccountKeys } from "@/features/service-accounts/query-keys";

vi.mock("@/actions/service-accounts", () => ({
  listServiceAccounts: vi.fn(),
  getServiceAccount: vi.fn(),
  createServiceAccount: vi.fn(),
  createServiceAccountWithNewClient: vi.fn(),
  updateServiceAccountIdentity: vi.fn(),
  setServiceAccountAccess: vi.fn(),
  deleteServiceAccount: vi.fn(),
  setServiceAccountActive: vi.fn(),
}));
vi.mock("@/actions/oauth-clients", () => ({
  listOAuthClients: vi.fn(),
  getOAuthClient: vi.fn(),
  createOAuthClient: vi.fn(),
  updateOAuthClient: vi.fn(),
  deleteOAuthClient: vi.fn(),
  setOAuthClientActive: vi.fn(),
}));

import { OAuthClientServiceAccountSection } from "@/features/oauth-clients/components/oauth-client-service-account-section";

function Harness({ grantTypes, saved }: { grantTypes: string[]; saved: boolean }) {
  const form = useForm({ defaultValues: { grantTypes } });
  return (
    <Form {...form}>
      <OAuthClientServiceAccountSection clientId="c1" savedWithClientCredentials={saved} />
    </Form>
  );
}

function renderSection(accounts: unknown[], grantTypes = ["client_credentials"], saved = true) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
  });
  qc.setQueryData(serviceAccountKeys.list(), accounts);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  render(<Harness grantTypes={grantTypes} saved={saved} />, { wrapper });
}

describe("OAuthClientServiceAccountSection", () => {
  it("links the linked account", () => {
    renderSection([
      { id: "sa1", name: "Nightly", oauthClientId: "c1", active: true, roleIds: [1], permissionIds: [] },
    ]);
    expect(screen.getByRole("link", { name: "Nightly" })).toHaveAttribute(
      "href",
      "/settings/accounts/services/sa1",
    );
    expect(screen.getByText("1 perfil · 0 diretas")).toBeInTheDocument();
  });

  it("offers to create one when none is linked", () => {
    renderSection([]);
    expect(
      screen.getByRole("link", { name: "Criar conta de serviço para este cliente" }),
    ).toHaveAttribute("href", "/settings/accounts/services/new?oauthClientId=c1");
  });

  it("asks to save first when client_credentials is not saved yet", () => {
    renderSection([], ["client_credentials"], false);
    expect(screen.getByText(/Guarde as alterações/)).toBeInTheDocument();
  });

  it("is hidden without client_credentials", () => {
    renderSection([], ["authorization_code"]);
    expect(screen.queryByText("Conta de serviço")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/__tests__/oauth-clients/components/oauth-client-service-account-section.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement** — `oauth-client-service-account-section.tsx`:

```tsx
"use client";

import Link from "next/link";

import { Button, IGRPIcon } from "@igrp/igrp-framework-react-design-system";
import { useFormContext, useWatch } from "react-hook-form";

import { formatAccessSummary } from "@/features/service-accounts/lib/service-account-utils";
import { useLinkedServiceAccount } from "@/features/service-accounts/use-service-accounts";
import { ROUTES } from "@/lib/constants";

import { LINK_UNKNOWN_REASON } from "../lib/oauth-client-utils";
import { ActiveBadge } from "./oauth-client-badges";
import { FormSection } from "./oauth-client-form-sections";

/** Spec §4.5: only while client_credentials is selected. */
export function OAuthClientServiceAccountSection({
  clientId,
  savedWithClientCredentials,
}: {
  clientId: string;
  /** The loaded (saved) client already has client_credentials. */
  savedWithClientCredentials: boolean;
}) {
  const form = useFormContext<{ grantTypes: string[] }>();
  const grantTypes = useWatch({ control: form.control, name: "grantTypes" });
  const linked = useLinkedServiceAccount(clientId);
  if (!grantTypes.includes("client_credentials")) return null;

  return (
    <FormSection
      id="sec-service-account"
      title="Conta de serviço"
      description="A identidade de máquina que autentica com este cliente, com os seus perfis e permissões."
    >
      {linked.account ? (
        <div className="flex items-center gap-3 rounded-lg border border-border p-3.5">
          <IGRPIcon iconName="Bot" className="size-5 text-muted-foreground" aria-hidden="true" />
          <div className="flex flex-1 flex-col gap-0.5">
            <Link
              href={`${ROUTES.SERVICE_ACCOUNTS}/${linked.account.id}`}
              className="font-medium underline"
            >
              {linked.account.name}
            </Link>
            <span className="text-sm text-muted-foreground">
              {formatAccessSummary(
                linked.account.roleIds?.length ?? 0,
                linked.account.permissionIds?.length ?? 0,
              )}
            </span>
          </div>
          <ActiveBadge active={linked.account.active} feminine />
        </div>
      ) : linked.isLoading || linked.isError ? (
        <p className="text-sm text-muted-foreground">{LINK_UNKNOWN_REASON}</p>
      ) : !savedWithClientCredentials ? (
        <p className="text-sm text-muted-foreground">
          Guarde as alterações para poder criar uma conta de serviço para este cliente.
        </p>
      ) : (
        <div className="flex flex-col items-start gap-2">
          <p className="text-sm text-muted-foreground">Este cliente ainda não tem conta de serviço.</p>
          <Button asChild variant="outline">
            <Link href={{ pathname: ROUTES.SERVICE_ACCOUNT_NEW, query: { oauthClientId: clientId } }}>
              Criar conta de serviço para este cliente
            </Link>
          </Button>
        </div>
      )}
    </FormSection>
  );
}
```

- [ ] **Step 4: Wire into the client detail** — in `oauth-client-detail.tsx`, inside `<OAuthClientFormSections …>` and **before** the `sec-record` `FormSection`, add:

```tsx
<OAuthClientServiceAccountSection
  clientId={client.id}
  savedWithClientCredentials={client.grantTypes.includes("client_credentials")}
/>
```

- [ ] **Step 5: Link from the clients list** — in `oauth-client-columns.tsx`, replace the client cell's linked-account block (the `IServiço:` span and the `N/A` fallback) with:

```tsx
{row.original.linkedAccount ? (
  <span className="text-xs text-muted-foreground">
    Conta de serviço:{" "}
    <Link
      href={`${ROUTES.SERVICE_ACCOUNTS}/${row.original.linkedAccount.id}`}
      className="underline"
    >
      {row.original.linkedAccount.name}
    </Link>
  </span>
) : null}
```

and change the `ID:` block to `<span className="font-mono text-xs text-muted-foreground">{row.original.clientId}</span>`, dropping the `pt-2` wrappers and the stray whitespace. This fixes the `IServiço` typo and the blanket "N/A" noise on web clients.

- [ ] **Step 6: Run tests, typecheck, UI rules**

Run: `npx vitest run src/__tests__/oauth-clients src/__tests__/service-accounts && pnpm typecheck && pnpm check:ui`
Expected: PASS / 0 / 0. If `oauth-client-detail.test.tsx` now fails on a missing mock export, add it to that file's `@/actions/service-accounts` mock.

- [ ] **Step 7: Commit**

```bash
git add src/features/oauth-clients src/__tests__/oauth-clients
git commit -m "feat(oauth-clients): link clients to their service account and offer to create one"
```

---

### Task 12: Full verification and manual check

- [ ] **Step 1: Gates**

Run each; all must be clean:

```bash
pnpm typecheck
pnpm test
pnpm check:ui
npx biome check
```

Do not use `pnpm lint` to verify: it rewrites files.

- [ ] **Step 2: Manual check** (dev server via the preview tool, logged in as an admin)
  1. `/settings/accounts/services` lists accounts. The access summary popover names roles. Search, application and status filters work, and the empty state links to the wizard.
  2. Wizard, existing client: only unlinked `client_credentials` clients are offered. The three steps show summaries and link back. "Criar conta" lands on the detail page.
  3. Wizard, new client: grant types are locked. The secret is shown once and "Concluir" waits for the checkbox. A duplicate client ID returns to step 1 with the field error.
  4. Deep link `/settings/accounts/services/new?oauthClientId=<id>` opens at step 2. With a linked client's id, it shows the unavailable warning.
  5. Detail: the effective counts match roles plus direct permissions. Assign and remove a role, and add and remove a direct permission. After each, the page refetches and counts update. Edit identity inline.
  6. Deactivate from the detail page: the client shows *Inativo* on its own page. Reactivate.
  7. Delete with "also delete client" ticked: both disappear. Delete with it unticked: the client remains and its detail page offers "Criar conta de serviço para este cliente".
  8. Client detail with a linked account: the "Conta de serviço" section links to it, and the clients list links the account name.

- [ ] **Step 3: Record open items** — if the backend has answered `ACCOUNTS_BACKEND_REQUESTS.md` §1, replace `pairDirectPermissions` with the returned pairs and delete the "unpaired" branch. Otherwise leave it and note it in the PR description.

If clean, Plan 2 is complete. Secret rotation (`rotateOAuthClientSecret`, SDK beta.17, `ACCOUNTS_BACKEND_REQUESTS.md` §6) is a separate follow-up plan once the backend confirms the endpoint is deployed.
