# Design tokens (CSS variables)

## Where values come from, in order of precedence

1. **Organization Brand** (when `IGRP_BRANDING_ENABLED=true`). Saved in the
   editor at `/settings/customization` and applied by `@igrp/framework-next` as
   a `<style data-igrp-branding>` at the top of `<body>`, with selectors
   `html:root:not(.dark)` (light) and `html:root.dark` (dark). Specificity
   (0,2,1) beats every `:root` / `.dark` rule below, whatever the stylesheet order.
2. **This app's local tokens** in `src/styles/app-center.css` (`:root` and
   `.dark`): the app-tier Tokens and a deliberate AA override of `--ring`.
3. **Design-system tokens** from `@igrp/igrp-framework-react-design-system/tokens`,
   imported in `src/styles/globals.css`.

A Token the Brand leaves unset keeps its value from 2 or 3 (its Default).

## Catalogs the editor offers

- **Core** (50): `IGRP_BRANDING_CORE_TOKENS` in `@igrp/framework-next-ui`,
  grouped Brand, Surfaces, Text, Status, Sidebar, Charts, Other. `--radius` is
  not editable.
- **App tier** (23): `src/features/branding/app-tokens.ts` — subtle status
  pairs, app tiles, `--favorite` and the scrollbar. Sibling apps ignore them.

The editor's placeholders come from `src/features/branding/token-defaults.ts`,
generated from 2 and 3 by `pnpm branding:defaults`. Re-run it after a
design-system bump or an edit to `app-center.css`; the catalog test fails
while it is stale.

## Rules for saved values

The editor saves only concrete colours (hex, `rgb`, `hsl`, `oklch`, `oklab`,
`lab`, `lch`, named) and stores them as `oklch(L C H[ / A])`. Logos must be
uploaded through the editor (MinIO). See the
[design spec](superpowers/specs/2026-10-13-platform-branding-design.md) §9.

## Changing a Default

Edit `app-center.css` (app tier, `--ring`) or the design system, then run
`pnpm branding:defaults`. Keep the AA contrast notes in `app-center.css`.
