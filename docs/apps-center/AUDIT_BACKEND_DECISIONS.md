# Audit Reports — Application Center decisions

**From:** Application Center frontend
**Re:** `AUDIT_BACKEND_RESPONSES.md` ("What we need back from you")
**Status:** to send

Thank you — the code-level answers saved us building on two wrong assumptions (§4 and the Access Period population). Decisions and go-aheads below, in the order of your table.

## §4 — `access_role`: yes, write the Active Role, and keep the full set separately

- Write the **Active Role** (`selectedRole`, the role the authorisation check evaluated) into `access_role`.
- Add a **separate column** for the full set of roles held at the time (your current joined value). We'd like it in the report DTOs as its own field (e.g. `rolesHeld`) on both the Audit and Access reports.
- Once `access_role` holds one code, please make the `role` / `accessRole` filter **exact-match** instead of `LIKE %value%`, so `USER` no longer matches `POWER_USER`. If the held-roles column is filterable, `contains` there is fine — it is a list.
- Existing rows: leave them as they are (don't backfill or rewrite audit evidence). We will display whatever each row recorded.
- Until this ships, the portal labels the column and filter **"Perfis detidos"** with a "contains" hint, which matches today's data.

Please tell us the SDK version that carries the change so we can switch the labels back to "Perfil".

## §2 — Overlap rule: accepted, with one addition for open periods

```
(period_start <= :end AND (period_end IS NULL OR period_end >= :start))   -- overlap; null end = still open
OR (period_start IS NULL AND timestamp BETWEEN :start AND :end)           -- no period: fall back to the event
```

A `period_end` of null means the authorisation is still open; without that clause, currently-active access periods would disappear from "who has access now". No need to ship before §1 produces data — but please ship the rule together with the first producer.

## §5 — Yes to a 400 on unparseable `eventType` / `category`; yes to the SDK enums

- Please make `GET /api/auth/audit` return **400** on an unknown `eventType` or `category`. Silent pass-through returns the whole log, which any caller will misread.
- Please ship `AuditEventType` and `AuditCategory` as SDK enums (TS and Java) in the next bump. Our Registo tab will use fixed selects from those enums — we are dropping the free-text "Outro…" field.

## §1 — Access Periods: product owner to be named; we ship the tab with a notice

This one isn't ours to date from code. We'll bring it to the product side and come back with an owner. Meanwhile we ship the Access Period tab with a notice that states what it currently shows — every audit event in the range, with the period fields not yet recorded — so nobody reads today's rows as authorisations.

## §7 — Yes to `GET /api/roles`

- Paginated, optional `departmentCode` and `q`, as you proposed; in both SDKs.
- Permission: allow **either `igrp.audit.view` or `igrp.departments.view`**. Anyone who can read the audit log already sees every role code in it, so listing them discloses nothing new, and audit viewers need it to filter by role.

## §6 — Noted

Thanks for the Active Role caveat. We are adding a specific 403 on the audit page that tells a user holding other roles to activate the right one on their profile and sign in again.

## SDK

We are moving the portal to `@igrp/platform-access-management-client-ts@0.2.0-beta.17` now.
