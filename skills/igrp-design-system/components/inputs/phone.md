# IGRPInputPhone API Reference

## Import

```tsx
import { IGRPInputPhone, type IGRPInputPhoneProps } from '@igrp/igrp-framework-react-design-system';
```

## IGRPInputPhoneProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `string` | - | Field name (required in forms) |
| `label` | `string` | - | Field label |
| `helperText` | `string` | - | Helper text below field |
| `description` | `string` | - | Description text (alias for helperText) |
| `required` | `boolean` | - | Shows asterisk |
| `error` | `string` | - | Validation error message |
| `value` | `string` | - | Controlled phone value |
| `defaultValue` | `string` | - | Default phone value |
| `onChange` | `(value: string \| undefined) => void` | - | Called when value changes |
| `international` | `boolean` | `true` | Use international format |
| `defaultCountry` | `Country` | - | Default country code (e.g. `'PT'`, `'US'`) |
| `countries` | `Country[]` | - | Restrict available countries |
| `placeholder` | `string` | `'Enter phone number'` | Input placeholder |
| `disabled` | `boolean` | - | Disables the input |
| `dir` | `'ltr' \| 'rtl'` | `'ltr'` | Text direction |

## Example — Standalone

```tsx
<IGRPInputPhone
  name="phone"
  label="Phone Number"
  defaultCountry="PT"
  international
/>
```

## Example — Inside IGRPForm

```tsx
<IGRPForm schema={schema} formRef={formRef} onSubmit={onSubmit}>
  <IGRPInputPhone name="phone" label="Phone" defaultCountry="US" required />
</IGRPForm>
```
