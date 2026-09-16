# Product

## Register

product

## Users

**Primary: government staff launching applications.** They sign in to find and
open the applications their role and department grant them, and then they leave.
Most are occasional users — they are passing *through* this product on the way to
the one they actually came to work in. They are not power users of this screen and
should never need to learn it.

**Secondary: a small number of administrators.** They manage users, roles,
departments, menus and permissions under `/settings`. They use the product far
more often than staff do, but they are the minority audience and their needs do
not get to shape the launcher.

Context of use: a work machine, during the working day, usually with a specific
application already in mind. The job to be done is *"open the thing I need"* —
browsing is the fallback, not the goal.

## Product Purpose

The IGRP Applications Center is the single front door to the IGRP platform: it is
where access is exercised (staff opening apps) and where access is administered
(admins granting and revoking it).

Success looks like:

- A member of staff finds and opens the right application in seconds, without
  asking a colleague or the service desk.
- A user who *cannot* see an application understands why, and knows who to ask.
- An administrator can grant or revoke access without raising a ticket.

Failure looks like: the service desk receiving "I can't find X" or "is the system
broken?" — questions the interface should have answered.

## Brand Personality

**Institutional, calm, trustworthy.**

The interface should be unremarkable in use. Confidence comes from predictability,
not from personality: the same control behaves the same way everywhere, nothing
moves unless it is reporting a change, and the product never asks for attention it
has not earned.

Voice: plain European Portuguese (pt-PT), direct and specific. State what is true
and what to do about it. No jargon, no cheer, no exclamation marks, no apologising.
An error message names what failed and offers the action that recovers it.

## Anti-references

- **Consumer app playfulness.** No emoji, mascots, bouncy or elastic motion,
  confetti, or chatty microcopy. This is a system of record for public servants.
- **Over-designed marketing UI.** No display type, glassmorphism, gradient heroes,
  or scroll-triggered reveals. Visual ambition that competes with the task is a
  defect here, not a flourish.

Explicitly **not** anti-references: a conventional admin dashboard, or the dense
tabular density of a civic service tool. Familiarity is a feature in this register —
staff should recognise how it works without being taught.

## Design Principles

1. **The tool disappears into the task.** Chrome earns its space or it goes. If an
   element does not help someone open an application or administer access, it is a
   candidate for deletion, not for redesign.
2. **Say the true thing.** A failed request is not an empty state. An unknown count
   is not zero. A label that promises ranking must rank. The interface never states
   something it does not know.
3. **One vocabulary.** Reach for the design system before writing a control. A
   button that looks different in two places means one of them is wrong — and it
   will drift further at the next system update.
4. **Accessible by contract.** AA is a merge gate, not an aspiration (see below).
   State is never carried by colour alone, and every interactive element has a
   focus state you can see.
5. **One language per surface.** Portuguese (pt-PT) throughout, including strings
   generated in code — relative dates, greetings, status labels.

## Accessibility & Inclusion

**WCAG 2.1 AA, contractual.** Public-sector procurement requires it and it may be
audited; AA failures are bugs that block merge, not backlog items.

Working rules that follow from it:

- Text contrast ≥ 4.5:1 (≥ 3:1 for large text and non-text indicators), measured
  against the surface it actually sits on. `--ring` is a focus-ring colour, not an
  ink colour.
- Every interactive element has a visible focus state. `outline-none` without a
  `focus-visible:` replacement is a defect.
- State is never conveyed by colour alone — pair it with a glyph, a label, or
  screen-reader-only text. `title` is mouse-only and does not count.
- Reduced motion is honoured; any animation has a `prefers-reduced-motion`
  alternative.
- Hit targets on touch-reachable controls are ~44px, including via padding or an
  overlay when the glyph itself must stay small.
