# IGRPInputColor API Reference

## Import

```tsx
import { IGRPInputColor, type IGRPInputColorProps } from '@igrp/igrp-framework-react-design-system';
```

## IGRPInputColorProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `string` | - | Field name (required in forms) |
| `label` | `string` | - | Field label |
| `helperText` | `string` | - | Helper text below field |
| `required` | `boolean` | `false` | Shows asterisk |
| `error` | `string` | - | Validation error message |
| `defaultValue` | `string` | `'#000000'` | Default hex color |
| `value` | `string` | - | Controlled hex color value |
| `onChange` | `(value: string) => void` | - | Called when color changes |
| `showHexValue` | `boolean` | `true` | Show hex value text next to the picker |
| `disabled` | `boolean` | - | Disables the input |

## Example — Standalone

```tsx
<IGRPInputColor
  name="brandColor"
  label="Brand Color"
  defaultValue="#3b82f6"
  showHexValue
/>
```

## Example — Inside IGRPForm

```tsx
<IGRPForm schema={schema} formRef={formRef} onSubmit={onSubmit}>
  <IGRPInputColor name="color" label="Pick a color" required />
</IGRPForm>
```
