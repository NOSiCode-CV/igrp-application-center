# Accounts (OAuth Clients & Service Accounts) — questions and requests for the Access Management backend

**From:** Application Center frontend
**About:** `CLIENT_AND_SERVICE_ACCOUNT_MANAGEMENT_SPEC.md` (§7 lists the agreed backend gaps), SDK `@igrp/platform-access-management-client-ts@0.2.0-beta.17`, `docs/apps-center/openapi.json`
**Status:** to send

The OAuth Clients section (`/settings/accounts/clients`) has shipped. Next we are building the Service Accounts section (`/settings/accounts/services`): a list, a detail page where roles and direct permissions are added and removed, and a create wizard. The items below block or shape specific parts of it. Terms follow our glossary (`CONTEXT.md`): an **OAuth Client** is the registered API consumer; a **Service Account** wraps exactly one `client_credentials` OAuth Client and adds roles and **Direct Permissions**.

We checked beta.17 against beta.16. `ServiceAccountDTO` and `ServiceAccountRequestDTO` are unchanged. The only addition is `OAuthClient.rotateOAuthClientSecret` (item 6).

## 1. Matching `permissionIds` to `permissionNames` *(blocks removing a direct permission)*

`ServiceAccountDTO` returns direct permissions as two separate sets: `permissionIds: number[]` and `permissionNames: string[]`, both `uniqueItems: true` in the OpenAPI (Java `Set`s). `PUT /api/service-accounts/{id}` replaces the whole `permissionIds` set. So to remove one permission, the page has to know which id belongs to the name it shows.

- Nothing in the contract says item *n* of `permissionIds` is item *n* of `permissionNames`, and no endpoint looks up a permission by id.
- **Request:** return the pairs directly, e.g. `permissions: [{ id, name, departmentCode }]`, and keep the flat lists for compatibility.
- **Or confirm** that both lists always come from the same collection in the same iteration order. If so, we can pair them by position.
- Roles have the same shape (`roleIds` / `roleCodes`). We can work around that by calling `getRoleById` for each role, but that costs one request per role. A `roles: [{ id, code, departmentCode }]` list would remove those calls.



## 2. Which department does a direct permission belong to? *(shapes the permission picker)*

Permissions can only be listed per department (`GET /api/departments/{code}/permissions`). Our picker is department-scoped, and it qneeds to show which permissions the account already has in the selected department. `ServiceAccountDTO` doesn't say which department each direct permission comes from. Item 1's `departmentCode` would answer this.

## 3. Which roles and permissions may a Service Account receive?

- Can a Service Account hold roles and permissions from **any** department, or only from departments tied to its application?
- What does tqhe PUT/POST return for an id that doesn't exist or isn't allowed (400, 404, 422)? Is the whole request rejected, or are bad ids silently dropped?



## 4. Service Account endpoints declare no permission *(spec §7.2)*

Each `/api/clie/nts/*` operation states its permission (`igrp.client.view`, `igrp.client.update`, `igrp.client.delete`). None of the `/api/service-accounts/*` operations state one, so as far as the contract shows, any valid token can list, create, change or delete Service Accounts.

- Please add `igrp.service_account.{list,view,create,update,delete}` (or confirm the real codes).
- Please confirm/ the codes for `GET /api/clients` (list) and `POST /api/clients` (create), which the OpenAPI doesn't state either.

/

## /5. Delete and create edge cases

- **Deleting an OAuth Client that still has a Service Account.** Is it rejected (we'd expect 409), cascaded, or allowed, leaving the account orphaned? Our UI already blocks this, but the backend should too (spec §7.6).
- **qA second Service Account for the same OAuth Client.** What does `POST /api/service-accounts` return? We'd expect 409; our UI assumes 1:1 (spec §7.3).
- **DELETE status.** The SDK comments say `204`; the OpenAPI documents `200` for both `DELETE /api/clients/{id}` and `DELETE /api/service-accounts/{id}`. Which is correct?



## 6. Secret rotation — new in beta.17 *(re-opens spec §4.6)*

`rotateOAuthClientSecret(id)` → `POST /api/clients/{id}/rotate-secret` resolves the gap our spec ranked most important. Before we build the UI:

- Is it deployed, and in which environments? It is not in our copy of `openapi.json`.
- Which permission does it require (`igrp.client.update`, or a new code)?
- Dqoes it work on an **inactive** client, and on a client with a linked Service Account? We'd expect yes to both.
- Error cases: 404 for an unknown id; anything else (e.g. rate limiting)?



## 7. Field limits

`ServiceAccountRequestDTO.name` only has `minLength: 1`, and `description` has no limit. Please state the maximum lengths the database enforces. Until then we cap `name` at 255 and `description` at 255, so a save can't fail on length.

## 8. Timeline for the spec §7 follow-ups

The Service Accounts section works around these today. Please give a rough order or timeline so we know which workarounds to plan to remove:

- **Cascade activation** (§7.4). Today we send two PUTs in sequence, and a failure between them leaves the account and its client out of sync.
- **Effective permissions on** `ServiceAccountDTO` (§7.5). Today the detail page makes one request per role, and the list can't show effective permission counts.
- **Cascade delete** (§7.6) and **atomic create** (§7.7). Both are two calls from our side today, with a partial-failure path in each.

