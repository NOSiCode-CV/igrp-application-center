# IGRP Template

**AI agents:** Cursor may not preload this file. For substantive work, **read `./AGENTS.md` in full** (and the SKILL.md files below) via file tools—see `.cursor/rules/project-context.mdc`.

Next.js app template using the **published** design system `@igrp/igrp-framework-react-design-system`.

Project skills live in **`./skills/`** in this repo. Use the real folder tree—do not assume paths outside the project.

## Stack order (what applies when)

1. **Next.js / React app quality** — Read **`./skills/react-best-practices/SKILL.md`** when writing, reviewing, or refactoring app code (data fetching, RSC/client boundaries, bundle size, re-renders, performance).
2. **UI / UX / accessibility reviews** — Use **`./skills/web-design-guidelines/SKILL.md`** when auditing or reviewing interfaces (follow that skill’s workflow, e.g. checklist source and output format).
3. **Composition / architecture** — Read **`./skills/composition-patterns/SKILL.md`** when refactoring boolean-heavy APIs, compound components, context-heavy UI, or flexible component structure.
4. **Product UI implementation** — **`@igrp/igrp-framework-react-design-system` first** for any interface: forms, tables, modals, buttons, layout primitives, etc. Do not default to ad-hoc HTML/CSS or other UI kits unless the user opts out.

## Primary rule: IGRP for UI

When building or changing UI:

1. **Use the design system as the first and default option.** Do not create components from scratch or suggest other UI libraries.
2. **Import from** `@igrp/igrp-framework-react-design-system`.
3. **Prefer Horizon components** (e.g. `IGRPButton`, `IGRPInputText`, `IGRPCard`, `IGRPForm`, `IGRPDataTable`) unless you are composing behavior that the design system does not cover.
4. **Read `DESIGN_SYSTEM.md`** for the component catalog, types, and usage patterns.
5. **Read `./skills/igrp-design-system/SKILL.md`** before substantial UI work. Use its selection table, rules, and links to `./skills/igrp-design-system/components/` **on demand**—do not load the entire `skills/` tree for every task.

## `./skills/` quick map

| Path | Use when |
| ------ | ---------- |
| `./skills/react-best-practices/SKILL.md` | Next.js / React performance and data patterns |
| `./skills/web-design-guidelines/SKILL.md` | UI / UX / a11y audits and guideline checks |
| `./skills/composition-patterns/SKILL.md` | Component API and composition refactors |
| `./skills/igrp-design-system/SKILL.md` | Implementing product UI with Horizon / IGRP |

## Context

- The design system is a **published npm package** (see `package.json`). There is no local `packages/design-system` folder.
- All UI should use design system components unless the user explicitly requests otherwise.
