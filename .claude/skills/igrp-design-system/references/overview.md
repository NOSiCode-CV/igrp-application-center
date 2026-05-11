# IGRP Design System Overview

## Package

- **Import**: `@igrp/igrp-framework-react-design-system`
- **Exports**: Client-side components (`'use client'`) — add `'use client'` to every file that imports them
- **Styling**: Tailwind CSS v4, design tokens via CSS variables

## Component Layers

| Layer | Naming | When to use |
|-------|--------|-------------|
| **Horizon** | `IGRP*` | Default for all app UI. Labels, icons, form wiring, loading states built in. |
| **UI** | `Button`, `Card`, `Input`, etc. (no prefix) | Custom composition, full control needed. |
| **Custom** | `IGRPStatsCard`, `IGRPUserAvatar`, etc. | Domain-specific components. |

**Always prefer Horizon. Use UI only when Horizon doesn't fit.**

## Key Types

| Type | Purpose |
|------|---------|
| `IGRPBaseAttributes` | `label`, `helperText`, `showIcon`, `iconName`, `iconPlacement`, `iconSize`, `name` |
| `IGRPInputProps` | Input props + `inputClassName`, `error`, `gridSize` |
| `IGRPSize` | `'sm' \| 'md' \| 'lg' \| 'xl'` |
| `IGRPOptionsProps` | `label`, `value`, `color`, `status`, `icon`, `group`, `description`, `image`, `flag` |
| `IGRPGridSize` | `'default' \| 'full' \| '1/2' \| '1/3' \| '2/3' \| '1/4' \| '3/4'` |
| `IGRPPlacementProps` | `'start' \| 'end' \| 'center'` |
| `IGRPIconName` | Lucide icon name string union |

## Utility Exports

```tsx
import {
  // Class merging
  cn,                        // clsx + tailwind-merge

  // String helpers
  igrpGetInitials,           // "John Doe" -> "JD"
  igrpToPascalCase,          // "my-name" -> "MyName"

  // Color helpers
  IGRPColors,                // color palette constants
  igrpColorText,             // color -> Tailwind text class

  // Grid / layout constants
  igrpGridSizeClasses,       // maps IGRPGridSize -> Tailwind col-span class

  // Alert constants
  igrpAlertIconMappings,     // maps alert variant -> { iconName, className }

  // Date / calendar utilities
  formatDateRange,           // format a DateRange to locale string
  formatDateToString,        // format single Date to locale string
  getDisabledDays,           // build a DayPicker `disabled` matcher from config
  isValidDate,               // checks if a value is a valid Date
  parseStringToDate,         // parses "YYYY-MM-DD" string -> Date
  parseStringToRange,        // parses "YYYY-MM-DD:YYYY-MM-DD" -> DateRange
  parseLocalDate,            // parses a date string as local time (no UTC shift)

  // URL helpers
  igrpIsExternalUrl,         // detect external vs internal URLs
  igrpNormalizeUrl,          // normalize URL strings

  // Hooks
  useIGRPMetaColor,          // syncs browser chrome theme-color meta tag
  useIsMobile,               // responsive mobile detection hook
} from '@igrp/igrp-framework-react-design-system';
```

### `igrpGridSizeClasses`

Maps an `IGRPGridSize` value to a Tailwind `col-span-*` class:

```tsx
import { igrpGridSizeClasses } from '@igrp/igrp-framework-react-design-system';
// { 'default': 'col-span-full', '1/2': 'col-span-6', '1/3': 'col-span-4', … }
```

### Date utilities

```tsx
import {
  getDisabledDays,
  isValidDate,
  parseStringToDate,
  parseStringToRange,
  parseLocalDate,
} from '@igrp/igrp-framework-react-design-system';

// Disable weekends for a calendar
const disabled = getDisabledDays({ disableWeekends: true });

// Parse from API string safely
const date = parseStringToDate('2025-12-31');       // Date | null
const range = parseStringToRange('2025-01-01:2025-12-31'); // DateRange | null

// Avoid UTC timezone shift when parsing "YYYY-MM-DD"
const local = parseLocalDate('2025-06-15'); // Date (midnight local)

// Validate before using
if (isValidDate(value)) { /* … */ }
```

## Re-exported External Types

```tsx
import type {
  // TanStack Table (used by IGRPDataTable)
  ColumnDef, Column, Row, RowSelectionState, SortingState,
  PaginationState, ColumnFiltersState, VisibilityState,
  ExpandedState, FilterFn, OnChangeFn,
  // react-day-picker (used by date pickers)
  DateRange,
} from '@igrp/igrp-framework-react-design-system';
```

## Deprecated Components

| Deprecated | Replace with |
|------------|-------------|
| `IGRPCalendar` | `IGRPCalendarSingle`, `IGRPCalendarRange`, or `IGRPCalendarMultiple` |
| `IGRPDatePicker` | `IGRPDatePickerSingle`, `IGRPDatePickerRange`, or `IGRPDatePickerMultiple` |

## CSS Setup

See [theming.md](./theming.md) for full CSS/token setup, dark mode, and theme variants.
