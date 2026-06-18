# Settings Page Improvements — Design Spec

**Date:** 2026-06-18
**Branch:** deploy/pre-release
**Scope:** Non-visual improvements to `src/app/(igrp)/(home)/settings/page.tsx`

---

## Goal

Fix 25 identified issues across semantic HTML, accessibility, copy, and layout without changing the existing visual design. Extract card interactivity into a reusable feature component.

---

## File Structure

```
src/features/settings/
└── components/
    └── settings-card.tsx   ← NEW: "use client" boundary, owns Link/Tooltip/Badge

src/app/(igrp)/(home)/settings/
└── page.tsx                ← becomes Server Component (remove "use client")
```

---

## New shadcn Components

Install before implementation:

```bash
npx shadcn add badge tooltip
```

No customisation beyond defaults needed.

---

## `settings-card.tsx`

### Props

```ts
interface SettingsCardProps {
  item: SettingsItem;
}
```

`SettingsItem` is **defined and exported** from `settings-card.tsx`. `page.tsx` imports it from there — features export types upward to the app layer, never the reverse.

### Behaviour

| State | Element | Notes |
|-------|---------|-------|
| Active | `<Link href={item.href}>` | Native prefetch, right-click, middle-click |
| Disabled | `<div role="link" tabIndex={0} aria-disabled="true">` | Keyboard-focusable, screen reader announces disabled state |

### Disabled card extras
- `<Badge variant="secondary">Em breve</Badge>` — top-right corner, absolute positioned
- `<Tooltip>` wrapping the card with content `"Disponível em breve"` — shown on hover and focus
- `TooltipProvider` wraps locally (per card instance — acceptable given at most one or two disabled cards per page)

### Shared visual markup
- Unchanged from current: icon container + title + description layout
- `focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none rounded-lg` added to both variants for keyboard visibility
- `"use client"` directive required for Tooltip

---

## `page.tsx` Changes

### Remove
- `"use client"` directive
- `useRouter` import
- `handleNavigate` function

### Config fixes

**Grid:**
```diff
- <div className="grid gap-4 grid-cols-none sm:grid-cols-3 md:grid-cols-4">
+ <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
```
Fixes orphan card at `sm` breakpoint. `grid-cols-none` is not a valid Tailwind class.

**Redundant mx-auto:**
```diff
- <div className="mx-auto flex flex-col gap-12">
+ <div className="flex flex-col gap-12">
```
`layout.tsx` already applies `container mx-auto max-w-7xl`.

**Section subtitle — add under `<h2>`:**
```tsx
<p className="text-sm text-muted-foreground mt-1 mb-6">
  Gerencie aplicações, utilizadores e acessos da plataforma.
</p>
```
Remove standalone `mb-6` from `h2` — margin moves to the subtitle.

**Config key rename:**
```diff
- const settingsConfig: { personal: SettingsItem[] } = {
-   personal: [
+ const settingsConfig: { general: SettingsItem[] } = {
+   general: [
```
Aligns code with the "Configurações Gerais" UI heading.

### Copy fixes (all 4 items)

| Field | Before | After |
|-------|--------|-------|
| All descriptions | "voce" | "você" |
| Aplicações description | "Aqui você pode gerenciar as suas aplicações, incluindo criar, editar e excluir." | "Crie, edite e gerencie suas aplicações." |
| Utilizadores description | "Aqui você pode gerenciar os seus utilizadores, convidar e gerenciar as suas permissões." | "Convide utilizadores e gerencie as suas permissões." |
| Acessos description | "Aqui você pode gerenciar os seus acessos, departamentos e perfis e aplicações." | "Gerencie departamentos, perfis e acessos às aplicações." |
| Customização description | "Aqui você pode personalizar a sua interface, incluindo cores, fontes e imagens." | "Personalize cores, fontes e imagens da interface." |

---

## Accessibility Checklist

- [ ] Active cards: `<Link>` renders as `<a>` — correct semantic for navigation
- [ ] Disabled cards: `role="link"` + `aria-disabled="true"` + `tabIndex={0}` — keyboard-reachable, screen reader announces as disabled link
- [ ] Focus rings: `focus-visible:ring-2 focus-visible:ring-ring` on both variants
- [ ] Tooltip on disabled: announced on focus (not just hover) for keyboard users
- [ ] No `<h3>` inside `<button>` — resolved by moving to `<Link>`/`<div>`; `<h3>` inside `<a>` is valid HTML5

---

## Out of Scope

- Visual redesign (explicitly excluded — design stays as-is)
- Adding new settings entries
- Adding icons or chevron hints (would change visual design)
- `SettingsItem` type extraction to a shared types file (premature — only one consumer)
