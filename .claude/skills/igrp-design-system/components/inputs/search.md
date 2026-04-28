# IGRPInputSearch API Reference

## Import

```tsx
import { IGRPInputSearch, type IGRPInputSearchProps } from '@igrp/igrp-framework-react-design-system';
```

## IGRPInputSearchProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `string` | - | Field name |
| `label` | `string` | - | Field label |
| `helperText` | `string` | - | Helper text below field |
| `required` | `boolean` | `false` | Shows asterisk |
| `error` | `string` | - | Validation error message |
| `value` | `string` | - | Controlled value |
| `defaultValue` | `string` | `''` | Default value |
| `onSearch` | `(value: string) => void` | - | Called on submit button click or Enter key |
| `setValueChange` | `(value: string) => void` | - | Called on every input change |
| `showStartIcon` | `boolean` | `true` | Show search icon at start |
| `startIcon` | `IGRPIconName` | `'Search'` | Start icon name |
| `showSubmitButton` | `boolean` | `true` | Show submit button |
| `submitIcon` | `IGRPIconName` | `'ArrowRight'` | Icon for submit button |
| `submitButtonLabel` | `string` | - | Accessible label / text for submit button |
| `submitButtonClassName` | `string` | - | CSS for submit button |
| `submitVariant` | `string` | `'ghost'` | Submit button variant |
| `isDebounce` | `boolean` | `false` | Enable debounce on `onSearch` |
| `debounceMs` | `number` | `2000` | Debounce delay in ms |
| `loading` | `boolean` | - | Show loading state on submit button |
| `disabled` | `boolean` | - | Disables the input |

## Example — Standalone

```tsx
<IGRPInputSearch
  name="search"
  label="Search"
  placeholder="Search users..."
  onSearch={(value) => console.log('Searching:', value)}
/>
```

## Example — With Debounce

```tsx
<IGRPInputSearch
  name="search"
  isDebounce
  debounceMs={500}
  onSearch={(value) => fetchResults(value)}
  showSubmitButton={false}
/>
```

## Example — Inside IGRPForm

```tsx
<IGRPForm schema={schema} formRef={formRef} onSubmit={onSubmit}>
  <IGRPInputSearch name="query" label="Search" onSearch={handleSearch} />
</IGRPForm>
```
