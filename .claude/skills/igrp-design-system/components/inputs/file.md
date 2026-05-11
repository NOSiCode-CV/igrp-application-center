# IGRPInputFile API Reference

## Import

```tsx
import { IGRPInputFile, type IGRPInputFileProps } from '@igrp/igrp-framework-react-design-system';
```

## IGRPInputFileProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `string` | - | Field name (required in forms) |
| `label` | `string` | - | Field label |
| `helperText` | `string` | - | Helper text below field |
| `required` | `boolean` | `false` | Shows asterisk |
| `error` | `string` | - | Validation error message |
| `accept` | `string` | - | Accepted file types (e.g. `'image/*'`, `'.pdf'`) |
| `multiple` | `boolean` | `false` | Allow multiple file selection |
| `disabled` | `boolean` | `false` | Disables the input |
| `onChange` | `React.ChangeEventHandler` | - | Called when files are selected |

## Example — Standalone

```tsx
<IGRPInputFile
  name="avatar"
  label="Profile Picture"
  accept="image/*"
/>
```

## Example — Multiple Files

```tsx
<IGRPInputFile
  name="documents"
  label="Upload Documents"
  accept=".pdf,.docx"
  multiple
  helperText="You can upload multiple files."
/>
```

## Example — Inside IGRPForm

```tsx
<IGRPForm schema={schema} formRef={formRef} onSubmit={onSubmit}>
  <IGRPInputFile name="attachment" label="Attachment" accept=".pdf" required />
</IGRPForm>
```

## Note

Inside `IGRPForm`, the file value stored is `File` (single) or `FileList` (multiple). Use `z.instanceof(File)` in your Zod schema for single file validation.
