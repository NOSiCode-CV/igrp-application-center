# IGRPDataTable Filters

## Client Filters

Use `clientFilters` prop with `IGRPDataTableClientFilterListProps[]`:

```tsx
clientFilters={[
  {
    columnId: 'status',
    filterComponent: IGRPDataTableFilterSelect,
    filterProps: { options: [{ label: 'Active', value: 'active' }] },
  },
  {
    columnId: 'name',
    filterComponent: IGRPDataTableFilterInput,
  },
]}
```

## Filter Components

- `IGRPDataTableFilterInput` – Text input
- `IGRPDataTableFilterSelect` – Select dropdown
- `IGRPDataTableFilterDate` – Date range
- `IGRPDataTableFilterFaceted` – Faceted (unique values)
- `IGRPDataTableFilterMinMax` – Min/max numeric
- `IGRPDataTableFilterDropdown` – Custom dropdown

## Server-Side

Set `isServerSide={true}` and provide `serverFilterComponent` for custom filter UI. Handle filtering in parent (fetch with filtered params).
