# IGRPSelect API Reference

## Import

```tsx
import { IGRPSelect, type IGRPSelectProps } from '@igrp/igrp-framework-react-design-system';
```

## IGRPSelectProps

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `name` | `string` | Yes (form) | Field name |
| `options` | `IGRPOptionsProps[]` | Yes | `{ label, value, color?, status?, icon?, group? }` |
| `label` | `string` | No | Field label |
| `placeholder` | `string` | No | Placeholder when empty |
| `value` | `string` | No | **Standalone:** Controlled value. |
| `onValueChange` | `(value: string) => void` | No | **Standalone:** Change handler. |
| `showSearch` | `boolean` | No | Enable search/filter |
| `showStatus` | `boolean` | No | Show status color |
| `showGroup` | `boolean` | No | Group options by `group` |
| `required` | `boolean` | No | Required indicator |
| `error` | `string` | No | Validation error |

## IGRPOptionsProps

```ts
{ label: string; value: string; color?: string; status?: IGRPColorVariants; icon?: string; group?: string; description?: string; image?: string; flag?: string }
```

## Standalone Usage Rules

When using `IGRPSelect` outside of `IGRPForm`, **always use controlled mode**.

```tsx
// ✅ Correct (Standalone Controlled Mode)
const [value, setValue] = useState("active");

<IGRPSelect
  value={value}
  onValueChange={(val: string) => setValue(val)}
  options={[
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ]}
/>

// ❌ Avoid defaultValue
<IGRPSelect defaultValue="active" ... />
```

## Form Usage (Auto-wired)

Inside `IGRPForm`, the component handles its own state using the `name` prop.

```tsx
<IGRPSelect
  name="status"
  label="Status"
  options={[
    { label: 'Active', value: 'active', status: 'success' },
    { label: 'Inactive', value: 'inactive', status: 'secondary' },
  ]}
  placeholder="Select status"
  showSearch
/>
```
