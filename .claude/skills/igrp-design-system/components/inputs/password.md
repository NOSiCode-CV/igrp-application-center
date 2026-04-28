# IGRPInputPassword API Reference

## Import

```tsx
import { IGRPInputPassword, type IGRPInputPasswordProps } from '@igrp/igrp-framework-react-design-system';
```

## IGRPInputPasswordProps

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `name` | `string` | Yes (form) | Field name |
| `label` | `string` | No | Field label |
| `value` | `string` | No | Controlled password value |
| `onChangeValue` | `(value: string) => void` | No | Called when the value changes. **Ensure the parameter is typed.** |
| `showPasswordToggle` | `boolean` | No | Show toggle to reveal/hide password (default: `true`) |
| `required` | `boolean` | No | Required indicator |
| `error` | `string` | No | Validation error |

## Common Error: Implicit 'any' type

When using `onChangeValue`, always define the type for the parameter to avoid TypeScript errors.

```tsx
// ✅ Correct
<IGRPInputPassword
  value={password}
  onChangeValue={(val: string) => setPassword(val)}
/>

// ❌ Incorrect
<IGRPInputPassword
  value={password}
  onChangeValue={(val) => setPassword(val)} // Error: Parameter 'val' implicitly has an 'any' type.
/>
```

## Example with Form

Inside `IGRPForm`, the input auto-wires itself.

```tsx
<IGRPInputPassword name="password" label="Password" required />
```
