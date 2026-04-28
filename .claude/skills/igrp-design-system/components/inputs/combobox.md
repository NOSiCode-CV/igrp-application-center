# IGRPCombobox API Reference

## Import

```tsx
import { IGRPCombobox, type IGRPComboboxProps } from '@igrp/igrp-framework-react-design-system';
```

## Purpose

Searchable select with autocomplete. Use for long option lists.

## IGRPComboboxProps

Similar to IGRPSelect: `name`, `options`, `label`, `placeholder`, `value`, `onValueChange`, `showSearch`, etc.

## Example

```tsx
<IGRPCombobox
  name="country"
  label="Country"
  options={countries.map(c => ({ label: c.name, value: c.code }))}
  placeholder="Search countries..."
/>
```
