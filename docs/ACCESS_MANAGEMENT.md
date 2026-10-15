# Access Management Sync

When `IGRP_SYNC_ACCESS=true` and preview mode is off, the framework authenticates to the Access Management API with OAuth2 `client_credentials`:

1. `POST {IGRP_ACCESS_MANAGEMENT_API}/oauth2/token` with `Basic base64(IGRP_M2M_CLIENT_ID:IGRP_M2M_CLIENT_SECRET)`
2. The bearer token is cached until expiry and shared across the three sync phases (application metadata, route resources, on-code menus)

Sync runs post-response via `after()`, so it never blocks the first request. The four M2M variables are validated at render time — misconfiguration surfaces as `IgrpConfigError` (`IGRP_ACCESS_MANAGEMENT_CONFIG_MISSING`) in `global-error.tsx`. Enabling `IGRP_SYNC_ON_CODE_MENUS` pushes `src/temp/menus/menus.ts` and **overwrites** the AM-side menus.

For the required M2M environment variables, see [ENVIRONMENT.md](ENVIRONMENT.md#access-management-m2m-required-when-igrp_sync_accesstrue).
