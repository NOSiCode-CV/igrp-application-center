# UI Primitives — Complete Inventory

Low-level building blocks (no `IGRP` prefix). Use for custom composition when the Horizon layer doesn't cover your use case.

```tsx
import { Button, Card, Input, ... } from '@igrp/igrp-framework-react-design-system';
```

---

## Buttons & Actions

| Export | Description |
|--------|-------------|
| `Button` | Core button with `variant` / `size` props |
| `ButtonGroup` | Groups multiple buttons with shared styling |
| `Toggle` | Two-state press button |
| `ToggleGroup`, `ToggleGroupItem` | Radio-style group of toggles |

## Form scaffold

| Export | Description |
|--------|-------------|
| `Form` | react-hook-form `<FormProvider>` wrapper |
| `FormField` | Connects a field to RHF via `Controller` |
| `FormItem` | Wrapper `<div>` for a single field |
| `FormLabel` | `<Label>` bound to the field context |
| `FormControl` | Injects `id`, `aria-*` into the child input |
| `FormMessage` | Renders the field error message |
| `FormDescription` | Renders helper text |
| `useFormField` | Hook — reads `{id, name, error, …}` from field context |

## Field layout

| Export | Description |
|--------|-------------|
| `Field` | Wrapper for label + input + description layout |
| `FieldSet` | `<fieldset>` wrapper for groups |
| `FieldLegend` | `<legend>` for `FieldSet` |
| `FieldLabel` | Label with optional required marker |
| `FieldDescription` | Helper text for a field |
| `FieldError` | Inline error message |
| `FieldRequiredIndicator` | `*` indicator for required fields |

## Inputs

| Export | Description |
|--------|-------------|
| `Input` | Basic `<input>` |
| `InputGroup`, `InputGroupSuffix`, `InputGroupPrefix` | Input with prefix/suffix slots |
| `Textarea` | Multi-line text area |
| `NativeSelect`, `NativeSelectOption`, `NativeSelectOptGroup` | Styled `<select>` element |
| `InputOTP`, `InputOTPGroup`, `InputOTPSlot`, `InputOTPSeparator` | One-time password input |
| `RadioGroup`, `RadioGroupItem` | Accessible radio group |
| `Checkbox` | Accessible checkbox |
| `Switch` | Toggle switch |
| `Slider` | Range slider |
| `Spinner` | Loading spinner (Loader2Icon, animated) |

## Select / Combobox

| Export | Description |
|--------|-------------|
| `Select`, `SelectContent`, `SelectGroup`, `SelectItem`, `SelectLabel`, `SelectSeparator`, `SelectTrigger`, `SelectValue` | Radix-based select |
| `Command`, `CommandDialog`, `CommandInput`, `CommandList`, `CommandEmpty`, `CommandGroup`, `CommandItem`, `CommandShortcut`, `CommandSeparator` | Command palette primitives |
| `Combobox`, `ComboboxAnchor`, `ComboboxBadgeList`, `ComboboxBadgeItem`, `ComboboxContent`, `ComboboxEmpty`, `ComboboxGroup`, `ComboboxInput`, `ComboboxItem`, `ComboboxLabel`, `ComboboxSeparator`, `ComboboxTrigger`, `ComboboxValue` | Multi-select combobox |

## Date / Time

| Export | Description |
|--------|-------------|
| `Calendar` | Standalone calendar (DayPicker) |
| `DatePicker` | Date input with popover calendar |
| `DateRangePicker` | Date range picker |

## Layout & Structure

| Export | Description |
|--------|-------------|
| `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`, `CardAction` | Card composition |
| `AspectRatio` | Maintains aspect ratio |
| `Separator` | Horizontal / vertical divider |
| `ScrollArea`, `ScrollBar` | Overflow scroll container |
| `ResizablePanelGroup`, `ResizablePanel`, `ResizableHandle` | Resizable split layout |
| `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent` | Expand/collapse |
| `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent` | Multi-section accordion |

## Item lists

| Export | Description |
|--------|-------------|
| `Item` | Single list item |
| `ItemGroup` | Wrapper for a list of `Item` components |
| `ItemContent` | Content slot inside `Item` |
| `ItemSeparator` | Divider between items |
| `ItemIndicator` | Selection indicator dot/checkbox |

## Navigation

| Export | Description |
|--------|-------------|
| `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` | Tab navigation |
| `NavigationMenu`, `NavigationMenuList`, `NavigationMenuItem`, `NavigationMenuTrigger`, `NavigationMenuContent`, `NavigationMenuLink`, `NavigationMenuIndicator`, `NavigationMenuViewport` | Full navigation menu |
| `Menubar`, `MenubarMenu`, `MenubarTrigger`, `MenubarContent`, `MenubarItem`, `MenubarSeparator`, `MenubarShortcut`, `MenubarGroup`, `MenubarSub`, `MenubarSubContent`, `MenubarSubTrigger`, `MenubarCheckboxItem`, `MenubarRadioGroup`, `MenubarRadioItem`, `MenubarLabel` | Application menu bar |
| `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbPage`, `BreadcrumbSeparator`, `BreadcrumbEllipsis` | Breadcrumb trail |
| `Pagination`, `PaginationContent`, `PaginationItem`, `PaginationLink`, `PaginationNext`, `PaginationPrevious`, `PaginationEllipsis` | Pagination controls |
| `Sidebar`, `SidebarContent`, `SidebarFooter`, `SidebarGroup`, `SidebarGroupAction`, `SidebarGroupContent`, `SidebarGroupLabel`, `SidebarHeader`, `SidebarInput`, `SidebarInset`, `SidebarMenu`, `SidebarMenuAction`, `SidebarMenuBadge`, `SidebarMenuButton`, `SidebarMenuItem`, `SidebarMenuSkeleton`, `SidebarMenuSub`, `SidebarMenuSubButton`, `SidebarMenuSubItem`, `SidebarProvider`, `SidebarRail`, `SidebarSeparator`, `SidebarTrigger`, `useSidebar` | Sidebar layout system |

## Overlays & Dialogs

| Export | Description |
|--------|-------------|
| `Dialog`, `DialogClose`, `DialogContent`, `DialogDescription`, `DialogFooter`, `DialogHeader`, `DialogOverlay`, `DialogPortal`, `DialogTitle`, `DialogTrigger` | Modal dialog |
| `AlertDialog`, `AlertDialogAction`, `AlertDialogCancel`, `AlertDialogContent`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogHeader`, `AlertDialogOverlay`, `AlertDialogPortal`, `AlertDialogTitle`, `AlertDialogTrigger` | Confirm dialog |
| `Drawer`, `DrawerClose`, `DrawerContent`, `DrawerDescription`, `DrawerFooter`, `DrawerHeader`, `DrawerTitle`, `DrawerTrigger` | Bottom sheet / drawer |
| `Sheet`, `SheetClose`, `SheetContent`, `SheetDescription`, `SheetFooter`, `SheetHeader`, `SheetTitle`, `SheetTrigger` | Side panel sheet |
| `Popover`, `PopoverAnchor`, `PopoverContent`, `PopoverTrigger` | Floating popover |
| `HoverCard`, `HoverCardContent`, `HoverCardTrigger` | Hover tooltip card |
| `Tooltip`, `TooltipContent`, `TooltipProvider`, `TooltipTrigger` | Simple tooltip |
| `ContextMenu`, `ContextMenuCheckboxItem`, `ContextMenuContent`, `ContextMenuGroup`, `ContextMenuItem`, `ContextMenuLabel`, `ContextMenuPortal`, `ContextMenuRadioGroup`, `ContextMenuRadioItem`, `ContextMenuSeparator`, `ContextMenuShortcut`, `ContextMenuSub`, `ContextMenuSubContent`, `ContextMenuSubTrigger`, `ContextMenuTrigger` | Right-click context menu |
| `DropdownMenu`, `DropdownMenuCheckboxItem`, `DropdownMenuContent`, `DropdownMenuGroup`, `DropdownMenuItem`, `DropdownMenuLabel`, `DropdownMenuPortal`, `DropdownMenuRadioGroup`, `DropdownMenuRadioItem`, `DropdownMenuSeparator`, `DropdownMenuShortcut`, `DropdownMenuSub`, `DropdownMenuSubContent`, `DropdownMenuSubTrigger`, `DropdownMenuTrigger` | Dropdown menu |

## Feedback & Status

| Export | Description |
|--------|-------------|
| `Alert`, `AlertDescription`, `AlertTitle` | Inline alert banner |
| `Badge` | Status / label badge |
| `Progress` | Progress bar |
| `Skeleton` | Loading placeholder |
| `Empty` | Empty-state illustration |
| `Toaster` | Toast notification host |
| `Kbd` | Keyboard key display (`<kbd>`) |

## Data Display

| Export | Description |
|--------|-------------|
| `Avatar`, `AvatarFallback`, `AvatarImage` | User avatar |
| `Table`, `TableBody`, `TableCaption`, `TableCell`, `TableFooter`, `TableHead`, `TableHeader`, `TableRow` | HTML table primitives |
| `Carousel`, `CarouselContent`, `CarouselItem`, `CarouselNext`, `CarouselPrevious` | Swipeable carousel |
| `Stepper`, `StepperItem`, `StepperIndicator`, `StepperSeparator`, `StepperTitle`, `StepperDescription` | Multi-step wizard |
| `Label` | `<label>` with `htmlFor` |

## Charts

| Export | Description |
|--------|-------------|
| `ChartContainer` | Wrapper that injects chart config / theme |
| `ChartTooltip`, `ChartTooltipContent` | Recharts tooltip |
| `ChartLegend`, `ChartLegendContent` | Recharts legend |
| `ChartStyle` | Injects CSS custom properties for chart colors |
| `type ChartConfig` | Config shape — `{ [key]: { label, color } }` |

## Media

| Export | Description |
|--------|-------------|
| `Cropper` | Image crop / zoom component |

## Direction (RTL)

| Export | Description |
|--------|-------------|
| `Direction` | Sets text direction (`ltr` / `rtl`) on a subtree |
