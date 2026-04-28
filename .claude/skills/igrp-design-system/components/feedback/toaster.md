# IGRPToaster, useIGRPToast

## Setup

Add `<IGRPToaster />` to your root layout.

## Usage

The `useIGRPToast` hook returns an object containing the `igrpToast` function.

```tsx
const { igrpToast } = useIGRPToast();

igrpToast({
  type: 'success',
  title: 'Success',
  description: 'Saved successfully',
});
```

###  Restricted Types

Do **NOT** use `destructive` as a type. These are invalid in `IGRPToastKind`.

**Valid Types:**
- `success`
- `error`
- `warning`
- `info`
- `loading`
- `default`

###  Incorrect Usage

Never use method calls like `.success()` or `.error()` on the toast object. Also, do **NOT** use the `message` property; use `title` and `description` instead.

```tsx
// ❌ Incorrect
toast.success('...');
igrpToast({ type: 'success', message: '...' });

// ✅ Correct
igrpToast({ type: 'success', title: 'Success', description: '...' });
```
