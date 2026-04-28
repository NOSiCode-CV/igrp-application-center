# IGRPCard API Reference

## Import

```tsx
import {
  IGRPCard,
  IGRPCardHeader,
  IGRPCardTitle,
  IGRPCardDescription,
  IGRPCardAction,
  IGRPCardContent,
  IGRPCardFooter,
} from '@igrp/igrp-framework-react-design-system';
```

## Components

| Component | Purpose |
|-----------|---------|
| `IGRPCard` | Root container |
| `IGRPCardHeader` | Header section |
| `IGRPCardTitle` | Title text |
| `IGRPCardDescription` | Subtitle/description |
| `IGRPCardAction` | Action slot (e.g. menu button) |
| `IGRPCardContent` | Main content |
| `IGRPCardFooter` | Footer with actions |

## IGRPCard Props

Extends primitive Card. Supports `className`, `id`, `name`.

## Example: Form in Card

```tsx
<IGRPCard>
  <IGRPCardHeader>
    <IGRPCardTitle>Edit User</IGRPCardTitle>
  </IGRPCardHeader>
  <IGRPCardContent>
    <IGRPForm schema={schema} formRef={formRef} onSubmit={onSubmit}>
      {/* fields */}
    </IGRPForm>
  </IGRPCardContent>
  <IGRPCardFooter>
    <IGRPButton type="submit">Save</IGRPButton>
    <IGRPButton variant="outline">Cancel</IGRPButton>
  </IGRPCardFooter>
</IGRPCard>
```
