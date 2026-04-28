# IGRPInputHidden API Reference

## Import

```tsx
import { IGRPInputHidden } from '@igrp/igrp-framework-react-design-system';
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `string` | - | Field name (required in forms) |
| `id` | `string` | - | HTML id (falls back to `name`) |
| `required` | `boolean` | `false` | Required attribute |
| `value` | `string` | - | Standalone: static hidden value |
| `defaultValue` | `string` | - | Default value |

## Behaviour

- Renders a native `<input type="hidden">`.
- Inside `IGRPForm`: auto-wires via `IGRPFormField` — the value is part of the form state and included on submit.
- Outside `IGRPForm`: renders a plain hidden input with the provided `value`.
- No label, helper text, or error UI — it is invisible by design.

## Example — Standalone

```tsx
<IGRPInputHidden name="userId" value="42" />
```

## Example — Inside IGRPForm

```tsx
<IGRPForm schema={schema} formRef={formRef} onSubmit={onSubmit}>
  <IGRPInputHidden name="recordId" value={record.id} />
  <IGRPInputText name="name" label="Name" required />
</IGRPForm>
```

## Note

Use `IGRPInputHidden` to pass non-visible values (e.g. IDs, tokens) through a form submit without rendering any UI.
