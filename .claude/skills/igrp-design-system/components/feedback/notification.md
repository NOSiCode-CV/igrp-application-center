# IGRPNotification

## Import

```tsx
import { IGRPNotification, IGRPNotificationVariants } from '@igrp/igrp-framework-react-design-system';
```

## Props

- `title`: `string`
- `content`: `string` (The message to display)
- `variant`: `'success' | 'destructive' | 'warning' | 'info'`

## Example

```tsx
<IGRPNotification
  variant="success"
  title="Success"
  content="The record has been updated."
/>

<IGRPNotification
  variant="warning"
  title="Attention"
  content="This is a warning notification."
/>
```
