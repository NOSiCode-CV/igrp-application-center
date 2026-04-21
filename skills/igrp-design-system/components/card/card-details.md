# IGRPCardDetails API Reference

## Import

```tsx
import { IGRPCardDetails, type IGRPCardDetailsProps, type IGRPCardDetailsItemProps } from '@igrp/igrp-framework-react-design-system';
```

## Purpose

Card displaying labeled detail items in a grid. Optional copy-to-clipboard per item.

## IGRPCardDetailsProps

| Prop | Type | Description |
|------|------|-------------|
| `title` | `string` | Card title |
| `description` | `string` | Card description |
| `items` | `IGRPCardDetailsItemProps[]` | Detail items |
| `contentClassName` | `string` | CSS for content grid |

## IGRPCardDetailsItemProps

| Prop | Type | Description |
|------|------|-------------|
| `label` | `string` | Field label |
| `content` | `ReactNode` | Field content |
| `showCopyTo` | `boolean` | Show copy button |

## Example

```tsx
<IGRPCardDetails
  title="User Details"
  description="Profile information"
  items={[
    { label: 'Name', content: user.name },
    { label: 'Email', content: user.email, showCopyTo: true },
    { label: 'Role', content: user.role },
  ]}
/>
```
