# Header Slots

How to render **your own components** in the template header — replacing the built-in search, notifications or settings control, or adding entirely new ones.

- [The model](#the-model)
- [The slots](#the-slots)
- [Quick start](#quick-start)
- [The worked example in this template](#the-worked-example-in-this-template)
- [Recipe: replace notifications](#recipe-replace-notifications)
- [Recipe: add your own actions](#recipe-add-your-own-actions)
- [Recipe: a badge next to the logo](#recipe-a-badge-next-to-the-logo)
- [Async server slots](#async-server-slots)
- [Rules and gotchas](#rules-and-gotchas)
- [What is not injectable](#what-is-not-injectable)
- [Preview mode](#preview-mode)
- [API reference](#api-reference)

## The model

The header is rendered by the framework, not by your app:

```
(igrp)/layout.tsx  [server]
  → IGRPLayoutFull            @igrp/framework-next          [server]
      → HeaderDataProvider    (inside <Suspense>)           [server]
            getHeaderData()   → flags, logo, URLs
            fetchCurrentUser() → the signed-in user
        → IGRPTemplateHeader  @igrp/framework-next-ui       ['use client']
```

A **slot** hands the framework a node to render in a position it owns. The
framework still fetches and owns **all** header data — user, logo, breadcrumbs,
sidebar trigger. A slot replaces *what renders in a position*, never *where the
data comes from*. You give up nothing by using one.

## The slots

Pass them as `headerSlots` on `IGRPLayoutFull`:

| Slot | Position | Renders when |
| --- | --- | --- |
| `start` | Left region, after the logo/title, before the breadcrumbs | you pass a node |
| `search` | Right cluster, first — replaces the built-in command palette | `showSearch: true` |
| `settings` | Right cluster — replaces the built-in settings link | `showSettings: true` |
| `notifications` | Right cluster — replaces the built-in notifications dropdown | `showNotifications: true` |
| `actions` | Right cluster, after notifications, before the theme switcher | you pass a node |

Two gating styles, and the difference matters:

- `search`, `settings` and `notifications` occupy positions the framework already
  knows about, so the matching `show*` flag in `getHeaderData()` still decides
  whether the position renders **at all**. Setting `showSearch: false` while
  passing a `search` slot renders nothing — the flag wins.
- `start` and `actions` have no flag. Passing the node is the whole contract.

The `show*` flags live in `src/igrp.template.config.ts` under
`layoutData.getHeaderData()`.

## Quick start

```tsx
// src/app/(igrp)/layout.tsx
import { IGRPLayoutFull } from "@igrp/framework-next";

import { EnvBadge } from "@/components/header/env-badge";
import { MyNotifications } from "@/components/header/my-notifications";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const config = await createConfig(layoutConfig);

  return (
    <IGRPLayoutFull
      config={config}
      headerSlots={{
        start: <EnvBadge />,
        notifications: <MyNotifications />,
      }}
    >
      {children}
    </IGRPLayoutFull>
  );
}
```

Slots are **elements** (`<MyThing />`), not component references (`MyThing`).
See [Rules and gotchas](#rules-and-gotchas).

## The worked example in this template

This template ships one real slot: the **command palette**, wired through
`search`. Read these three files as the reference implementation — they cover
every constraint in this document.

| File | Role |
| --- | --- |
| [`src/lib/header-search.ts`](../src/lib/header-search.ts) | **Server.** Resolves the application menus into serializable command data. Branches on `isAuthBypass()` exactly like the framework's sidebar provider: mock menus under bypass, `fetchMenusAction(appCode)` otherwise. Returns `[]` on a failed fetch. |
| [`src/components/header/app-search.tsx`](../src/components/header/app-search.tsx) | **Client (`'use client'`).** Maps that data to `IGRPCommandItem[]`, building each `onSelect` handler, and renders `IGRPTemplateCommandSearch`. |
| [`src/app/(igrp)/layout.tsx`](../src/app/(igrp)/layout.tsx) | Awaits the commands and passes the element as the `search` slot. |

The whole wiring in the layout is three lines:

```tsx
const searchCommands = await getHeaderSearchCommands(config);

<IGRPLayoutFull
  config={config}
  headerSlots={{ search: <AppSearch commands={searchCommands} /> }}
>
```

> **Why this exists at all:** `IGRPTemplateHeader` mounts the framework's
> `IGRPTemplateCommandSearch` with no `commands` prop, so out of the box `⌘K` /
> `Ctrl+K` opens a palette that can never contain anything. The `search` slot is
> how an app gives it content.

The split between the two files is not stylistic. Deciding whether a URL is
external requires comparing it against the current origin, which only the
browser knows (`igrpIsExternalUrl` reads `window.location.origin`). So the server
passes `pageSlug` / `url` / `target` unresolved and the client decides on click.

## Recipe: replace notifications

The built-in dropdown renders whatever `getHeaderData()` returns in
`notifications` — a static array. To drive it from your own API instead:

```tsx
// src/components/header/my-notifications.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import {
  IGRPTemplateNotifications,
} from "@igrp/framework-next-ui";

export function MyNotifications() {
  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    refetchInterval: 60_000,
  });

  return (
    <IGRPTemplateNotifications
      notifications={data ?? []}
      onMarkAllRead={markAllRead}
    />
  );
}
```

Reuse `IGRPTemplateNotifications` as above to keep the framework's look, or
render something entirely your own. `IGRPQueryProvider` is already mounted above
`IGRPLayoutFull` in this template, so react-query works inside a slot.

**One behavioural note.** `IGRPTemplateNavUser` also carries a link-only
"Notifications" entry in its dropdown, gated by the same `showNotifications`
flag. When you pass a `notifications` slot, the framework **suppresses** that
entry — otherwise the header would offer two entry points to notifications and
your component would only own one of them. Your slot is also *not* hidden on
small screens; the framework's own bell is (`hidden md:block`) precisely because
nav-user covered mobile.

## Recipe: add your own actions

`actions` is the open-ended slot. Compose a fragment and you control the internal
order:

```tsx
headerSlots={{
  actions: (
    <>
      <HelpButton />
      <LanguageSwitcher />
      <IGRPAuthorization permission="manage_access">
        <AdminShortcut />
      </IGRPAuthorization>
    </>
  ),
}}
```

It is a single `ReactNode`, not an array, so the framework never maps over nodes
you did not key. Permission-gate individual items yourself — see
[Permissions](PERMISSIONS.md).

## Recipe: a badge next to the logo

`start` sits in the left region, between the logo/title and the breadcrumbs, and
gets its own separator when a logo, title or sidebar trigger precedes it:

```tsx
headerSlots={{ start: <IGRPBadge variant="outline">STAGING</IGRPBadge> }}
```

It is placed *before* the breadcrumbs deliberately: breadcrumbs collapse under
pressure, and a slot after them would be the first thing crushed on a narrow
viewport.

## Async server slots

A slot element may be produced by an **async Server Component** — useful when
the data lives behind a server-only client:

```tsx
async function TenantSwitcher() {
  const tenants = await fetchTenants(); // server-side
  return <TenantSwitcherClient tenants={tenants} />;
}

headerSlots={{ actions: <TenantSwitcher /> }}
```

Each slot renders inside **its own `<Suspense>`** with a small icon-sized
placeholder, so a slow slot cannot delay the logo, breadcrumbs or user menu.
To control the fallback, wrap your own slot:

```tsx
headerSlots={{
  actions: (
    <Suspense fallback={<MySkeleton />}>
      <TenantSwitcher />
    </Suspense>
  ),
}}
```

## Rules and gotchas

**Pass elements, not components.** `IGRPTemplateHeader` is a Client Component
rendered from a Server Component. Elements cross that boundary; functions do not.

```tsx
headerSlots={{ search: <AppSearch /> }}  // ✅
headerSlots={{ search: AppSearch }}      // ❌ a function cannot be serialized
```

**The same rule applies to props you pass into a slot.** This is the trap that
`IGRPCommandItem.onSelect` walks into: it is a callback, so a *server* module
cannot build the items. Pass plain data from the server and construct the
handlers inside the client component — that is exactly why
`header-search.ts` and `app-search.tsx` are two files.

**Navigate with the router, not `window.open`.** `router.push()` applies
`basePath` (`NEXT_PUBLIC_BASE_PATH`, `/apps/template` here); `window.open()` does
not, so an internal path opened that way 404s. Reserve `window.open` for URLs
that are genuinely on another origin.

**An absolute `url` is not automatically external.** A menu item can address an
internal page by URL rather than by slug — `/reports` in `src/temp/menus` does
exactly that. Decide with `igrpIsExternalUrl(url)` (or an explicit
`target: "_blank"`), never with "has a `url` and no `pageSlug`".

**`typedRoutes` is on.** `next.config.ts` sets `typedRoutes: true`, so
`router.push()` is typed against statically known routes. Targets resolved from
runtime data need a cast at that boundary:

```tsx
router.push(href as Parameters<typeof router.push>[0]);
```

**Slots are client-boundary code.** Anything importing from the design system
needs `'use client'` — see [Design System](DESIGN_SYSTEM.md).

## What is not injectable

| Not a slot | Why |
| --- | --- |
| Theme switcher | Framework behaviour tied to `next-themes` |
| Nav-user menu | Tied to session and sign-out; overriding it is how auth UX breaks |
| Logo, title, breadcrumbs, sidebar trigger | Configured through `getHeaderData()` flags and `breadcrumbs` / `breadcrumbRouteLabels` props |
| The header as a whole | There is no full-replacement prop. It would hand you back the data fetching — `getHeaderData()`, `fetchCurrentUser()`, and the access-client re-seed that `HeaderDataProvider` performs because Suspense resumes on a tick that does not inherit the `AsyncLocalStorage` store. Use slots instead. |

To hide a built-in rather than replace it, flip its flag in
`getHeaderData()` (`showSearch`, `showSettings`, `showNotifications`,
`showThemeSwitcher`, `showUser`, `showBreadcrumb`, …).

## Preview mode

Slots are indifferent to auth — they render the same under
`IGRP_PREVIEW_MODE=true` or `AUTH_PROVIDER=none` as they do against a live
backend. Any *data* a slot resolves is your responsibility to branch, and
`isAuthBypass()` from `@/lib/utilities` is the only correct way to check.
`getHeaderSearchCommands()` is the reference: mock menus under bypass, the
Access-Management menus otherwise. See [Authentication](AUTHENTICATION.md).

## API reference

```ts
// @igrp/framework-next-ui
export type IGRPHeaderSlots = {
  start?: React.ReactNode;
  search?: React.ReactNode;
  notifications?: React.ReactNode;
  settings?: React.ReactNode;
  actions?: React.ReactNode;
};

// @igrp/framework-next
export type IGRPLayoutFullArgs = {
  readonly children: React.ReactNode;
  readonly config: IGRPConfigArgs;
  readonly showSidebar?: boolean;
  readonly breadcrumbs?: BreadcrumbItem[];
  readonly breadcrumbRouteLabels?: Record<string, string>;
  readonly headerSlots?: IGRPHeaderSlots;
};
```

Components worth reusing inside a slot, all from `@igrp/framework-next-ui`:
`IGRPTemplateCommandSearch` (accepts `commands: IGRPCommandItem[]`),
`IGRPTemplateNotifications` (accepts `notifications`, `notificationsUrl`,
`onMarkAllRead`), `IGRPAuthorization`, `usePermissions`.

Delivered by template migration `34-header-slots-and-app-search` — see
[Upgrading](MIGRATION_GUIDE.md).
