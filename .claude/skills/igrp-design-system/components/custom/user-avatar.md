# IGRPUserAvatar

## Props

| Prop | Type | Description |
|------|------|-------------|
| `image` | `string \| null` | Avatar image URL |
| `alt` | `string` | Image alt text |
| `fallbackContent` | `ReactNode` | Shown when image fails (e.g. initials) |
| `className` | `string` | Container CSS |
| `fallbackClass` | `string` | Fallback CSS |

## Example

```tsx
<IGRPUserAvatar
  image={user.avatarUrl}
  fallbackContent={user.name.slice(0, 2).toUpperCase()}
/>
```
