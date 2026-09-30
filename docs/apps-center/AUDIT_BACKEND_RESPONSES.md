# Audit Reports — answers to the Application Center frontend

**From:** Access Management backend
**Re:** `AUDIT_BACKEND_REQUESTS.md`
**Against:** `version/0.2.0-beta` (backend), `@igrp/platform-access-management-client-ts@0.2.0-beta.17`

Every answer below was checked against the code on `version/0.2.0-beta`, not against the
guide. Where the guide and the code disagree, the code wins and the guide is listed as a
correction at the end.

**Short version:** your reading is right on 1, 2, 3, 5, 7 and 8. It is wrong on 4 in a way
that matters for your Role filter, and 6 is safe — the token carries `igrp.audit.view`
verbatim, with one caveat about active roles.

---

## 1. What writes Access Period events?

**Nothing does, today — and nothing is scheduled.** Ship the notice.

The write path exists and is complete: `AuditReportContext` carries `periodStart`,
`periodEnd`, `authorizedBy` and `operationState`, and `SecurityAuditServiceImpl`
persists all four. But there is exactly **one** call site in the whole codebase that
supplies a populated context, and it sets `status` only:

```java
// SecurityAuditServiceImpl:265
AuditReportContext.builder().status(status).build()
```

Every other producer calls the 3-arg `logEvent(...)`, which passes
`AuditReportContext.empty()`. So the four fields are null on **every** row — there is no
producer to point you at and no dated commitment in the plan. The migration adds the
`period_start` / `period_end` columns and stops there.

**Your plan is the correct one:** dismissible notice, four fields as "—".

Two corrections to the premise, both in your favour:

- They are null on **every** row, not just authentication rows. Nothing writes them.
- **`module` and `accessRole` are populated** — they are derived when the caller doesn't
  supply them (`module` from the request path, `accessRole` see §4). Don't render those
  two as "—"; they have real values.

Also worth knowing: the Audit Report applies **no event-type restriction**. It returns
every audit row in the range — settings changes and user-management events included, not
just authentication. (Only the Settings report restricts its population, via
`settingsArea IS NOT NULL`.) So the Access Period tab is currently showing you the whole
log through a period-shaped projection. That is the strongest argument for the notice.

## 2. How does the date filter match a period?

**Current behaviour: no overlap.** Your example row is **not** returned.

Both bounds filter the event's own `timestamp` column and nothing else:

```java
// SecurityAuditSpecificationBuilder:41-48
cb.greaterThanOrEqualTo(root.get("timestamp"), start)
cb.lessThanOrEqualTo(root.get("timestamp"), end)
```

`period_start` / `period_end` are **never consulted by any filter** — they are projected
into the response and that is all. A period running 1–10 Sep is returned only if the
event's timestamp falls inside 5–6 Sep.

**Can overlap be supported? Yes**, and it is a small change — one predicate pair in
`ReportSpecifications.audit`. It is not worth doing before §1 produces data, and when we
do it we have to decide what happens to rows with null periods. The rule we would propose:

```
(period_start <= :end AND period_end >= :start)   -- true period overlap
OR (period_start IS NULL AND timestamp BETWEEN :start AND :end)   -- fall back to the event
```

so the tab keeps working for un-periodised rows instead of going blank. Tell us if you
want different fallback semantics — this is easier to settle now than after you build the
UI around it.

**Your label "Eventos registados entre…" is exactly accurate.** Keep it until we confirm
the switch.

## 3. What are the values of `operationState`?

**There are none to publish.** It is `VARCHAR(50)`, free text, with no enum, no
validation and — per §1 — no writer:

```java
/** Audit report: free-text operation state (e.g. "Completed"). */
@Column(name = "operation_state", length = 50)
private String operationState;
```

Publishing a list now would mean inventing one, and you would build a filter against
values that no code produces. **Keep it as a column only.** When §1 lands we will define
the value set as a real enum at the same time and ship it in both SDKs alongside
`AuditStatus` — the enum and the first producer should arrive together.

## 4. Which Role does `role` / `accessRole` carry?

**Your assumption is wrong, and this one changes your design.**

It is not the Role the access check was evaluated against. It is **every role code the
principal holds**, comma-joined, alphabetically sorted, truncated to 255 characters:

```java
// SecurityAuditContextProvider:170-189
authentication.getAuthorities().stream()
    .filter(a -> a.startsWith("ROLE_"))
    .map(a -> a.substring(5))
    .distinct().sorted()
    .collect(Collectors.joining(", "));
```

The authorities come from **all active role assignments** for the user, not the active
role. So a denial row for a three-role user reads `"ADMIN, AUDITOR, USER"` in a single
`role` field.

Three consequences for your filter:

1. The filter is `LIKE %value%` on that joined string, so filtering `role=ADMIN` means
   **"held this role at the time"**, not "acted as this role". Given the data, that is
   the only honest label for it.
2. `role=USER` also matches a row whose list contains `POWER_USER`. Substring collisions
   across role codes are real.
3. At 255 characters the string is **truncated mid-code**, so a user with many roles has
   roles that can never be matched.

We think this is a defect rather than a design: the useful value is the **active role**
(the `selectedRole` claim), which is what the authorization check actually evaluates, and
it is what makes your original assumption true. Changing it is a small fix, but it changes
the meaning of existing rows, so we want your call before doing it. Our recommendation:
write the active role into `access_role`, and if the full set is worth keeping, add a
separate column rather than overloading this one.

On `perm-fdl-apps-center`: confirmed, that is a **role code**. The column is populated
only from role codes, so whatever it looks like, it came from a role.

## 5. `eventType` and `category` values

Both are real server-side enums, so here is the complete list. **`AuditEventType`** (33):

```
LOGIN_SUCCESS  LOGIN_FAILURE  LOGOUT  TOKEN_REFRESH
SESSION_CREATED  SESSION_REPLACED  SESSION_LIMIT_EXCEEDED  SESSION_REFRESHED
SESSION_REVOKED  SESSION_EXPIRED  SESSION_FORCED_REAUTH
TOKEN_ACCEPTED  TOKEN_REJECTED  TOKEN_EXPIRED  TOKEN_ISSUED  TOKEN_REVOKED
USER_CREATED  USER_UPDATED  USER_INACTIVATED  USER_ACTIVATED
PASSWORD_CHANGED  ACCOUNT_LOCKED  ACCOUNT_UNLOCKED
PROFILE_ACTIVATED  PROFILE_DEACTIVATED
ROLE_ASSIGNED  ROLE_REMOVED  ROLE_EXPIRED
PERMISSION_GRANTED  PERMISSION_REVOKED
ACCESS_GRANTED  ACCESS_DENIED  SYSTEM_CONFIGURATION_CHANGED
```

**`AuditCategory`** (6): `AUTHENTICATION` `AUTHORIZATION` `SESSION` `PRIVILEGE`
`USER_MANAGEMENT` `SYSTEM`

For completeness, **`AuditStatus`** has **five** values, not the four the guide documents
for the report DTOs: `SUCCESS` `ACCESS_DENIED` `UNUSUAL_IP` `PENDING` **`ERROR`**. The TS
SDK's `AuditStatus` should be checked against that.

We will add `AuditEventType` and `AuditCategory` as SDK enums — say the word and they go
into the next TS and Java bump.

> **Trap in your "Outro…" plan.** An unrecognised value is **silently dropped**, not
> rejected: `parseEnum` returns empty and the predicate is simply never added
> (`GetSecurityAuditLogsQueryHandler:53-60`). So `eventType=TYPO` returns the **full
> unfiltered page**, looking like "no filter applied" rather than an error or an empty
> result. Validate against the list above client-side before sending, or the free-text
> box will quietly mislead operators. We can make the API 400 on an unparseable value
> instead — tell us if you want that, it is a behaviour change for any existing caller.

## 6. How does `igrp.audit.view` appear in the access token?

**Verbatim — `igrp.audit.view`. Your page guard will work.**

The claim is built from raw permission names with no qualification of any kind:

```java
// ClaimsEnrichmentService:377-380
perms.stream().map(PermissionEntity::getName)
     .filter(code -> code != null && !code.isBlank())
     .collect(Collectors.toSet());
```

The permission is declared as `@IgrpPermission(name = "igrp.audit.view")`, so that exact
string is what lands in the array. Access Management never prefixes a department onto a
permission name. The `DEPT_IGRP.manage_access` you are seeing is a permission whose
**catalogued name literally is that string** — some application synced it that way — not
AM qualifying it at issue time.

**One caveat that will bite you.** The `permissions` array is built from the user's
**active role only**:

```java
if (user.isEmpty() || user.get().getActiveRole() == null) return Collections.emptySet();
RoleEntity role = user.get().getActiveRole();
```

So a user who holds `igrp.audit.view` through a role that is not currently active gets an
empty-handed token and a 403 from your guard — correctly, but confusingly, since the
admin granting the permission will swear they granted it. Users with no active role at all
get **no permissions whatsoever**. Worth a specific error message on your side
("switch profile"), rather than the generic access-denied.

## 7. Cross-department Role list

**Confirmed, no such endpoint exists.** The complete role surface is:

| Endpoint | Scope |
|---|---|
| `GET /api/roles/by-code/{code}?departmentCode=` | one role, department required |
| `GET /api/roles/{id}` | one role by id |
| `GET /api/departments/{code}/roles` | per department |

Nothing lists roles across departments. **Your exact-match text field is the right
interim** — and given §4, note that whatever the picker eventually offers, the filter
still matches against a joined list.

We can add `GET /api/roles` (paginated, optional `departmentCode`, `q` search) and put it
in both SDKs. It is a contained addition; we just need to agree the permission it sits
behind — `igrp.departments.view` is what the existing role endpoints use, which may be
wrong for a global list.

## 8. Guide corrections

**All four confirmed.** Verified in `@igrp/platform-access-management-client-ts@0.2.0-beta.17`:

- `FileClient.getFileUrl(filePath)` — correct, there is no `getUrl`.
- `FileUrlDTO` is `{ url: string; expiration: Date }` — correct.
- `AccessManagementClient` exposes `files`, `authAudit`, `auditReports` — all three
  confirmed as public readonly fields.

We will fix `AUDIT_REPORTS_INTEGRATION_GUIDE.md` on our side so the next reader doesn't
repeat the work. One more correction we found while checking, which is **in the guide's
favour** — §9.4's claim about date handling is right, and worth restating because the
asymmetry is easy to get backwards:

- `/api/auth/reports/*` — both dates **required**; omitting either is a 400 from the
  binder.
- `/api/auth/audit` — both dates **optional**; only an *inverted* pair (`start > end`)
  is rejected, on both surfaces.

---

## What we need back from you

| # | Decision | Blocks |
|---|---|---|
| 4 | Change `access_role` to the active role? (our recommendation: yes) | your Role filter's meaning |
| 2 | Confirm the overlap + null-fallback rule | Access Period tab, once §1 lands |
| 5 | Want a 400 on unparseable `eventType`/`category` instead of silent pass-through? | your "Outro…" field |
| 1 | Access Periods need a product owner and a date — we can't answer this one from code | the whole tab |

Items we can ship without further input, on your word: the `AuditEventType` /
`AuditCategory` SDK enums (§5), and `GET /api/roles` (§7).
