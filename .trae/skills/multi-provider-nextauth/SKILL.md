---
name: "multi-provider-nextauth"
description: "Integrates NextAuth with dynamic Keycloak or Autentika provider selection. Invoke when auth-options, auth helpers, login flows, or auth env config must support multiple OIDC providers."
---

# Multi-Provider NextAuth

Use this skill when working on `igrp-application-center` authentication and the app must support both Keycloak and Autentika.

## Reference

- `references/multi-provider-nextauth-reference.md`

## Implementation Rules

- Use framework exports from `@igrp/framework-next-auth`
- Keep provider choice registry-based
- Do not use `if/else` for selecting the active provider
- Require only the environment variables for the active provider
- Use framework provider id constants in login flows
