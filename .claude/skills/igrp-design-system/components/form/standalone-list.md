# IGRPStandaloneList API Reference

## Import

```tsx
import { IGRPStandaloneList, type IGRPStandaloneListProps } from '@igrp/igrp-framework-react-design-system';
```

## Purpose

List component for add/remove items when **not** inside a form. Use when you need a dynamic list without form validation (e.g. building a payload manually).

## IGRPStandaloneListProps

Similar to IGRPFormList but always uses `value` and `onChange` (controlled). No form context.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `TItem[]` | Yes | Current items |
| `onChange` | `(items: TItem[]) => void` | Yes | Called when items change |
| `defaultItem` | `TItem` | No | Template for new items |
| `renderItem` | `(item, index, onChange) => ReactNode` | Yes | Render each item |
| `label` | `string` | No | Section label |
| `addButtonLabel` | `string` | No | Add button text |

## Example

```tsx
const [items, setItems] = useState<{ name: string }[]>([]);

<IGRPStandaloneList
  value={items}
  onChange={setItems}
  defaultItem={{ name: '' }}
  renderItem={(item, index, onChange) => (
    <IGRPInputText
      value={item.name}
      onChange={(e) => {
        const next = [...items];
        next[index] = { ...next[index], name: e.target.value };
        setItems(next);
      }}
      label="Name"
    />
  )}
  addButtonLabel="Add"
/>
```
