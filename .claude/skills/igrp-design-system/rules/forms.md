# IGRP Form Rules

## Always use IGRPForm + Zod

```tsx
import { z } from 'zod';
import { useRef } from 'react';
import { IGRPForm, IGRPInputText, IGRPButton, type IGRPFormHandle } from '@igrp/igrp-framework-react-design-system';

const schema = z.object({
  name: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  role: z.string(),
});

function UserForm() {
  const formRef = useRef<IGRPFormHandle<typeof schema> | null>(null);

  return (
    <IGRPForm
      schema={schema}
      formRef={formRef}
      defaultValues={{ name: '', email: '', role: '' }}
      onSubmit={async (values) => {
        // values is fully typed
        await saveUser(values);
      }}
    >
      <IGRPInputText name="name" label="Name" required />
      <IGRPInputText name="email" label="Email" type="email" required />
      <IGRPSelect name="role" label="Role" options={[{ label: 'Admin', value: 'admin' }]} />
      <IGRPButton type="submit">Save</IGRPButton>
    </IGRPForm>
  );
}
```

## Rules

### ✅ Correct

- `IGRPForm` requires `schema` (Zod), `formRef`, and `onSubmit`.
- IGRP inputs (`IGRPInputText`, `IGRPSelect`, `IGRPCheckbox`, etc.) **auto-detect `IGRPForm` context** and bind themselves — no manual `register()` needed.
- Use `IGRPFormField` only when wrapping custom or primitive inputs.

```tsx
// Custom input needing explicit field wiring
import { useIGRPFormContext } from '@igrp/igrp-framework-react-design-system';

function MyCustomInput() {
  const { form } = useIGRPFormContext();
  return (
    <IGRPFormField
      name="custom"
      control={form.control}
      render={({ field }) => <input {...field} />}
    />
  );
}
```

### ❌ Incorrect

```tsx
// Never use raw react-hook-form directly
const { register } = useForm();
<input {...register('name')} />

// Never skip formRef
<IGRPForm schema={schema} onSubmit={...}>  {/* missing formRef */}
```

## IGRPFormHandle API

```tsx
// Programmatic control from parent (e.g. modal footer button)
formRef.current?.submit();
formRef.current?.reset();
formRef.current?.setGlobalError('API error message');
formRef.current?.clearGlobalError();
```

## IGRPForm Props

| Prop | Type | Description |
|------|------|-------------|
| `schema` | `ZodSchema` | Zod validation schema (required) |
| `formRef` | `RefObject<IGRPFormHandle>` | Required for programmatic control |
| `onSubmit` | `(values) => Promise<void>` | Submit handler with typed values |
| `defaultValues` | `Partial<z.infer<schema>>` | Initial field values |
| `resetKey` | `string \| number` | Change to remount/reset form (use when switching records) |
| `disabled` | `boolean` | Disable all inputs |
| `className` | `string` | Wrapper class |

## Validation Patterns

```tsx
// Required fields
z.string().min(1, 'Required')

// Optional with transform
z.string().optional()
z.coerce.number().min(0)

// Object with refinement
z.object({ password: z.string(), confirm: z.string() })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords don't match",
    path: ['confirm'],
  })
```

## Loading External Data Into Form

```tsx
// Use resetKey to remount when record changes — avoids useEffect value syncing
<IGRPForm
  schema={schema}
  formRef={formRef}
  resetKey={record.id}            // changes when switching records
  defaultValues={record}
  onSubmit={handleSubmit}
>
```

## IGRPFormList (Dynamic Field Arrays)

```tsx
import { IGRPFormList, IGRPInputText } from '@igrp/igrp-framework-react-design-system';

// Inside IGRPForm
<IGRPFormList name="items" label="Items" addLabel="Add Item">
  {(index) => (
    <IGRPInputText name={`items.${index}.name`} label="Item name" />
  )}
</IGRPFormList>
```
