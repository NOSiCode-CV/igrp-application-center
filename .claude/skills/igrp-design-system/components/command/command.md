# IGRPCommand — Command Palette

Thin re-exports of the UI command primitives with the `IGRP` prefix. Use for command palettes, search boxes with keyboard navigation, and any `⌘K`-style UI.

## Exports

```tsx
import {
  IGRPCommand,
  IGRPCommandDialog,
  IGRPCommandInput,
  IGRPCommandList,
  IGRPCommandEmpty,
  IGRPCommandGroup,
  IGRPCommandItem,
  IGRPCommandShortcut,
  IGRPCommandSeparator,
} from '@igrp/igrp-framework-react-design-system';
```

## Inline command palette

```tsx
<IGRPCommand>
  <IGRPCommandInput placeholder="Search…" />
  <IGRPCommandList>
    <IGRPCommandEmpty>No results.</IGRPCommandEmpty>
    <IGRPCommandGroup heading="Actions">
      <IGRPCommandItem onSelect={() => router.push('/users/new')}>
        <IGRPIcon iconName="Plus" size={16} />
        New user
        <IGRPCommandShortcut>⌘N</IGRPCommandShortcut>
      </IGRPCommandItem>
      <IGRPCommandItem onSelect={() => router.push('/dashboard')}>
        <IGRPIcon iconName="LayoutDashboard" size={16} />
        Dashboard
      </IGRPCommandItem>
    </IGRPCommandGroup>
    <IGRPCommandSeparator />
    <IGRPCommandGroup heading="Settings">
      <IGRPCommandItem onSelect={() => router.push('/settings')}>
        <IGRPIcon iconName="Settings" size={16} />
        Settings
      </IGRPCommandItem>
    </IGRPCommandGroup>
  </IGRPCommandList>
</IGRPCommand>
```

## Modal command palette (⌘K)

```tsx
'use client';
import { useState, useEffect } from 'react';

function CommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <IGRPCommandDialog open={open} onOpenChange={setOpen}>
      <IGRPCommandInput placeholder="Type a command or search…" />
      <IGRPCommandList>
        <IGRPCommandEmpty>No results found.</IGRPCommandEmpty>
        <IGRPCommandGroup heading="Navigation">
          <IGRPCommandItem onSelect={() => { router.push('/dashboard'); setOpen(false); }}>
            Dashboard
          </IGRPCommandItem>
        </IGRPCommandGroup>
      </IGRPCommandList>
    </IGRPCommandDialog>
  );
}
```

## Notes

- `IGRPCommand*` are **direct re-exports** of the `Command*` UI primitives — same API, just `IGRP`-prefixed.
- Always wrap `IGRPCommandItem` inside `IGRPCommandGroup`; never render items directly in `IGRPCommandList`.
- `IGRPCommandDialog` renders the command palette in a modal — use for global `⌘K` shortcuts.
- `IGRPCommandEmpty` renders when the filtered list is empty.
