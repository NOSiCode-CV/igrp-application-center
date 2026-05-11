# IGRPRadioGroup API Reference

## Import

```tsx
import { IGRPRadioGroup, type IGRPRadioGroupProps } from '@igrp/igrp-framework-react-design-system';
```

## IGRPRadioGroupProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `string` | - | Field name (required in forms) |
| `label` | `string` | - | Group label |
| `helperText` | `string` | - | Helper text below group |
| `required` | `boolean` | `false` | Shows asterisk |
| `error` | `string` | - | Validation error message |
| `options` | `IGRPRadioOption[]` | - | Array of radio options |
| `value` | `string` | - | Controlled selected value |
| `defaultValue` | `string` | - | Default selected value |
| `onValueChange` | `(value: string) => void` | - | Called when selection changes |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Layout direction |
| `disabled` | `boolean` | `false` | Disables all options |
| `size` | `'sm' \| 'md'` | `'md'` | Size of radio items |
| `variant` | `string` | - | Visual variant |
| `dir` | `'ltr' \| 'rtl'` | - | Text direction |

## IGRPRadioOption

| Prop | Type | Description |
|------|------|-------------|
| `value` | `string` | Option value |
| `label` | `string` | Option label |
| `description` | `string` | Optional description below label |
| `disabled` | `boolean` | Disable this specific option |

## Example — Standalone

```tsx
<IGRPRadioGroup
  name="plan"
  label="Select Plan"
  options={[
    { value: 'free', label: 'Free' },
    { value: 'pro', label: 'Pro', description: 'Includes all features' },
    { value: 'enterprise', label: 'Enterprise', disabled: true },
  ]}
  orientation="vertical"
/>
```

## Example — Inside IGRPForm

```tsx
<IGRPForm schema={schema} formRef={formRef} onSubmit={onSubmit}>
  <IGRPRadioGroup
    name="role"
    label="Role"
    options={[
      { value: 'admin', label: 'Admin' },
      { value: 'user', label: 'User' },
    ]}
    required
  />
</IGRPForm>
```
