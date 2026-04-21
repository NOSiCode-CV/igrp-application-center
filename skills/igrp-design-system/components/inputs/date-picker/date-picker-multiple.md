# IGRPDatePickerMultiple API Reference

## Import

```tsx
import { IGRPDatePickerMultiple, type IGRPDatePickerMultipleProps } from '@igrp/igrp-framework-react-design-system';
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `string` | - | Field name (required in forms) |
| `label` | `string` | - | Field label |
| `labelClassName` | `string` | - | CSS for the label |
| `helperText` | `string` | - | Helper text below field |
| `required` | `boolean` | `false` | Shows asterisk |
| `date` | `Date[] \| undefined` | - | **Standalone:** controlled array of selected dates |
| `onDateChange` | `(date: Date[] \| undefined) => void` | - | **Standalone:** called when selection changes |
| `dateFormat` | `string` | `'dd/MM/yyyy'` | Display format |
| `placeholder` | `string` | `'Pick a date'` | Placeholder when no dates selected |
| `disabledPicker` | `boolean` | `false` | Disables the trigger button |
| `disabled` | `Date matcher` | - | Disable specific dates (calendar-level) |
| `className` | `string` | - | CSS for the wrapper |

## Display Behaviour

| Selection | Display |
|---|---|
| 0 dates | Placeholder |
| 1 date | Formatted single date |
| 2 dates | `from - to` |
| 3+ dates | `first - last` |

## Critical Rules

- **Standalone:** always use `date` + `onDateChange`. Never use `value` / `onChange`.
- **Pass real `Date` objects** — never strings.
- **Inside `IGRPForm`:** use only `name`. The form stores the `Date[]` value.

## Example — Standalone

```tsx
const [dates, setDates] = useState<Date[] | undefined>(undefined);

<IGRPDatePickerMultiple
  name="holidays"
  label="Holidays"
  date={dates}
  onDateChange={setDates}
  placeholder="Pick dates"
/>
```

## Example — Inside IGRPForm

```tsx
<IGRPForm schema={schema} formRef={formRef} onSubmit={onSubmit}>
  <IGRPDatePickerMultiple name="holidays" label="Holidays" required />
</IGRPForm>
```
