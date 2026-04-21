# IGRPDataTable API Reference

## Import

```tsx
import { IGRPDataTable, type IGRPDataTableProps, type ColumnDef } from '@igrp/igrp-framework-react-design-system';
```

## IGRPDataTableProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `columns` | `ColumnDef<TData, TValue>[]` | - | TanStack Table column definitions |
| `data` | `TData[]` | - | Table rows |
| `showPagination` | `boolean` | `false` | Show pagination |
| `isNumericPagination` | `boolean` | `false` | Numeric page selector |
| `pageSizePagination` | `number[]` | `[50,100,150,200]` | Page size options |
| `showFilter` | `boolean` | `false` | Show filter UI |
| `clientFilters` | `IGRPDataTableClientFilterListProps[]` | - | Client filter configs |
| `showToggleColumn` | `boolean` | `false` | Column visibility toggle |
| `isServerSide` | `boolean` | `false` | Server-side mode |
| `serverFilterComponent` | `ReactNode` | - | Custom filter for server mode |
| `notFoundLabel` | `string` | `'Nenhum registo encontrado.'` | No rows message |
| `getRowCanExpand` | `(row) => boolean` | `() => false` | Condition to enable expansion for a row |
| `renderSubComponent` | `(row) => ReactElement` | - | Component to render inside the expanded row |

## Row Expansion Configuration

To enable expandable rows in `IGRPDataTable`, you must:

1.  **Add an expand column**: Include a column with `IGRPDataTableCellExpander` in your `columns` definition.
2.  **Define `getRowCanExpand`**: Provide a function to determine if a specific row can be expanded.
3.  **Define `renderSubComponent`**: Provide the component to render when a row is expanded.

### Example

```tsx
import { 
  IGRPDataTable, 
  IGRPDataTableCellExpander, 
  type ColumnDef 
} from '@igrp/igrp-framework-react-design-system';

const columns: ColumnDef<UserRow>[] = [
  {
    id: 'expand',
    header: () => null, // No header for expand column
    cell: ({ row }) => <IGRPDataTableCellExpander row={row} />,
    enableSorting: false,
    enableHiding: false,
    size: 46,
  },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
];

<IGRPDataTable
  data={users}
  columns={columns}
  getRowCanExpand={(row) => true} // Enable expansion for all rows
  renderSubComponent={(row) => (
    <div className="p-4 bg-muted/40 rounded-md">
      <p><strong>Detailed Info for:</strong> {row.original.name}</p>
      {/* Add more details here */}
    </div>
  )}
/>
```
