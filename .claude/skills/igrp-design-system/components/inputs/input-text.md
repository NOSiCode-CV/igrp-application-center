# IGRPInputText API Reference

## Import

```tsx
import { IGRPInputText, type IGRPInputTextProps } from '@igrp/igrp-framework-react-design-system';
```

## IGRPInputTextProps

Extends `IGRPInputProps`. Key props:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `string` | - | Field name (required in forms) |
| `label` | `string` | - | Field label |
| `helperText` | `string` | - | Helper text below field |
| `type` | `'text' \| 'email' \| 'number'` | `'text'` | Input type |
| `required` | `boolean` | - | Shows asterisk |
| `error` | `string` | - | Validation error (overrides form error) |
| `showIcon` | `boolean` | `false` | Show icon |
| `iconName` | `IGRPIconName` | `'House'` | Lucide icon |
| `iconPlacement` | `'start' \| 'end'` | `'start'` | Icon position |
| `inputClassName` | `string` | - | CSS for input element |

## Example with Icon

```tsx
<IGRPInputText
  name="search"
  label="Search"
  showIcon
  iconName="Search"
  iconPlacement="start"
/>
```
