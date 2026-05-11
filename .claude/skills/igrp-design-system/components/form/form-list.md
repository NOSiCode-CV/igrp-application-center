# IGRPFormList API Reference

## Import

```tsx
import { IGRPFormList, type IGRPFormListProps } from '@igrp/igrp-framework-react-design-system';
```

## Purpose

Dynamic list of form items (field array). Each item is an accordion/card. Users can add/remove items. Works inside IGRPForm (uses useFieldArray) or standalone (controlled value/onChange).

## IGRPFormListProps

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `id` | `string` | Yes | Unique id for the field array |
| `defaultItem` | `TItem` | No | Template for new items |
| `renderItem` | `(item, index, onChange?) => ReactNode` | Yes | Render each item |
| `computeLabel` | `(item, index) => string` | No | Label for accordion header |
| `label` | `string` | No | Section label |
| `description` | `string` | No | Section description |
| `addButtonLabel` | `string` | No | Add button text |
| `addButtonIconName` | `IGRPIconName` | No | Add button icon |
| `allowEmpty` | `boolean` | No | Allow zero items |
| `allowMultipleOpen` | `boolean` | No | Multiple accordions open at once |
| `value` | `TItem[]` | No | Standalone mode: controlled value |
| `defaultValue` | `TItem[]` | No | Standalone mode: initial value |
| `onChange` | `(items: TItem[]) => void` | No | Standalone mode: change handler |

## Schema for Form Mode

```tsx
const schema = z.object({
  items: z.array(z.object({
    name: z.string(),
    quantity: z.number(),
  })),
});
```

## Example (Form Mode)

```tsx
<IGRPForm schema={schema} formRef={formRef} onSubmit={onSubmit}>
  <IGRPFormList
    id="items"
    defaultItem={{ name: '', quantity: 0 }}
    renderItem={(item, index, onChange) => (
      <>
        <IGRPInputText name={`items.${index}.name`} label="Name" />
        <IGRPInputNumber name={`items.${index}.quantity`} label="Qty" />
      </>
    )}
    computeLabel={(item) => item.name || `Item ${index + 1}`}
    addButtonLabel="Add item"
  />
</IGRPForm>
```
