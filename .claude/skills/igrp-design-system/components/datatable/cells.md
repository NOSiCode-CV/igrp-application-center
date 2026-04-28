# IGRPDataTable Cell Components

## Import

```tsx
import {
  IGRPDataTableCellCheckbox,
  IGRPDataTableCellSwitch,
  IGRPDataTableCellExpander,
  IGRPDataTableCellAmount,
  IGRPDataTableCellBadge,
  IGRPDataTableCellDate,
  IGRPDataTableCellLink,
  IGRPDataTableCellTooltip,
} from '@igrp/igrp-framework-react-design-system';
```

## Cell Components

| Component | Purpose |
|-----------|---------|
| `IGRPDataTableCellCheckbox` | Row selection checkbox |
| `IGRPDataTableCellSwitch` | Row selection switch |
| `IGRPDataTableCellExpander` | Expand/collapse button |
| `IGRPDataTableCellAmount` | Formatted number/currency |
| `IGRPDataTableCellBadge` | Badge with status |
| `IGRPDataTableCellDate` | Formatted date |
| `IGRPDataTableCellLink` | Link to detail page |
| `IGRPDataTableCellTooltip` | Content with tooltip |

## Example: Amount Cell

```tsx
{
  accessorKey: 'amount',
  header: 'Amount',
  cell: ({ row }) => (
    <IGRPDataTableCellAmount 
      field={row.original.amount.toString()} 
      currency="EUR" 
      formatStyle="currency" 
    />
  ),
}
```

## Example: Badge Cell

```tsx
{
  accessorKey: 'status',
  header: 'Status',
  cell: ({ row }) => (
    <IGRPDataTableCellBadge 
      label={row.original.status === 'active' ? 'Active' : 'Inactive'} 
      color={row.original.status === 'active' ? 'success' : 'secondary'}
      variant="soft"
    />
  ),
}
```
