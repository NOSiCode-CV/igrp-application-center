# IGRP Date Picker API Reference

## Import

```tsx
import {
  IGRPDatePickerSingle,
  IGRPDatePickerRange,
  IGRPDatePickerMultiple,
  IGRPDatePickerInputSingle,
} from '@igrp/igrp-framework-react-design-system';
```

## Variants

| Component | Purpose |
|-----------|---------|
| `IGRPDatePickerSingle` | Single date picker |
| `IGRPDatePickerRange` | Date range picker |
| `IGRPDatePickerMultiple` | Multiple dates |
| `IGRPDatePickerInputSingle` | Input with inline calendar |

## Common Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `name` | `string` | Yes (form) | Field name |
| `label` | `string` | No | Field label |
| `date` | `Date \| DateRange \| Date[]` | No | **Standalone:** Controlled date value. Use real `Date` objects. |
| `onDateChange` | `(date) => void` | No | **Standalone:** Change handler. |
| `required` | `boolean` | No | Required indicator |
| `placeholder` | `string` | No | Placeholder text |
| `dateFormat` | `string` | No | Custom date format (e.g. `'dd/MM/yyyy'`) |
| `disableBefore` | `Date` | No | Disable dates before this |
| `disableAfter` | `Date` | No | Disable dates after this |

## Standalone Usage Rules

When using date pickers outside of `IGRPForm`, you **MUST** follow these rules:

1. **Use `date` and `onDateChange`**: Do **NOT** use `value` or `onChange`.
2. **Pass real `Date` objects**: Never pass date strings to the `date` prop.
3. **Controlled Mode**: Always use controlled mode to ensure the UI stays in sync.

```tsx
// ✅ Correct (Standalone)
const [myDate, setMyDate] = useState<Date | undefined>(new Date());

<IGRPDatePickerSingle
  date={myDate}
  onDateChange={(d: Date | undefined) => setMyDate(d)}
/>

// ❌ Incorrect
<IGRPDatePickerSingle
  value="2024-01-01" // Error: Use 'date' prop with Date object
  onChange={(e) => ...} // Error: Use 'onDateChange'
/>
```

## Form Usage (Auto-wired)

Inside `IGRPForm`, the component handles its own state using the `name` prop.

```tsx
<IGRPDatePickerSingle name="birthDate" label="Birth Date" required />
<IGRPDatePickerRange name="range" label="Date Range" />
```
