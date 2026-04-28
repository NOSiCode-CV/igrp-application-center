# IGRPAlert

## Import

```tsx
import { IGRPAlert, type IGRPAlertProps } from '@igrp/igrp-framework-react-design-system';
```

## Props

`variant` (solid, soft, outline), `color` (primary, secondary, success, destructive, warning, info, indigo), `title`, `description`, `children`.

## Usage

```tsx
<IGRPAlert variant="soft" color="destructive">
  <div className="flex flex-col gap-1">
    <h4 className="font-semibold">Error Title</h4>
    <p className="text-sm">Error description</p>
  </div>
</IGRPAlert>
```
