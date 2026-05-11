# IGRPCheckbox API Reference

## Import

```tsx
import { IGRPCheckbox, type IGRPCheckboxProps } from '@igrp/igrp-framework-react-design-system';
```

## IGRPCheckboxProps

| Prop | Type | Description |
|------|------|-------------|
| `name` | `string` | Field name |
| `label` | `string` | Label (use with isToggle in IGRPFormField) |
| `helperText` | `string` | Helper text |
| `required` | `boolean` | Required indicator |
| `error` | `string` | Validation error |

## Example

```tsx
<IGRPFormField name="agree" label="I agree to terms" isToggle control={control}>
  <IGRPCheckbox name="agree" />
</IGRPFormField>
```

Or with IGRPCheckbox alone (it wraps itself in IGRPFormField when in form context):

```tsx
<IGRPCheckbox name="agree" label="I agree" />
```
