# IGRPForm API Reference

## Import

```tsx
import { IGRPForm, type IGRPFormProps, type IGRPFormHandle } from '@igrp/igrp-framework-react-design-system';
```

## IGRPFormProps

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `schema` | `z.ZodType` | Yes | - | Zod schema for validation |
| `formRef` | `RefObject<IGRPFormHandle<TSchema> \| null>` | Yes | - | Ref to access form handle |
| `onSubmit` | `(values: OutputOf<TSchema>) => void \| Promise<void>` | Yes | - | Called when form is valid and submitted |
| `defaultValues` | `InputOf<TSchema>` | No | - | Initial form values |
| `validationMode` | `'onSubmit' \| 'onChange' \| 'onBlur' \| 'onTouched' \| 'all'` | No | `'onSubmit'` | When to run validation |
| `resetAfterSubmit` | `boolean` | No | `false` | Reset to defaultValues after successful submit |
| `onError` | `(error: unknown) => void` | No | - | Called when submission throws |
| `showToastOnError` | `boolean` | No | `false` | Show toast on submission error |
| `className` | `string` | No | - | CSS classes for form element |
| `gridClassName` | `string` | No | - | CSS classes for grid wrapping fields |
| `id` | `string` | No | - | HTML id attribute |
| `disabled` | `boolean` | No | `false` | Disable all inputs |
| `resetKey` | `React.Key` | No | - | Key to remount form when changed (e.g. record id) |

## Submit Validation Rules

**CRITICAL:** ALWAYS implement explicit validation before processing the submit.

1.  **Never show "Success" messages without validating fields.**
2.  **Date Validation:** For mandatory date fields, explicitly check if the value is not `undefined` or `null` before processing.
3.  **Schema Enforcement:** Ensure the `schema` accurately reflects mandatory fields using Zod's `.min(1)` or `.nullable()`.

```tsx
const onSubmit = async (values: typeof schema._type) => {
  // 1. Explicitly check mandatory fields if needed (especially dates)
  if (!values.startDate) {
    igrpToast({ type: 'error', message: 'Start date is required' });
    return;
  }

  // 2. Process data...
  await save(values);

  // 3. Only show success after successful processing
  igrpToast({ type: 'success', message: 'Saved successfully' });
};
```

## IGRPFormHandle

Exposed via `formRef.current`:

| Method/Property | Type | Description |
|-----------------|------|-------------|
| `submit` | `() => Promise<void>` | Programmatically submit the form |
| `reset` | `(values?) => void` | Reset form to default or provided values |
| `setGlobalError` | `(message: string) => void` | Set global form error message |
| `clearGlobalError` | `() => void` | Clear global form error |
| `isSubmitting` | `boolean` | Whether form is currently submitting |
| (react-hook-form) | `UseFormReturn` | All useForm methods: `watch`, `setValue`, `getValues`, etc. |

## Example: Programmatic Submit

```tsx
const formRef = useRef<IGRPFormHandle<typeof schema> | null>(null);

// In modal footer or external button:
<IGRPButton onClick={() => formRef.current?.submit()}>Save</IGRPButton>
```

## Example: Reset on Record Change

```tsx
<IGRPForm
  schema={schema}
  formRef={formRef}
  defaultValues={record}
  resetKey={record?.id}
  onSubmit={onSubmit}
>
  {/* fields */}
</IGRPForm>
```
