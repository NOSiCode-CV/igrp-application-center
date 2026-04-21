# IGRP Design System Reference

This template uses the **published** package `@igrp/igrp-framework-react-design-system`. All UI should be built with these components.

## Package

- **Import**: `@igrp/igrp-framework-react-design-system`
- **Exports**: Client-side components (`'use client'`)
- **Styling**: Tailwind CSS v4, design tokens via CSS variables

## Component Layers

### Horizon (use these first)

High-level components with labels, icons, form integration, validation.

```tsx
import {
  IGRPButton,
  IGRPInputText,
  IGRPCard,
  IGRPForm,
  IGRPFormField,
  IGRPModalDialog,
  IGRPDataTable,
  IGRPSelect,
  IGRPBadge,
} from '@igrp/igrp-framework-react-design-system';
```

### Primitives (`*Primitive`)

Low-level building blocks. Use when composing custom components.

```tsx
import {
  Button,
  Card,
  Input,
} from '@igrp/igrp-framework-react-design-system';
```

### Custom

Domain components: `IGRPStatusBanner`, `IGRPStatsCardTopBorderColored`, `IGRPUserAvatar`.

## Key Types

| Type | Purpose |
| ------ | --------- |
| `IGRPBaseAttributes` | `label`, `helperText`, `showIcon`, `iconName`, `iconPlacement`, `iconSize`, `name` |
| `IGRPInputProps` | Input props + `inputClassName`, `error`, `gridSize` |
| `IGRPSize` | `'sm' \| 'md' \| 'lg' \| 'xl'` |

## Common Patterns

### Form

```tsx
<IGRPForm schema={schema} onSubmit={onSubmit}>
  <IGRPFormField name="email" label="Email" required>
    <IGRPInputText name="email" type="email" />
  </IGRPFormField>
  <IGRPButton type="submit">Submit</IGRPButton>
</IGRPForm>
```

### Input with icon

```tsx
<IGRPInputText
  name="search"
  label="Search"
  showIcon
  iconName="Search"
  iconPlacement="start"
/>
```

### Button

```tsx
<IGRPButton variant="default" size="md">Submit</IGRPButton>
<IGRPButton variant="outline" loading>Loading...</IGRPButton>
```

### Card

```tsx
<IGRPCard>
  <IGRPCardHeader>
    <IGRPCardTitle>Title</IGRPCardTitle>
  </IGRPCardHeader>
  <IGRPCardContent>Content</IGRPCardContent>
  <IGRPCardFooter>Footer</IGRPCardFooter>
</IGRPCard>
```

### Data table

```tsx
<IGRPDataTable columns={columns} data={data} />
```

### Icons

```tsx
<IGRPIcon iconName="Check" size={16} />
```

## Styling

- Tokens: `@igrp/igrp-framework-react-design-system/tokens` (in `src/styles/globals.css`)
- Theme overrides: `src/styles/themes.css`
- Do **not** import prebuilt `@igrp/*/styles.css` files.

## Utilities

```tsx
import { cn, useIsMobile, useIGRPMetaColor } from '@igrp/igrp-framework-react-design-system';
```
