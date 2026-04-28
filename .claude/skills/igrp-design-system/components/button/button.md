# IGRPButton API Reference

## Import

```tsx
import { IGRPButton, type IGRPButtonProps } from '@igrp/igrp-framework-react-design-system';
```

## IGRPButtonProps

Extends `IGRPBaseAttributes` and button primitives.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'destructive' \| 'outline' \| 'secondary' \| 'ghost' \| 'link'` | `'default'` | Visual style |
| `size` | `'default' \| 'xs' \| 'sm' \| 'lg' \| 'icon' \| 'icon-sm' \| 'icon-lg'` | `'default'` | Button size |
| `loading` | `boolean` | `false` | Show spinner, disable interaction |
| `loadingText` | `string` | `'Loading...'` | Accessible text during loading |
| `showIcon` | `boolean` | `false` | Show icon |
| `iconName` | `IGRPIconName \| string` | `'ArrowLeft'` | Lucide icon name |
| `iconPlacement` | `'start' \| 'end' \| 'center'` | `'start'` | Icon position |
| `iconSize` | `string \| number` | `14` (or by size) | Icon size in px |
| `asChild` | `boolean` | `false` | Render as child (Radix Slot). **CRITICAL: Must have EXACTLY ONE child.** |

## Critical Rule: `asChild` Usage

When using `asChild`, the `IGRPButton` must have **EXACTLY ONE** child element. Providing multiple children will cause a runtime error.

```tsx
// ✅ Correct
<IGRPButton asChild>
  <Link href="/dashboard">Dashboard</Link>
</IGRPButton>

// ❌ Incorrect (Multiple children)
<IGRPButton asChild>
  <IGRPIcon iconName="Plus" />
  <span>Add</span>
</IGRPButton>
```

## Variants

- **default**: Primary filled
- **destructive**: Red, for delete/danger
- **outline**: Bordered, subtle
- **secondary**: Muted background
- **ghost**: No background, hover only
- **link**: Text with underline on hover

## Icon-Only Buttons

```tsx
<IGRPButton size="icon" iconName="Plus" aria-label="Add" />
<IGRPButton size="icon-sm" iconName="Trash2" aria-label="Delete" />
<IGRPButton size="icon-lg" iconName="Settings" aria-label="Settings" />
```

## Form Submit

When inside IGRPForm, use `type="submit"`:

```tsx
<IGRPButton type="submit" loading={isSubmitting}>Save</IGRPButton>
```
