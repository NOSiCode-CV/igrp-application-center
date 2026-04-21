# IGRPDataTable Row Actions

## Import

```tsx
import {
  IGRPDataTableRowAction,
  IGRPDataTableButtonLink,
  IGRPDataTableButtonModal,
  IGRPDataTableButtonAlert,
  IGRPDataTableDropdownMenu,
  IGRPDataTableDropdownMenuLink,
  IGRPDataTableDropdownMenuAlert,
} from '@igrp/igrp-framework-react-design-system';
```

## Action Buttons

- `IGRPDataTableButtonLink` – Link to detail/edit
- `IGRPDataTableButtonModal` – Open modal
- `IGRPDataTableButtonAlert` – Confirm dialog

## Dropdown Menu

- `IGRPDataTableDropdownMenu` – Container with `items` array.
- `IGRPDataTableDropdownMenuLink` – Link item component.
- `IGRPDataTableDropdownMenuAlert` – Alert dialog item component.

## Example

```tsx
{
  id: 'actions',
  header: '',
  cell: ({ row }) => (
    <IGRPDataTableRowAction>
      <IGRPDataTableDropdownMenu
        iconName="Ellipsis"
        items={[
          {
            component: IGRPDataTableDropdownMenuLink,
            props: {
              labelTrigger: 'Edit',
              href: `/users/${row.original.id}/edit`,
              showIcon: true,
              icon: 'Pencil',
            },
          },
          {
            component: IGRPDataTableDropdownMenuAlert,
            props: {
              labelTrigger: 'Delete',
              modalTitle: 'Confirm Deletion',
              children: 'Are you sure you want to delete this user?',
              onClickConfirm: () => deleteUser(row.original.id),
              showIcon: true,
              icon: 'Trash2',
            },
          },
        ]}
      />
    </IGRPDataTableRowAction>
  ),
}
```
