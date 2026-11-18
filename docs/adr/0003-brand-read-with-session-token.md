# 0003. Brand read with the user's session token (pointer)

- Status: accepted
- Date: 2026-10-13

The organization Brand is read by every framework app with the signed-in user's
access token and a per-process cache, not with the machine (M2M) token, because
Access Management rejects M2M tokens outside `/api/m2m/**`.

The full decision, the alternatives and the consequences live in the framework
repository: `igrp-framework-nextjs/docs/adr/0001-brand-read-with-session-token.md`.

This repository owns the editor and the backend request that would lift the
restriction (section 14 of [the branding design spec](../superpowers/specs/2026-10-13-platform-branding-design.md)).
