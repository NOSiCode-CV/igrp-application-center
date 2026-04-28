# IGRPDatePickerRange API Reference

## Import

```tsx
import { IGRPDatePickerRange, type IGRPDatePickerRangeProps } from '@igrp/igrp-framework-react-design-system';
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `string` | - | Field name (required in forms) |
| `label` | `string` | - | Field label |
| `labelClassName` | `string` | - | CSS for the label |
| `helperText` | `string` | - | Helper text below field |
| `required` | `boolean` | `false` | Shows asterisk |
| `date` | `DateRange \| undefined` | - | **Standalone:** controlled range value `{ from: Date, to?: Date }` |
| `onDateChange` | `(date: DateRange \| undefined) => void` | - | **Standalone:** called when range changes |
| `dateFormat` | `string` | `'dd/MM/yyyy'` | Display format for each date |
| `placeholder` | `string` | `'Pick a date'` | Placeholder when no range selected |
| `disabledPicker` | `boolean` | `false` | Disables the trigger button |
| `disabled` | `DateRange matcher` | - | Disable specific dates (calendar-level) |
| `disableBefore` | `Date` | - | Disable all dates before this |
| `disableAfter` | `Date` | - | Disable all dates after this |
| `className` | `string` | - | CSS for the wrapper |

## DateRange Type

```tsx
import { type DateRange } from 'react-day-picker';
// { from: Date | undefined; to?: Date | undefined }
```

## Critical Rules

- **Standalone:** always use `date` + `onDateChange`. Never use `value` / `onChange`.
- **Pass real `Date` objects** — never strings.
- The popover closes automatically once both `from` and `to` are selected.
- **Inside `IGRPForm`:** use only `name`. The form stores the `DateRange` object.

## Example — Standalone

```tsx
const [range, setRange] = useState<DateRange | undefined>(undefined);

<IGRPDatePickerRange
  name="period"
  label="Period"
  date={range}
  onDateChange={setRange}
  placeholder="Select date range"
/>
```

## Example — Inside IGRPForm

```tsx
<IGRPForm schema={schema} formRef={formRef} onSubmit={onSubmit}>
  <IGRPDatePickerRange name="period" label="Period" required />
</IGRPForm>
```
