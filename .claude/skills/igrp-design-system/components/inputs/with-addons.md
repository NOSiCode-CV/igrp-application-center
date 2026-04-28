# IGRPInputAddOn API Reference

## Import

```tsx
import { IGRPInputAddOn, type IGRPInputAddOnProps } from '@igrp/igrp-framework-react-design-system';
```

## IGRPInputAddOnProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `string` | - | Field name |
| `label` | `string` | - | Field label |
| `options` | `IGRPOptionsProps[]` | - | Options for the addon select (required) |
| `optionLabel` | `string` | - | Label shown as group header inside the dropdown |
| `selectValue` | `string` | - | Controlled selected addon value |
| `onSelectValueChange` | `(value: string) => void` | - | Called when addon selection changes |
| `classNameLabel` | `string` | - | CSS for the label |
| `placeholder` | `string` | - | Placeholder for the text input |
| `disabled` | `boolean` | - | Disables the input |
| `value` | `string` | - | Controlled text input value |
| `onChange` | `React.ChangeEventHandler` | - | Called when text input changes |

## IGRPOptionsProps

| Prop | Type | Description |
|------|------|-------------|
| `value` | `string` | Option value |
| `label` | `string` | Option label |
| `color` | `string` | Optional Tailwind color class applied to the label |

## Example — Currency Prefix

```tsx
const [currency, setCurrency] = useState('EUR');

<IGRPInputAddOn
  name="amount"
  label="Amount"
  options={[
    { value: 'EUR', label: '€' },
    { value: 'USD', label: '$' },
    { value: 'GBP', label: '£' },
  ]}
  selectValue={currency}
  onSelectValueChange={setCurrency}
  placeholder="0.00"
  type="number"
/>
```

## Example — Unit Suffix

```tsx
<IGRPInputAddOn
  name="weight"
  label="Weight"
  options={[
    { value: 'kg', label: 'kg' },
    { value: 'lb', label: 'lb' },
  ]}
  placeholder="Enter weight"
/>
```

## Note

`IGRPInputAddOn` does not integrate with `IGRPForm` via Controller — manage the text input value with standard `value`/`onChange` props. Use it as a standalone composite input.
