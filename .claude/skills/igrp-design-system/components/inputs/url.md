# IGRPInputUrl API Reference

## Import

```tsx
import { IGRPInputUrl, type IGRPInputUrlProps } from '@igrp/igrp-framework-react-design-system';
```

## IGRPInputUrlProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `string` | - | Field name (required) |
| `label` | `string` | - | Field label |
| `helperText` | `string` | - | Helper text below field |
| `required` | `boolean` | `false` | Shows asterisk |
| `error` | `string` | - | Validation error message |
| `value` | `string` | - | Controlled full URL value |
| `defaultValue` | `string` | `''` | Default full URL value |
| `onChange` | `(value: string) => void` | - | Called with the full URL (protocol + address) |
| `protocols` | `IGRPOptionsProps[]` | `['https://', 'http://', 'ftp://', 'sftp://', 'ws://', 'wss://']` | Protocol options for the selector |
| `defaultProtocol` | `string` | `'https://'` | Default selected protocol |
| `disabled` | `boolean` | - | Disables the input |

## Example — Standalone

```tsx
<IGRPInputUrl
  name="website"
  label="Website"
  defaultProtocol="https://"
/>
```

## Example — Custom Protocols

```tsx
<IGRPInputUrl
  name="endpoint"
  label="API Endpoint"
  protocols={[
    { value: 'https://', label: 'https://' },
    { value: 'http://', label: 'http://' },
  ]}
  defaultProtocol="https://"
/>
```

## Example — Inside IGRPForm

```tsx
<IGRPForm schema={schema} formRef={formRef} onSubmit={onSubmit}>
  <IGRPInputUrl name="website" label="Website" required />
</IGRPForm>
```

## Note

The `onChange` and form value always contain the full URL string including the protocol prefix (e.g. `https://example.com`).
