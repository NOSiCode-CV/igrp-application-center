# IGRPFormField API Reference

## Import

```tsx
import { IGRPFormField, type IGRPFormFieldProps } from '@igrp/igrp-framework-react-design-system';
```

## IGRPFormFieldProps

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `name` | `string` | Yes | - | Field name (must match schema key) |
| `control` | `Control<FieldValues>` | Yes | - | From `useIGRPFormContext().form.control` |
| `label` | `string` | No | - | Field label |
| `helperText` | `string` | No | - | Helper text below field |
| `required` | `boolean` | No | - | Shows asterisk, does not validate (schema does) |
| `labelPlacement` | `'start' \| 'end' \| 'center'` | No | `'start'` | Label position |
| `isToggle` | `boolean` | No | `false` | Horizontal layout (label beside control), for switches |
| `className` | `string` | No | - | Wrapper CSS classes |
| `children` | `ReactNode \| (field, fieldState) => ReactNode` | Yes | - | Field content or render function |

## Usage with Render Function

For custom inputs or when you need field/fieldState:

```tsx
<IGRPFormField name="email" label="Email" control={control}>
  {(field, fieldState) => (
    <Input
      {...field}
      type="email"
      aria-invalid={!!fieldState.error}
    />
  )}
</IGRPFormField>
```

## Usage with IGRP Inputs

IGRP inputs (IGRPInputText, IGRPSelect, etc.) auto-detect form context. When inside IGRPForm, they wire themselves. Use IGRPFormField to wrap them for label, helper text, and error display:

```tsx
<IGRPFormField name="email" label="Email" required control={control}>
  <IGRPInputText name="email" type="email" />
</IGRPFormField>
```

## isToggle

Use `isToggle={true}` for switches or checkboxes where label should be beside the control:

```tsx
<IGRPFormField name="agree" label="I agree" isToggle control={control}>
  <IGRPCheckbox name="agree" />
</IGRPFormField>
```
