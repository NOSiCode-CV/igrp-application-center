# IGRP Composition Rules

## Cards — always use full composition

```tsx
import {
  IGRPCard, IGRPCardHeader, IGRPCardTitle,
  IGRPCardDescription, IGRPCardContent, IGRPCardFooter, IGRPCardAction,
} from '@igrp/igrp-framework-react-design-system';

// ✅ Correct
<IGRPCard>
  <IGRPCardHeader>
    <IGRPCardTitle>User Profile</IGRPCardTitle>
    <IGRPCardDescription>Manage your details</IGRPCardDescription>
    <IGRPCardAction><IGRPButton size="sm">Edit</IGRPButton></IGRPCardAction>
  </IGRPCardHeader>
  <IGRPCardContent>Content here</IGRPCardContent>
  <IGRPCardFooter>
    <IGRPButton variant="outline">Cancel</IGRPButton>
    <IGRPButton>Save</IGRPButton>
  </IGRPCardFooter>
</IGRPCard>

// ❌ Incorrect — raw div card
<div className="rounded-lg border p-4">...</div>
```

## Tabs — use `IGRPTabs` with tabs array prop

```tsx
import { IGRPTabs, type IGRPTabItem } from '@igrp/igrp-framework-react-design-system';

const tabs: IGRPTabItem[] = [
  { value: 'profile', label: 'Profile', content: <ProfileContent /> },
  { value: 'settings', label: 'Settings', content: <SettingsContent /> },
];

// ✅ Correct
<IGRPTabs tabs={tabs} defaultValue="profile" />

// ❌ Incorrect — manual primitive composition
<Tabs>
  <TabsList>
    <TabsTrigger value="profile">Profile</TabsTrigger>
  </TabsList>
  <TabsContent value="profile">...</TabsContent>
</Tabs>
```

## Modal — IGRPModalDialog with trigger or controlled

```tsx
import { IGRPModalDialog } from '@igrp/igrp-framework-react-design-system';

// Trigger-based
<IGRPModalDialog
  trigger={<IGRPButton>Open</IGRPButton>}
  title="Edit User"
  description="Update user details"
  footer={<IGRPButton type="submit" onClick={() => formRef.current?.submit()}>Save</IGRPButton>}
>
  <MyForm formRef={formRef} />
</IGRPModalDialog>

// Controlled
<IGRPModalDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Confirm"
>
  Are you sure?
</IGRPModalDialog>
```

## Alert Dialog (confirm) — IGRPAlertDialog

```tsx
import { IGRPAlertDialog } from '@igrp/igrp-framework-react-design-system';

<IGRPAlertDialog
  trigger={<IGRPButton variant="destructive">Delete</IGRPButton>}
  title="Delete item?"
  description="This action cannot be undone."
  confirmLabel="Delete"
  cancelLabel="Cancel"
  onConfirm={() => handleDelete()}
/>
```

## Sidebar — wrap with provider

```tsx
import {
  IGRPSidebarProvider, IGRPSidebar, IGRPSidebarContent,
  IGRPSidebarMenu, IGRPSidebarMenuItem, IGRPSidebarMenuButton, IGRPSidebarInset,
} from '@igrp/igrp-framework-react-design-system';

<IGRPSidebarProvider>
  <IGRPSidebar>
    <IGRPSidebarContent>
      <IGRPSidebarMenu>
        <IGRPSidebarMenuItem>
          <IGRPSidebarMenuButton asChild>
            <a href="/dashboard">Dashboard</a>
          </IGRPSidebarMenuButton>
        </IGRPSidebarMenuItem>
      </IGRPSidebarMenu>
    </IGRPSidebarContent>
  </IGRPSidebar>
  <IGRPSidebarInset>
    {/* page content */}
  </IGRPSidebarInset>
</IGRPSidebarProvider>
```

## DataTable — columns + data

```tsx
import { IGRPDataTable, IGRPDataTableRowAction, type ColumnDef } from '@igrp/igrp-framework-react-design-system';

type User = { id: string; name: string; email: string };

const columns: ColumnDef<User>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  {
    id: 'actions',
    cell: ({ row }) => (
      <IGRPDataTableRowAction
        row={row}
        actions={[
          { type: 'link', label: 'Edit', href: `/users/${row.original.id}/edit` },
          { type: 'dialog', label: 'Delete', onConfirm: () => handleDelete(row.original.id) },
        ]}
      />
    ),
  },
];

<IGRPDataTable columns={columns} data={users} />
```

## Avatar — always provide fallback

```tsx
import { IGRPAvatar } from '@igrp/igrp-framework-react-design-system';

<IGRPAvatar
  src="/avatar.jpg"
  name="John Doe"       // used for fallback initials
  size="md"
/>
```

## Toast — IGRPToaster in layout, useIGRPToast in components

```tsx
// In layout.tsx (once)
import { IGRPToaster } from '@igrp/igrp-framework-react-design-system';
<IGRPToaster />

// In components
import { useIGRPToast } from '@igrp/igrp-framework-react-design-system';
const { toast } = useIGRPToast();
toast({ title: 'Success', description: 'Saved!', variant: 'success' });
toast.promise(saveUser(data), { loading: 'Saving...', success: 'Saved!', error: 'Failed' });
```

## Button loading state

```tsx
// ✅ Correct — use loading prop
<IGRPButton loading={isPending} loadingText="Saving...">Save</IGRPButton>

// ❌ Incorrect — manual composition
<Button disabled={isPending}>
  {isPending && <Spinner />}
  Save
</Button>
```

## Icons — use IGRPIcon, not raw Lucide

```tsx
import { IGRPIcon } from '@igrp/igrp-framework-react-design-system';

// ✅ Correct
<IGRPIcon iconName="Check" size={16} className="text-green-500" />

// For inputs with icons
<IGRPInputText
  name="search"
  showIcon
  iconName="Search"
  iconPlacement="start"
/>
```

## Empty states — use IGRPAlert or Empty primitive

```tsx
import { IGRPAlert } from '@igrp/igrp-framework-react-design-system';

// ✅ Correct
<IGRPAlert variant="info" title="No results" description="Try adjusting your filters." />

// ❌ Incorrect — custom div
<div className="rounded-lg border p-8 text-center text-muted-foreground">No results</div>
```

## Page layout pattern

```tsx
import {
  IGRPContainer, IGRPPageHeader, IGRPPageFooter,
} from '@igrp/igrp-framework-react-design-system';

<IGRPPageHeader title="Users" description="Manage all users">
  <IGRPButton showIcon iconName="Plus">Add User</IGRPButton>
</IGRPPageHeader>
<IGRPContainer>
  {/* page content */}
</IGRPContainer>
<IGRPPageFooter>
  <IGRPButton variant="outline">Back</IGRPButton>
  <IGRPButton onClick={() => formRef.current?.submit()}>Save</IGRPButton>
</IGRPPageFooter>
```
