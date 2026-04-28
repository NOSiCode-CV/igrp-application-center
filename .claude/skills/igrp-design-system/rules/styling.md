# IGRP Styling Rules

## Use `cn()` for class merging

```tsx
import { cn } from '@igrp/igrp-framework-react-design-system';

// Correct
<div className={cn('flex items-center gap-4', isActive && 'bg-accent', className)} />

// Incorrect — manual template literal
<div className={`flex items-center gap-4 ${isActive ? 'bg-accent' : ''}`} />
```

## Semantic tokens only

```tsx
// ✅ Correct — semantic tokens
<div className="bg-background text-foreground" />
<p className="text-muted-foreground" />
<button className="bg-primary text-primary-foreground" />
<div className="border-border" />

// ❌ Incorrect — raw Tailwind colors
<div className="bg-white text-gray-900" />
<p className="text-gray-500" />
<button className="bg-blue-600 text-white" />
```

## Core Semantic Tokens

| Token | Purpose |
|-------|---------|
| `--background` / `--foreground` | Page background and primary text |
| `--primary` / `--primary-foreground` | Primary actions (buttons, links) |
| `--secondary` / `--secondary-foreground` | Secondary elements |
| `--muted` / `--muted-foreground` | Muted backgrounds, subtle text |
| `--accent` / `--accent-foreground` | Hover states, highlights |
| `--destructive` | Errors, delete actions |
| `--border` | Element borders |
| `--input` | Input borders |
| `--ring` | Focus ring |
| `--radius` | Base border radius |

## Spacing — use `gap-*` not `space-*`

```tsx
// ✅ Correct
<div className="flex flex-col gap-4">
<div className="flex items-center gap-2">

// ❌ Incorrect
<div className="space-y-4">
<div className="space-x-2">
```

## Equal dimensions — use `size-*`

```tsx
// ✅ Correct
<div className="size-10" />    // width: 2.5rem; height: 2.5rem

// ❌ Incorrect
<div className="w-10 h-10" />
```

## Dark mode — no manual `dark:` overrides

```tsx
// ✅ Correct — semantic tokens auto-invert in dark mode
<div className="bg-background text-foreground" />

// ❌ Incorrect — manual dark override
<div className="bg-white dark:bg-gray-900 text-black dark:text-white" />
```

## No z-index on overlay components

Dialog, Sheet, Popover, Dropdown, Tooltip — they manage their own stacking context. Never add `z-index` classes to these.

## Variants before custom styles

```tsx
// ✅ Correct — use built-in variants
<IGRPButton variant="outline" size="sm">Cancel</IGRPButton>
<IGRPBadge variant="secondary">Draft</IGRPBadge>

// ❌ Incorrect — overriding colors via className
<IGRPButton className="bg-blue-600 text-white">Submit</IGRPButton>
```

## `className` is for layout only on IGRP components

```tsx
// ✅ Correct — layout positioning
<IGRPButton className="w-full mt-4">Submit</IGRPButton>
<IGRPCard className="col-span-2">...</IGRPCard>

// ❌ Incorrect — color/typography overrides
<IGRPButton className="bg-red-500 font-bold text-lg">Delete</IGRPButton>
```
