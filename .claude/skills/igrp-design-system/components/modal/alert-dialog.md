# IGRPAlertDialog API Reference

## Import

```tsx
import { IGRPAlertDialog, type IGRPAlertDialogProps } from '@igrp/igrp-framework-react-design-system';
```

## Purpose

Confirm/cancel dialogs. Use for destructive actions (delete, etc.).

## Example

```tsx
<IGRPAlertDialog
  trigger={<IGRPButton variant="destructive">Delete</IGRPButton>}
  title="Confirm Delete"
  description="Are you sure?"
  onConfirm={handleDelete}
  confirmLabel="Delete"
  cancelLabel="Cancel"
/>
```
