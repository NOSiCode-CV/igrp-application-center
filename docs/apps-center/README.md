# Apps Center — Access Management API

Source of truth for the backend this app talks to through
[`@igrp/platform-access-management-client-ts`](https://www.npmjs.com/package/@igrp/platform-access-management-client-ts).

- [`openapi.json`](./openapi.json) — iGRP Access Management API, OpenAPI 3.1
  (111 paths, 149 operations, 51 schemas).
- Base URL: `https://api-demoigrp.nosi.cv/igrp-access-management`
- Auth: `bearerAuth` — HTTP Bearer with a JWT access token.

Tags covered: Users, Roles, Department, Application, Files, GlobalConfiguration,
OAuth Clients, Service Accounts, M2m, Session Management, Admin Session
Management, Admin User Session Management, Authorization, plus the audit and
audit-report controllers.

Keep this file in sync with the SDK version pinned in `package.json`: when the
SDK is bumped, replace `openapi.json` with the spec that generated it.
