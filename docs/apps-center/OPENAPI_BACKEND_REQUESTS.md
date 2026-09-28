# OpenAPI spec — requests for the Access Management backend

**From:** Application Center frontend
**About:** `openapi.json` (`/v3/api-docs` on `api-demoigrp.nosi.cv`), SDK `@igrp/platform-access-management-client-ts@0.2.0-beta.18`
**Status:** to send

The frontend is not blocked by any of these: we call the API through the hand-written SDK, which already types these endpoints correctly. The spec is still what Swagger UI shows and what any generated client is built from, and today it describes several endpoints wrongly. Every item below is a springdoc annotation fix on the backend. We do not edit our copy of `openapi.json` by hand: it is replaced wholesale when the SDK is bumped.

Audit-specific questions (enum values, filter semantics) are in `AUDIT_BACKEND_REQUESTS.md` and are not repeated here.

## 1. The spec does not validate *(tools reject it)*

- **`info.version` is missing.** It is required by OpenAPI 3.1. springdoc takes it from `springdoc.info.version` or an `@OpenAPIDefinition(info = @Info(version = …))`.
- **Four pairs of paths are the same template.** OpenAPI treats `{id}` and `{code}` in the same position as one path, so these are duplicates:

  | Path A | Path B |
  |---|---|
  | `GET /api/departments/{id}` | `PUT, DELETE /api/departments/{code}` |
  | `GET /api/applications/{id}` | `PUT, DELETE /api/applications/{code}` |
  | `POST, DELETE /api/departments/{departmentCode}/resources` | `GET /api/departments/{code}/resources` |
  | `POST /api/applications/{applicationCode}/menus` | `GET /api/applications/{code}/menus` |

  The last two only need the path variable renamed to match. The first two are a real ambiguity: `GET /api/departments/ABC` works only because the GET is by id and the PUT is by code. We suggest moving the numeric lookups to `/by-id/{id}`, next to the existing `/by-code/{code}`.

## 2. Lists are typed as one object *(generated clients get the wrong type)*

About 30 GET endpoints that return a list declare `{"type":"object","$ref":"…DTO"}` for their 200 response. Among them: `GET /api/users`, `/api/departments`, `/api/applications`, `/api/departments/{code}/roles`, `/api/users/invite`, every `/api/users/me/*` and `/api/users/{id}/*` list, and every `…/available` list. The POST lookups under `/api/m2m/*` have the same problem.

Only `GET /api/clients` and `GET /api/service-accounts` are declared correctly, as `{"type":"array","items":{…}}`. The cause is usually a `ResponseEntity<List<X>>` hidden behind `@ApiResponse(content = @Content(schema = @Schema(implementation = X.class)))`. Use `array = @ArraySchema(schema = @Schema(implementation = X.class))` instead.

The redundant `"type":"object"` next to `$ref` also goes away with that change.

## 3. 204 responses declare a body

26 operations answer 204 but also declare a response body (`string`, or `boolean` on `deleteRole`). A 204 has no body. They are: every delete, the association endpoints (department ↔ applications, permissions, resources, menus), the favourites and recent endpoints, the `/api/m2m/sync/*` endpoints, and the "no session" 204 of `GET /api/session`, `GET /api/admin/sessions/users/{userId}` and `GET /api/admin/sessions/roles/{roleCode}`.

Declare `@ApiResponse(responseCode = "204", content = @Content)`.

## 4. File upload and download types

- `POST /api/files/public` and `/api/files/private` declare `application/json` with a `binary` field. That should be `multipart/form-data`.
- The report exports (`/api/auth/reports/{settings,audit,access}.{xlsx,pdf,csv}`) return `StreamingResponseBody`, which the spec shows as `{}` under `*/*`. They should declare `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `application/pdf` and `text/csv`, each with `{"type":"string","format":"binary"}`.

## 5. Paging parameters

- The audit and report lists take `pageable` as one **required query object**. Spring actually reads `page`, `size` and `sort`. Annotate the parameter with `@ParameterObject` so the spec lists the three real parameters, all optional.
- `GET /api/admin/sessions` and `/api/admin/sessions/roles/{roleCode}` return a generic `Page` whose items are `{}`. They should return `PageSessionResponseDTO`, which already exists in the spec.
- `GET /api/admin/sessions/statistics` returns a bare `object`. Please give it a DTO.

## 6. Security

- **The public invitation endpoints inherit the global `bearerAuth`.** `POST /api/users/invite/validate-email`, `/validate-otp`, `/response` and `GET /api/users/invite/by-token/{token}` are called by someone who is not signed in yet. They need `security: []` (`@SecurityRequirements()` on the method).
- **`SessionKillRequestDTO.killedBy` comes from the client.** Any caller can write any name into the record of who ended a session. The server should take it from the token and drop the field from the request.
- **Several endpoints do not say which permission they need.** Every other endpoint documents its permission ("This Permission is required: …"), but these have nothing: the Admin Session and Admin User Session endpoints, and the audit and report controllers, including `DELETE /api/auth/audit/purge`.

## 7. Undocumented controllers

The 19 operations under `audit-reports-controller`, `audit-report-archive-controller` and `auth-audit-controller` have no `summary`, no `description` and no named tag. The tag names are springdoc's defaults. Please give them `@Tag` / `@Operation` like the rest. The priority is `purge` and `validate`, which today read as a bare verb with no explanation.

## 8. Consistency *(minor)*

- **Generic `operationId`s:** `findById`, `findById_1`, `update`, `update_1`, `create`, `create_1`, `delete`, `delete_1`, `findAll`, `findAll_1`, `list`, `validate`, `purge`. The `_1` suffixes appear because Service Accounts and OAuth Clients use the same method names. Something like `getServiceAccount`, `getOAuthClient` or `purgeAuditLog` would read better in any generated SDK.
- **Create status codes differ.** `POST /api/clients` answers 200. Service accounts, departments, roles, applications and menus answer 201.
- **Media types are mixed.** Service accounts, OAuth clients, sessions and reports declare `*/*`, and the rest declare `application/json`. The 404 on `PUT /api/users/me` returns an `IGRPUserDTO` schema.
- **Menu permissions don't match.** `DELETE /api/applications/{applicationCode}/menus/{menuCode}` needs `igrp.applications.delete`, while creating and updating a menu needs `igrp.applications.manage`. Is that intended?
- **Wrong summary.** `GET /api/roles/by-code/{code}` has the summary "Get roles by name".
- **Custom fields response is untyped.** `GET /api/applications/{code}/custom-fields` declares a `string` response. It returns the custom-fields map (`object` with `additionalProperties`).
- **Deprecated flat sets in `ServiceAccountDTO`.** `roleCodes` and `permissionNames` are marked deprecated, and `roleIds` and `permissionIds` duplicate the new `roles` and `permissions` pairs. Once every environment returns the pairs, tell us, and we will drop our fallback to the flat sets (`service-account-utils.ts`) before you remove them.
