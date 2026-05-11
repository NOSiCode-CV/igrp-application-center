# IGRPTable — Simple Static Table

A lightweight, generic table for **static or simple data** that does **not** need sorting, filtering, pagination, or server-side logic. Uses a simple `content` array and `columns` config — no TanStack table required.

> **Prefer `IGRPDataTable`** when you need sorting, filtering, pagination, or server-driven data.
> Use `IGRPTable` for small, read-only tables (summaries, reports, config lists).

## Import

```tsx
import { IGRPTable, type IGRPTableProps } from '@igrp/igrp-framework-react-design-system';
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `content` | `T[]` | required | Array of row data objects |
| `columns` | `{ header, accessorKey, render? }[]` | required | Column definitions |
| `actions` | `(row: { original: T }) => ReactNode` | — | Row actions rendered in a right-aligned actions column |
| `showFooter` | `boolean` | `false` | Show the table footer row |
| `footerContent` | `ReactNode` | — | Content rendered in the footer |
| `footerColumn` | `keyof T` | — | Which column the footer content appears in |
| `isStriped` | `boolean` | `false` | Alternate row background (`odd:bg-muted/50`) |
| `isHeaderSticky` | `boolean` | `false` | Sticky header on scroll |
| `tableClass` | `string` | — | CSS class for the outer wrapper |
| `tHeadClass` | `string` | — | CSS class for `<thead>` |
| `tBodyClass` | `string` | — | CSS class for `<tbody>` |
| `tFootClass` | `string` | — | CSS class for `<tfoot>` |
| `tHeadRowClass` | `string` | — | CSS class for header rows |
| `tBodyRowClass` | `string` | — | CSS class for body rows |
| `id` | `string` | auto | HTML `id` attribute |

## Column definition

```tsx
type Column<T> = {
  header: string;               // Column heading text
  accessorKey: keyof T;         // Key into the row data object
  render?: (value: T[keyof T]) => ReactNode;  // Optional custom cell renderer
};
```

## Basic usage

```tsx
type Product = { name: string; price: number; stock: number };

const columns: IGRPTableProps<Product>['columns'] = [
  { header: 'Product', accessorKey: 'name' },
  { header: 'Price', accessorKey: 'price', render: (v) => `$${v}` },
  { header: 'Stock', accessorKey: 'stock' },
];

const data: Product[] = [
  { name: 'Widget A', price: 9.99, stock: 120 },
  { name: 'Widget B', price: 24.99, stock: 45 },
];

<IGRPTable content={data} columns={columns} isStriped />
```

## With row actions

```tsx
<IGRPTable
  content={data}
  columns={columns}
  actions={({ original }) => (
    <IGRPButton size="sm" variant="ghost" onClick={() => handleEdit(original)}>
      Edit
    </IGRPButton>
  )}
/>
```

## With footer

```tsx
<IGRPTable
  content={data}
  columns={columns}
  showFooter
  footerColumn="price"
  footerContent={<strong>Total: $34.98</strong>}
/>
```

## IGRPTable vs IGRPDataTable

| Feature | `IGRPTable` | `IGRPDataTable` |
|---------|------------|----------------|
| Sorting | ❌ | ✅ |
| Filtering | ❌ | ✅ |
| Pagination | ❌ | ✅ |
| Row selection | ❌ | ✅ |
| Column visibility | ❌ | ✅ |
| Server-side data | ❌ | ✅ |
| Setup complexity | Minimal | TanStack `ColumnDef[]` |
| Best for | Small static tables | Full-featured data grids |
