# Multi-Provider NextAuth Reference

## Goal

Integrate `igrp-application-center` with the framework-auth provider registry so the app supports both:

- `keycloak`
- `autentika`

The active provider must be selected dynamically from environment variables.

## Required Integration Rules

- Import provider helpers from `@igrp/framework-next-auth`
- Import provider id constants from the framework library where `signIn` or provider ids are used
- Use `KeycloakProvider` only through the dynamic framework registry
- Use `AutentikaProvider` only through the framework library
- Do not implement provider selection with `if/else`

## Active Provider Variable

Use:

```text
AUTH_PROVIDER=keycloak
```

or

```text
AUTH_PROVIDER=autentika
```

## Required Environment Variables

For `keycloak`:

- `KEYCLOAK_CLIENT_ID`
- `KEYCLOAK_CLIENT_SECRET`
- `KEYCLOAK_ISSUER`

For `autentika`:

- `AUTENTIKA_CLIENT_ID`
- `AUTENTIKA_CLIENT_SECRET`
- `AUTENTIKA_HOST`
- `AUTENTIKA_TENANT_NAME`

Optional:

- `AUTENTIKA_SCOPES`

## Target Files

- `src/lib/auth-options.ts`
- `src/lib/auth-helpers.ts`
- `src/app/(auth)/login/page.tsx`
- `.env.example`

## Implementation Pattern

- Resolve the active provider from framework helpers
- Build the provider array dynamically from the framework registry
- Reuse generic OIDC helpers for refresh and logout/revocation
- Validate only the required variables for the active provider
