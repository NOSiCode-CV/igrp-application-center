# IGRPInputNumber API Reference

## Import

```tsx
import { IGRPInputNumber, type IGRPInputNumberProps } from '@igrp/igrp-framework-react-design-system';
```

## IGRPInputNumberProps

Extends `IGRPInputProps`. Key props: `name`, `label`, `helperText`, `required`, `error`, `min`, `max`, `step`, `placeholder`.

## Example

```tsx
<IGRPInputNumber name="quantity" label="Quantity" min={0} max={100} step={1} />
```
