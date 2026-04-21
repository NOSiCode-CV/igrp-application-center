# IGRPDatePickerInputSingle API Reference

## Import

```tsx
import { IGRPDatePickerInputSingle, type IGRPDatePickerInputSingleProps } from '@igrp/igrp-framework-react-design-system';
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `string` | - | Field name (required in forms) |
| `label` | `string` | - | Field label |
| `labelClassName` | `string` | - | CSS for the label |
| `helperText` | `string` | - | Helper text below field |
| `required` | `boolean` | `false` | Shows asterisk |
| `date` | `Date \| undefined` | - | **Standalone:** controlled date value |
| `onDateChange` | `(date: Date \| undefined) => void` | - | **Standalone:** called when date changes |
| `dateFormat` | `string` | `'dd/MM/yyyy'` | Format for both the text input and display |
| `placeholder` | `string` | `dateFormat` value | Input placeholder (defaults to the format string) |
| `disabledPicker` | `boolean` | `false` | Disables both the text input and calendar button |
| `disableBefore` | `Date` | - | Disable all dates before this |
| `disableAfter` | `Date` | - | Disable all dates after this |
| `disableDayOfWeek` | `number[]` | - | Disable specific weekdays (0=Sun … 6=Sat) |
| `inputGroupClassName` | `string` | - | CSS for the inner form item wrapper (form mode only) |
| `className` | `string` | - | CSS for the outer wrapper |

## Difference from IGRPDatePickerSingle

| | `IGRPDatePickerSingle` | `IGRPDatePickerInputSingle` |
|---|---|---|
| Trigger | Button showing formatted date | Text input (type manually or pick) |
| Typing | Not supported | Supported — parses typed string to `Date` |
| Use case | Simple picker | When users need to type dates directly |

## Critical Rules

- **Standalone:** always use `date` + `onDateChange`. Never use `value` / `onChange`.
- Typed input is parsed using the `dateFormat` — only valid dates update the calendar.
- Pressing `ArrowDown` while focused on the input opens the calendar popover.
- **Inside `IGRPForm`:** use only `name`. The form stores a `Date` object.

## Example — Standalone

```tsx
const [date, setDate] = useState<Date | undefined>(undefined);

<IGRPDatePickerInputSingle
  name="eventDate"
  label="Event Date"
  date={date}
  onDateChange={setDate}
  dateFormat="dd/MM/yyyy"
/>
```

## Example — Inside IGRPForm

```tsx
<IGRPForm schema={schema} formRef={formRef} onSubmit={onSubmit}>
  <IGRPDatePickerInputSingle name="eventDate" label="Event Date" required />
</IGRPForm>
```

## Example — With Weekday Restrictions

```tsx
<IGRPDatePickerInputSingle
  name="workDay"
  label="Work Day"
  date={date}
  onDateChange={setDate}
  disableDayOfWeek={[0, 6]}
/>
```
