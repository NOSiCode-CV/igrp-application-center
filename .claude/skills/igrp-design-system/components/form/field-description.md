# IGRPFieldDescription — Field Helper Text & Error

Renders helper text or a validation error below a form field. Mutually exclusive: when `error` is set, `helperText` is hidden.

## Import

```tsx
import {
  IGRPFieldDescription,
  type IGRPFieldDescriptionProps,
} from '@igrp/igrp-framework-react-design-system';
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `helperText` | `string` | Shown when there is no error (`text-muted-foreground`, `role="note"`) |
| `error` | `string` | Error message — hides `helperText` and renders as `text-destructive`, `role="alert"` |

## Usage

```tsx
// Helper text only
<IGRPFieldDescription helperText="Must be at least 8 characters" />

// Error replaces helper text
<IGRPFieldDescription
  helperText="Must be at least 8 characters"
  error="Password is too short"
/>

// Inside a custom field
<div>
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" aria-invalid={!!error} />
  <IGRPFieldDescription
    helperText="We'll never share your email"
    error={errors.email?.message}
  />
</div>
```

## Notes

- Used internally by `IGRPFormField` — only reach for it directly when building **custom fields outside IGRPForm**.
- When `error` is truthy, `helperText` is not rendered (even if provided).
- Renders `role="note"` for helper text and `role="alert"` for errors for accessibility.
