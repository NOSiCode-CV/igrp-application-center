# IGRPPageHeader

## Import

```tsx
import { IGRPPageHeader } from '@igrp/igrp-framework-react-design-system';
```

## Props

- `title`: `string` (Page title)
- `description`: `string` (Optional subtitle/description)
- `children`: `ReactNode` (Actions area - all buttons/actions must be passed here)
- `showBackButton`: `boolean` (Show back button)
- `backButtonHref`: `string` (Back button navigation path)
- `backButtonLabel`: `string` (Back button text)
- `backButtonUseBrowserBack`: `boolean` (If true, uses browser history to go back)

> **Critical Rule:** `renderRight` does not exist. All header actions (buttons) must be passed as `children`.
> **Critical Rule:** `backButton` prop does not exist. Use `showBackButton`, `backButtonHref`, `backButtonLabel`, `backButtonUseBrowserBack` instead.

### Example

```tsx
<IGRPPageHeader
  title="Users Management"
  description="Manage system users."
  showBackButton
  backButtonHref="/admin"
  backButtonLabel="Back"
>
  <IGRPButton showIcon iconName="Plus">Add User</IGRPButton>
</IGRPPageHeader>
```
