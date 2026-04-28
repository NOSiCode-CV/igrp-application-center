# IGRPInputTime API Reference

## Import

```tsx
import { IGRPInputTime, type IGRPInputTimeProps } from '@igrp/igrp-framework-react-design-system';
```

## IGRPInputTimeProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `string` | - | Field name (required in forms) |
| `label` | `string` | - | Field label |
| `helperText` | `string` | `''` | Helper text below field |
| `required` | `boolean` | `false` | Shows asterisk |
| `error` | `string` | - | Validation error message |
| `value` | `string` | - | Controlled time value (`HH:mm`) |
| `defaultValue` | `string` | - | Default time value |
| `onChange` | `(value: string) => void` | - | Called when value changes |
| `disabled` | `boolean` | - | Disables the input |

## Format

Uses the native browser time picker. Value format is `HH:mm` (24-hour).

## Example — Standalone

```tsx
<IGRPInputTime
  name="startTime"
  label="Start Time"
  defaultValue="09:00"
/>
```

## Example — Inside IGRPForm

```tsx
<IGRPForm schema={schema} formRef={formRef} onSubmit={onSubmit}>
  <IGRPInputTime name="meetingTime" label="Meeting Time" required />
</IGRPForm>
```
