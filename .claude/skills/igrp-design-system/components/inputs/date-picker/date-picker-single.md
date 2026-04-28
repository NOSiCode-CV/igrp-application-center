# IGRPDatePickerSingle API Reference

## Import

```tsx
import { IGRPDatePickerSingle, type IGRPDatePickerSingleProps } from '@igrp/igrp-framework-react-design-system';
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `string` | - | Field name (required in forms) |
| `label` | `string` | - | Field label |
| `labelClassName` | `string` | - | CSS for the label |
| `helperText` | `string` | - | Helper text below field |
| `required` | `boolean` | `false` | Shows asterisk |
| `date` | `Date \| undefined` | - | **Standalone:** controlled date value — must be a real `Date` object |
| `onDateChange` | `(date: Date \| undefined) => void` | - | **Standalone:** called when date changes |
| `dateFormat` | `string` | `'dd/MM/yyyy'` | Display format |
| `placeholder` | `string` | `'Pick a date'` | Placeholder text |
| `disabledPicker` | `boolean` | `false` | Disables the trigger button |
| `disabled` | `boolean` | - | Disables specific dates (calendar-level) |
| `disableBefore` | `Date` | - | Disable all dates before this |
| `disableAfter` | `Date` | - | Disable all dates after this |
| `className` | `string` | - | CSS for the wrapper |

## Critical Rules

- **Standalone:** always use `date` + `onDateChange`. Never use `value` / `onChange`.
- **Pass real `Date` objects** — never strings.
- **Inside `IGRPForm`:** use only `name`. The form handles state automatically.

## Example — Standalone

```tsx
const [date, setDate] = useState<Date | undefined>(undefined);

<IGRPDatePickerSingle
  name="birthDate"
  label="Birth Date"
  date={date}
  onDateChange={setDate}
  placeholder="Pick a date"
/>
```

## Example — Inside IGRPForm

```tsx
<IGRPForm schema={schema} formRef={formRef} onSubmit={onSubmit}>
  <IGRPDatePickerSingle name="birthDate" label="Birth Date" required />
</IGRPForm>
```

## Example — With Date Constraints

```tsx
<IGRPDatePickerSingle
  name="startDate"
  label="Start Date"
  date={date}
  onDateChange={setDate}
  disableBefore={new Date()}
/>
```
