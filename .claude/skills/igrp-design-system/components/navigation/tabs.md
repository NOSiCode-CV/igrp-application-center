# IGRPTabs

## Import

```tsx
import { IGRPTabs, type IGRPTabsProps, type IGRPTabItem } from '@igrp/igrp-framework-react-design-system';
```

## IGRPTabItem

`{ id: string; label: string; content: ReactNode }`

## Example

```tsx
<IGRPTabs
  tabs={[
    { id: 'overview', label: 'Overview', content: <Overview /> },
    { id: 'details', label: 'Details', content: <Details /> },
  ]}
/>
```
