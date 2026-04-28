# IGRPDateTimeInput API Reference

## Import

```tsx
import { IGRPDateTimeInput, type IGRPDateTimeInputProps } from '@igrp/igrp-framework-react-design-system';
```

## IGRPDateTimeInputProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `string` | - | Field name (required in forms) |
| `label` | `string` | - | Field label |
| `helperText` | `string` | - | Helper text below field |
| `required` | `boolean` | `false` | Shows asterisk |
| `error` | `string` | - | Validation error message |
| `value` | `string` | - | Controlled date-time string |
| `defaultValue` | `string` | `''` | Default date-time string |
| `onChange` | `(value: string) => void` | - | Called when value changes |
| `onBlur` | `(e: FocusEvent) => void` | - | Called on blur |
| `placeholder` | `string` | `'DD/MM/YYYY, --:--'` | Input placeholder |
| `disabled` | `boolean` | `false` | Disables the input |

## Format

The input auto-formats to `DD/MM/YYYY, HH:MM` as the user types.

## Example — Standalone

```tsx
<IGRPDateTimeInput
  name="scheduledAt"
  label="Scheduled At"
  placeholder="DD/MM/YYYY, --:--"
/>
```

## Example — Inside IGRPForm

```tsx
<IGRPForm schema={schema} formRef={formRef} onSubmit={onSubmit}>
  <IGRPDateTimeInput name="scheduledAt" label="Scheduled At" required />
</IGRPForm>
```
