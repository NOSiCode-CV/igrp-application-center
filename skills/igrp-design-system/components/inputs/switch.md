# IGRPSwitch API Reference

## Import

```tsx
import { IGRPSwitch, type IGRPSwitchProps } from '@igrp/igrp-framework-react-design-system';
```

## IGRPSwitchProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `string` | - | Field name (required in forms) |
| `label` | `string` | - | Label shown next to the switch |
| `helperText` | `string` | - | Helper text below the switch |
| `required` | `boolean` | - | Shows asterisk on label |
| `error` | `string` | - | Validation error message |
| `checked` | `boolean` | - | Controlled checked state |
| `defaultChecked` | `boolean` | - | Default checked state |
| `onCheckedChange` | `(checked: boolean) => void` | - | Called when toggle changes |
| `disabled` | `boolean` | - | Disables the switch |
| `labelClassName` | `string` | - | CSS for the label |

## Example — Standalone

```tsx
<IGRPSwitch
  name="notifications"
  label="Enable notifications"
  helperText="You will receive email updates."
/>
```

## Example — Inside IGRPForm

Inside `IGRPForm`, the switch auto-wires to the form. The value stored is `boolean`.

```tsx
<IGRPForm schema={schema} formRef={formRef} onSubmit={onSubmit}>
  <IGRPSwitch name="active" label="Active" />
</IGRPForm>
```
