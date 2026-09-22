---
target: src/app/(igrp)/(home)/settings
total_score: 19
p0_count: 2
p1_count: 3
timestamp: 2026-09-21T13-33-55Z
slug: src-app-igrp-home-settings
---
Method: dual-agent (A: design review · B: detector + grep evidence, run isolated and in parallel)

Target: `src/app/(igrp)/(home)/settings` — the shell, the index, and the applications / users / departments sub-surfaces.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Centre-of-content spinners on three sub-surfaces despite real skeletons existing (`app-list.tsx:36`, `dept-list-tree.tsx:116`, `user-role-list.tsx:63`); `user-detail-view.tsx:12` returns `null` while loading — a white screen. The global reduced-motion reset sets `animation-iteration-count: 1`, so every `animate-spin` freezes after one turn for reduced-motion users. |
| 2 | Match System / Real World | 2 | `app-details.tsx:226-228` prints the raw enum `ACTIVE` where the grid one click earlier said "Ativo". "Perfis (Roles)" (`dept-detail.tsx:35`) teaches the jargon rather than removing it. |
| 3 | User Control and Freedom | 1 | `user-role-list.tsx:157-167` revokes a production role on one unconfirmed click, no undo. No back link from any sub-surface. |
| 4 | Consistency and Standards | 1 | Three confirmation patterns, one form at two dialog widths, one `modal={false}` outlier, `Button`/`IGRPButton` mixed, pt-PT and pt-BR mixed within a single navigation. |
| 5 | Error Prevention | 2 | Type-the-name gating is genuinely good, but it guards the *reversible* action while role revoke and permission toggles are unguarded. |
| 6 | Recognition Rather Than Recall | 2 | Seven unlabelled tabs with no counts (`user-details-tabs.tsx:74-82`); raw `parentCode` shown under "Associados:"; unnamed ellipsis triggers in both users tables. |
| 7 | Flexibility and Efficiency | 2 | No bulk operations in the users table though the checkbox pattern exists three files away. Filter state not in the URL; tab state in the URL on departments but not on users. |
| 8 | Aesthetic and Minimalist Design | 3 | Restrained and coherent. But email is printed twice per row (`users-columns.tsx:119,130`) and `user-details-header.tsx:22` renders a purposeless element. |
| 9 | Error Recovery | 2 | `StatusAwareError`/`InlineError` are well built, but `title: "Erro"` appears four times, and `settings/users/[id]/` has no `error.tsx` so one broken user reports the whole list as broken. |
| 10 | Help and Documentation | 2 | `dept-empty-state.tsx:10-29` is a model empty state. Nothing else explains the perfil/permissão/menu model an admin must hold in their head. |
| **Total** | | **19/40** | **Weak — a strong token layer under a drifting interaction layer** |

## Anti-Patterns Verdict

**Deterministic scan**: `detect.mjs` returned **exit 0, zero findings across 136 files** — no gradient text, no glassmorphism, no side-stripe borders, no ghost-card shadow pairing, no over-rounded cards, no decorative grid or stripe backgrounds. Zero hardcoded hex/rgb (the token layer is respected), zero `any`-typed props, zero `dangerouslySetInnerHTML`.

That clean result is real but it is **weak evidence, not a clean bill of health**. Assessment B probe-tested the detector with a deliberately dirty `.tsx` and it caught only one of six planted defects — the `.tsx` regex path is materially narrower than the HTML/CSS path. Everything below was found by reading, not by scanning.

**LLM assessment**: this does not read as AI-generated, and familiarity is correctly treated as a feature. The anti-references hold: no display type, no gradient heroes, no emoji, no scroll reveals. `.glass-effect` exists in `app-center.css:287` but is dead on this surface.

What fails the product slop test — *would a Linear/Stripe-fluent admin trust this?* — is **component vocabulary drift**, exactly what PRODUCT.md principle 3 warns about. Three different confirmation dialogs for destructive acts. Deactivating a user from the table and from the detail page yields two visually different dialogs with different button labels. `confirmation-modal.tsx:63-66` hand-writes `bg-destructive hover:bg-destructive/90 text-white` instead of `variant="destructive"`, which `user-status-toggle.tsx:95` uses correctly.

**Visual overlays**: not available. The dev server on port 3000 redirects `/settings` to the login wall; both agents abandoned the browser path rather than authenticate. No rendered evidence was gathered — every finding is source-derived.

## Overall Impression

The colour and focus token layer is the best work in this repo and is unusually honest: `app-center.css:163-176` overrides `--ring` because the upstream value measures 2.63:1 against a white card, documents the measured replacements for both themes, and admits what the fix does *not* reach. `:300-319` does the same for status badges. Someone measured rather than eyeballed.

That foundation is sitting under an interaction layer that drifted. The single biggest opportunity is not visual — it is **aligning friction with consequence**. Right now the surface demands you type a department's name to delete it, and revokes a named person's production access on one silent click. The warnings are loudest where the stakes are lowest.

## What's Working

1. **The token layer is auditable, not decorative.** `app-center.css:163-176` and `:300-319` carry measured ratios, name the four badge pairs that previously failed, and state the residual gap they cannot fix (`ring-ring/50` is 1.91:1 over white, so no token value rescues it). A contractual AA obligation needs exactly this.
2. **Progressive disclosure on the user detail is real, not faked.** `user-details-tabs.tsx:84-138` gates each `TabsContent`'s children on `active === <tab>`, and wraps each in `TabPanel` (`:48-54`) with its own error boundary and Suspense skeleton. Seven expensive panels cost nothing until opened, and one failing tab doesn't take the page down. Most implementations render all seven and hide six.
3. **The departments error boundary separates expected from exceptional.** `settings/departments/error.tsx:20-25` parses the HTTP status from the digest and suppresses observability reporting for 4xx — a 403 on a hidden department is a routine authorisation outcome, not a signal — while surfacing `error.digest` as "Ref:" (`:50`) so an admin has something to quote to the service desk.

## Priority Issues

### [P0] The final-confirmation dialog describes an action the product does not perform

**Verified in source.** `dialog-delete.tsx:46-52` hardcodes "Esta ação é irreversível. Todos os dados serão eliminados permanentemente." `UserDeleteDialog` passes no `description`, so that default renders — while `user-delete-dialog.tsx:28-33` sets `status: INACTIVE`, the button reads "Desativar", and the toast says "Utilizador Desativado". Nothing is deleted and nothing is irreversible. Separately, `label="Username"` (`user-delete-dialog.tsx:61`) while the input validates against `toDelete.name` (`dialog-delete.tsx:44`).

**Why it matters**: PRODUCT.md principle 2 is "say the true thing", and this is the clearest violation in the surface at the highest-stakes moment. It fails in both directions — an admin who believes it hesitates over a reversible act, and an admin who discovers the mismatch stops trusting every other warning in the product. The label/value mismatch will also strand people: they type the username, the button stays disabled (`:111`), and no error text explains why.

**Fix**: make `description` a required prop so each caller states its own consequence. For users: *"O utilizador deixa de poder entrar. As atribuições de perfil são mantidas e pode ser reativado."* Point `label` at the field actually validated, and add an inline mismatch hint once the input is non-empty and non-matching. Swap the `Trash` icon (`:112`) for something that matches the real effect.

**Suggested command**: `$impeccable clarify`

### [P0] Revoking a role is the most consequential click in the surface and the least guarded

**Verified in source.** `user-role-list.tsx:157-167` — a `variant="ghost"` button labelled "Revogar" calls `handleRevokeRole` directly on click. No dialog, no undo, no summary of what is lost. The only feedback is a toast, and the pending label is `"..."` (`:166`).

**Why it matters**: this removes a named person's access to production applications. It is guarded *less* than deleting a department, which requires typing a name, and it is styled *quieter* than the "Adicionar" button beside it (`:72-79`) — the risk hierarchy is inverted. An admin who misclicks one row of ten cannot tell which role they removed once the toast expires. The same class of unguarded immediate-effect control appears at `permission-list.tsx:83-119`, where a bare `Switch` grants or revokes a department-wide permission.

**Fix**: route it through the existing `ConfirmDialog` with `variant="destructive"`, naming role, department and user: *"Revogar «Gestor de Processos» de João Silva no departamento Finanças?"* Restyle to `variant="outline"` with destructive text so it reads as consequential. Add an undo action to the toast via `useAddUserRole`.

**Suggested command**: `$impeccable harden`

### [P1] The tab labelled "Utilizadores Ativos" shows every user, active or not

**Verified in source.** `user-list.tsx:202` labels the tab "Utilizadores Ativos"; `:218` passes `data={users}`, the unfiltered result of `getUsers()`. The status column renders "Inativo" badges and a faceted status filter exists. The two sibling tabs carry counts (`:204,207`); this one carries none.

**Why it matters**: an admin auditing who currently has access reads the label, counts the rows, and reports a number that includes deactivated accounts. A label that promises a filter must filter.

**Fix**: rename to "Utilizadores" with a count to match the siblings. The status facet already covers the filtering need, so renaming is the smaller and more honest change.

**Suggested command**: `$impeccable clarify`

### [P1] Row action menus in both users tables have no accessible name

**Both assessments agree independently.** `users-columns.tsx:46-48` and `invitations-columns.tsx:88-90` render an icon-only `DropdownMenuTrigger` with no `aria-label`, no `sr-only` text, no `Button` wrapper. Assessment B adds a third: `dept-menu-tree.tsx:73`, an expand/collapse button with neither `aria-label` nor `aria-expanded`.

These are outliers, not the house pattern — `role.tree-row.tsx:94` and `menu-sortable-item.tsx:191` use an `sr-only` "Abrir Menu", `dept-tree-item.tsx:106` uses `aria-label="Abrir menu"`, and the codebase carries 55 `aria-label` and 11 `sr-only` occurrences overall.

**Why it matters**: WCAG 4.1.2, which PRODUCT.md makes a merge gate. A screen-reader user hears "button" with no name once per row and cannot tell which row they are on — and this is the entry point to every per-user action. `p-1` around a 16px icon also gives roughly a 24px target against the ~44px rule.

**Fix**: wrap in a ghost `Button` at `size-9 p-0` with an `aria-label` interpolating the row's name or email, matching `role.tree-row.tsx:89-97`.

**Suggested command**: `$impeccable audit`

### [P1] Language is not one language, and both dialects appear within a single navigation

**Both assessments agree, from different angles.** Assessment B counted **19 user-visible English strings** and **16 pt-BR spellings**; Assessment A caught the navigation-level collision.

- `settings/applications/loading.tsx:4` says "Carregando aplicações…"; `app-details.tsx:72`, one click later, says "A carregar aplicação...". Thirteen files use Brazilian gerunds, sixteen use European "A carregar".
- `user-profile-form.tsx` is almost entirely English (`:113` "Edit User Profile", `:134` "Full Name", `:137` `placeholder="johndoe"`, `:155` "Profile Image", `:175` "Signature") above `Cancelar` (`:194`) and "Guardar Alterações" (`:210`) — mixed within one component. `:62` reads "Carregando profile...": a pt-BR gerund and an English noun in one string.
- `user-profile-form.tsx:98-99` — "Usuario Atualizado" / "O Usuario foi atualizado": wrong word for pt-PT (`Utilizador`) and missing its accent.
- `user-role-dialog.tsx:88,96,368` — `aria-label="Select all"` / `"Select row"` / `"Clear filter"`. `"Select row"` is identical on every row, so a screen reader cannot distinguish them.
- `app-details.tsx:226-228` prints the raw `ACTIVE` enum where every other badge routes through `showStatus()`.
- `user-profile-form.tsx:69` — "Nenhum utilizador encontrada." (gender disagreement).

**Why it matters**: PRODUCT.md names this a defect, explicitly including strings generated in code. Every hit is in `src/features/users/`, which makes it a tractable single-cluster fix rather than a sweep.

**Fix**: normalise `src/features/users/` to pt-PT, route every status through `showStatus()`, and add a lint rule or test asserting no `Carregando|Guardando|Gravando|Usuario` in `src/features` — otherwise the fourteenth file lands unnoticed.

**Suggested command**: `$impeccable clarify`

### [P2] `UserRolesDialog` is a route wearing a dialog costume, and it shows a partial truth

`user-role-dialog.tsx:328` sets `modal={false}` — the one dialog in the surface that neither traps focus nor blocks the page behind it, and it happens to contain a paginated selectable table (`:230-242`, `pageSize: 5`). `:159-163` auto-selects the first department on open and `:198-201` silently filters the user's roles to that department only, with no cue that others exist. `:208-228` resets `rowSelection` whenever `roles` changes identity, so a background refetch discards in-progress selections.

**Why it matters**: modal-as-first-thought at its limit. Tab escapes into the page behind it; a screen-reader user can wander out with no indication. Worse functionally: an admin opens it to review a user's roles and sees one department's worth, believing it complete.

**Fix**: promote to a route (`/settings/users/[id]/perfis`) or into the "Perfis" tab it launches from, with the department as a segmented control and all departments visible under headings. Failing that: drop `modal={false}`, raise the page size, and title the table "Perfis em «<departamento>»" so the scope is stated.

**Suggested command**: `$impeccable shape`

### [P2] Route skeletons are thrown away and replaced by centre-of-content spinners

`AppCenterLoading` (a 64px spinning icon centred in the viewport) is the client loading state at `app-list.tsx:36`, `dept-list-tree.tsx:116` and `user-role-list.tsx:63` — even though `settings/users/loading.tsx` and `settings/departments/loading.tsx` already ship layout-shaped skeletons and `user-details-tabs.tsx:25-33` ships `TabSkeleton`. The route skeleton paints the right shape, then hydration swaps it for a spinner: the layout jumps twice per navigation. `settings/applications/loading.tsx:4` uses the spinner too, so applications never gets a skeleton at all.

Compounding it: the global reduced-motion reset in `globals.css:17-25` sets `animation-iteration-count: 1 !important`, so for a reduced-motion admin every `animate-spin` rotates once and freezes. The one loading affordance on these screens is static — indistinguishable from a hung page.

**Fix**: replace the three client spinners with content-shaped skeletons and give applications a real `loading.tsx`. Reserve `AppCenterLoading` for genuinely unshaped waits, and give it a non-animated fallback (a progress bar or a text status) under `prefers-reduced-motion`.

**Suggested command**: `$impeccable polish`

### [P3] The settings index is a four-up identical card grid, one quarter of which is a promise

`settings/page.tsx:48` renders four visually identical cards at `md:grid-cols-4`. The fourth ("Customização", `:29-36`) is `status: "inativo"` and renders as a non-navigating `role="link"` div at `opacity-50` (`settings-card.tsx:53,63-71`) that still takes a tab stop and announces as a link that does nothing.

`opacity-50` over the already-muted `text-xs text-muted-foreground` description drops it below 4.5:1 — an AA failure the token layer otherwise carefully avoids. Card titles are `text-primary` (`:42`), spending the accent colour on static labels rather than on what is actionable.

Naming, separately: the card titled "Gestão de Acessos" is described as "departamentos, perfis e acessos" and points at `/settings/departments`. Three names for one destination, on the screen a first-time admin reads first.

**Fix**: drop the fourth card until the route exists. Titles to `text-foreground`, reserving `text-primary` for hover/focus. Reconcile the access card's title, description and URL to one word.

**Suggested command**: `$impeccable distill`

## Persona Red Flags

**The administrator who lives here daily**

- No bulk operations on users (`users-columns.tsx:92-181` has no selection column). Deactivating fifteen people after a reorganisation is fifteen ellipsis menus and fifteen dialogs — while the checkbox pattern sits three files away in `user-role-dialog.tsx:79-102`.
- Filter state is not in the URL (`user-list.tsx:94-118`, `app-list.tsx:18-19`). Cannot bookmark "inactive users" or send a colleague a filtered view. `dept-detail.tsx:60-64` gets this right with `?tab=`, which makes the inconsistency more conspicuous.
- `user-details-tabs.tsx:70` holds the active tab in `useState`, so leaving a user's Sessões tab and returning drops you on Perfis every time.
- `user-list.tsx:133` — `if (error) throw error;` during render. A transient refetch failure after the list has rendered destroys the whole segment, losing scroll, filters and tab.
- Toasts are the only record of what changed. 4–6 seconds, then nothing, on a surface whose actions are audited.

**The first-time or occasional admin**

- Nothing defines the vocabulary. `dept-detail.tsx:33-52` presents Perfis, Permissões and Menus as three peer tabs with no account of how they compose; `user-role-list.tsx:112-131` shows a raw `parentCode` under "Associados:".
- `user-invite-dialog.tsx:303-308,327` puts the instruction "Selecione um departamento" inside the control the user cannot yet interact with; the department field above carries no hint.
- `user-role-dialog.tsx:159-163` auto-selects the first department, so a newcomer reasonably reads the table as *the* user's roles.
- `app-list.tsx:50-62` — "Nenhuma aplicação encontrada." plus a button, on the empty state a first-time admin hits first. Compare `dept-empty-state.tsx:23-28`, which explains what departments are for.
- `user-detail-view.tsx:12` returns `null` while loading. A blank page reads as a broken page.

**The keyboard / screen-reader user**

- Unnamed dropdown triggers once per row in both users tables (P1 above), plus `dept-menu-tree.tsx:73`.
- `user-role-dialog.tsx:328` `modal={false}` — no focus trap.
- `user-role-dialog.tsx:367` and `role-permissions-dialog.tsx:336` — `outline-none` paired with `focus-visible:ring-ring/50`. The replacement exists, so the deterministic sweep passed it, but `app-center.css:170-175` states in its own comment that black at 50% over white is 1.91:1, below the 3:1 floor. The pattern satisfies the letter of the rule and fails the ratio.
- Bare colour-only status dots with no glyph, text or label: `manage-apps-modal.tsx:300`, `manage-menus-modal.tsx:342`, `resource-manage-modal.tsx:248`, `dept-list-simple-tree.tsx:101`, `dept-tree-item.tsx:90-95`. (Status *badges* elsewhere are correctly labelled — these dots are the exception.)
- `dept-tree-item.tsx:44-97` — a tree of nested `div`s with no `role="tree"`/`role="treeitem"`, `aria-expanded` on the chevron rather than the item, non-standard `aria-current="true"`, and no roving tabindex. Arrow keys do nothing; every node costs two Tab stops.
- `dept-tree-item.tsx:99` — the row action menu sits at `opacity-40` until hover or focus-within, below 3:1 for a non-text control before you touch it.
- Hit targets: `dept-tree-item.tsx:104` (24px), `:57` (16px chevron), `users-columns.tsx:46` (~24px), `app-card.tsx:82,93,109` icon ghosts — all well under ~44px.
- `settings-card.tsx:63-79` — `role="link"` + `aria-disabled="true"` + `tabIndex={0}` with a keydown handler that swallows Enter and Space. A focusable link that announces as a link and does nothing.

## Minor Observations

- `user-details-header.tsx:22` — an absolutely-positioned `-z-10` div with no background, children or purpose. Dead element.
- `users-columns.tsx:119,130` — email rendered twice per row, once as subtitle and once as its own sortable column, under `table-fixed`.
- `users-columns.tsx:108` — `String(nameValue) !== "null"`. The string `"null"` is being defended against in the view layer; that belongs in DTO mapping.
- `user-list-filters.tsx` appears to be dead code — it pushes `?name=`/`?email=` but no page reads those params and no importer was found.
- `app-card.tsx:47` — `transition-all duration-300`. Outside the 150–250ms band, and `transition-all` animates layout properties.
- `app-center.css:67-76` defines `--animate-wiggle`, a 1s infinite rotation. Unused here, one import away from a consumer-app tic in a government portal. Delete it.
- `invitations-columns.tsx:44` — `navigator.clipboard.writeText` with no `.catch`; the success toast fires even when the copy failed. The product claims an action succeeded that did not.
- `user-role-dialog.tsx:356,358` — "Filtar por nome..." (twice, including the `aria-label`). Typo for "Filtrar".
- `user-role-list.tsx:50` — "Não foi possivel remover o perfil." Missing accent.
- `user-role-dialog.tsx:491` — "N selecionado(s)". The parenthetical plural is the pattern PRODUCT.md's voice guidance rules out; `dept-sidebar-content.tsx:40` does it properly with a ternary.
- `user-invite-dialog.tsx:410` — a literal `×` character as the badge remove button.
- `settings/users/error.tsx:33` and `settings/applications/[code]/error.tsx:25` render a raw `error.message`, so an unlocalised backend string can surface on a pt-PT screen.
- `settings/applications/page.tsx:9-12` exports `metadata`; users, departments and the index export none.
- `settings/layout.tsx:1` is a bare `container mx-auto max-w-7xl` with no padding and no vertical rhythm; `dept-detail.tsx:72` then re-establishes its own container, nesting them.
- `settings/` has no `loading.tsx` or `error.tsx` of its own.
- `app-center.css:415-417` defines a `.focus-ring` utility that nothing in this surface uses — every component hand-writes the same three classes instead. One vocabulary, unused.
- `app-card-home.tsx:142` — `title="Aplicação sem destino configurado"` as the only explanation on an `aria-disabled` div. Mouse-only. (On the workspace surface, adjacent to this target.)

## Questions to Consider

1. `/settings` is four cards, three of which work, and a daily admin will never read them again after the second visit. What is the index *for* — and would the surface be better as three top-level routes in the header, with the index deleted?
2. `dept-detail.tsx` puts Perfis, Permissões and Menus behind tabs on a department. `user-details-tabs.tsx` puts Perfis, Departamentos and Aplicações behind tabs on a user. Both answer "who can do what", from opposite ends, with no shared view. What would a single *access* view look like — and would either tab bar survive it?
3. The surface has fourteen dialog components. Which survive the rule "a modal may only confirm, never compose"? `UserRolesDialog`, `ManageAppsModal`, `ManageMenusModal` and `ManageResourcesModal` all fail it.
4. Deleting a department requires typing its name. Revoking a person's production access takes one silent click. Which of those two actually generates the support ticket?
5. `app-center.css` carries measured contrast ratios in comments for twenty-odd token pairs, and nothing in CI enforces them. What stops the next `bg-primary/10` from re-introducing the exact idiom that comment block was written to kill?
6. Thirteen files say "Carregando", sixteen say "A carregar", and both appear within one navigation. If one language per surface is a defect gate, what mechanism catches the fourteenth file?
