# Menu Parent Type Radio — Design Spec

**Date:** 2026-06-18  
**Scope:** `MenuParentCombobox` component and its usage in `MenuFormBody`

---

## Problem

When creating a `MENU_PAGE` or `EXTERNAL_PAGE` menu, the parent can be either a group or a folder. The previous implementation showed both in a single flat combobox, which is ambiguous. The user wants to first pick the parent type (radio), then select from only that type's options.

## Design

### Hierarchy section — page types only

For `MENU_PAGE` and `EXTERNAL_PAGE`, the "Hierarquia" fieldset shows:

1. **Radio group** — "Grupo" / "Pasta", defaults to "Grupo" on open.
2. **Combobox** — label and options adapt to the selected radio value:
   - "Grupo" selected → label "Selecionar grupo...", options = `groupOptions`
   - "Pasta" selected → label "Selecionar pasta...", options = `folderOptions`
3. **Switching radio clears `parentCode`** — to prevent a stale value from a different type.

For `FOLDER` type, the radio is not shown — the parent is always a group (existing behavior unchanged).

### State

A local `parentType` state (`"GROUP" | "FOLDER"`) lives inside `MenuParentCombobox`, initialized to `"GROUP"`. It is purely UI state — it does not persist to the form; only `parentCode` is submitted.

### Props

```ts
interface MenuParentComboboxProps {
  control: Control<CreateMenu>;
  menuType: string;       // drives radio visibility
  groupOptions: IGRPMenuItemArgs[];
  folderOptions: IGRPMenuItemArgs[];
  disabled?: boolean;
}
```

No changes to the parent component (`MenuFormBody`) — it already passes `groupOptions` and `folderOptions` separately.

## Files changed

- `src/features/menus/components/menu-parent-combobox.tsx` — add radio group, local state, conditional options
