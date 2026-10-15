# IGRPForm / Horizon inputs — integration feedback from `@igrp/applications-center`

| | |
| --- | --- |
| Package | `@igrp/igrp-framework-react-design-system` **0.2.0-beta.3** |
| Consumer | `@igrp/applications-center` (Next.js 15, React 19) |
| Peer versions | `react-hook-form` 7.89.0 · `@hookform/resolvers` 5.9.1 · `zod` 4.6.5 |
| Date | 2026-10-13 |
| Reporter | Fidel da Luz |

## Context

We are trying to move our feature forms from the raw primitives
(`Form` / `FormField` / `FormItem` / `Input` / `Select`) to the Horizon layer
(`IGRPForm`, `IGRPFormField`, `IGRPInputText`, `IGRPSelect`, `IGRPCombobox`), as
our working agreement recommends. The first candidate was the application
create/edit form
(`igrp-application-center/src/features/applications/components/app-form.tsx`),
which is a
typical CRUD form: two text fields, one conditional text field (slug or URL
depending on a select), a select with a side effect, a textarea with a counter,
and a status select that only renders in edit mode.

The Horizon inputs can already be dropped into a primitive `Form` because they
read `useFormContext()` themselves. That part works well. Moving the wrapper to
`IGRPForm`, however, hit the issues below. None of them is a crash; they are
API gaps that force consumers to either keep the primitive `Form` or work around
the component.

All package file references are full paths into the installed build of
0.2.0-beta.3, as seen from the consumer:

- `node_modules/@igrp/igrp-framework-react-design-system/dist/components/horizon/form/index.js` (+ `.d.ts`)
- `node_modules/@igrp/igrp-framework-react-design-system/dist/components/horizon/form/form-field.d.ts`
- `node_modules/@igrp/igrp-framework-react-design-system/dist/components/horizon/form/form-context.d.ts`
- `node_modules/@igrp/igrp-framework-react-design-system/dist/components/horizon/input/text.js` (+ `.d.ts`)
- `node_modules/@igrp/igrp-framework-react-design-system/dist/components/horizon/input/combobox.js`
- `node_modules/@igrp/igrp-framework-react-design-system/dist/components/horizon/input/select.js`
- `node_modules/@igrp/igrp-framework-react-design-system/dist/types.d.ts`

## Summary

| # | Component | Issue | Impact |
| --- | --- | --- | --- |
| 1 | `IGRPForm` | `formRef.current` is `null` during the first render (assigned in an effect) | `watch`, `setValue`, `formState` unusable in the parent's render |
| 2 | `IGRPForm` | No `reValidateMode` prop | Cannot do `mode: "onBlur"` + `reValidateMode: "onChange"` |
| 3 | `IGRPForm` | Thrown `onSubmit` always renders the inline error banner and calls `console.error` | Consumers that report errors via toast cannot opt out |
| 4 | `IGRPInputText` | `...props` is spread **after** `onChange: field.onChange` | A caller `onChange` silently disconnects the field from the form |
| 5 | `IGRPInputText` | `type` is typed as `"text" \| "email" \| "number"` | `type="url"`, `"tel"`, `"password"`, `"search"` do not typecheck |
| 6 | `IGRPFormField` | `control` is required, typed as `Control<FieldValues>` | Redundant inside `IGRPForm`; forces a cast from typed forms |

Items 1 and 4 are the ones that block adoption on real forms. The rest are
quality-of-life.

## 1. `formRef` is populated in an effect, so it is `null` on first render

`node_modules/@igrp/igrp-framework-react-design-system/dist/components/horizon/form/index.js`
assigns the handle inside `useEffect`:

```js
useEffect(() => {
  const handle = { ...form, submit, reset, setGlobalError, clearGlobalError, isSubmitting };
  if (formRef) formRef.current = handle;
  internalFormRef.current = handle;
}, [form, submitForm, setGlobalError, clearGlobalError, isSubmitting, formRef]);
```

Any parent that needs form state during render cannot get it from the ref:

```tsx
const formRef = useRef<IGRPFormHandle<typeof schema>>(null);
const type = formRef.current?.watch("type"); // undefined on first render, and not reactive afterwards

return (
  <IGRPForm schema={schema} formRef={formRef} onSubmit={save}>
    {type === "INTERNAL" && <IGRPInputText name="slug" />}
  </IGRPForm>
);
```

Our form needs `watch("type")` to choose between the slug and URL fields, and
`watch("status")` to add a legacy option to the status select. The workaround
is to move every such read into a child component that calls
`useIGRPFormContext().form.watch(...)`. That works but splits one small form
into two components for no reason the consumer can see.

**Suggestion:** accept a render-prop child, `children: ReactNode | ((form) => ReactNode)`,
or export a `useIGRPWatch(name)` helper and document that `formRef` is only
meant for imperative calls (`submit`, `reset`). The `IGRPFormHandle` type
currently extends the full `UseFormReturn`, which suggests it is safe to use
for reads.

## 2. No `reValidateMode`

In `node_modules/@igrp/igrp-framework-react-design-system/dist/components/horizon/form/index.js`,
`useForm` is called with `{ resolver, defaultValues, mode }` only. A very
common configuration is to validate on blur the first time, then re-validate
on every change once a field has an error:

```ts
useForm({ mode: "onBlur", reValidateMode: "onChange" });
```

`IGRPFormProps` only exposes `validationMode`. Consumers that need the second
knob have to keep their own `useForm`.

**Suggestion:** add `reValidationMode?: "onChange" | "onBlur" | "onSubmit"`
and pass it through. Optionally also `criteriaMode`, `shouldFocusError`, and
`delayError`, or a single `formOptions?: Partial<UseFormProps>` escape hatch.

## 3. Submission errors always render the inline banner

In `handleSubmit` of
`node_modules/@igrp/igrp-framework-react-design-system/dist/components/horizon/form/index.js`,
a thrown `onSubmit` does:

```js
console.error("Form submission failed:", err);
setGlobalError(errorMessage);   // always
if (showToastOnError) toast.error(...);
onError?.(err);
```

`showToastOnError` controls the toast, but there is no way to suppress the
`setGlobalError` banner or the `console.error`. Our forms report API failures
through `useIGRPToast` with a feature-specific title and description, so with
`IGRPForm` the user gets both the toast and a red box inside the dialog with the
raw error message. The alternative is to catch inside `onSubmit` and never
throw, which also disables `onError`.

**Suggestion:** a `showInlineError?: boolean` (default `true`) prop, or treat a
non-`undefined` return from `onError` as "handled" and skip the banner.

## 4. `IGRPInputText`: caller `onChange` replaces the form binding

`node_modules/@igrp/igrp-framework-react-design-system/dist/components/horizon/input/text.js`
renders the control as:

```js
<Input
  name={fieldName}
  value={field.value ?? ""}
  onChange={field.onChange}
  onBlur={field.onBlur}
  {...props}
/>
```

Because `...props` comes last, a consumer that passes `onChange` to transform
input (uppercase a code, strip characters, mask a phone number) overwrites
`field.onChange`. The input still renders, still shows the typed value for one
keystroke, and then snaps back because react-hook-form never received the
change. Nothing warns about this.

```tsx
<IGRPInputText
  name="code"
  onChange={(e) => e.target.value.toUpperCase()} // form value never updates
/>
```

This is the single most surprising behaviour we hit. The same spread order
exists on the fallback (non-form) branch, where it is harmless.

**Suggestion:** compose instead of overwrite:

```js
onChange={(e) => { field.onChange(e); props.onChange?.(e); }}
onBlur={(e) => { field.onBlur(); props.onBlur?.(e); }}
```

and spread `...rest` (without `onChange`/`onBlur`) before the bound handlers.
`IGRPCombobox` and `IGRPSelect` already do this correctly (`field.onChange(v);
onChange?.(v)`), so this would bring `IGRPInputText` in line with them. A
`transform?: (value: string) => string` prop would cover the uppercase/mask
case even more directly.

## 5. `IGRPInputText` `type` union is too narrow

`node_modules/@igrp/igrp-framework-react-design-system/dist/components/horizon/input/text.d.ts`:

```ts
interface IGRPInputTextProps extends IGRPInputProps {
  type?: "text" | "email" | "number";
}
```

`IGRPInputProps` already omits `type` from `ComponentProps<"input">`, so there
is no way to pass `type="url"`, `"tel"`, `"password"` or `"search"` without a
cast. We have URL fields on applications and OAuth clients, and the native
`type="url"` keyboard and autofill behaviour matters on mobile.

**Suggestion:** widen to `React.HTMLInputTypeAttribute` minus the ones that
have dedicated components (`checkbox`, `radio`, `file`, `date`...), or at
least add `url`, `tel`, `password`, `search`.

## 6. `IGRPFormField` requires an untyped `control`

`node_modules/@igrp/igrp-framework-react-design-system/dist/components/horizon/form/form-field.d.ts`:

```ts
control: Control<FieldValues, unknown, FieldValues>;
```

Inside `IGRPForm` the control is already available from context, and the
Horizon inputs pick it up without being told. `IGRPFormField` still demands it
as a required prop, and because it is typed as `Control<FieldValues>` a
consumer with `useForm<MyValues>()` has to cast. Making it optional and falling
back to `useFormContext().control` would match how the inputs behave.

## What works and is appreciated

- `IGRPInputText`, `IGRPSelect`, `IGRPCombobox` auto-wire to any
  react-hook-form context, so a partial migration (keep primitive `Form`, swap
  fields) is possible today. That is the path we are taking for now.
- `IGRPSelect.onValueChange` and `IGRPCombobox.onChange` fire **after**
  `field.onChange`, which is exactly what side effects like "clear the URL when
  the type changes to internal" need.
- `resetKey` on `IGRPForm` is a nice touch for edit dialogs.

## Reproduction

A minimal form showing items 1, 4 and 5 together:

```tsx
const schema = z.object({
  code: z.string().min(1),
  type: z.enum(["INTERNAL", "EXTERNAL"]),
  url: z.string().url().optional(),
});

export function Repro() {
  const formRef = useRef<IGRPFormHandle<typeof schema> | null>(null);
  const type = formRef.current?.watch("type"); // (1) undefined on first render

  return (
    <IGRPForm
      schema={schema}
      formRef={formRef}
      onSubmit={console.log}
      defaultValues={{ code: "", type: "INTERNAL" }}
    >
      <IGRPInputText
        name="code"
        onChange={(e) => e.target.value.toUpperCase()} // (4) form value never updates
      />
      <IGRPSelect
        name="type"
        options={[
          { value: "INTERNAL", label: "Internal" },
          { value: "EXTERNAL", label: "External" },
        ]}
      />
      {type === "EXTERNAL" && (
        <IGRPInputText name="url" type="url" /> // (5) TS2322
      )}
    </IGRPForm>
  );
}
```
