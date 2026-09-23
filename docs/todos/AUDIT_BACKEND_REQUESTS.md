# Audit Reports — questions and requests for the Access Management backend

**From:** Application Center frontend
**About:** `AUDIT_REPORTS_INTEGRATION_GUIDE.md`, SDK `@igrp/platform-access-management-client-ts@0.2.0-beta.16`
**Status:** to send

We are building the audit screen (`/settings/audit`) against the three Reports, Exports, Archives and the raw log. The items below block or shape specific parts of it. Terms follow our glossary: the API's *Audit Report* is what we call the **Access Period Report** — one row per Access Period (a time-limited authorisation for one user to reach one module, authorised by one user).

## 1. What writes Access Period events? *(shapes the Access Period tab)*

The Audit Report is period-oriented: `startDate`, `endDate`, `authorizedBy` and `operationState` are the point of it. But §9.5 of the guide says all four are always null on authentication rows — which are the only rows the report currently returns.

- Which flow will write Audit Events with these fields populated, and roughly when?
- Until then we ship the tab with a dismissible notice that access periods are not yet being recorded, and render the four fields as "—".

## 2. How does the date filter match a period? *(correctness of the Access Period tab)*

An Access Period runs 1–10 Sep; an admin filters `startDate=5 Sep`, `endDate=6 Sep`. Is it returned?

- **We need overlap semantics** (`period.start <= filter.end AND period.end >= filter.start`) — that is the only rule that answers "who had access on 5 Sep".
- The documented `sort=timestamp,desc` suggests the filter currently applies to the event's own timestamp instead. Please confirm the current behaviour and whether overlap can be supported.
- Until confirmed, our date picker is labelled "Eventos registados entre…".

## 3. What are the values of `operationState`?

It is a plain string in `AuditReportRowDTO` and `AuditReportFilters`. Please publish the allowed values (ideally as an SDK enum, like `AuditStatus`). We show it as a column only and add a filter once the values are known.

## 4. Which Role does `role` / `accessRole` carry?

When a user holding several Roles is denied, the Access Report row shows one `role`. We assume it is **the Role the access check was evaluated against**, not an arbitrary Role the user holds. Please confirm — it decides what filtering by Role means.

(The example value `perm-fdl-apps-center` reads like a permission code; we understand it is a Role whose name happens to look like one.)

## 5. Publish the `eventType` and `category` values for the raw log

`GET /api/auth/audit` filters by `eventType` and `category`, both plain strings. The guide mentions `LOGIN_SUCCESS`, `ACCESS_DENIED`, `TOKEN_ISSUED`, `SESSION_*`, `SYSTEM_CONFIGURATION_CHANGED` but no complete list. Please publish both as SDK enums. Until then we offer the known values plus a free-text "Outro…".

## 6. Minor — guide corrections (already applied on our copy)

- The file client method is `FileClient.getFileUrl`, not `getUrl`; `FileUrlDTO.expiration` is typed `Date`.
- The report and file clients are reachable from `AccessManagementClient` as `auditReports` / `files` / `authAudit`.
