# IGRPDataTable Pagination

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showPagination` | `boolean` | `false` | Enable pagination |
| `isNumericPagination` | `boolean` | `false` | Use numeric page selector instead of prev/next |
| `pageSizePagination` | `number[]` | `[50,100,150,200]` | Page size options |

## Example

```tsx
<IGRPDataTable
  columns={columns}
  data={data}
  showPagination
  isNumericPagination
  pageSizePagination={[10, 25, 50, 100]}
/>
```
