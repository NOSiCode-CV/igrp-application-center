# IGRPIcon — Icon Component

Renders any [Lucide](https://lucide.dev/icons/) icon by name. Falls back to a red `AlertCircle` when the name is invalid.

## Exports

```tsx
import {
  IGRPIcon,
  IGRPIconObject,  // sorted string[] of all valid icon names
  IGRPIconList,    // { [name]: LucideComponent } map
  type IGRPIconName,
  type IGRPIconProps,
  type LucideProps,
} from '@igrp/igrp-framework-react-design-system';
```

## Props

`IGRPIconProps` extends `LucideProps` (Lucide's SVG props):

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `iconName` | `IGRPIconName \| string` | required | Lucide icon name (e.g. `"Plus"`, `"Settings"`, `"ChevronDown"`) |
| `size` | `number` | `16` | Icon size in px |
| `color` | `string` | `"currentColor"` | SVG color |
| `className` | `string` | — | Additional CSS classes |
| `id` | `string` | `iconName` | HTML `id` attribute |

## Usage

```tsx
import { IGRPIcon } from '@igrp/igrp-framework-react-design-system';

// Basic
<IGRPIcon iconName="Plus" />

// Custom size and color
<IGRPIcon iconName="Settings" size={24} className="text-primary" />

// Inside a button
<IGRPButton>
  <IGRPIcon iconName="Save" size={16} />
  Save
</IGRPButton>
```

## Discover icon names

```tsx
import { IGRPIconObject, IGRPIconList } from '@igrp/igrp-framework-react-design-system';

// All valid names (sorted string array)
console.log(IGRPIconObject); // ["Activity", "Airplay", "AlarmClock", ...]

// Render any icon dynamically
const LucideIcon = IGRPIconList['Star'];
if (LucideIcon) return <LucideIcon size={20} />;
```

## Type-safe icon name

```tsx
import type { IGRPIconName } from '@igrp/igrp-framework-react-design-system';

const myIcon: IGRPIconName = 'Star'; // autocomplete + type-check
<IGRPIcon iconName={myIcon} />
```

## Notes

- `IGRPIconObject` is a **sorted array** of all Lucide icon name strings — useful for building icon pickers.
- `IGRPIconList` is a **map** from name → Lucide component — useful for dynamic rendering without `IGRPIcon`.
- Invalid `iconName` values log a warning and render `AlertCircle` with `text-destructive` styling.
- Icon names are PascalCase Lucide names: `"ChevronDown"`, `"LayoutDashboard"`, `"UserCircle"`, etc.
